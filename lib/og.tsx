import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/Logo";

/* Shared layout for link-preview (Open Graph) images. Colors mirror globals.css. */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const fonts = join(process.cwd(), "node_modules/geist/dist/fonts");
const [sans, sansSemi, mono] = await Promise.all([
  readFile(join(fonts, "geist-sans/Geist-Regular.ttf")),
  readFile(join(fonts, "geist-sans/Geist-SemiBold.ttf")),
  readFile(join(fonts, "geist-mono/GeistMono-Regular.ttf")),
]);

const ink = "#071c29";
const paper = "#f5f2eb";
const accentSoft = "#e0915f";
const nightMuted = "#b7c0c5";
const nightLine = "#1f3645";

export function ogImage({
  eyebrow,
  title,
  footer,
}: {
  eyebrow: string;
  title: string;
  /** Optional row under the title, e.g. headline stats. */
  footer?: ReactNode;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: ink,
          color: paper,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <LogoMark size={40} inverted />
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Frontier Engineering
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span
            style={{
              fontFamily: "Geist Mono",
              fontSize: 22,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: accentSoft,
            }}
          >
            {eyebrow}
          </span>
          <span
            style={{
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              maxWidth: 1000,
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 32,
            borderTop: `1px solid ${nightLine}`,
            paddingTop: 24,
            fontFamily: "Geist Mono",
            fontSize: 20,
            color: nightMuted,
          }}
        >
          {footer ?? <span>Engineering · Forward-deployed · Model testing · Playbook</span>}
          <span style={{ flexShrink: 0 }}>frontier-engineering.ai</span>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Geist", data: sans, weight: 400, style: "normal" },
        { name: "Geist", data: sansSemi, weight: 600, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
