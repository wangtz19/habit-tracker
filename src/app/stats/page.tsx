"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Flame, Trophy, CalendarCheck, Target, FileBarChart2, Award, Sparkles } from "lucide-react";
import { useHabitStore } from "@/store/habits";
import { calculateStats } from "@/lib/stats";
import { Heatmap } from "@/components/Heatmap";

export default function StatsPage() {
  const habits = useHabitStore((s) => s.habits);
  const checkins = useHabitStore((s) => s.checkins);
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) load();
  }, [load, loaded]);

  const overall = useMemo(() => {
    let totalCheckins = 0;
    let maxStreak = 0;
    let maxCurrentStreak = 0;
    const habitStats = habits.map((h) => {
      const hCheckins = checkins.filter((c) => c.habitId === h.id);
      const s = calculateStats(h, hCheckins);
      totalCheckins += s.totalCheckins;
      if (s.longestStreak > maxStreak) maxStreak = s.longestStreak;
      if (s.currentStreak > maxCurrentStreak) maxCurrentStreak = s.currentStreak;
      return { habit: h, stats: s };
    });
    return { totalCheckins, maxStreak, maxCurrentStreak, habitStats };
  }, [habits, checkins]);

  const allCheckinDates = useMemo(
    () => new Set(checkins.map((c) => c.date)),
    [checkins]
  );

  if (!loaded) {
    return <div className="text-center py-20 text-zinc-400">加载中...</div>;
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-zinc-500">还没有习惯，先去创建一个吧</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-6">
      <h1 className="text-2xl font-bold mb-5">统计</h1>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <Link
          href="/insights"
          className="card p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all text-center"
        >
          <div className="w-10 h-10 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-950/30 flex items-center justify-center">
            <Sparkles size={18} className="text-fuchsia-500" />
          </div>
          <div className="font-medium text-xs">关联洞察</div>
        </Link>
        <Link
          href="/achievements"
          className="card p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all text-center"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
            <Award size={18} className="text-amber-500" />
          </div>
          <div className="font-medium text-xs">成就徽章</div>
        </Link>
        <Link
          href="/reports"
          className="card p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all text-center"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center">
            <FileBarChart2 size={18} className="text-primary-500" />
          </div>
          <div className="font-medium text-xs">回顾报告</div>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <OverviewCard
          icon={<Flame className="text-orange-500" size={20} />}
          label="当前最长连击"
          value={overall.maxCurrentStreak}
          unit="天"
        />
        <OverviewCard
          icon={<Trophy className="text-amber-500" size={20} />}
          label="历史最长连击"
          value={overall.maxStreak}
          unit="天"
        />
        <OverviewCard
          icon={<CalendarCheck className="text-emerald-500" size={20} />}
          label="累计打卡"
          value={overall.totalCheckins}
          unit="次"
        />
        <OverviewCard
          icon={<Target className="text-primary-500" size={20} />}
          label="活跃习惯"
          value={habits.length}
          unit="个"
        />
      </div>

      <div className="card p-4 mb-6">
        <h3 className="font-medium mb-3">全部习惯热力图</h3>
        <Heatmap checkinDates={allCheckinDates} color="#0ea5e9" />
      </div>

      <div className="card p-4">
        <h3 className="font-medium mb-3">各习惯表现</h3>
        <div className="space-y-3">
          {overall.habitStats.map(({ habit, stats }) => (
            <Link
              key={habit.id}
              href={`/habits/${habit.id}`}
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${habit.color}20` }}
              >
                {habit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{habit.name}</div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                  <span>连击 {stats.currentStreak}</span>
                  <span>近30天 {stats.completionRate30d}%</span>
                  <span>累计 {stats.totalCheckins}</span>
                </div>
              </div>
              <div className="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${stats.completionRate30d}%`,
                    backgroundColor: habit.color,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-zinc-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}
