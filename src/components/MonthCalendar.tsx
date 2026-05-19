"use client";

import { useMemo, useRef, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, toDateKey } from "@/lib/utils";

interface Props {
  checkinDates: Set<string>;
  color: string;
  onDayClick?: (dateKey: string) => void;
  onDayLongPress?: (dateKey: string) => void;
}

export function MonthCalendar({
  checkinDates,
  color,
  onDayClick,
  onDayLongPress,
}: Props) {
  const [monthCursor, setMonthCursor] = useState(new Date());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const handlePointerDown = (key: string) => {
    if (!onDayLongPress) return;
    longPressed.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      try {
        if (navigator.vibrate) navigator.vibrate(30);
      } catch {}
      onDayLongPress(key);
    }, 500);
  };

  const handlePointerEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 0 });
    const list: Date[] = [];
    let cur = start;
    while (cur <= end) {
      list.push(cur);
      cur = new Date(cur.getTime() + 86400000);
    }
    return list;
  }, [monthCursor]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          className="btn-ghost"
          onClick={() => setMonthCursor(subMonths(monthCursor, 1))}
          aria-label="上个月"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-medium">
          {format(monthCursor, "yyyy年 M月", { locale: zhCN })}
        </div>
        <button
          className="btn-ghost"
          onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
          aria-label="下个月"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-zinc-400 text-center mb-2">
        {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = isSameMonth(day, monthCursor);
          const checked = checkinDates.has(key);
          const today = isToday(day);
          return (
            <button
              key={key}
              onClick={() => {
                if (longPressed.current) {
                  longPressed.current = false;
                  return;
                }
                onDayClick?.(key);
              }}
              onPointerDown={() => handlePointerDown(key)}
              onPointerUp={handlePointerEnd}
              onPointerLeave={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className={cn(
                "aspect-square rounded-lg text-sm flex items-center justify-center transition-all relative",
                !inMonth && "opacity-30",
                today && "ring-2 ring-primary-500",
                !checked && "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
              style={
                checked
                  ? { backgroundColor: color, color: "white" }
                  : undefined
              }
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
