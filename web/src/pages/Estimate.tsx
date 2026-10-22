import { useState } from "react";
import { ResultView } from "../components/ResultView";
import { NumberField, SelectField, YesNoField } from "../components/fields";
import { Stepper } from "../components/Stepper";
import {
  APPLICATION_MODE, COURSE, FATHER_OCCUPATION, FATHER_QUALIFICATION, GENDER,
  MARITAL_STATUS, MOTHER_OCCUPATION, MOTHER_QUALIFICATION, NATIONALITY,
  PREVIOUS_QUALIFICATION,
} from "../data/codes";
import type { Option } from "../data/codes";
import { ApiError, predict } from "../lib/api";
import type { PredictionResponse } from "../lib/api";
import {
  BACKGROUND_KEYS, DEFAULTS, INITIAL, PRESETS, STEP_FIELDS, STEP_INTRO, STEP_NAMES, validate,
} from "../lib/form";
import type { Errors, Key, StudentPayload } from "../lib/form";

const ATTENDANCE: Option[] = [{ code: 1, label: "Daytime" }, { code: 0, label: "Evening" }];

const btnPrimary =
  "rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-dark disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const btnSecondary =
  "rounded-full border border-line px-5 py-2.5 font-medium text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type NumberOpts = {
  min?: number; max?: number; step?: number; help?: string;
  placeholder?: string; unit?: string; optional?: boolean;
};

const yesNo = (n: number) => (n === 1 ? "Yes" : "No");
const labelOf = (opts: Option[], code: number) => opts.find((o) => o.code === code)?.label ?? "Not set";
const isBackgroundUntouched = (v: StudentPayload) => BACKGROUND_KEYS.every((k) => v[k] === DEFAULTS[k]);

function buildReview(v: StudentPayload) {
  return [
    {
      title: "Student", step: 0,
      rows: [
        ["Age", `${v.age_at_enrollment} years`],
        ["Marital status", labelOf(MARITAL_STATUS, v.marital_status)],
        ["Gender", labelOf(GENDER, v.gender)],
        ["Attendance", labelOf(ATTENDANCE, v.daytime_attendance)],
        ["Displaced", yesNo(v.displaced)],
        ["International student", yesNo(v.international)],
        ["Special educational needs", yesNo(v.educational_special_needs)],
      ],
    },
    {
      title: "Finances", step: 1,
      rows: [
        ["Marked as a debtor", yesNo(v.debtor)],
        ["Tuition fees up to date", yesNo(v.tuition_fees_up_to_date)],
        ["Scholarship", yesNo(v.scholarship_holder)],
      ],
    },
    {
      title: "First semester", step: 2,
      rows: [
        ["Subjects signed up for", String(v.sem1_enrolled)],
        ["Subjects passed", String(v.sem1_approved)],
        ["Exams or assessments taken", String(v.sem1_evaluations)],
        ["Credited units", String(v.sem1_credited)],
        ["Subjects without an exam", String(v.sem1_without_evaluations)],
        ["Average grade", `${v.sem1_grade} out of 20`],
      ],
    },
    {
      title: "Background", step: 3,
      rows: [["Course, parents, grades, economic figures", isBackgroundUntouched(v) ? "Sample values" : "Your answers"]],
    },
  ];
}

function focusField(key: string) {
  setTimeout(() => {
    const el = document.getElementById(key) ?? document.querySelector<HTMLElement>(`input[name="${key}"]`);
    el?.focus();
  }, 0);
}

export default function Estimate() {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<StudentPayload>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const last = step === STEP_NAMES.length - 1;

  const set = (key: Key, value: number) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const num = (key: Key, label: string, o: NumberOpts = {}) => (
    <NumberField id={key} label={label} value={v[key]} onChange={(n) => set(key, n)} error={errors[key]} {...o} />
  );
  const sel = (key: Key, label: string, options: Option[], help?: string, optional?: boolean) => (
    <SelectField id={key} label={label} options={options} value={v[key]} onChange={(n) => set(key, n)}
                 error={errors[key]} help={help} optional={optional} />
  );
  const yn = (key: Key, label: string, help?: string) => (
    <YesNoField id={key} label={label} value={v[key]} onChange={(n) => set(key, n)} error={errors[key]} help={help} />
  );

  const cautions: string[] = [];
  if (v.sem1_approved > v.sem1_enrolled)
    cautions.push("Subjects passed is higher than subjects signed up for. Please double-check these numbers.");
  if (!Number.isNaN(v.sem1_approved) && !Number.isNaN(v.sem1_grade) && (v.sem1_approved === 0) !== (v.sem1_grade === 0))
    cautions.push(
      "In the training data, an average grade of 0 always went with zero subjects passed, and any passed subject came with a non-zero grade. This combination is unusual, so treat the result with extra caution.",
    );

  const assumptions = isBackgroundUntouched(v)
    ? ["Background details (course, parents, grades, economic figures) were left at sample values, and the estimate uses them."]
    : [];

  function applyPreset(name: string) {
    setV({ ...DEFAULTS, ...PRESETS[name] });
    setErrors({});
    setResult(null);
    setFailure(null);
    setStep(STEP_NAMES.length - 1);
  }

  function next() {
    const e = validate(v, STEP_FIELDS[step]);
    setErrors(e);
    const bad = Object.keys(e)[0];
    if (bad) {
      focusField(bad);
      return;
    }
    setStep(step + 1);
  }

  async function submit() {
    const e = validate(v);
    setErrors(e);
    const bad = Object.keys(e)[0] as Key | undefined;
    if (bad) {
      setStep(STEP_FIELDS.findIndex((fields) => fields.includes(bad)));
      focusField(bad);
      return;
    }
    setLoading(true);
    setFailure(null);
    try {
      setResult(await predict(v));
    } catch (x) {
      setFailure(
        x instanceof ApiError
          ? x
          : new ApiError(
              "Couldn't reach the prediction service. If it was idle it may still be waking up. Wait a minute and try again.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <ResultView
        result={result}
        values={v}
        cautions={[...cautions, ...assumptions]}
        onEdit={() => {
          setResult(null);
          setStep(STEP_NAMES.length - 1);
        }}
        onReset={() => {
          setV(INITIAL);
          setStep(0);
          setErrors({});
          setResult(null);
          setFailure(null);
        }}
      />
    );
  }

  return (
    <section className="max-w-2xl">
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
        Spot the students who need support, sooner.
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        Answer a few questions about a student. We'll estimate whether they are likely to drop out,
        stay enrolled, or graduate.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-soft">Or try an example student:</span>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => applyPreset(name)}
            className="rounded-full border border-line px-3 py-1 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-10">
        <Stepper steps={STEP_NAMES} current={step} />
        <h2 className="font-display text-2xl font-semibold">{STEP_NAMES[step]}</h2>
        <p className="mt-1 mb-5 text-sm text-ink-soft">{STEP_INTRO[step]}</p>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (last) void submit();
            else next();
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {step === 0 && (
              <>
                {num("age_at_enrollment", "How old is the student?", {
                  min: 16, max: 100, placeholder: "e.g., 19", unit: "years",
                  help: "Age in years when they enrolled.",
                })}
                {sel("marital_status", "What is their marital status?", MARITAL_STATUS)}
                {sel("gender", "What is their gender?", GENDER,
                  "The dataset records male or female only. See About for why this matters.")}
                {sel("daytime_attendance", "Do they attend daytime or evening classes?", ATTENDANCE)}
                {yn("displaced", "Is the student displaced?", "As recorded in the dataset.")}
                {yn("international", "Is the student an international student?")}
                {yn("educational_special_needs", "Does the student have special educational needs?")}
              </>
            )}
            {step === 1 && (
              <>
                {yn("debtor", "Is the student marked as a debtor?", "Choose Yes if the institution lists them as owing money.")}
                {yn("tuition_fees_up_to_date", "Are their tuition fees paid up to date?")}
                {yn("scholarship_holder", "Does the student have a scholarship?")}
              </>
            )}
            {step === 2 && (
              <>
                {num("sem1_enrolled", "How many subjects did they sign up for?", {
                  min: 0, max: 60, placeholder: "e.g., 6", unit: "subjects", help: "First semester.",
                })}
                {num("sem1_approved", "How many subjects did they pass?", {
                  min: 0, max: 60, placeholder: "e.g., 5", unit: "subjects",
                })}
                {num("sem1_evaluations", "How many exams or assessments did they take?", {
                  min: 0, max: 100, placeholder: "e.g., 8", help: "Add up all exams across their subjects.",
                })}
                {num("sem1_grade", "What is their average grade?", {
                  min: 0, max: 20, step: 0.1, placeholder: "e.g., 12.5", unit: "out of 20",
                  help: "Enter 0 if they passed no subjects.",
                })}
                {num("sem1_credited", "How many credited units?", {
                  min: 0, max: 60, placeholder: "e.g., 0", optional: true,
                  help: "As recorded for the first semester. Leave 0 if none or unsure.",
                })}
                {num("sem1_without_evaluations", "How many subjects had no exam recorded?", {
                  min: 0, max: 60, placeholder: "e.g., 0", optional: true,
                  help: "Leave 0 if none or unsure.",
                })}
              </>
            )}
            {step === 3 && (
              <>
                {sel("course", "Which course are they in?", COURSE)}
                {sel("application_mode", "How did they apply?", APPLICATION_MODE)}
                {num("application_order", "Which choice was this course on their application?", {
                  min: 0, max: 9, placeholder: "e.g., 1", help: "0 = first choice, 9 = last choice.",
                })}
                {sel("previous_qualification", "What was their previous qualification?", PREVIOUS_QUALIFICATION)}
                {num("previous_qualification_grade", "Grade of their previous qualification", {
                  min: 0, max: 200, step: 0.1, placeholder: "e.g., 130", unit: "out of 200",
                })}
                {num("admission_grade", "Admission grade", {
                  min: 0, max: 200, step: 0.1, placeholder: "e.g., 125", unit: "out of 200",
                })}
                {sel("nationality", "What is their nationality?", NATIONALITY)}
                {sel("mothers_qualification", "Mother's education", MOTHER_QUALIFICATION)}
                {sel("fathers_qualification", "Father's education", FATHER_QUALIFICATION)}
                {sel("mothers_occupation", "Mother's occupation", MOTHER_OCCUPATION)}
                {sel("fathers_occupation", "Father's occupation", FATHER_OCCUPATION)}
                {num("inflation_rate", "Inflation rate", {
                  step: 0.1, placeholder: "e.g., 1.4", unit: "%", help: "Country-level figure. Leave as is if unsure.",
                })}
                {num("unemployment_rate", "Unemployment rate", {
                  step: 0.1, placeholder: "e.g., 11.1", unit: "%", help: "Country-level figure. Leave as is if unsure.",
                })}
                {num("gdp", "GDP", {
                  step: 0.01, placeholder: "e.g., 0.32", help: "Economic figure from the dataset. Leave as is if unsure.",
                })}
              </>
            )}
          </div>

          {step === 2 &&
            cautions.map((c) => (
              <p key={c} className="mt-4 rounded-lg border border-watch/40 bg-watch/10 px-3 py-2 text-sm text-watch">
                {c}
              </p>
            ))}

          {last && (
            <div className="space-y-4">
              {buildReview(v).map((s) => (
                <div key={s.title} className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{s.title}</h3>
                    <button
                      type="button"
                      onClick={() => setStep(s.step)}
                      className="text-sm font-medium text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="mt-3 grid gap-x-6 sm:grid-cols-2">
                    {s.rows.map(([k, val]) => (
                      <div key={k} className="flex justify-between gap-3 border-b border-line/60 py-1.5 text-sm">
                        <dt className="text-ink-soft">{k}</dt>
                        <dd className="text-right font-medium">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <p className="text-sm text-ink-soft">
                Your answers go to the prediction service to produce this estimate. The app doesn't save
                them. It usually takes a few seconds, and the first estimate after a quiet period can take longer.
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            {step > 0 && (
              <button type="button" className={btnSecondary} onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            <button type="submit" className={btnPrimary} disabled={loading}>
              {last ? (loading ? "Estimating…" : "Estimate student outcome") : "Next"}
            </button>
          </div>
        </form>

        {failure && (
          <div className="mt-6 rounded-lg border border-risk/40 bg-risk/10 p-4 text-sm text-risk" role="alert">
            <p className="font-medium">{failure.message}</p>
            {failure.details.map((d) => (
              <p key={d}>{d}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}