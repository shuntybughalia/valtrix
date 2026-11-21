import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VALTRIX — Measure Content. Maximize Value.", template: "%s | VALTRIX" },
  description: "Audit your content for on-page SEO, review individual checks, and see what to improve before publishing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
