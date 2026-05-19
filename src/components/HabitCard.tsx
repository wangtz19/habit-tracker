"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Check, Flame, GripVertical, MessageCircle } from "lucide-react";
import type { Habit } from "@/types";
import { useHabitStore } from "@/store/habits";
import { todayKey, cn } from "@/lib/utils";
import { calculateStats, isHabitScheduledToday } from "@/lib/stats";

interface Props {
  habit: Habit;
  sortMode?: boolean;
  onLongPress?: () => void;
}

export function HabitCard({ habit, sortMode, onLongPress }: Props) {
  const checkins = useHabitStore((s) =>
    s.checkins.filter((c) => c.habitId === habit.id)
  );
  const toggleCheckin = useHabitStore((s) => s.toggleCheckin);
  const [animating, setAnimating] = useState(false);

  const today = todayKey();
  const todayCheckin = useMemo(
    () => checkins.find((c) => c.date === today),
    [checkins, today]
  );
  const isCheckedToday = !!todayCheckin;
  const hasNoteToday = !!(todayCheckin?.note || todayCheckin?.mood);

  const stats = useMemo(
    () => calculateStats(habit, checkins),
    [habit, checkins]
  );

  const scheduled = isHabitScheduledToday(habit);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handleCheck = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    try {
      if (navigator.vibrate) navigator.vibrate(15);
    } catch {}
    await toggleCheckin(habit.id);
    setTimeout(() => setAnimating(false), 400);
  };

  const handlePointerDown = () => {
    if (!onLongPress || sortMode) return;
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      try {
        if (navigator.vibrate) navigator.vibrate(30);
      } catch {}
      onLongPress();
    }, 500);
  };

  const handlePointerEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (longPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressTriggered.current = false;
    }
  };

  const content = (
    <div
      className={cn(
        "card flex items-center gap-3 p-4 transition-all hover:shadow-md",
        !scheduled && "opacity-50",
        sortMode && "cursor-grab active:cursor-grabbing"
      )}
    >
      {sortMode && (
        <GripVertical
          size={18}
          className="text-zinc-400 shrink-0 -ml-1 touch-none"
        />
      )}

      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: `${habit.color}20` }}
      >
        {habit.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="font-medium truncate">{habit.name}</div>
          {hasNoteToday && (
            <MessageCircle size={12} className="text-primary-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {stats.currentStreak > 0 && (
            <span className="inline-flex items-center gap-0.5 text-orange-500">
              <Flame size={12} />
              {stats.currentStreak}天
            </span>
          )}
          <span>近7天 {stats.completionRate7d}%</span>
          {!scheduled && <span>今日休息</span>}
        </div>
      </div>

      {!sortMode && (
        <button
          onClick={handleCheck}
          className={cn(
            "w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-90",
            isCheckedToday
              ? "border-transparent text-white"
              : "border-zinc-300 dark:border-zinc-700 text-transparent hover:border-zinc-400",
            animating && "animate-bounce-soft"
          )}
          style={isCheckedToday ? { backgroundColor: habit.color } : {}}
          aria-label={isCheckedToday ? "取消打卡" : "打卡"}
        >
          <Check size={24} strokeWidth={3} />
        </button>
      )}
    </div>
  );

  if (sortMode) return content;

  return (
    <Link
      href={`/habits/${habit.id}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClickCapture={handleClickCapture}
    >
      {content}
    </Link>
  );
}
