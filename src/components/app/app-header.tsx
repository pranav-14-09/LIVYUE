"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { ThemeSelector } from "@/lib/theme";
import { useLivyue } from "@/lib/use-livyue";
import { formatDateLabel } from "@/lib/storage";
import { DatePickerPopover } from "@/components/app/date-picker-popover";

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunriseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2v4" />
      <path d="M4.93 10.93l2.83-2.83" />
      <path d="M19.07 10.93l-2.83-2.83" />
      <path d="M2 18h20" />
      <path d="M17 18a5 5 0 0 0-10 0" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.93 4.93l1.77 1.77" />
      <path d="M17.3 17.3l1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="M4.93 19.07l1.77-1.77" />
      <path d="M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function SunsetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 18a5 5 0 0 0-10 0" />
      <path d="M2 18h20" />
      <path d="M12 9v5" />
      <path d="M9.5 11.5L12 14l2.5-2.5" />
      <path d="M4.93 10.93l2.12-2.12" />
      <path d="M19.07 10.93l-2.12-2.12" />
    </svg>
  );
}

function PhaseIcon({
  phase,
}: {
  phase: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | string;
}) {
  switch (phase) {
    case "MORNING":
      return <SunriseIcon className="w-2.5 h-2.5 shrink-0 text-moss" />;
    case "AFTERNOON":
      return <SunIcon className="w-2.5 h-2.5 shrink-0 text-moss" />;
    case "EVENING":
      return <SunsetIcon className="w-2.5 h-2.5 shrink-0 text-moss" />;
    case "NIGHT":
    default:
      return <MoonIcon className="w-2.5 h-2.5 shrink-0 text-moss" />;
  }
}

export function AppHeader() {
  const pathname = usePathname();
  const { todayDate, liveDate, selectedDate, setSelectedDate, currentPhase } =
    useLivyue();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const dateFormatted = formatDateLabel(todayDate);

  const navLinks = [
    { href: "/today", label: "Today" },
    { href: "/insights", label: "Insights" },
    { href: "/history", label: "History" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="border-b border-rule bg-paper/75 backdrop-blur-md sticky top-0 z-30 w-full transition-colors duration-300">
      <div className="w-full px-5 py-4 sm:px-8 md:px-10 lg:px-12 xl:px-16 flex items-center justify-between">
        {/* Top-Left: Prominent LIVYUE Wordmark + Date & Phase info */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <Link href="/today" className="group flex items-center shrink-0">
            <Wordmark size="lg" className="transition-opacity hover:opacity-80" />
          </Link>
          <div className="hidden sm:flex items-center gap-3 lg:gap-4 pl-3 sm:pl-4 border-l border-rule/70 relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen((prev) => !prev)}
              className="font-sans text-xs tracking-wider text-ink-muted hover:text-ink select-none cursor-pointer transition-colors focus:outline-none flex items-center gap-1.5"
              aria-label="Open date calendar"
              aria-expanded={isDatePickerOpen}
            >
              <span>{dateFormatted}</span>
              {selectedDate && selectedDate !== liveDate && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-moss shrink-0"
                  title="Viewing custom date"
                />
              )}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep/60 backdrop-blur-xs border border-rule/50 px-2.5 py-0.5 font-sans text-[0.65rem] uppercase tracking-[0.18em] text-moss font-semibold select-none shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <PhaseIcon phase={currentPhase} />
              <span>{currentPhase}</span>
            </span>

            {/* Date Picker Popover */}
            {isDatePickerOpen && (
              <DatePickerPopover
                selectedDate={todayDate}
                liveDate={liveDate}
                onSelectDate={(newDate) => {
                  setSelectedDate(newDate === liveDate ? null : newDate);
                  setIsDatePickerOpen(false);
                }}
                onClose={() => setIsDatePickerOpen(false)}
              />
            )}
          </div>
        </div>

        {/* Right: Primary Navigation Links & Theme Selector */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          <nav
            className="flex items-center gap-1 sm:gap-3 lg:gap-4 shrink-0"
            aria-label="Main App Navigation"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded px-2.5 py-1 font-sans text-[0.68rem] uppercase tracking-[0.18em] transition-colors sm:text-xs sm:tracking-[0.22em] ${
                    isActive
                      ? "font-medium text-ink bg-paper-deep/60"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <ThemeSelector className="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  );
}
