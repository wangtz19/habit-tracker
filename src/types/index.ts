export type HabitFrequencyType = "daily" | "weekly" | "custom";

export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek?: number[];
  timesPerWeek?: number;
}

export type HabitCategory =
  | "health"
  | "learning"
  | "mindfulness"
  | "work"
  | "social"
  | "creativity"
  | "lifestyle"
  | "other";

export type ChallengeType = "none" | "21" | "66" | "100" | "custom";

export interface HabitChallenge {
  type: ChallengeType;
  targetDays: number;
  startDate: string;
}

export interface ReminderConfig {
  enabled: boolean;
  time: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  cue?: string;
  reward?: string;
  stack?: string;
  twoMinuteVersion?: string;
  challenge?: HabitChallenge;
  reminder?: ReminderConfig;
  createdAt: number;
  archivedAt?: number;
  order: number;
}

export interface Checkin {
  id: string;
  habitId: string;
  date: string;
  note?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

export interface HabitTemplate {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  cue?: string;
  reward?: string;
  twoMinuteVersion?: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  completionRate7d: number;
  completionRate30d: number;
  completionRateAll: number;
}

export type BadgeId =
  | "first-checkin"
  | "streak-3"
  | "streak-7"
  | "streak-21"
  | "streak-66"
  | "streak-100"
  | "total-10"
  | "total-50"
  | "total-100"
  | "total-365"
  | "habit-3"
  | "habit-5"
  | "perfect-week"
  | "perfect-month"
  | "challenge-21"
  | "challenge-66"
  | "challenge-100";

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: "streak" | "total" | "habit" | "perfect" | "challenge";
}

export interface ExportData {
  version: number;
  exportedAt: number;
  habits: Habit[];
  checkins: Checkin[];
}
