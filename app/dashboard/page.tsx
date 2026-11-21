import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "../../components/brand";
import { Icon } from "../../components/icon";
import { AuditWorkspace } from "./workspace";

export const metadata: Metadata = { title: "Content audit" };

export default function Dashboard() {
  return <div className="dashboard">
    <aside className="dashboard-nav">
      <Brand/>
      <nav aria-label="Workspace navigation">
        <Link className="workspace-link current" href="/dashboard" aria-current="page"><Icon name="grid" size={18}/> Content audit</Link>
        <a className="workspace-link" href="#history"><Icon name="history" size={18}/> Audit history</a>
      </nav>
    </aside>
    <main className="dashboard-main">
      <header className="dashboard-heading"><p className="kicker"><Icon name="search" size={16}/> SEO workspace</p><h1>Content audit</h1><p>Review your draft against eight on-page SEO checks.</p></header>
      <AuditWorkspace/>
    </main>
  </div>;
}
