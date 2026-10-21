import { useMemo, useState } from "react";
import {
  APPLICATION_MODE, COURSE, FATHER_OCCUPATION, FATHER_QUALIFICATION, MARITAL_STATUS,
  MOTHER_OCCUPATION, MOTHER_QUALIFICATION, NATIONALITY, PREVIOUS_QUALIFICATION,
} from "../data/codes";
import type { Option } from "../data/codes";
import { PageHeader } from "../components/PageHeader";

const motherCodes = new Set(MOTHER_QUALIFICATION.map((o) => o.code));

const TABLES: { title: string; rows: Option[] }[] = [
  { title: "Marital status", rows: MARITAL_STATUS },
  { title: "Application mode", rows: APPLICATION_MODE },
  { title: "Course", rows: COURSE },
  { title: "Previous qualification", rows: PREVIOUS_QUALIFICATION },
  { title: "Nationality", rows: NATIONALITY },
  { title: "Mother's and father's qualification", rows: MOTHER_QUALIFICATION },
  {
    title: "Father's qualification (extra codes)",
    rows: FATHER_QUALIFICATION.filter((o) => !motherCodes.has(o.code)),
  },
  { title: "Mother's occupation", rows: MOTHER_OCCUPATION },
  { title: "Father's occupation", rows: FATHER_OCCUPATION },
];

export default function CodeGuide() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      TABLES.map((t) => ({
        ...t,
        rows: q ? t.rows.filter((o) => o.label.toLowerCase().includes(q) || String(o.code) === q) : t.rows,
      })).filter((t) => t.rows.length > 0),
    [q],
  );

  return (
    <div>
      <PageHeader
        title="Code guide"
        intro="The dataset stores many answers as numbers. The form shows names, and this page lists every number and its meaning."
      />

      <div className="mb-8 grid max-w-3xl gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-medium">Simple fields</h2>
          <ul className="mt-2 space-y-1 text-ink-soft">
            <li>Yes/No fields use 1 = yes, 0 = no.</li>
            <li>Gender: 1 = male, 0 = female (as recorded in the dataset).</li>
            <li>Attendance: 1 = daytime, 0 = evening.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-medium">Scales</h2>
          <ul className="mt-2 space-y-1 text-ink-soft">
            <li>Application order: 0 = first choice, 9 = last choice.</li>
            <li>Admission and previous-qualification grades: 0 to 200.</li>
            <li>Semester average grades: 0 to 20. A curricular unit is one course subject.</li>
          </ul>
        </div>
      </div>

      <div className="mb-6 max-w-md">
        <label htmlFor="code-search" className="mb-1 block text-sm font-medium">
          Search all tables
        </label>
        <input
          id="code-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="A name or a code, e.g. nursing or 9500"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        />
      </div>

      {visible.length === 0 && <p className="text-ink-soft">Nothing matches "{query}".</p>}

      <div className="max-w-3xl space-y-3">
        {visible.map((t) => (
          <details key={t.title} open={q ? true : undefined} className="rounded-xl border border-line bg-white px-5 py-4">
            <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {t.title} <span className="font-normal text-ink-soft">({t.rows.length})</span>
            </summary>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="w-20 py-2 font-medium">Code</th>
                  <th className="py-2 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {t.rows.map((o) => (
                  <tr key={o.code} className="border-t border-line">
                    <td className="py-2 font-mono">{o.code}</td>
                    <td className="py-2">{o.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>

      <p className="mt-8 max-w-3xl text-xs text-ink-soft">
        Labels are copied from the{" "}
        <a
          className="underline underline-offset-2"
          href="https://archive.ics.uci.edu/dataset/697/predict+students+dropout+and+academic+success"
          target="_blank"
          rel="noopener noreferrer"
        >
          UCI dataset documentation
        </a>
        .
      </p>
    </div>
  );
}