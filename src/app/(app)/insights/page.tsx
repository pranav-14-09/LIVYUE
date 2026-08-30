"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLivyue } from "@/lib/use-livyue";
import {
  calculateMonthlyStats,
  calculateWeeklyStats,
  getDaySummary,
  getSundayOfWeek,
} from "@/lib/insights";
import { formatDateLabel, getTodayDateString } from "@/lib/storage";

function EnergyBadge({ energy }: { energy?: string }) {
  if (!energy) return null;
  const labels: Record<string, { label: string; color: string }> = {
    calm: { label: "Calm", color: "text-moss bg-moss/10 border-moss/20" },
    clear: { label: "Clear", color: "text-moss bg-moss/10 border-moss/20" },
    tired: { label: "Tired", color: "text-ember bg-ember/10 border-ember/20" },
    heavy: { label: "Heavy", color: "text-ember bg-ember/10 border-ember/20" },
    scattered: { label: "Scattered", color: "text-ink-muted bg-paper-deep border-rule" },
  };
  const item = labels[energy] || { label: energy, color: "text-ink-muted bg-paper-deep border-rule" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-[0.62rem] uppercase tracking-wider font-semibold ${item.color}`}>
      {item.label}
    </span>
  );
}

function StatusBadge({ status }: { status: "done" | "partial" | "missed" }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center rounded bg-moss/15 text-moss px-2 py-0.5 font-sans text-[0.62rem] uppercase tracking-wider font-semibold">
        Done
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="inline-flex items-center rounded bg-ember/15 text-ember px-2 py-0.5 font-sans text-[0.62rem] uppercase tracking-wider font-semibold">
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded bg-paper-deep text-ink-muted px-2 py-0.5 font-sans text-[0.62rem] uppercase tracking-wider font-semibold">
      Missed
    </span>
  );
}

export default function InsightsPage() {
  const { store, isLoaded } = useLivyue();

  const todayStr = useMemo(() => getTodayDateString(), []);
  const currentSunday = useMemo(() => getSundayOfWeek(todayStr), [todayStr]);

  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(currentSunday);
  
  const todayDateObj = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(() => todayDateObj.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => todayDateObj.getMonth());

  // Selected Day summary
  const daySummary = useMemo(() => {
    return getDaySummary(store, selectedDay);
  }, [store, selectedDay]);

  // Selected Week stats
  const weekStats = useMemo(() => {
    return calculateWeeklyStats(store, selectedWeekStart);
  }, [store, selectedWeekStart]);

  // Selected Month stats
  const monthStats = useMemo(() => {
    return calculateMonthlyStats(store, selectedYear, selectedMonth);
  }, [store, selectedYear, selectedMonth]);

  // Past finalized insights for historical archive
  const archivedInsightEntries = useMemo(() => {
    return Object.values(store.entries)
      .filter((e) => e.dailyInsight && e.date !== todayStr)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [store.entries, todayStr]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-sans text-xs uppercase tracking-[0.24em] text-ink-muted animate-pulse">
          Opening Insights...
        </p>
      </div>
    );
  }

  // Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDay + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDay(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextDay = () => {
    if (selectedDay >= todayStr) return;
    const d = new Date(selectedDay + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDay(`${yyyy}-${mm}-${dd}`);
  };

  const handlePrevWeek = () => {
    const d = new Date(selectedWeekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedWeekStart(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextWeek = () => {
    if (selectedWeekStart >= currentSunday) return;
    const d = new Date(selectedWeekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedWeekStart(`${yyyy}-${mm}-${dd}`);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentOrFuture =
      selectedYear > todayDateObj.getFullYear() ||
      (selectedYear === todayDateObj.getFullYear() && selectedMonth >= todayDateObj.getMonth());
    if (isCurrentOrFuture) return;

    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const isCurrentMonth =
    selectedYear === todayDateObj.getFullYear() && selectedMonth === todayDateObj.getMonth();

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.26em] text-ink-muted">
            Understanding
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-[-0.02em] text-ink">
            Honest Insights
          </h1>
          <p className="mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-ink-muted">
            Data-driven observations derived only from your actual activity, follow-through, and reflections.
          </p>
        </div>

        {/* Period Selector (DAY | WEEK | MONTH) */}
        <div className="inline-flex rounded-lg border border-rule bg-paper-deep/30 p-1 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setPeriod("day")}
            className={`rounded px-4 py-1.5 font-sans text-xs uppercase tracking-[0.18em] transition-all cursor-pointer ${
              period === "day"
                ? "bg-ink text-paper font-semibold shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`rounded px-4 py-1.5 font-sans text-xs uppercase tracking-[0.18em] transition-all cursor-pointer ${
              period === "week"
                ? "bg-ink text-paper font-semibold shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`rounded px-4 py-1.5 font-sans text-xs uppercase tracking-[0.18em] transition-all cursor-pointer ${
              period === "month"
                ? "bg-ink text-paper font-semibold shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAY VIEW                                                              */}
      {/* ========================================================================= */}
      {period === "day" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Date Navigator */}
          <div className="flex items-center justify-between rounded-xl border border-rule bg-paper/80 p-4 sm:p-5">
            <button
              type="button"
              onClick={handlePrevDay}
              aria-label="Previous Day"
              className="flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-xs uppercase tracking-[0.18em] text-ink hover:bg-paper-deep transition-colors cursor-pointer"
            >
              ← <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="font-serif text-xl sm:text-2xl text-ink font-normal">
                  {daySummary.dateFormatted}
                </span>
                {daySummary.isToday && (
                  <span className="inline-flex items-center rounded-full bg-moss/15 text-moss px-2 py-0.5 font-sans text-[0.62rem] uppercase tracking-wider font-semibold">
                    Today
                  </span>
                )}
              </div>
              {!daySummary.isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(todayStr)}
                  className="mt-1 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-ink-muted hover:text-ink underline cursor-pointer"
                >
                  Return to Today
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              disabled={selectedDay >= todayStr}
              aria-label="Next Day"
              className="flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-xs uppercase tracking-[0.18em] text-ink hover:bg-paper-deep transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span> →
            </button>
          </div>

          {/* Key Daily Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Intentions
              </span>
              <p className="font-serif text-2xl sm:text-3xl text-ink">
                {daySummary.intentionsDone} / {daySummary.intentionsTotal}
              </p>
              <p className="text-[0.7rem] text-ink-muted">
                {daySummary.intentionsTotal > 0
                  ? `${daySummary.intentionsDone} done, ${daySummary.intentionsPartial} partial, ${daySummary.intentionsMissed} missed`
                  : "No intentions set"}
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Follow-Through
              </span>
              <p className="font-serif text-2xl sm:text-3xl text-moss">
                {daySummary.score}%
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-deep mt-2">
                <div
                  className="h-full rounded-full bg-moss transition-all duration-500"
                  style={{ width: `${daySummary.score}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Reflection
              </span>
              <p className="font-serif text-xl sm:text-2xl text-ink">
                {daySummary.hasReflection ? "Recorded" : "Not recorded"}
              </p>
              <p className="text-[0.7rem] text-ink-muted">
                {daySummary.hasReflection ? "Night journal logged" : "Awaiting check-in"}
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                State of Mind
              </span>
              <div className="pt-1">
                {daySummary.energy ? (
                  <EnergyBadge energy={daySummary.energy} />
                ) : (
                  <span className="text-xs text-ink-muted italic">Not recorded</span>
                )}
              </div>
              <p className="text-[0.7rem] text-ink-muted pt-1">
                {daySummary.energy ? "Recorded at night" : "Select at night"}
              </p>
            </div>
          </div>

          {/* Today's / Selected Day's Honest Insight Card */}
          {daySummary.insight ? (
            <div className="rounded-xl border border-rule bg-paper-card p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="border-b border-rule pb-3 flex items-center justify-between">
                <span className="font-sans text-[0.65rem] uppercase tracking-[0.24em] text-moss font-semibold">
                  {daySummary.isToday ? "Today's Honest Insight" : "Daily Insight"}
                </span>
                <span className="font-sans text-[0.62rem] uppercase tracking-wider text-ink-muted">
                  {daySummary.insight.provenance || "Data-Driven Synthesis"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    What Happened
                  </p>
                  <p className="mt-1 font-serif text-xl sm:text-2xl text-ink leading-snug">
                    {daySummary.insight.observation}
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    What It Means
                  </p>
                  <p className="mt-1 font-serif text-lg sm:text-xl text-moss italic leading-snug">
                    &ldquo;{daySummary.insight.interpretation}&rdquo;
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    For Tomorrow
                  </p>
                  <p className="mt-1 font-sans text-sm text-ink/90 leading-relaxed">
                    {daySummary.insight.experiment}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-rule bg-paper-deep/20 p-8 text-center space-y-3">
              <p className="font-serif text-xl text-ink">
                No activity recorded yet for {daySummary.dateFormatted}.
              </p>
              <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
                As you set intentions and record night reflections, LIVYUE will analyze your actual behavior and present honest insights here.
              </p>
              {daySummary.isToday && (
                <Link
                  href="/today"
                  className="mt-2 inline-block rounded bg-ink px-5 py-2 font-sans text-xs uppercase tracking-[0.2em] text-paper hover:opacity-90 transition-opacity cursor-pointer font-medium"
                >
                  Open Today&apos;s Practice →
                </Link>
              )}
            </div>
          )}

          {/* Selected Day's Intentions Breakdown */}
          {daySummary.intentions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-sans text-xs uppercase tracking-[0.22em] text-ink font-semibold">
                Intentions Evaluated ({daySummary.intentions.length})
              </h3>
              <div className="space-y-2.5">
                {daySummary.intentions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-rule bg-paper-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[0.62rem] uppercase tracking-wider text-ink-muted">
                          {item.category}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="font-serif text-base sm:text-lg text-ink font-normal mt-0.5">
                        {item.title}
                      </p>
                      {item.note && (
                        <p className="text-xs text-ink-muted italic mt-0.5">
                          Note: &ldquo;{item.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Day's Reflection Quote */}
          {daySummary.reflectionText && (
            <div className="rounded-xl border border-rule bg-paper-deep/30 p-5 space-y-1.5">
              <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted block font-medium">
                Night Reflection
              </span>
              <p className="font-serif text-base sm:text-lg text-ink leading-relaxed italic">
                &ldquo;{daySummary.reflectionText}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEK VIEW                                                             */}
      {/* ========================================================================= */}
      {period === "week" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Week Navigator */}
          <div className="flex items-center justify-between rounded-xl border border-rule bg-paper/80 p-4 sm:p-5">
            <button
              type="button"
              onClick={handlePrevWeek}
              aria-label="Previous Week"
              className="flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-xs uppercase tracking-[0.18em] text-ink hover:bg-paper-deep transition-colors cursor-pointer"
            >
              ← <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="text-center">
              <span className="font-serif text-xl sm:text-2xl text-ink font-normal block">
                {weekStats.formattedRange}
              </span>
              {selectedWeekStart !== currentSunday ? (
                <button
                  type="button"
                  onClick={() => setSelectedWeekStart(currentSunday)}
                  className="mt-1 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-ink-muted hover:text-ink underline cursor-pointer"
                >
                  Return to Current Week
                </button>
              ) : (
                <span className="font-sans text-[0.65rem] uppercase tracking-wider text-moss font-semibold">
                  Current Week
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextWeek}
              disabled={selectedWeekStart >= currentSunday}
              aria-label="Next Week"
              className="flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-xs uppercase tracking-[0.18em] text-ink hover:bg-paper-deep transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span> →
            </button>
          </div>

          {/* 7-Day Horizontal Activity Visualization */}
          <div className="space-y-3">
            <h3 className="font-sans text-xs uppercase tracking-[0.22em] text-ink font-semibold">
              Weekly Activity Landscape
            </h3>
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {weekStats.days.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    setSelectedDay(d.date);
                    setPeriod("day");
                  }}
                  className={`rounded-xl border p-2.5 sm:p-3.5 flex flex-col items-center justify-between text-center transition-all cursor-pointer group ${
                    d.isToday
                      ? "border-moss bg-moss/5 ring-1 ring-moss/30"
                      : d.hasActivity
                      ? "border-rule bg-paper-card hover:border-ink/40"
                      : "border-rule/50 bg-paper-deep/20 hover:border-rule"
                  }`}
                >
                  <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted font-medium">
                    {d.dayName}
                  </span>
                  <span className="font-serif text-lg sm:text-xl text-ink font-normal my-1">
                    {d.dayNumber}
                  </span>

                  {/* Visual follow-through bar */}
                  <div className="w-full h-12 flex flex-col justify-end items-center my-1">
                    {d.intentionsTotal > 0 ? (
                      <div className="w-3 sm:w-4 rounded-full bg-paper-deep overflow-hidden h-full flex flex-col justify-end">
                        <div
                          className="w-full rounded-full bg-moss transition-all duration-300"
                          style={{ height: `${d.score}%` }}
                        />
                      </div>
                    ) : d.hasReflection ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-moss/70" title="Reflection recorded" />
                    ) : (
                      <span className="text-ink-muted/30 text-xs">—</span>
                    )}
                  </div>

                  {/* Summary score/status */}
                  <span className="font-sans text-[0.62rem] font-semibold text-ink mt-1">
                    {d.intentionsTotal > 0 ? `${d.score}%` : d.hasReflection ? "Reflected" : "—"}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[0.68rem] text-ink-muted text-center sm:text-left">
              Click any day to open its detailed breakdown.
            </p>
          </div>

          {/* Weekly Summary Statistics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Intentions Set
              </span>
              <p className="font-serif text-2xl sm:text-3xl text-ink">
                {weekStats.totalIntentionsSet}
              </p>
              <p className="text-[0.7rem] text-ink-muted">
                {weekStats.totalCompleted} completed, {weekStats.totalPartial} partial
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Weekly Follow-Through
              </span>
              <p className="font-serif text-2xl sm:text-3xl text-moss">
                {weekStats.overallScore}%
              </p>
              <p className="text-[0.7rem] text-ink-muted">
                Across {weekStats.activeDaysCount} active days
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Reflections Recorded
              </span>
              <p className="font-serif text-2xl sm:text-3xl text-ink">
                {weekStats.reflectionsCount} / 7
              </p>
              <p className="text-[0.7rem] text-ink-muted">
                Night check-in consistency
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Energy Trend
              </span>
              <div className="pt-1">
                {weekStats.dominantEnergy ? (
                  <EnergyBadge energy={weekStats.dominantEnergy.energy} />
                ) : (
                  <span className="text-xs text-ink-muted italic">Not enough data</span>
                )}
              </div>
              <p className="text-[0.7rem] text-ink-muted pt-1">
                {weekStats.dominantEnergy ? `${weekStats.dominantEnergy.count} days recorded` : "Awaiting logs"}
              </p>
            </div>
          </div>

          {/* Consistent Area & Friction Row */}
          {(weekStats.mostConsistentCategory || weekStats.mostFrictionCategory) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {weekStats.mostConsistentCategory && (
                <div className="rounded-xl border border-rule bg-paper-card p-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[0.65rem] uppercase tracking-wider text-moss font-semibold">
                      Most Consistent Area
                    </span>
                    <span className="font-sans text-xs font-semibold text-moss">
                      {weekStats.mostConsistentCategory.ratePercent}%
                    </span>
                  </div>
                  <p className="font-serif text-xl text-ink font-normal">
                    {weekStats.mostConsistentCategory.label}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Strongest follow-through across {weekStats.mostConsistentCategory.total} commitments this week.
                  </p>
                </div>
              )}

              {weekStats.mostFrictionCategory && (
                <div className="rounded-xl border border-rule bg-paper-card p-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ember font-semibold">
                      Most Friction Area
                    </span>
                    <span className="font-sans text-xs font-semibold text-ember">
                      {weekStats.mostFrictionCategory.missedCount} missed
                    </span>
                  </div>
                  <p className="font-serif text-xl text-ink font-normal">
                    {weekStats.mostFrictionCategory.label}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Showed the highest resistance across {weekStats.mostFrictionCategory.total} commitments.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Weekly Insight Card */}
          {weekStats.insight && (
            <div className="rounded-xl border border-rule bg-paper-card p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="border-b border-rule pb-3 flex items-center justify-between">
                <span className="font-sans text-[0.65rem] uppercase tracking-[0.24em] text-moss font-semibold">
                  Weekly Pattern Synthesis
                </span>
                <span className="font-sans text-[0.62rem] uppercase tracking-wider text-ink-muted">
                  {weekStats.insight.provenance}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    What Happened
                  </p>
                  <p className="mt-1 font-serif text-xl sm:text-2xl text-ink leading-snug">
                    {weekStats.insight.observation}
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    What It Means
                  </p>
                  <p className="mt-1 font-serif text-lg sm:text-xl text-moss italic leading-snug">
                    &ldquo;{weekStats.insight.interpretation}&rdquo;
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    For Next Week
                  </p>
                  <p className="mt-1 font-sans text-sm text-ink/90 leading-relaxed">
                    {weekStats.insight.experiment}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONTH VIEW                                                            */}
      {/* ========================================================================= */}
      {period === "month" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Month Navigator */}
          <div className="flex items-center justify-between rounded-xl border border-rule bg-paper/80 p-4 sm:p-5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-xs uppercase tracking-[0.18em] text-ink hover:bg-paper-deep transition-colors cursor-pointer"
            >
              ← <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="text-center">
              <span className="font-serif text-xl sm:text-2xl text-ink font-normal block">
                {monthStats.formattedMonthYear}
              </span>
              {!isCurrentMonth ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedYear(todayDateObj.getFullYear());
                    setSelectedMonth(todayDateObj.getMonth());
                  }}
                  className="mt-1 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-ink-muted hover:text-ink underline cursor-pointer"
                >
                  Return to Current Month
                </button>
              ) : (
                <span className="font-sans text-[0.65rem] uppercase tracking-wider text-moss font-semibold">
                  Current Month
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              aria-label="Next Month"
              className="flex items-center gap-1.5 rounded px-3 py-1.5 font-sans text-xs uppercase tracking-[0.18em] text-ink hover:bg-paper-deep transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span> →
            </button>
          </div>

          {/* Monthly Calendar Grid */}
          <div className="rounded-xl border border-rule bg-paper-card p-5 sm:p-7 space-y-4">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center border-b border-rule pb-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day} className="font-sans text-[0.68rem] uppercase tracking-wider text-ink-muted font-semibold">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Empty leading cells */}
              {Array.from({ length: monthStats.firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-14 sm:h-18 rounded-lg bg-paper-deep/10 border border-transparent" />
              ))}

              {/* Month Days */}
              {monthStats.days.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    setSelectedDay(d.date);
                    setPeriod("day");
                  }}
                  className={`h-14 sm:h-18 rounded-lg border p-1.5 sm:p-2 flex flex-col justify-between text-left transition-all cursor-pointer group ${
                    d.isToday
                      ? "border-moss bg-moss/10 ring-1 ring-moss/30"
                      : d.hasActivity
                      ? "border-rule bg-paper hover:border-ink/40"
                      : "border-rule/40 bg-paper-deep/20 hover:border-rule"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-serif text-sm sm:text-base text-ink font-normal">
                      {d.dayNumber}
                    </span>
                    {d.energy && (
                      <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                    )}
                  </div>

                  {d.intentionsTotal > 0 ? (
                    <div className="space-y-0.5">
                      <span className="font-sans text-[0.58rem] sm:text-[0.62rem] font-semibold text-moss block">
                        {d.score}%
                      </span>
                      <div className="h-1 w-full rounded-full bg-paper-deep overflow-hidden">
                        <div
                          className="h-full rounded-full bg-moss"
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                    </div>
                  ) : d.hasReflection ? (
                    <span className="font-sans text-[0.55rem] text-ink-muted italic">Reflected</span>
                  ) : null}
                </button>
              ))}
            </div>
            <p className="text-[0.68rem] text-ink-muted text-center pt-2">
              Click any calendar day to inspect its full activity and reflections.
            </p>
          </div>

          {/* Monthly Summary Statistics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Total Intentions
              </span>
              <p className="font-serif text-2xl sm:text-3xl text-ink">
                {monthStats.totalIntentionsSet}
              </p>
              <p className="text-[0.7rem] text-ink-muted">
                {monthStats.totalCompleted} completed this month
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Monthly Follow-Through
              </span>
              <p className="font-serif text-2xl sm:text-3xl text-moss">
                {monthStats.overallScore}%
              </p>
              <p className="text-[0.7rem] text-ink-muted">
                Across {monthStats.activeDaysCount} active days
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Reflection Days
              </span>
              <p className="font-serif text-2xl sm:text-3xl text-ink">
                {monthStats.reflectionsCount}
              </p>
              <p className="text-[0.7rem] text-ink-muted">
                Days with night reflections
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-card p-4 sm:p-5 space-y-1">
              <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
                Dominant State
              </span>
              <div className="pt-1">
                {monthStats.dominantEnergy ? (
                  <EnergyBadge energy={monthStats.dominantEnergy.energy} />
                ) : (
                  <span className="text-xs text-ink-muted italic">Not enough data</span>
                )}
              </div>
              <p className="text-[0.7rem] text-ink-muted pt-1">
                {monthStats.dominantEnergy ? `${monthStats.dominantEnergy.count} days recorded` : "Awaiting logs"}
              </p>
            </div>
          </div>

          {/* Monthly Insight Card */}
          {monthStats.insight && (
            <div className="rounded-xl border border-rule bg-paper-card p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="border-b border-rule pb-3 flex items-center justify-between">
                <span className="font-sans text-[0.65rem] uppercase tracking-[0.24em] text-moss font-semibold">
                  Monthly Pattern Synthesis
                </span>
                <span className="font-sans text-[0.62rem] uppercase tracking-wider text-ink-muted">
                  {monthStats.insight.provenance}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    What Happened
                  </p>
                  <p className="mt-1 font-serif text-xl sm:text-2xl text-ink leading-snug">
                    {monthStats.insight.observation}
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    What It Means
                  </p>
                  <p className="mt-1 font-serif text-lg sm:text-xl text-moss italic leading-snug">
                    &ldquo;{monthStats.insight.interpretation}&rdquo;
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                    For Next Month
                  </p>
                  <p className="mt-1 font-sans text-sm text-ink/90 leading-relaxed">
                    {monthStats.insight.experiment}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ARCHIVED HISTORICAL INSIGHTS                                           */}
      {/* ========================================================================= */}
      {archivedInsightEntries.length > 0 && (
        <section className="space-y-4 border-t border-rule pt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xs uppercase tracking-[0.22em] text-ink font-semibold">
              Archived Daily Insights ({archivedInsightEntries.length})
            </h2>
            <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted">
              Historical Record
            </span>
          </div>

          <div className="space-y-4">
            {archivedInsightEntries.slice(0, 5).map((entry) => {
              const insight = entry.dailyInsight!;
              return (
                <div
                  key={entry.date}
                  className="rounded-xl border border-rule bg-paper-card p-5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-rule/50 pb-2">
                    <span className="font-sans text-xs font-semibold text-ink">
                      {formatDateLabel(entry.date)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay(entry.date);
                        setPeriod("day");
                      }}
                      className="font-sans text-[0.62rem] uppercase tracking-wider text-moss font-medium hover:underline cursor-pointer"
                    >
                      View Day →
                    </button>
                  </div>

                  <p className="font-serif text-base text-ink leading-snug">
                    {insight.observation}
                  </p>
                  <p className="font-serif text-sm text-moss italic">
                    &ldquo;{insight.interpretation}&rdquo;
                  </p>
                  <p className="text-xs text-ink-muted">
                    Experiment: {insight.experiment}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
