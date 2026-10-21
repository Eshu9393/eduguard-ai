import { useEffect, useState } from "react";
import type { Explanation, Outcome, PredictionResponse } from "../lib/api";
import { ORDER, OUTCOME_META, TAGS, formatValue, labelFor } from "../lib/explain";

const pct = (p: number) => `${Math.round(p * 100)}%`;

// Flips to true just after mount, so bars and the ring animate from empty.
function usePlayed() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

function Ring({ probs, pred }: { probs: Record<Outcome, number>; pred: Outcome }) {
  const on = usePlayed();
  const segs = ORDER.map((cls, i) => ({
    cls,
    pr: probs[cls] * 100,
    start: ORDER.slice(0, i).reduce((s, c) => s + probs[c] * 100, 0),
  }));
  return (
    <svg viewBox="0 0 42 42" className="h-44 w-44" role="img"
         aria-label={`${pred}: ${pct(probs[pred])} of the model's score`}>
      <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--color-line)" strokeWidth="4.5" />
      {segs.map(({ cls, pr, start }) => (
        <circle
          key={cls}
          cx="21" cy="21" r="15.915" fill="none"
          stroke={OUTCOME_META[cls].cssVar}
          strokeWidth="4.5"
          strokeDasharray={`${on ? pr : 0} ${on ? 100 - pr : 100}`}
          strokeDashoffset={25 - start}
          className="transition-[stroke-dasharray] duration-700 motion-reduce:transition-none"
        />
      ))}
      <text x="21" y="22" textAnchor="middle" className="fill-ink" style={{ fontSize: 7, fontWeight: 700 }}>
        {pct(probs[pred])}
      </text>
      <text x="21" y="27.5" textAnchor="middle" className="fill-ink-soft" style={{ fontSize: 3.2 }}>
        {pred}
      </text>
    </svg>
  );
}

function ScoreBars({ probs }: { probs: Record<Outcome, number> }) {
  const on = usePlayed();
  return (
    <div className="w-full space-y-3">
      {ORDER.map((cls) => (
        <div key={cls}>
          <div className="flex justify-between text-sm">
            <span>{cls}</span>
            <span className="font-semibold">{pct(probs[cls])}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-line">
            <div
              className={`h-2 rounded-full transition-[width] duration-700 motion-reduce:transition-none ${OUTCOME_META[cls].bg}`}
              style={{ width: on ? `${probs[cls] * 100}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FactorChart({ exp }: { exp: Explanation }) {
  const scale = Math.max(...exp.top_factors.map((f) => Math.abs(f.effect)), 1e-9);
  const points = (e: number) => `${e > 0 ? "+" : ""}${(e * 100).toFixed(1)}`;
  return (
    <div>
      {exp.top_factors.map((f) => {
        const up = f.effect > 0;
        const w = (Math.abs(f.effect) / scale) * 50;
        return (
          <div key={f.feature} className="py-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">
                {labelFor(f.feature)}
                {TAGS[f.feature] && (
                  <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] font-normal text-ink-soft">
                    {TAGS[f.feature]}
                  </span>
                )}
              </span>
              <span className={`shrink-0 font-semibold ${up ? "text-risk" : "text-good"}`}>
                {up ? "▲" : "▼"} {points(f.effect)} pts
              </span>
            </div>
            <div className="relative my-2 h-2.5 rounded-full bg-line/60">
              <div className="absolute inset-y-[-3px] left-1/2 w-px bg-ink-soft/60" />
              <div
                className={`absolute inset-y-0 rounded-full ${up ? "bg-risk" : "bg-good"}`}
                style={up ? { left: "50%", width: `${w}%` } : { left: `${50 - w}%`, width: `${w}%` }}
              />
            </div>
            <p className="text-xs text-ink-soft">
              {formatValue(f.feature, f.value)} · typical student: {formatValue(f.feature, f.typical_value)}
            </p>
          </div>
        );
      })}
      <p className="pt-2 text-xs text-ink-soft">
        All other features combined: {points(exp.other_features_effect)} pts
      </p>
    </div>
  );
}

type Props = { result: PredictionResponse; cautions: string[]; onEdit: () => void; onReset: () => void };

export function ResultView({ result, cautions, onEdit, onReset }: Props) {
  const { prediction: pred, probabilities: probs, explanation: exp } = result;
  const meta = OUTCOME_META[pred];
  const top = probs[pred];
  const confidence = top >= 0.7 ? "High score" : top >= 0.5 ? "Moderate score" : "Low score: mixed signals";

  useEffect(() => {
  window.scrollTo(0, 0);
}, []);

  const summary =
    (top >= 0.5
      ? `The model gives this student a ${pct(top)} score for ${pred}, the highest of the three outcomes.`
      : `The model gives this student a ${pct(top)} score for ${pred}, but no outcome stands out, so the model is unsure.`) +
    ` Their first-semester record looks most like students who ${meta.phrase}. This is an estimate learned from past students, not a fact about this individual.`;

  const reasons = (exp?.top_factors ?? []).filter((f) => !(f.feature in TAGS)).slice(0, 3);
  const steps = top < 0.5
    ? [...meta.steps, "Because no outcome stands out, rely more on what you know about the student."]
    : meta.steps;

  return (
    <section>
      <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">Result</p>
      <h1 className={`mt-1 font-display text-4xl font-semibold sm:text-5xl ${meta.text}`}>{pred}</h1>
      <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium text-white ${meta.bg}`}>
        {confidence}
      </span>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">{summary}</p>

      {cautions.map((c) => (
        <p key={c} className="mt-4 max-w-2xl rounded-lg border border-watch/40 bg-watch/10 px-3 py-2 text-sm text-watch">
          {c}
        </p>
      ))}

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col items-center gap-6 rounded-xl border border-line bg-white p-6 lg:col-span-2">
          <Ring probs={probs} pred={pred} />
          <ScoreBars probs={probs} />
          <p className="text-xs text-ink-soft">
            Model scores that add up to 100%. They are not verified probabilities of real outcomes.
          </p>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {reasons.length > 0 && (
            <div className="rounded-xl border border-line bg-white p-6">
              <h2 className="font-display text-xl font-semibold">What this means</h2>
              <p className="mt-1 text-sm text-ink-soft">The main reasons behind the Dropout score:</p>
              <ul className="mt-3 space-y-2 text-sm">
                {reasons.map((f) => (
                  <li key={f.feature}>
                    <b>{labelFor(f.feature)}</b>: {formatValue(f.feature, f.value)} (typical student:{" "}
                    {formatValue(f.feature, f.typical_value)}) {f.effect > 0 ? "raised" : "lowered"} the Dropout
                    score by {Math.abs(f.effect * 100).toFixed(1)} points.
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-line bg-white p-6">
            <h2 className="font-display text-xl font-semibold">What to do next</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {exp && (
        <div className="mt-6 rounded-xl border border-line bg-white p-6">
          <h2 className="font-display text-xl font-semibold">Why this score?</h2>
          <p className="mt-1 text-sm text-ink-soft">
            The Dropout score is {pct(exp.student_score)} for this student, compared with{" "}
            {pct(exp.typical_student_score)} for a typical student. Red bars (▲) pushed it up and green bars (▼)
            pushed it down. One point (pt) is one percentage point.
          </p>
          <FactorChart exp={exp} />
          <p className="mt-2 text-xs text-ink-soft">
            {exp.note} The explanation is always about the Dropout score, whichever outcome was predicted.
          </p>
        </div>
      )}

      <p className="mt-6 text-sm text-ink-soft">{result.disclaimer}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-line px-5 py-2.5 font-medium text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Edit details
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Estimate another student
        </button>
      </div>
    </section>
  );
}