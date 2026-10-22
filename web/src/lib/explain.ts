import {
  APPLICATION_MODE, COURSE, FATHER_OCCUPATION, FATHER_QUALIFICATION, GENDER,
  MARITAL_STATUS, MOTHER_OCCUPATION, MOTHER_QUALIFICATION, NATIONALITY,
  PREVIOUS_QUALIFICATION,
} from "../data/codes";
import type { Option } from "../data/codes";
import type { Outcome } from "./api";

export const ORDER: Outcome[] = ["Dropout", "Enrolled", "Graduate"];

export const OUTCOME_META: Record<
  Outcome,
  { text: string; bg: string; cssVar: string; phrase: string; steps: string[] }
> = {
  Dropout: {
    text: "text-risk",
    bg: "bg-risk",
    cssVar: "var(--color-risk)",
    phrase: "left before finishing",
    steps: [
      "Reach out soon for a friendly, supportive conversation.",
      "Ask about academic difficulties, money worries, or personal circumstances.",
      "Point the student to tutoring, financial aid, or counselling services.",
      "Use the main reasons as conversation starters, not conclusions.",
    ],
  },
  Enrolled: {
    text: "text-watch",
    bg: "bg-watch",
    cssVar: "var(--color-watch)",
    phrase: "were still studying when the normal course duration ended",
    steps: [
      "Keep supporting the student and check progress at the next milestone.",
      "The model is least reliable for this group, so treat this outcome with extra caution.",
      "Watch the Dropout score in the chart below. If it is high, consider a check-in.",
    ],
  },
  Graduate: {
    text: "text-good",
    bg: "bg-good",
    cssVar: "var(--color-good)",
    phrase: "finished the course on time",
    steps: [
      "The model suggests no special action. Routine support is enough.",
      "The model can miss students who need help. If the student raises a concern, take it seriously.",
      "Re-check after the next semester's results, since the picture can change.",
    ],
  },
};

const lookup = (opts: Option[]) => new Map(opts.map((o) => [o.code, o.label]));

const VALUE_TABLES: Record<string, Map<number, string>> = {
  Course: lookup(COURSE),
  "Application mode": lookup(APPLICATION_MODE),
  "Marital status": lookup(MARITAL_STATUS),
  "Previous qualification": lookup(PREVIOUS_QUALIFICATION),
  Nacionality: lookup(NATIONALITY),
  "Mother's qualification": lookup(MOTHER_QUALIFICATION),
  "Father's qualification": lookup(FATHER_QUALIFICATION),
  "Mother's occupation": lookup(MOTHER_OCCUPATION),
  "Father's occupation": lookup(FATHER_OCCUPATION),
  Gender: lookup(GENDER),
};

const YES_NO = new Set([
  "Debtor", "Displaced", "Educational special needs", "International",
  "Scholarship holder", "Tuition fees up to date",
]);

const FEATURE_LABELS: Record<string, string> = {
  "Curricular units 1st sem (approved)": "Units approved",
  "Curricular units 1st sem (enrolled)": "Units enrolled",
  "Curricular units 1st sem (evaluations)": "Evaluations taken",
  "Curricular units 1st sem (credited)": "Units credited",
  "Curricular units 1st sem (grade)": "Average grade",
  "Curricular units 1st sem (without evaluations)": "Units without evaluations",
  "Previous qualification (grade)": "Previous qualification grade",
  "Daytime/evening attendance": "Attendance",
  Nacionality: "Nationality",
};

export const TAGS: Record<string, string> = {
  Gender: "sensitive attribute",
  "Inflation rate": "economic context",
  "Unemployment rate": "economic context",
  GDP: "economic context",
};

export const labelFor = (feature: string) => FEATURE_LABELS[feature] ?? feature;

export function formatValue(feature: string, v: number): string {
  if (YES_NO.has(feature)) return v ? "Yes" : "No";
  if (feature === "Daytime/evening attendance") return v ? "Daytime" : "Evening";
  const table = VALUE_TABLES[feature];
  if (table) {
    const text = table.get(Math.round(v)) ?? `code ${Math.round(v)}`;
    return text.length > 40 ? `${text.slice(0, 39)}…` : text;
  }
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
}

const CHANGEABLE = new Set([
  "Curricular units 1st sem (approved)",
  "Curricular units 1st sem (evaluations)",
  "Curricular units 1st sem (grade)",
  "Curricular units 1st sem (without evaluations)",
  "Tuition fees up to date",
  "Debtor",
  "Scholarship holder",
]);

export const isChangeable = (feature: string) => CHANGEABLE.has(feature);