"use client";

import { DailyInsight } from "@/lib/types";

interface InsightCardProps {
  insight: DailyInsight;
  variant?: "dark" | "light";
}

export function InsightCard({ insight, variant = "light" }: InsightCardProps) {
  const isDark = variant === "dark";

  return (
    <article
      className={`relative rounded-2xl border p-6 sm:p-8 lg:p-10 transition-all ${
        isDark
          ? "border-paper/10 bg-paper-card text-paper shadow-[0_4px_24px_-8px_rgba(0,0,0,0.25)]"
          : "border-rule bg-paper-card text-ink shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-rule pb-4 mb-6">
        <span className="font-sans text-[0.68rem] uppercase tracking-[0.24em] text-moss font-semibold">
          Daily Honest Insight
        </span>
        <span className="font-sans text-[0.62rem] uppercase tracking-wider text-ink-muted">
          {insight.provenance || "Pattern Synthesis"}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <span className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted block font-semibold">
            What Happened
          </span>
          <p className="mt-2 font-serif text-xl sm:text-2xl leading-snug tracking-[-0.01em] text-ink">
            {insight.observation}
          </p>
        </div>

        <div>
          <span className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted block font-semibold">
            What It Means
          </span>
          <p className="mt-2 font-serif text-xl sm:text-2xl leading-snug italic tracking-[-0.01em] text-moss">
            &ldquo;{insight.interpretation}&rdquo;
          </p>
        </div>

        <div>
          <span className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted block font-semibold">
            For Tomorrow
          </span>
          <p
            className={`mt-2 text-sm sm:text-base leading-relaxed ${
              isDark ? "text-paper/85" : "text-ink/90"
            }`}
          >
            {insight.experiment}
          </p>
        </div>
      </div>
    </article>
  );
}
