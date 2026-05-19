import type { Habit, Checkin } from "@/types";
import { daysBetween, todayKey } from "./utils";

export interface ChallengeProgress {
  active: boolean;
  daysCompleted: number;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  completionRate: number;
  succeeded: boolean;
  failed: boolean;
}

export function getChallengeProgress(
  habit: Habit,
  checkins: Checkin[]
): ChallengeProgress | null {
  if (!habit.challenge || habit.challenge.type === "none") return null;

  const { startDate, targetDays } = habit.challenge;
  const today = todayKey();
  const elapsed = Math.max(0, daysBetween(startDate, today) + 1);
  const habitCheckins = checkins.filter(
    (c) => c.habitId === habit.id && c.date >= startDate
  );
  const uniqueDates = new Set(habitCheckins.map((c) => c.date));
  const daysCompleted = uniqueDates.size;

  return {
    active: true,
    daysCompleted,
    daysTotal: targetDays,
    daysElapsed: Math.min(elapsed, targetDays),
    daysRemaining: Math.max(0, targetDays - daysCompleted),
    completionRate: Math.round((daysCompleted / targetDays) * 100),
    succeeded: daysCompleted >= targetDays,
    failed: false,
  };
}
