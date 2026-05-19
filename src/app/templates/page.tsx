"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HABIT_TEMPLATES, CATEGORY_LABELS } from "@/lib/templates";
import { useHabitStore } from "@/store/habits";
import type { HabitCategory } from "@/types";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const router = useRouter();
  const addHabit = useHabitStore((s) => s.addHabit);
  const [filter, setFilter] = useState<HabitCategory | "all">("all");
  const [adding, setAdding] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return HABIT_TEMPLATES;
    return HABIT_TEMPLATES.filter((t) => t.category === filter);
  }, [filter]);

  const handlePick = async (templateIdx: number) => {
    const t = HABIT_TEMPLATES[templateIdx];
    setAdding(t.name);
    await addHabit({
      name: t.name,
      description: t.description,
      icon: t.icon,
      color: t.color,
      category: t.category,
      frequency: t.frequency,
      cue: t.cue,
      reward: t.reward,
      twoMinuteVersion: t.twoMinuteVersion,
    });
    router.push("/");
  };

  return (
    <div className="animate-fade-in pb-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">习惯模板</h1>
        <p className="text-sm text-zinc-500 mt-1">
          基于《原子习惯》方法论精选，一键添加
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-4 -mx-4 px-4">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          全部
        </FilterChip>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <FilterChip
            key={key}
            active={filter === key}
            onClick={() => setFilter(key as HabitCategory)}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((t, idx) => {
          const originalIdx = HABIT_TEMPLATES.indexOf(t);
          return (
            <button
              key={t.name}
              onClick={() => handlePick(originalIdx)}
              disabled={adding === t.name}
              className="card p-4 text-left hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: `${t.color}20` }}
                >
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                    {t.description}
                  </div>
                  {t.twoMinuteVersion && (
                    <div className="text-xs text-primary-600 dark:text-primary-400 mt-1.5 line-clamp-1">
                      💡 2分钟版：{t.twoMinuteVersion}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
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
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
        active
          ? "bg-primary-600 text-white"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
      )}
    >
      {children}
    </button>
  );
}
