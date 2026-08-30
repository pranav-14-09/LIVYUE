import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/lib/theme";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-paper text-ink selection:bg-moss/20 selection:text-ink transition-colors duration-300">
      {/* Left Editorial Companion Column (Authentic Journal Still-Life Photograph) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 border-r border-rule p-12 xl:p-16 flex-col justify-start relative overflow-hidden bg-[#F2EDE5] dark:bg-[#1A1816] transition-colors duration-300">
        {/* Authentic Colorful Editorial Journal Photograph */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <Image
            src="/images/auth-journal-bg.jpg"
            alt="LIVYUE private personal journal"
            fill
            priority
            className="object-cover object-bottom transition-all duration-500 dark:brightness-[0.70] dark:contrast-[1.08] dark:opacity-85"
            sizes="(max-width: 1280px) 42vw, 50vw"
          />
          {/* Subtle soft-light gradient to ensure pristine typography legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#F2EDE5]/40 via-transparent to-transparent dark:from-[#1A1816]/60 dark:via-transparent dark:to-[#1A1816]/40 pointer-events-none transition-colors duration-300" />
        </div>

        {/* Top Logo & Philosophy Header */}
        <div className="relative z-10 space-y-2">
          <Link href="/" className="inline-block group">
            <Wordmark size="lg" className="transition-opacity group-hover:opacity-80" />
          </Link>
          <p className="font-sans text-[0.68rem] uppercase tracking-[0.26em] text-ink-muted font-medium">
            LIVE YOURSELF EVERYDAY
          </p>
        </div>

        {/* Upper Editorial Statement */}
        <div className="relative z-10 max-w-md mt-8 lg:mt-12 xl:mt-14 space-y-4">
          <h2 className="font-serif text-3xl xl:text-[2.25rem] text-ink leading-[1.28] tracking-[-0.01em]">
            A quiet space to understand your behaviour, set intentions without pressure, and reflect with honesty.
          </h2>
          <p className="font-sans text-sm text-ink-muted leading-relaxed max-w-sm">
            Your personal companion. Completely private, isolated to your account, and designed to help you live intentionally each day.
          </p>
        </div>

        {/* Bottom Left Corner Theme Toggle */}
        <div className="absolute bottom-8 left-12 xl:left-16 z-20">
          <ThemeToggle />
        </div>
      </div>

      {/* Right Form Area (Warm Soft Beige / Off-White) */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-6 flex flex-col justify-between p-6 sm:p-10 md:p-14 xl:p-20 overflow-y-auto bg-paper transition-colors duration-300">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between pb-8 border-b border-rule mb-6">
          <Link href="/">
            <Wordmark size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-ink-muted">
              LIVE YOURSELF EVERYDAY
            </span>
            <ThemeToggle />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-6">
          {children}
        </div>

        {/* Footer Branding */}
        <div className="pt-8 border-t border-rule/60 text-center text-xs text-ink-muted">
          <p className="font-sans text-[0.68rem] uppercase tracking-[0.2em]">
            LIVYUE — LIVE YOURSELF EVERY DAY
          </p>
        </div>
      </div>
    </div>
  );
}
