"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  benchmarks,
  categories,
  compact,
  formatMonth,
  labs,
  labsReporting,
  statuses,
  type Benchmark,
  type Category,
  type Status,
} from "@/content/benchmarks";
import { Chevron, LabDots, Pending, Tag } from "@/components/benchmarks";
import { benchmarksHref } from "@/lib/site";

const sorts = {
  adoption: { label: "Lab adoption", key: (b: Benchmark) => labsReporting(b).length },
  stars: { label: "GitHub stars", key: (b: Benchmark) => b.signals.githubStars },
  citations: { label: "Paper citations", key: (b: Benchmark) => b.signals.paperCitations },
  newest: { label: "Newest", key: (b: Benchmark) => Number(b.released.replace("-", "")) },
  name: { label: "Name (A–Z)", key: null },
} as const;
type SortKey = keyof typeof sorts;

const control =
  "min-h-11 border border-field bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function BenchmarkDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [sort, setSort] = useState<SortKey>("adoption");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = benchmarks.filter(
      (b) =>
        (category === "all" || b.category === category) &&
        (status === "all" || b.status === status) &&
        (!q ||
          [b.name, b.fullName, b.summary, b.maintainer, categories[b.category]]
            .filter(Boolean)
            .some((s) => s!.toLowerCase().includes(q))),
    );
    const byName = (a: Benchmark, b: Benchmark) => a.name.localeCompare(b.name);
    const keyFn = sorts[sort].key;
    if (!keyFn) return filtered.sort(byName);
    // Descending; missing values (not yet pulled) sink to the bottom; ties fall back to name.
    return filtered.sort((a, b) => {
      const ka = keyFn(a);
      const kb = keyFn(b);
      if (ka === kb) return byName(a, b);
      if (ka === null) return 1;
      if (kb === null) return -1;
      return kb - ka;
    });
  }, [query, category, status, sort]);

  const counts = useMemo(() => {
    const c: Partial<Record<Category, number>> = {};
    for (const b of benchmarks) c[b.category] = (c[b.category] ?? 0) + 1;
    return c;
  }, []);

  const filtersActive = query !== "" || category !== "all" || status !== "all";
  const allOpen = results.length > 0 && results.every((b) => open.has(b.slug));

  const toggle = (slug: string, isOpen: boolean) =>
    setOpen((prev) => {
      if (prev.has(slug) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(slug);
      else next.delete(slug);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      {/* ---- controls ---- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[min(100%,260px)] flex-1 flex-col gap-1.5">
            <span className="font-mono text-xs tracking-[0.08em] text-muted uppercase">Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, maintainer, capability…"
              className={control}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs tracking-[0.08em] text-muted uppercase">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status | "all")} className={control}>
              <option value="all">All statuses</option>
              {Object.entries(statuses).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs tracking-[0.08em] text-muted uppercase">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={control}>
              {Object.entries(sorts).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {(["all", ...Object.keys(categories)] as (Category | "all")[]).map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                className={`inline-flex min-h-10 items-center gap-2 border px-3.5 text-[14px] transition-colors ${active ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-ink"}`}
              >
                {c === "all" ? "All" : categories[c]}
                <span className={`font-mono text-[12px] ${active ? "text-night-muted" : "text-muted"}`}>
                  {c === "all" ? benchmarks.length : (counts[c] ?? 0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- result bar ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-3">
        <p className="m-0 font-mono text-[13px] text-muted" aria-live="polite">
          {results.length} of {benchmarks.length} benchmarks
        </p>
        <div className="flex gap-4 text-[14px]">
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setStatus("all");
              }}
              className="font-medium text-ink hover:text-accent-ink"
            >
              Clear filters
            </button>
          )}
          {results.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(results.map((b) => b.slug)))}
              className="font-medium text-ink hover:text-accent-ink"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          )}
        </div>
      </div>

      {/* ---- rows ---- */}
      {results.length === 0 ? (
        <p className="m-0 border border-line bg-surface p-8 text-ink-2">
          No benchmarks match those filters.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {results.map((b) => (
            <li key={b.slug}>
              <DirectoryRow b={b} open={open.has(b.slug)} onToggle={(o) => toggle(b.slug, o)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DirectoryRow({ b, open, onToggle }: { b: Benchmark; open: boolean; onToggle: (open: boolean) => void }) {
  const reporting = labsReporting(b);
  return (
    <details
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
      className="group border border-line bg-surface open:border-ink"
    >
      <summary className="grid cursor-pointer list-none gap-x-8 gap-y-4 p-6 hover:bg-paper md:grid-cols-[minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{categories[b.category]}</Tag>
            {b.status !== "active" && <Tag tone="muted">{statuses[b.status]}</Tag>}
            <span className="font-mono text-[12px] text-muted">{formatMonth(b.released)}</span>
          </div>
          <h3 className="m-0 text-[22px] font-semibold tracking-[-0.01em] group-hover:text-accent-ink">
            {b.name}
          </h3>
          <p className="m-0 max-w-[68ch] text-ink-2">{b.summary}</p>
        </div>

        <div className="flex items-start gap-6 md:gap-8">
          <dl className="m-0 grid grid-cols-3 gap-x-6 gap-y-1 md:gap-x-8">
            <Signal label="Stars" value={compact(b.signals.githubStars)} />
            <Signal label="Citations" value={compact(b.signals.paperCitations)} />
            <div className="flex flex-col gap-1">
              <dt className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">Labs</dt>
              <dd className="m-0 flex flex-col gap-1.5">
                <span className="text-[17px] font-semibold">
                  {reporting.length}
                  <span className="font-normal text-muted">/{labs.length}</span>
                </span>
                <LabDots reporting={reporting} />
              </dd>
            </div>
          </dl>
          <Chevron />
        </div>
      </summary>

      <div className="grid gap-8 border-t border-line p-6 md:grid-cols-3">
        <section className="flex flex-col gap-2">
          <h4 className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">What it measures</h4>
          <p className="m-0 text-[15px] text-ink-2">{b.measures}</p>
        </section>
        <section className="flex flex-col gap-2">
          <h4 className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">Why it&apos;s different</h4>
          <p className="m-0 text-[15px] text-ink-2">{b.positioning}</p>
        </section>
        <section className="flex flex-col gap-2">
          <h4 className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">At a glance</h4>
          <dl className="m-0 flex flex-col gap-2 text-[15px]">
            {[
              ["Size", b.methodology.size],
              ["Scoring", b.methodology.scoring],
              ["Maintainer", b.maintainer],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="inline font-medium text-ink">{k}: </dt>
                <dd className="inline text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:col-span-3">
          <Link
            href={`${benchmarksHref}/${b.slug}`}
            className="inline-flex min-h-11 items-center bg-ink px-[18px] text-[15px] font-medium text-paper hover:bg-accent"
          >
            Full profile →
          </Link>
          {Object.entries(b.links).map(([kind, url]) => (
            <a
              key={kind}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-medium text-ink capitalize hover:text-accent-ink"
            >
              {kind} ↗
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}

function Signal({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{label}</dt>
      <dd className="m-0 text-[17px] font-semibold">{value ?? <Pending>—</Pending>}</dd>
    </div>
  );
}
