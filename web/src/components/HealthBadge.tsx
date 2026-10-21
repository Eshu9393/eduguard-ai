import { useEffect, useState } from "react";
import { getHealth } from "../lib/api";

type Status = "checking" | "online" | "no-model" | "offline";

const LABELS: Record<Status, string> = {
  checking: "Checking service…",
  online: "Service online",
  "no-model": "Model not loaded",
  offline: "Service offline",
};

const DOTS: Record<Status, string> = {
  checking: "bg-ink-soft",
  online: "bg-good",
  "no-model": "bg-watch",
  offline: "bg-risk",
};

export function HealthBadge() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    getHealth()
      .then((h) => setStatus(h.model_loaded ? "online" : "no-model"))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <span className="flex items-center gap-2 text-sm text-ink-soft" role="status">
      <span className={`h-2 w-2 rounded-full ${DOTS[status]}`} />
      {LABELS[status]}
    </span>
  );
}