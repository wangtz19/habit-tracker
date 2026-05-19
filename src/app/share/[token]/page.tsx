"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { decodePayload, type ShareablePayload } from "@/lib/share-link";
import { shareImage } from "@/lib/image-export";

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86400000
  );
}

function addDaysToKey(dateKey: string, days: number): string {
  const d = new Date(dateKey);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function SharedReportPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [payload, setPayload] = useState<ShareablePayload | null>(null);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const decoded = decodePayload(token);
    if (decoded) setPayload(decoded);
    else setDecodeFailed(true);
  }, [token]);

  const report = useMemo(() => {
    if (!payload) return null;
    const days = payload.period === "week" ? 7 : 30;
    const endDate = payload.endDate;
    const startDate = addDaysToKey(endDate, -(days - 1));

    const checkinSet = new Set(payload.checkins.map((c) => `${c.h}|${c.d}`));
    const dateList: string[] = [];
    for (let i = 0; i < days; i++) {
      dateList.push(addDaysToKey(startDate, i));
    }

    let totalDone = 0;
    let totalPossible = 0;
    const perHabit = payload.habits.map((h) => {
      let done = 0;
      for (const d of dateList) {
        if (checkinSet.has(`${h.id}|${d}`)) done++;
      }
      totalDone += done;
      totalPossible += days;
      return {
        habit: h,
        done,
        scheduled: days,
        rate: Math.round((done / days) * 100),
      };
    });

    perHabit.sort((a, b) => b.rate - a.rate);

    const dailyCounts = dateList.map((date) => {
      const done = payload.habits.filter((h) =>
        checkinSet.has(`${h.id}|${date}`)
      ).length;
      return { date, done, total: payload.habits.length };
    });

    const perfectDays = dailyCounts.filter(
      (d) => d.total > 0 && d.done === d.total
    ).length;

    return {
      perHabit,
      dailyCounts,
      totalDone,
      totalPossible,
      perfectDays,
      completionRate:
        totalPossible === 0
          ? 0
          : Math.round((totalDone / totalPossible) * 100),
      startDate,
      endDate,
      periodLabel: payload.period === "week" ? "周报" : "月报",
    };
  }, [payload]);

  const moodAvg = useMemo(() => {
    if (!payload) return null;
    const moods = payload.checkins
      .map((c) => c.m)
      .filter((m): m is number => typeof m === "number");
    if (moods.length === 0) return null;
    const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
    return { avg: Math.round(avg * 10) / 10, count: moods.length };
  }, [payload]);

  const handleSaveImage = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const result = await shareImage(cardRef.current, {
        filename: `shared-report-${payload?.endDate ?? ""}.png`,
        title: "习惯报告",
      });
      if (result === "shared") setToastMessage("已分享 ✓");
      else if (result === "downloaded") setToastMessage("已保存到下载 ✓");
      else setToastMessage("生成失败");
    } finally {
      setExporting(false);
    }
  };

  const setToastMessage = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (decodeFailed) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="font-semibold mb-2">链接无效或已损坏</h2>
        <p className="text-sm text-zinc-500 mb-6">
          可能是链接被截断了，请向分享者重新索取。
        </p>
        <Link href="/" className="btn-primary">
          去使用原子习惯
        </Link>
      </div>
    );
  }

  if (!payload || !report) {
    return (
      <div className="text-center py-20 text-zinc-400">
        <Loader2 className="mx-auto animate-spin mb-2" size={24} />
        加载中...
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-6">
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="btn-ghost flex items-center gap-1 text-sm">
          <ChevronLeft size={16} />
          <span>返回</span>
        </Link>
        <h1 className="text-lg font-bold">分享的报告</h1>
        <button
          onClick={handleSaveImage}
          disabled={exporting}
          className="btn-ghost text-primary-500 disabled:opacity-50"
          aria-label="保存为图片"
        >
          {exporting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ImageIcon size={18} />
          )}
        </button>
      </div>

      <div
        ref={cardRef}
        className="card p-6 mb-6 bg-gradient-to-br from-primary-50/40 to-transparent dark:from-primary-950/20"
      >
        <div className="text-center mb-6">
          <div className="text-xs text-zinc-500 mb-1">
            原子习惯 · {report.periodLabel}
            {payload.userAlias && (
              <>
                <span className="mx-1.5">·</span>
                <span className="font-medium">{payload.userAlias}</span>
              </>
            )}
          </div>
          <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-1">
            {report.completionRate}%
          </div>
          <div className="text-sm text-zinc-500">总体完成率</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="打卡数" value={`${report.totalDone}`} />
          <Stat label="完美日" value={`${report.perfectDays}`} />
          <Stat
            label={moodAvg ? "平均心情" : "习惯数"}
            value={
              moodAvg
                ? `${moodAvg.avg}/5`
                : `${payload.habits.length}`
            }
          />
        </div>

        <div className="mb-6">
          <div className="text-xs text-zinc-500 mb-2">每日完成情况</div>
          <div className="flex gap-1 h-16 items-end">
            {report.dailyCounts.map((d) => {
              const pct = d.total === 0 ? 0 : (d.done / d.total) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t bg-primary-500 transition-all"
                    style={{
                      height: `${Math.max(pct, 2)}%`,
                      opacity: d.total === 0 ? 0.2 : 0.4 + (pct / 100) * 0.6,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 mb-2">习惯表现</div>
          <div className="space-y-2">
            {report.perHabit.slice(0, 10).map(({ habit, rate, done, scheduled }) => (
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
                      style={{
                        width: `${rate}%`,
                        backgroundColor: habit.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-1">
          <Calendar size={12} />
          {report.startDate} ~ {report.endDate}
        </div>
      </div>

      <Link
        href="/"
        className="card p-4 flex items-center gap-3 hover:shadow-md transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-primary-500" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">想开启自己的习惯之旅？</div>
          <div className="text-xs text-zinc-500 mt-0.5">
            原子习惯 · 完全本地、隐私优先
          </div>
        </div>
        <span className="text-primary-500 text-sm">开始 →</span>
      </Link>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-full text-sm shadow-lg animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}
