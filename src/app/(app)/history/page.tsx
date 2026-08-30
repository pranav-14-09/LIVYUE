"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLivyue } from "@/lib/use-livyue";
import { DayCard } from "@/components/app/day-card";

export default function HistoryPage() {
  const { store, isLoaded, deleteDay, undoDeleteDay } = useLivyue();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState<"all" | "reflected">("all");
  const [showUndoDay, setShowUndoDay] = useState(false);

  const sortedEntries = useMemo(() => {
    const list = Object.values(store.entries).filter((entry) => {
      const hasMorning = Boolean(
        (entry.dayMessage && entry.dayMessage.trim()) ||
        (entry.morningIntention && entry.morningIntention.trim())
      );
      const hasEvening = Boolean(
        (entry.eveningReflection && entry.eveningReflection.trim()) ||
        (entry.takeaways && entry.takeaways.trim())
      );
      const hasIntentions =
        entry.completedEvening ||
        (entry.intentions && entry.intentions.length > 0) ||
        (entry.checkIns && entry.checkIns.length > 0);

      return hasMorning || hasEvening || hasIntentions;
    });

    list.sort((a, b) => b.date.localeCompare(a.date));

    return list.filter((entry) => {
      // Filter state: Reflected only shows days with actual reflection content
      if (filterState === "reflected") {
        const hasReflection = Boolean(
          (entry.eveningReflection && entry.eveningReflection.trim().length > 0) ||
          (entry.takeaways && entry.takeaways.trim().length > 0) ||
          (entry.dayMessage && entry.dayMessage.trim().length > 0) ||
          (entry.morningIntention && entry.morningIntention.trim().length > 0)
        );
        if (!hasReflection) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDayMsg =
          entry.dayMessage?.toLowerCase().includes(query) || false;
        const matchesReflection =
          entry.eveningReflection?.toLowerCase().includes(query) || false;
        const matchesTakeaways =
          entry.takeaways?.toLowerCase().includes(query) || false;
        const matchesMorning =
          entry.morningIntention?.toLowerCase().includes(query) || false;

        const matchesIntention =
          entry.intentions?.some(
            (i) =>
              i.title.toLowerCase().includes(query) ||
              (i.note && i.note.toLowerCase().includes(query))
          ) || false;

        const matchesCheckIns =
          entry.checkIns?.some(
            (c) =>
              (c.titleSnapshot && c.titleSnapshot.toLowerCase().includes(query)) ||
              (c.note && c.note.toLowerCase().includes(query))
          ) || false;

        return (
          matchesDayMsg ||
          matchesReflection ||
          matchesTakeaways ||
          matchesMorning ||
          matchesIntention ||
          matchesCheckIns
        );
      }

      return true;
    });
  }, [store.entries, filterState, searchTerm]);

  const handleDeleteDay = (date: string) => {
    deleteDay(date);
    setShowUndoDay(true);
    setTimeout(() => setShowUndoDay(false), 5000);
  };

  const handleUndoDeleteDay = () => {
    undoDeleteDay();
    setShowUndoDay(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-sans text-xs uppercase tracking-[0.24em] text-ink-muted animate-pulse">
          Opening History...
        </p>
      </div>
    );
  }

  const totalTrackedDays = Object.values(store.entries).filter(
    (e) =>
      e.completedEvening ||
      Boolean(e.dayMessage && e.dayMessage.trim()) ||
      Boolean(e.eveningReflection && e.eveningReflection.trim()) ||
      Boolean(e.takeaways && e.takeaways.trim()) ||
      (e.intentions && e.intentions.length > 0)
  ).length;

  const reflectedDaysCount = Object.values(store.entries).filter(
    (e) =>
      (e.eveningReflection && e.eveningReflection.trim().length > 0) ||
      (e.takeaways && e.takeaways.trim().length > 0) ||
      (e.dayMessage && e.dayMessage.trim().length > 0) ||
      (e.morningIntention && e.morningIntention.trim().length > 0)
  ).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <div>
        <p className="font-sans text-[0.7rem] uppercase tracking-[0.26em] text-ink-muted">
          Archive
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-[-0.02em] text-ink">
          The Timeline
        </h1>
        <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-ink-muted">
          An honest, unedited record of what actually happened on each day.
        </p>
      </div>

      {/* Undo Day Notification */}
      {showUndoDay && (
        <div className="flex items-center justify-between rounded-xl border border-moss/40 bg-paper-deep/80 px-5 py-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="font-sans text-xs uppercase tracking-wider text-ink font-medium">
            Day deleted.
          </span>
          <button
            type="button"
            onClick={handleUndoDeleteDay}
            className="font-sans text-xs uppercase tracking-[0.2em] font-semibold text-moss hover:underline cursor-pointer"
          >
            UNDO
          </button>
        </div>
      )}

      {/* Filter and Search Bar (ALL DAYS | REFLECTED) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-rule py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterState("all")}
            className={`rounded-full px-3.5 py-1 font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              filterState === "all"
                ? "bg-ink text-paper font-medium"
                : "bg-paper-deep/60 text-ink-muted hover:text-ink"
            }`}
          >
            All Days ({totalTrackedDays})
          </button>
          <button
            type="button"
            onClick={() => setFilterState("reflected")}
            className={`rounded-full px-3.5 py-1 font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              filterState === "reflected"
                ? "bg-ink text-paper font-medium"
                : "bg-paper-deep/60 text-ink-muted hover:text-ink"
            }`}
          >
            Reflected ({reflectedDaysCount})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages, reflections, notes..."
            className="w-full rounded border border-rule bg-paper/60 px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {/* Entries List */}
      {sortedEntries.length > 0 ? (
        <div className="space-y-6">
          {sortedEntries.map((entry) => (
            <DayCard
              key={entry.date}
              entry={entry}
              mode={filterState}
              onDeleteDay={handleDeleteDay}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-rule bg-paper-deep/20 p-12 text-center">
          <p className="font-serif text-2xl text-ink">
            {searchTerm ? "No matching records found." : "No days recorded yet."}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
            {searchTerm
              ? "Try adjusting your search terms or filter selection."
              : "As you set your morning intentions and complete evening evaluations, your real history will appear here."}
          </p>
          {!searchTerm && (
            <Link
              href="/today"
              className="mt-6 inline-block rounded bg-ink px-6 py-2.5 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 cursor-pointer"
            >
              Go to Today&apos;s Journal →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
