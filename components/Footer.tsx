import Link from "next/link";
import { LogoMark } from "./Logo";
import { careersHref, caseStudiesHref, offerings, practices, researchHref } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-ink text-sm text-night-muted">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-6 px-8 py-12">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-paper">
          <LogoMark size={22} inverted />
          <span>Frontier Engineering</span>
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {[...offerings, ...practices].map((p) => (
            <Link key={p.href} href={p.href} className="hover:text-paper">
              {p.short}
            </Link>
          ))}
          <Link href={researchHref} className="hover:text-paper">
            Research
          </Link>
          <Link href={caseStudiesHref} className="hover:text-paper">
            Case Studies
          </Link>
          <Link href={careersHref} className="hover:text-paper">
            Careers
          </Link>
          <a href="mailto:info@frontier-engineering.ai" className="hover:text-paper">
            info@frontier-engineering.ai
          </a>
        </nav>
        <p className="font-mono text-xs">© 2026 Frontier Engineering</p>
      </div>
    </footer>
  );
}
