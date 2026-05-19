import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Habit, Checkin } from "@/types";

interface HabitDB extends DBSchema {
  habits: {
    key: string;
    value: Habit;
    indexes: { "by-order": number; "by-archived": number };
  };
  checkins: {
    key: string;
    value: Checkin;
    indexes: { "by-habit-date": [string, string]; "by-date": string };
  };
}

const DB_NAME = "habit-tracker";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HabitDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is not available on the server");
  }
  if (!dbPromise) {
    dbPromise = openDB<HabitDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("habits")) {
          const habitStore = db.createObjectStore("habits", { keyPath: "id" });
          habitStore.createIndex("by-order", "order");
          habitStore.createIndex("by-archived", "archivedAt");
        }
        if (!db.objectStoreNames.contains("checkins")) {
          const checkinStore = db.createObjectStore("checkins", {
            keyPath: "id",
          });
          checkinStore.createIndex("by-habit-date", ["habitId", "date"], {
            unique: true,
          });
          checkinStore.createIndex("by-date", "date");
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllHabits(includeArchived = false): Promise<Habit[]> {
  const db = await getDB();
  const habits = await db.getAll("habits");
  const filtered = includeArchived
    ? habits
    : habits.filter((h) => !h.archivedAt);
  return filtered.sort((a, b) => a.order - b.order);
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  const db = await getDB();
  return db.get("habits", id);
}

export async function saveHabit(habit: Habit): Promise<void> {
  const db = await getDB();
  await db.put("habits", habit);
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["habits", "checkins"], "readwrite");
  await tx.objectStore("habits").delete(id);
  const checkinIndex = tx.objectStore("checkins").index("by-habit-date");
  let cursor = await checkinIndex.openCursor(
    IDBKeyRange.bound([id, ""], [id, "\uffff"])
  );
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function getCheckinsForHabit(
  habitId: string
): Promise<Checkin[]> {
  const db = await getDB();
  const index = db.transaction("checkins").store.index("by-habit-date");
  return index.getAll(IDBKeyRange.bound([habitId, ""], [habitId, "\uffff"]));
}

export async function getCheckinsForDate(date: string): Promise<Checkin[]> {
  const db = await getDB();
  return db.getAllFromIndex("checkins", "by-date", date);
}

export async function getCheckinsInRange(
  startDate: string,
  endDate: string
): Promise<Checkin[]> {
  const db = await getDB();
  return db.getAllFromIndex(
    "checkins",
    "by-date",
    IDBKeyRange.bound(startDate, endDate)
  );
}

export async function getCheckin(
  habitId: string,
  date: string
): Promise<Checkin | undefined> {
  const db = await getDB();
  const results = await db.getAllFromIndex("checkins", "by-habit-date", [
    habitId,
    date,
  ]);
  return results[0];
}

export async function saveCheckin(checkin: Checkin): Promise<void> {
  const db = await getDB();
  await db.put("checkins", checkin);
}

export async function deleteCheckin(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("checkins", id);
}

export async function getAllCheckins(): Promise<Checkin[]> {
  const db = await getDB();
  return db.getAll("checkins");
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["habits", "checkins"], "readwrite");
  await tx.objectStore("habits").clear();
  await tx.objectStore("checkins").clear();
  await tx.done;
}
