const promises = [
  "No location tracking",
  "No microphone",
  "No camera",
  "No contacts",
  "No browsing history",
  "No background device tracking",
] as const;

export function Privacy() {
  return (
    <section
      id="privacy"
      className="border-t border-rule px-5 py-24 md:px-10 md:py-32 lg:px-16"
    >
      <div className="grid gap-14 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-ink-muted">
            Yours
          </p>
          <h2 className="mt-6 max-w-[12ch] font-serif text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.05] tracking-[-0.03em]">
            You decide what is known.
          </h2>
          <p className="mt-8 max-w-md text-[1.05rem] leading-8 text-ink-muted">
            Some of this will be intimate. LIVYUE is privacy-first. You write
            what you choose to write. Nothing is taken from the rest of your
            device.
          </p>
        </div>
        <ul className="grid gap-0 sm:grid-cols-2">
          {promises.map((item) => (
            <li
              key={item}
              className="border-t border-rule py-5 text-[0.95rem] leading-6 text-ink sm:odd:pr-8"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
