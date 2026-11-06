/**
 * Benchmark Intelligence Directory — the single source for every benchmark on the site.
 * The index (/benchmarks) and profile pages (/benchmarks/<slug>) render from this list.
 *
 * STATUS: scaffold. Qualitative copy is a first draft and needs review. Every measured
 * signal (stars, citations, lab reports) is `null` until the data pull lands. `null`
 * renders as "pending", so never put a guessed number in its place.
 *
 * When data lands: fill `signals` + `labReports`, set `dataAsOf`, then flip
 * `benchmarksLaunched` to add the section to the sitemap and allow indexing.
 */

/** Flip to true to list the section in the sitemap and let search engines index it. */
export const benchmarksLaunched = false;

/** When the measured signals were last pulled, e.g. "Nov 2026". null until the first pull. */
export const dataAsOf: string | null = null;

/* ---------- taxonomy ---------- */

export const categories = {
  coding: "Coding & SWE",
  agents: "Agents & tool use",
  "computer-use": "Computer use",
  reasoning: "Reasoning & knowledge",
  math: "Mathematics",
  factuality: "Factuality",
} as const;
export type Category = keyof typeof categories;

/** Frontier labs we track citations from. Order is the column order in adoption views. */
export const labs = [
  "Anthropic",
  "OpenAI",
  "Google DeepMind",
  "Meta",
  "xAI",
  "DeepSeek",
  "Alibaba Qwen",
  "Mistral",
] as const;
export type Lab = (typeof labs)[number];

export const statuses = {
  active: "Active",
  saturated: "Saturated",
  superseded: "Superseded",
} as const;
export type Status = keyof typeof statuses;

/** Editorial rating on one assessment axis. null = not yet reviewed. */
export type Rating = 1 | 2 | 3 | null;

export const assessmentAxes = {
  headroom: {
    label: "Headroom",
    help: "How far frontier models are from the ceiling. Low headroom means the benchmark no longer separates models.",
  },
  contamination: {
    label: "Contamination resistance",
    help: "How well the design keeps test items out of training data: held-out sets, fresh items, canaries.",
  },
  realism: {
    label: "Real-world relevance",
    help: "How closely tasks resemble work people actually need done.",
  },
  reproducibility: {
    label: "Reproducibility",
    help: "Whether an outside team can rerun it and get the same number: open harness, pinned environment, deterministic grading.",
  },
} as const;
export type AssessmentAxis = keyof typeof assessmentAxes;

/* ---------- record ---------- */

export type LabReport = {
  lab: Lab;
  /** Where the lab cited it. */
  source: "Model card" | "System card" | "Launch post" | "Paper" | "Leaderboard";
  /** Model the result was reported for, e.g. "Claude Opus 5.5". */
  model?: string;
  /** Reported score as published, e.g. "74.1%". */
  score?: string;
  /** "YYYY-MM" */
  date: string;
  url: string;
};

export type Benchmark = {
  /** URL segment: /benchmarks/<slug> */
  slug: string;
  name: string;
  /** Longer name or expansion, if different from `name`. */
  fullName?: string;
  category: Category;
  status: Status;
  /** Who builds and maintains it. */
  maintainer: string;
  /** First public release, "YYYY-MM". */
  released: string;
  /** One sentence for the directory row. */
  summary: string;
  /** What capability a high score is evidence of. */
  measures: string;
  /** What makes it different from neighbouring benchmarks. */
  positioning: string;

  methodology: {
    /** What a single task looks like. */
    format: string;
    /** Number of tasks, as text so it can carry the split ("500 of 2,294"). */
    size: string;
    scoring: string;
    /** Where tasks run and what tooling the model gets. */
    environment: string;
    contaminationControls: string;
    /** Longer, collapsible notes for readers who want the detail. */
    deepDive: { title: string; body: string }[];
  };

  /** Measured popularity signals. null = not yet pulled. */
  signals: {
    githubStars: number | null;
    /** Citations of the primary paper (state the source in `citationSource` when filled). */
    paperCitations: number | null;
    citationSource?: "Semantic Scholar" | "Google Scholar";
  };
  /** Each time a frontier lab reported a result on this benchmark. */
  labReports: LabReport[];

  /** Our editorial read. null on an axis = not yet reviewed. */
  assessment: Record<AssessmentAxis, Rating>;

  limitations: { title: string; body: string }[];

  links: {
    paper?: string;
    repo?: string;
    site?: string;
    leaderboard?: string;
  };

  related: string[];
};

const pending = { githubStars: null, paperCitations: null } as const;
const unreviewed = { headroom: null, contamination: null, realism: null, reproducibility: null } as const;

/* ---------- data ---------- */

export const benchmarks: Benchmark[] = [
  {
    slug: "swe-bench-verified",
    name: "SWE-bench Verified",
    category: "coding",
    status: "active",
    maintainer: "SWE-bench team (Princeton / Stanford) with OpenAI",
    released: "2024-08",
    summary:
      "Real GitHub issues from popular Python repositories. The model has to produce a patch that makes the hidden tests pass.",
    measures:
      "Whether a model, inside an agent harness, can read an unfamiliar codebase, find the cause of a reported bug or missing feature, and write a working fix.",
    positioning:
      "The default headline coding number in frontier model launches. Verified is a human-screened subset of the original SWE-bench that removes tasks with ambiguous issues or unfair tests, so a failure is more likely to be the model's fault.",
    methodology: {
      format: "A repository snapshot plus the text of a GitHub issue. The output is a code patch.",
      size: "500 tasks (human-validated subset of the 2,294-task original)",
      scoring:
        "% resolved: the patch must make the issue's FAIL_TO_PASS tests pass without breaking PASS_TO_PASS tests.",
      environment: "Per-task Docker images. The agent scaffold is up to the submitter.",
      contaminationControls:
        "Limited. Issues and fixes are public on GitHub and many predate current training cutoffs.",
      deepDive: [
        {
          title: "How Verified was built",
          body: "Professional software engineers screened tasks from the original set and dropped those with underspecified issues or tests that check for details the issue never mentions.",
        },
        {
          title: "Why the harness matters",
          body: "Scores combine model and scaffold. The same model can score very differently depending on tools, retries and context management. Compare results only when the harness is reported.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Python only, few repositories",
        body: "Tasks come from a small set of Python projects, with Django heavily represented. Results may not transfer to other languages or codebases.",
      },
      {
        title: "Contamination risk",
        body: "Issues and merged fixes are public, so models may have seen the solutions in training.",
      },
    ],
    links: {
      paper: "https://arxiv.org/abs/2310.06770",
      repo: "https://github.com/SWE-bench/SWE-bench",
      site: "https://www.swebench.com",
      leaderboard: "https://www.swebench.com",
    },
    related: ["terminal-bench", "tau-bench"],
  },
  {
    slug: "terminal-bench",
    name: "Terminal-Bench",
    category: "agents",
    status: "active",
    maintainer: "Stanford University & Laude Institute",
    released: "2025-05",
    summary:
      "End-to-end tasks completed in a real terminal: compiling code, configuring servers, training models, recovering systems.",
    measures:
      "Whether an agent can complete long, multi-step work in a shell environment, with only test scripts checking the result.",
    positioning:
      "Broader than repo-patching benchmarks. Tasks cover system administration, data work and security as well as coding, and the agent has to work with real tools and real failures.",
    methodology: {
      format: "A natural-language instruction plus a containerized environment. The agent runs commands until it decides it is done.",
      size: "Pending data pull",
      scoring: "% of tasks where the task's verification tests pass after the agent finishes.",
      environment: "Docker containers driven through a terminal harness. Third-party agents plug in through an adapter.",
      contaminationControls: "Tasks are hand-written for the benchmark rather than scraped.",
      deepDive: [
        {
          title: "Task authoring",
          body: "Each task ships with an instruction, an environment definition, a reference solution and tests, so it can be checked to be solvable.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Agent and harness confound",
        body: "Like other agentic benchmarks, scores reflect the agent scaffold as much as the model.",
      },
    ],
    links: {
      repo: "https://github.com/laude-institute/terminal-bench",
      site: "https://www.tbench.ai",
      leaderboard: "https://www.tbench.ai",
    },
    related: ["swe-bench-verified", "osworld"],
  },
  {
    slug: "tau-bench",
    name: "τ-bench",
    fullName: "Tool-Agent-User benchmark",
    category: "agents",
    status: "active",
    maintainer: "Sierra",
    released: "2024-06",
    summary:
      "Customer-service conversations where an agent must follow domain policy, call tools and satisfy a simulated user.",
    measures:
      "Whether an agent can hold a multi-turn conversation, use APIs correctly and follow written policy, and do so reliably across repeated attempts.",
    positioning:
      "One of the few widely cited benchmarks that scores reliability as well as one-off success, with its pass^k metric. It tests the work customer-facing agents actually do.",
    methodology: {
      format: "A conversation with an LLM-simulated user, in a domain such as retail or airline, with tools and a policy document.",
      size: "Pending data pull",
      scoring:
        "Success if the final database state matches the goal state. pass^k is the probability that all k independent trials succeed.",
      environment: "Simulated domain databases and APIs. The user is played by a language model.",
      contaminationControls: "Synthetic domains and generated conversations, not scraped from the web.",
      deepDive: [
        {
          title: "Why pass^k",
          body: "pass@k rewards a model that gets it right once in k tries. pass^k rewards one that gets it right every time, which is what a deployed agent needs.",
        },
        {
          title: "τ²-bench",
          body: "A follow-up adds a telecom domain in which the user also acts on the environment, testing coordination between agent and user.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Simulated user noise",
        body: "The simulated user is itself a model, so some failures come from the simulator rather than the agent under test.",
      },
    ],
    links: {
      paper: "https://arxiv.org/abs/2406.12045",
      repo: "https://github.com/sierra-research/tau-bench",
    },
    related: ["terminal-bench", "swe-bench-verified"],
  },
  {
    slug: "osworld",
    name: "OSWorld",
    category: "computer-use",
    status: "active",
    maintainer: "XLang Lab, University of Hong Kong",
    released: "2024-04",
    summary:
      "Open-ended tasks on a real desktop operating system, using real applications, checked by execution-based scripts.",
    measures:
      "Whether a multimodal agent can operate a computer from screenshots and/or accessibility trees: clicking, typing and moving between apps to finish a task.",
    positioning:
      "The reference benchmark for computer-use agents. Tasks run in full virtual machines with real apps, rather than simplified web mock-ups.",
    methodology: {
      format: "A natural-language task plus a virtual machine in a set initial state. The agent emits mouse and keyboard actions.",
      size: "369 tasks",
      scoring: "Task-specific evaluation scripts inspect the final machine state.",
      environment: "Ubuntu virtual machines with real desktop and web applications. A Windows variant also exists.",
      contaminationControls: "Tasks and checkers were written for the benchmark.",
      deepDive: [
        {
          title: "Human baseline",
          body: "The authors report human performance well above the best models at release, which gives the benchmark a meaningful ceiling.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Setup cost",
        body: "Running full virtual machines makes the benchmark slow and costly to reproduce compared with text benchmarks.",
      },
    ],
    links: {
      paper: "https://arxiv.org/abs/2404.07972",
      repo: "https://github.com/xlang-ai/OSWorld",
      site: "https://os-world.github.io",
    },
    related: ["terminal-bench", "tau-bench"],
  },
  {
    slug: "gpqa-diamond",
    name: "GPQA Diamond",
    fullName: "Graduate-Level Google-Proof Q&A, Diamond subset",
    category: "reasoning",
    status: "active",
    maintainer: "Rein et al. (NYU)",
    released: "2023-11",
    summary:
      "Graduate-level multiple-choice questions in biology, physics and chemistry, written so web search doesn't help.",
    measures: "Expert-level scientific reasoning in domains where answers can't simply be looked up.",
    positioning:
      "Built to be 'Google-proof': skilled non-experts with unrestricted web access score far below domain PhDs. Diamond is the highest-quality subset, where expert validators agreed and non-experts failed.",
    methodology: {
      format: "Four-option multiple-choice question.",
      size: "198 questions (Diamond subset of 448)",
      scoring: "Accuracy.",
      environment: "Plain prompt-and-answer. No tools.",
      contaminationControls: "Questions are written by experts. The dataset asks users not to reveal examples online.",
      deepDive: [
        {
          title: "How 'Google-proof' was tested",
          body: "Highly skilled non-expert validators were given over 30 minutes per question with full web access, and still scored far below domain experts.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Small and multiple-choice",
        body: "198 questions gives wide confidence intervals, and a four-option format means guessing yields 25%.",
      },
      {
        title: "Approaching saturation",
        body: "Frontier models now score near or above the expert baseline, so the benchmark separates top models less well.",
      },
    ],
    links: {
      paper: "https://arxiv.org/abs/2311.12022",
      repo: "https://github.com/idavidrein/gpqa",
    },
    related: ["humanitys-last-exam", "mmlu"],
  },
  {
    slug: "humanitys-last-exam",
    name: "Humanity's Last Exam",
    category: "reasoning",
    status: "active",
    maintainer: "Center for AI Safety & Scale AI",
    released: "2025-01",
    summary:
      "Thousands of expert-written questions across 100+ subjects, kept only if frontier models failed them when written.",
    measures: "Breadth and depth of expert academic knowledge and reasoning at the edge of human expertise.",
    positioning:
      "Built as a successor to saturated knowledge tests like MMLU. Questions were adversarially filtered against frontier models when they were collected, so the benchmark started with a great deal of headroom.",
    methodology: {
      format: "Short-answer or multiple-choice questions. A portion are multimodal.",
      size: "~2,500 public questions, plus a private held-out set",
      scoring: "Accuracy, with model-graded answer matching for short answers. Calibration error is also reported.",
      environment: "Plain prompt-and-answer. Tool-enabled variants are reported separately by labs.",
      contaminationControls: "A private held-out set is used to detect overfitting to the public questions.",
      deepDive: [
        {
          title: "Adversarial filtering",
          body: "Candidate questions were tested against frontier models and kept only if the models failed, then reviewed by human experts.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Label quality",
        body: "Outside audits have questioned the answers to some questions, which is common for very hard expert-written sets.",
      },
      {
        title: "Selection bias",
        body: "Filtering against particular models means early scores understate those models' ability relative to newer ones.",
      },
    ],
    links: {
      paper: "https://arxiv.org/abs/2501.14249",
      site: "https://lastexam.ai",
    },
    related: ["gpqa-diamond", "frontiermath"],
  },
  {
    slug: "arc-agi-2",
    name: "ARC-AGI-2",
    fullName: "Abstraction and Reasoning Corpus, version 2",
    category: "reasoning",
    status: "active",
    maintainer: "ARC Prize Foundation",
    released: "2025-03",
    summary:
      "Visual grid puzzles that are easy for people and hard for AI. Each one requires inferring a new rule from a few examples.",
    measures: "Fluid intelligence: learning a new abstraction from a few examples, rather than recalling knowledge.",
    positioning:
      "Deliberately avoids testing knowledge. Every task was solved by human testers, so a low model score is a direct sign of a reasoning gap. Results are reported with cost per task, so efficiency counts alongside accuracy.",
    methodology: {
      format: "A few input→output grid examples. The model must produce the output grid for a new input.",
      size: "Public training and evaluation sets, plus semi-private and private sets",
      scoring: "Exact match on the output grid, within a small number of attempts. Cost per task is reported alongside.",
      environment: "No tools are required. Competition entries run offline with capped compute.",
      contaminationControls: "Private evaluation sets are never released, and competition entries run without internet access.",
      deepDive: [
        {
          title: "Relationship to ARC-AGI-1",
          body: "Version 2 was designed after frontier reasoning systems made large gains on the original, with tasks that resist brute-force program search.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Narrow modality",
        body: "Grid puzzles test one kind of abstraction. Strong scores don't necessarily mean general competence.",
      },
    ],
    links: {
      repo: "https://github.com/arcprize/ARC-AGI-2",
      site: "https://arcprize.org",
      leaderboard: "https://arcprize.org/leaderboard",
    },
    related: ["humanitys-last-exam", "frontiermath"],
  },
  {
    slug: "frontiermath",
    name: "FrontierMath",
    category: "math",
    status: "active",
    maintainer: "Epoch AI",
    released: "2024-11",
    summary:
      "Original, unpublished research-level maths problems with answers that can be checked automatically.",
    measures: "Advanced mathematical reasoning on problems that take specialists hours or days.",
    positioning:
      "Moves maths evaluation beyond competition problems (AIME, MATH), which are close to saturation. Problems are new, so they can't be memorised, and answers are checked automatically rather than by a model.",
    methodology: {
      format: "A problem with a definite answer, often a number or symbolic object, that is hard to guess.",
      size: "Hundreds of problems across tiers of difficulty",
      scoring: "Automated verification of the final answer.",
      environment: "Models may run code (e.g. Python) while solving.",
      contaminationControls: "Problems are unpublished. Most are held out from public release.",
      deepDive: [
        {
          title: "Funding and access",
          body: "Epoch AI has disclosed that OpenAI funded the benchmark and has access to much of the problem set, apart from a holdout. Read lab-reported scores with that in mind.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Opaque by design",
        body: "Because problems are held out, outside parties can't inspect most items or reproduce scores independently.",
      },
    ],
    links: {
      paper: "https://arxiv.org/abs/2411.04872",
      site: "https://epoch.ai/frontiermath",
    },
    related: ["humanitys-last-exam", "arc-agi-2"],
  },
  {
    slug: "simpleqa",
    name: "SimpleQA",
    category: "factuality",
    status: "active",
    maintainer: "OpenAI",
    released: "2024-10",
    summary:
      "Short, fact-seeking questions with a single indisputable answer. It measures whether models know what they know.",
    measures: "Short-form factual accuracy and calibration: does the model answer correctly, or decline rather than make something up?",
    positioning:
      "Focused on hallucination rather than reasoning. It grades abstention separately, so a model that says 'I don't know' is treated differently from one that answers wrongly.",
    methodology: {
      format: "A short question with one verifiable answer.",
      size: "4,326 questions",
      scoring: "Each answer is graded correct, incorrect or not attempted by a model grader.",
      environment: "Plain prompt-and-answer, without browsing.",
      contaminationControls: "Questions were collected adversarially against GPT-4-era models.",
      deepDive: [
        {
          title: "Why 'not attempted' matters",
          body: "Separating abstentions from wrong answers rewards calibrated models, which matters in production systems where a confident wrong answer costs more than no answer.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Narrow by design",
        body: "Short single-fact questions say little about factuality in long-form answers.",
      },
    ],
    links: {
      paper: "https://arxiv.org/abs/2411.04368",
      repo: "https://github.com/openai/simple-evals",
    },
    related: ["humanitys-last-exam", "mmlu"],
  },
  {
    slug: "mmlu",
    name: "MMLU",
    fullName: "Massive Multitask Language Understanding",
    category: "reasoning",
    status: "saturated",
    maintainer: "Hendrycks et al. (UC Berkeley)",
    released: "2020-09",
    summary:
      "Multiple-choice questions across 57 subjects, from elementary maths to law. It was the standard knowledge benchmark for years.",
    measures: "Broad academic and professional knowledge.",
    positioning:
      "Historically the most cited LLM benchmark, and the reference point for a generation of model releases. Frontier models now score near the ceiling, so labs increasingly report harder successors.",
    methodology: {
      format: "Four-option multiple-choice question.",
      size: "~14,000 test questions across 57 subjects",
      scoring: "Accuracy, usually 5-shot.",
      environment: "Plain prompt-and-answer.",
      contaminationControls: "None to speak of. Questions come from public sources and are widely reproduced online.",
      deepDive: [
        {
          title: "Successors",
          body: "Harder variants such as MMLU-Pro and fully new sets such as Humanity's Last Exam have taken over as headline knowledge benchmarks.",
        },
      ],
    },
    signals: { ...pending },
    labReports: [],
    assessment: { ...unreviewed },
    limitations: [
      {
        title: "Saturated",
        body: "Top models score near the ceiling, so differences between them are mostly noise.",
      },
      {
        title: "Label errors",
        body: "Audits have found a meaningful share of questions with wrong or ambiguous answers.",
      },
    ],
    links: {
      paper: "https://arxiv.org/abs/2009.03300",
      repo: "https://github.com/hendrycks/test",
    },
    related: ["gpqa-diamond", "humanitys-last-exam"],
  },
];

/* ---------- helpers ---------- */

export const benchmark = (slug: string) => benchmarks.find((b) => b.slug === slug);

/** Distinct labs that have reported a result on this benchmark. */
export const labsReporting = (b: Benchmark): Lab[] =>
  labs.filter((lab) => b.labReports.some((r) => r.lab === lab));

/** True once any measured signal has been filled in for any benchmark. */
export const hasSignalData = benchmarks.some(
  (b) => b.signals.githubStars !== null || b.signals.paperCitations !== null || b.labReports.length > 0,
);

export const compact = (n: number | null) =>
  n === null ? null : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const formatMonth = (yyyyMm: string) => {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1)).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
};
