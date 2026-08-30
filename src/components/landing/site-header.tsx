"use client";

import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeSelector } from "@/lib/theme";

const links = [
  { href: "#philosophy", label: "The way" },
  { href: "#rhythm", label: "The day" },
  { href: "#privacy", label: "Yours" },
] as const;

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="flex items-center justify-between px-5 py-6 md:px-10 lg:px-16">
        <a href="#top" className="shrink-0">
          <Wordmark size="lg" />
        </a>
        <div className="flex items-center gap-3 sm:gap-6">
          <nav aria-label="Page" className="hidden sm:flex items-center gap-4 md:gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[0.62rem] uppercase tracking-[0.14em] text-ink-muted transition-colors duration-300 hover:text-ink sm:text-[0.72rem] sm:tracking-[0.22em]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <ThemeSelector />
          <Link
            href="/today"
            className="rounded border border-rule-strong bg-paper/80 px-3 py-1 font-sans text-[0.62rem] uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink hover:bg-paper sm:text-[0.72rem]"
          >
            Enter Companion →
          </Link>
        </div>
      </div>
    </header>
  );
}
