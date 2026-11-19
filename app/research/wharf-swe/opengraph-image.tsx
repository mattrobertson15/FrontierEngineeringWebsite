import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { sweRuns, sweTotalTrials, wharfSweTaskCount } from "@/content/wharf-swe";

export const alt = "WharfSWE: the same coding-agent models, run after run, across harnesses and releases.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "Research — Wharf / WharfSWE",
    title: "The same model, run after run, harness by harness.",
    footer: (
      <span>
        {sweRuns.length} runs · {wharfSweTaskCount} tasks · {sweTotalTrials.toLocaleString("en-US")} trials
      </span>
    ),
  });
}
