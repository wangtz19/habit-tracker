"use client";

import { useEffect } from "react";
import { useHabitStore } from "@/store/habits";
import {
  startNotificationScheduler,
  stopNotificationScheduler,
} from "@/lib/notifications";

export function NotificationManager() {
  const habits = useHabitStore((s) => s.habits);
  const loaded = useHabitStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) return;
    startNotificationScheduler(habits);
    return () => stopNotificationScheduler();
  }, [habits, loaded]);

  return null;
}
