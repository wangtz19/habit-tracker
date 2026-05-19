"use client";

import { useEffect, useMemo } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useHabitStore } from "@/store/habits";
import { BADGES, calculateEarnedBadges } from "@/lib/badges";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  total: "累计成就",
  streak: "连击成就",
  habit: "习惯数量",
  perfect: "完美主义",
  challenge: "挑战成就",
};

export default function AchievementsPage() {
  const habits = useHabitStore((s) => s.habits);
  const checkins = useHabitStore((s) => s.checkins);
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) load();
  }, [load, loaded]);

  const earned = useMemo(
    () => calculateEarnedBadges(habits, checkins),
    [habits, checkins]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof BADGES>();
    for (const b of BADGES) {
      const arr = map.get(b.category) ?? [];
      arr.push(b);
      map.set(b.category, arr);
    }
    return map;
  }, []);

  if (!loaded) {
    return <div className="text-center py-20 text-zinc-400">加载中...</div>;
  }

  return (
    <div className="animate-fade-in pb-6">
      <div className="flex items-center justify-between mb-5">
        <Link href="/stats" className="btn-ghost">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">成就徽章</h1>
        <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
          {earned.size}/{BADGES.length}
        </div>
      </div>

      <div className="card p-4 mb-6 bg-gradient-to-br from-amber-50/60 to-transparent dark:from-amber-950/20">
        <div className="text-center">
          <div className="text-3xl mb-2">🏆</div>
          <div className="font-semibold">已解锁 {earned.size} 个徽章</div>
          <div className="text-xs text-zinc-500 mt-1">
            坚持就是最好的奖励
          </div>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-3">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
            style={{ width: `${(earned.size / BADGES.length) * 100}%` }}
          />
        </div>
      </div>

      {Array.from(grouped.entries()).map(([category, badges]) => (
        <div key={category} className="mb-6">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 px-1">
            {CATEGORY_LABELS[category]}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => {
              const isEarned = earned.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "card p-3 text-center transition-all",
                    isEarned ? "" : "opacity-40"
                  )}
                >
                  <div
                    className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-3xl mb-2 relative"
                    style={
                      isEarned
                        ? { backgroundColor: `${badge.color}25` }
                        : { backgroundColor: "var(--card)" }
                    }
                  >
                    {isEarned ? (
                      badge.icon
                    ) : (
                      <Lock size={20} className="text-zinc-400" />
                    )}
                  </div>
                  <div className="font-medium text-xs truncate">
                    {badge.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-tight">
                    {badge.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
