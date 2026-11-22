"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Icon } from "../../components/icon";
import { example } from "../../lib/audit";
import { contentLimit, evaluateContent, type ContentAudit } from "../../lib/content-value";
import { ContentValueReport } from "./content-value-report";

type SavedAudit = { id: string; date: string; contentAudit: ContentAudit };
type EarlierAudit = { id: string; date: string; title: string; weighted?: { score: number }; result: { score: number } };
type HistoryEntry = SavedAudit | EarlierAudit;

const storageKey = "valtrix.audit-history.v1";
const historyEvent = "valtrix-history";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(historyEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(historyEvent, listener);
  };
}

function historySnapshot() {
  try {
    return localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "[]";
  }
}

function readHistory(snapshot: string): HistoryEntry[] {
  try {
    const data = JSON.parse(snapshot);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function AuditWorkspace() {
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState<HistoryEntry | null>(null);
  const [error, setError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const history = readHistory(useSyncExternalStore(subscribe, historySnapshot, () => "[]"));
  const entry = active ?? history.find((item) => "contentAudit" in item);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contentAudit = evaluateContent(draft);
    if (!contentAudit) {
      setError("Enter draft text to run an audit.");
      return;
    }
    const next = { id: crypto.randomUUID(), date: new Date().toISOString(), contentAudit };
    setActive(next);
    setError("");
    setSaveNotice("");
    try {
      const entries = readHistory(historySnapshot());
      localStorage.setItem(storageKey, JSON.stringify([next, ...entries].slice(0, 20)));
      window.dispatchEvent(new Event(historyEvent));
    } catch {
      setSaveNotice("This browser could not save the report to history.");
    }
    window.location.hash = "results";
    document.getElementById("results")?.focus();
  }

  return <>
    <section id="editor" className="audit-editor" aria-labelledby="draft-heading">
      <div className="editor-intro">
        <h1 id="draft-heading">Content Quality Audit</h1>
        <p>Find your draft’s main topic and assess its E-E-A-T signals and generative search readiness.</p>
      </div>
      <form className="panel audit-form" onSubmit={submit}>
        <div className="draft-surface">
          <label htmlFor="draft-content">Draft content</label>
          <textarea id="draft-content" rows={9} maxLength={contentLimit} value={draft} onChange={(event) => { setDraft(event.target.value); setError(""); }} placeholder="Paste or write your draft here…"/>
          <div className="draft-meta">
            <span>{draft.length.toLocaleString("en-US")} / {contentLimit.toLocaleString("en-US")} characters</span>
          </div>
        </div>
        <div className="audit-form-actions">
          <button type="submit" className="button button-primary"><Icon name="search" size={17}/> Analyze content</button>
          <button className="button button-light" type="button" onClick={() => { setDraft(example.content); setError(""); }}>Load example</button>
        </div>
        {error && <p className="notice" role="alert">{error}</p>}
      </form>
    </section>

    <section className="compact-audit" id="results" tabIndex={-1} aria-labelledby="results-heading">
      <h2 className="workspace-heading" id="results-heading">Audit results</h2>
      {saveNotice && <p className="notice" role="status">{saveNotice}</p>}
      {entry ? "contentAudit" in entry ? <ContentValueReport report={entry.contentAudit}/> : (
        <div className="panel audit-target">
          <div>
            <p className="kicker">Earlier audit</p>
            <h3>{entry.title}</h3>
            <p className="field-help">{entry.weighted?.score ?? entry.result.score}/100 under the previous scoring method. Paste the draft again to get the new scores.</p>
          </div>
        </div>
      ) : <p className="panel field-help">Analyze a draft to see its topic and scores.</p>}
    </section>

    <section className="panel history-panel" id="history" aria-labelledby="history-heading">
      <div className="panel-heading"><h2 id="history-heading">Audit history</h2></div>
      {history.length ? <ul className="history-list">{history.map((item) => <li key={item.id}>
        <div>
          <strong>{"contentAudit" in item ? item.contentAudit.topic : item.title}</strong>
          <span>{new Date(item.date).toLocaleDateString(undefined, { dateStyle: "medium" })} · {"contentAudit" in item
            ? `E-E-A-T ${item.contentAudit.eeat.score}/100 · GEO ${item.contentAudit.geo.score}/100`
            : "Earlier audit"}</span>
        </div>
        <a className="button button-light" href="#results" onClick={() => { setActive(item); setSaveNotice(""); }}>View results</a>
      </li>)}</ul> : <p className="field-help">Your last 20 reports will appear here in this browser.</p>}
    </section>
  </>;
}
