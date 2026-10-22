import { useState } from "react";
import { ResultView } from "../components/ResultView";
import { NumberField, SelectField, ToggleField } from "../components/fields";
import { Stepper } from "../components/Stepper";
import {
  APPLICATION_MODE, COURSE, FATHER_OCCUPATION, FATHER_QUALIFICATION, GENDER,
  MARITAL_STATUS, MOTHER_OCCUPATION, MOTHER_QUALIFICATION, NATIONALITY,
  PREVIOUS_QUALIFICATION,
} from "../data/codes";
import type { Option } from "../data/codes";
import { ApiError, predict } from "../lib/api";
import type { PredictionResponse } from "../lib/api";
import { DEFAULTS, PRESETS, STEP_FIELDS, STEP_INTRO, STEP_NAMES, validate } from "../lib/form";
import type { Errors, StudentPayload } from "../lib/form";

type Key = keyof StudentPayload;
const ATTENDANCE: Option[] = [{ code: 1, label: "Daytime" }, { code: 0, label: "Evening" }];
const btnPrimary =
  "rounded-full bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-dark disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const btnSecondary =
  "rounded-full border border-line px-5 py-2.5 font-medium text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function Estimate() {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<StudentPayload>(DEFAULTS);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const last = step === STEP_NAMES.length - 1;
  const set = <K extends Key>(key: K, value: number) => setV((prev) => ({ ...prev, [key]: value }));

  const num = (key: Key, label: string, o: { min?: number; max?: number; step?: number; help?: string } = {}) => (
    <NumberField id={key} label={label} value={v[key]} onChange={(n) => set(key, n)} error={errors[key]} {...o} />
  );
  const sel = (key: Key, label: string, options: Option[], help?: string) => (
    <SelectField id={key} label={label} options={options} value={v[key]} onChange={(n) => set(key, n)} help={help} />
  );
  const tog = (key: Key, label: string, help?: string) => (
    <ToggleField label={label} help={help} checked={v[key] === 1} onChange={(c) => set(key, c ? 1 : 0)} />
  );

  const cautions: string[] = [];
  if (v.sem1_approved > v.sem1_enrolled)
    cautions.push("Units approved is higher than units enrolled. Please double-check these values.");
  if ((v.sem1_approved === 0) !== (v.sem1_grade === 0))
    cautions.push(
      "In the training data, an average grade of 0 always went with zero approved units, and any approved unit came with a non-zero grade. This combination is unusual, so treat the result with extra caution.",
    );

  function applyPreset(name: string) {
    setV({ ...DEFAULTS, ...PRESETS[name] });
    setErrors({});
    setResult(null);
    setFailure(null);
  }

  function next() {
    const e = validate(v, STEP_FIELDS[step]);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(step + 1);
  }

  async function submit() {
    const e = validate(v);
    setErrors(e);
    const bad = Object.keys(e)[0] as Key | undefined;
    if (bad) {
      setStep(STEP_FIELDS.findIndex((fields) => fields.includes(bad)));
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
              "Couldn't reach the prediction service. If it was idle it may still be waking up: wait a minute and try again.",
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
        cautions={cautions}
        onEdit={() => setResult(null)}
        onReset={() => {
          setV(DEFAULTS);
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
        Enter a student's first-semester details to see whether they are likely to drop out,
        still be enrolled, or graduate, and why.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-soft">Try an example:</span>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => applyPreset(name)}
            className="rounded-full border border-line px-3 py-1 hover:border-accent hover:text-accent"
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
                {num("age_at_enrollment", "Age at enrollment", { min: 16, max: 100 })}
                {sel("marital_status", "Marital status", MARITAL_STATUS)}
                {sel("gender", "Gender", GENDER, "As recorded in the dataset (male or female only). Gender can raise fairness concerns; see About.")}
                {sel("daytime_attendance", "Attendance", ATTENDANCE)}
                {tog("displaced", "Displaced", "Recorded as displaced in the dataset.")}
                {tog("international", "International student")}
                {tog("educational_special_needs", "Special educational needs")}
              </>
            )}
            {step === 1 && (
              <>
                {tog("debtor", "Debtor")}
                {tog("tuition_fees_up_to_date", "Tuition fees up to date")}
                {tog("scholarship_holder", "Scholarship holder")}
              </>
            )}
            {step === 2 && (
              <>
                {num("sem1_enrolled", "Units enrolled", { min: 0, max: 60, help: "Subjects the student signed up for." })}
                {num("sem1_approved", "Units approved", { min: 0, max: 60, help: "Subjects the student passed." })}
                {num("sem1_evaluations", "Evaluations taken", { min: 0, max: 100, help: "Exams and assessments taken." })}
                {num("sem1_credited", "Units credited", { min: 0, max: 60 })}
                {num("sem1_without_evaluations", "Units without evaluations", { min: 0, max: 60 })}
                {num("sem1_grade", "Average grade (0-20)", { min: 0, max: 20, step: 0.1, help: "0 means no unit was passed." })}
              </>
            )}
            {step === 3 && (
              <>
                {sel("course", "Course", COURSE)}
                {sel("application_mode", "Application mode", APPLICATION_MODE, "How the student applied.")}
                {num("application_order", "Application order", { min: 0, max: 9, help: "0 = first choice, 9 = last choice." })}
                {sel("previous_qualification", "Previous qualification", PREVIOUS_QUALIFICATION)}
                {num("previous_qualification_grade", "Previous qualification grade (0-200)", { min: 0, max: 200, step: 0.1 })}
                {num("admission_grade", "Admission grade (0-200)", { min: 0, max: 200, step: 0.1 })}
                {sel("nationality", "Nationality", NATIONALITY)}
                {sel("mothers_qualification", "Mother's qualification", MOTHER_QUALIFICATION)}
                {sel("fathers_qualification", "Father's qualification", FATHER_QUALIFICATION)}
                {sel("mothers_occupation", "Mother's occupation", MOTHER_OCCUPATION)}
                {sel("fathers_occupation", "Father's occupation", FATHER_OCCUPATION)}
                {num("inflation_rate", "Inflation rate (%)", { step: 0.1 })}
                {num("unemployment_rate", "Unemployment rate (%)", { step: 0.1 })}
                {num("gdp", "GDP", { step: 0.01, help: "Economic indicators as recorded in the dataset." })}
              </>
            )}
          </div>

          {step === 2 &&
            cautions.map((c) => (
              <p key={c} className="mt-4 rounded-lg border border-watch/40 bg-watch/10 px-3 py-2 text-sm text-watch">
                {c}
              </p>
            ))}

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