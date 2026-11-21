import Link from "next/link";
import { Brand } from "../components/brand";
import { Icon } from "../components/icon";

const features = [
  { icon: "target", title: "Check keyword placement", description: "See where your focus keyword appears across your title, description, headings, and opening paragraph." },
  { icon: "file", title: "Prioritize content edits", description: "Review individual checks for metadata, heading structure, and draft length, with a clear next step for each gap." },
  { icon: "history", title: "Revisit earlier audits", description: "Open previous results in the same browser to review what you checked and see how your draft has changed." },
] as const;

export default function Home() {
  return (
    <div className="landing">
      <header className="site-nav"><div className="wrap nav-inner">
        <Brand />
        <nav aria-label="Main navigation"><a className="nav-link" href="#features">Features</a><Link className="button button-outline" href="/dashboard">Dashboard <Icon name="arrow" size={16} /></Link></nav>
      </div></header>
      <main>
        <section className="hero"><div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="kicker"><Icon name="chart" size={16}/> On-page SEO audits</p>
            <h1>Measure Content.<br/><span>Maximize Value.</span></h1>
            <p className="hero-description">Find out what’s working in your draft and what to improve. Check your keywords, metadata, and content structure before you publish.</p>
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
                  <div className="score-wheel" style={{ background: "conic-gradient(#a879ff 75%, #2e2447 0)" }}><div><strong>75</strong><small>/ 100</small></div></div>
                  <div><h2>Content score</h2><p>6 of 8 checks passed</p></div>
                </div>
                <div className="preview-check"><span><Icon name="check" size={16}/> Page title</span><small>Passed</small></div>
                <div className="preview-check"><span><Icon name="check" size={16}/> Focus keyword in title</span><small>Passed</small></div>
                <div className="preview-check needs-work"><span><Icon name="file" size={16}/> Meta description</span><small>Review</small></div>
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
