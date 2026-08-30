import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule px-5 py-12 md:px-10 md:py-16 lg:px-16">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-muted">
            A personal companion built with care to help you understand your behaviour and live intentionally.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Link
            href="/today"
            className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-ink hover:text-moss underline underline-offset-4"
          >
            Enter LIVYUE →
          </Link>
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.24em] text-ink-muted font-medium">
            LIVYUE — LIVE YOURSELF EVERY DAY
          </p>
        </div>
      </div>
    </footer>
  );
}
