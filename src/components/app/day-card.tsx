"use client";

import { useState } from "react";
import { DayEntry } from "@/lib/types";
import { formatDateLabel } from "@/lib/storage";

interface DayCardProps {
  entry: DayEntry;
  defaultExpanded?: boolean;
  onDeleteDay?: (date: string) => void;
  mode?: "all" | "reflected";
}

export function DayCard({
  entry,
  defaultExpanded = true,
  onDeleteDay,
  mode = "all",
}: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const score = entry.dailyScore !== undefined ? entry.dailyScore : 0;
  const scoreDisplay = `${score}%`;

  let overallLabel = "UNFINISHED";
  let overallBadgeClass = "bg-paper-deep text-ink-muted";

  if (score === 100) {
    overallLabel = "COMPLETED";
    overallBadgeClass = "bg-moss/15 text-moss font-semibold";
  } else if (score > 0) {
    overallLabel = "PARTIALLY COMPLETED";
    overallBadgeClass = "bg-ember/15 text-ember font-semibold";
  }

  const dailyIntentions = entry.intentions || [];

  const morningText = entry.dayMessage?.trim() || entry.morningIntention?.trim() || "";
  const eveningText = entry.eveningReflection?.trim() || entry.takeaways?.trim() || "";

  const handleConfirmDeleteDay = () => {
    setShowConfirmDelete(false);
    if (onDeleteDay) {
      onDeleteDay(entry.date);
    }
  };

  return (
    <article className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md overflow-hidden transition-all hover:border-rule-strong shadow-[0_4px_20px_-6px_rgba(0,0,0,0.03)]">
      {/* 1. Header (Date + Progress Score in All mode + Collapse Toggle + Delete Day) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6 bg-transparent hover:bg-paper-deep/20 transition-colors select-none">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 cursor-pointer flex-1"
        >
          <span className="font-sans text-xs text-ink-muted">
            {isExpanded ? "▼" : "▶"}
          </span>
          <h3 className="font-serif text-xl sm:text-2xl text-ink">
            {formatDateLabel(entry.date)}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {mode === "all" && (
            <>
              <span
                className={`rounded-full px-3 py-0.5 font-sans text-[0.62rem] uppercase tracking-[0.16em] ${overallBadgeClass}`}
              >
                {scoreDisplay} &bull; {overallLabel}
              </span>
              {entry.completedEvening && (
                <span className="hidden sm:inline-block rounded-full bg-moss/10 px-2.5 py-0.5 font-sans text-[0.62rem] uppercase tracking-[0.16em] text-moss font-medium">
                  Evaluated ✓
                </span>
              )}
            </>
          )}

          {onDeleteDay && (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              title="Delete this day's record"
              className="text-ink-muted hover:text-ember transition-colors text-xs font-sans uppercase tracking-wider p-1 cursor-pointer"
            >
              Delete Day
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Banner */}
      {showConfirmDelete && (
        <div className="border-t border-ember/30 bg-ember/5 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <p className="text-xs text-ink font-medium">
            Delete this day&apos;s record ({formatDateLabel(entry.date)})?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="rounded px-3 py-1 text-xs text-ink-muted hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteDay}
              className="rounded bg-ember px-3.5 py-1 text-xs uppercase tracking-wider text-paper hover:opacity-90 font-medium cursor-pointer"
            >
              Delete Day
            </button>
          </div>
        </div>
      )}

      {/* 2. Expanded Content */}
      {isExpanded && (
        <>
          {mode === "reflected" ? (
            /* REFLECTED VIEW: ONLY User-Written Reflective Content (Morning & Evening) */
            <div className="border-t border-rule px-5 py-6 sm:px-7 space-y-6 animate-in fade-in duration-150">
              {morningText && (
                <div className="space-y-1.5">
                  <span className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted font-semibold block">
                    Morning
                  </span>
                  <div className="rounded-lg bg-paper-deep/30 p-4 border border-rule/50">
                    <p className="font-serif text-base text-ink leading-relaxed">
                      {morningText}
                    </p>
                  </div>
                </div>
              )}

              {morningText && eveningText && <div className="h-px bg-rule/50" />}

              {eveningText && (
                <div className="space-y-1.5">
                  <span className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted font-semibold block">
                    Night Reflection
                  </span>
                  <div className="rounded-lg bg-paper-deep/30 p-4 border border-rule/50">
                    <p className="font-serif text-base text-ink leading-relaxed">
                      {eveningText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ALL DAYS VIEW: Full Existing Journal Details */
            <div className="border-t border-rule px-5 py-6 sm:px-7 space-y-6 animate-in fade-in duration-150">
              {/* MY DAY'S MESSAGE */}
              {entry.dayMessage && (
                <div className="border-l-2 border-moss/60 pl-3.5 space-y-1">
                  <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted">
                    My Day&apos;s Message
                  </span>
                  <p className="font-serif text-base sm:text-lg italic text-ink leading-snug">
                    &ldquo;{entry.dayMessage}&rdquo;
                  </p>
                </div>
              )}

              {/* STATE OF MIND / ENERGY */}
              {entry.energyLevel && (
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted">
                    State of Mind:
                  </span>
                  <span className="rounded-full bg-paper-deep px-2.5 py-0.5 font-sans text-[0.62rem] uppercase tracking-[0.16em] text-ink font-medium">
                    {entry.energyLevel}
                  </span>
                </div>
              )}

              {/* MORNING INTENTIONS & EVALUATION RESULTS */}
              {dailyIntentions.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted">
                      Daily Intentions & Results ({dailyIntentions.length})
                    </span>
                    <span className="font-sans text-[0.62rem] uppercase tracking-wider text-ink-muted">
                      Overall: {scoreDisplay}
                    </span>
                  </div>

                  <div className="divide-y divide-rule/40 rounded-lg border border-rule bg-paper-deep/20 overflow-hidden">
                    {dailyIntentions.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-sans text-[0.58rem] uppercase tracking-wider text-ink-muted rounded bg-paper-deep px-1.5 py-0.5">
                            {item.category}
                          </span>
                          <span className="text-sm font-medium text-ink">
                            {item.title}
                          </span>
                          {item.note && (
                            <span className="text-xs text-ink-muted italic hidden md:inline">
                              — {item.note}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.note && (
                            <span className="text-xs text-ink-muted italic md:hidden">
                              {item.note}
                            </span>
                          )}
                          <span
                            className={`rounded px-2.5 py-0.5 font-sans text-[0.62rem] uppercase tracking-[0.14em] font-semibold shrink-0 ${
                              item.status === "done"
                                ? "bg-moss text-paper"
                                : item.status === "partial"
                                ? "bg-ember text-paper"
                                : "bg-ink text-paper"
                            }`}
                          >
                            {item.status === "partial"
                              ? "PARTIALLY"
                              : item.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NIGHT REFLECTION */}
              {entry.eveningReflection && (
                <div className="rounded-lg bg-paper-deep/30 p-4 border border-rule/50 space-y-1">
                  <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted block">
                    Night Reflection
                  </span>
                  <p className="font-serif text-base text-ink leading-relaxed">
                    {entry.eveningReflection}
                  </p>
                </div>
              )}

              {/* EVENING TAKEAWAYS */}
              {entry.takeaways && (
                <div className="rounded-lg bg-paper-deep/40 p-4 border border-rule/50 space-y-1">
                  <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted block">
                    Takeaways
                  </span>
                  <p className="font-sans text-sm text-ink/90 leading-relaxed">
                    {entry.takeaways}
                  </p>
                </div>
              )}

              {/* DAILY INSIGHT */}
              {entry.dailyInsight && (
                <div className="rounded-lg bg-paper-deep/30 backdrop-blur-xs p-4 sm:p-5 border border-rule/60 space-y-3">
                  <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-moss font-semibold block">
                    Daily Insight
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-ink-muted font-sans uppercase text-[0.58rem] tracking-wider block">
                        What Happened
                      </span>
                      <p className="text-ink font-serif text-base mt-0.5">
                        {entry.dailyInsight.observation}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted font-sans uppercase text-[0.58rem] tracking-wider block">
                        What It Means
                      </span>
                      <p className="text-moss italic font-serif text-base mt-0.5">
                        &ldquo;{entry.dailyInsight.interpretation}&rdquo;
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted font-sans uppercase text-[0.58rem] tracking-wider block">
                        For Tomorrow
                      </span>
                      <p className="text-ink text-sm mt-0.5">
                        {entry.dailyInsight.experiment}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}
