export function Insight() {
  return (
    <section
      id="insight"
      className="bg-paper-ink px-5 py-24 text-paper md:px-10 md:py-32 lg:px-16"
    >
      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-paper/55">
        After the check-in
      </p>
      <h2 className="mt-6 max-w-[14ch] font-serif text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.05] tracking-[-0.03em]">
        An insight that stays honest.
      </h2>
      <p className="mt-8 max-w-xl text-[1.05rem] leading-8 text-paper/70">
        LIVYUE does not invent patterns. It distinguishes what was seen, what
        might be true, and what you could try. When the days are too few, it
        says there is not enough information yet.
      </p>

      <figure className="mt-16 max-w-2xl border-t border-paper/15 pt-12">
        <figcaption className="text-[0.7rem] uppercase tracking-[0.24em] text-ember">
          An example, from a life with enough days behind it
        </figcaption>
        <blockquote className="mt-8 space-y-10">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-paper/45">
              What happened
            </p>
            <p className="mt-3 font-serif text-2xl leading-snug tracking-[-0.02em] md:text-[1.85rem]">
              You followed through today even though you did not feel motivated.
              This has happened three times recently.
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-paper/45">
              What it means
            </p>
            <p className="mt-3 font-serif text-2xl leading-snug tracking-[-0.02em] italic md:text-[1.85rem]">
              Starting may matter more for you than waiting to feel ready.
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-paper/45">
              For tomorrow
            </p>
            <p className="mt-3 font-serif text-2xl leading-snug tracking-[-0.02em] md:text-[1.85rem]">
              Tomorrow, try committing to only the first ten minutes.
            </p>
          </div>
        </blockquote>
      </figure>
    </section>
  );
}
