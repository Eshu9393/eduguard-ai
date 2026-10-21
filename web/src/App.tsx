import { useEffect, useState } from "react";
import { getHealth } from "./lib/api";

type Status = "checking" | "online" | "no-model" | "offline";

const LABELS: Record<Status, string> = {
  checking: "Checking the prediction service…",
  online: "Prediction service online",
  "no-model": "Service online, model not loaded",
  offline: "Prediction service offline",
};

const DOTS: Record<Status, string> = {
  checking: "bg-ink-soft",
  online: "bg-good",
  "no-model": "bg-watch",
  offline: "bg-risk",
};

export default function App() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    getHealth()
      .then((h) => setStatus(h.model_loaded ? "online" : "no-model"))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-semibold">EduGuard AI</span>
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <span className={`h-2 w-2 rounded-full ${DOTS[status]}`} />
            {LABELS[status]}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Spot the students who need support, sooner.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          Enter a student's first-semester details to see whether they are likely to
          drop out, still be enrolled, or graduate, and why.
        </p>
      </main>
    </div>
  );
}