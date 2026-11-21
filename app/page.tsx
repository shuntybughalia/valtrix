import Link from "next/link";
import { Brand } from "../components/brand";
import { Icon } from "../components/icon";
import { example } from "../lib/audit";
import { evaluateContent, exampleAuditSettings } from "../lib/content-value";

const features = [
  { icon: "target", title: "AI search readiness", description: "Check whether the topic is clear upfront and the draft is organized into sections readers can scan." },
  { icon: "file", title: "Content value", description: "Find where specific examples, actionable steps, or source links could make your draft more useful." },
  { icon: "search", title: "On-page SEO", description: "Check how clearly your page title and meta description communicate the topic." },
] as const;

export default function Home() {
  const sample = evaluateContent(example, exampleAuditSettings);
  return (
    <div className="landing">
      <header className="site-nav"><div className="wrap nav-inner">
        <Brand />
        <nav aria-label="Main navigation"><a className="nav-link" href="#features">Features</a><Link className="button button-outline" href="/dashboard">Dashboard <Icon name="arrow" size={16} /></Link></nav>
      </div></header>
      <main>
        <section className="hero"><div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="kicker"><Icon name="chart" size={16}/> AI SEO &amp; content value audit</p>
            <h1>Measure Content.<br/><span>Maximize Value.</span></h1>
            <p className="hero-description">See how ready your draft is for AI search and where it can offer more value to readers. Get a clear list of edits before you publish.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link className="button button-primary" href="/dashboard">Run a content audit <Icon name="arrow" size={18}/></Link>
              <a className="text-link" href="#features">Explore features</a>
            </div>
          </div>
          <div className="preview-frame">
            <div className="preview">
              <div className="preview-header"><span><Icon name="grid" size={16}/> Audit overview</span><small>Sample report</small></div>
              <div className="preview-body">
                <div className="preview-summary">
                  <div className="score-wheel" style={{ background: `conic-gradient(#a879ff ${sample.score}%, #2e2447 0)` }}><div><strong>{sample.score}</strong><small>/ 100</small></div></div>
                  <div><h2>AI SEO Content Value Score</h2><p>{sample.evaluated} of 100 points evaluated</p></div>
                </div>
                {sample.categories.filter(({ name }) => ["Search Intent Optimization", "Content Quality & Helpfulness", "AI Search Readability"].includes(name)).map(({ name, achieved, maximum }) => {
                  return <div key={name} className={achieved === maximum ? "preview-check" : "preview-check needs-work"}>
                    <span><Icon name={achieved === maximum ? "check" : "file"} size={16}/> {name}</span><small>{achieved === null ? "Not Evaluated" : `${achieved} / ${maximum}`}</small>
                  </div>;
                })}
              </div>
            </div>
          </div>
        </div></section>
        <section className="features wrap" id="features">
          <h2>Know what to improve before you publish</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => <article className="feature-card" key={feature.title}>
              <span className="feature-icon"><Icon name={feature.icon}/></span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>)}
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="wrap footer-inner"><Brand/><p>Measure Content. Maximize Value.</p></div></footer>
    </div>
  );
}
