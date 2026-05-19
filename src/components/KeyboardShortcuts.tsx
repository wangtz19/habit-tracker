"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useHabitStore } from "@/store/habits";
import { isHabitScheduledToday } from "@/lib/stats";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { key: "1-9", desc: "对第 N 个习惯打卡" },
  { key: "N", desc: "新建习惯" },
  { key: "T", desc: "回到今日" },
  { key: "S", desc: "打开统计" },
  { key: "M", desc: "模板库" },
  { key: ",", desc: "设置" },
  { key: "/", desc: "搜索（在今日页）" },
  { key: "?", desc: "显示快捷键帮助" },
  { key: "Esc", desc: "关闭弹窗" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const habits = useHabitStore((s) => s.habits);
  const toggleCheckin = useHabitStore((s) => s.toggleCheckin);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (e.key === "Escape") (target as HTMLInputElement).blur();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (/^[1-9]$/.test(e.key) && pathname === "/") {
        const idx = Number(e.key) - 1;
        const scheduledHabits = habits.filter(isHabitScheduledToday);
        const habit = scheduledHabits[idx];
        if (habit) {
          e.preventDefault();
          toggleCheckin(habit.id);
          try {
            if (navigator.vibrate) navigator.vibrate(15);
          } catch {}
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          router.push("/habits/new");
          break;
        case "t":
          e.preventDefault();
          router.push("/");
          break;
        case "s":
          e.preventDefault();
          router.push("/stats");
          break;
        case "m":
          e.preventDefault();
          router.push("/templates");
          break;
        case ",":
          e.preventDefault();
          router.push("/settings");
          break;
        case "?":
          e.preventDefault();
          setShowHelp(true);
          break;
        case "escape":
          if (showHelp) setShowHelp(false);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, pathname, habits, toggleCheckin, showHelp]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="card p-6 w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-primary-500" />
            <h3 className="font-semibold">键盘快捷键</h3>
          </div>
          <button onClick={() => setShowHelp(false)} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-zinc-600 dark:text-zinc-300">
                {s.desc}
              </span>
              <kbd className="px-2 py-0.5 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-400 mt-4 text-center">
          再按 <kbd className="px-1 font-mono">?</kbd> 关闭
        </p>
      </div>
    </div>
  );
}
