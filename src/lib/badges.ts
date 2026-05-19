import type { Badge, BadgeId, Habit, Checkin } from "@/types";
import { calculateStats, isHabitScheduledOn } from "./stats";
import { addDaysToKey, todayKey } from "./utils";

export const BADGES: Badge[] = [
  {
    id: "first-checkin",
    name: "万里长征第一步",
    description: "完成第一次打卡",
    icon: "🌱",
    color: "#10b981",
    category: "total",
  },
  {
    id: "streak-3",
    name: "三日坚持",
    description: "连续打卡 3 天",
    icon: "🔥",
    color: "#f97316",
    category: "streak",
  },
  {
    id: "streak-7",
    name: "一周不辍",
    description: "连续打卡 7 天",
    icon: "🔥",
    color: "#f59e0b",
    category: "streak",
  },
  {
    id: "streak-21",
    name: "21天养成",
    description: "连续打卡 21 天",
    icon: "🌟",
    color: "#eab308",
    category: "streak",
  },
  {
    id: "streak-66",
    name: "66天自动化",
    description: "连续打卡 66 天，习惯已成自然",
    icon: "💎",
    color: "#06b6d4",
    category: "streak",
  },
  {
    id: "streak-100",
    name: "百日筑基",
    description: "连续打卡 100 天",
    icon: "👑",
    color: "#a855f7",
    category: "streak",
  },
  {
    id: "total-10",
    name: "初露锋芒",
    description: "累计打卡 10 次",
    icon: "✨",
    color: "#0ea5e9",
    category: "total",
  },
  {
    id: "total-50",
    name: "渐入佳境",
    description: "累计打卡 50 次",
    icon: "🎯",
    color: "#3b82f6",
    category: "total",
  },
  {
    id: "total-100",
    name: "百次达成",
    description: "累计打卡 100 次",
    icon: "🏆",
    color: "#8b5cf6",
    category: "total",
  },
  {
    id: "total-365",
    name: "一年之约",
    description: "累计打卡 365 次",
    icon: "🎖️",
    color: "#ec4899",
    category: "total",
  },
  {
    id: "habit-3",
    name: "多线作战",
    description: "同时培养 3 个习惯",
    icon: "🎪",
    color: "#14b8a6",
    category: "habit",
  },
  {
    id: "habit-5",
    name: "全面发展",
    description: "同时培养 5 个习惯",
    icon: "🌈",
    color: "#f43f5e",
    category: "habit",
  },
  {
    id: "perfect-week",
    name: "完美一周",
    description: "一周内所有计划全部完成",
    icon: "⭐",
    color: "#fbbf24",
    category: "perfect",
  },
  {
    id: "perfect-month",
    name: "完美一月",
    description: "一个月内所有计划全部完成",
    icon: "🌕",
    color: "#f59e0b",
    category: "perfect",
  },
  {
    id: "challenge-21",
    name: "21天挑战成功",
    description: "完成 21 天挑战",
    icon: "🥉",
    color: "#a78bfa",
    category: "challenge",
  },
  {
    id: "challenge-66",
    name: "66天挑战成功",
    description: "完成 66 天挑战",
    icon: "🥈",
    color: "#60a5fa",
    category: "challenge",
  },
  {
    id: "challenge-100",
    name: "100天挑战成功",
    description: "完成 100 天挑战",
    icon: "🥇",
    color: "#fbbf24",
    category: "challenge",
  },
];

export function getBadge(id: BadgeId): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

export function calculateEarnedBadges(
  habits: Habit[],
  checkins: Checkin[]
): Set<BadgeId> {
  const earned = new Set<BadgeId>();

  if (checkins.length === 0) return earned;

  earned.add("first-checkin");

  const total = checkins.length;
  if (total >= 10) earned.add("total-10");
  if (total >= 50) earned.add("total-50");
  if (total >= 100) earned.add("total-100");
  if (total >= 365) earned.add("total-365");

  if (habits.length >= 3) earned.add("habit-3");
  if (habits.length >= 5) earned.add("habit-5");

  let maxStreak = 0;
  for (const habit of habits) {
    const hCheckins = checkins.filter((c) => c.habitId === habit.id);
    const stats = calculateStats(habit, hCheckins);
    if (stats.longestStreak > maxStreak) maxStreak = stats.longestStreak;

    if (habit.challenge && habit.challenge.type !== "none") {
      const startDate = habit.challenge.startDate;
      const targetDays = habit.challenge.targetDays;
      const challengeCheckins = hCheckins.filter((c) => c.date >= startDate);
      const uniqueDates = new Set(challengeCheckins.map((c) => c.date));
      if (uniqueDates.size >= targetDays) {
        if (targetDays === 21) earned.add("challenge-21");
        if (targetDays === 66) earned.add("challenge-66");
        if (targetDays === 100) earned.add("challenge-100");
      }
    }
  }
  if (maxStreak >= 3) earned.add("streak-3");
  if (maxStreak >= 7) earned.add("streak-7");
  if (maxStreak >= 21) earned.add("streak-21");
  if (maxStreak >= 66) earned.add("streak-66");
  if (maxStreak >= 100) earned.add("streak-100");

  if (isPerfectPeriod(habits, checkins, 7)) earned.add("perfect-week");
  if (isPerfectPeriod(habits, checkins, 30)) earned.add("perfect-month");

  return earned;
}

function isPerfectPeriod(
  habits: Habit[],
  checkins: Checkin[],
  days: number
): boolean {
  if (habits.length === 0) return false;
  const today = todayKey();
  const checkinSet = new Set(checkins.map((c) => `${c.habitId}|${c.date}`));

  let hasAnyScheduled = false;
  for (let i = 0; i < days; i++) {
    const date = addDaysToKey(today, -i);
    for (const habit of habits) {
      if (isHabitScheduledOn(habit, date)) {
        hasAnyScheduled = true;
        if (!checkinSet.has(`${habit.id}|${date}`)) return false;
      }
    }
  }
  return hasAnyScheduled;
}
