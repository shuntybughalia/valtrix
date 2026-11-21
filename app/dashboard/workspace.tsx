"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Icon } from "../../components/icon";
import { audit, example, type Draft } from "../../lib/audit";

type Entry = { id: string; date: string; title: string; result: ReturnType<typeof audit> };

const storageKey = "valtrix.audit-history.v1";
const historyEvent = "valtrix-history";
const emptyDraft = { title: "", keyword: "", description: "", content: "" };

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

function readHistory(snapshot: string): Entry[] {
  try {
    const data = JSON.parse(snapshot);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function AuditWorkspace() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [report, setReport] = useState<Entry | null>(null);
  const [notice, setNotice] = useState("");
  const history = readHistory(useSyncExternalStore(subscribe, historySnapshot, () => "[]"));

  function update(field: keyof Draft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.content.trim() || !/[\p{L}\p{N}]/u.test(draft.keyword)) {
      setNotice("Enter a title, a focus keyword with letters or numbers, and some draft content.");
      return;
    }
    const entry = { id: crypto.randomUUID(), date: new Date().toISOString(), title: draft.title.trim(), result: audit(draft) };
    setReport(entry);
    setNotice("");
    try {
      const entries = readHistory(historySnapshot());
      localStorage.setItem(storageKey, JSON.stringify([entry, ...entries].slice(0, 20)));
      window.dispatchEvent(new Event(historyEvent));
    } catch {
      setNotice("This browser could not save your audit history. You can still review the current result.");
    }
  }

  return <>
    <div className="audit-grid">
      <section className="panel" aria-labelledby="draft-heading">
        <div className="panel-heading"><h2 id="draft-heading">Your draft</h2><button className="button button-light" type="button" onClick={() => { setDraft(example); setNotice(""); }}>Load example</button></div>
        <form className="audit-form" onSubmit={submit}>
          <label>Page title<input required maxLength={300} value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="Enter your page title"/></label>
          <label>Focus keyword<input required maxLength={120} value={draft.keyword} onChange={(e) => update("keyword", e.target.value)} placeholder="e.g. email marketing strategy"/></label>
          <label>Meta description <span className="optional">(optional)</span><textarea rows={2} maxLength={500} value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="Summarize what the page offers"/></label>
          <label>Draft content<textarea required rows={8} maxLength={100000} value={draft.content} onChange={(e) => update("content", e.target.value)} placeholder="Paste or write your draft here" aria-describedby="heading-help"/><span id="heading-help" className="field-help">Use ## followed by a space for subheadings.</span></label>
          <button type="submit" className="button button-primary"><Icon name="search" size={17}/> Run audit</button>
          {notice && <p className="notice" role="status">{notice}</p>}
        </form>
      </section>
      <section className="panel" id="results" aria-labelledby="result-heading">
        <div className="panel-heading"><h2 id="result-heading">Audit results</h2></div>
        <div aria-live="polite" className="sr-only">{report && `${report.title} scored ${report.result.score} out of 100. ${report.result.passed} of 8 checks passed.`}</div>
        {report ? <div>
          <div className="result-score">
            <div className="score-wheel" style={{ background: `conic-gradient(#6c2bee ${report.result.score}%, #e8dcff 0)` }}><div><strong>{report.result.score}</strong><small>/ 100</small></div></div>
            <div><h3>{report.title}</h3><p>{report.result.passed} of 8 checks passed · {report.result.wordCount} words</p></div>
          </div>
          <ul className="result-list">{report.result.checks.map((check) => <li key={check.title}>
            <div><strong>{check.title}</strong><p>{check.detail}</p></div>
            <span className={check.passed ? "status pass" : "status review"}>{check.passed ? "Passed" : "Review"}</span>
          </li>)}</ul>
          <p className="field-help">The score reflects this checklist. It does not predict search rankings.</p>
        </div> : <div className="empty-result"><span className="feature-icon"><Icon name="chart" size={23}/></span><h3>Ready when you are</h3><p>Run an audit to see your score and specific edits to consider.</p></div>}
      </section>
    </div>
    <section className="panel history-panel" id="history" aria-labelledby="history-heading">
      <div className="panel-heading"><h2 id="history-heading">Audit history</h2></div>
      {history.length ? <ul className="history-list">{history.map((entry) => <li key={entry.id}>
        <div><strong>{entry.title}</strong><span>{new Date(entry.date).toLocaleDateString(undefined, { dateStyle: "medium" })} · {entry.result.score}/100</span></div>
        <a className="button button-light" href="#results" onClick={() => setReport(entry)}>View results</a>
      </li>)}</ul> : <p className="field-help">Your last 20 results will appear here in this browser.</p>}
    </section>
  </>;
}
