"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLivyue } from "@/lib/use-livyue";

interface DatePickerPopoverProps {
  selectedDate: string; // YYYY-MM-DD
  liveDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePickerPopover({
  selectedDate,
  liveDate,
  onSelectDate,
  onClose,
}: DatePickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { store } = useLivyue();

  const [initialYear, initialMonth] = useMemo(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    return [y, m - 1];
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Generate calendar days grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      hasEntry: boolean;
    }[] = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(
        dayNum
      ).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === liveDate,
        hasEntry: Boolean(store.entries[dateStr]),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(
        2,
        "0"
      )}-${String(i).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === liveDate,
        hasEntry: Boolean(store.entries[dateStr]),
      });
    }

    // Next month padding days to complete 6-row or full week grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === liveDate,
        hasEntry: Boolean(store.entries[dateStr]),
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate, liveDate, store.entries]);

  // Year options range from 2020 to 2035
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 2020; y <= 2035; y++) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-3 z-50 w-72 sm:w-80 rounded-2xl border border-rule/80 bg-paper-card backdrop-blur-xl p-4 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 duration-150 select-none"
      role="dialog"
      aria-label="Select Date"
    >
      {/* Calendar Header: Month & Year Selectors with Prev/Next Navigation */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-rule/60">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Previous Month"
          className="rounded p-1.5 text-ink-muted hover:text-ink hover:bg-paper-deep/60 transition-colors cursor-pointer"
        >
          ←
        </button>

        <div className="flex items-center gap-1.5">
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="rounded border border-rule/60 bg-paper px-2 py-1 font-sans text-xs font-medium text-ink focus:border-ink focus:outline-none cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="rounded border border-rule/60 bg-paper px-2 py-1 font-sans text-xs font-medium text-ink focus:border-ink focus:outline-none cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Next Month"
          className="rounded p-1.5 text-ink-muted hover:text-ink hover:bg-paper-deep/60 transition-colors cursor-pointer"
        >
          →
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center font-sans text-[0.65rem] uppercase tracking-wider text-ink-muted">
        {WEEKDAY_NAMES.map((w) => (
          <div key={w} className="py-0.5">
            {w}
          </div>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1 pt-1">
        {calendarDays.map((day) => {
          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(day.dateStr)}
              className={`relative flex h-8 w-full items-center justify-center rounded-lg font-sans text-xs transition-all cursor-pointer ${
                day.isSelected
                  ? "bg-ink text-paper font-semibold shadow-xs"
                  : day.isToday
                  ? "border border-moss text-moss font-semibold hover:bg-paper-deep/60"
                  : day.isCurrentMonth
                  ? "text-ink hover:bg-paper-deep/60 font-normal"
                  : "text-ink-muted/40 hover:bg-paper-deep/30"
              }`}
            >
              <span>{day.dayNumber}</span>
              {/* Recorded entry indicator dot */}
              {day.hasEntry && !day.isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-moss/70" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Quick Actions */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-rule/60">
        <button
          type="button"
          onClick={() => onSelectDate(liveDate)}
          className="font-sans text-[0.68rem] uppercase tracking-[0.16em] text-moss font-semibold hover:underline cursor-pointer"
        >
          Today
        </button>

        <button
          type="button"
          onClick={onClose}
          className="font-sans text-[0.68rem] uppercase tracking-[0.16em] text-ink-muted hover:text-ink cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
