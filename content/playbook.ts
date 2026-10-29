/**
 * The AI-Native Playbook rules. Edit copy here — the page renders from this list.
 */
export const playbookRules = [
  {
    title: "Write the spec before the prompt.",
    body: "State the goal, constraints and acceptance criteria in a reviewable file. Agents build better against a contract, and reviewers know what \"done\" means.",
  },
  {
    title: "Treat context as code.",
    body: "Project context files, conventions and architecture notes live in the repo, are versioned, and get reviewed like any other change.",
  },
  {
    title: "Make the feedback loop fast.",
    body: "An agent is only as good as the signal it gets. Fast, deterministic tests and one-command builds are the highest-leverage investment you can make.",
  },
  {
    title: "Small diffs, always.",
    body: "Break work into changes a human can genuinely review in one sitting. Volume is cheap now; attention isn't.",
  },
  {
    title: "The author owns it, whoever typed it.",
    body: "The engineer who merges agent-written code is accountable for it — and should be able to explain every line.",
  },
  {
    title: "Evals are tests. Gate on them.",
    body: "Any change to a prompt, model or agent runs its eval suite in CI. A regression blocks the merge like a failing unit test.",
  },
  {
    title: "Least privilege for agents.",
    body: "Sandboxed environments, scoped credentials and explicit approval for anything irreversible. Never give an agent more access than the task needs.",
  },
  {
    title: "Measure outcomes, not output.",
    body: "Lines of code and PR counts go up on their own. Track lead time, change-failure rate and the business metric the work was for.",
  },
];

export const adoptionOptions = [
  {
    title: "Workshop",
    body: "A hands-on session on your own codebase: context files, spec writing, agent workflows and review.",
  },
  {
    title: "Embedded pairing",
    body: "Our engineers pair with yours on real tickets until the new habits stick.",
  },
  {
    title: "Standards package",
    body: "Your tailored playbook: repo templates, context files, CI gates and review checklists.",
  },
];
