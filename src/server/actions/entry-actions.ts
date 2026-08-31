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

  if (!url || !key) {
    return "Supabase credentials are not configured in environment variables.";
  }

  if (url.includes("placeholder-project") || key.includes(".placeholder")) {
    return "Supabase is configured with placeholder credentials.";
  }

  return null;
}

function constructDayEntry(
  date: string,
  row: {
    day_message?: string | null;
    morning_intention?: string | null;
    evening_reflection?: string | null;
    takeaways?: string | null;
    energy_level?: string | null;
    completed_evening?: boolean | null;
    daily_score?: number | null;
    daily_insight?: unknown;
    created_at?: string | null;
    updated_at?: string | null;
  } | null,
  intentions: DailyIntentionInstance[]
): DayEntry {
  const score = row?.daily_score ?? calculateDailyScore(intentions);
  const checkIns = intentions.map((i) => ({
    intentionId: i.id,
    status: i.status,
    titleSnapshot: i.title,
    categorySnapshot: i.category,
    note: i.note,
  }));

  const partialEntry: DayEntry = {
    date,
    dayMessage: row?.day_message || "",
    morningIntention: row?.morning_intention || "",
    intentions,
    checkIns,
    eveningReflection: row?.evening_reflection || "",
    takeaways: row?.takeaways || "",
    energyLevel: (row?.energy_level as EnergyLevel) || undefined,
    completedEvening: Boolean(row?.completed_evening),
    dailyScore: score,
    dailyInsight: row?.daily_insight as DayEntry["dailyInsight"],
    createdAt: row?.created_at || new Date().toISOString(),
    updatedAt: row?.updated_at || new Date().toISOString(),
  };

  if (!partialEntry.dailyInsight) {
    partialEntry.dailyInsight = generateDailyInsight(partialEntry);
  }

  return partialEntry;
}

/**
 * Fetches all persistent data for the authenticated user from Supabase.
 */
export async function fetchUserStoreAction(): Promise<
  ServerResponse<LivyueStoreData>
> {
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
      .maybeSingle();

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
      startPage: (settingsRow?.start_page as "today" | "history") || "today",
      showCompleted: settingsRow?.show_completed ?? true,
      confirmBeforeDelete: settingsRow?.confirm_before_delete ?? true,
      enableDailyInsights: settingsRow?.enable_daily_insights ?? true,
      themeMode: (settingsRow?.theme_mode as "light" | "dark") || "light",
      installedAt: settingsRow?.created_at || new Date().toISOString(),
      lastActiveDate: settingsRow?.last_active_date || undefined,
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

        entries[row.entry_date] = constructDayEntry(row.entry_date, row, intentions);
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
    return {
      success: false,
      error: (err as Error)?.message || "Failed to fetch cloud store.",
    };
  }
}

/**
 * Ensures a day_entries row exists in PostgreSQL for the given date, returning the row ID.
 */
async function ensureDayEntryRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string
): Promise<{ id: string; error?: string }> {
  const { data: existing, error: selectErr } = await supabase
    .from("day_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .maybeSingle();

  if (selectErr) {
    return { id: "", error: selectErr.message };
  }

  if (existing) {
    return { id: existing.id };
  }

  const { data: created, error: insertErr } = await supabase
    .from("day_entries")
    .insert({
      user_id: userId,
      entry_date: date,
      day_message: "",
      morning_intention: "",
      evening_reflection: "",
      takeaways: "",
      energy_level: null,
      completed_evening: false,
      daily_score: 0,
      daily_insight: null,
    })
    .select("id")
    .single();

  if (insertErr || !created) {
    return { id: "", error: insertErr?.message || "Failed to initialize day entry." };
  }

  return { id: created.id };
}

/**
 * Saves or updates a day message for a specific date.
 */
export async function saveDayMessageAction(
  date: string,
  message: string
): Promise<ServerResponse> {
  const configError = checkSupabaseConfig();
  if (configError) return { success: false, error: configError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase.from("day_entries").upsert(
      {
        user_id: user.id,
        entry_date: date,
        day_message: message.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entry_date" }
    );

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to save day message.",
    };
  }
}

/**
 * Adds a new morning intention for a date and returns the created intention with its PostgreSQL UUID.
 */
export async function addIntentionAction(
  date: string,
  item: { title: string; category: string; description?: string }
): Promise<ServerResponse<{ intention: DailyIntentionInstance; dayEntry: DayEntry }>> {
  const configError = checkSupabaseConfig();
  if (configError) return { success: false, error: configError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { id: dayEntryId, error: ensureErr } = await ensureDayEntryRow(
      supabase,
      user.id,
      date
    );
    if (ensureErr || !dayEntryId) {
      return { success: false, error: ensureErr };
    }

    // Get current intention count for order_index
    const { count } = await supabase
      .from("daily_intentions")
      .select("*", { count: "exact", head: true })
      .eq("day_entry_id", dayEntryId);

    const orderIndex = count ?? 0;

    // Insert intention
    const { data: inserted, error: insertError } = await supabase
      .from("daily_intentions")
      .insert({
        day_entry_id: dayEntryId,
        user_id: user.id,
        title: item.title.trim(),
        description: item.description?.trim() || null,
        category: item.category.trim() || "personal",
        status: "missed",
        note: "",
        order_index: orderIndex,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      return { success: false, error: insertError?.message || "Failed to insert intention." };
    }

    // Fetch all intentions for this day to recalculate score & insight
    const { data: allIntentionsRows } = await supabase
      .from("daily_intentions")
      .select("*")
      .eq("day_entry_id", dayEntryId)
      .order("order_index", { ascending: true });

    const allIntentions: DailyIntentionInstance[] = (allIntentionsRows || []).map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description || undefined,
      category: i.category,
      status: i.status as CheckInStatus,
      note: i.note || "",
      orderIndex: i.order_index,
    }));

    const score = calculateDailyScore(allIntentions);

    // Fetch current day entry to compute full insight
    const { data: currentDay } = await supabase
      .from("day_entries")
      .select("*")
      .eq("id", dayEntryId)
      .single();

    const fullDay = constructDayEntry(date, currentDay, allIntentions);
    fullDay.dailyScore = score;
    fullDay.dailyInsight = generateDailyInsight(fullDay);

    // Update day entry score and insight
    await supabase
      .from("day_entries")
      .update({
        daily_score: score,
        daily_insight: fullDay.dailyInsight,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dayEntryId);

    const newIntentionInstance: DailyIntentionInstance = {
      id: inserted.id,
      title: inserted.title,
      description: inserted.description || undefined,
      category: inserted.category,
      status: inserted.status as CheckInStatus,
      note: inserted.note || "",
      orderIndex: inserted.order_index,
    };

    return {
      success: true,
      data: {
        intention: newIntentionInstance,
        dayEntry: fullDay,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to add intention.",
    };
  }
}

/**
 * Updates an intention's title, category, or description.
 */
export async function updateIntentionAction(
  date: string,
  item: { id: string; title: string; category: string; description?: string }
): Promise<ServerResponse<{ dayEntry: DayEntry }>> {
  const configError = checkSupabaseConfig();
  if (configError) return { success: false, error: configError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { error: updateErr } = await supabase
      .from("daily_intentions")
      .update({
        title: item.title.trim(),
        category: item.category.trim() || "personal",
        description: item.description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (updateErr) return { success: false, error: updateErr.message };

    // Fetch updated day entry with all intentions
    const { data: dayRow } = await supabase
      .from("day_entries")
      .select(`*, daily_intentions (*)`)
      .eq("user_id", user.id)
      .eq("entry_date", date)
      .single();

    if (!dayRow) {
      return {
        success: true,
        data: { dayEntry: constructDayEntry(date, null, []) },
      };
    }

    const rawIntentions = (dayRow.daily_intentions || []) as {
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

    const score = calculateDailyScore(intentions);
    const updatedDay = constructDayEntry(date, dayRow, intentions);
    updatedDay.dailyScore = score;
    updatedDay.dailyInsight = generateDailyInsight(updatedDay);

    await supabase
      .from("day_entries")
      .update({
        daily_score: score,
        daily_insight: updatedDay.dailyInsight,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dayRow.id);

    return { success: true, data: { dayEntry: updatedDay } };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to update intention.",
    };
  }
}

/**
 * Deletes an intention by ID.
 */
export async function deleteIntentionAction(
  date: string,
  intentionId: string
): Promise<ServerResponse<{ dayEntry?: DayEntry }>> {
  const configError = checkSupabaseConfig();
  if (configError) return { success: false, error: configError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { error: delErr } = await supabase
      .from("daily_intentions")
      .delete()
      .eq("id", intentionId)
      .eq("user_id", user.id);

    if (delErr) return { success: false, error: delErr.message };

    // Fetch remaining intentions and recompute score
    const { data: dayRow } = await supabase
      .from("day_entries")
      .select(`*, daily_intentions (*)`)
      .eq("user_id", user.id)
      .eq("entry_date", date)
      .maybeSingle();

    if (!dayRow) return { success: true };

    const rawIntentions = (dayRow.daily_intentions || []) as {
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

    const score = calculateDailyScore(intentions);
    const updatedDay = constructDayEntry(date, dayRow, intentions);
    updatedDay.dailyScore = score;
    updatedDay.dailyInsight = generateDailyInsight(updatedDay);

    await supabase
      .from("day_entries")
      .update({
        daily_score: score,
        daily_insight: updatedDay.dailyInsight,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dayRow.id);

    return { success: true, data: { dayEntry: updatedDay } };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to delete intention.",
    };
  }
}

/**
 * Updates an intention's completion status (done, partial, missed) and updates score/insight.
 */
export async function updateIntentionStatusAction(
  date: string,
  intentionId: string,
  status: CheckInStatus
): Promise<ServerResponse<{ dayEntry: DayEntry }>> {
  const configError = checkSupabaseConfig();
  if (configError) return { success: false, error: configError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { error: updateErr } = await supabase
      .from("daily_intentions")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intentionId)
      .eq("user_id", user.id);

    if (updateErr) return { success: false, error: updateErr.message };

    // Fetch all intentions for the day and update score
    const { data: dayRow } = await supabase
      .from("day_entries")
      .select(`*, daily_intentions (*)`)
      .eq("user_id", user.id)
      .eq("entry_date", date)
      .single();

    if (!dayRow) {
      return {
        success: true,
        data: { dayEntry: constructDayEntry(date, null, []) },
      };
    }

    const rawIntentions = (dayRow.daily_intentions || []) as {
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

    const score = calculateDailyScore(intentions);
    const updatedDay = constructDayEntry(date, dayRow, intentions);
    updatedDay.dailyScore = score;
    updatedDay.dailyInsight = generateDailyInsight(updatedDay);

    await supabase
      .from("day_entries")
      .update({
        daily_score: score,
        daily_insight: updatedDay.dailyInsight,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dayRow.id);

    return { success: true, data: { dayEntry: updatedDay } };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to update intention status.",
    };
  }
}

/**
 * Updates an intention's reflection note.
 */
export async function updateIntentionNoteAction(
  intentionId: string,
  note: string
): Promise<ServerResponse> {
  const configError = checkSupabaseConfig();
  if (configError) return { success: false, error: configError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("daily_intentions")
      .update({
        note: note.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", intentionId)
      .eq("user_id", user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to update note.",
    };
  }
}

/**
 * Saves evening reflection, takeaways, energy level, and completed status for a date.
 */
export async function saveEveningReflectionAction(
  date: string,
  data: {
    eveningReflection?: string;
    takeaways?: string;
    energyLevel?: EnergyLevel;
    completedEvening?: boolean;
  }
): Promise<ServerResponse<{ dayEntry: DayEntry }>> {
  const configError = checkSupabaseConfig();
  if (configError) return { success: false, error: configError };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { id: dayEntryId, error: ensureErr } = await ensureDayEntryRow(
      supabase,
      user.id,
      date
    );
    if (ensureErr || !dayEntryId) return { success: false, error: ensureErr };

    // Fetch existing intentions
    const { data: intentionRows } = await supabase
      .from("daily_intentions")
      .select("*")
      .eq("day_entry_id", dayEntryId)
      .order("order_index", { ascending: true });

    const intentions: DailyIntentionInstance[] = (intentionRows || []).map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description || undefined,
      category: i.category,
      status: i.status as CheckInStatus,
      note: i.note || "",
      orderIndex: i.order_index,
    }));

    const score = calculateDailyScore(intentions);

    // Fetch current day entry
    const { data: currentDay } = await supabase
      .from("day_entries")
      .select("*")
      .eq("id", dayEntryId)
      .single();

    const mergedData = {
      day_message: currentDay?.day_message || "",
      morning_intention: currentDay?.morning_intention || "",
      evening_reflection:
        data.eveningReflection !== undefined
          ? data.eveningReflection.trim()
          : currentDay?.evening_reflection || "",
      takeaways:
        data.takeaways !== undefined
          ? data.takeaways.trim()
          : currentDay?.takeaways || "",
      energy_level:
        data.energyLevel !== undefined
          ? data.energyLevel
          : currentDay?.energy_level,
      completed_evening:
        data.completedEvening !== undefined
          ? Boolean(data.completedEvening)
          : Boolean(currentDay?.completed_evening),
      daily_score: score,
      created_at: currentDay?.created_at,
      updated_at: new Date().toISOString(),
    };

    const updatedDay = constructDayEntry(date, mergedData, intentions);
    const insight = generateDailyInsight(updatedDay);
    updatedDay.dailyInsight = insight;

    const { error: updateErr } = await supabase
      .from("day_entries")
      .update({
        evening_reflection: updatedDay.eveningReflection,
        takeaways: updatedDay.takeaways,
        energy_level: updatedDay.energyLevel || null,
        completed_evening: updatedDay.completedEvening,
        daily_score: score,
        daily_insight: insight,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dayEntryId);

    if (updateErr) return { success: false, error: updateErr.message };

    return { success: true, data: { dayEntry: updatedDay } };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Failed to save evening reflection.",
    };
  }
}

/**
 * Atomically saves an entire day entry and all its child intentions into Supabase.
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

    // 2. Safely sync intentions: fetch existing IDs to prevent destructive deletes
    const { data: existingIntentions } = await supabase
      .from("daily_intentions")
      .select("id")
      .eq("day_entry_id", upsertedDay.id);

    const existingIdSet = new Set((existingIntentions || []).map((i) => i.id));
    const currentIntentions = entry.intentions || [];
    const keptIdSet = new Set<string>();

    const reconciledIntentions: DailyIntentionInstance[] = [];

    for (let index = 0; index < currentIntentions.length; index++) {
      const item = currentIntentions[index];
      const isClientGenerated = !item.id || item.id.startsWith("int_") || item.id.startsWith("temp_");

      if (!isClientGenerated && existingIdSet.has(item.id)) {
        // Update existing intention
        keptIdSet.add(item.id);
        const { data: updated } = await supabase
          .from("daily_intentions")
          .update({
            title: item.title,
            description: item.description || null,
            category: item.category || "personal",
            status: item.status || "missed",
            note: item.note || "",
            order_index: index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (updated) {
          reconciledIntentions.push({
            id: updated.id,
            title: updated.title,
            description: updated.description || undefined,
            category: updated.category,
            status: updated.status as CheckInStatus,
            note: updated.note || "",
            orderIndex: updated.order_index,
          });
        }
      } else {
        // Insert new intention
        const { data: inserted } = await supabase
          .from("daily_intentions")
          .insert({
            day_entry_id: upsertedDay.id,
            user_id: user.id,
            title: item.title,
            description: item.description || null,
            category: item.category || "personal",
            status: item.status || "missed",
            note: item.note || "",
            order_index: index,
          })
          .select()
          .single();

        if (inserted) {
          keptIdSet.add(inserted.id);
          reconciledIntentions.push({
            id: inserted.id,
            title: inserted.title,
            description: inserted.description || undefined,
            category: inserted.category,
            status: inserted.status as CheckInStatus,
            note: inserted.note || "",
            orderIndex: inserted.order_index,
          });
        }
      }
    }

    // Delete only intentions that were deleted by the user
    for (const existingId of existingIdSet) {
      if (!keptIdSet.has(existingId)) {
        await supabase
          .from("daily_intentions")
          .delete()
          .eq("id", existingId)
          .eq("user_id", user.id);
      }
    }

    const fullResult = constructDayEntry(entry.date, upsertedDay, reconciledIntentions);
    fullResult.dailyScore = score;
    fullResult.dailyInsight = insight;

    return {
      success: true,
      data: fullResult,
    };
  } catch (err: unknown) {
    console.error("syncDayEntryAction exception:", err);
    return {
      success: false,
      error: (err as Error)?.message || "Failed to sync day entry.",
    };
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
    return {
      success: false,
      error: (err as Error)?.message || "Failed to delete day.",
    };
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
    return {
      success: false,
      error: (err as Error)?.message || "Failed to save settings.",
    };
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
    return {
      success: false,
      error: (err as Error)?.message || "Failed to migrate local store.",
    };
  }
}
