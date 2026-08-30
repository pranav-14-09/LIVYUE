"use client";

import { useEffect, useState } from "react";
import { useLivyue } from "@/lib/use-livyue";
import { MorningView } from "@/components/app/morning-view";
import { EveningView } from "@/components/app/evening-view";
import { ReturningBanner } from "@/components/app/returning-banner";
import {
  DeleteConfirmModal,
  IntentionModal,
} from "@/components/app/intention-modal";
import {
  CheckInStatus,
  DailyIntentionInstance,
  EnergyLevel,
  Intention,
  IntentionCategory,
} from "@/lib/types";

export default function TodayPage() {
  const {
    store,
    isLoaded,
    todayEntry,
    returningStatus,
    addMorningIntention,
    updateMorningIntention,
    deleteMorningIntention,
    undoDeleteIntention,
    saveDayMessage,
    deleteDayMessage,
    updateEveningStatus,
    updateEveningNote,
    saveEveningReflection,
    updateSettings,
  } = useLivyue();

  // Time-aware default mode: morning before 17:00, evening after
  const [mode, setMode] = useState<"morning" | "evening">(() => {
    const hour = new Date().getHours();
    return hour < 17 ? "morning" : "evening";
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIntention, setEditingIntention] = useState<Intention | null>(
    null
  );
  const [deletingIntention, setDeletingIntention] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [showUndoIntention, setShowUndoIntention] = useState(false);
  const [showVerifiedToast, setShowVerifiedToast] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("verified") === "true";
    }
    return false;
  });

  // Clean URL and auto-hide toast if active
  useEffect(() => {
    if (showVerifiedToast && typeof window !== "undefined") {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      const timer = setTimeout(() => setShowVerifiedToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showVerifiedToast]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-sans text-xs uppercase tracking-[0.24em] text-ink-muted animate-pulse">
          Opening LIVYUE...
        </p>
      </div>
    );
  }

  const score = todayEntry.dailyScore || 0;
  const scoreDisplay = `${score}%`;

  let scoreLabel = "In progress";
  if (score === 100) scoreLabel = "Completed";
  else if (score > 0) scoreLabel = "Partially completed";
  else if (
    todayEntry.intentions.length > 0 &&
    todayEntry.intentions.every((i) => i.status === "missed")
  ) {
    scoreLabel = "Unfinished";
  }

  // Morning Handlers
  const handleOpenAdd = () => {
    setEditingIntention(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: DailyIntentionInstance) => {
    setEditingIntention({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      active: true,
      createdAt: new Date().toISOString(),
    });
    setModalOpen(true);
  };

  const handleSaveModal = (item: {
    title: string;
    description?: string;
    category: IntentionCategory;
    active: boolean;
  }) => {
    if (editingIntention) {
      updateMorningIntention(todayEntry.date, {
        id: editingIntention.id,
        title: item.title,
        category: item.category,
        description: item.description,
      });
    } else {
      addMorningIntention(todayEntry.date, {
        title: item.title,
        category: item.category,
        description: item.description,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingIntention) {
      deleteMorningIntention(todayEntry.date, deletingIntention.id);
      setDeletingIntention(null);
      setShowUndoIntention(true);
      setTimeout(() => setShowUndoIntention(false), 5000);
    }
  };

  const handleUndoDeleteIntention = () => {
    undoDeleteIntention();
    setShowUndoIntention(false);
  };

  // Evening Handlers
  const handleUpdateStatus = (intentionId: string, status: CheckInStatus) => {
    updateEveningStatus(todayEntry.date, intentionId, status);
  };

  const handleUpdateNote = (intentionId: string, note: string) => {
    updateEveningNote(todayEntry.date, intentionId, note);
  };

  const handleSaveEvening = (
    reflection: string,
    energyLevel?: EnergyLevel
  ) => {
    saveEveningReflection(todayEntry.date, reflection, undefined, energyLevel);
  };

  const handleDismissReturning = () => {
    updateSettings({ lastActiveDate: todayEntry.date });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Returning / Missed Days Banner */}
      {returningStatus.isReturning && (
        <ReturningBanner
          daysAway={returningStatus.daysAway}
          lastDate={returningStatus.lastDate}
          onDismiss={handleDismissReturning}
        />
      )}

      {/* Verified Account Toast */}
      {showVerifiedToast && (
        <div className="flex items-center justify-between rounded-xl border border-moss/40 bg-paper-deep/80 px-5 py-3.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="text-moss font-bold">✓</span>
            <span className="font-sans text-xs uppercase tracking-wider text-ink font-medium">
              Your email has been verified. Welcome to LIVYUE.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowVerifiedToast(false)}
            className="font-sans text-xs uppercase tracking-wider text-ink-muted hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("morning")}
            className={`rounded px-4 py-1.5 font-sans text-xs uppercase tracking-[0.2em] transition-all cursor-pointer ${
              mode === "morning"
                ? "bg-ink text-paper font-semibold shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-paper-deep/60"
            }`}
          >
            Morning Intentions
          </button>
          <button
            type="button"
            onClick={() => setMode("evening")}
            className={`rounded px-4 py-1.5 font-sans text-xs uppercase tracking-[0.2em] transition-all cursor-pointer ${
              mode === "evening"
                ? "bg-ink text-paper font-semibold shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-paper-deep/60"
            }`}
          >
            Night Reflection
          </button>
        </div>

        {/* Live score pill */}
        <div className="flex items-center gap-2 text-xs font-sans text-ink-muted">
          <span>Follow-Through:</span>
          <span className="font-semibold text-ink">
            {scoreDisplay} ({scoreLabel})
          </span>
        </div>
      </div>

      {/* Views */}
      {mode === "morning" ? (
        <MorningView
          entry={todayEntry}
          morningPromptText={store.settings.morningPromptText}
          onAddIntention={handleOpenAdd}
          onEditIntention={handleOpenEdit}
          onDeleteIntention={(id, title) => setDeletingIntention({ id, title })}
          onUndoDeleteIntention={handleUndoDeleteIntention}
          showUndoIntention={showUndoIntention}
          onSaveDayMessage={(msg) => saveDayMessage(todayEntry.date, msg)}
          onDeleteDayMessage={() => deleteDayMessage(todayEntry.date)}
          onSwitchToEvening={() => setMode("evening")}
        />
      ) : (
        <EveningView
          entry={todayEntry}
          eveningPromptText={store.settings.eveningPromptText}
          onUpdateStatus={handleUpdateStatus}
          onUpdateNote={handleUpdateNote}
          onSaveEvening={handleSaveEvening}
          onSwitchToMorning={() => setMode("morning")}
        />
      )}

      {/* Intention Modal for adding/editing */}
      <IntentionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        initial={editingIntention}
      />

      {/* Delete Confirmation Modal */}
      {deletingIntention && (
        <DeleteConfirmModal
          isOpen={true}
          onCancel={() => setDeletingIntention(null)}
          onConfirm={handleConfirmDelete}
          title={deletingIntention.title}
        />
      )}
    </div>
  );
}
