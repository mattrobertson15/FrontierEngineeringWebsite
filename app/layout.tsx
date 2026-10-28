import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Self-hosted Geist (no runtime request to Google Fonts).
const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Frontier Engineering — AI-Native Engineering Consultancy",
    template: "%s · Frontier Engineering",
  },
  description:
    "Frontier Engineering embeds senior engineers inside your business to find where AI actually pays, build it the AI-native way, and test it until the numbers hold.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
