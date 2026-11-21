import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VALTRIX — Measure Content. Maximize Value.", template: "%s | VALTRIX" },
  description: "Check your draft for AI search readiness, content value, and on-page SEO. Get a prioritized checklist of edits before publishing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
