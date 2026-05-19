"use client";

import { Flame, Quote, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useHabitStore } from "@/store/habits";
import { calculateStats } from "@/lib/stats";
import { getQuoteOfDay } from "@/lib/quotes";
import { todayKey } from "@/lib/utils";

interface Props {
  completed: number;
  scheduled: number;
}

export function HomeWidgets({ completed, scheduled }: Props) {
  const habits = useHabitStore((s) => s.habits);
  const checkins = useHabitStore((s) => s.checkins);

  const today = todayKey();
  const quote = useMemo(() => getQuoteOfDay(today), [today]);

  const { maxStreak, maxStreakHabit } = useMemo(() => {
    let maxStreak = 0;
    let maxStreakHabit = null;
    for (const habit of habits) {
      const hCheckins = checkins.filter((c) => c.habitId === habit.id);
      const stats = calculateStats(habit, hCheckins);
      if (stats.currentStreak > maxStreak) {
        maxStreak = stats.currentStreak;
        maxStreakHabit = habit;
      }
    }
    return { maxStreak, maxStreakHabit };
  }, [habits, checkins]);

  const progress = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="card p-4 flex items-center gap-4 col-span-1">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
            <circle
              cx="44"
              cy="44"
              r="38"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-zinc-100 dark:text-zinc-800"
            />
            <circle
              cx="44"
              cy="44"
              r="38"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="text-primary-500 transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{progress}%</span>
            <span className="text-[10px] text-zinc-500">
              {completed}/{scheduled}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-500 mb-0.5">今日完成</div>
          <div className="text-sm font-medium">
            {progress === 100 ? (
              <span className="text-emerald-500">全部完成 🎉</span>
            ) : progress === 0 ? (
              <span>开始吧 ✨</span>
            ) : (
              <span>加油，差一点</span>
            )}
          </div>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
          <Flame size={24} className="text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-500 mb-0.5">最长连击</div>
          {maxStreakHabit ? (
            <>
              <div className="font-bold text-lg leading-tight">
                {maxStreak}
                <span className="text-xs text-zinc-400 ml-1">天</span>
              </div>
              <div className="text-xs text-zinc-500 truncate mt-0.5">
                {maxStreakHabit.icon} {maxStreakHabit.name}
              </div>
            </>
          ) : (
            <div className="text-sm text-zinc-400">还没开始</div>
          )}
        </div>
      </div>

      <div className="col-span-2 card p-4 bg-gradient-to-br from-primary-50/60 to-transparent dark:from-primary-950/20">
        <div className="flex items-start gap-2">
          <Quote
            size={16}
            className="text-primary-500 shrink-0 mt-0.5 opacity-60"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm leading-relaxed">{quote.text}</div>
            <div className="text-xs text-zinc-400 mt-1">— {quote.author}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
