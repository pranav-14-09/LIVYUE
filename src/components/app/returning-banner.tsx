"use client";

import { useState } from "react";
import { formatShortDate } from "@/lib/storage";

interface ReturningBannerProps {
  daysAway: number;
  lastDate?: string;
  onDismiss: () => void;
}

export function ReturningBanner({
  daysAway,
  lastDate,
  onDismiss,
}: ReturningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      role="status"
      aria-label="Welcome back notification"
      className="relative mb-8 rounded-lg border border-moss/25 bg-paper-deep/70 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-sans text-[0.68rem] uppercase tracking-[0.24em] text-moss">
            Welcome back
          </p>
          <h2 className="mt-2 font-serif text-2xl leading-snug tracking-[-0.02em] text-ink sm:text-3xl">
            You don&apos;t need to restart anything.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
            It has been {daysAway} days since your last check-in
            {lastDate ? ` on ${formatShortDate(lastDate)}` : ""}. Missing time
            is never treated as a failure here. There is no streak broken and
            no penalty to pay. Returning is itself the practice.
          </p>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          className="self-start rounded border border-rule-strong bg-paper px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] text-ink transition-colors hover:border-ink"
        >
          Continue Today →
        </button>
      </div>
    </aside>
  );
}
