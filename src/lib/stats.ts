import type { Checkin, Habit, HabitStats } from "@/types";
import { addDaysToKey, todayKey, getWeekday } from "./utils";

function isScheduledOn(habit: Habit, dateKey: string): boolean {
  const { frequency } = habit;
  if (frequency.type === "daily") return true;
  if (frequency.type === "custom" && frequency.daysOfWeek) {
    return frequency.daysOfWeek.includes(getWeekday(dateKey));
  }
  return true;
}

export function calculateStats(habit: Habit, checkins: Checkin[]): HabitStats {
  const checkinDates = new Set(checkins.map((c) => c.date));
  const today = todayKey();

  let currentStreak = 0;
  let cursor = today;
  if (!checkinDates.has(cursor)) {
    cursor = addDaysToKey(cursor, -1);
  }
  while (true) {
    if (isScheduledOn(habit, cursor)) {
      if (checkinDates.has(cursor)) {
        currentStreak++;
      } else {
        break;
      }
    }
    cursor = addDaysToKey(cursor, -1);
    if (currentStreak === 0 && cursor < (habit.createdAt ? toDateKey(habit.createdAt) : "1970-01-01")) {
      break;
    }
    if (currentStreak > 0 && cursor < (habit.createdAt ? toDateKey(habit.createdAt) : "1970-01-01")) {
      break;
    }
  }

  const sortedDates = Array.from(checkinDates).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: string | null = null;
  for (const date of sortedDates) {
    if (prevDate && addDaysToKey(prevDate, 1) === date) {
      runningStreak++;
    } else {
      runningStreak = 1;
    }
    if (runningStreak > longestStreak) longestStreak = runningStreak;
    prevDate = date;
  }

  const completionRate7d = computeRate(habit, checkinDates, 7);
  const completionRate30d = computeRate(habit, checkinDates, 30);
  const completionRateAll = computeRateAll(habit, checkinDates);

  return {
    currentStreak,
    longestStreak,
    totalCheckins: checkins.length,
    completionRate7d,
    completionRate30d,
    completionRateAll,
  };
}

function toDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeRate(
  habit: Habit,
  checkinDates: Set<string>,
  days: number
): number {
  const today = todayKey();
  let scheduled = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const date = addDaysToKey(today, -i);
    if (isScheduledOn(habit, date)) {
      scheduled++;
      if (checkinDates.has(date)) done++;
    }
  }
  return scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
}

function computeRateAll(habit: Habit, checkinDates: Set<string>): number {
  const start = toDateKey(habit.createdAt);
  const today = todayKey();
  let scheduled = 0;
  let done = 0;
  let cursor = start;
  while (cursor <= today) {
    if (isScheduledOn(habit, cursor)) {
      scheduled++;
      if (checkinDates.has(cursor)) done++;
    }
    cursor = addDaysToKey(cursor, 1);
  }
  return scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
}

export function isHabitScheduledToday(habit: Habit): boolean {
  return isScheduledOn(habit, todayKey());
}

export function isHabitScheduledOn(habit: Habit, dateKey: string): boolean {
  return isScheduledOn(habit, dateKey);
}
