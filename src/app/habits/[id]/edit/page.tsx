"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useHabitStore } from "@/store/habits";
import { HabitForm } from "@/components/HabitForm";

export default function EditHabitPage() {
  const params = useParams<{ id: string }>();
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === params.id));
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) load();
  }, [load, loaded]);

  if (!loaded) {
    return <div className="text-center py-20 text-zinc-400">加载中...</div>;
  }
  if (!habit) {
    return <div className="text-center py-20 text-zinc-400">习惯不存在</div>;
  }

  return <HabitForm initialHabit={habit} />;
}
