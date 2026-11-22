import type { CSSProperties } from "react";

const passingThreshold = 70;
const scale = Array.from({ length: 21 }, (_, index) => index * 5);
const rotation = (score: number) => (score / 100) * 180 - 90;

export function ScoreGauge({ eeat, geo }: { eeat: number; geo: number }) {
  const score = (eeat + geo) / 2;
  const passed = score > passingThreshold;
  const status = passed ? "Pass" : "Needs improvement";

  return (
    <section className="panel overall-score" aria-labelledby="overall-score-heading">
      <h3 id="overall-score-heading">Overall content score</h3>
      <div className="score-gauge" aria-hidden="true">
        <div className="score-gauge-arc" style={{ "--passing-arc": `${rotation(passingThreshold) + 90}deg` } as CSSProperties}/>
        {scale.map((value) => {
          const labeled = value % 20 === 0 || value === passingThreshold;
          return (
            <span className="score-gauge-tick" data-labeled={labeled} data-threshold={value === passingThreshold}
              style={{ "--angle": `${rotation(value)}deg` } as CSSProperties} key={value}>
              {labeled && <span>{value}</span>}
            </span>
          );
        })}
        <div className="score-gauge-needle" style={{ transform: `rotate(${rotation(score)}deg)` }}/>
        <div className="score-gauge-hub"/>
      </div>
      <p className="overall-score-reading"><strong>{score}</strong> / 100</p>
      <p className="overall-score-status" data-passed={passed}>{status}</p>
      <p className="field-help">Average of E-E-A-T and generative search scores. Pass requires a score above {passingThreshold}.</p>
    </section>
  );
}
