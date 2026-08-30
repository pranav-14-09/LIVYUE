export type IntentionCategory =
  | "health"
  | "learning"
  | "work"
  | "mind"
  | "relationships"
  | "craft"
  | "personal"
  | string;

export interface Intention {
  id: string;
  title: string;
  description?: string;
  category: IntentionCategory;
  active: boolean;
  archived?: boolean;
  orderIndex?: number;
  createdAt: string;
  updatedAt?: string;
}

export type CheckInStatus = "done" | "partial" | "missed";

export interface DailyIntentionInstance {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: CheckInStatus;
  note?: string;
  orderIndex?: number;
}

export interface CheckInItem {
  intentionId: string;
  status: CheckInStatus;
  note?: string;
  titleSnapshot?: string;
  categorySnapshot?: string;
}

export type EnergyLevel = "calm" | "clear" | "heavy" | "scattered" | "tired";

export interface DailyInsight {
  observation: string;
  interpretation: string;
  experiment: string;
  generatedAt: string;
  provenance?: string;
  categoryFocus?: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD local format
  dayMessage?: string; // "MY DAY'S MESSAGE"
  morningIntention?: string; // Morning grounding prompt / anchor
  intentions: DailyIntentionInstance[]; // Intentions chosen for this specific day
  checkIns: CheckInItem[]; // Snapshot check-ins
  eveningReflection?: string; // Evening reflection
  takeaways?: string; // Evening takeaways
  energyLevel?: EnergyLevel;
  completedEvening: boolean;
  dailyScore: number; // 0 - 100 integer percentage
  dailyInsight?: DailyInsight | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsightMetrics {
  todayScore: number;
  todayDone: number;
  todayPartial: number;
  todayMissed: number;
  todayTotal: number;
  totalDaysTracked: number;
  totalCheckIns: number;
  completedCount: number;
  partialCount: number;
  missedCount: number;
  completionRatePercent: number;
  currentStreak: number;
  longestStreak: number;
  totalReflections: number;
  reflectionRatePercent: number;
  categoryStats: Record<
    string,
    {
      total: number;
      completed: number;
      partial: number;
      missed: number;
      ratePercent: number;
    }
  >;
  observations: string[];
}

export interface UserSettings {
  userName?: string;
  morningPromptText?: string;
  eveningPromptText?: string;
  morningCheckInTime?: string;
  eveningCheckInTime?: string;
  startPage?: "today" | "history";
  showCompleted?: boolean;
  confirmBeforeDelete?: boolean;
  enableDailyInsights?: boolean;
  themeMode?: "light" | "dark";
  lastActiveDate?: string;
  installedAt: string;
}

export interface LivyueStoreData {
  version: number;
  settings: UserSettings;
  intentions: Intention[];
  entries: Record<string, DayEntry>; // Keyed by YYYY-MM-DD
}
