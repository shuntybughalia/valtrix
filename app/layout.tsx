import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VALTRIX — Measure Content. Maximize Value.", template: "%s | VALTRIX" },
  description: "Identify your draft’s main topic and check its E-E-A-T signals and generative search readiness.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
