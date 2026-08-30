import { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink transition-colors duration-300">
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-rule py-8 text-center text-xs text-ink-muted">
        <p className="font-sans uppercase tracking-[0.24em] text-[0.7rem] font-medium text-ink-muted">
          LIVYUE — LIVE YOURSELF EVERY DAY
        </p>
      </footer>
    </div>
  );
}
