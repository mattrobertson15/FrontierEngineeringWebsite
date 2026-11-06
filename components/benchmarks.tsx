import type { ReactNode } from "react";
import { labs, type Lab, type Rating } from "@/content/benchmarks";

/**
 * Collapsible section built on native <details>: keyboard and screen-reader accessible,
 * works without JavaScript, and Ctrl-F finds text inside closed panels.
 */
export function Expandable({
  title,
  meta,
  children,
  defaultOpen = false,
  size = "md",
}: {
  title: ReactNode;
  /** Right-aligned detail shown in the closed state (e.g. a count). */
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <details open={defaultOpen} className="group border-t border-line last:border-b">
      <summary
        className={`flex cursor-pointer list-none items-center gap-4 hover:text-accent-ink [&::-webkit-details-marker]:hidden ${size === "lg" ? "py-6" : "py-4"}`}
      >
        <span className={`flex-1 ${size === "lg" ? "text-[21px] font-semibold" : "font-medium"}`}>{title}</span>
        {meta && <span className="font-mono text-xs text-muted">{meta}</span>}
        <Chevron />
      </summary>
      <div className="pb-6 text-ink-2">{children}</div>
    </details>
  );
}

export function Chevron() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center border border-line font-mono text-sm text-ink transition-transform group-open:rotate-45 motion-reduce:transition-none"
    >
      +
    </span>
  );
}

/** Muted placeholder for data that hasn't been pulled yet. */
export function Pending({ children = "Pending" }: { children?: ReactNode }) {
  return <span className="font-mono text-[13px] font-normal text-muted">{children}</span>;
}

/** One row of dots, a filled dot per lab that reports this benchmark, in `labs` order. */
export function LabDots({ reporting, size = "sm" }: { reporting: Lab[]; size?: "sm" | "md" }) {
  const dot = size === "md" ? "size-3" : "size-2";
  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`${reporting.length} of ${labs.length} tracked labs report this benchmark`}
    >
      {labs.map((lab) => (
        <span
          key={lab}
          title={lab}
          className={`${dot} rounded-full ${reporting.includes(lab) ? "bg-accent" : "border border-line bg-surface"}`}
        />
      ))}
    </span>
  );
}

/** Three-step meter for an editorial rating; "Not yet reviewed" when null. */
export function RatingMeter({ rating }: { rating: Rating }) {
  if (rating === null) return <Pending>Not yet reviewed</Pending>;
  const words = { 1: "Low", 2: "Medium", 3: "High" } as const;
  return (
    <span className="inline-flex items-center gap-3">
      <span className="inline-flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-2 w-6 ${n <= rating ? "bg-accent" : "bg-line"}`} />
        ))}
      </span>
      <span className="text-[15px] font-medium text-ink">{words[rating]}</span>
    </span>
  );
}

/** Small mono tag used for category and status. */
export function Tag({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[12px] tracking-[0.04em] whitespace-nowrap ${tone === "accent" ? "border-accent/40 text-accent-ink" : "border-line text-muted"}`}
    >
      {children}
    </span>
  );
}
