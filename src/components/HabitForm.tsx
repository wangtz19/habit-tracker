"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  ChallengeType,
} from "@/types";
import { CATEGORY_LABELS } from "@/lib/templates";
import { useHabitStore } from "@/store/habits";
import { todayKey } from "@/lib/utils";

const ICON_PRESETS = [
  "💧", "📚", "🧘", "🏃", "✍️", "🗣️", "🌙", "🤸", "💻", "☀️",
  "🧹", "💬", "🎨", "🍳", "🙏", "🔍", "🎸", "🎯", "💰", "🥗",
  "🚴", "🎵", "🌱", "🧠", "📝", "☕", "🦷", "🛏️", "🚿", "🍎",
];

const COLOR_PRESETS = [
  "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899",
  "#06b6d4", "#6366f1", "#84cc16", "#0891b2", "#eab308",
  "#a78bfa", "#f43f5e", "#d946ef", "#f97316", "#dc2626",
];

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

interface Props {
  initialHabit?: Habit;
}

export function HabitForm({ initialHabit }: Props) {
  const router = useRouter();
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);

  const [name, setName] = useState(initialHabit?.name ?? "");
  const [description, setDescription] = useState(initialHabit?.description ?? "");
  const [icon, setIcon] = useState(initialHabit?.icon ?? "🌱");
  const [color, setColor] = useState(initialHabit?.color ?? COLOR_PRESETS[0]);
  const [category, setCategory] = useState<HabitCategory>(
    initialHabit?.category ?? "health"
  );
  const [frequency, setFrequency] = useState<HabitFrequency>(
    initialHabit?.frequency ?? { type: "daily" }
  );

  const [cue, setCue] = useState(initialHabit?.cue ?? "");
  const [reward, setReward] = useState(initialHabit?.reward ?? "");
  const [stack, setStack] = useState(initialHabit?.stack ?? "");
  const [twoMinuteVersion, setTwoMinuteVersion] = useState(
    initialHabit?.twoMinuteVersion ?? ""
  );

  const [challengeType, setChallengeType] = useState<ChallengeType>(
    initialHabit?.challenge?.type ?? "none"
  );
  const [customChallengeDays, setCustomChallengeDays] = useState(
    initialHabit?.challenge?.targetDays ?? 30
  );

  const [reminderEnabled, setReminderEnabled] = useState(
    initialHabit?.reminder?.enabled ?? false
  );
  const [reminderTime, setReminderTime] = useState(
    initialHabit?.reminder?.time ?? "08:00"
  );

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const challengeDays =
      challengeType === "21"
        ? 21
        : challengeType === "66"
          ? 66
          : challengeType === "100"
            ? 100
            : challengeType === "custom"
              ? customChallengeDays
              : 0;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      category,
      frequency,
      cue: cue.trim() || undefined,
      reward: reward.trim() || undefined,
      stack: stack.trim() || undefined,
      twoMinuteVersion: twoMinuteVersion.trim() || undefined,
      challenge:
        challengeType === "none"
          ? undefined
          : {
              type: challengeType,
              targetDays: challengeDays,
              startDate: initialHabit?.challenge?.startDate ?? todayKey(),
            },
      reminder: reminderEnabled
        ? { enabled: true, time: reminderTime }
        : undefined,
    };
    if (initialHabit) {
      await updateHabit(initialHabit.id, data);
      router.push(`/habits/${initialHabit.id}`);
    } else {
      const created = await addHabit(data);
      router.push(`/habits/${created.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in pb-10">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost flex items-center gap-1"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">
          {initialHabit ? "编辑习惯" : "新建习惯"}
        </h1>
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="btn-primary flex items-center gap-1 disabled:opacity-50"
        >
          <Save size={16} />
          保存
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">
            习惯名称 <span className="text-red-500">*</span>
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：喝一杯水"
            required
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">描述（可选）</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="一句话激励自己"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">图标</label>
          <div className="grid grid-cols-10 gap-2 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 max-h-32 overflow-y-auto scrollbar-thin">
            {ICON_PRESETS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                  icon === i
                    ? "bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">颜色</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-all ${
                  color === c ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-950" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">分类</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => setCategory(key as HabitCategory)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  category === key
                    ? "bg-primary-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">频率</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <FreqBtn
                active={frequency.type === "daily"}
                onClick={() => setFrequency({ type: "daily" })}
              >
                每天
              </FreqBtn>
              <FreqBtn
                active={frequency.type === "custom"}
                onClick={() =>
                  setFrequency({
                    type: "custom",
                    daysOfWeek: frequency.daysOfWeek ?? [1, 3, 5],
                  })
                }
              >
                指定星期
              </FreqBtn>
            </div>

            {frequency.type === "custom" && (
              <div className="flex gap-1">
                {WEEKDAY_LABELS.map((label, idx) => {
                  const active = frequency.daysOfWeek?.includes(idx);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        const days = new Set(frequency.daysOfWeek ?? []);
                        if (days.has(idx)) days.delete(idx);
                        else days.add(idx);
                        setFrequency({
                          type: "custom",
                          daysOfWeek: Array.from(days).sort(),
                        });
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? "bg-primary-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card p-4 space-y-3 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-950/20">
          <div>
            <div className="font-medium text-sm mb-1">🧬 原子习惯设计（可选）</div>
            <p className="text-xs text-zinc-500">
              基于《原子习惯》方法论，让你的习惯更容易坚持
            </p>
          </div>

          <AtomicField
            label="提示（什么时候做）"
            placeholder="例如：起床后脚一落地"
            value={cue}
            onChange={setCue}
          />
          <AtomicField
            label="习惯叠加（叠在哪个旧习惯后）"
            placeholder="例如：刷完牙之后"
            value={stack}
            onChange={setStack}
          />
          <AtomicField
            label="2 分钟版本（最小可行版本）"
            placeholder="例如：只读一页书"
            value={twoMinuteVersion}
            onChange={setTwoMinuteVersion}
          />
          <AtomicField
            label="奖励（完成后的感受）"
            placeholder="例如：感受平静与清晰"
            value={reward}
            onChange={setReward}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">挑战模式</label>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { v: "none" as const, label: "不挑战" },
                { v: "21" as const, label: "21天" },
                { v: "66" as const, label: "66天" },
                { v: "100" as const, label: "100天" },
              ]
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setChallengeType(opt.v)}
                className={`py-2 rounded-lg text-sm transition-all ${
                  challengeType === opt.v
                    ? "bg-primary-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setChallengeType("custom")}
            className={`mt-2 w-full py-2 rounded-lg text-sm transition-all ${
              challengeType === "custom"
                ? "bg-primary-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            自定义天数
          </button>
          {challengeType === "custom" && (
            <input
              type="number"
              min={1}
              max={999}
              className="input mt-2"
              value={customChallengeDays}
              onChange={(e) =>
                setCustomChallengeDays(Math.max(1, Number(e.target.value) || 1))
              }
              placeholder="目标天数"
            />
          )}
          {challengeType !== "none" && (
            <p className="text-xs text-zinc-500 mt-2">
              💡 21天养成 · 66天自动化 · 100天精通
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">每日提醒</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                reminderEnabled ? "bg-primary-600" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                  reminderEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
            <input
              type="time"
              className="input flex-1 disabled:opacity-50"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              disabled={!reminderEnabled}
            />
          </div>
          {reminderEnabled && (
            <p className="text-xs text-zinc-500 mt-2">
              💡 需要在「设置」中开启通知权限
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function FreqBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm transition-all ${
        active
          ? "bg-primary-600 text-white"
          : "bg-zinc-100 dark:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function AtomicField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      <input
        className="input text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
      />
    </div>
  );
}
