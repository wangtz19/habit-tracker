"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArchiveRestore, Trash2, Archive as ArchiveIcon } from "lucide-react";
import { useHabitStore } from "@/store/habits";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function ArchivePage() {
  const archivedHabits = useHabitStore((s) => s.archivedHabits);
  const loadArchived = useHabitStore((s) => s.loadArchived);
  const unarchiveHabit = useHabitStore((s) => s.unarchiveHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadArchived();
  }, [loadArchived]);

  return (
    <div className="animate-fade-in pb-6">
      <div className="flex items-center justify-between mb-5">
        <Link href="/settings" className="btn-ghost">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">已归档习惯</h1>
        <div className="w-10" />
      </div>

      {archivedHabits.length === 0 ? (
        <div className="text-center py-20">
          <ArchiveIcon size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">没有已归档的习惯</p>
          <p className="text-zinc-400 text-xs mt-1">
            在习惯详情页点击归档按钮可以归档
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {archivedHabits.map((habit) => (
            <div key={habit.id} className="card p-4 flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 grayscale opacity-70"
                style={{ backgroundColor: `${habit.color}20` }}
              >
                {habit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{habit.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  归档于{" "}
                  {habit.archivedAt
                    ? format(new Date(habit.archivedAt), "yyyy年M月d日", {
                        locale: zhCN,
                      })
                    : ""}
                </div>
              </div>
              <button
                onClick={() => unarchiveHabit(habit.id)}
                className="btn-ghost text-primary-500"
                aria-label="恢复"
                title="恢复"
              >
                <ArchiveRestore size={18} />
              </button>
              <button
                onClick={() => setConfirmDelete(habit.id)}
                className="btn-ghost text-red-500"
                aria-label="永久删除"
                title="永久删除"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="card p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-2">永久删除？</h3>
            <p className="text-sm text-zinc-500 mb-4">
              所有打卡记录将一并删除，不可恢复。
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                取消
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
                onClick={async () => {
                  await deleteHabit(confirmDelete);
                  setConfirmDelete(null);
                  loadArchived();
                }}
              >
                永久删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
