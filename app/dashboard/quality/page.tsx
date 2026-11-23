import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "../../../components/brand";
import { Icon } from "../../../components/icon";
import { QualityChecker } from "./workspace";

export const metadata: Metadata = {
  title: "AI Content Quality Checker",
  description: "Review grammar, usefulness, search intent and E-E-A-T while keeping your original draft intact.",
};

export default function ContentQualityPage() {
  return <div className="dashboard">
    <header className="dashboard-nav">
      <div className="dashboard-nav-inner">
        <Brand/>
        <nav aria-label="Workspace navigation">
          <Link className="workspace-link" href="/dashboard"><Icon name="chart" size={18}/> Quick audit</Link>
        </nav>
      </div>
    </header>
    <main className="dashboard-main quality-main"><QualityChecker/></main>
  </div>;
}
