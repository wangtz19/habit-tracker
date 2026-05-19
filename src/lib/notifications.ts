import type { Habit } from "@/types";

const SCHEDULER_FLAG = "notification-scheduler-active";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  return Notification.requestPermission();
}

export function showNotification(title: string, body: string) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: title,
    });
  } catch (err) {
    console.error("Failed to show notification:", err);
  }
}

interface ScheduledItem {
  habitId: string;
  habitName: string;
  habitIcon: string;
  time: string;
}

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastFiredKey = "";

export function startNotificationScheduler(habits: Habit[]) {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (intervalId !== null) stopNotificationScheduler();

  const items: ScheduledItem[] = habits
    .filter((h) => h.reminder?.enabled && h.reminder.time)
    .map((h) => ({
      habitId: h.id,
      habitName: h.name,
      habitIcon: h.icon,
      time: h.reminder!.time,
    }));

  if (items.length === 0) return;

  sessionStorage.setItem(SCHEDULER_FLAG, "1");

  const checkAndFire = () => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const dateKey = now.toISOString().slice(0, 10);
    const minuteKey = `${dateKey}-${hhmm}`;
    if (minuteKey === lastFiredKey) return;

    for (const item of items) {
      if (item.time === hhmm) {
        lastFiredKey = minuteKey;
        showNotification(
          `${item.habitIcon} ${item.habitName}`,
          "该打卡啦！花 1 秒钟，迈出第一步。"
        );
      }
    }
  };

  intervalId = setInterval(checkAndFire, 30000);
  checkAndFire();
}

export function stopNotificationScheduler() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SCHEDULER_FLAG);
  }
}
