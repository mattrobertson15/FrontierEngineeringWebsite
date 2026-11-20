import { costPerPass, passRate, pct, runs, usd } from "@/content/wharf";

/*
 * What one verified fix costs: estimated spend per passing attempt, cheapest first, on a linear
 * scale so the spread reads as it is. Every bar carries its value, so the list doubles as the table.
 */

export function CostPerFix({ highlight = [], highlightNote }: { highlight?: string[]; highlightNote?: string }) {
  const rows = runs
    .flatMap((r) => {
      const c = costPerPass(r);
      return c === null ? [] : [{ r, c }];
    })
    .sort((a, b) => a.c - b.c);
  const max = Math.max(...rows.map((x) => x.c));
  const left = runs.filter((r) => costPerPass(r) === null);

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="border border-line bg-surface px-4 py-3">
        <div className="mb-2 hidden grid-cols-[minmax(0,19rem)_1fr_4.5rem] gap-4 font-mono text-[11px] text-muted sm:grid">
          <span>configuration · pass@1</span>
          <span>cost per passing attempt</span>
          <span />
        </div>
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
          {rows.map(({ r, c }) => {
            const marked = highlight.includes(r.id);
            return (
              <li
                key={r.id}
                className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,19rem)_1fr_4.5rem] sm:items-center sm:gap-4"
                title={`${r.model}, ${r.harness} ${r.version}: ${usd(c)} per passing attempt, ${pct(passRate(r))} pass@1`}
              >
                <span className={`truncate font-mono text-xs ${marked ? "text-ink" : "text-ink-2"}`}>
                  {r.model} <span className="text-muted">· {r.harness === "Copilot" ? r.version : r.harness} · {pct(passRate(r))}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`h-3 min-w-[3px] rounded-r-[4px] ${marked ? "bg-accent" : "bg-ink"}`}
                    style={{ width: `${(c / max) * 100}%` }}
                  />
                  <span className="font-mono text-xs tabular-nums text-ink sm:hidden">{usd(c)}</span>
                </span>
                <span className="hidden text-right font-mono text-xs tabular-nums text-ink sm:block">{usd(c)}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption className="font-mono text-xs text-muted">
        Cost per passing attempt = mean cost per costed attempt × planned attempts ÷ passing attempts.
        Not shown: {left.map((r) => `${r.model} (${r.harness} ${r.version})`).join(", ")}, where cost was
        recorded for under 95% of attempts or not at all.{highlightNote && ` ${highlightNote}`}
      </figcaption>
    </figure>
  );
}
