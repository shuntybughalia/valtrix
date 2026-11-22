import type { ContentAudit } from "../../lib/content-value";

export function ContentValueReport({ report }: { report: ContentAudit }) {
  return <>
    <div className="panel audit-target">
      <div>
        <p className="kicker">Detected topic</p>
        <h3>{report.topic}</h3>
        <p className="field-help">{report.wordCount.toLocaleString("en-US")} words analyzed</p>
      </div>
    </div>
    <div className="content-score-grid">
      {[report.eeat, report.geo].map(({ label, score, signals }) => <section className="panel content-score" key={label}>
        <h3>{label}</h3>
        <p className="content-score-number"><strong>{score}</strong> / 100</p>
        <progress value={score} max={100} aria-label={label}/>
        <details className="saved-audit-details">
          <summary>Score breakdown</summary>
          <dl>
            {signals.map((signal) => <div key={signal.label}>
              <dt>{signal.label} <span>{signal.earned}/{signal.points}</span></dt>
              {signal.evidence && <dd className="score-evidence">“{signal.evidence}”</dd>}
              {signal.earned === 0 && <dd>{signal.suggestion}</dd>}
            </div>)}
          </dl>
        </details>
      </section>)}
    </div>
    <p className="field-help">Scores are VALTRIX estimates based on the pasted text. Confirm facts and source credibility before publishing. Search rankings and AI citations depend on the search engine.</p>
  </>;
}
