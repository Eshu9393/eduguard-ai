import { useState } from "react";
import { GROUP_TITLES } from "../lib/recommend";
import type { Action, Group, Priority } from "../lib/recommend";

const GROUPS: Group[] = ["first", "next", "later"];

const PRIORITY_STYLE: Record<Priority, string> = {
  High: "border-risk/40 text-risk",
  Medium: "border-watch/40 text-watch",
  Low: "border-line text-ink-soft",
};

export function ActionPlan({ actions }: { actions: Action[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));
  const doneCount = actions.filter((a) => done[a.id]).length;
  const share = actions.length > 0 ? (doneCount / actions.length) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>
          {doneCount} of {actions.length} done
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-line">
        <div
          className="h-1.5 rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${share}%` }}
        />
      </div>

      {GROUPS.map((g) => {
        const items = actions.filter((a) => a.group === g);
        if (items.length === 0) return null;
        return (
          <div key={g} className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{GROUP_TITLES[g]}</h3>
            <ul className="mt-2 space-y-3">
              {items.map((a) => (
                <li key={a.id} className="rounded-lg border border-line p-3">
                  <div className="flex items-start gap-3">
                    <input
                      id={`done-${a.id}`}
                      type="checkbox"
                      checked={!!done[a.id]}
                      onChange={() => toggle(a.id)}
                      className="mt-1 h-4 w-4 accent-accent"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={`done-${a.id}`}
                          className={`font-medium ${done[a.id] ? "text-ink-soft line-through" : ""}`}
                        >
                          {a.action}
                        </label>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${PRIORITY_STYLE[a.priority]}`}>
                          {a.priority} priority
                        </span>
                      </div>
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                          Why and how
                        </summary>
                        <p className="mt-2">
                          <b>Why:</b> {a.why}
                        </p>
                        <p className="mt-2 font-medium">How:</p>
                        <ul className="list-disc space-y-1 pl-5">
                          {a.how.map((h) => (
                            <li key={h}>{h}</li>
                          ))}
                        </ul>
                        <p className="mt-2">
                          <b>Expected outcome:</b> {a.outcome}
                        </p>
                      </details>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}