"use client";

import { useEffect, useRef } from "react";
import { useHabitStore } from "@/store/habits";
import { calculateEarnedBadges, getBadge } from "@/lib/badges";
import type { BadgeId } from "@/types";

const STORAGE_KEY = "earned-badges";

interface Toast {
  id: string;
  badgeId: BadgeId;
}

export function BadgeUnlockToast() {
  const habits = useHabitStore((s) => s.habits);
  const checkins = useHabitStore((s) => s.checkins);
  const loaded = useHabitStore((s) => s.loaded);
  const lastEarnedRef = useRef<Set<BadgeId> | null>(null);
  const toastsRef = useRef<Toast[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaded) return;

    if (lastEarnedRef.current === null) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        lastEarnedRef.current = stored
          ? new Set(JSON.parse(stored))
          : new Set();
      } catch {
        lastEarnedRef.current = new Set();
      }
      const current = calculateEarnedBadges(habits, checkins);
      lastEarnedRef.current = current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
      return;
    }

    const current = calculateEarnedBadges(habits, checkins);
    const newOnes: BadgeId[] = [];
    for (const id of Array.from(current)) {
      if (!lastEarnedRef.current.has(id)) newOnes.push(id);
    }

    if (newOnes.length > 0) {
      for (const id of newOnes) showToast(id);
      lastEarnedRef.current = current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
    }
  }, [habits, checkins, loaded]);

  function showToast(badgeId: BadgeId) {
    const toast: Toast = { id: `${Date.now()}-${Math.random()}`, badgeId };
    toastsRef.current.push(toast);
    render();
    setTimeout(() => {
      toastsRef.current = toastsRef.current.filter((t) => t.id !== toast.id);
      render();
    }, 4500);
  }

  function render() {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    for (const toast of toastsRef.current) {
      const badge = getBadge(toast.badgeId);
      if (!badge) continue;
      const div = document.createElement("div");
      div.className =
        "card p-3 flex items-center gap-3 shadow-2xl animate-scale-in max-w-xs";
      div.innerHTML = `
        <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style="background-color: ${badge.color}20">
          ${badge.icon}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-zinc-500">🎉 解锁徽章</div>
          <div class="font-semibold text-sm">${badge.name}</div>
          <div class="text-xs text-zinc-500 truncate">${badge.description}</div>
        </div>
      `;
      containerRef.current.appendChild(div);
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none"
    />
  );
}
