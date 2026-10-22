import type { PredictionResponse } from "./api";
import type { StudentPayload } from "./form";

export type Priority = "High" | "Medium" | "Low";
export type Group = "first" | "next" | "later";

export type Action = {
  id: string;
  group: Group;
  priority: Priority;
  action: string;
  why: string;
  how: string[];
  outcome: string;
};

export const GROUP_TITLES: Record<Group, string> = {
  first: "Do this first",
  next: "Improve next",
  later: "Consider later",
};

const GROUP_RANK: Record<Group, number> = { first: 0, next: 1, later: 2 };
const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

export function buildActions(result: PredictionResponse, v: StudentPayload): Action[] {
  const actions: Action[] = [];
  const pred = result.prediction;
  const enrolled = v.sem1_enrolled;
  const passRate = enrolled > 0 ? v.sem1_approved / enrolled : null;
  const feesIssue = v.tuition_fees_up_to_date === 0 || v.debtor === 1;

  if (v.sem1_approved > v.sem1_enrolled || (v.sem1_approved === 0) !== (v.sem1_grade === 0)) {
    actions.push({
      id: "check-data",
      group: "first",
      priority: "High",
      action: "Check the values you entered",
      why: "Some numbers don't fit together, so the estimate may be off.",
      how: ["Compare them with the student's records.", "Fix any mistakes and run the estimate again."],
      outcome: "A more reliable estimate.",
    });
  }

  if (pred === "Dropout") {
    actions.push({
      id: "talk",
      group: "first",
      priority: "High",
      action: "Have a supportive conversation",
      why: "This student's record looks like students who left before finishing.",
      how: [
        "Pick a private, friendly setting.",
        "Ask how the semester has gone and what is making it hard.",
        "Listen first. Don't present the score as a verdict.",
        "Ask what kind of help the student would want.",
      ],
      outcome: "May help you understand what is getting in the way.",
    });
  } else if (pred === "Enrolled") {
    actions.push({
      id: "checkin",
      group: "next",
      priority: "Medium",
      action: "Check in at the next milestone",
      why: "This student looks like those still studying when the normal course time ended. The model is least sure about this group.",
      how: ["Look at their results after the next semester.", "Ask if workload or deadlines are a problem."],
      outcome: "Helps you catch problems before they grow.",
    });
  } else {
    actions.push({
      id: "routine",
      group: "later",
      priority: "Low",
      action: "Keep routine support in place",
      why: "This student's record looks like students who finished on time.",
      how: ["Keep normal check-ins.", "Take any concern the student raises seriously."],
      outcome: "Keeps a good position steady.",
    });
  }

  if (v.sem1_approved === 0 && v.sem1_evaluations === 0) {
    actions.push({
      id: "attendance",
      group: "first",
      priority: "High",
      action: "Find out if the student is still attending",
      why: "No units passed and no exams taken. In the data behind the model, most students who passed no units left.",
      how: [
        "Contact the student to confirm they are still enrolled.",
        "Ask what stopped them from taking exams.",
        "Ask about the options your institution offers for catching up.",
      ],
      outcome: "May help you reach the student before they leave.",
    });
  } else if (v.sem1_approved === 0) {
    actions.push({
      id: "academic-support",
      group: "first",
      priority: "High",
      action: "Offer academic support",
      why: "The student took exams but passed no units.",
      how: [
        "Ask which subjects were hardest.",
        "Offer tutoring or study support, if your institution has it.",
        "Agree on a small first goal, such as passing one more unit.",
      ],
      outcome: "May help the student pass more units next semester.",
    });
  } else if (passRate !== null && passRate < 0.5) {
    actions.push({
      id: "academic-help",
      group: "next",
      priority: "Medium",
      action: "Offer help with the harder subjects",
      why: `The student passed ${v.sem1_approved} of ${enrolled} units.`,
      how: ["Ask which subjects were hardest.", "Point to tutoring or study groups, if available."],
      outcome: "May help the student pass more units.",
    });
  }

  if (feesIssue) {
    actions.push({
      id: "money",
      group: pred === "Dropout" ? "first" : "next",
      priority: pred === "Dropout" ? "High" : "Medium",
      action: "Talk about money worries",
      why: "Fees are not up to date, or the student is marked as a debtor. In past data, students in this situation left more often. This is a pattern, not a cause.",
      how: [
        "Ask in a private, non-judgmental way.",
        "Point to payment plans or financial aid, if your institution offers them.",
        "Connect the student with the finance office.",
      ],
      outcome: "May remove a barrier to staying.",
    });
    if (v.scholarship_holder === 0) {
      actions.push({
        id: "scholarship",
        group: "next",
        priority: "Medium",
        action: "Check for financial support",
        why: "In past data, scholarship holders left less often. This is a pattern, not a cause.",
        how: ["Ask whether the student has applied for support.", "Share the steps and deadlines."],
        outcome: "May ease financial pressure.",
      });
    }
  }

  actions.push({
    id: "review",
    group: "later",
    priority: "Low",
    action: "Review progress after the next semester",
    why: "This tool only uses first-semester data. It can't see later results.",
    how: ["Look at the student's next results yourself.", "Compare them with this estimate."],
    outcome: "Shows whether things are improving.",
  });

  return actions.sort(
    (a, b) => GROUP_RANK[a.group] - GROUP_RANK[b.group] || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
}