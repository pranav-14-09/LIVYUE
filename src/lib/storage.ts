import {
  CheckInStatus,
  DailyIntentionInstance,
  DayEntry,
  EnergyLevel,
  Intention,
  IntentionCategory,
  LivyueStoreData,
  UserSettings,
} from "./types";
import { calculateDailyScore, generateDailyInsight } from "./insights";

/**
 * Returns the current date in local YYYY-MM-DD format based on browser/device time.
 */
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Determines the dynamic time-of-day phase strictly based on the user's local time:
 * - 12:00 AM – 4:59 AM -> NIGHT (0:00 - 4:59)
 * - 5:00 AM – 11:59 AM -> MORNING (5:00 - 11:59)
 * - 12:00 PM – 4:59 PM -> AFTERNOON (12:00 - 16:59)
 * - 5:00 PM – 6:59 PM -> EVENING (17:00 - 18:59)
 * - 7:00 PM – 11:59 PM -> NIGHT (19:00 - 23:59)
 */
export function getTimeOfDayPhase(
  d: Date = new Date()
): "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" {
  const hour = d.getHours();
  if (hour >= 5 && hour < 12) {
    return "MORNING";
  }
  if (hour >= 12 && hour < 17) {
    return "AFTERNOON";
  }
  if (hour >= 17 && hour < 19) {
    return "EVENING";
  }
  return "NIGHT";
}

export function formatDateLabel(dateString: string): string {
  try {
    const [y, m, d] = dateString.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    const [y, m, d] = dateString.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function createDefaultStore(): LivyueStoreData {
  return {
    version: 1,
    settings: {
      userName: "",
      morningPromptText: "What is one thing that would make today feel well-lived?",
      eveningPromptText: "What was most meaningful or challenging about today?",
      morningCheckInTime: "08:00",
      eveningCheckInTime: "21:00",
      startPage: "today",
      showCompleted: true,
      confirmBeforeDelete: true,
      enableDailyInsights: true,
      themeMode: "light",
      installedAt: new Date().toISOString(),
      lastActiveDate: undefined,
    },
    intentions: [],
    entries: {},
  };
}

let currentStorageKey = "livyue_store_v1";
let activeSelectedDate: string | null = null;

// In-memory store instance
let storeInstance: LivyueStoreData = createDefaultStore();
let isInitialized = false;
const listeners = new Set<() => void>();

export function getSelectedDate(): string | null {
  return activeSelectedDate;
}

export function setSelectedDate(date: string | null): void {
  activeSelectedDate = date;
  notifyListeners();
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error("Listener callback failed:", err);
    }
  });
}

// Undo tracking stacks
let lastDeletedIntention: {
  date: string;
  intention: DailyIntentionInstance;
  index: number;
} | null = null;

let lastDeletedDay: {
  date: string;
  entry: DayEntry;
} | null = null;

export function getLastDeletedIntention() {
  return lastDeletedIntention;
}

export function getLastDeletedDay() {
  return lastDeletedDay;
}

export function clearLastDeletedIntention() {
  lastDeletedIntention = null;
}

export function clearLastDeletedDay() {
  lastDeletedDay = null;
}

export function setLastDeletedIntention(item: {
  date: string;
  intention: DailyIntentionInstance;
  index: number;
}) {
  lastDeletedIntention = item;
}

export function setLastDeletedDay(item: { date: string; entry: DayEntry }) {
  lastDeletedDay = item;
}

export function setUserStorageScope(userId: string | null): void {
  const newKey = userId ? `livyue_store_${userId}` : "livyue_store_guest";
  if (currentStorageKey === newKey && isInitialized) return;

  currentStorageKey = newKey;
  isInitialized = true;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(currentStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as LivyueStoreData;
        if (parsed && parsed.entries) {
          storeInstance = parsed;
          notifyListeners();
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load scoped storage:", err);
    }
  }

  // Only reset to empty if there was no existing memory
  if (!userId) {
    storeInstance = createDefaultStore();
    notifyListeners();
  }
}

function initClientStore() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;
  try {
    const raw = localStorage.getItem(currentStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as LivyueStoreData;
      if (parsed && parsed.entries) {
        if (!Array.isArray(parsed.intentions)) {
          parsed.intentions = [];
        }
        for (const [key, entry] of Object.entries(parsed.entries)) {
          if (!entry.intentions || !Array.isArray(entry.intentions)) {
            const checkIns = entry.checkIns || [];
            entry.intentions = checkIns.map((c) => ({
              id: c.intentionId,
              title: c.titleSnapshot || "Intention",
              category: c.categorySnapshot || "personal",
              status: c.status || "missed",
              note: c.note || "",
            }));
          }
          entry.dailyScore = calculateDailyScore(entry.intentions);
          parsed.entries[key] = entry;
        }

        storeInstance = parsed;
        return;
      }
    }
  } catch (err) {
    console.error("Failed to initialize LIVYUE storage:", err);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === currentStorageKey && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as LivyueStoreData;
        if (parsed && parsed.entries) {
          storeInstance = parsed;
          notifyListeners();
        }
      } catch (err) {
        console.error("Failed to parse storage update:", err);
      }
    }
  });
}

export function getServerStore(): LivyueStoreData {
  return storeInstance;
}

export function getStore(): LivyueStoreData {
  if (typeof window !== "undefined" && !isInitialized) {
    initClientStore();
  }
  return storeInstance;
}

export function saveStore(data: LivyueStoreData): void {
  storeInstance = data;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(currentStorageKey, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save LIVYUE store cache:", err);
    }
  }
  notifyListeners();
}

export function loadCloudStore(cloudData: LivyueStoreData): void {
  storeInstance = {
    version: 1,
    settings: cloudData.settings,
    intentions: cloudData.intentions || [],
    entries: cloudData.entries || {},
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(currentStorageKey, JSON.stringify(storeInstance));
    } catch (err) {
      console.error("Failed to cache LIVYUE store:", err);
    }
  }
  notifyListeners();
}

export function subscribeToStore(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Retrieves the daily record for a specific date (defaulting to current local date).
 * If no record exists for that date, creates a fresh empty daily record.
 */
export function getTodayEntry(
  store: LivyueStoreData,
  targetDate?: string
): DayEntry {
  const dateKey = targetDate || getTodayDateString();
  const existing = store.entries[dateKey];

  if (existing) {
    if (Array.isArray(existing.intentions)) {
      return existing;
    }

    const migratedIntentions: DailyIntentionInstance[] = (
      existing.checkIns || []
    ).map((c) => ({
      id: c.intentionId,
      title: c.titleSnapshot || "Intention",
      category: c.categorySnapshot || "personal",
      status: c.status || "missed",
      note: c.note || "",
    }));

    return {
      ...existing,
      intentions: migratedIntentions,
      dailyScore: calculateDailyScore(migratedIntentions),
    };
  }

  // Initial fresh, empty entry for the date (no carry-over from previous days)
  const freshEntry: DayEntry = {
    date: dateKey,
    dayMessage: "",
    morningIntention: "",
    intentions: [],
    checkIns: [],
    eveningReflection: "",
    takeaways: "",
    completedEvening: false,
    dailyScore: 0,
    dailyInsight: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return freshEntry;
}

// 1. MORNING OPERATIONS
export function addMorningIntention(
  date: string,
  item: { title: string; category: string; description?: string }
): DailyIntentionInstance {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const newId = `int_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newDailyInstance: DailyIntentionInstance = {
    id: newId,
    title: item.title.trim(),
    description: item.description?.trim() || undefined,
    category: item.category.trim() || "personal",
    status: "missed",
    note: "",
    orderIndex: entry.intentions.length,
  };

  const updatedIntentions = [...entry.intentions, newDailyInstance];
  const updatedCheckIns = [
    ...(entry.checkIns || []),
    {
      intentionId: newId,
      status: "missed" as const,
      titleSnapshot: newDailyInstance.title,
      categorySnapshot: newDailyInstance.category,
    },
  ];

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    intentions: updatedIntentions,
    checkIns: updatedCheckIns,
    dailyScore: calculateDailyScore(updatedIntentions),
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
    settings: {
      ...store.settings,
      lastActiveDate: date,
    },
  };

  saveStore(updatedStore);
  return newDailyInstance;
}

export function updateMorningIntention(
  date: string,
  item: { id: string; title: string; category: string; description?: string }
): void {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const updatedIntentions = entry.intentions.map((i) =>
    i.id === item.id
      ? {
          ...i,
          title: item.title.trim(),
          category: item.category.trim() || "personal",
          description: item.description?.trim() || undefined,
        }
      : i
  );

  const updatedCheckIns = (entry.checkIns || []).map((c) =>
    c.intentionId === item.id
      ? {
          ...c,
          titleSnapshot: item.title.trim(),
          categorySnapshot: item.category.trim(),
        }
      : c
  );

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    intentions: updatedIntentions,
    checkIns: updatedCheckIns,
    dailyScore: calculateDailyScore(updatedIntentions),
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
  };

  saveStore(updatedStore);
}

export function deleteMorningIntention(date: string, intentionId: string): void {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const targetIndex = entry.intentions.findIndex((i) => i.id === intentionId);
  const targetIntention = entry.intentions[targetIndex];

  if (targetIntention) {
    lastDeletedIntention = {
      date,
      intention: targetIntention,
      index: targetIndex,
    };
  }

  const updatedIntentions = entry.intentions.filter(
    (i) => i.id !== intentionId
  );
  const updatedCheckIns = (entry.checkIns || []).filter(
    (c) => c.intentionId !== intentionId
  );

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    intentions: updatedIntentions,
    checkIns: updatedCheckIns,
    dailyScore: calculateDailyScore(updatedIntentions),
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
  };

  saveStore(updatedStore);
}

export function undoDeleteIntention(): boolean {
  if (!lastDeletedIntention) return false;

  const { date, intention, index } = lastDeletedIntention;
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const updatedIntentions = [...entry.intentions];
  if (index >= 0 && index <= updatedIntentions.length) {
    updatedIntentions.splice(index, 0, intention);
  } else {
    updatedIntentions.push(intention);
  }

  const updatedCheckIns = [
    ...(entry.checkIns || []),
    {
      intentionId: intention.id,
      status: intention.status,
      titleSnapshot: intention.title,
      categorySnapshot: intention.category,
      note: intention.note,
    },
  ];

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    intentions: updatedIntentions,
    checkIns: updatedCheckIns,
    dailyScore: calculateDailyScore(updatedIntentions),
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
  };

  lastDeletedIntention = null;
  saveStore(updatedStore);
  return true;
}

// 2. DAY'S MESSAGE
export function saveDayMessage(date: string, message: string): void {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    dayMessage: message.trim(),
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
  };

  saveStore(updatedStore);
}

export function deleteDayMessage(date: string): void {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    dayMessage: "",
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
  };

  saveStore(updatedStore);
}

// 3. EVENING STATUS EVALUATION
export function updateEveningStatus(
  date: string,
  intentionId: string,
  status: CheckInStatus,
  note?: string
): void {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const updatedIntentions = entry.intentions.map((item) => {
    if (item.id === intentionId) {
      return {
        ...item,
        status,
        note: note !== undefined ? note : item.note,
      };
    }
    return item;
  });

  const updatedCheckIns = (entry.checkIns || []).map((item) => {
    if (item.intentionId === intentionId) {
      return {
        ...item,
        status,
        note: note !== undefined ? note : item.note,
      };
    }
    return item;
  });

  const dailyScore = calculateDailyScore(updatedIntentions);
  const updatedEntry: DayEntry = {
    ...entry,
    date,
    intentions: updatedIntentions,
    checkIns: updatedCheckIns,
    dailyScore,
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
    settings: {
      ...store.settings,
      lastActiveDate: date,
    },
  };

  saveStore(updatedStore);
}

export function updateEveningNote(
  date: string,
  intentionId: string,
  note: string
): void {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const updatedIntentions = entry.intentions.map((item) =>
    item.id === intentionId ? { ...item, note } : item
  );

  const updatedCheckIns = (entry.checkIns || []).map((item) =>
    item.intentionId === intentionId ? { ...item, note } : item
  );

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    intentions: updatedIntentions,
    checkIns: updatedCheckIns,
    updatedAt: new Date().toISOString(),
  };

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
  };

  saveStore(updatedStore);
}

// 4. EVENING REFLECTION & TAKEAWAYS
export function saveEveningReflection(
  date: string,
  reflection: string,
  takeaways?: string,
  energyLevel?: EnergyLevel
): void {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    eveningReflection: reflection.trim(),
    takeaways: takeaways !== undefined ? takeaways.trim() : entry.takeaways,
    energyLevel: energyLevel !== undefined ? energyLevel : entry.energyLevel,
    completedEvening: true,
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
    settings: {
      ...store.settings,
      lastActiveDate: date,
    },
  };

  saveStore(updatedStore);
}

export function saveEveningTakeaways(date: string, takeaways: string): void {
  const store = getStore();
  const entry = store.entries[date] || getTodayEntry(store, date);

  const updatedEntry: DayEntry = {
    ...entry,
    date,
    takeaways: takeaways.trim(),
    updatedAt: new Date().toISOString(),
  };

  updatedEntry.dailyInsight = generateDailyInsight(updatedEntry);

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: updatedEntry,
    },
  };

  saveStore(updatedStore);
}

// 5. HISTORY: DELETE DAY & UNDO
export function deleteDay(date: string): DayEntry | null {
  const store = getStore();
  const targetEntry = store.entries[date];
  if (!targetEntry) return null;

  lastDeletedDay = {
    date,
    entry: targetEntry,
  };

  const updatedEntries = { ...store.entries };
  delete updatedEntries[date];

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: updatedEntries,
  };

  saveStore(updatedStore);
  return targetEntry;
}

export function undoDeleteDay(): boolean {
  if (!lastDeletedDay) return false;

  const { date, entry } = lastDeletedDay;
  const store = getStore();

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: {
      ...store.entries,
      [date]: entry,
    },
  };

  lastDeletedDay = null;
  saveStore(updatedStore);
  return true;
}

// Global Intentions Management (if needed)
export function addIntention(item: {
  title: string;
  description?: string;
  category: IntentionCategory;
}): Intention {
  const today = getTodayDateString();
  const daily = addMorningIntention(today, item);
  return {
    id: daily.id,
    title: daily.title,
    description: daily.description,
    category: daily.category,
    active: true,
    archived: false,
    createdAt: new Date().toISOString(),
  };
}

export function updateIntention(intention: Intention): void {
  const today = getTodayDateString();
  updateMorningIntention(today, {
    id: intention.id,
    title: intention.title,
    category: intention.category,
    description: intention.description,
  });
}

export function deleteIntention(id: string): void {
  const today = getTodayDateString();
  deleteMorningIntention(today, id);
}

export function toggleIntentionActive(id: string): void {
  const store = getStore();
  const target = store.intentions.find((i) => i.id === id);
  if (!target) return;

  const nextActive = !target.active;
  const updatedStore: LivyueStoreData = {
    ...store,
    intentions: store.intentions.map((i) =>
      i.id === id ? { ...i, active: nextActive, archived: !nextActive } : i
    ),
  };
  saveStore(updatedStore);
}

export function reorderIntentions(orderedIds: string[]): void {
  const store = getStore();
  const idMap = new Map(orderedIds.map((id, index) => [id, index]));

  const updatedIntentions = [...store.intentions].sort((a, b) => {
    const idxA = idMap.has(a.id) ? idMap.get(a.id)! : a.orderIndex || 0;
    const idxB = idMap.has(b.id) ? idMap.get(b.id)! : b.orderIndex || 0;
    return idxA - idxB;
  });

  const updatedStore: LivyueStoreData = {
    ...store,
    intentions: updatedIntentions.map((item, idx) => ({
      ...item,
      orderIndex: idx,
    })),
  };

  saveStore(updatedStore);
}

export function updateSettings(partial: Partial<UserSettings>): void {
  const store = getStore();
  const updatedStore: LivyueStoreData = {
    ...store,
    settings: { ...store.settings, ...partial },
  };
  saveStore(updatedStore);
}

export function checkReturningStatus(store: LivyueStoreData): {
  isReturning: boolean;
  daysAway: number;
  lastDate?: string;
} {
  const today = getTodayDateString();
  const lastActive = store.settings.lastActiveDate;

  if (!lastActive || lastActive === today) {
    return { isReturning: false, daysAway: 0, lastDate: lastActive };
  }

  const [ty, tm, td] = today.split("-").map(Number);
  const [ly, lm, ld] = lastActive.split("-").map(Number);

  const tDate = new Date(ty, tm - 1, td);
  const lDate = new Date(ly, lm - 1, ld);

  const diffMs = tDate.getTime() - lDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 2) {
    return { isReturning: true, daysAway: diffDays, lastDate: lastActive };
  }

  return { isReturning: false, daysAway: diffDays, lastDate: lastActive };
}

export function exportStoreAsJSON(): string {
  const store = getStore();
  return JSON.stringify(store, null, 2);
}

export function importStoreFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as LivyueStoreData;
    if (!data.entries) {
      throw new Error("Invalid LIVYUE backup structure");
    }
    saveStore(data);
    return true;
  } catch (err) {
    console.error("Failed to import backup:", err);
    return false;
  }
}

export function clearAllData(): void {
  const emptyStore = createDefaultStore();
  lastDeletedIntention = null;
  lastDeletedDay = null;
  saveStore(emptyStore);
}

export function clearHistoryOnly(): void {
  const store = getStore();
  const today = getTodayDateString();
  const todayEntry = store.entries[today];

  const updatedStore: LivyueStoreData = {
    ...store,
    entries: todayEntry ? { [today]: todayEntry } : {},
  };
  lastDeletedIntention = null;
  lastDeletedDay = null;
  saveStore(updatedStore);
}

export function resetStore(): void {
  const fresh = createDefaultStore();
  lastDeletedIntention = null;
  lastDeletedDay = null;
  saveStore(fresh);
}
