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
      className={`relative rounded-xl border p-6 sm:p-8 transition-all ${
        isDark
          ? "border-paper/10 bg-paper-card backdrop-blur-md text-paper shadow-[0_4px_20px_-6px_rgba(0,0,0,0.25)]"
          : "border-rule/80 bg-paper-card backdrop-blur-md text-ink shadow-[0_4px_20px_-6px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="flex items-center justify-between border-b pb-4 mb-4 border-current/10">
        <span className="font-sans text-[0.68rem] uppercase tracking-[0.24em] text-moss font-semibold">
          Daily Insight
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted block font-semibold">
            What Happened
          </span>
          <p className="font-serif text-xl leading-snug tracking-[-0.01em] sm:text-2xl mt-1">
            {insight.observation}
          </p>
        </div>

        <div>
          <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted block font-semibold">
            What It Means
          </span>
          <p className="font-serif text-lg leading-snug italic tracking-[-0.01em] text-moss mt-1">
            &ldquo;{insight.interpretation}&rdquo;
          </p>
        </div>

        <div>
          <span className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted block font-semibold">
            For Tomorrow
          </span>
          <p
            className={`mt-1 text-sm leading-relaxed ${
              isDark ? "text-paper/80" : "text-ink/90"
            }`}
          >
            {insight.experiment}
          </p>
        </div>
      </div>
    </article>
  );
}
