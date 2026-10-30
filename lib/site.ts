export const researchHref = "/research/wharf-deepswe";

export const offerings = [
  { href: "/done-for-you", label: "Done for You", short: "Done for You" },
  { href: "/build-with-your-team", label: "Build with Your Team", short: "With Your Team" },
] as const;

/** Header menu: each offering opens onto the practices it draws on; Research holds our credibility work. */
export const navGroups = [
  {
    ...offerings[0],
    overview: "Overview",
    summary: "We scope, build and ship it. You choose who runs it.",
    children: [
      { href: "/forward-deployed", label: "Forward-Deployed Engineers", summary: "Embedded engineers who find and build the solution." },
    ],
  },
  {
    ...offerings[1],
    overview: "Overview",
    summary: "Your engineers ship it with us, then lead the next one.",
    children: [
      { href: "/engineering", label: "AI-Native Engineering", summary: "Codebases, specs and review set up for agents." },
      { href: "/playbook", label: "AI-Native Playbook", summary: "The working rules we teach, published in full." },
    ],
  },
  {
    href: researchHref,
    label: "Research",
    overview: "Wharf benchmark",
    summary: "Thousands of attempts across models and agent harnesses.",
    children: [
      { href: "/model-testing", label: "Model Testing & Evals", summary: "How we test models and harnesses before we choose a stack." },
    ],
  },
] as const;

export const practices = [
  { href: "/engineering", label: "AI-Native Engineering", short: "Engineering" },
  { href: "/forward-deployed", label: "Forward-Deployed", short: "Forward-Deployed" },
  { href: "/model-testing", label: "Model Testing", short: "Model Testing" },
  { href: "/playbook", label: "Playbook", short: "Playbook" },
] as const;

export const contactHref = "/#contact";

export const siteUrl = "https://frontier-engineering.ai";
