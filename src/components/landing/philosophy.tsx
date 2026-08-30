const steps = [
  {
    name: "Live",
    copy: "Record what actually happened. Done, partially done, or missed. No performance. Just the day.",
  },
  {
    name: "Reflect",
    copy: "A few honest words, if you have them. The check-in is meant to take a minute or two.",
  },
  {
    name: "Understand",
    copy: "Insights come from your history, not from a script. If there is not enough yet, LIVYUE will say so.",
  },
  {
    name: "Experiment",
    copy: "A small next step, offered as a possibility. Never as a command, never as certainty.",
  },
  {
    name: "Improve",
    copy: "Quietly, over time. Recovery after missed days is part of the work — not a failure to erase.",
  },
] as const;

export function Philosophy() {
  return (
    <section
      id="philosophy"
      className="border-t border-rule px-5 py-24 md:px-10 md:py-32 lg:px-16"
    >
      <div className="grid gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-24">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-ink-muted">
            The way
          </p>
          <h2 className="mt-6 max-w-[12ch] font-serif text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.05] tracking-[-0.03em]">
            A loop you can live with.
          </h2>
          <p className="mt-8 max-w-sm text-[1.05rem] leading-8 text-ink-muted">
            Goals can be anything you care about: fitness, studying, sleep,
            work, reading, relationships, or something only you would name.
          </p>
        </div>
        <ol className="space-y-0">
          {steps.map((step, index) => (
            <li
              key={step.name}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 border-t border-rule py-8 last:border-b md:gap-10 md:py-10"
            >
              <span className="pt-1 font-sans text-[0.7rem] uppercase tracking-[0.2em] text-ember">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-serif text-3xl italic tracking-[-0.02em] md:text-4xl">
                  {step.name}
                </h3>
                <p className="mt-3 max-w-lg leading-7 text-ink-muted">
                  {step.copy}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
