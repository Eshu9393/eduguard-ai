import { ChevronDown } from "lucide-react";

export type FaqItem = { q: string; a: string };

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-white">
      {items.map((it) => (
        <details key={it.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {it.q}
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-ink-soft">{it.a}</p>
        </details>
      ))}
    </div>
  );
}