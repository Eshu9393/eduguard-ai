export function PageHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="mb-10 max-w-2xl">
      <h1 className="font-display text-4xl font-semibold leading-tight">{title}</h1>
      <p className="mt-3 text-lg text-ink-soft">{intro}</p>
    </header>
  );
}