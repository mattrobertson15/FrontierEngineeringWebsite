"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "./Logo";
import { contactHref, practices, researchHref } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = [...practices, { href: researchHref, label: "Research" }].map((p) => {
    const active = pathname === p.href;
    return { ...p, active };
  });

  return (
    <header className="border-b border-line">
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
          {links.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              aria-current={p.active ? "page" : undefined}
              className={`py-2.5 whitespace-nowrap hover:text-accent-ink ${p.active ? "font-semibold text-accent-ink" : "text-ink"}`}
            >
              {p.label}
            </Link>
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
          {links.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              onClick={close}
              aria-current={p.active ? "page" : undefined}
              className={`border-t border-line py-3.5 text-[17px] ${p.active ? "font-semibold text-accent-ink" : "text-ink"}`}
            >
              {p.label}
            </Link>
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
