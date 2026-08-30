export function Rhythm() {
  return (
    <section
      id="rhythm"
      className="bg-paper-deep px-5 py-24 md:px-10 md:py-32 lg:px-16"
    >
      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-ink-muted">
        The day
      </p>
      <h2 className="mt-6 max-w-[16ch] font-serif text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.05] tracking-[-0.03em]">
        Morning, almost nothing. Evening, a little more.
      </h2>
      <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-20">
        <article>
          <h3 className="font-serif text-2xl italic md:text-3xl">Morning</h3>
          <p className="mt-4 max-w-md text-[1.05rem] leading-8 text-ink-muted">
            A brief presence. Enough to remember what you are living toward —
            without turning the day into a list to survive.
          </p>
        </article>
        <article>
          <h3 className="font-serif text-2xl italic md:text-3xl">Evening</h3>
          <p className="mt-4 max-w-md text-[1.05rem] leading-8 text-ink-muted">
            What happened, in a few marks. A short reflection if you want one.
            Then a personal insight, drawn only from evidence you have given.
          </p>
        </article>
      </div>
      <p className="mt-20 max-w-xl font-serif text-2xl leading-snug tracking-[-0.02em] text-moss md:text-3xl">
        The point is not to keep an app alive. The point is to keep yourself in
        view.
      </p>
    </section>
  );
}
