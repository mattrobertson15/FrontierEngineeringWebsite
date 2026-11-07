# Pilot research profiles

As of 2026-11-06. These are evidence-backed drafts with explicit remaining work, not completed launch profiles. Claims and source identifiers are available in the linked CSV tables.

## DeepSWE — Datacurve

**Purpose:** Evaluate long-horizon repository engineering. The [official repository](https://github.com/datacurve-ai/deep-swe) describes 113 tasks spanning five programming languages, with programmatic verification. Its displayed license label is Apache-2.0; underlying repository licenses still need review.

**Version and method:** The [v1.1 announcement](https://deepswe.datacurve.ai/blog/deepswe-v1-1), dated June 14, 2026, retains the tasks while separating agent execution from clean-container grading of committed patches. Keep v1 and v1.1 results separate and pin the task/harness commits before comparison.

**Execution:** The [run guide](https://deepswe.datacurve.ai/run) identifies Pier, mini-swe-agent and Modal as the leaderboard execution stack. We have not executed this setup.

**Available data:** The [official leaderboard](https://deepswe.datacurve.ai/) exposes scores, effort labels, average cost, output tokens and agent steps. Three rounded cards are captured in `result_observations.csv` to test the import design. They are not complete run records. The displayed update date is September 22, 2026; observation date is November 6.

**Limitations:** [Epoch AI's September 7 review](https://epoch.ai/benchmarks/deepswe/review) identifies issues in at least 23 of 113 tasks and assigns a Flawed verdict to v1.1. This is attributed audit evidence; maintainer responses and subsequent fixes remain unreviewed.

**Before publication:** Resolve exact trial/configuration IDs, scoring denominators, interval method, pricing basis and revisions. Obtain primary lab-release citations. Datacurve evaluating a Meta model is not evidence that Meta adopted or cited the benchmark. Universal usage and token totals remain unknown.

## Terminal-Bench

**Purpose:** Evaluate agents performing work through a terminal. The [official dataset page](https://hub.harborframework.com/datasets/terminal-bench/terminal-bench/4?tab=tasks) establishes this scope, but its task table did not load in retrieved text.

**Version and method:** The [official site](https://www.tbench.ai/) displays Terminal-Bench 4.0, resolution rate, cost and token columns, with 95% confidence intervals. The [run guide](https://www.tbench.ai/run) specifies dataset version 4.0.0, Harbor, and a GPU-capable environment. Record dataset, agent, model and resource settings independently.

**Available data:** Retrieved leaderboard text contained headings but no populated result rows. No Terminal-Bench scores, tokens or costs have been invented or imported. Its exact task manifest, license and dataset hash remain collection tasks.

**Limitations:** [Epoch AI's September 4 review](https://epoch.ai/benchmarks/terminal-bench-4/review) assigns a Flawed verdict to 4.0.0 and reports defects in 30 of 66 tasks. Its examples include grading exploits, answer leakage and false negatives. The audit describes that version; whether later fixes resolve those findings has not been checked. The 66-task figure is stored as audit scope, not an independently checked current dataset count.

**Before publication:** Retrieve the rendered leaderboard or a documented data feed, capture exact dataset resources, and investigate audit follow-up. Separate API, GPU/sandbox and tool costs. Obtain original adoption references and reproducibility artifacts. No Frontier run has been conducted.
