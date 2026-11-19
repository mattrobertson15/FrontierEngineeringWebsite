import Link from "next/link";
import { researchHref, wharfSweHref } from "@/lib/site";
import { runs, taskCount } from "@/content/wharf";
import { sweRuns, wharfSweTaskCount } from "@/content/wharf-swe";

/*
 * Section switcher for Wharf research. The header links only to the first page; this band
 * moves between the task sets, which share one methodology but are never scored together.
 */

const tabs = [
  {
    href: researchHref,
    name: "DeepSWE",
    detail: `${taskCount} open-source tasks · ${runs.length} configurations`,
  },
  {
    href: wharfSweHref,
    name: "WharfSWE",
    detail: `${wharfSweTaskCount} tasks from our own codebase · ${sweRuns.length} runs`,
  },
];

export function WharfSwitcher({ active }: { active: string }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-end gap-x-10 gap-y-3 px-8 pt-5">
        <div className="pb-4">
          <p className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">Wharf research</p>
          <p className="m-0 text-sm text-ink-2">One methodology, two task sets</p>
        </div>
        <nav aria-label="Wharf research" className="-mb-px flex min-w-0 grow">
          <ul className="m-0 flex list-none gap-1 p-0">
            {tabs.map((t) => {
              const on = t.href === active;
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex flex-col border-b-2 px-4 pt-1 pb-3.5 transition-colors ${
                      on ? "border-accent text-ink" : "border-transparent text-ink-2 hover:border-line hover:text-ink"
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="font-mono text-xs text-muted">{t.detail}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
