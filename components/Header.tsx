"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "./Logo";
import { contactHref, navGroups } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const groups = navGroups.map((g) => ({
    ...g,
    active: pathname === g.href || g.children.some((c) => c.href === pathname),
  }));

  return (
    <header className="relative z-20 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-8 py-[18px]">
        <Link
          href="/"
          onClick={close}
          className="flex items-center gap-2.5 text-base font-bold tracking-[-0.02em] text-ink sm:text-xl"
        >
          <LogoMark />
          {/* Below 340px the wordmark can't sit beside the menu button; the mark stands alone. */}
          <span className="hidden whitespace-nowrap min-[340px]:inline">Frontier Engineering</span>
        </Link>

        {/* Full header needs ~1000px of content width; below xl the nav collapses into a menu. */}
        <nav aria-label="Primary" className="hidden gap-x-6 text-[15px] xl:flex">
          {groups.map((g) => (
            // The panel opens on hover and on keyboard focus, so tabbing walks through it.
            <div key={g.href} className="group relative">
              <Link
                href={g.href}
                aria-current={pathname === g.href ? "page" : undefined}
                className={`flex items-center gap-1.5 py-2.5 whitespace-nowrap hover:text-accent-ink ${g.active ? "font-semibold text-accent-ink" : "text-ink"}`}
              >
                {g.label}
                <span aria-hidden="true" className="text-[11px] text-muted">▾</span>
              </Link>
              <div className="invisible absolute top-full left-0 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 motion-reduce:transition-none">
                <ul className="m-0 flex w-[340px] list-none flex-col border border-line bg-paper p-0 shadow-[0_12px_32px_rgb(0_0_0/0.08)]">
                  {[{ href: g.href, label: g.overview, summary: g.summary }, ...g.children].map((c) => (
                    <li key={c.href} className="border-t border-line first:border-t-0">
                      <Link
                        href={c.href}
                        aria-current={pathname === c.href ? "page" : undefined}
                        className="flex flex-col gap-1 px-5 py-4 hover:bg-surface"
                      >
                        <span className={pathname === c.href ? "font-semibold text-accent-ink" : "font-medium text-ink"}>
                          {c.label}
                        </span>
                        <span className="text-sm text-ink-2">{c.summary}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </nav>

        <Link
          href={contactHref}
          className="hidden min-h-11 items-center whitespace-nowrap bg-ink px-[18px] text-[15px] font-medium text-paper hover:bg-accent xl:inline-flex"
        >
          Request a discovery call
        </Link>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-11 shrink-0 items-center border border-ink px-3 font-mono text-[13px] tracking-[0.08em] text-ink uppercase sm:px-4 xl:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="mx-auto flex max-w-[1200px] flex-col px-8 pb-6 xl:hidden"
        >
          {groups.map((g) => (
            <div key={g.href} className="flex flex-col border-t border-line">
              <Link
                href={g.href}
                onClick={close}
                aria-current={pathname === g.href ? "page" : undefined}
                className={`py-3.5 text-[17px] ${pathname === g.href ? "font-semibold text-accent-ink" : "text-ink"}`}
              >
                {g.label}
              </Link>
              {g.children.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={close}
                  aria-current={pathname === c.href ? "page" : undefined}
                  className={`border-l border-line py-2.5 pl-4 text-[15px] ${pathname === c.href ? "font-semibold text-accent-ink" : "text-ink-2"}`}
                >
                  {c.label}
                </Link>
              ))}
              <span className="h-2" />
            </div>
          ))}
          <Link
            href={contactHref}
            onClick={close}
            className="mt-4 inline-flex min-h-12 items-center justify-center bg-ink px-[18px] font-medium text-paper hover:bg-accent"
          >
            Request a discovery call
          </Link>
        </nav>
      )}
    </header>
  );
}
