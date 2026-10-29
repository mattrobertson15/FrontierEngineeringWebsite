import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const alt = "Frontier Engineering — engineering built for the AI era, proven in production.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "AI-native engineering consultancy",
    title: "Engineering built for the AI era. Proven in production.",
  });
}
