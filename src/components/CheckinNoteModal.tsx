"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHabitStore } from "@/store/habits";

interface Props {
  habitId: string;
  date: string;
  open: boolean;
  onClose: () => void;
}

const MOOD_OPTIONS: Array<{ value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }> = [
  { value: 1, emoji: "😞", label: "很差" },
  { value: 2, emoji: "😕", label: "一般" },
  { value: 3, emoji: "😐", label: "还行" },
  { value: 4, emoji: "🙂", label: "不错" },
  { value: 5, emoji: "😄", label: "很棒" },
];

export function CheckinNoteModal({ habitId, date, open, onClose }: Props) {
  const checkin = useHabitStore((s) =>
    s.checkins.find((c) => c.habitId === habitId && c.date === date)
  );
  const updateCheckin = useHabitStore((s) => s.updateCheckin);

  const [note, setNote] = useState("");
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined);

  useEffect(() => {
    if (open && checkin) {
      setNote(checkin.note ?? "");
      setMood(checkin.mood);
    }
  }, [open, checkin]);

  const handleSave = async () => {
    if (!checkin) return;
    await updateCheckin(habitId, date, { note: note.trim() || undefined, mood });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">记一笔</h3>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-zinc-500 mb-2">心情</label>
          <div className="flex justify-between gap-1">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(mood === m.value ? undefined : m.value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all active:scale-95",
                  mood === m.value
                    ? "bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500"
                    : "bg-zinc-50 dark:bg-zinc-800/50"
                )}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] text-zinc-500">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs text-zinc-500 mb-2">备注（可选）</label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="今天的感受 / 完成情况..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
          <div className="text-right text-[10px] text-zinc-400 mt-1">
            {note.length}/200
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            取消
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
