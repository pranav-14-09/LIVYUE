import Link from "next/link";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-end px-5 pb-10 pt-28 md:px-10 md:pb-14 lg:px-16"
    >
      <p className="rise font-sans text-[0.72rem] uppercase tracking-[0.28em] text-ink-muted">
        A personal companion
      </p>
      <h1 className="rise-delay-1 mt-6 max-w-[14ch] font-serif text-[clamp(3.4rem,12vw,9.25rem)] leading-[0.9] tracking-[-0.03em] text-ink">
        Live yourself.
        <span className="mt-1 block italic text-moss">Every day.</span>
      </h1>
      <div className="rise-delay-2 mt-10 flex max-w-xl flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between md:max-w-none">
        <p className="max-w-md text-[1.05rem] leading-8 text-ink-muted md:text-lg md:leading-8">
          LIVYUE is for people who want to understand their behaviour, improve
          gradually, and keep living — without another habit app to maintain.
        </p>
        <div className="flex flex-wrap items-center gap-6 self-start">
          <Link
            href="/today"
            className="rounded bg-ink px-6 py-3 font-sans text-[0.72rem] uppercase tracking-[0.22em] text-paper transition-opacity hover:opacity-90 shadow-xs"
          >
            Open Companion →
          </Link>
          <a
            href="#philosophy"
            className="group inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.24em] text-ink"
          >
            The Way
            <span
              aria-hidden
              className="inline-block transition-transform duration-500 group-hover:translate-y-1"
            >
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
