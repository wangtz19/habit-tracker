"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Share2, Calendar, Loader2 } from "lucide-react";
import { useHabitStore } from "@/store/habits";
import { addDaysToKey, todayKey } from "@/lib/utils";
import { isHabitScheduledOn, calculateStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { shareImage } from "@/lib/image-export";
import { ShareLinkModal } from "@/components/ShareLinkModal";

type Period = "week" | "month";

export default function ReportsPage() {
  const habits = useHabitStore((s) => s.habits);
  const checkins = useHabitStore((s) => s.checkins);
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);
  const [period, setPeriod] = useState<Period>("week");
  const [exporting, setExporting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!loaded) load();
  }, [load, loaded]);

  const days = period === "week" ? 7 : 30;
  const periodLabel = period === "week" ? "本周" : "本月";

  const report = useMemo(() => {
    const today = todayKey();
    const checkinSet = new Set(checkins.map((c) => `${c.habitId}|${c.date}`));

    let totalScheduled = 0;
    let totalDone = 0;
    const perHabit: Array<{
      habit: (typeof habits)[number];
      scheduled: number;
      done: number;
      rate: number;
      currentStreak: number;
    }> = [];
    const dailyCounts: Array<{ date: string; done: number; total: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = addDaysToKey(today, -i);
      let dayDone = 0;
      let dayTotal = 0;
      for (const h of habits) {
        if (isHabitScheduledOn(h, date)) {
          dayTotal++;
          if (checkinSet.has(`${h.id}|${date}`)) dayDone++;
        }
      }
      dailyCounts.push({ date, done: dayDone, total: dayTotal });
    }

    for (const h of habits) {
      let scheduled = 0;
      let done = 0;
      for (let i = 0; i < days; i++) {
        const date = addDaysToKey(today, -i);
        if (isHabitScheduledOn(h, date)) {
          scheduled++;
          if (checkinSet.has(`${h.id}|${date}`)) done++;
        }
      }
      totalScheduled += scheduled;
      totalDone += done;
      const stats = calculateStats(
        h,
        checkins.filter((c) => c.habitId === h.id)
      );
      perHabit.push({
        habit: h,
        scheduled,
        done,
        rate: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100),
        currentStreak: stats.currentStreak,
      });
    }

    perHabit.sort((a, b) => b.rate - a.rate);

    const completionRate =
      totalScheduled === 0 ? 0 : Math.round((totalDone / totalScheduled) * 100);
    const bestDay = dailyCounts.reduce(
      (best, d) => (d.done > best.done ? d : best),
      dailyCounts[0] ?? { date: "", done: 0, total: 0 }
    );
    const perfectDays = dailyCounts.filter(
      (d) => d.total > 0 && d.done === d.total
    ).length;

    return {
      totalScheduled,
      totalDone,
      completionRate,
      perHabit,
      dailyCounts,
      bestDay,
      perfectDays,
    };
  }, [habits, checkins, days]);

  const handleShareImage = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const result = await shareImage(cardRef.current, {
        filename: `habit-report-${period}-${todayKey()}.png`,
        title: `原子习惯 · ${periodLabel}报告`,
      });
      if (result === "shared") showToast("已分享 ✓");
      else if (result === "downloaded") showToast("已保存到下载 ✓");
      else showToast("生成失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  if (!loaded) {
    return <div className="text-center py-20 text-zinc-400">加载中...</div>;
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-zinc-500">还没有习惯</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-6">
      <div className="flex items-center justify-between mb-5">
        <Link href="/stats" className="btn-ghost">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">回顾报告</h1>
        <div className="flex gap-1">
          <button
            onClick={() => setShareOpen(true)}
            className="btn-ghost text-primary-500"
            aria-label="分享链接"
            title="分享链接"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={handleShareImage}
            disabled={exporting}
            className="btn-ghost text-primary-500 disabled:opacity-50"
            aria-label="保存为图片"
            title="保存为图片"
          >
            {exporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ImageIcon size={18} />
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPeriod("week")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            period === "week"
              ? "bg-primary-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800"
          )}
        >
          周报（近 7 天）
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            period === "month"
              ? "bg-primary-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800"
          )}
        >
          月报（近 30 天）
        </button>
      </div>

      <div
        ref={cardRef}
        className="card p-6 mb-6 bg-gradient-to-br from-primary-50/40 to-transparent dark:from-primary-950/20"
      >
        <div className="text-center mb-6">
          <div className="text-xs text-zinc-500 mb-1">原子习惯 · {periodLabel}报告</div>
          <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-1">
            {report.completionRate}%
          </div>
          <div className="text-sm text-zinc-500">总体完成率</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBlock label="总打卡" value={`${report.totalDone}`} />
          <StatBlock label="计划数" value={`${report.totalScheduled}`} />
          <StatBlock label="完美日" value={`${report.perfectDays}`} />
        </div>

        <div className="mb-6">
          <div className="text-xs text-zinc-500 mb-2">每日完成情况</div>
          <div className="flex gap-1 h-20 items-end">
            {report.dailyCounts.map((d) => {
              const pct = d.total === 0 ? 0 : (d.done / d.total) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary-500 transition-all"
                    style={{
                      height: `${Math.max(pct, 2)}%`,
                      opacity: d.total === 0 ? 0.2 : 0.4 + (pct / 100) * 0.6,
                    }}
                  />
                  {period === "week" && (
                    <div className="text-[9px] text-zinc-400">
                      {d.date.slice(8)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 mb-2">习惯表现排行</div>
          <div className="space-y-2">
            {report.perHabit.slice(0, 8).map(({ habit, rate, done, scheduled }) => (
              <div key={habit.id} className="flex items-center gap-2">
                <span className="text-lg">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium">{habit.name}</span>
                    <span className="text-zinc-500 ml-2 shrink-0">
                      {done}/{scheduled} · {rate}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-1">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${rate}%`, backgroundColor: habit.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-1">
          <Calendar size={12} />
          原子习惯 · {todayKey()}
        </div>
      </div>

      <p className="text-xs text-zinc-400 text-center px-4">
        💡 右上角：🔗 生成只读分享链接 · 🖼 一键保存为图片分享朋友圈
      </p>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-full text-sm shadow-lg animate-fade-in z-50">
          {toast}
        </div>
      )}

      <ShareLinkModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        options={{
          period,
          endDate: todayKey(),
          habits,
          checkins,
        }}
      />
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}
