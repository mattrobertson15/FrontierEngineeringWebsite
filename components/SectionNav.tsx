"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Sticky "on this page" bar for long pages. Highlights the section in view and keeps the active
 * link visible when the bar scrolls sideways on small screens. Sections it links to need ids and
 * a scroll margin (scroll-mt-12) so the bar doesn't cover their headings.
 */

export type SectionLink = { id: string; label: string };

export function SectionNav({ links, label = "On this page" }: { links: SectionLink[]; label?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = links.flatMap((l) => {
      const el = document.getElementById(l.id);
      return el ? [el] : [];
    });
    // A section counts as current while it crosses a band just below the bar.
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [links]);

  // Keep the active link in view inside the bar without moving the page.
  useEffect(() => {
    const list = listRef.current;
    const link = active && list?.querySelector<HTMLAnchorElement>(`a[href="#${active}"]`);
    if (!list || !link) return;
    const left = link.offsetLeft - list.clientWidth / 2 + link.clientWidth / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label={label} className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-8">
        <span className="hidden shrink-0 font-mono text-xs tracking-[0.08em] text-muted uppercase lg:block">{label}</span>
        <ul
          ref={listRef}
          className="m-0 flex min-w-0 list-none gap-1 overflow-x-auto p-0 pr-6 [scrollbar-width:none] max-lg:[mask-image:linear-gradient(to_right,black_85%,transparent)] [&::-webkit-scrollbar]:hidden"
        >
          {links.map((l) => {
            const on = active === l.id;
            return (
              <li key={l.id} className="shrink-0">
                <a
                  href={`#${l.id}`}
                  aria-current={on ? "location" : undefined}
                  className={`flex min-h-11 items-center border-b-2 px-2.5 font-mono text-xs whitespace-nowrap transition-colors ${
                    on ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-ink"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
