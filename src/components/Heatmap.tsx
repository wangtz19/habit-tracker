"use client";

import { useMemo } from "react";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  checkinDates: Set<string>;
  color: string;
  days?: number;
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function Heatmap({ checkinDates, color, days = 365 }: Props) {
  const cells = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(subDays(today, days - 1), { weekStartsOn: 0 });
    const totalDays = Math.ceil((today.getTime() - start.getTime()) / 86400000) + 1;
    const weeks: Array<Array<{ date: string; checked: boolean; future: boolean }>> = [];

    let cursor = start;
    for (let w = 0; w < Math.ceil(totalDays / 7); w++) {
      const week: Array<{ date: string; checked: boolean; future: boolean }> = [];
      for (let d = 0; d < 7; d++) {
        const dateKey = format(cursor, "yyyy-MM-dd");
        week.push({
          date: dateKey,
          checked: checkinDates.has(dateKey),
          future: cursor > today,
        });
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [checkinDates, days]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ week: number; label: string }> = [];
    let lastMonth = -1;
    cells.forEach((week, i) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        labels.push({ week: i, label: format(firstDay, "M月") });
        lastMonth = month;
      }
    });
    return labels;
  }, [cells]);

  return (
    <div className="overflow-x-auto scrollbar-thin pb-2">
      <div className="inline-flex flex-col gap-1 min-w-fit">
        <div className="flex gap-1 pl-7 mb-1 text-[10px] text-zinc-400">
          {cells.map((_, i) => {
            const label = monthLabels.find((m) => m.week === i);
            return (
              <div key={i} className="w-3 text-center">
                {label?.label ?? ""}
              </div>
            );
          })}
        </div>

        <div className="flex gap-1">
          <div className="flex flex-col gap-1 text-[10px] text-zinc-400 pr-1">
            {WEEKDAY_LABELS.map((d, i) => (
              <div key={i} className="h-3 w-4 flex items-center justify-center">
                {i % 2 === 1 ? d : ""}
              </div>
            ))}
          </div>

          {cells.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((cell, dIdx) => (
                <div
                  key={dIdx}
                  className={cn(
                    "w-3 h-3 rounded-sm transition-transform hover:scale-125",
                    cell.future && "opacity-0",
                    !cell.checked &&
                      !cell.future &&
                      "bg-zinc-100 dark:bg-zinc-800"
                  )}
                  style={
                    cell.checked
                      ? { backgroundColor: color }
                      : undefined
                  }
                  title={
                    cell.future
                      ? ""
                      : `${cell.date}${cell.checked ? " · 已打卡" : ""}`
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
