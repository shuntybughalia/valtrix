import type { Metadata } from "next";
import { Brand } from "../../components/brand";
import { Icon } from "../../components/icon";
import { AuditWorkspace } from "./workspace";

export const metadata: Metadata = { title: "Content audit" };

export default function Dashboard() {
  return <div className="dashboard">
    <header className="dashboard-nav">
      <div className="dashboard-nav-inner">
        <Brand />
        <nav aria-label="Workspace navigation">
          <a className="workspace-link" href="#editor"><Icon name="file" size={18}/> Editor</a>
          <a className="workspace-link" href="#results"><Icon name="chart" size={18}/> Results</a>
          <a className="workspace-link" href="#history"><Icon name="history" size={18}/> History</a>
        </nav>
      </div>
    </header>
    <main className="dashboard-main"><AuditWorkspace /></main>
  </div>;
}
