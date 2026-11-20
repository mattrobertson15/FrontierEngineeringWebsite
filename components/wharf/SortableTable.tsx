"use client";

import { useMemo, useState, type ReactNode } from "react";

/* A results table with clickable sort headers and optional inline bars. */

export type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Sort key; omit to make the column unsortable. Nulls always sort last. */
  sort?: (row: T) => number | string | null;
  /** Direction applied on the first click — "desc" for metrics where higher is better. */
  firstDir?: "asc" | "desc";
  render: (row: T) => ReactNode;
  /** Draws a bar behind the value: a 0–1 share of the column width. */
  bar?: (row: T) => number | null;
  barClass?: string;
  emphasis?: boolean;
};

export function SortableTable<T extends { id: string }>({
  rows,
  columns,
  initial,
  caption,
  limit,
}: {
  rows: T[];
  columns: Column<T>[];
  /** Default order, used until a header is clicked. */
  initial: (a: T, b: T) => number;
  caption: string;
  /** Show only the first rows of the current sort order (a preview); omit to show all. */
  limit?: number;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !col?.sort) return [...rows].sort(initial);
    const get = col.sort;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va === null && vb === null) return initial(a, b);
      if (va === null) return 1;
      if (vb === null) return -1;
      if (va === vb) return initial(a, b);
      return (va < vb ? -1 : 1) * sign;
    });
  }, [rows, columns, sort, initial]);

  const toggle = (col: Column<T>) =>
    setSort((cur) =>
      cur?.key === col.key
        ? { key: col.key, dir: cur.dir === "asc" ? "desc" : "asc" }
        : { key: col.key, dir: col.firstDir ?? "asc" },
    );

  const cell = "border-b border-line px-3 py-2.5 whitespace-nowrap";
  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full border-collapse font-mono text-[13px] tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-muted">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const right = c.align === "right";
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={`${cell} font-normal ${right ? "text-right" : ""}`}
                >
                  {c.sort ? (
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className={`inline-flex min-h-6 items-center gap-1 hover:text-ink ${right ? "flex-row-reverse" : ""} ${active ? "text-ink" : ""}`}
                    >
                      {c.label}
                      <span aria-hidden className={`text-[10px] ${active ? "" : "opacity-0"}`}>
                        {active && sort.dir === "asc" ? "▲" : "▼"}
                      </span>
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="text-ink-2">
          {sorted.slice(0, limit ?? sorted.length).map((row) => (
            <tr key={row.id} className="hover:bg-paper">
              {columns.map((c) => {
                const share = c.bar?.(row) ?? null;
                return (
                  <td
                    key={c.key}
                    className={`${cell} ${c.align === "right" ? "text-right" : ""} ${c.emphasis ? "text-ink" : ""}`}
                  >
                    {share === null ? (
                      c.render(row)
                    ) : (
                      <span className="flex items-center justify-end gap-2.5">
                        <span className="relative hidden h-1.5 w-20 overflow-hidden rounded-full bg-line sm:block" aria-hidden>
                          <span
                            className={`absolute inset-y-0 left-0 rounded-full ${c.barClass ?? "bg-ink"}`}
                            style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
                          />
                        </span>
                        <span className="min-w-[4.5ch]">{c.render(row)}</span>
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
