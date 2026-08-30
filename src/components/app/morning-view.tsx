"use client";

import { useState } from "react";
import { DailyIntentionInstance, DayEntry } from "@/lib/types";

interface MorningViewProps {
  entry: DayEntry;
  morningPromptText?: string;
  onAddIntention: () => void;
  onEditIntention: (item: DailyIntentionInstance) => void;
  onDeleteIntention: (id: string, title: string) => void;
  onUndoDeleteIntention?: () => void;
  showUndoIntention?: boolean;
  onSaveDayMessage: (message: string) => void;
  onDeleteDayMessage: () => void;
  onSwitchToEvening: () => void;
}

export function MorningView({
  entry,
  morningPromptText,
  onAddIntention,
  onEditIntention,
  onDeleteIntention,
  onUndoDeleteIntention,
  showUndoIntention,
  onSaveDayMessage,
  onDeleteDayMessage,
  onSwitchToEvening,
}: MorningViewProps) {
  // Day's Message state
  const [dayMsgText, setDayMsgText] = useState(entry.dayMessage || "");
  const [isEditingDayMsg, setIsEditingDayMsg] = useState(!entry.dayMessage);
  const [dayMsgSavedFeedback, setDayMsgSavedFeedback] = useState(false);

  const intentions = entry.intentions || [];

  const handleSaveDayMsg = () => {
    if (!dayMsgText.trim()) return;
    onSaveDayMessage(dayMsgText.trim());
    setIsEditingDayMsg(false);
    setDayMsgSavedFeedback(true);
    setTimeout(() => setDayMsgSavedFeedback(false), 2500);
  };

  const handleDeleteDayMsg = () => {
    onDeleteDayMessage();
    setDayMsgText("");
    setIsEditingDayMsg(true);
  };

  return (
    <section className="space-y-10 animate-in fade-in duration-200">
      <div>
        <p className="font-sans text-[0.7rem] uppercase tracking-[0.26em] text-ink-muted">
          The Morning
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-[-0.02em] text-ink">
          How do you want to spend today?
        </h1>
        <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-ink-muted">
          {morningPromptText || "Choose the intentions and focus areas you want to give your attention to today."}
        </p>
      </div>

      {/* Undo Intention Notification */}
      {showUndoIntention && onUndoDeleteIntention && (
        <div className="flex items-center justify-between rounded-xl border border-moss/40 bg-paper-deep/80 px-5 py-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="font-sans text-xs uppercase tracking-wider text-ink font-medium">
            Intention deleted.
          </span>
          <button
            type="button"
            onClick={onUndoDeleteIntention}
            className="font-sans text-xs uppercase tracking-[0.2em] font-semibold text-moss hover:underline cursor-pointer"
          >
            UNDO
          </button>
        </div>
      )}

      {/* 1. MY DAY'S MESSAGE */}
      <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-6 sm:p-7 space-y-3 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <label
            htmlFor="day-message-input"
            className="block font-sans text-xs uppercase tracking-[0.22em] text-ink-muted font-medium"
          >
            My Day&apos;s Message
          </label>
          {!isEditingDayMsg && entry.dayMessage && (
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setDayMsgText(entry.dayMessage || "");
                  setIsEditingDayMsg(true);
                }}
                className="font-sans text-[0.65rem] uppercase tracking-[0.16em] text-ink-muted hover:text-ink cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteDayMsg}
                className="font-sans text-[0.65rem] uppercase tracking-[0.16em] text-ember hover:opacity-80 cursor-pointer"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {isEditingDayMsg || !entry.dayMessage ? (
          <div className="space-y-3">
            <input
              id="day-message-input"
              type="text"
              value={dayMsgText}
              onChange={(e) => setDayMsgText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  handleSaveDayMsg();
                }
              }}
              placeholder="e.g. Focus on clarity and deep work without rushing..."
              className="w-full rounded-md border border-rule bg-paper px-4 py-2.5 font-sans text-sm text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDayMsg}
                className="rounded bg-ink px-5 py-2 font-sans text-xs uppercase tracking-[0.2em] text-paper hover:opacity-90 cursor-pointer shadow-xs"
              >
                Save Day&apos;s Message
              </button>
              {entry.dayMessage && (
                <button
                  type="button"
                  onClick={() => setIsEditingDayMsg(false)}
                  className="font-sans text-xs text-ink-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg bg-paper-deep/30 backdrop-blur-xs p-4 border border-rule/60">
              <p className="font-serif text-xl italic text-ink leading-snug">
                &ldquo;{entry.dayMessage}&rdquo;
              </p>
            </div>
            {dayMsgSavedFeedback && (
              <p className="font-sans text-xs text-moss font-medium">
                ✓ Message saved for today.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. TODAY'S INTENTIONS (Planning only - No Done/Partial/Missed buttons) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sans text-xs uppercase tracking-[0.22em] text-ink font-semibold">
              Today&apos;s Intentions ({intentions.length})
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              The commitments you choose for today.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddIntention}
            className="rounded bg-ink px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] text-paper hover:opacity-90 shadow-xs cursor-pointer"
          >
            + Add Intention
          </button>
        </div>

        {intentions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rule bg-paper-deep/20 p-10 text-center space-y-3">
            <p className="font-serif text-2xl text-ink">No intentions set yet.</p>
            <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
              Add the specific things you want to give your attention to today.
            </p>
            <button
              type="button"
              onClick={onAddIntention}
              className="mt-2 rounded bg-ink px-6 py-2.5 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 cursor-pointer"
            >
              + Add Intention
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {intentions.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-5 transition-all hover:border-rule-strong hover:bg-paper-card/90 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]"
              >
                <div>
                  <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-moss font-medium">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-xl text-ink font-normal mt-1">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 text-xs text-ink-muted line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-rule/60 pt-3">
                  <button
                    type="button"
                    onClick={() => onEditIntention(item)}
                    className="font-sans text-[0.68rem] uppercase tracking-[0.16em] text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteIntention(item.id, item.title)}
                    className="font-sans text-[0.68rem] uppercase tracking-[0.16em] text-ember hover:opacity-80 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation to Night Evaluation */}
      <div className="flex items-center justify-between border-t border-rule pt-6">
        <p className="text-xs text-ink-muted">
          Your intentions are set for the day. You will evaluate them at night.
        </p>
        <button
          type="button"
          onClick={onSwitchToEvening}
          className="font-sans text-xs uppercase tracking-[0.2em] text-ink hover:text-moss underline underline-offset-4 cursor-pointer"
        >
          Go to Night Evaluation →
        </button>
      </div>
    </section>
  );
}
