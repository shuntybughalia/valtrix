"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Icon } from "../../components/icon";
import { audit, example, type AuditCategory, type Draft } from "../../lib/audit";
import { evaluateContent, exampleAuditSettings, intents, validateDraft, type AuditSettings } from "../../lib/content-value";
import { ContentValueReport } from "./content-value-report";

type AuditResult = ReturnType<typeof audit>;
type SavedCheck = Omit<AuditResult["checks"][number], "category"> & { category?: AuditCategory };
type SavedEditorial = Omit<AuditResult["editorial"], "sentenceRhythm"> & { sentenceRhythm?: number | null };
type WeightedReport = ReturnType<typeof evaluateContent>;
type Entry = { id: string; date: string; title: string; result: Omit<AuditResult, "checks" | "editorial"> & { checks: SavedCheck[]; editorial?: SavedEditorial }; weighted?: Omit<WeightedReport, "aiWording"> & Partial<Pick<WeightedReport, "aiWording">> };

const storageKey = "valtrix.audit-history.v1";
const historyEvent = "valtrix-history";
const emptyDraft = { title: "", keyword: "", description: "", content: "" };

const exampleReport = { title: example.title, result: audit(example), weighted: evaluateContent(example, exampleAuditSettings) };
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
  const [settings, setSettings] = useState<AuditSettings>({ asOfYear: 2026 });
  const history = readHistory(useSyncExternalStore(subscribe, historySnapshot, () => "[]"));

  const savedReport = report ?? history.find((entry) => entry.weighted);
  const { title, result, weighted } = savedReport ?? exampleReport;
  const score = weighted?.score ?? result.score;
  const readingTime = result.wordCount / 225;
  const metrics = result.editorial;
  const categoryScore = (names: string[]) => {
    const matching = weighted?.categories.filter((item) => names.includes(item.name)) ?? [];
    const evaluated = matching.reduce((points, item) => points + item.evaluated, 0);
    const possible = matching.reduce((points, item) => points + item.maximum, 0);
    const achieved = matching.reduce((points, item) => points + (item.achieved ?? 0), 0);
    return evaluated > 0 && possible === evaluated ? Math.round(achieved / possible * 100) : null;
  };
  const styleScore = categoryScore(["Content Quality & Helpfulness", "Structure & Readability"]);
  const seoScore = categoryScore(["Keyword Optimization", "E-E-A-T Signals"]);
  const aiWording = weighted?.aiWording;
  const informationGain = weighted?.categories.find((item) => item.name === "Information Gain & Originality");

  function update(field: keyof Draft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateDraft(draft);
    if (error || !Number.isInteger(settings.asOfYear) || settings.asOfYear < 1900 || settings.asOfYear > 2200) {
      setNotice(error ?? "Choose an evaluation year from 1900 to 2200.");
      return;
    }
    const entry = { id: crypto.randomUUID(), date: new Date().toISOString(), title: draft.title.trim(), result: audit(draft), weighted: evaluateContent(draft, settings) };
    setReport(entry);
    setNotice("");
    try {
      const entries = readHistory(historySnapshot());
      localStorage.setItem(storageKey, JSON.stringify([entry, ...entries].slice(0, 20)));
      window.dispatchEvent(new Event(historyEvent));
    } catch {
      setNotice("This browser could not save your audit history. You can still review the current result.");
    }
    window.location.hash = "results";
    document.getElementById("results")?.focus();
  }

  return <>
    <div className="compact-audit">
      <section className="panel audit-target" id="results" tabIndex={-1} aria-labelledby="target-title">
        <div className="audit-target-copy">
          <p className="kicker"><Icon name="target" size={15}/> {savedReport ? "Content overview" : "Sample content"}</p>
          <h1 id="target-title">{title}</h1>
          <ul className="audit-target-meta">
            <li><Icon name="file" size={14}/> {result.wordCount.toLocaleString("en-US")} words</li>
            <li><Icon name="history" size={14}/> {readingTime.toFixed(1)} min read</li>
            {metrics && <li><Icon name="grid" size={14}/> {metrics.headingCount} {metrics.headingCount === 1 ? "subheading" : "subheadings"}</li>}
          </ul>
        </div>
        <a className="compact-icon-button" href="#editor" aria-label="Change audit target"><Icon name="arrow" size={17}/></a>
      </section>

      <section className="panel audit-health" aria-labelledby="health-title">
        <div className="panel-heading">
          <h2 id="health-title">Overall content health</h2>
          <span className="score-label">{weighted?.classification ?? "Earlier checklist"}</span>
        </div>
        <div className="health-score">
          <div className="score-wheel" style={{ background: `conic-gradient(#6c2bee ${score}%, #e9dff7 0)` }}>
            <div><span><strong>{score}</strong><small> / 100</small></span><b>{weighted ? `${weighted.evaluated} pts assessed` : "Checklist"}</b></div>
          </div>
        </div>
        <ul className="health-breakdown">
          <li>
            <span className="audit-check-icon"><Icon name="file" size={17}/></span>
            <div><strong>Human Touch &amp; Style</strong><small>Helpfulness and readability</small></div>
            <strong className="breakdown-score">{styleScore ?? "—"}{styleScore !== null && <small> / 100</small>}</strong>
          </li>
          <li>
            <span className="audit-check-icon"><Icon name="target" size={17}/></span>
            <div><strong>SEO Power &amp; E-E-A-T</strong><small>Keyword use and evidence signals</small></div>
            <strong className="breakdown-score">{seoScore ?? "—"}{seoScore !== null && <small> / 100</small>}</strong>
          </li>
          <li>
            <span className="audit-check-icon"><Icon name="search" size={17}/></span>
            <div><strong>AI Wording Score</strong><small>{aiWording?.score != null ? `${aiWording.flaggedSentences} of ${aiWording.sentenceCount} sentences flagged for generic or repeated wording` : "Run a new audit to measure wording patterns"}</small></div>
            <strong className="breakdown-score">{aiWording?.score ?? "—"}{aiWording?.score != null && <small> / 100</small>}</strong>
          </li>
        </ul>
      </section>

      <section className="audit-metrics" aria-labelledby="metrics-heading">
        <div className="panel-heading"><h2 id="metrics-heading">Editorial Telemetry</h2></div>
        <dl className="audit-metrics-grid">
          <div><dt>Readability <Icon name="file" size={16}/></dt><dd>{metrics?.wordsPerSentence ?? "—"}</dd><dd className="metric-note">Average words per sentence</dd></div>
          <div><dt>Sentence rhythm <Icon name="chart" size={16}/></dt><dd>{metrics?.sentenceRhythm == null ? "—" : `${metrics.sentenceRhythm}%`}</dd><dd className="metric-note">Sentences of 8–24 words</dd></div>
          <div><dt>Info gain <Icon name="grid" size={16}/></dt><dd>{informationGain?.achieved == null ? "—" : `${informationGain.achieved} / ${informationGain.maximum}`}</dd><dd className="metric-note">Examples, comparisons and methods</dd></div>
          <div><dt>Passive voice <Icon name="target" size={16}/></dt><dd>—</dd><dd className="metric-note">Not measured</dd></div>
        </dl>
      </section>

      <div className="compact-audit-actions">
        <a className="button button-primary" href="#editor"><Icon name="file" size={17}/> Open in Live Editor</a>
        <button className="compact-icon-button" form="audit-draft" type="submit" disabled={!draft.content.trim()} aria-label="Re-run audit"><Icon name="history" size={17}/></button>
      </div>
    </div>

    <section className="panel audit-editor" id="editor" aria-labelledby="draft-heading">
        <div className="panel-heading"><h2 id="draft-heading">Your draft</h2><button className="button button-light" type="button" onClick={() => { setDraft(example); setSettings(exampleReport.weighted.settings); setNotice(""); }}>Load example</button></div>
        <form id="audit-draft" className="audit-form" onSubmit={submit}>
          <label>Page title<input required maxLength={300} value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="Enter your page title"/></label>
          <label>Focus keyword or search query<input required maxLength={120} value={draft.keyword} onChange={(e) => update("keyword", e.target.value)} placeholder="e.g. how to plan a small business newsletter"/></label>
          <label>Meta description <span className="optional">(optional)</span><textarea rows={2} maxLength={500} value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="Summarize what the page offers"/></label>
          <label>Draft content<textarea required rows={8} maxLength={100000} value={draft.content} onChange={(e) => update("content", e.target.value)} placeholder="Paste or write your draft here" aria-describedby="heading-help"/><span id="heading-help" className="field-help">Use ## followed by a space for subheadings.</span></label>
          <details className="audit-brief">
            <summary>Evaluation settings and topic brief</summary>
            <label>Primary search intent<select value={settings.intent ?? ""} onChange={(event) => setSettings({ ...settings, intent: intents.find((intent) => intent === event.target.value) })}><option value="">Infer from query</option>{intents.map((intent) => <option key={intent}>{intent}</option>)}</select></label>
            <label>Expected subtopics <span className="optional">(optional)</span><input maxLength={1000} value={settings.expectedTopics ?? ""} onChange={(e) => setSettings({ ...settings, expectedTopics: e.target.value })} placeholder="Goals, audience segments, sending schedule"/></label>
            <label>Expected entities or related concepts <span className="optional">(optional)</span><input maxLength={1000} value={settings.expectedEntities ?? ""} onChange={(e) => setSettings({ ...settings, expectedEntities: e.target.value })} placeholder="Subscribers, unsubscribe links, email list"/></label>
            <label>Secondary keywords <span className="optional">(optional)</span><input maxLength={1000} value={settings.secondaryKeywords ?? ""} onChange={(e) => setSettings({ ...settings, secondaryKeywords: e.target.value })} placeholder="Welcome email, monthly newsletter"/></label>
            <p className="field-help">Separate terms with commas.</p>
            <label>Freshness reference year<input type="number" required min={1900} max={2200} value={Number.isNaN(settings.asOfYear) ? "" : settings.asOfYear} onChange={(e) => setSettings({ ...settings, asOfYear: e.target.valueAsNumber })}/></label>
          </details>
          <button type="submit" className="button button-primary"><Icon name="search" size={17}/> Run AI SEO audit</button>
          {notice && <p className="notice" role="status">{notice}</p>}
        </form>
    </section>
    <section className="panel history-panel" id="history" aria-labelledby="history-heading">
      <div className="panel-heading"><h2 id="history-heading">Audit history</h2></div>
      {history.length ? <ul className="history-list">{history.map((entry) => <li key={entry.id}>
        <div><strong>{entry.title}</strong><span>{new Date(entry.date).toLocaleDateString(undefined, { dateStyle: "medium" })} · {entry.weighted?.score ?? entry.result.score}/100{entry.weighted ? "" : " (earlier checklist)"}</span></div>
        <a className="button button-light" href="#results" onClick={() => setReport(entry)}>View results</a>
      </li>)}</ul> : <p className="field-help">Your last 20 results will appear here in this browser.</p>}
      {weighted && <details className="saved-audit-details"><summary>Detailed score breakdown</summary><ContentValueReport report={weighted}/></details>}
    </section>
  </>;
}
