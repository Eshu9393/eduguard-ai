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

type Key = keyof StudentPayload;
export type Errors = Partial<Record<Key, string>>;

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

export const PRESETS: Record<string, Partial<StudentPayload>> = {
  "Strong first semester": { sem1_enrolled: 6, sem1_evaluations: 7, sem1_approved: 6, sem1_grade: 14.5 },
  "Mixed first semester": { sem1_enrolled: 6, sem1_evaluations: 6, sem1_approved: 3, sem1_grade: 11 },
  "No units passed": { sem1_enrolled: 6, sem1_evaluations: 4, sem1_approved: 0, sem1_grade: 0 },
};

export const STEP_NAMES = ["Student", "Finances", "First semester", "Background"];
export const STEP_INTRO = [
  "Basic details about the student.",
  "Yes/No answers about the student's account with the institution.",
  "A curricular unit is one course subject. Counts are for the first semester.",
  "Optional. Pre-filled with typical values: change them if you know the student's details. The Code guide explains every option.",
];
export const STEP_FIELDS: Key[][] = [
  ["age_at_enrollment"],
  [],
  ["sem1_enrolled", "sem1_approved", "sem1_evaluations", "sem1_credited",
   "sem1_without_evaluations", "sem1_grade"],
  ["application_order", "previous_qualification_grade", "admission_grade",
   "inflation_rate", "unemployment_rate", "gdp"],
];

// [min, max, label]: these mirror the limits the API enforces.
const LIMITS: Partial<Record<Key, [number, number, string]>> = {
  age_at_enrollment: [16, 100, "Age"],
  application_order: [0, 9, "Application order"],
  previous_qualification_grade: [0, 200, "Previous qualification grade"],
  admission_grade: [0, 200, "Admission grade"],
  sem1_credited: [0, 60, "Units credited"],
  sem1_enrolled: [0, 60, "Units enrolled"],
  sem1_evaluations: [0, 100, "Evaluations taken"],
  sem1_approved: [0, 60, "Units approved"],
  sem1_grade: [0, 20, "Average grade"],
  sem1_without_evaluations: [0, 60, "Units without evaluations"],
  inflation_rate: [-5, 20, "Inflation rate"],
  unemployment_rate: [0, 30, "Unemployment rate"],
  gdp: [-10, 10, "GDP"],
};
const WHOLE = new Set<Key>([
  "age_at_enrollment", "application_order", "sem1_credited", "sem1_enrolled",
  "sem1_evaluations", "sem1_approved", "sem1_without_evaluations",
]);

export function validate(v: StudentPayload, only?: Key[]): Errors {
  const errors: Errors = {};
  for (const [key, [min, max, name]] of Object.entries(LIMITS) as [Key, [number, number, string]][]) {
    if (only && !only.includes(key)) continue;
    const value = v[key];
    if (Number.isNaN(value)) errors[key] = `${name} is required.`;
    else if (value < min || value > max) errors[key] = `${name} must be between ${min} and ${max}.`;
    else if (WHOLE.has(key) && !Number.isInteger(value)) errors[key] = `${name} must be a whole number.`;
  }
  return errors;
}