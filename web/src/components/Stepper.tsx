export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-8 flex gap-2" aria-label="Progress">
      {steps.map((name, i) => (
        <li key={name} className="flex-1" aria-current={i === current ? "step" : undefined}>
          <div className={`h-1.5 rounded-full ${i <= current ? "bg-accent" : "bg-line"}`} />
          <p className={`mt-2 text-xs sm:text-sm ${i === current ? "font-semibold text-ink" : "text-ink-soft"}`}>
            <span className="hidden sm:inline">{i + 1}. </span>
            {name}
          </p>
        </li>
      ))}
    </ol>
  );
}