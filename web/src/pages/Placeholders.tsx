function Page({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-xl text-ink-soft">{children}</p>
    </section>
  );
}

export const HowItWorks = () => (
  <Page title="How it works">What the tool does and how to read a result. Coming soon.</Page>
);
export const CodeGuide = () => (
  <Page title="Code guide">Every number the dataset uses, and what it means. Coming soon.</Page>
);
export const About = () => (
  <Page title="About and limitations">Data source, limitations, and the model's performance. Coming soon.</Page>
);
export const NotFound = () => (
  <Page title="Page not found">That address doesn't exist. Use the menu above.</Page>
);