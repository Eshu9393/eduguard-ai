import type { ReactNode } from "react";
import type { Option } from "../data/codes";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

type ShellProps = { id: string; label: string; help?: string; error?: string; children: ReactNode };

function Shell({ id, label, help, error, children }: ShellProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {help && !error && <p className="mt-1 text-xs text-ink-soft">{help}</p>}
      {error && <p className="mt-1 text-xs font-medium text-risk" role="alert">{error}</p>}
    </div>
  );
}

type NumberProps = {
  id: string; label: string; value: number; onChange: (n: number) => void;
  min?: number; max?: number; step?: number; help?: string; error?: string;
};

export function NumberField({ id, label, value, onChange, min, max, step = 1, help, error }: NumberProps) {
  return (
    <Shell id={id} label={label} help={help} error={error}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className={inputClass}
        value={Number.isNaN(value) ? "" : value}
        min={min}
        max={max}
        step={step}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
      />
    </Shell>
  );
}

type SelectProps = {
  id: string; label: string; value: number; options: Option[];
  onChange: (n: number) => void; help?: string;
};

export function SelectField({ id, label, value, options, onChange, help }: SelectProps) {
  return (
    <Shell id={id} label={label} help={help}>
      <select id={id} className={inputClass} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((o) => (
          <option key={o.code} value={o.code}>{o.label}</option>
        ))}
      </select>
    </Shell>
  );
}

type ToggleProps = { label: string; help?: string; checked: boolean; onChange: (checked: boolean) => void };

export function ToggleField({ label, help, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {help && <span className="block text-xs text-ink-soft">{help}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}