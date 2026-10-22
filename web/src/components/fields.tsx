import type { ReactNode } from "react";
import type { Option } from "../data/codes";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink shadow-sm placeholder:text-ink-soft/80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent aria-invalid:border-risk";

const describedBy = (id: string, help?: string, error?: string) =>
  [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

function Notes({ id, help, error }: { id: string; help?: string; error?: string }) {
  return (
    <>
      {help && <p id={`${id}-help`} className="mt-1 text-xs text-ink-soft">{help}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-risk" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function Label({ id, text, optional }: { id: string; text: string; optional?: boolean }) {
  return (
    <label htmlFor={id} className="mb-1 block text-sm font-medium">
      {text}
      {optional && <span className="ml-2 text-xs font-normal text-ink-soft">(optional)</span>}
    </label>
  );
}

type NumberProps = {
  id: string; label: string; value: number; onChange: (n: number) => void;
  min?: number; max?: number; step?: number; help?: string; error?: string;
  placeholder?: string; unit?: string; optional?: boolean;
};

export function NumberField(p: NumberProps) {
  return (
    <div>
      <Label id={p.id} text={p.label} optional={p.optional} />
      <div className="flex items-center gap-2">
        <input
          id={p.id}
          type="number"
          inputMode="decimal"
          className={inputClass}
          value={Number.isNaN(p.value) ? "" : p.value}
          min={p.min}
          max={p.max}
          step={p.step ?? 1}
          placeholder={p.placeholder}
          aria-invalid={!!p.error}
          aria-describedby={describedBy(p.id, p.help, p.error)}
          onChange={(e) => p.onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        />
        {p.unit && <span className="whitespace-nowrap text-sm text-ink-soft">{p.unit}</span>}
      </div>
      <Notes id={p.id} help={p.help} error={p.error} />
    </div>
  );
}

type SelectProps = {
  id: string; label: string; value: number; options: Option[];
  onChange: (n: number) => void; help?: string; error?: string; optional?: boolean;
};

export function SelectField(p: SelectProps) {
  return (
    <div>
      <Label id={p.id} text={p.label} optional={p.optional} />
      <select
        id={p.id}
        className={inputClass}
        value={Number.isNaN(p.value) ? "" : p.value}
        aria-invalid={!!p.error}
        aria-describedby={describedBy(p.id, p.help, p.error)}
        onChange={(e) => p.onChange(e.target.value === "" ? NaN : Number(e.target.value))}
      >
        {Number.isNaN(p.value) && (
          <option value="" disabled>
            Choose an option
          </option>
        )}
        {p.options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      <Notes id={p.id} help={p.help} error={p.error} />
    </div>
  );
}

type YesNoProps = {
  id: string; label: string; value: number; onChange: (n: number) => void;
  help?: string; error?: string;
};

export function YesNoField({ id, label, value, onChange, help, error }: YesNoProps) {
  const choices: { n: number; text: string }[] = [
    { n: 1, text: "Yes" },
    { n: 0, text: "No" },
  ];
  return (
    <fieldset aria-describedby={describedBy(id, help, error)}>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        {choices.map((c) => (
          <label key={c.n} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name={id}
              value={c.n}
              checked={value === c.n}
              onChange={() => onChange(c.n)}
              className="peer sr-only"
            />
            <span className="block rounded-lg border border-line bg-white px-3 py-2.5 text-center text-sm font-medium text-ink-soft peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {c.text}
            </span>
          </label>
        ))}
      </div>
      <Notes id={id} help={help} error={error} />
    </fieldset>
  );
}