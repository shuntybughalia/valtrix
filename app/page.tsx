import Link from "next/link";
import { Brand } from "../components/brand";
import { Icon } from "../components/icon";
import { example } from "../lib/audit";
import { evaluateContent } from "../lib/content-value";

const features = [
  { icon: "target", title: "Topic detection", description: "See the main topic readers are likely to take away from your draft." },
  { icon: "file", title: "E-E-A-T signals", description: "Review signs of first-hand experience, expertise, attribution, and trust." },
  { icon: "search", title: "Generative search readiness", description: "Check for direct answers, useful specifics, and explanations that stand on their own." },
] as const;

export default function Home() {
  const sample = evaluateContent(example.content);
  return (
    <div className="landing">
      <header className="site-nav"><div className="wrap nav-inner">
        <Brand />
        <nav aria-label="Main navigation"><a className="nav-link" href="#features">Features</a><Link className="button button-outline" href="/dashboard">Dashboard <Icon name="arrow" size={16} /></Link></nav>
      </div></header>
      <main>
        <section className="hero"><div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="kicker"><Icon name="chart" size={16}/> Content quality audit</p>
            <h1>Measure Content.<br/><span>Maximize Value.</span></h1>
            <p className="hero-description">See how ready your draft is for AI search and where it can offer more value to readers. Get a clear list of edits before you publish.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link className="button button-primary" href="/dashboard">Run a content audit <Icon name="arrow" size={18}/></Link>
              <a className="text-link" href="#features">Explore features</a>
            </div>
          </div>
          {sample && <div className="preview-frame">
            <div className="preview">
              <div className="preview-header"><span><Icon name="grid" size={16}/> Audit overview</span><small>Sample report</small></div>
              <div className="preview-body">
                <div className="preview-summary">
                  <div><h2>{sample.topic}</h2><p>Detected topic</p></div>
                </div>
                {[sample.eeat, sample.geo].map(({ label, score }) => <div key={label} className="preview-check">
                  <span><Icon name="file" size={16}/> {label}</span><small>{score} / 100</small>
                </div>)}
              </div>
            </div>
          </div>}
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
