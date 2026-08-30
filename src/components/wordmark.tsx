type WordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function Wordmark({ className = "", size = "md" }: WordmarkProps) {
  const sizeClasses =
    size === "lg"
      ? "text-[0.88rem] sm:text-[0.98rem] lg:text-[1.12rem] tracking-[0.34em] sm:tracking-[0.38em] lg:tracking-[0.42em]"
      : size === "sm"
      ? "text-[0.65rem] tracking-[0.32em]"
      : "text-[0.72rem] sm:text-[0.8rem] tracking-[0.36em]";

  return (
    <span
      className={`font-sans font-medium uppercase text-ink select-none ${sizeClasses} ${className}`}
    >
      LIVYUE
    </span>
  );
}
