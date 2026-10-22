import { useEffect, useMemo, useState } from "react";
import type { Explanation, Factor, Outcome, PredictionResponse } from "../lib/api";
import type { StudentPayload } from "../lib/form";
import { ORDER, OUTCOME_META, TAGS, formatValue, isChangeable, labelFor } from "../lib/explain";
import { buildActions } from "../lib/recommend";
import { ActionPlan } from "./ActionPlan";

const pct = (p: number) => `${Math.round(p * 100)}%`;
const points = (e: number) => `${e > 0 ? "+" : ""}${(e * 100).toFixed(1)}`;

function usePlayed() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

function Tag({ children }: { children: string }) {
  return (
    <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] font-normal text-ink-soft">
      {children}
    </span>
  );
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

function FactorList({ title, tone, factors, empty }: {
  title: string; tone: "good" | "risk"; factors: Factor[]; empty: string;
}) {
  return (
    <div>
      <h3 className={`text-sm font-semibold ${tone === "good" ? "text-good" : "text-risk"}`}>{title}</h3>
      {factors.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm">
          {factors.map((f) => (
            <li key={f.feature}>
              <b>{labelFor(f.feature)}</b>: {formatValue(f.feature, f.value)}
              <span className="text-ink-soft"> (typical: {formatValue(f.feature, f.typical_value)})</span>
              {isChangeable(f.feature) && <Tag>can change</Tag>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FactorChart({ exp }: { exp: Explanation }) {
  const scale = Math.max(...exp.top_factors.map((f) => Math.abs(f.effect)), 1e-9);
  return (
    <div>
      {exp.top_factors.map((f) => {
        const up = f.effect > 0;
        const w = (Math.abs(f.effect) / scale) * 50;
        const tag = TAGS[f.feature] ?? (isChangeable(f.feature) ? "can change" : "fixed");
        return (
          <div key={f.feature} className="py-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">
                {labelFor(f.feature)}
                <Tag>{tag}</Tag>
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

type Props = {
  result: PredictionResponse;
  values: StudentPayload;
  cautions: string[];
  onEdit: () => void;
  onReset: () => void;
};

export function ResultView({ result, values, cautions, onEdit, onReset }: Props) {
  const { prediction: pred, probabilities: probs, explanation: exp } = result;
  const meta = OUTCOME_META[pred];
  const top = probs[pred];
  const confidence = top >= 0.7 ? "High score" : top >= 0.5 ? "Moderate score" : "Low score: mixed signals";
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const actions = useMemo(() => buildActions(result, values), [result, values]);
  const usable = (exp?.top_factors ?? []).filter((f) => !(f.feature in TAGS));
  const concerns = usable.filter((f) => f.effect > 0).slice(0, 3);
  const favours = usable.filter((f) => f.effect < 0).slice(0, 3);

  const summary =
    top >= 0.5
      ? `This student's record looks most like students who ${meta.phrase}. The model's score for ${pred} is ${pct(top)}. It's an estimate, not a fact about this student.`
      : `No outcome stands out, so the model is unsure. ${pred} scores highest at ${pct(top)}. Rely more on what you know about the student.`;

  const limits = [
    "This is an estimate. It is not a verdict.",
    "Scores are not verified probabilities.",
    ...(top < 0.5 ? ["The scores are close together, so the model is unsure."] : []),
    ...(pred === "Enrolled" ? ["\"Enrolled\" is the hardest outcome for the model."] : []),
    "It uses first-semester data only.",
    "It learned from one institution in Portugal. It may not fit yours.",
    "The data doesn't say when fee and debtor status were recorded. They may carry hints about the outcome itself.",
    "Combine it with your own judgment. Ask a colleague or specialist before any decision about a student.",
  ];

  async function copySummary() {
    const lines = [
      "EduGuard AI estimate",
      `Most likely outcome: ${pred} (${pct(top)})`,
      `Scores: ${ORDER.map((c) => `${c} ${pct(probs[c])}`).join(", ")}`,
      ...(concerns.length ? ["Points of concern:", ...concerns.map((f) => `- ${labelFor(f.feature)}: ${formatValue(f.feature, f.value)}`)] : []),
      ...(favours.length ? ["In the student's favour:", ...favours.map((f) => `- ${labelFor(f.feature)}: ${formatValue(f.feature, f.value)}`)] : []),
      "Suggested actions:",
      ...actions.filter((a) => a.group === "first").map((a) => `- ${a.action}`),
      "This is a statistical estimate, not a verdict about the student.",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyState("done");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  }

  const btn =
    "rounded-full border border-line px-5 py-2.5 font-medium text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <section>
      <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">Result</p>
      <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Here's what we found.</h1>

      <div className="mt-6 rounded-xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`font-display text-4xl font-semibold sm:text-5xl ${meta.text}`}>{pred}</span>
          <span className={`rounded-full px-3 py-1 text-sm font-medium text-white ${meta.bg}`}>{confidence}</span>
        </div>
        <p className="mt-3 max-w-2xl text-ink-soft">{summary}</p>
      </div>

      {cautions.map((c) => (
        <p key={c} className="mt-4 max-w-2xl rounded-lg border border-watch/40 bg-watch/10 px-3 py-2 text-sm text-watch">
          {c}
        </p>
      ))}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col items-center gap-6 rounded-xl border border-line bg-white p-6 lg:col-span-2">
          <Ring probs={probs} pred={pred} />
          <ScoreBars probs={probs} />
          <p className="text-xs text-ink-soft">Scores add up to 100%. They are not verified probabilities.</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-6 lg:col-span-3">
          <h2 className="font-display text-xl font-semibold">What stands out</h2>
          <p className="mt-1 text-sm text-ink-soft">
            These inputs moved the Dropout score the most. They show patterns in past data, not causes.
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <FactorList title="Points in the student's favour" tone="good" factors={favours}
                        empty="Nothing stands out here." />
            <FactorList title="Points of concern" tone="risk" factors={concerns}
                        empty="Nothing stands out here." />
          </div>
          {exp && (
            <details className="mt-6 border-t border-line pt-4">
              <summary className="cursor-pointer text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                See the full breakdown
              </summary>
              <p className="mt-3 text-sm text-ink-soft">
                The Dropout score is {pct(exp.student_score)} for this student and {pct(exp.typical_student_score)} for
                a typical student. Red bars (▲) push it up. Green bars (▼) push it down. One point (pt) is one
                percentage point. Tags show what an advisor can change.
              </p>
              <FactorChart exp={exp} />
              <p className="mt-2 text-xs text-ink-soft">
                {exp.note} The breakdown always explains the Dropout score, whichever outcome was predicted.
              </p>
            </details>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="font-display text-xl font-semibold">Your action plan</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Suggestions based on this student's record. Tick them off as you go.
        </p>
        <div className="mt-4">
          <ActionPlan actions={actions} />
        </div>
      </div>

      <details className="mt-6 rounded-xl border border-line bg-white p-6">
        <summary className="cursor-pointer font-display text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          What this result can't tell you
        </summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-soft">
          {limits.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>

      <p className="mt-6 text-sm text-ink-soft">{result.disclaimer}</p>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={onEdit} className={btn}>Edit details</button>
        <button type="button" onClick={() => void copySummary()} className={btn}>
          {copyState === "done" ? "Copied" : copyState === "failed" ? "Couldn't copy" : "Copy summary"}
        </button>
        <button type="button" onClick={() => window.print()} className={btn}>Print or save as PDF</button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          New student
        </button>
      </div>
    </section>
  );
}