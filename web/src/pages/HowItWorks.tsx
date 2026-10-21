import { Link } from "react-router-dom";
import { Faq } from "../components/Faq";
import type { FaqItem } from "../components/Faq";
import { PageHeader } from "../components/PageHeader";

const STEPS = [
  {
    title: "Enter details",
    body: "Answer four short groups of questions: the student, their finances, their first-semester results, and optionally their background. Everything is pre-filled with example values, so you can try it right away.",
  },
  {
    title: "Get an estimate",
    body: "The model compares the student with past students and gives a score for each outcome: Dropout, Enrolled, and Graduate.",
  },
  {
    title: "Read and act",
    body: "The result says what the model found, what it means, and what to do next. A chart shows which inputs pushed the score up or down.",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "What is the Dropout score?",
    a: "A number from 0% to 100% from the model for how strongly the student's inputs resemble students who dropped out. It is a score, not a guarantee, and it is not a verified probability.",
  },
  {
    q: "What is a 'typical student'?",
    a: "A reference student built from the most common value of each category and the middle value of each number in the training data. The explanation shows how this student differs from that reference. The reference is not the average dropout risk.",
  },
  {
    q: "What does 'Low score: mixed signals' mean?",
    a: "The top outcome has under 50% of the score, so the model is split. Rely more on your own knowledge of the student.",
  },
  {
    q: "Why does it only use the first semester?",
    a: "The estimate is made at the end of the first semester. Enrollment details alone are much weaker, and waiting for the second semester would be more accurate but leaves less time to help.",
  },
  {
    q: "Is the information I enter saved?",
    a: "The application code does not save the details you enter. It only records which outcome was predicted.",
  },
  {
    q: "Can I use this to make decisions about a student?",
    a: "No. It is meant to help advisors decide who to check in with. A person should always make the decision.",
  },
];

export default function HowItWorks() {
  return (
    <div>
      <PageHeader
        title="How it works"
        intro="EduGuard AI looks at a student's first-semester record and estimates which of three outcomes they most resemble. Here is what that means in practice."
      />

      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-line bg-white p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              {i + 1}
            </span>
            <h2 className="mt-3 font-display text-xl font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12 max-w-2xl">
        <h2 className="font-display text-2xl font-semibold">How to read a result</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
          <li>The ring and bars are model scores that add up to 100%. They are not verified probabilities of real outcomes.</li>
          <li>"Enrolled" is the hardest outcome for the model, because those students' outcomes are still open. Treat it with the most caution.</li>
          <li>Much of the signal comes from first-semester results, so the tool is better at recognizing students who are already struggling than at predicting surprises.</li>
          <li>The "Why this score?" chart explains the Dropout score only. Red bars push it up and green bars push it down.</li>
        </ul>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="mb-4 font-display text-2xl font-semibold">Common questions</h2>
        <Faq items={FAQ} />
      </section>

      <p className="mt-10">
        <Link to="/" className="font-medium text-accent underline underline-offset-4 hover:text-accent-dark">
          Estimate a student
        </Link>
      </p>
    </div>
  );
}