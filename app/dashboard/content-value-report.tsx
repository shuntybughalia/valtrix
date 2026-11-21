import type { evaluateContent } from "../../lib/content-value";

type Report = ReturnType<typeof evaluateContent>;

export function ContentValueReport({ report }: { report: Omit<Report, "aiWording"> }) {
  const lists = [
    { title: "Content problems", items: report.problems, empty: "No problems matched the automated signals in this draft." },
    { title: "Priority recommendations", items: report.recommendations, empty: "Review the draft with an editor before publishing." },
    { title: "Strengths", items: report.strengths, empty: "No strengths were confirmed by the automated checks." },
  ];
  const opportunities = [
    { title: "Subtopics", items: report.opportunities.subtopics },
    { title: "Reader questions", items: report.opportunities.questions },
    { title: "Entities", items: report.opportunities.entities },
    { title: "Contextual terms", items: report.opportunities.terms },
  ];

  return <>
    <section className="panel audit-health" aria-labelledby="weighted-heading">
      <div className="panel-heading">
        <h2 id="weighted-heading">AI SEO Content Value Score</h2>
        <span className="score-label">{report.classification}{report.evaluated < 100 ? " · Partial evidence" : ""}</span>
      </div>
      <div className="health-score">
        <div className="score-wheel" style={{ background: `conic-gradient(#6c2bee ${report.score}%, #e9dff7 0)` }}>
          <div><span><strong>{report.score}</strong><small> / 100</small></span></div>
        </div>
      </div>
      <p aria-live="polite">{report.assessment}</p>
      <p className="field-help">Primary intent: {report.intent ? `${report.intent} (${report.intentSource})` : "Not determined"}. Freshness reference year: {report.settings.asOfYear}.</p>
      {report.evaluated < 100 && <p className="field-help">Unavailable points stay unscored and are not redistributed. A partial score should be interpreted with its coverage.</p>}
      <p className="field-help">Content-only, rules-based review. External verification is required for factual accuracy, source credibility, plagiarism, live rankings, backlinks, and AI citations.</p>
    </section>

    <section className="panel value-report-section" aria-labelledby="weighted-categories">
      <div className="panel-heading"><h2 id="weighted-categories">Category-wise scoring</h2></div>
      <div className="value-categories">
        {report.categories.map((item) => <details key={item.name}>
          <summary>
            <strong>{item.name}</strong>
            <span>{item.achieved === null ? `Not Evaluated · ${item.maximum} max` : `${item.achieved} / ${item.maximum}`}</span>
          </summary>
          {item.achieved !== null && <progress value={item.achieved} max={item.maximum} aria-label={item.name}/>}
          <p>{item.reason}</p>
          {!!item.improvements.length && <ul>{item.improvements.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul>}
        </details>)}
      </div>
    </section>
    <section className="panel value-report-section" aria-labelledby="value-problems">
      <div className="panel-heading"><h2 id="value-problems">{lists[0].title}</h2></div>
      {lists[0].items.length ? <ul>{lists[0].items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>{lists[0].empty}</p>}
    </section>
    <section className="panel value-report-section" aria-labelledby="value-opportunities">
      <div className="panel-heading"><h2 id="value-opportunities">Missing topic opportunities</h2></div>
      {report.opportunities.needsBrief && <p className="field-help">Add a topic or entity brief to check gaps against your intended coverage.</p>}
      <dl className="value-opportunities">
        {opportunities.map(({ title, items }) => <div key={title}><dt>{title}</dt><dd>{items.length ? items.join(" · ") : "No gap identified from the supplied material."}</dd></div>)}
      </dl>
    </section>
    {lists.slice(1).map(({ title, items, empty }) => <section className="panel value-report-section" key={title}>
      <div className="panel-heading"><h2>{title}</h2></div>
      {items.length ? title === "Priority recommendations"
        ? <ol>{items.map((item) => <li key={item}>{item}</li>)}</ol>
        : <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        : <p>{empty}</p>}
    </section>)}
    <section className="panel value-report-section" aria-labelledby="value-verdict">
      <div className="panel-heading"><h2 id="value-verdict">Publishing verdict</h2></div>
      <p>{report.verdict}</p>
      <a className="button button-light" href="#editor">Return to draft</a>
    </section>
  </>;
}
