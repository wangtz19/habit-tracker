"use client";

import { Trophy, Target } from "lucide-react";
import type { Habit, Checkin } from "@/types";
import { getChallengeProgress } from "@/lib/challenge";

interface Props {
  habit: Habit;
  checkins: Checkin[];
}

export function ChallengeCard({ habit, checkins }: Props) {
  const progress = getChallengeProgress(habit, checkins);
  if (!progress) return null;

  const { daysCompleted, daysTotal, completionRate, succeeded, daysRemaining } =
    progress;

  return (
    <div
      className="card p-4 mb-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${habit.color}15, transparent)`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {succeeded ? (
            <Trophy size={18} className="text-amber-500" />
          ) : (
            <Target size={18} style={{ color: habit.color }} />
          )}
          <h3 className="font-medium">
            {daysTotal} 天挑战
            {succeeded && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                已完成
              </span>
            )}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">
            {daysCompleted}
            <span className="text-sm text-zinc-400">/{daysTotal}</span>
          </div>
        </div>
      </div>

      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-2">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${Math.min(100, completionRate)}%`,
            backgroundColor: habit.color,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{completionRate}% 完成</span>
        {!succeeded && <span>还需打卡 {daysRemaining} 天</span>}
        {succeeded && <span>🎉 恭喜挑战成功！</span>}
      </div>
    </div>
  );
}
