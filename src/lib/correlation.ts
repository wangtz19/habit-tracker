import type { Habit, Checkin } from "@/types";
import { addDaysToKey, todayKey } from "./utils";
import { isHabitScheduledOn } from "./stats";

export const MIN_DAYS_FOR_INSIGHTS = 14;

export interface DataAvailability {
  totalDays: number;
  enoughData: boolean;
  minRequired: number;
}

export function checkDataAvailability(
  habits: Habit[],
  checkins: Checkin[]
): DataAvailability {
  if (habits.length === 0 || checkins.length === 0) {
    return { totalDays: 0, enoughData: false, minRequired: MIN_DAYS_FOR_INSIGHTS };
  }

  const firstCreated = Math.min(...habits.map((h) => h.createdAt));
  const firstDate = new Date(firstCreated);
  const today = new Date();
  const totalDays =
    Math.floor((today.getTime() - firstDate.getTime()) / 86400000) + 1;

  return {
    totalDays,
    enoughData: totalDays >= MIN_DAYS_FOR_INSIGHTS,
    minRequired: MIN_DAYS_FOR_INSIGHTS,
  };
}

export interface HabitPairCorrelation {
  habitA: Habit;
  habitB: Habit;
  coefficient: number;
  bothCount: number;
  totalDays: number;
  description: string;
}

export interface MoodCorrelation {
  habit: Habit;
  avgMoodOnComplete: number;
  avgMoodOnSkip: number;
  diff: number;
  sampleSize: number;
  description: string;
}

export interface BestTimeInsight {
  habit: Habit;
  bestWeekday: number;
  bestWeekdayRate: number;
  worstWeekday: number;
  worstWeekdayRate: number;
}

export interface InsightsResult {
  pairCorrelations: HabitPairCorrelation[];
  moodCorrelations: MoodCorrelation[];
  bestTimes: BestTimeInsight[];
  generatedAt: number;
}

function buildDayMatrix(
  habits: Habit[],
  checkins: Checkin[],
  windowDays: number
): { dates: string[]; matrix: number[][] } {
  const today = todayKey();
  const dates: string[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    dates.push(addDaysToKey(today, -i));
  }
  const checkinSet = new Set(checkins.map((c) => `${c.habitId}|${c.date}`));
  const matrix = habits.map((h) =>
    dates.map((d) => (checkinSet.has(`${h.id}|${d}`) ? 1 : 0))
  );
  return { dates, matrix };
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return num / den;
}

function correlationDescription(
  habitA: Habit,
  habitB: Habit,
  coef: number
): string {
  const abs = Math.abs(coef);
  if (coef > 0) {
    if (abs >= 0.7) return `${habitA.name}与${habitB.name}强烈一起出现`;
    if (abs >= 0.4) return `${habitA.name}的日子也常完成${habitB.name}`;
    return `${habitA.name}与${habitB.name}有轻微正相关`;
  }
  if (coef < 0) {
    if (abs >= 0.7) return `${habitA.name}与${habitB.name}很少同时完成`;
    if (abs >= 0.4) return `${habitA.name}时较少完成${habitB.name}`;
    return `${habitA.name}与${habitB.name}有轻微负相关`;
  }
  return `${habitA.name}与${habitB.name}没有明显关联`;
}

export function calculatePairCorrelations(
  habits: Habit[],
  checkins: Checkin[],
  windowDays = 60
): HabitPairCorrelation[] {
  if (habits.length < 2) return [];

  const { dates, matrix } = buildDayMatrix(habits, checkins, windowDays);

  const results: HabitPairCorrelation[] = [];
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const xs = matrix[i];
      const ys = matrix[j];
      const xSum = xs.reduce((a, b) => a + b, 0);
      const ySum = ys.reduce((a, b) => a + b, 0);
      if (xSum < 3 || ySum < 3) continue;

      const coef = pearson(xs, ys);
      if (Math.abs(coef) < 0.2) continue;

      let bothCount = 0;
      for (let k = 0; k < dates.length; k++) {
        if (xs[k] && ys[k]) bothCount++;
      }

      results.push({
        habitA: habits[i],
        habitB: habits[j],
        coefficient: Math.round(coef * 100) / 100,
        bothCount,
        totalDays: dates.length,
        description: correlationDescription(habits[i], habits[j], coef),
      });
    }
  }

  results.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  return results.slice(0, 8);
}

export function calculateMoodCorrelations(
  habits: Habit[],
  checkins: Checkin[]
): MoodCorrelation[] {
  const moodCheckins = checkins.filter((c) => typeof c.mood === "number");
  if (moodCheckins.length < 5) return [];

  const dateMoodAvg = new Map<string, { sum: number; count: number }>();
  for (const c of moodCheckins) {
    const cur = dateMoodAvg.get(c.date) ?? { sum: 0, count: 0 };
    cur.sum += c.mood as number;
    cur.count += 1;
    dateMoodAvg.set(c.date, cur);
  }

  const datesWithMood = Array.from(dateMoodAvg.keys());
  const checkinSet = new Set(checkins.map((c) => `${c.habitId}|${c.date}`));

  const results: MoodCorrelation[] = [];

  for (const habit of habits) {
    let completeSum = 0;
    let completeCount = 0;
    let skipSum = 0;
    let skipCount = 0;

    for (const date of datesWithMood) {
      const moodAvg =
        dateMoodAvg.get(date)!.sum / dateMoodAvg.get(date)!.count;
      const done = checkinSet.has(`${habit.id}|${date}`);
      if (done) {
        completeSum += moodAvg;
        completeCount++;
      } else {
        skipSum += moodAvg;
        skipCount++;
      }
    }

    if (completeCount < 3 || skipCount < 3) continue;

    const avgComplete = completeSum / completeCount;
    const avgSkip = skipSum / skipCount;
    const diff = Math.round((avgComplete - avgSkip) * 100) / 100;

    if (Math.abs(diff) < 0.3) continue;

    const description =
      diff > 0
        ? `完成${habit.name}的日子，平均心情高 ${diff.toFixed(1)} 分`
        : `跳过${habit.name}的日子，平均心情高 ${Math.abs(diff).toFixed(1)} 分`;

    results.push({
      habit,
      avgMoodOnComplete: Math.round(avgComplete * 100) / 100,
      avgMoodOnSkip: Math.round(avgSkip * 100) / 100,
      diff,
      sampleSize: completeCount + skipCount,
      description,
    });
  }

  results.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  return results;
}

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

export function getWeekdayName(idx: number): string {
  return `星期${WEEKDAY_NAMES[idx]}`;
}

export function calculateBestTimes(
  habits: Habit[],
  checkins: Checkin[]
): BestTimeInsight[] {
  const checkinSet = new Set(checkins.map((c) => `${c.habitId}|${c.date}`));
  const today = todayKey();
  const windowDays = 60;
  const results: BestTimeInsight[] = [];

  for (const habit of habits) {
    const dayStats: Array<{ scheduled: number; done: number }> = Array.from(
      { length: 7 },
      () => ({ scheduled: 0, done: 0 })
    );

    for (let i = 0; i < windowDays; i++) {
      const date = addDaysToKey(today, -i);
      if (!isHabitScheduledOn(habit, date)) continue;
      const weekday = new Date(date).getDay();
      dayStats[weekday].scheduled++;
      if (checkinSet.has(`${habit.id}|${date}`)) {
        dayStats[weekday].done++;
      }
    }

    const rates = dayStats.map((s, idx) => ({
      idx,
      rate: s.scheduled === 0 ? -1 : s.done / s.scheduled,
      scheduled: s.scheduled,
    }));

    const valid = rates.filter((r) => r.scheduled >= 2);
    if (valid.length < 3) continue;

    valid.sort((a, b) => b.rate - a.rate);
    const best = valid[0];
    const worst = valid[valid.length - 1];

    if (best.rate - worst.rate < 0.2) continue;

    results.push({
      habit,
      bestWeekday: best.idx,
      bestWeekdayRate: Math.round(best.rate * 100),
      worstWeekday: worst.idx,
      worstWeekdayRate: Math.round(worst.rate * 100),
    });
  }

  return results.slice(0, 5);
}

export function generateInsights(
  habits: Habit[],
  checkins: Checkin[]
): InsightsResult {
  return {
    pairCorrelations: calculatePairCorrelations(habits, checkins),
    moodCorrelations: calculateMoodCorrelations(habits, checkins),
    bestTimes: calculateBestTimes(habits, checkins),
    generatedAt: Date.now(),
  };
}
