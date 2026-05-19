"use client";

import { useEffect } from "react";
import { useHabitStore } from "@/store/habits";
import { HabitForm } from "@/components/HabitForm";

export default function NewHabitPage() {
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) load();
  }, [load, loaded]);

  return <HabitForm />;
}
