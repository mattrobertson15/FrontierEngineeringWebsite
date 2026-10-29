import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { runs, taskCount, totalPlanned } from "@/content/wharf";

const attempts = totalPlanned.toLocaleString("en-US");

export const alt = `Wharf research: what ${attempts} coding-agent attempts reveal about harnesses, cost and reliability.`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "Research — Wharf / DeepSWE",
    title: `What ${attempts} coding-agent attempts reveal.`,
    footer: (
      <span>
        {runs.length} configurations · {taskCount} tasks · 4–5 attempts each
      </span>
    ),
  });
}
