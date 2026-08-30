"use client";

import { useState } from "react";
import { Intention, IntentionCategory } from "@/lib/types";

interface IntentionModalProps {
  initial?: Intention | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    title: string;
    description?: string;
    category: IntentionCategory;
    active: boolean;
  }) => void;
}

const CATEGORIES: { value: IntentionCategory; label: string }[] = [
  { value: "health", label: "Health & Body" },
  { value: "work", label: "Focus & Work" },
  { value: "learning", label: "Study & Reading" },
  { value: "mind", label: "Mind & Rest" },
  { value: "relationships", label: "Relationships" },
  { value: "craft", label: "Craft & Creation" },
  { value: "personal", label: "Personal" },
];

function IntentionFormContent({
  initial,
  onClose,
  onSave,
}: {
  initial?: Intention | null;
  onClose: () => void;
  onSave: (item: {
    title: string;
    description?: string;
    category: IntentionCategory;
    active: boolean;
  }) => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState<IntentionCategory>(
    initial?.category || "personal"
  );
  const [active, setActive] = useState(
    initial
      ? initial.active !== undefined
        ? initial.active
        : !initial.archived
      : true
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      active,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label className="block font-sans text-xs uppercase tracking-[0.2em] text-ink-muted">
          Title
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Quiet Morning Walk, Deep Work Session..."
          className="mt-2 w-full rounded border border-rule bg-paper-deep/40 px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-sans text-xs uppercase tracking-[0.2em] text-ink-muted">
          Area of Life
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`rounded-full border px-3 py-1 font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                category === cat.value
                  ? "border-ink bg-ink text-paper font-medium"
                  : "border-rule bg-paper-deep/30 text-ink-muted hover:border-ink/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-sans text-xs uppercase tracking-[0.2em] text-ink-muted">
          Description (Optional)
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A gentle note on what this looks like for you..."
          className="mt-2 w-full rounded border border-rule bg-paper-deep/40 p-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-rule bg-paper-deep/20 p-3">
        <div>
          <p className="font-sans text-xs uppercase tracking-wider text-ink font-medium">
            Active for Today & Future Days
          </p>
          <p className="text-xs text-ink-muted">
            {active ? "Appears in your daily landscape" : "Paused / inactive"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActive(!active)}
          className={`rounded-full px-4 py-1 font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer ${
            active
              ? "bg-moss text-paper font-medium"
              : "bg-paper-deep text-ink-muted border border-rule"
          }`}
        >
          {active ? "Active" : "Paused"}
        </button>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-rule">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] text-ink-muted hover:text-ink cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded bg-ink px-6 py-2 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 transition-opacity cursor-pointer"
        >
          {initial ? "Save Changes" : "Add Intention"}
        </button>
      </div>
    </form>
  );
}

export function IntentionModal({
  initial,
  isOpen,
  onClose,
  onSave,
}: IntentionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-rule bg-paper p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <h2 className="font-serif text-2xl text-ink">
            {initial ? "Edit Intention" : "New Intention"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink font-sans text-xs uppercase tracking-widest cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <IntentionFormContent
          key={initial ? initial.id : "new_intention"}
          initial={initial}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-rule bg-paper p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-150">
        <h2 className="font-serif text-2xl text-ink">Delete this intention?</h2>
        <p className="mt-3 text-sm text-ink-muted leading-relaxed">
          &ldquo;<strong className="text-ink font-medium">{title}</strong>&rdquo; will be removed from your active intentions and future check-ins.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-rule pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] text-ink-muted hover:text-ink cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-ember px-5 py-2 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
