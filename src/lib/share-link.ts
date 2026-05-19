import LZString from "lz-string";
import type { Habit, Checkin } from "@/types";

export const SHARE_LINK_VERSION = 1;

export interface ShareablePayload {
  v: number;
  type: "report";
  period: "week" | "month";
  endDate: string;
  userAlias?: string;
  habits: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    category: string;
  }>;
  checkins: Array<{
    h: string;
    d: string;
    m?: number;
  }>;
}

function stripHabit(h: Habit) {
  return {
    id: h.id,
    name: h.name,
    icon: h.icon,
    color: h.color,
    category: h.category,
  };
}

function stripCheckin(c: Checkin, includeMood: boolean) {
  return {
    h: c.habitId,
    d: c.date,
    ...(includeMood && c.mood ? { m: c.mood } : {}),
  };
}

export interface BuildShareOptions {
  period: "week" | "month";
  endDate: string;
  habits: Habit[];
  checkins: Checkin[];
  userAlias?: string;
  includeMood?: boolean;
}

export function buildSharePayload(opts: BuildShareOptions): ShareablePayload {
  const { period, endDate, habits, checkins, userAlias, includeMood = false } = opts;
  return {
    v: SHARE_LINK_VERSION,
    type: "report",
    period,
    endDate,
    userAlias: userAlias?.trim() || undefined,
    habits: habits.map(stripHabit),
    checkins: checkins.map((c) => stripCheckin(c, includeMood)),
  };
}

export function encodePayload(payload: ShareablePayload): string {
  const json = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodePayload(token: string): ShareablePayload | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(token);
    if (!json) return null;
    const data = JSON.parse(json);
    if (!data || typeof data !== "object" || data.v !== SHARE_LINK_VERSION) {
      return null;
    }
    if (data.type !== "report") return null;
    return data as ShareablePayload;
  } catch {
    return null;
  }
}

export function buildShareUrl(payload: ShareablePayload, baseUrl?: string): string {
  const token = encodePayload(payload);
  const base =
    baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/share/${token}`;
}

export function getTokenSizeKb(token: string): number {
  return Math.round((token.length / 1024) * 10) / 10;
}
