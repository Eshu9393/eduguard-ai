export type StudentPayload = {
  gender: number; debtor: number; scholarship_holder: number; displaced: number;
  international: number; educational_special_needs: number; daytime_attendance: number;
  tuition_fees_up_to_date: number; marital_status: number; application_mode: number;
  course: number; previous_qualification: number; nationality: number;
  mothers_qualification: number; fathers_qualification: number;
  mothers_occupation: number; fathers_occupation: number; application_order: number;
  previous_qualification_grade: number; admission_grade: number;
  age_at_enrollment: number; inflation_rate: number; unemployment_rate: number;
  gdp: number; sem1_credited: number; sem1_enrolled: number; sem1_evaluations: number;
  sem1_approved: number; sem1_grade: number; sem1_without_evaluations: number;
};

export type Key = keyof StudentPayload;
export type Errors = Partial<Record<Key, string>>;

// A complete example student. Used only by the "example" buttons and as sample background values.
export const DEFAULTS: StudentPayload = {
  gender: 0, debtor: 0, scholarship_holder: 0, displaced: 1, international: 0,
  educational_special_needs: 0, daytime_attendance: 1, tuition_fees_up_to_date: 1,
  marital_status: 1, application_mode: 17, course: 9238, previous_qualification: 1,
  nationality: 1, mothers_qualification: 19, fathers_qualification: 19,
  mothers_occupation: 5, fathers_occupation: 5, application_order: 1,
  previous_qualification_grade: 130, admission_grade: 125, age_at_enrollment: 19,
  inflation_rate: 1.4, unemployment_rate: 11.1, gdp: 0.32, sem1_credited: 0,
  sem1_enrolled: 6, sem1_evaluations: 8, sem1_approved: 5, sem1_grade: 12.5,
  sem1_without_evaluations: 0,
};

export const BACKGROUND_KEYS: Key[] = [
  "course", "application_mode", "application_order", "previous_qualification",
  "previous_qualification_grade", "admission_grade", "nationality",
  "mothers_qualification", "fathers_qualification", "mothers_occupation",
  "fathers_occupation", "inflation_rate", "unemployment_rate", "gdp",
];

const blank = Object.fromEntries(
  (Object.keys(DEFAULTS) as Key[]).map((k) => [k, NaN]),
) as StudentPayload;

// Start empty for everything about the student. Background starts with sample values.
export const INITIAL: StudentPayload = {
  ...blank,
  ...(Object.fromEntries(BACKGROUND_KEYS.map((k) => [k, DEFAULTS[k]])) as Partial<StudentPayload>),
  sem1_credited: 0,
  sem1_without_evaluations: 0,
};

export const PRESETS: Record<string, Partial<StudentPayload>> = {
  "Strong first semester": { sem1_enrolled: 6, sem1_evaluations: 7, sem1_approved: 6, sem1_grade: 14.5 },
  "Mixed first semester": { sem1_enrolled: 6, sem1_evaluations: 6, sem1_approved: 3, sem1_grade: 11 },
  "No units passed": { sem1_enrolled: 6, sem1_evaluations: 4, sem1_approved: 0, sem1_grade: 0 },
};

export const STEP_NAMES = ["Student", "Finances", "First semester", "Background", "Review"];
export const STEP_INTRO = [
  "Tell us about the student. Every question is required unless marked optional.",
  "Choose Yes or No for each question.",
  "Use the student's first-semester results. A subject means one course unit.",
  "Optional. We've filled in sample values, not the student's real details. Change the ones you know.",
  "Check your answers, then get the estimate.",
];
export const STEP_FIELDS: Key[][] = [
  ["age_at_enrollment", "marital_status", "gender", "daytime_attendance",
   "displaced", "international", "educational_special_needs"],
  ["debtor", "tuition_fees_up_to_date", "scholarship_holder"],
  ["sem1_enrolled", "sem1_approved", "sem1_evaluations", "sem1_credited",
   "sem1_without_evaluations", "sem1_grade"],
  BACKGROUND_KEYS,
  [],
];

// [min, max]: these mirror the limits the API enforces.
const LIMITS: Partial<Record<Key, [number, number]>> = {
  age_at_enrollment: [16, 100],
  application_order: [0, 9],
  previous_qualification_grade: [0, 200],
  admission_grade: [0, 200],
  sem1_credited: [0, 60],
  sem1_enrolled: [0, 60],
  sem1_evaluations: [0, 100],
  sem1_approved: [0, 60],
  sem1_grade: [0, 20],
  sem1_without_evaluations: [0, 60],
  inflation_rate: [-5, 20],
  unemployment_rate: [0, 30],
  gdp: [-10, 10],
};
const WHOLE = new Set<Key>([
  "age_at_enrollment", "application_order", "sem1_credited", "sem1_enrolled",
  "sem1_evaluations", "sem1_approved", "sem1_without_evaluations",
]);

const NEED: Partial<Record<Key, string>> = {
  age_at_enrollment: "Enter the student's age to continue.",
  sem1_enrolled: "Enter how many subjects they signed up for.",
  sem1_approved: "Enter how many subjects they passed.",
  sem1_evaluations: "Enter how many exams or assessments they took.",
  sem1_credited: "Enter a number, or 0 if none.",
  sem1_without_evaluations: "Enter a number, or 0 if none.",
  sem1_grade: "Enter their average grade, or 0 if they passed no subjects.",
  application_order: "Enter a number from 0 to 9.",
  previous_qualification_grade: "Enter a grade from 0 to 200.",
  admission_grade: "Enter a grade from 0 to 200.",
  inflation_rate: "Enter a number, for example 1.4.",
  unemployment_rate: "Enter a number, for example 11.1.",
  gdp: "Enter a number, for example 0.32.",
};

export function validate(v: StudentPayload, only?: Key[]): Errors {
  const errors: Errors = {};
  for (const key of only ?? (Object.keys(v) as Key[])) {
    const value = v[key];
    if (Number.isNaN(value)) {
      errors[key] = NEED[key] ?? "Choose an answer to continue.";
      continue;
    }
    const limit = LIMITS[key];
    if (!limit) continue;
    const [min, max] = limit;
    if (value < min || value > max) errors[key] = `Enter a number between ${min} and ${max}.`;
    else if (WHOLE.has(key) && !Number.isInteger(value)) errors[key] = "Enter a whole number, like 5.";
  }
  return errors;
}