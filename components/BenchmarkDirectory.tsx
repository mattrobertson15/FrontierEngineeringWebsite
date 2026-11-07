"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatDate,
  kindLabels,
  maintenanceLabels,
  tracks,
  type DirectoryEntry,
  type Track,
} from "@/lib/benchmarks/types";
import { Chevron, Pending, Tag } from "@/components/benchmarks";
import { benchmarksHref } from "@/lib/site";

const sorts = {
  name: { label: "Name (A–Z)", key: null },
  stars: { label: "GitHub stars", key: (b: DirectoryEntry) => b.githubStars?.value ?? null },
  facts: { label: "Sourced facts", key: (b: DirectoryEntry) => b.factCount },
  checked: { label: "Recently checked", key: (b: DirectoryEntry) => (b.checkedOn ? Date.parse(b.checkedOn) : null) },
} as const;
type SortKey = keyof typeof sorts;

const control =
  "min-h-11 border border-field bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function BenchmarkDirectory({ entries }: { entries: DirectoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<Track | "all">("all");
  const [capability, setCapability] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const capabilityOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entries) for (const c of e.capabilities) m.set(c.slug, c.name);
    return [...m].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  const trackCounts = useMemo(() => {
    const c: Partial<Record<Track, number>> = {};
    for (const e of entries) if (e.track) c[e.track] = (c[e.track] ?? 0) + 1;
    return c;
  }, [entries]);
  const trackKeys = (Object.keys(tracks) as Track[]).filter((t) => trackCounts[t]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter(
      (b) =>
        (track === "all" || b.track === track) &&
        (capability === "all" || b.capabilities.some((c) => c.slug === capability)) &&
        (!q ||
          [b.name, b.summary, ...b.capabilities.map((c) => c.name), b.track ? tracks[b.track] : null]
            .filter(Boolean)
            .some((s) => s!.toLowerCase().includes(q))),
    );
    const byName = (a: DirectoryEntry, b: DirectoryEntry) => a.name.localeCompare(b.name);
    const keyFn = sorts[sort].key;
    if (!keyFn) return filtered.sort(byName);
    // Descending; unknown values sink to the bottom; ties fall back to name.
    return filtered.sort((a, b) => {
      const ka = keyFn(a);
      const kb = keyFn(b);
      if (ka === kb) return byName(a, b);
      if (ka === null) return 1;
      if (kb === null) return -1;
      return kb - ka;
    });
  }, [entries, query, track, capability, sort]);

  const filtersActive = query !== "" || track !== "all" || capability !== "all";
  const allOpen = results.length > 0 && results.every((b) => open.has(b.slug));

  const toggle = (slug: string, isOpen: boolean) =>
    setOpen((prev) => {
      if (prev.has(slug) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(slug);
      else next.delete(slug);
      return next;
    });

  if (entries.length === 0) {
    return (
      <p className="m-0 border border-line bg-surface p-8 text-ink-2">
        No benchmark profiles have been published yet. Each entry appears here once its sources have been reviewed.
      </p>
    );
  }

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
              placeholder="Name, capability, description…"
              className={control}
            />
          </label>
          {capabilityOptions.length > 1 && (
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs tracking-[0.08em] text-muted uppercase">Capability</span>
              <select value={capability} onChange={(e) => setCapability(e.target.value)} className={control}>
                <option value="all">All capabilities</option>
                {capabilityOptions.map(([slug, name]) => (
                  <option key={slug} value={slug}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
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

        {trackKeys.length > 1 && (
          <div role="group" aria-label="Filter by area" className="flex flex-wrap gap-2">
            {(["all", ...trackKeys] as (Track | "all")[]).map((t) => {
              const active = track === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTrack(t)}
                  className={`inline-flex min-h-10 items-center gap-2 border px-3.5 text-[14px] transition-colors ${active ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-ink"}`}
                >
                  {t === "all" ? "All" : tracks[t]}
                  <span className={`font-mono text-[12px] ${active ? "text-night-muted" : "text-muted"}`}>
                    {t === "all" ? entries.length : trackCounts[t]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- result bar ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-3">
        <p className="m-0 font-mono text-[13px] text-muted" aria-live="polite">
          {results.length} of {entries.length} benchmarks
        </p>
        <div className="flex gap-4 text-[14px]">
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTrack("all");
                setCapability("all");
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
        <p className="m-0 border border-line bg-surface p-8 text-ink-2">No benchmarks match those filters.</p>
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

function DirectoryRow({ b, open, onToggle }: { b: DirectoryEntry; open: boolean; onToggle: (open: boolean) => void }) {
  const stars = b.githubStars;
  return (
    <details
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
      className="group border border-line bg-surface open:border-ink"
    >
      <summary className="grid cursor-pointer list-none gap-x-8 gap-y-4 p-6 hover:bg-paper md:grid-cols-[minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {b.track && <Tag>{tracks[b.track]}</Tag>}
            {kindLabels[b.kind] && <Tag tone="muted">{kindLabels[b.kind]}</Tag>}
            {b.maintenance && b.maintenance !== "active" && <Tag tone="muted">{maintenanceLabels[b.maintenance]}</Tag>}
          </div>
          <h3 className="m-0 text-[22px] font-semibold tracking-[-0.01em] group-hover:text-accent-ink">{b.name}</h3>
          <p className="m-0 max-w-[68ch] text-ink-2">{b.summary}</p>
        </div>

        <div className="flex items-start gap-6 md:gap-8">
          <dl className="m-0 grid grid-cols-3 gap-x-6 gap-y-1 md:gap-x-8">
            <Signal label="Stars" value={stars ? `${stars.rounded ? "≈" : ""}${stars.display}` : null} />
            <Signal label="Facts" value={String(b.factCount)} />
            <Signal label="Audits" value={String(b.auditCount)} />
          </dl>
          <Chevron />
        </div>
      </summary>

      <div className="grid gap-8 border-t border-line p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-2">
          <h4 className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">Capabilities</h4>
          {b.capabilities.length ? (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {b.capabilities.map((c) => (
                <li key={c.slug}>
                  <Tag tone={c.primary ? "accent" : "muted"}>{c.name}</Tag>
                </li>
              ))}
            </ul>
          ) : (
            <Pending>Not yet classified</Pending>
          )}
        </section>
        <section className="flex flex-col gap-2">
          <h4 className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">Last checked</h4>
          <p className="m-0 text-[15px] text-ink-2">{formatDate(b.checkedOn) ?? <Pending>Unknown</Pending>}</p>
          {stars && (
            <p className="m-0 font-mono text-[12px] text-muted">GitHub stars as of {formatDate(stars.observedOn)}</p>
          )}
        </section>
        <div className="md:col-span-2">
          <Link
            href={`${benchmarksHref}/${b.slug}`}
            className="inline-flex min-h-11 items-center bg-ink px-[18px] text-[15px] font-medium text-paper hover:bg-accent"
          >
            Full profile →
          </Link>
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
