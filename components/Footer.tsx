import Link from "next/link";
import { LogoMark } from "./Logo";
import { practices } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-ink text-sm text-night-muted">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-6 px-8 py-12">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-paper">
          <LogoMark size={22} inverted />
          <span>G-Labs</span>
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {practices.map((p) => (
            <Link key={p.href} href={p.href} className="hover:text-paper">
              {p.short}
            </Link>
          ))}
          {/* TODO: replace with your real address */}
          <a href="mailto:hello@example.com" className="hover:text-paper">
            [EMAIL]
          </a>
        </nav>
        <p className="font-mono text-xs">© 2026 G-Labs</p>
      </div>
    </footer>
  );
}
