import {
  DailyInsight,
  DailyIntentionInstance,
  DayEntry,
  EnergyLevel,
  LivyueStoreData,
} from "./types";
import { formatDateLabel, getTodayDateString } from "./storage";

export const CATEGORY_LABELS: Record<string, string> = {
  health: "Health & Body",
  work: "Focus & Work",
  learning: "Study & Reading",
  mind: "Mind & Rest",
  relationships: "Relationships",
  craft: "Craft & Creation",
  personal: "Personal",
};

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

export function calculateDailyScore(
  intentions: { status: "done" | "partial" | "missed" }[]
): number {
  if (!intentions || intentions.length === 0) return 0;

  const totalPoints = intentions.reduce((sum, item) => {
    if (item.status === "done") return sum + 100;
    if (item.status === "partial") return sum + 50;
    return sum; // missed = 0
  }, 0);

  return Math.round(totalPoints / intentions.length);
}

export interface DaySummaryData {
  date: string; // YYYY-MM-DD
  dayName: string; // "Sun", "Mon", etc.
  dayNumber: number; // 1..31
  dateFormatted: string;
  isToday: boolean;
  isFuture: boolean;
  hasActivity: boolean;
  intentionsTotal: number;
  intentionsDone: number;
  intentionsPartial: number;
  intentionsMissed: number;
  score: number;
  energy?: EnergyLevel;
  hasReflection: boolean;
  reflectionText?: string;
  dayMessage?: string;
  intentions: DailyIntentionInstance[];
  insight: DailyInsight | null;
}

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  formattedRange: string;
  days: DaySummaryData[];
  totalIntentionsSet: number;
  totalCompleted: number;
  totalPartial: number;
  totalMissed: number;
  overallScore: number;
  activeDaysCount: number;
  reflectionsCount: number;
  mostConsistentCategory?: { category: string; label: string; ratePercent: number; total: number };
  mostFrictionCategory?: { category: string; label: string; missedCount: number; total: number };
  dominantEnergy?: { energy: EnergyLevel; count: number };
  insight: DailyInsight | null;
}

export interface MonthlyStats {
  year: number;
  month: number; // 0..11
  monthName: string;
  formattedMonthYear: string;
  daysInMonth: number;
  firstDayOfWeek: number; // 0 = Sun..6 = Sat
  days: DaySummaryData[];
  totalIntentionsSet: number;
  totalCompleted: number;
  totalPartial: number;
  totalMissed: number;
  overallScore: number;
  activeDaysCount: number;
  reflectionsCount: number;
  mostConsistentCategory?: { category: string; label: string; ratePercent: number; total: number };
  mostFrictionCategory?: { category: string; label: string; missedCount: number; total: number };
  dominantEnergy?: { energy: EnergyLevel; count: number };
  workloadPattern?: string;
  insight: DailyInsight | null;
}

/**
 * Deterministically generates a strictly data-grounded daily insight.
 */
export function generateDailyInsight(
  entry: DayEntry | undefined,
  historyEntries?: DayEntry[]
): DailyInsight | null {
  if (!entry) return null;

  const intentions = entry.intentions || [];
  const reflection = entry.eveningReflection?.trim() || "";
  const takeaways = entry.takeaways?.trim() || "";
  const dayMessage = entry.dayMessage?.trim() || "";
  const energy = entry.energyLevel;

  const doneItems = intentions.filter((c) => c.status === "done");
  const partialItems = intentions.filter((c) => c.status === "partial");
  const missedItems = intentions.filter((c) => c.status === "missed");

  const total = intentions.length;
  const doneCount = doneItems.length;
  const partialCount = partialItems.length;
  const missedCount = missedItems.length;

  // If literally zero intentions, no reflections, and no messages
  if (total === 0 && !reflection && !takeaways && !dayMessage) {
    return null;
  }

  const combinedReflection = `${reflection} ${takeaways}`.toLowerCase();
  const topDone = doneItems[0]?.title || "";
  const topPartial = partialItems[0]?.title || "";
  const topMissed = missedItems[0]?.title || "";

  const isDifficultDay =
    combinedReflection.includes("rough") ||
    combinedReflection.includes("difficult") ||
    combinedReflection.includes("hard") ||
    combinedReflection.includes("tough") ||
    combinedReflection.includes("bad day") ||
    combinedReflection.includes("struggle") ||
    combinedReflection.includes("overwhelm") ||
    combinedReflection.includes("stress");

  const isTiredDay =
    combinedReflection.includes("tired") ||
    combinedReflection.includes("exhaust") ||
    combinedReflection.includes("drained") ||
    combinedReflection.includes("fatigue") ||
    combinedReflection.includes("sleepy") ||
    energy === "tired" ||
    energy === "heavy";

  const isProcrastinated =
    combinedReflection.includes("procrastinat") ||
    combinedReflection.includes("distract") ||
    combinedReflection.includes("put off") ||
    combinedReflection.includes("lazy") ||
    combinedReflection.includes("wasted time") ||
    combinedReflection.includes("scrolling");

  // Check if a task was repeatedly missed across recent days
  if (historyEntries && historyEntries.length >= 2 && topMissed) {
    let recentMissCount = 0;
    for (const h of historyEntries.slice(0, 4)) {
      if (
        (h.intentions || []).some(
          (i) =>
            i.title.toLowerCase() === topMissed.toLowerCase() &&
            i.status === "missed"
        )
      ) {
        recentMissCount++;
      }
    }
    if (recentMissCount >= 2) {
      return {
        observation: `You set "${topMissed}" again today and missed it for the ${
          recentMissCount + 1
        }th time recently.`,
        interpretation: `You keep putting "${topMissed}" off. Tomorrow, stop negotiating with it and get it done first.`,
        experiment: `Tomorrow morning, finish "${topMissed}" before touching any other task.`,
        generatedAt: new Date().toISOString(),
        provenance: "Recent pattern & missed task",
      };
    }
  }

  // 1. NO INTENTIONS SET
  if (total === 0) {
    if (reflection) {
      if (isDifficultDay || isTiredDay) {
        return {
          observation: "You didn't set morning tasks today, but your night reflection shows you had a heavy day.",
          interpretation: "Writing down how today went is already an honest step. Resting is part of the process.",
          experiment: "Tomorrow morning, write down just one simple task to anchor your day.",
          generatedAt: new Date().toISOString(),
          provenance: "Based on today's reflection",
        };
      }
      return {
        observation: "You didn't set morning intentions today, but you checked in with an honest night reflection.",
        interpretation: "Checking in at night keeps you grounded, even on unstructured days.",
        experiment: "Set one clear morning intention tomorrow so you have a solid target to hit.",
        generatedAt: new Date().toISOString(),
        provenance: "Based on today's reflection",
      };
    }

    if (dayMessage) {
      return {
        observation: `You gave today a theme: "${dayMessage}".`,
        interpretation: "A good theme sets your mindset, but concrete tasks turn intentions into reality.",
        experiment: "Tomorrow morning, pair your message with 1 or 2 specific tasks.",
        generatedAt: new Date().toISOString(),
        provenance: "Based on today's message",
      };
    }

    return null;
  }

  // 2. ALL INTENTIONS COMPLETED (100%)
  if (doneCount === total) {
    if (total === 1) {
      return {
        observation: `You set out to do "${topDone}" today and you finished it.`,
        interpretation: "You chose one clear priority and followed through without getting distracted.",
        experiment: "Keep this same focus tomorrow. Don't overload yourself just because today went well.",
        generatedAt: new Date().toISOString(),
        provenance: "Today's follow-through",
      };
    }

    if (isDifficultDay || isTiredDay) {
      return {
        observation: `You finished all ${total} tasks today even though your reflection mentions how tiring today felt.`,
        interpretation: "You showed good discipline today by following through when energy was low.",
        experiment: "Get good rest tonight so you don't start tomorrow already running on empty.",
        generatedAt: new Date().toISOString(),
        provenance: "Today's follow-through & reflection",
      };
    }

    const taskList = doneItems.slice(0, 2).map((t) => `"${t.title}"`).join(" and ");
    return {
      observation: `You finished all ${total} tasks you set this morning, including ${taskList}.`,
      interpretation: "You got the important things done today. Good follow-through.",
      experiment: "Keep your commitments at this manageable size tomorrow.",
      generatedAt: new Date().toISOString(),
      provenance: "Today's follow-through",
    };
  }

  // 3. ALL INTENTIONS MISSED (0%)
  if (missedCount === total) {
    if (isTiredDay || isDifficultDay) {
      return {
        observation: `Today was rough, and your reflection shows that. None of your ${total} tasks got done.`,
        interpretation: "When energy runs out completely, everything grinds to a halt. It's okay to reset.",
        experiment: "Tomorrow, choose only one small, essential task and get it done early.",
        generatedAt: new Date().toISOString(),
        provenance: "Today's reflection & missed tasks",
      };
    }

    if (isProcrastinated) {
      return {
        observation: `You missed all ${total} tasks today (${topMissed ? `including "${topMissed}"` : ""}), and your reflection mentions getting sidetracked.`,
        interpretation: "You avoided starting the real work today. Delaying it only makes it heavier tomorrow.",
        experiment: `Tomorrow morning, start "${topMissed}" first thing. No negotiating.`,
        generatedAt: new Date().toISOString(),
        provenance: "Today's reflection & missed tasks",
      };
    }

    if (total === 1) {
      return {
        observation: `You set one task today ("${topMissed}") and didn't touch it.`,
        interpretation: `You kept putting "${topMissed}" off today. That was the task you needed to face.`,
        experiment: `Tomorrow, stop negotiating with "${topMissed}" and get it done first.`,
        generatedAt: new Date().toISOString(),
        provenance: "Today's missed priority",
      };
    }

    return {
      observation: `None of your ${total} morning tasks were completed today (${topMissed ? `including "${topMissed}"` : ""}).`,
      interpretation: "You let today slip away without getting to the things you committed to this morning.",
      experiment: `Pick only "${topMissed}" tomorrow morning and finish it before touching anything else.`,
      generatedAt: new Date().toISOString(),
      provenance: "Today's missed tasks",
    };
  }

  // 4. ONLY PARTIAL TASKS (No done, some partial, some/no missed)
  if (doneCount === 0 && partialCount > 0) {
    if (missedCount > 0) {
      return {
        observation: `You started "${topPartial}", but left it unfinished, while "${topMissed}" was missed completely.`,
        interpretation: "You made an effort to start, but didn't push through to the finish line on either task.",
        experiment: `Tomorrow, finish "${topPartial}" first before picking up anything new.`,
        generatedAt: new Date().toISOString(),
        provenance: "Today's partial progress",
      };
    }
    return {
      observation: `You started "${topPartial}", but left it unfinished.`,
      interpretation: "Starting is good, but tomorrow you need to take it to the finish line.",
      experiment: `Take "${topPartial}" all the way to the finish line first thing tomorrow.`,
      generatedAt: new Date().toISOString(),
      provenance: "Today's partial progress",
    };
  }

  // 5. MIXED DAY (Some Done, Some Missed or Partial)
  if (doneCount > 0 && (missedCount > 0 || partialCount > 0)) {
    // If night reflection mentions struggle or fatigue
    if (isDifficultDay || isTiredDay) {
      const remainingName = topMissed || topPartial;
      return {
        observation: `Today was rough, but you still got "${topDone}" finished while "${remainingName}" slipped.`,
        interpretation: "You protected at least one priority under tough conditions. That counts.",
        experiment: `Tomorrow, keep your list small. Put "${remainingName}" right at the top.`,
        generatedAt: new Date().toISOString(),
        provenance: "Today's mixed follow-through & reflection",
      };
    }

    // If a task was partially completed while another was done
    if (partialCount > 0 && !topMissed) {
      return {
        observation: `You completed "${topDone}", and made some headway on "${topPartial}".`,
        interpretation: `You built good momentum with "${topDone}", but left "${topPartial}" unfinished.`,
        experiment: `Close out "${topPartial}" tomorrow before starting any new tasks.`,
        generatedAt: new Date().toISOString(),
        provenance: "Today's mixed progress",
      };
    }

    // Specific task missed while another was done
    if (topMissed) {
      if (isProcrastinated) {
        return {
          observation: `You finished "${topDone}", but you kept putting "${topMissed}" off.`,
          interpretation: `You chose the easier task and avoided "${topMissed}". That was the one you needed to face.`,
          experiment: `Tomorrow, do not touch any easy tasks until "${topMissed}" is completely done.`,
          generatedAt: new Date().toISOString(),
          provenance: "Today's follow-through & reflection",
        };
      }

      return {
        observation: `You finished "${topDone}" today, but "${topMissed}" was missed.`,
        interpretation: `You followed through on one priority, but let "${topMissed}" get pushed aside.`,
        experiment: `Tomorrow, stop negotiating with "${topMissed}" and tackle it first.`,
        generatedAt: new Date().toISOString(),
        provenance: "Today's mixed follow-through",
      };
    }
  }

  // Fallback
  return {
    observation: `You completed ${doneCount} of ${total} tasks today.`,
    interpretation: "You made progress today, but there were things left unfinished.",
    experiment: "Tomorrow, focus on finishing what you start before opening new tasks.",
    generatedAt: new Date().toISOString(),
    provenance: "Today's summary",
  };
}

/**
 * Calculates day summary object for any given date.
 */
export function getDaySummary(
  store: LivyueStoreData,
  dateStr: string
): DaySummaryData {
  const todayStr = getTodayDateString();
  const entry = store.entries[dateStr];
  const dateObj = new Date(dateStr + "T00:00:00");
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[dateObj.getDay()] || "Day";
  const dayNumber = dateObj.getDate();
  const dateFormatted = formatDateLabel(dateStr);

  const isToday = dateStr === todayStr;
  const isFuture = dateStr > todayStr;

  const intentions = entry?.intentions || [];
  const doneCount = intentions.filter((i) => i.status === "done").length;
  const partialCount = intentions.filter((i) => i.status === "partial").length;
  const missedCount = intentions.filter((i) => i.status === "missed").length;
  const score = calculateDailyScore(intentions);

  const hasReflection = Boolean(
    (entry?.eveningReflection && entry.eveningReflection.trim().length > 0) ||
    (entry?.takeaways && entry.takeaways.trim().length > 0)
  );

  const hasActivity = Boolean(
    intentions.length > 0 ||
    hasReflection ||
    (entry?.dayMessage && entry.dayMessage.trim().length > 0) ||
    entry?.energyLevel
  );

  // Generate or retrieve insight
  let insight = entry?.dailyInsight || null;
  if (!insight && entry && hasActivity) {
    const historyEntries = Object.values(store.entries)
      .filter((e) => e.date < dateStr)
      .sort((a, b) => b.date.localeCompare(a.date));
    insight = generateDailyInsight(entry, historyEntries);
  }

  return {
    date: dateStr,
    dayName,
    dayNumber,
    dateFormatted,
    isToday,
    isFuture,
    hasActivity,
    intentionsTotal: intentions.length,
    intentionsDone: doneCount,
    intentionsPartial: partialCount,
    intentionsMissed: missedCount,
    score,
    energy: entry?.energyLevel,
    hasReflection,
    reflectionText: entry?.eveningReflection,
    dayMessage: entry?.dayMessage,
    intentions,
    insight,
  };
}

/**
 * Calculates weekly statistics for a Sunday -> Saturday week.
 */
export function calculateWeeklyStats(
  store: LivyueStoreData,
  weekStartDateStr: string
): WeeklyStats {
  const startDateObj = new Date(weekStartDateStr + "T00:00:00");
  const days: DaySummaryData[] = [];

  let totalIntentionsSet = 0;
  let totalCompleted = 0;
  let totalPartial = 0;
  let totalMissed = 0;
  let scoreSum = 0;
  let scoreDaysCount = 0;
  let activeDaysCount = 0;
  let reflectionsCount = 0;

  const categoryCounts: Record<string, { total: number; completed: number; missed: number }> = {};
  const energyCounts: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const current = new Date(startDateObj);
    current.setDate(startDateObj.getDate() + i);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const daySummary = getDaySummary(store, dateStr);
    days.push(daySummary);

    if (daySummary.hasActivity) {
      activeDaysCount++;
    }

    if (daySummary.intentionsTotal > 0) {
      totalIntentionsSet += daySummary.intentionsTotal;
      totalCompleted += daySummary.intentionsDone;
      totalPartial += daySummary.intentionsPartial;
      totalMissed += daySummary.intentionsMissed;
      scoreSum += daySummary.score;
      scoreDaysCount++;

      for (const item of daySummary.intentions) {
        const cat = item.category || "personal";
        if (!categoryCounts[cat]) {
          categoryCounts[cat] = { total: 0, completed: 0, missed: 0 };
        }
        categoryCounts[cat].total++;
        if (item.status === "done") categoryCounts[cat].completed++;
        if (item.status === "missed") categoryCounts[cat].missed++;
      }
    }

    if (daySummary.hasReflection) {
      reflectionsCount++;
    }

    if (daySummary.energy) {
      energyCounts[daySummary.energy] = (energyCounts[daySummary.energy] || 0) + 1;
    }
  }

  const endDateStr = days[6].date;
  const startLabel = formatDateLabel(weekStartDateStr);
  const endLabel = formatDateLabel(endDateStr);
  const formattedRange = `${startLabel.split(",")[0]} – ${endLabel}`;

  const overallScore = scoreDaysCount > 0 ? Math.round(scoreSum / scoreDaysCount) : 0;

  // Find most consistent category (min 2 items, highest rate)
  let mostConsistentCategory: WeeklyStats["mostConsistentCategory"] = undefined;
  let bestRate = -1;

  for (const [cat, data] of Object.entries(categoryCounts)) {
    if (data.total >= 2) {
      const rate = Math.round((data.completed / data.total) * 100);
      if (rate > bestRate && rate >= 60) {
        bestRate = rate;
        mostConsistentCategory = {
          category: cat,
          label: getCategoryLabel(cat),
          ratePercent: rate,
          total: data.total,
        };
      }
    }
  }

  // Find most friction category (highest missed count >= 1)
  let mostFrictionCategory: WeeklyStats["mostFrictionCategory"] = undefined;
  let maxMissed = 0;

  for (const [cat, data] of Object.entries(categoryCounts)) {
    if (data.missed > maxMissed && data.missed >= 1) {
      maxMissed = data.missed;
      mostFrictionCategory = {
        category: cat,
        label: getCategoryLabel(cat),
        missedCount: data.missed,
        total: data.total,
      };
    }
  }

  // Dominant Energy
  let dominantEnergy: WeeklyStats["dominantEnergy"] = undefined;
  let maxEnergyCount = 0;

  for (const [e, count] of Object.entries(energyCounts)) {
    if (count > maxEnergyCount) {
      maxEnergyCount = count;
      dominantEnergy = {
        energy: e as EnergyLevel,
        count,
      };
    }
  }

  // Generate Weekly Insight
  let insight: DailyInsight | null = null;

  if (activeDaysCount >= 3 && totalIntentionsSet > 0) {
    let observation = `This week, you completed ${totalCompleted} of ${totalIntentionsSet} intentions across ${activeDaysCount} active days (${overallScore}% follow-through).`;
    let interpretation = "Your weekly rhythm showed steady continuity across your focus areas.";
    let experiment = "Notice which routines offered the least friction and protect them next week.";

    if (mostConsistentCategory && mostFrictionCategory && mostConsistentCategory.category !== mostFrictionCategory.category) {
      observation = `You followed through most consistently on ${mostConsistentCategory.label} (${mostConsistentCategory.ratePercent}%), while ${mostFrictionCategory.label} showed the most friction (${mostFrictionCategory.missedCount} missed).`;
      interpretation = `Your focus naturally gravitates toward ${mostConsistentCategory.label}, while ${mostFrictionCategory.label} may require smaller initial steps.`;
      experiment = `Next week, schedule your ${mostFrictionCategory.label} intentions during your highest energy window.`;
    } else if (mostConsistentCategory) {
      observation = `Your highest consistency this week was in ${mostConsistentCategory.label}, achieving ${mostConsistentCategory.ratePercent}% completion across ${mostConsistentCategory.total} commitments.`;
      interpretation = `Clearly bounded intentions in ${mostConsistentCategory.label} created frictionless follow-through.`;
      experiment = "Apply the same intention structure you used in this category to other areas next week.";
    }

    insight = {
      observation,
      interpretation,
      experiment,
      generatedAt: new Date().toISOString(),
      provenance: `Weekly pattern (${activeDaysCount} active days)`,
    };
  } else if (activeDaysCount > 0) {
    insight = {
      observation: `You have recorded activity across ${activeDaysCount} days this week with ${reflectionsCount} reflections.`,
      interpretation: "Weekly patterns will become clearer and more actionable as more consecutive days are logged.",
      experiment: "Commit to completing your morning and evening check-in tomorrow.",
      generatedAt: new Date().toISOString(),
      provenance: `Early observation (${activeDaysCount} days)`,
    };
  }

  return {
    startDate: weekStartDateStr,
    endDate: endDateStr,
    formattedRange,
    days,
    totalIntentionsSet,
    totalCompleted,
    totalPartial,
    totalMissed,
    overallScore,
    activeDaysCount,
    reflectionsCount,
    mostConsistentCategory,
    mostFrictionCategory,
    dominantEnergy,
    insight,
  };
}

/**
 * Calculates monthly statistics and calendar grid.
 */
export function calculateMonthlyStats(
  store: LivyueStoreData,
  year: number,
  month: number // 0..11
): MonthlyStats {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthName = monthNames[month];
  const formattedMonthYear = `${monthName} ${year}`;

  const firstDayObj = new Date(year, month, 1);
  const firstDayOfWeek = firstDayObj.getDay(); // 0 = Sun
  const lastDayObj = new Date(year, month + 1, 0);
  const daysInMonth = lastDayObj.getDate();

  const days: DaySummaryData[] = [];

  let totalIntentionsSet = 0;
  let totalCompleted = 0;
  let totalPartial = 0;
  let totalMissed = 0;
  let scoreSum = 0;
  let scoreDaysCount = 0;
  let activeDaysCount = 0;
  let reflectionsCount = 0;

  const lightLoadScores: number[] = []; // days with <= 3 intentions
  const heavyLoadScores: number[] = []; // days with > 3 intentions

  const categoryCounts: Record<string, { total: number; completed: number; missed: number }> = {};
  const energyCounts: Record<string, number> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;

    const daySummary = getDaySummary(store, dateStr);
    days.push(daySummary);

    if (daySummary.hasActivity) {
      activeDaysCount++;
    }

    if (daySummary.intentionsTotal > 0) {
      totalIntentionsSet += daySummary.intentionsTotal;
      totalCompleted += daySummary.intentionsDone;
      totalPartial += daySummary.intentionsPartial;
      totalMissed += daySummary.intentionsMissed;
      scoreSum += daySummary.score;
      scoreDaysCount++;

      if (daySummary.intentionsTotal <= 3) {
        lightLoadScores.push(daySummary.score);
      } else {
        heavyLoadScores.push(daySummary.score);
      }

      for (const item of daySummary.intentions) {
        const cat = item.category || "personal";
        if (!categoryCounts[cat]) {
          categoryCounts[cat] = { total: 0, completed: 0, missed: 0 };
        }
        categoryCounts[cat].total++;
        if (item.status === "done") categoryCounts[cat].completed++;
        if (item.status === "missed") categoryCounts[cat].missed++;
      }
    }

    if (daySummary.hasReflection) {
      reflectionsCount++;
    }

    if (daySummary.energy) {
      energyCounts[daySummary.energy] = (energyCounts[daySummary.energy] || 0) + 1;
    }
  }

  const overallScore = scoreDaysCount > 0 ? Math.round(scoreSum / scoreDaysCount) : 0;

  // Workload pattern detection
  let workloadPattern: string | undefined = undefined;
  if (lightLoadScores.length >= 3 && heavyLoadScores.length >= 2) {
    const avgLight = Math.round(lightLoadScores.reduce((a, b) => a + b, 0) / lightLoadScores.length);
    const avgHeavy = Math.round(heavyLoadScores.reduce((a, b) => a + b, 0) / heavyLoadScores.length);
    if (avgLight - avgHeavy >= 15) {
      workloadPattern = `Higher follow-through on days with ≤ 3 intentions (${avgLight}% vs ${avgHeavy}%)`;
    }
  }

  // Most consistent category (min 3 items)
  let mostConsistentCategory: MonthlyStats["mostConsistentCategory"] = undefined;
  let bestRate = -1;

  for (const [cat, data] of Object.entries(categoryCounts)) {
    if (data.total >= 3) {
      const rate = Math.round((data.completed / data.total) * 100);
      if (rate > bestRate && rate >= 60) {
        bestRate = rate;
        mostConsistentCategory = {
          category: cat,
          label: getCategoryLabel(cat),
          ratePercent: rate,
          total: data.total,
        };
      }
    }
  }

  // Most friction category (min 2 missed)
  let mostFrictionCategory: MonthlyStats["mostFrictionCategory"] = undefined;
  let maxMissed = 0;

  for (const [cat, data] of Object.entries(categoryCounts)) {
    if (data.missed > maxMissed && data.missed >= 2) {
      maxMissed = data.missed;
      mostFrictionCategory = {
        category: cat,
        label: getCategoryLabel(cat),
        missedCount: data.missed,
        total: data.total,
      };
    }
  }

  // Dominant Energy
  let dominantEnergy: MonthlyStats["dominantEnergy"] = undefined;
  let maxEnergyCount = 0;

  for (const [e, count] of Object.entries(energyCounts)) {
    if (count > maxEnergyCount) {
      maxEnergyCount = count;
      dominantEnergy = {
        energy: e as EnergyLevel,
        count,
      };
    }
  }

  // Monthly Insight
  let insight: DailyInsight | null = null;

  if (activeDaysCount >= 5 && totalIntentionsSet > 0) {
    let observation = `Across ${monthName}, you recorded ${activeDaysCount} active days with a ${overallScore}% overall follow-through rate.`;
    let interpretation = `Your monthly practice demonstrates a steady foundation across ${reflectionsCount} reflections.`;
    let experiment = "Review your most consistent habits and use them as anchors for next month.";

    if (workloadPattern) {
      observation = `Across ${monthName}, your follow-through was significantly stronger on days when you set 3 or fewer intentions.`;
      interpretation = "Limiting daily commitments to a focused trio reduces cognitive fatigue and enhances completion.";
      experiment = "Experiment with keeping your daily morning intentions capped at 3 items.";
    } else if (mostConsistentCategory && mostFrictionCategory) {
      observation = `Throughout ${monthName}, ${mostConsistentCategory.label} achieved ${mostConsistentCategory.ratePercent}% consistency, while ${mostFrictionCategory.label} experienced the most friction (${mostFrictionCategory.missedCount} missed).`;
      interpretation = `Habits in ${mostConsistentCategory.label} have become established routines, while ${mostFrictionCategory.label} needs reduced starting resistance.`;
      experiment = `Break your ${mostFrictionCategory.label} intentions into 10-minute micro-sessions.`;
    }

    insight = {
      observation,
      interpretation,
      experiment,
      generatedAt: new Date().toISOString(),
      provenance: `Monthly pattern (${activeDaysCount} days tracked in ${monthName})`,
    };
  } else if (activeDaysCount > 0) {
    insight = {
      observation: `You have recorded ${activeDaysCount} active days in ${monthName} so far.`,
      interpretation: "Your monthly patterns will become clearer with more days of activity.",
      experiment: "Continue logging your daily morning intentions and night reflections.",
      generatedAt: new Date().toISOString(),
      provenance: `Early observation (${activeDaysCount} days in ${monthName})`,
    };
  }

  return {
    year,
    month,
    monthName,
    formattedMonthYear,
    daysInMonth,
    firstDayOfWeek,
    days,
    totalIntentionsSet,
    totalCompleted,
    totalPartial,
    totalMissed,
    overallScore,
    activeDaysCount,
    reflectionsCount,
    mostConsistentCategory,
    mostFrictionCategory,
    dominantEnergy,
    workloadPattern,
    insight,
  };
}

/**
 * Backwards compatible helper for legacy metrics calculation.
 */
export function calculateInsightMetrics(store: LivyueStoreData) {
  const todayStr = getTodayDateString();
  const daySummary = getDaySummary(store, todayStr);
  const weekStats = calculateWeeklyStats(store, getSundayOfWeek(todayStr));

  return {
    todayScore: daySummary.score,
    todayDone: daySummary.intentionsDone,
    todayPartial: daySummary.intentionsPartial,
    todayMissed: daySummary.intentionsMissed,
    todayTotal: daySummary.intentionsTotal,
    totalDaysTracked: weekStats.activeDaysCount,
    totalCheckIns: weekStats.totalIntentionsSet,
    completedCount: weekStats.totalCompleted,
    partialCount: weekStats.totalPartial,
    missedCount: weekStats.totalMissed,
    completionRatePercent: weekStats.overallScore,
    currentStreak: 1,
    longestStreak: 1,
    totalReflections: weekStats.reflectionsCount,
    reflectionRatePercent: weekStats.days.length > 0 ? Math.round((weekStats.reflectionsCount / 7) * 100) : 0,
    categoryStats: {},
    observations: weekStats.insight ? [weekStats.insight.observation] : [],
  };
}

/**
 * Helper to get the Sunday YYYY-MM-DD for any given date string.
 */
export function getSundayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - day);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
