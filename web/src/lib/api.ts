import type { StudentPayload } from "./form";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export type Health = { status: string; model_loaded: boolean };

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

export type Outcome = "Dropout" | "Enrolled" | "Graduate";

export type Factor = { feature: string; value: number; typical_value: number; effect: number };

export type Explanation = {
  typical_student_score: number;
  student_score: number;
  top_factors: Factor[];
  other_features_effect: number;
  note: string;
};

export type PredictionResponse = {
  prediction: Outcome;
  probabilities: Record<Outcome, number>;
  explanation: Explanation | null;
  disclaimer: string;
};

export class ApiError extends Error {
  details: string[];
  constructor(message: string, details: string[] = []) {
    super(message);
    this.details = details;
  }
}

export async function predict(payload: StudentPayload): Promise<PredictionResponse> {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 422) {
    const body = (await res.json()) as { detail: { loc: (string | number)[]; msg: string }[] };
    throw new ApiError(
      "Some values were rejected by the service:",
      body.detail.map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`),
    );
  }
  if (!res.ok) throw new ApiError(`The service returned an error (${res.status}). Please try again.`);
  return res.json();
}