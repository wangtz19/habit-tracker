import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function toDateKey(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function daysBetween(start: string, end: string): number {
  return differenceInDays(parseISO(end), parseISO(start));
}

export function addDaysToKey(dateKey: string, days: number): string {
  return toDateKey(addDays(parseISO(dateKey), days));
}

export function getWeekday(dateKey: string): number {
  return parseISO(dateKey).getDay();
}
