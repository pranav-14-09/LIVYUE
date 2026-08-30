"use client";

import { useState } from "react";
import {
  CheckInStatus,
  DayEntry,
  EnergyLevel,
} from "@/lib/types";

interface EveningViewProps {
  entry: DayEntry;
  eveningPromptText?: string;
  onUpdateStatus: (intentionId: string, status: CheckInStatus) => void;
  onUpdateNote: (intentionId: string, note: string) => void;
  onSaveEvening: (reflection: string, energyLevel?: EnergyLevel) => void;
  onSwitchToMorning?: () => void;
}

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: "calm", label: "Calm" },
  { value: "clear", label: "Clear" },
  { value: "tired", label: "Tired" },
  { value: "heavy", label: "Heavy" },
  { value: "scattered", label: "Scattered" },
];

export function EveningView({
  entry,
  eveningPromptText,
  onUpdateStatus,
  onUpdateNote,
  onSaveEvening,
  onSwitchToMorning,
}: EveningViewProps) {
  const intentions = entry.intentions || [];

  const [reflection, setReflection] = useState(entry.eveningReflection || "");
  const [energy, setEnergy] = useState<EnergyLevel>(
    entry.energyLevel || "calm"
  );
  const [savedFeedback, setSavedFeedback] = useState(false);

  const score = entry.dailyScore !== undefined ? entry.dailyScore : 0;
  const scoreDisplay = `${score}%`;

  let scoreLabel = "In progress";
  if (score === 100) scoreLabel = "Completed";
  else if (score > 0) scoreLabel = "Partially completed";
  else if (intentions.length > 0 && intentions.every((i) => i.status === "missed"))
    scoreLabel = "Unfinished";

  const handleSave = () => {
    onSaveEvening(reflection.trim(), energy);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const currentInsight = entry.dailyInsight;

  const doneCount = intentions.filter((i) => i.status === "done").length;
  const partialCount = intentions.filter((i) => i.status === "partial").length;
  const missedCount = intentions.filter((i) => i.status === "missed").length;

  return (
    <section className="space-y-10 animate-in fade-in duration-200">
      <div>
        <p className="font-sans text-[0.7rem] uppercase tracking-[0.26em] text-ink-muted">
          The Night
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-[-0.02em] text-ink">
          How did today actually go?
        </h1>
        <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-ink-muted">
          Evaluate what happened honestly. No performance or punishment, just the truth of your day.
        </p>
      </div>

      {/* 1. TODAY'S INTENTIONS EVALUATION (No Add Button) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-xs uppercase tracking-[0.22em] text-ink font-semibold">
            Evaluate Today&apos;s Intentions ({intentions.length})
          </h2>
          <span className="font-sans text-[0.68rem] uppercase tracking-wider text-ink-muted">
            Created this Morning
          </span>
        </div>

        {intentions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rule bg-paper-deep/20 p-8 text-center space-y-2">
            <p className="font-serif text-xl text-ink">
              No intentions were set this morning.
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              You can set intentions for today in the Morning view.
            </p>
            <button
              type="button"
              onClick={onSwitchToMorning}
              className="mt-3 rounded bg-ink px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] text-paper hover:opacity-90 cursor-pointer"
            >
              Go to Morning View
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {intentions.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-4 sm:p-5 transition-all hover:border-rule-strong hover:bg-paper-card/90 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                      {item.category}
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl text-ink font-normal">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* 3 Status Controls (Fitts's Law) */}
                  <div className="flex items-center gap-1.5 rounded-lg bg-paper-deep/60 backdrop-blur-xs border border-rule/50 p-1 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, "done")}
                      className={`rounded px-3.5 py-1.5 font-sans text-xs uppercase tracking-[0.16em] transition-all cursor-pointer ${
                        item.status === "done"
                          ? "bg-moss text-paper shadow-xs font-semibold"
                          : "text-ink-muted hover:text-ink hover:bg-paper/60"
                      }`}
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, "partial")}
                      className={`rounded px-3.5 py-1.5 font-sans text-xs uppercase tracking-[0.16em] transition-all cursor-pointer ${
                        item.status === "partial"
                          ? "bg-ember text-paper shadow-xs font-semibold"
                          : "text-ink-muted hover:text-ink hover:bg-paper/60"
                      }`}
                    >
                      Partially
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, "missed")}
                      className={`rounded px-3.5 py-1.5 font-sans text-xs uppercase tracking-[0.16em] transition-all cursor-pointer ${
                        item.status === "missed"
                          ? "bg-ink text-paper shadow-xs font-semibold"
                          : "text-ink-muted hover:text-ink hover:bg-paper/60"
                      }`}
                    >
                      Missed
                    </button>
                  </div>
                </div>

                {/* Optional note for intention */}
                <div className="mt-2.5">
                  <input
                    type="text"
                    defaultValue={item.note || ""}
                    onBlur={(e) => onUpdateNote(item.id, e.target.value)}
                    placeholder="Optional note on what happened..."
                    className="w-full rounded border border-rule/50 bg-paper-deep/20 px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. TODAY'S PROGRESS SCORE */}
      {intentions.length > 0 && (
        <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-5 flex items-center justify-between shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
          <div>
            <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted block">
              Today&apos;s Progress
            </span>
            <p className="font-serif text-2xl sm:text-3xl text-ink font-normal mt-0.5">
              {scoreDisplay}{" "}
              <span className="text-xs font-sans text-ink-muted uppercase tracking-wider font-normal">
                &bull; {scoreLabel}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-sans text-ink-muted">
            <span className="text-moss font-semibold">
              {doneCount} Done
            </span>
            &bull;
            <span className="text-ember font-semibold">
              {partialCount} Partial
            </span>
            &bull;
            <span className="text-ink font-semibold">
              {missedCount} Missed
            </span>
          </div>
        </div>
      )}

      {/* 3. STATE OF MIND / ENERGY */}
      <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-6 sm:p-7 space-y-3 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
        <label className="block font-sans text-xs uppercase tracking-[0.22em] text-ink-muted font-medium">
          State of Mind / Energy
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setEnergy(opt.value);
                onSaveEvening(reflection.trim(), opt.value);
              }}
              className={`rounded-full border px-4 py-1.5 font-sans text-xs uppercase tracking-[0.18em] transition-all cursor-pointer ${
                energy === opt.value
                  ? "border-ink bg-ink text-paper font-medium"
                  : "border-rule bg-paper text-ink-muted hover:border-ink/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. NIGHT REFLECTION (Single Generous Writing Area) */}
      <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-6 sm:p-8 space-y-4 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
        <div>
          <label
            htmlFor="evening-reflection-text"
            className="block font-serif text-2xl sm:text-3xl text-ink font-normal"
          >
            Night Reflection
          </label>
          <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
            {eveningPromptText || "A few honest words about what felt easy, difficult, or true today."}
          </p>
        </div>

        <textarea
          id="evening-reflection-text"
          rows={6}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleSave();
            }
          }}
          placeholder="A few honest words about what felt easy, difficult, or true today..."
          className="w-full rounded-lg border border-rule bg-paper-deep/20 p-4 font-sans text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors leading-relaxed"
        />

        {savedFeedback && (
          <p className="font-sans text-xs text-moss font-medium">
            ✓ Reflection saved.
          </p>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-ink px-6 py-2.5 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 transition-opacity cursor-pointer shadow-xs font-medium"
          >
            Save Reflection
          </button>
        </div>
      </div>

      {/* 5. TODAY'S DYNAMIC INSIGHT */}
      {currentInsight ? (
        <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-6 sm:p-8 space-y-5 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.03)] animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <span className="font-sans text-[0.65rem] uppercase tracking-[0.24em] text-moss font-semibold">
              Today&apos;s Honest Insight
            </span>
            <span className="font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted">
              Live Interpretation
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted">
                What Happened
              </p>
              <p className="mt-1 font-serif text-lg sm:text-xl text-ink leading-snug">
                {currentInsight.observation}
              </p>
            </div>

            <div>
              <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted">
                What It Means
              </p>
              <p className="mt-1 font-serif text-lg sm:text-xl text-moss italic leading-snug">
                &ldquo;{currentInsight.interpretation}&rdquo;
              </p>
            </div>

            <div>
              <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted">
                For Tomorrow
              </p>
              <p className="mt-1 font-sans text-sm text-ink/90 leading-relaxed">
                {currentInsight.experiment}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-rule bg-paper-deep/20 p-6 text-center">
          <p className="font-serif text-lg text-ink">
            Keep reflecting.
          </p>
          <p className="mt-1 text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
            A few more days will give LIVYUE enough context to notice a useful pattern.
          </p>
        </div>
      )}
    </section>
  );
}
