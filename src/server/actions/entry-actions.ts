"use server";

import { createClient } from "@/lib/supabase/server";
import {
  CheckInStatus,
  DailyIntentionInstance,
  DayEntry,
  EnergyLevel,
  LivyueStoreData,
  UserSettings,
} from "@/lib/types";
import { calculateDailyScore, generateDailyInsight } from "@/lib/insights";

export interface ServerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function checkSupabaseConfig(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("placeholder-project") || key.includes(".placeholder")) {
    return "Supabase credentials are not configured.";
  }

  return null;
}

/**
 * Fetches the entire stored data for the authenticated user from Supabase.
 */
export async function fetchUserStoreAction(): Promise<ServerResponse<LivyueStoreData>> {
  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 1. Fetch User Settings
    const { data: settingsRow } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const userSettings: UserSettings = {
      userName: settingsRow?.user_name || user.user_metadata?.name || "",
      morningPromptText:
        settingsRow?.morning_prompt_text ||
        "What is one thing that would make today feel well-lived?",
      eveningPromptText:
        settingsRow?.evening_prompt_text ||
        "What was most meaningful or challenging about today?",
      morningCheckInTime: settingsRow?.morning_check_in_time || "08:00",
      eveningCheckInTime: settingsRow?.evening_check_in_time || "21:00",
      startPage: settingsRow?.start_page || "today",
      showCompleted: settingsRow?.show_completed ?? true,
      confirmBeforeDelete: settingsRow?.confirm_before_delete ?? true,
      enableDailyInsights: settingsRow?.enable_daily_insights ?? true,
      themeMode: (settingsRow?.theme_mode as "light" | "dark") || "light",
      lastActiveDate: settingsRow?.last_active_date || undefined,
      installedAt: settingsRow?.created_at || new Date().toISOString(),
    };

    // 2. Fetch Day Entries with nested Daily Intentions
    const { data: dayRows, error: dayError } = await supabase
      .from("day_entries")
      .select(`
        *,
        daily_intentions (*)
      `)
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (dayError) {
      console.error("Error fetching day entries:", dayError);
      return { success: false, error: dayError.message };
    }

    const entries: Record<string, DayEntry> = {};

    if (dayRows) {
      for (const row of dayRows) {
        const rawIntentions = (row.daily_intentions || []) as {
          id: string;
          title: string;
          description?: string;
          category: string;
          status: CheckInStatus;
          note?: string;
          order_index: number;
        }[];

        rawIntentions.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

        const intentions: DailyIntentionInstance[] = rawIntentions.map((i) => ({
          id: i.id,
          title: i.title,
          description: i.description || undefined,
          category: i.category,
          status: i.status || "missed",
          note: i.note || "",
          orderIndex: i.order_index,
        }));

        entries[row.entry_date] = {
          date: row.entry_date,
          dayMessage: row.day_message || "",
          morningIntention: row.morning_intention || "",
          intentions,
          checkIns: intentions.map((i) => ({
            intentionId: i.id,
            status: i.status,
            titleSnapshot: i.title,
            categorySnapshot: i.category,
            note: i.note,
          })),
          eveningReflection: row.evening_reflection || "",
          takeaways: row.takeaways || "",
          energyLevel: row.energy_level as EnergyLevel | undefined,
          completedEvening: Boolean(row.completed_evening),
          dailyScore: row.daily_score ?? calculateDailyScore(intentions),
          dailyInsight: row.daily_insight,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    }

    return {
      success: true,
      data: {
        version: 1,
        settings: userSettings,
        intentions: [],
        entries,
      },
    };
  } catch (err: unknown) {
    console.error("fetchUserStoreAction exception:", err);
    return { success: false, error: (err as Error)?.message || "Failed to fetch cloud store." };
  }
}

/**
 * Saves a day entry and its intentions into Supabase for the authenticated user.
 */
export async function syncDayEntryAction(
  entry: DayEntry
): Promise<ServerResponse<DayEntry>> {
  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 1. Upsert Day Entry
    const score = calculateDailyScore(entry.intentions || []);
    const insight = generateDailyInsight({ ...entry, dailyScore: score });

    const { data: upsertedDay, error: upsertError } = await supabase
      .from("day_entries")
      .upsert(
        {
          user_id: user.id,
          entry_date: entry.date,
          day_message: entry.dayMessage || "",
          morning_intention: entry.morningIntention || "",
          evening_reflection: entry.eveningReflection || "",
          takeaways: entry.takeaways || "",
          energy_level: entry.energyLevel || null,
          completed_evening: Boolean(entry.completedEvening),
          daily_score: score,
          daily_insight: insight,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,entry_date" }
      )
      .select()
      .single();

    if (upsertError || !upsertedDay) {
      console.error("Error upserting day entry:", upsertError);
      return { success: false, error: upsertError?.message };
    }

    // 2. Sync Daily Intentions
    await supabase
      .from("daily_intentions")
      .delete()
      .eq("day_entry_id", upsertedDay.id)
      .eq("user_id", user.id);

    if (entry.intentions && entry.intentions.length > 0) {
      const intentionRows = entry.intentions.map((item, index) => ({
        id: item.id.startsWith("int_") ? undefined : item.id,
        day_entry_id: upsertedDay.id,
        user_id: user.id,
        title: item.title,
        description: item.description || null,
        category: item.category || "personal",
        status: item.status || "missed",
        note: item.note || "",
        order_index: index,
      }));

      const { error: insertIntentionError } = await supabase
        .from("daily_intentions")
        .insert(intentionRows);

      if (insertIntentionError) {
        console.error("Error syncing intentions:", insertIntentionError);
      }
    }

    return {
      success: true,
      data: {
        ...entry,
        dailyScore: score,
        dailyInsight: insight,
      },
    };
  } catch (err: unknown) {
    console.error("syncDayEntryAction exception:", err);
    return { success: false, error: (err as Error)?.message || "Failed to sync day entry." };
  }
}

/**
 * Deletes an entire day entry from Supabase for the authenticated user.
 */
export async function deleteDayAction(date: string): Promise<ServerResponse> {
  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("day_entries")
      .delete()
      .eq("user_id", user.id)
      .eq("entry_date", date);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Failed to delete day." };
  }
}

/**
 * Updates User Settings in Supabase for the authenticated user.
 */
export async function saveUserSettingsAction(
  settings: Partial<UserSettings>
): Promise<ServerResponse> {
  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      user_name: settings.userName,
      morning_prompt_text: settings.morningPromptText,
      evening_prompt_text: settings.eveningPromptText,
      morning_check_in_time: settings.morningCheckInTime,
      evening_check_in_time: settings.eveningCheckInTime,
      start_page: settings.startPage,
      show_completed: settings.showCompleted,
      confirm_before_delete: settings.confirmBeforeDelete,
      enable_daily_insights: settings.enableDailyInsights,
      theme_mode: settings.themeMode,
      last_active_date: settings.lastActiveDate,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Failed to save settings." };
  }
}

/**
 * Migrates existing guest localStorage entries into the authenticated Supabase user's account.
 */
export async function migrateLocalStoreAction(
  localData: LivyueStoreData
): Promise<ServerResponse<{ migratedCount: number }>> {
  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    let migratedCount = 0;

    if (localData && localData.entries) {
      for (const [, entry] of Object.entries(localData.entries)) {
        const res = await syncDayEntryAction(entry);
        if (res.success) {
          migratedCount++;
        }
      }
    }

    if (localData.settings) {
      await saveUserSettingsAction(localData.settings);
    }

    return { success: true, data: { migratedCount } };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Failed to migrate local store." };
  }
}
