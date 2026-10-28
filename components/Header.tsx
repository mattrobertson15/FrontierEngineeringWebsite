"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";
import { contactHref, practices } from "@/lib/site";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-8 py-[18px]">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.02em] text-ink"
        >
          <LogoMark />
          <span>Frontier Engineering</span>
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
          {practices.map((p) => {
            const active = pathname === p.href;
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={active ? "page" : undefined}
                className={`py-2.5 hover:text-accent-ink ${active ? "font-semibold text-accent-ink" : "text-ink"}`}
              >
                {p.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href={contactHref}
          className="inline-flex min-h-11 items-center bg-ink px-[18px] text-[15px] font-medium text-paper hover:bg-accent"
        >
          Book a discovery call
        </Link>
      </div>
    </header>
  );
}
