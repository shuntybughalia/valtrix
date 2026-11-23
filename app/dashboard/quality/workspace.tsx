"use client";

import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type FormEvent } from "react";
import { Icon } from "../../../components/icon";
import {
  qualityContentLimit, qualityFactorKeys, qualityFactors, qualityKeywordLimit, qualityStatus, verdictTopics,
  type QualityReport, type QualitySubmission,
} from "../../../lib/quality-report";

function FormattedContent({ content, title }: { content: string; title: string }) {
  const preview = useMemo(() => {
    const template = document.createElement("template");
    template.innerHTML = content;
    template.content.querySelectorAll("script, iframe, frame, object, embed, meta, base, link, noscript").forEach((element) => element.remove());
    template.content.querySelectorAll("a, area, form").forEach((element) => element.setAttribute("target", "_blank"));
    const csp = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'";
    return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">${template.innerHTML}`;
  }, [content]);

  return <>
    <iframe className="quality-html-preview" title={title} sandbox="" referrerPolicy="no-referrer" srcDoc={preview}/>
    <p className="field-help">Formatting from the pasted HTML is shown here. External images and stylesheets are blocked.</p>
  </>;
}

function ContentViewControls({ formatted, onChange }: { formatted: boolean; onChange: (formatted: boolean) => void }) {
  return <div className="quality-view-controls" role="group" aria-label="Content view">
    <button type="button" className="button button-light" aria-pressed={formatted} onClick={() => onChange(true)}>Formatted content</button>
    <button type="button" className="button button-light" aria-pressed={!formatted} onClick={() => onChange(false)}>HTML source</button>
  </div>;
}

function OriginalContent({ submission }: { submission: QualitySubmission }) {
  const [formatted, setFormatted] = useState(submission.format === "html");

  return <aside className="panel quality-original" aria-labelledby="quality-original-title">
    <h3 id="quality-original-title">Original content</h3>
    {submission.format === "html" && <ContentViewControls formatted={formatted} onChange={setFormatted}/>}
    {formatted
      ? <FormattedContent content={submission.content} title="Formatted original content"/>
      : <pre className="quality-source" tabIndex={0} aria-label="Original source">{submission.content}</pre>}
  </aside>;
}

function ReportDetails({ report, keyword }: { report: QualityReport; keyword: string }) {
  return <div className="quality-analysis">
    <section className="panel quality-overview" aria-labelledby="quality-overview-title">
      <h3 id="quality-overview-title">Content overview</h3>
      <div className="quality-overall">
        <p className="content-score-number"><strong>{report.overallScore}</strong> / 100</p>
        <span className="quality-status" data-quality={qualityStatus(report.overallScore)}>{qualityStatus(report.overallScore)}</span>
      </div>
      <progress value={report.overallScore} max={100} aria-label="Overall content quality score"/>
      <h4>{report.topic}</h4>
      {keyword && <p className="field-help">Target keyword · {keyword}</p>}
      <p>{report.overview}</p>
    </section>

    <section aria-labelledby="quality-factors-title">
      <h3 className="quality-section-title" id="quality-factors-title">Analysis by factor</h3>
      <div className="quality-factor-grid">
        {qualityFactorKeys.map((key) => {
          const { score, summary } = report.factors[key];
          return <article className="panel content-score quality-factor" key={key}>
            <h4>{qualityFactors[key]}</h4>
            {score === null ? <p className="quality-score-unavailable">Not assessed</p> : <>
              <p className="content-score-number"><strong>{score}</strong> / 100</p>
              <progress value={score} max={100} aria-label={qualityFactors[key]}/>
            </>}
            <p>{summary}</p>
          </article>;
        })}
      </div>
    </section>

    <section className="panel quality-verdict" aria-labelledby="quality-verdict-title">
      <h3 id="quality-verdict-title">AI verdict</h3>
      <dl>
        {Object.entries(verdictTopics).map(([key, label]) => <div key={key}>
          <dt>{label}</dt><dd>{report.verdict[key as keyof typeof verdictTopics]}</dd>
        </div>)}
      </dl>
    </section>

    <section className="panel quality-recommendations" aria-labelledby="quality-recommendations-title">
      <h3 id="quality-recommendations-title">Recommendations ({report.issues.length})</h3>
      {report.issues.length ? <ol className="quality-issue-list">
        {report.issues.map((issue, index) => <li key={index}>
          <div className="quality-issue-label">
            <span data-severity={issue.severity}>{issue.severity} priority</span>
            <span>{qualityFactors[issue.factor]}</span>
          </div>
          <h4>{issue.title}</h4>
          {issue.excerpt ? <blockquote>{issue.excerpt}</blockquote> : <p className="field-help">No exact source excerpt for this finding.</p>}
          <dl>
            <div><dt>Why it matters</dt><dd>{issue.why}</dd></div>
            <div><dt>How to improve</dt><dd>{issue.how}</dd></div>
            {issue.suggestion && <div><dt>Suggested improvement</dt><dd>{issue.suggestion}</dd></div>}
          </dl>
        </li>)}
      </ol> : <p>No material issues were identified in this review.</p>}
    </section>
  </div>;
}

type CompletedReview = { id: number; submission: QualitySubmission; report: QualityReport };

export function QualityChecker() {
  const [content, setContent] = useState("");
  const [keyword, setKeyword] = useState("");
  const [format, setFormat] = useState<QualitySubmission["format"]>("text");
  const [formatted, setFormatted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<CompletedReview | null>(null);
  const running = useRef<AbortController | null>(null);
  const reportHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => { running.current?.abort(); }, []);
  useEffect(() => { if (review) reportHeading.current?.focus(); }, [review]);

  function pasteContent(event: ClipboardEvent<HTMLTextAreaElement>) {
    const field = event.currentTarget;
    if (field.selectionStart !== 0 || field.selectionEnd !== field.value.length) return;
    const text = event.clipboardData.getData("text/plain");
    const rich = event.clipboardData.getData("text/html");
    const isSource = /^\s*(?:<!--[\s\S]*?-->\s*)*<(?:!doctype\s+html|html|body|main|article|section|div|p|h[1-6]|ul|ol|li|a|table|blockquote|strong|em|span|img)(?:[\s/>])/i.test(text);
    const hasRichContent = Boolean(rich.trim());
    const original = isSource || !hasRichContent ? text : rich;
    if (!original) return;
    event.preventDefault();
    setContent(original);
    setError("");
    const isHtml = isSource || hasRichContent || format === "html";
    setFormat(isHtml ? "html" : "text");
    setFormatted(isHtml);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (running.current) return;
    if (!content.trim() || content.length > qualityContentLimit) {
      setError(content.trim() ? "The content limit is 100,000 characters." : "Paste the content you want to review.");
      return;
    }
    const submission: QualitySubmission = { content, keyword: keyword.trim(), format };
    const controller = new AbortController();
    running.current = controller;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/content-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        signal: controller.signal,
      });
      const data: { report?: QualityReport; error?: string } = await response.json();
      if (!response.ok || !data.report) {
        setError(data.error || "The analysis could not be completed. Please try again.");
        return;
      }
      const report = data.report;
      setReview((previous) => ({ id: (previous?.id ?? 0) + 1, submission, report }));
    } catch {
      if (!controller.signal.aborted) setError("The checker could not reach the analysis service. Please try again.");
    } finally {
      running.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return <>
    <section aria-labelledby="quality-heading">
      <div className="editor-intro">
        <h1 id="quality-heading">AI Content Quality Checker</h1>
        <p>Review your content for clarity, usefulness and credibility before publishing.</p>
      </div>
      <form className="panel audit-form quality-form" onSubmit={submit} aria-busy={pending}>
        <div className="quality-form-options">
          <label htmlFor="quality-format">Content format
            <select id="quality-format" value={format} onChange={(event) => {
              setFormat(event.target.value === "html" ? "html" : "text");
              setFormatted(false);
            }}>
              <option value="text">Plain text</option><option value="html">Formatted / HTML</option>
            </select>
          </label>
          <label htmlFor="quality-keyword">Target keyword <span className="optional">(optional)</span>
            <input id="quality-keyword" value={keyword} maxLength={qualityKeywordLimit} onChange={(event) => setKeyword(event.target.value)} placeholder="e.g. small business payroll software"/>
          </label>
        </div>
        <div className="draft-surface">
          {formatted ? <p className="quality-content-label">Original content</p> : <label htmlFor="quality-content">Original content</label>}
          {format === "html" && content && <ContentViewControls formatted={formatted} onChange={setFormatted}/>}
          {formatted
            ? <FormattedContent content={content} title="Formatted draft preview"/>
            : <textarea id="quality-content" rows={10} value={content}
                onChange={(event) => { setContent(event.target.value); setError(""); }} onPaste={pasteContent}
                placeholder="Paste content from Word, Google Docs, or a website. HTML and plain text are also supported."
                spellCheck={false} aria-describedby="quality-content-length quality-service-note"/>}
          <p id="quality-content-length" className="draft-meta">{content.length.toLocaleString("en-US")} / {qualityContentLimit.toLocaleString("en-US")} characters</p>
        </div>
        <div className="audit-form-actions">
          <button type="submit" className="button button-primary" disabled={pending}>
            <Icon name="search" size={17}/>{pending ? "Analyzing content…" : "Analyze content"}
          </button>
          {pending && <span className="field-help" role="status">Long drafts may take up to two minutes.</span>}
        </div>
        <p className="field-help" id="quality-service-note">Your draft is sent to Google Gemini for analysis. Avoid submitting confidential drafts on the free tier.</p>
        {error && <p className="notice" role="alert">{error}</p>}
      </form>
    </section>
    {review && <section className="quality-results" aria-labelledby="quality-results-title">
      <h2 className="workspace-heading" id="quality-results-title" ref={reportHeading} tabIndex={-1}>Audit results</h2>
      <div className="quality-result-grid">
        <OriginalContent key={review.id} submission={review.submission}/>
        <ReportDetails report={review.report} keyword={review.submission.keyword}/>
      </div>
    </section>}
  </>;
}
