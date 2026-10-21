export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export type Health = { status: string; model_loaded: boolean };

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}