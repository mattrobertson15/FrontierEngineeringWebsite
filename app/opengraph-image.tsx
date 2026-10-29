import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const alt = "Frontier Engineering — AI systems your team can run.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "AI-native engineering consultancy",
    title: "We build AI systems your team can run.",
  });
}
