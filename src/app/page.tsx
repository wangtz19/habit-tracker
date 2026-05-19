"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, ArrowUpDown, Check } from "lucide-react";
import { useHabitStore } from "@/store/habits";
import { HabitCard } from "@/components/HabitCard";
import { EmptyState } from "@/components/EmptyState";
import { HomeWidgets } from "@/components/HomeWidgets";
import { SortableList } from "@/components/SortableList";
import { CheckinNoteModal } from "@/components/CheckinNoteModal";
import { todayKey, cn } from "@/lib/utils";
import { isHabitScheduledToday } from "@/lib/stats";
import { CATEGORY_LABELS } from "@/lib/templates";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { HabitCategory } from "@/types";

export default function HomePage() {
  const habits = useHabitStore((s) => s.habits);
  const checkins = useHabitStore((s) => s.checkins);
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);
  const reorderHabits = useHabitStore((s) => s.reorderHabits);

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<HabitCategory | "all">(
    "all"
  );
  const [sortMode, setSortMode] = useState(false);
  const [noteModalState, setNoteModalState] = useState<{
    habitId: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const today = todayKey();

  const filteredHabits = useMemo(() => {
    let result = habits;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.description?.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") {
      result = result.filter((h) => h.category === filterCategory);
    }
    return result;
  }, [habits, search, filterCategory]);

  const { scheduled, completed } = useMemo(() => {
    const scheduledHabits = habits.filter(isHabitScheduledToday);
    const completedCount = scheduledHabits.filter((h) =>
      checkins.some((c) => c.habitId === h.id && c.date === today)
    ).length;
    return {
      scheduled: scheduledHabits.length,
      completed: completedCount,
    };
  }, [habits, checkins, today]);

  const dateLabel = format(new Date(), "M月d日 EEEE", { locale: zhCN });

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        加载中...
      </div>
    );
  }

  if (habits.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">今日</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {dateLabel} · 完成 {completed}/{scheduled}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={cn(
              "btn-ghost",
              searchOpen && "text-primary-600 dark:text-primary-400"
            )}
            aria-label="搜索"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => setSortMode(!sortMode)}
            className={cn(
              "btn-ghost",
              sortMode && "text-primary-600 dark:text-primary-400"
            )}
            aria-label="排序"
          >
            {sortMode ? <Check size={18} /> : <ArrowUpDown size={18} />}
          </button>
          <Link
            href="/habits/new"
            className="btn-ghost flex items-center gap-1 text-primary-600 dark:text-primary-400"
          >
            <Plus size={20} />
          </Link>
        </div>
      </div>

      <HomeWidgets completed={completed} scheduled={scheduled} />

      {searchOpen && (
        <div className="mb-4 animate-fade-in space-y-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              className="input pl-9 pr-9"
              placeholder="搜索习惯..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
            <FilterChip
              active={filterCategory === "all"}
              onClick={() => setFilterCategory("all")}
            >
              全部
            </FilterChip>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <FilterChip
                key={key}
                active={filterCategory === key}
                onClick={() => setFilterCategory(key as HabitCategory)}
              >
                {label}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      {sortMode && (
        <div className="mb-3 px-3 py-2 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-xs rounded-lg">
          📦 排序模式：拖拽习惯卡片调整顺序（手机长按再拖）
        </div>
      )}

      {filteredHabits.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">
          没有找到匹配的习惯
        </div>
      ) : sortMode ? (
        <SortableList
          items={filteredHabits}
          getId={(h) => h.id}
          onReorder={reorderHabits}
          renderItem={(habit) => <HabitCard habit={habit} sortMode />}
        />
      ) : (
        <div className="space-y-3">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onLongPress={() =>
                setNoteModalState({ habitId: habit.id, date: today })
              }
            />
          ))}
        </div>
      )}

      {scheduled > 0 && completed === scheduled && (
        <div className="text-center mt-8 text-zinc-500 animate-fade-in">
          🎉 今天全部完成！明天见。
        </div>
      )}

      {noteModalState && (
        <CheckinNoteModal
          habitId={noteModalState.habitId}
          date={noteModalState.date}
          open
          onClose={() => setNoteModalState(null)}
        />
      )}
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
        "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
        active
          ? "bg-primary-600 text-white"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
      )}
    >
      {children}
    </button>
  );
}
