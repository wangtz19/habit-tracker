import { create } from "zustand";
import type { Habit, Checkin } from "@/types";
import * as db from "@/lib/db";
import { uid, todayKey } from "@/lib/utils";

interface HabitStore {
  habits: Habit[];
  checkins: Checkin[];
  archivedHabits: Habit[];
  loaded: boolean;
  loading: boolean;

  load: () => Promise<void>;
  loadArchived: () => Promise<void>;
  unarchiveHabit: (id: string) => Promise<void>;
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "order">) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  toggleCheckin: (habitId: string, date?: string) => Promise<boolean>;
  updateCheckin: (
    habitId: string,
    date: string,
    updates: { note?: string; mood?: 1 | 2 | 3 | 4 | 5 }
  ) => Promise<void>;
  reorderHabits: (orderedIds: string[]) => Promise<void>;
  importData: (data: { habits: Habit[]; checkins: Checkin[] }) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  checkins: [],
  archivedHabits: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [habits, checkins] = await Promise.all([
        db.getAllHabits(),
        db.getAllCheckins(),
      ]);
      set({ habits, checkins, loaded: true, loading: false });
    } catch (err) {
      console.error("Failed to load data:", err);
      set({ loading: false });
    }
  },

  addHabit: async (input) => {
    const habits = get().habits;
    const habit: Habit = {
      ...input,
      id: uid(),
      createdAt: Date.now(),
      order: habits.length,
    };
    await db.saveHabit(habit);
    set({ habits: [...habits, habit] });
    return habit;
  },

  updateHabit: async (id, updates) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;
    const updated = { ...habit, ...updates };
    await db.saveHabit(updated);
    set({ habits: get().habits.map((h) => (h.id === id ? updated : h)) });
  },

  deleteHabit: async (id) => {
    await db.deleteHabit(id);
    set({
      habits: get().habits.filter((h) => h.id !== id),
      checkins: get().checkins.filter((c) => c.habitId !== id),
    });
  },

  archiveHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;
    const updated = { ...habit, archivedAt: Date.now() };
    await db.saveHabit(updated);
    set({ habits: get().habits.filter((h) => h.id !== id) });
  },

  loadArchived: async () => {
    const all = await db.getAllHabits(true);
    set({ archivedHabits: all.filter((h) => h.archivedAt) });
  },

  unarchiveHabit: async (id) => {
    const habit = get().archivedHabits.find((h) => h.id === id);
    if (!habit) return;
    const { archivedAt: _omit, ...rest } = habit;
    const updated = rest as Habit;
    await db.saveHabit(updated);
    set({
      habits: [...get().habits, updated].sort((a, b) => a.order - b.order),
      archivedHabits: get().archivedHabits.filter((h) => h.id !== id),
    });
  },

  toggleCheckin: async (habitId, date) => {
    const dateKey = date ?? todayKey();
    const existing = get().checkins.find(
      (c) => c.habitId === habitId && c.date === dateKey
    );
    if (existing) {
      await db.deleteCheckin(existing.id);
      set({
        checkins: get().checkins.filter((c) => c.id !== existing.id),
      });
      return false;
    } else {
      const checkin: Checkin = {
        id: uid(),
        habitId,
        date: dateKey,
        createdAt: Date.now(),
      };
      await db.saveCheckin(checkin);
      set({ checkins: [...get().checkins, checkin] });
      return true;
    }
  },

  updateCheckin: async (habitId, date, updates) => {
    const existing = get().checkins.find(
      (c) => c.habitId === habitId && c.date === date
    );
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await db.saveCheckin(updated);
    set({
      checkins: get().checkins.map((c) =>
        c.id === existing.id ? updated : c
      ),
    });
  },

  reorderHabits: async (orderedIds) => {
    const habitsMap = new Map(get().habits.map((h) => [h.id, h]));
    const reordered: Habit[] = [];
    for (let i = 0; i < orderedIds.length; i++) {
      const h = habitsMap.get(orderedIds[i]);
      if (h) {
        const updated = { ...h, order: i };
        reordered.push(updated);
        await db.saveHabit(updated);
      }
    }
    set({ habits: reordered });
  },

  importData: async ({ habits, checkins }) => {
    await db.clearAll();
    for (const h of habits) await db.saveHabit(h);
    for (const c of checkins) await db.saveCheckin(c);
    set({ habits, checkins });
  },

  clearAll: async () => {
    await db.clearAll();
    set({ habits: [], checkins: [] });
  },
}));
