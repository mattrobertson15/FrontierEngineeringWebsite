import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* ---------- layout ---------- */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto max-w-[1200px] px-8 ${className}`}>{children}</div>;
}

/** Responsive grid: as many columns of at least `min` px as fit. */
export function AutoGrid({
  min = 320,
  children,
  className = "",
  as: Tag = "div",
}: {
  min?: number;
  children: ReactNode;
  className?: string;
  as?: "div" | "ol" | "ul" | "dl";
}) {
  const style: CSSProperties = {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`,
  };
  return (
    <Tag className={`grid ${className}`} style={style}>
      {children}
    </Tag>
  );
}

/** Cells separated by 1px hairlines (the canvas's signature card grid). */
export function HairlineGrid({
  min = 300,
  children,
  as = "div",
}: {
  min?: number;
  children: ReactNode;
  as?: "div" | "ol" | "ul" | "dl";
}) {
  return (
    <AutoGrid min={min} as={as} className="m-0 list-none gap-px border border-line bg-line p-0">
      {children}
    </AutoGrid>
  );
}

export function DarkBand({ children }: { children: ReactNode }) {
  return <section className="bg-ink text-night-text">{children}</section>;
}

/* ---------- type ---------- */

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`m-0 font-mono text-[13px] tracking-[0.08em] uppercase ${dark ? "text-accent-soft" : "text-accent-ink"}`}
    >
      {children}
    </p>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">{children}</p>
  );
}

export function H1({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={`m-0 text-[clamp(40px,5.5vw,68px)] leading-[1.03] font-semibold tracking-[-0.035em] ${className}`}
    >
      {children}
    </h1>
  );
}

export function H2({
  children,
  dark = false,
  className = "",
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <h2
      className={`m-0 text-[clamp(30px,3.6vw,44px)] leading-[1.1] font-semibold tracking-[-0.03em] ${dark ? "text-paper" : ""} ${className}`}
    >
      {children}
    </h2>
  );
}

export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`m-0 text-xl text-ink-2 ${className}`}>{children}</p>;
}

/* ---------- actions ---------- */

const buttonVariants = {
  accent: "bg-accent text-white hover:bg-ink",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ink: "bg-ink text-paper hover:bg-accent",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "accent",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center px-[22px] font-medium transition-colors ${buttonVariants[variant]}`}
    >
      {children}
    </Link>
  );
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="py-2.5 font-medium text-ink hover:text-accent-ink">
      {children} →
    </Link>
  );
}

/* ---------- blocks ---------- */

export function PageHero({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  aside?: ReactNode;
}) {
  if (!aside) {
    return (
      <Container className="flex flex-col gap-6 pt-24 pb-18">
        <Eyebrow>{eyebrow}</Eyebrow>
        <H1 className="max-w-[17ch]">{title}</H1>
        <Lede className="max-w-[58ch]">{lede}</Lede>
      </Container>
    );
  }
  return (
    <Container className="pt-24 pb-20">
      <AutoGrid min={340} className="items-center gap-14">
        <div className="flex flex-col gap-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <H1>{title}</H1>
          <Lede>{lede}</Lede>
        </div>
        {aside}
      </AutoGrid>
    </Container>
  );
}

export function FeatureCard({
  tag,
  title,
  children,
  tone = "paper",
}: {
  tag: string;
  title: string;
  children: ReactNode;
  tone?: "paper" | "surface";
}) {
  return (
    <article
      className={`flex flex-col gap-3 p-8 ${tone === "paper" ? "bg-paper" : "bg-surface"}`}
    >
      <span className="font-mono text-[13px] text-accent-ink">{tag}</span>
      <h3 className="m-0 text-[21px] font-semibold">{title}</h3>
      <p className="m-0 text-ink-2">{children}</p>
    </article>
  );
}

export function StatGrid({
  items,
  tone = "surface",
}: {
  items: { label: string; value: string; small?: boolean }[];
  tone?: "paper" | "surface";
}) {
  return (
    <HairlineGrid min={200} as="dl">
      {items.map((it) => (
        <div key={it.label} className={`p-6 ${tone === "paper" ? "bg-paper" : "bg-surface"}`}>
          <dt className="font-mono text-xs text-muted">{it.label}</dt>
          <dd
            className={`m-0 mt-2 ${it.small ? "text-[17px] font-medium" : "text-[22px] font-semibold"}`}
          >
            {it.value}
          </dd>
        </div>
      ))}
    </HairlineGrid>
  );
}

export function EngagementSection({
  intro,
  deliverables,
  doneWhen,
}: {
  intro: ReactNode;
  deliverables: { title: string; body: string }[];
  /** The exit criterion, shown in place of a duration. */
  doneWhen: string;
}) {
  return (
    <Container className="py-26">
      <AutoGrid min={320} className="items-start gap-12">
        <div className="flex flex-col gap-4">{intro}</div>
        <div className="flex flex-col gap-4">
          <Label>What you get</Label>
          <ol className="m-0 flex list-none flex-col p-0">
            {deliverables.map((d, i) => (
              <li key={d.title} className="grid grid-cols-[48px_1fr] gap-3 border-t border-line py-[18px]">
                <span className="font-mono text-[15px] text-accent-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="m-0 font-medium">{d.title}</p>
                  <p className="m-0 text-ink-2">{d.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2 border border-line bg-surface p-6">
            <Label>Done when</Label>
            <p className="m-0 text-[17px] font-medium">{doneWhen}</p>
          </div>
        </div>
      </AutoGrid>
    </Container>
  );
}

export function CtaStrip({
  title,
  href,
  label,
}: {
  title: string;
  href: string;
  label: string;
}) {
  return (
    <section className="border-t border-line">
      <Container className="flex flex-wrap items-center justify-between gap-6 py-20">
        <h2 className="m-0 max-w-[22ch] text-[clamp(28px,3.4vw,40px)] leading-[1.1] font-semibold tracking-[-0.03em]">
          {title}
        </h2>
        <ButtonLink href={href}>{label}</ButtonLink>
      </Container>
    </section>
  );
}
