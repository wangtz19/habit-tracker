"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  Trash2,
  Edit3,
  Archive,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useHabitStore } from "@/store/habits";
import { Heatmap } from "@/components/Heatmap";
import { MonthCalendar } from "@/components/MonthCalendar";
import { ChallengeCard } from "@/components/ChallengeCard";
import { CheckinNoteModal } from "@/components/CheckinNoteModal";
import { calculateStats } from "@/lib/stats";
import { CATEGORY_LABELS } from "@/lib/templates";
import { MessageCircle } from "lucide-react";

export default function HabitDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const allCheckins = useHabitStore((s) => s.checkins);
  const checkins = useMemo(
    () => allCheckins.filter((c) => c.habitId === id),
    [allCheckins, id]
  );
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);
  const toggleCheckin = useHabitStore((s) => s.toggleCheckin);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noteDate, setNoteDate] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) load();
  }, [load, loaded]);

  const checkinDates = useMemo(
    () => new Set(checkins.map((c) => c.date)),
    [checkins]
  );

  const stats = useMemo(
    () => (habit ? calculateStats(habit, checkins) : null),
    [habit, checkins]
  );

  if (!loaded) {
    return <div className="text-center py-20 text-zinc-400">加载中...</div>;
  }

  if (!habit) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400 mb-4">习惯不存在</p>
        <Link href="/" className="btn-secondary">
          返回
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="btn-ghost flex items-center gap-1"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-1">
          <Link href={`/habits/${id}/edit`} className="btn-ghost">
            <Edit3 size={18} />
          </Link>
          <button
            onClick={() => archiveHabit(id).then(() => router.push("/"))}
            className="btn-ghost"
            aria-label="归档"
          >
            <Archive size={18} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-ghost text-red-500"
            aria-label="删除"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          {habit.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{habit.name}</h1>
          {habit.description && (
            <p className="text-sm text-zinc-500 mt-1">{habit.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="chip"
              style={{
                backgroundColor: `${habit.color}20`,
                color: habit.color,
              }}
            >
              {CATEGORY_LABELS[habit.category]}
            </span>
            <span className="chip bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {habit.frequency.type === "daily"
                ? "每天"
                : habit.frequency.type === "custom"
                  ? `每周 ${habit.frequency.daysOfWeek?.length ?? 0} 次`
                  : `每周 ${habit.frequency.timesPerWeek ?? 0} 次`}
            </span>
          </div>
        </div>
      </div>

      <ChallengeCard habit={habit} checkins={checkins} />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={<Flame size={18} />}
          label="当前连击"
          value={`${stats?.currentStreak ?? 0}`}
          unit="天"
          accent="text-orange-500"
        />
        <StatCard
          icon={<Trophy size={18} />}
          label="最长连击"
          value={`${stats?.longestStreak ?? 0}`}
          unit="天"
          accent="text-amber-500"
        />
        <StatCard
          icon={<Target size={18} />}
          label="累计完成"
          value={`${stats?.totalCheckins ?? 0}`}
          unit="次"
          accent="text-emerald-500"
        />
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-primary-500" />
          <h3 className="font-medium">完成率</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <RateItem label="近 7 天" value={stats?.completionRate7d ?? 0} />
          <RateItem label="近 30 天" value={stats?.completionRate30d ?? 0} />
          <RateItem label="全部" value={stats?.completionRateAll ?? 0} />
        </div>
      </div>

      <div className="card p-4 mb-6">
        <h3 className="font-medium mb-3">年度热力图</h3>
        <Heatmap checkinDates={checkinDates} color={habit.color} />
      </div>

      <div className="card p-4 mb-6">
        <h3 className="font-medium mb-3">月度日历</h3>
        <p className="text-xs text-zinc-400 mb-3">
          点击日期：补卡 / 取消 · 长按日期：记笔记
        </p>
        <MonthCalendar
          checkinDates={checkinDates}
          color={habit.color}
          onDayClick={(date) => toggleCheckin(id, date)}
          onDayLongPress={(date) => {
            if (checkinDates.has(date)) setNoteDate(date);
          }}
        />
      </div>

      {(() => {
        const noted = checkins
          .filter((c) => c.note || c.mood)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10);
        if (noted.length === 0) return null;
        return (
          <div className="card p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={18} className="text-primary-500" />
              <h3 className="font-medium">最近备注</h3>
            </div>
            <div className="space-y-3">
              {noted.map((c) => (
                <div
                  key={c.id}
                  className="flex gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0"
                >
                  <div className="text-xs text-zinc-500 w-20 shrink-0 pt-0.5">
                    {c.date.slice(5)}
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    {c.mood && (
                      <span className="text-base mr-1.5">
                        {["", "😞", "😕", "😐", "🙂", "😄"][c.mood]}
                      </span>
                    )}
                    {c.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {(habit.cue || habit.reward || habit.stack || habit.twoMinuteVersion) && (
        <div className="card p-4 mb-6 space-y-3">
          <h3 className="font-medium">原子习惯设计</h3>
          {habit.cue && (
            <AtomicRow label="提示（Cue）" value={habit.cue} />
          )}
          {habit.stack && (
            <AtomicRow label="习惯叠加" value={habit.stack} />
          )}
          {habit.twoMinuteVersion && (
            <AtomicRow label="2 分钟版本" value={habit.twoMinuteVersion} />
          )}
          {habit.reward && (
            <AtomicRow label="奖励（Reward）" value={habit.reward} />
          )}
        </div>
      )}

      {noteDate && (
        <CheckinNoteModal
          habitId={id}
          date={noteDate}
          open
          onClose={() => setNoteDate(null)}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="card p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-2">删除这个习惯？</h3>
            <p className="text-sm text-zinc-500 mb-4">
              所有打卡记录将永久删除，不可恢复。
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                取消
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 active:scale-95 transition-all"
                onClick={() => deleteHabit(id).then(() => router.push("/"))}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div className="card p-3 text-center">
      <div className={`flex justify-center mb-1 ${accent}`}>{icon}</div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1">
        <span className="text-xl font-bold">{value}</span>
        <span className="text-xs text-zinc-400 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function RateItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}%</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function AtomicRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="text-xs text-zinc-500 w-20 shrink-0 pt-0.5">{label}</div>
      <div className="text-sm flex-1">{value}</div>
    </div>
  );
}
