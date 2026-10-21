import { PageHeader } from "../components/PageHeader";

const LIMITS = [
  "Trained on one Portuguese institution's data, so it may not transfer to other institutions or countries.",
  "'Enrolled' is the weakest outcome: those students' outcomes were still open, so the model finds only a minority of them.",
  "Some inputs, such as gender, can raise fairness concerns. The dataset records gender as male or female only. No fairness audit has been done, so review this before any real use.",
  "The economic indicators describe the period, not the student.",
  "The dataset does not document when fee and debtor status were recorded. If they were recorded late, they may carry some information about the outcome itself.",
  "Model scores are not calibrated, verified probabilities.",
];

const link = "underline underline-offset-2 hover:text-accent";

export default function About() {
  return (
    <div>
      <PageHeader
        title="About and limitations"
        intro="What this project is, what data it learned from, and where you should be cautious."
      />

      <div className="max-w-2xl space-y-10">
        <section>
          <h2 className="font-display text-2xl font-semibold">What this is</h2>
          <p className="mt-3 text-ink-soft">
            EduGuard AI is a learning and portfolio project. It estimates whether a student is more likely to
            drop out, still be enrolled, or graduate, using information known after the first semester, and
            explains each estimate in plain language. It is not a validated tool for real decisions about
            students.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Limitations</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft">
            {LIMITS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Data</h2>
          <p className="mt-3 text-ink-soft">
            The model learned from 4,424 students at one higher-education institution in Portugal. The dataset
            is published under a Creative Commons Attribution 4.0 license.
          </p>
          <p className="mt-3 rounded-xl border border-line bg-white p-4 text-sm text-ink-soft">
            Realinho, V., Vieira Martins, M., Machado, J., & Baptista, L. (2021). <i>Predict Students' Dropout
            and Academic Success</i> [Dataset]. UCI Machine Learning Repository.{" "}
            <a className={link} href="https://doi.org/10.24432/C5MC89" target="_blank" rel="noopener noreferrer">
              https://doi.org/10.24432/C5MC89
            </a>
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            <a
              className={link}
              href="https://archive.ics.uci.edu/dataset/697/predict+students+dropout+and+academic+success"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dataset page
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}