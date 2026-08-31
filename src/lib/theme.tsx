"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

let memoryTheme: ThemeMode = "light";
const themeListeners = new Set<() => void>();

function notifyThemeListeners() {
  themeListeners.forEach((l) => l());
}

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback);
  const onStorage = () => callback();
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getThemeClientSnapshot(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("livyue_theme") as ThemeMode | null;
    if (stored === "dark" || stored === "light") return stored;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  } catch {
    return memoryTheme;
  }
}

function getThemeServerSnapshot(): ThemeMode {
  return "light";
}

const emptySubscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function applyThemeToDOM(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
  try {
    localStorage.setItem("livyue_theme", mode);
    document.cookie = `livyue_theme=${mode}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Ignore
  }
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeClientSnapshot,
    getThemeServerSnapshot
  );

  const setTheme = (mode: ThemeMode) => {
    memoryTheme = mode;
    applyThemeToDOM(mode);
    notifyThemeListeners();
  };

  const toggleTheme = () => {
    const current = getThemeClientSnapshot();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Sun Icon (Refined minimal thin line)
 */
export function SunIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

/**
 * Moon Icon (Refined minimal thin line)
 */
export function MoonIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * Premium single circular theme button:
 * - In Light mode: Shows Moon icon (switches to dark)
 * - In Dark mode: Shows Sun icon (switches to light)
 * - useMounted ensures deterministic initial SSR render with zero hydration mismatch
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted && theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-rule bg-paper/60 hover:bg-paper-deep text-ink transition-all duration-300 cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-ink/20 ${className}`}
    >
      {isDark ? (
        <SunIcon className="w-3.5 h-3.5 text-ink transition-transform duration-300" />
      ) : (
        <MoonIcon className="w-3.5 h-3.5 text-ink transition-transform duration-300" />
      )}
    </button>
  );
}

export const ThemeSelector = ThemeToggle;
