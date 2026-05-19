"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Smile,
  CalendarDays,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { useHabitStore } from "@/store/habits";
import {
  generateInsights,
  checkDataAvailability,
  getWeekdayName,
  type HabitPairCorrelation,
  type MoodCorrelation,
  type BestTimeInsight,
} from "@/lib/correlation";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const habits = useHabitStore((s) => s.habits);
  const checkins = useHabitStore((s) => s.checkins);
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) load();
  }, [load, loaded]);

  const availability = useMemo(
    () => checkDataAvailability(habits, checkins),
    [habits, checkins]
  );

  const insights = useMemo(() => {
    if (!availability.enoughData) return null;
    return generateInsights(habits, checkins);
  }, [habits, checkins, availability.enoughData]);

  if (!loaded) {
    return <div className="text-center py-20 text-zinc-400">加载中...</div>;
  }

  return (
    <div className="animate-fade-in pb-6">
      <div className="flex items-center justify-between mb-5">
        <Link href="/stats" className="btn-ghost">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">关联洞察</h1>
        <div className="w-10" />
      </div>

      {!availability.enoughData ? (
        <NotEnoughData
          totalDays={availability.totalDays}
          minRequired={availability.minRequired}
        />
      ) : !insights ||
        (insights.pairCorrelations.length === 0 &&
          insights.moodCorrelations.length === 0 &&
          insights.bestTimes.length === 0) ? (
        <NoInsightsYet />
      ) : (
        <>
          <Header />
          {insights.pairCorrelations.length > 0 && (
            <Section title="习惯之间" icon={<TrendingUp size={16} />}>
              <div className="space-y-3">
                {insights.pairCorrelations.map((c, i) => (
                  <PairCard key={i} corr={c} />
                ))}
              </div>
            </Section>
          )}

          {insights.moodCorrelations.length > 0 && (
            <Section title="心情关联" icon={<Smile size={16} />}>
              <div className="space-y-3">
                {insights.moodCorrelations.map((m, i) => (
                  <MoodCard key={i} corr={m} />
                ))}
              </div>
            </Section>
          )}

          {insights.bestTimes.length > 0 && (
            <Section title="最佳时段" icon={<CalendarDays size={16} />}>
              <div className="space-y-3">
                {insights.bestTimes.map((b, i) => (
                  <BestTimeCard key={i} insight={b} />
                ))}
              </div>
            </Section>
          )}

          <div className="card p-4 mt-6 text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-start gap-2">
              <Lightbulb
                size={14}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <div className="leading-relaxed">
                <b>关于洞察：</b>
                这些发现基于过去 60 天的打卡数据，通过 Pearson 相关性计算得出。
                相关不等于因果——它们是值得你深思的线索，不是结论。
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="card p-4 mb-5 bg-gradient-to-br from-primary-50/60 to-transparent dark:from-primary-950/20">
      <div className="flex items-start gap-2">
        <Sparkles size={16} className="text-primary-500 shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          从你的数据中，我们发现了一些值得关注的<b>模式</b>。
          理解它们能帮你<b>设计更好的习惯系统</b>。
        </div>
      </div>
    </div>
  );
}

function NotEnoughData({
  totalDays,
  minRequired,
}: {
  totalDays: number;
  minRequired: number;
}) {
  const progress = Math.min(100, Math.round((totalDays / minRequired) * 100));
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">📈</div>
      <h2 className="font-semibold mb-2">数据还不够多</h2>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
        关联洞察需要至少 <b>{minRequired} 天</b>的数据。
        <br />
        继续打卡，让算法发现你的模式。
      </p>
      <div className="max-w-xs mx-auto">
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-zinc-500 mt-2">
          已积累 {totalDays} / {minRequired} 天
        </div>
      </div>
    </div>
  );
}

function NoInsightsYet() {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="font-semibold mb-2">暂未发现明显关联</h2>
      <p className="text-sm text-zinc-500 max-w-sm mx-auto">
        继续坚持打卡，记录心情，让数据多一点。
        <br />
        当模式出现时，我们会告诉你。
      </p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 px-1">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function PairCard({ corr }: { corr: HabitPairCorrelation }) {
  const positive = corr.coefficient > 0;
  const strength = Math.abs(corr.coefficient);
  const strengthLabel =
    strength >= 0.7 ? "强" : strength >= 0.4 ? "中等" : "弱";

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-3">
        <HabitChip habit={corr.habitA} />
        <span className="text-xs text-zinc-400">
          {positive ? "⟷" : "⟷"}
        </span>
        <HabitChip habit={corr.habitB} />
      </div>
      <div className="text-sm mb-2">{corr.description}</div>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            positive ? "text-emerald-500" : "text-rose-500"
          )}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          相关度 {Math.round(strength * 100)}%（{strengthLabel}）
        </span>
        <span>
          共同完成 {corr.bothCount}/{corr.totalDays} 天
        </span>
      </div>
    </div>
  );
}

function MoodCard({ corr }: { corr: MoodCorrelation }) {
  const positive = corr.diff > 0;
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${corr.habit.color}20` }}
        >
          {corr.habit.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{corr.habit.name}</div>
          <div className="text-xs text-zinc-500">{corr.description}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <MoodBar
          label="完成日"
          value={corr.avgMoodOnComplete}
          highlight={positive}
        />
        <MoodBar
          label="跳过日"
          value={corr.avgMoodOnSkip}
          highlight={!positive}
        />
      </div>
    </div>
  );
}

function MoodBar({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight: boolean;
}) {
  const pct = (value / 5) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-zinc-500">{label}</span>
        <span className={highlight ? "font-semibold text-primary-600" : ""}>
          {value.toFixed(1)}/5
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            highlight ? "bg-primary-500" : "bg-zinc-400 dark:bg-zinc-600"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BestTimeCard({ insight }: { insight: BestTimeInsight }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${insight.habit.color}20` }}
        >
          {insight.habit.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {insight.habit.name}
          </div>
          <div className="text-xs text-zinc-500">
            {getWeekdayName(insight.bestWeekday)}最容易完成
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5">
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mb-0.5">
            最佳
          </div>
          <div className="text-sm font-semibold">
            {getWeekdayName(insight.bestWeekday)}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">
            {insight.bestWeekdayRate}% 完成
          </div>
        </div>
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-2.5">
          <div className="text-[10px] text-rose-700 dark:text-rose-400 mb-0.5">
            最差
          </div>
          <div className="text-sm font-semibold">
            {getWeekdayName(insight.worstWeekday)}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400">
            {insight.worstWeekdayRate}% 完成
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitChip({
  habit,
}: {
  habit: HabitPairCorrelation["habitA"];
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-base">{habit.icon}</span>
      <span className="text-sm font-medium truncate">{habit.name}</span>
    </div>
  );
}
