export function Insight() {
  return (
    <section
      id="insight"
      className="border-t border-rule bg-paper text-ink px-5 py-20 md:px-10 md:py-28 lg:px-16 transition-colors duration-300"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 lg:items-center">
          {/* Left Column: Editorial Introduction */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="font-sans text-[0.72rem] uppercase tracking-[0.28em] text-ink-muted font-semibold">
                After the check-in
              </p>
              <h2 className="mt-3 font-serif text-[clamp(2.2rem,4.5vw,3.75rem)] leading-[1.08] tracking-[-0.03em] text-ink font-normal">
                An insight that stays honest.
              </h2>
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-ink-muted max-w-md">
              LIVYUE does not invent patterns. It distinguishes what was seen, what
              might be true, and what you could try. When the days are too few, it
              says there is not enough information yet.
            </p>
            <div className="pt-2 flex items-center gap-6 text-[0.72rem] uppercase tracking-[0.2em] text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                Grounded Observation
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                No Invented Noise
              </span>
            </div>
          </div>

          {/* Right Column: Premium Editorial Insight Card */}
          <div className="lg:col-span-7">
            <figure className="rounded-2xl border border-rule bg-paper-card p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] transition-all">
              <figcaption className="border-b border-rule pb-4 flex items-center justify-between">
                <span className="font-sans text-[0.68rem] uppercase tracking-[0.22em] text-ember font-semibold">
                  An example, from a life with enough days behind it
                </span>
                <span className="hidden sm:inline-block font-sans text-[0.62rem] uppercase tracking-[0.16em] text-ink-muted">
                  Pattern Synthesis
                </span>
              </figcaption>

              <blockquote className="mt-6 space-y-7">
                <div>
                  <p className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted font-semibold">
                    What happened
                  </p>
                  <p className="mt-2 font-serif text-xl sm:text-2xl leading-snug tracking-[-0.01em] text-ink">
                    You followed through today even though you did not feel motivated.
                    This has happened three times recently.
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted font-semibold">
                    What it means
                  </p>
                  <p className="mt-2 font-serif text-xl sm:text-2xl leading-snug italic tracking-[-0.01em] text-moss">
                    &ldquo;Starting may matter more for you than waiting to feel ready.&rdquo;
                  </p>
                </div>

                <div>
                  <p className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted font-semibold">
                    For tomorrow
                  </p>
                  <p className="mt-2 font-sans text-sm sm:text-base leading-relaxed text-ink/90 font-normal">
                    Tomorrow, try committing to only the first ten minutes.
                  </p>
                </div>
              </blockquote>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
