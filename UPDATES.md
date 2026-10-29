# Frontier Engineering
## Wharf Research & Website Improvement Plan

**Date:** October 29, 2026  
**Status:** Working recommendations  
**Website:** frontier-engineering-site.vercel.app  
**Research repository:** github.com/bartr/wharf

---

# 1. Executive Summary

## Primary Recommendation

Elevate Wharf from a supporting benchmark reference into a flagship technical research project demonstrating Frontier Engineering's capabilities.

The repository provides evidence of substantial experimentation with AI coding agents, including:

- Multiple AI models and agent harnesses.
- Thousands of planned benchmark attempts.
- Cost and performance comparisons.
- Repeated evaluations of identical tasks.
- Independent verification environments.
- Regression testing.
- Reproducible experiment configurations.
- Detailed execution logs and evidence retention.
- Durable, resumable benchmark execution.

These experiments demonstrate something more valuable than familiarity with AI models: the engineering discipline required to evaluate complex AI systems reliably.

### Recommended Positioning

**Frontier Engineering helps organizations understand, implement, and continuously improve AI systems through rigorous engineering and empirical evaluation.**

The website should communicate three principles:

1. **Models are components, not complete solutions.** The harness, tools, prompts, environment, and verification process influence results.
2. **Performance must be measured against real tasks.** Public benchmarks are useful, but organizations need evaluations reflecting their own requirements.
3. **Engineering decisions require reproducible evidence.** Quality, reliability, latency, regressions, and cost must be measured together.

### Top Priorities

- [ ] Reconcile all website benchmark claims against versioned Wharf results.
- [ ] Create a dedicated Wharf research case study.
- [ ] Add meaningful cost-versus-performance visualizations.
- [ ] Explain attempt pass rate, task-level success, retries, and cost.
- [ ] Demonstrate the engineering methodology developed through Wharf.
- [ ] Introduce system-level evaluation as a core differentiator.
- [ ] Provide downloadable technical evidence and sample evaluation reports.
- [ ] Add appropriate limitations and methodological transparency.

---

# 2. Positioning: From Model Testing to System Evaluation

## Current Opportunity

The website already communicates an important distinction:

> Benchmarks don't run your business. Your tasks do.

Preserve this headline.

However, expand the supporting explanation to make clear that Frontier evaluates complete AI systems, not just foundation models.

### Proposed Website Copy

**Headline:**

Evaluate the system, not just the model.

**Supporting copy:**

A model's performance depends on more than its underlying capabilities. Prompts, reasoning configurations, tools, agent frameworks, execution environments, and verification processes all influence the outcome.

Frontier Engineering evaluates these components together to determine which configurations deliver the best combination of quality, reliability, latency, and cost for your actual workloads.

### Recommended Architecture Diagram

```text
              AI SYSTEM
                  |
     +------------+------------+
     |            |            |
    Model       Harness       Tools
     |            |            |
     +------------+------------+
                  |
           Configuration
                  |
        Execution Environment
                  |
             Verification
                  |
        +---------+---------+
        |         |         |
      Quality   Cost     Reliability
        |         |         |
        +---------+---------+
                  |
         Engineering Decision
```

### Why This Matters

A customer might assume that selecting the highest-performing model automatically produces the best AI application.

Wharf demonstrates why this assumption can be misleading.

The same model can produce different results under different harnesses, while less expensive configurations may outperform more expensive alternatives on particular workloads.

**Recommended message:**

The best AI system isn't necessarily built around the most expensive or highest-ranked model. It's the configuration that performs reliably against your requirements at an acceptable cost.

---

# 3. Wharf Research: Benchmark Scale

## Research Evidence

The Wharf repository reports multiple benchmark configurations across coding agents, models, and execution environments.

Its displayed non-HVE benchmark results represent approximately **7,571 planned logical trials** across 16 configurations.

This figure is derived from the displayed planned trial denominators. It should not be described as the number of successfully completed or fully graded attempts until verified against the underlying exports.

### Recommended Website Treatment

Create a research summary containing:

| Research Dimension | Description |
|---|---|
| Benchmark | DeepSWE coding tasks |
| Task count | 113 |
| Repeated attempts | Typically 4–5 per task in the displayed runs |
| Configurations | 16 displayed non-HVE configurations |
| Planned trials | Approximately 7,571 |
| Evaluation | Independent verification |
| Measurements | Success, cost, latency, failures, regressions |

**Important:** Confirm exact completed trial counts and configuration coverage before publishing these numbers as finalized research statistics.

### Suggested Headline

**Thousands of coding-agent trials. One conclusion: configuration matters.**

### Suggested Supporting Copy

Our Wharf research investigates how AI coding agents perform across different models, harnesses, and execution configurations.

By repeatedly testing agents against software engineering tasks, we examine not only whether they succeed, but how consistently they succeed, what failures occur, and how much each successful outcome costs.

Every comparison depends on its configuration. We retain the evidence needed to understand and reproduce the results.

---

# 4. Key Research Finding: Harnesses Matter

## Finding

Wharf reports different outcomes when the same underlying model is operated through different coding-agent harnesses.

One comparison in `RESULTS.md` reports Claude Opus 5 through:

| Configuration | Reported Pass Rate | Reported Mean Trial Cost |
|---|---:|---:|
| Copilot | 68.5% | $5.77 |
| Claude Code | 64.4% | $13.40 |

The repository's README also contains a different Copilot Opus 5 result of approximately 71.24%.

These figures must not be combined without identifying their respective runs and configurations.

## Why This Matters

An agent harness determines how a model interacts with its environment.

Depending on the system, it can influence:

- How tools are selected and invoked.
- How files are read and modified.
- How context is managed.
- How commands are executed.
- How errors are handled.
- How much information the model receives.
- How the agent iterates toward a solution.

Therefore, changing the harness can change system performance even when the underlying model remains the same.

### Proposed Website Section

**Headline:**

The harness is part of the product.

**Copy:**

Two systems using the same model can produce different results.

Agent frameworks determine how models interact with tools, manage context, execute tasks, and respond to failures.

Our evaluation methodology treats the entire execution configuration as the system under test.

**CTA:** Explore the Wharf harness comparison.

### Implementation Notes

- [ ] Identify the exact benchmark runs used in the comparison.
- [ ] Display model and harness versions.
- [ ] Include reasoning effort and attempt count.
- [ ] Explain differences in task coverage.
- [ ] Avoid attributing all performance differences to the harness unless other variables were controlled.

---

# 5. Key Research Finding: Quality Versus Cost

## Finding

Wharf reports substantial variation in cost across configurations.

One displayed GPT-5.6 Luna configuration achieved:

- 335 passing attempts.
- 452 planned attempts.
- 74.12% observed attempt pass rate.
- Approximately $0.3711 mean reported cost per costed trial.

Other configurations have considerably higher reported costs without necessarily achieving higher success rates on the same benchmark.

## Recommended Visualization

Create a scatterplot.

**X-axis:** Mean reported cost per costed trial.

**Y-axis:** Observed attempt pass rate.

Each point represents a complete model and harness configuration.

### Tooltip Information

Include:

- Model name and version.
- Harness name and version.
- Reasoning effort.
- Planned attempts.
- Passing attempts.
- Attempt pass rate.
- Mean reported cost.
- Percentage of trials with available cost data.
- Evaluation date.

### Important Methodological Detail

Cost observations may be missing.

Do not replace missing costs with zero.

The website should distinguish between:

**Mean reported cost per costed trial**

and

**Total cost per successfully completed task.**

These are different economic measurements.

### Proposed Website Copy

**Headline:**

More expensive doesn't always mean more effective.

**Copy:**

Model pricing tells you what computation costs. It doesn't tell you what a successful business outcome costs.

We measure quality and cost together, including the effects of failed attempts and repeated execution.

The objective is not simply to minimize token spending. It is to identify the most economical configuration that meets your reliability requirements.

---

# 6. Key Research Finding: Automatic Routing Needs Evaluation

## Finding

Wharf reports a Copilot Auto configuration with:

- 209 passing attempts.
- 565 planned attempts.
- 36.99% observed attempt pass rate.

The repository also documents agent timeouts associated with this configuration.

The selected model was not retained for every trial, limiting the ability to diagnose model-selection decisions.

## Interpretation

Automatic model routing can be useful.

However, routing decisions introduce another component that must be evaluated.

A router may select models based on:

- Cost.
- Estimated task complexity.
- Availability.
- Latency.
- Model capabilities.
- Provider constraints.

A routing strategy that performs well for one workload may perform poorly for another.

### Proposed Website Copy

**Headline:**

Automatic routing isn't automatically optimal.

**Copy:**

Model routers promise to balance performance, latency, and cost. But routing itself introduces decisions that need testing.

We evaluate routing systems against representative workloads, measure their outcomes, and examine whether their decisions improve overall system performance.

### Recommended Technical Requirements

For future routing evaluations, retain:

- Selected model for every request.
- Router version.
- Routing policy.
- Task characteristics.
- Execution cost.
- Latency.
- Verification result.
- Fallback decisions.
- Retry history.

This makes routing decisions explainable and auditable.

---

# 7. Explain Benchmark Metrics Clearly

The Model Testing page should include a concise educational section explaining the difference between attempts, task-level success, retries, and cost.

## Example

Imagine testing an AI agent on five software engineering tasks.

Each task receives two independent attempts.

| Task | Attempt 1 | Attempt 2 |
|---|---|---|
| Login | Pass | Pass |
| Tax calculation | Fail | Pass |
| Database | Fail | Fail |
| File upload | Pass | Fail |
| Search | Fail | Pass |

### Attempt Pass Rate

Five of ten attempts passed.

**Attempt pass rate: 50%.**

This measures success across individual attempts.

### Task-Level Success

Four of five unique tasks passed at least once.

**Task-level success: 80%.**

This measures how many distinct problems were solved with the available attempts.

### Retries

Independent benchmark attempts are not necessarily the same as production retries.

A production retry strategy might stop after the first success, whereas a benchmark may deliberately execute every planned attempt to measure consistency.

Infrastructure retries should also be distinguished from new model attempts.

### Cost

Assume all ten attempts cost $4 combined.

| Metric | Value |
|---|---:|
| Total cost | $4.00 |
| Cost per attempt | $0.40 |
| Cost per passing attempt | $0.80 |
| Cost per unique task solved | $1.00 |

These metrics answer different questions.

### Recommended Website Copy

**Headline:**

A pass rate is only the beginning.

**Copy:**

A model that succeeds once in five attempts behaves differently from one that succeeds consistently.

We distinguish individual attempt success, task-level coverage, retries, infrastructure failures, and the total cost of obtaining verified results.

This provides a more useful picture of production reliability than a single benchmark score.

---

# 8. Introduce Reliability and Consistency Analysis

## Recommendation

Add a visualization showing how consistently agents solve individual tasks.

For each task, calculate:

```text
Task Reliability = Passing Attempts / Total Planned Attempts
```

For example:

| Task | Passes | Attempts | Observed Reliability |
|---|---:|---:|---:|
| A | 5 | 5 | 100% |
| B | 4 | 5 | 80% |
| C | 2 | 5 | 40% |
| D | 0 | 5 | 0% |

This reveals differences hidden by aggregate pass rates.

## Recommended Visualization

A task reliability heatmap.

**Rows:** Individual tasks.

**Columns:** Repeated attempts.

**Colors:** Pass, fail, timeout, or infrastructure error.

Allow filtering by:

- Model.
- Harness.
- Task category.
- Reasoning effort.
- Runtime.
- Cost.

### Business Interpretation

For enterprise systems, consistency matters.

A system that occasionally succeeds may still be unsuitable for autonomous operation.

### Proposed Website Copy

**Headline:**

Reliability means succeeding repeatedly.

**Copy:**

A single successful execution doesn't establish that a system is dependable.

We use repeated evaluations to identify consistent successes, intermittent failures, and tasks that remain systematically difficult.

These patterns inform deployment decisions, escalation policies, and human oversight requirements.

---

# 9. Regression Testing: A Major Differentiator

## Why This Matters

A coding agent may successfully implement a requested feature while breaking existing functionality.

For example:

An agent fixes a payment calculation but accidentally breaks the refund workflow.

A benchmark focused only on the requested change might count this as a success.

An enterprise evaluation should also examine whether existing behavior remains intact.

## Wharf's Approach

Wharf's analytics documentation distinguishes its public benchmark pass metric from an enterprise-oriented evaluation score that incorporates regressions in pre-existing tests.

These scores must remain clearly separated.

## Recommended Website Section

**Headline:**

Passing the task isn't enough.

**Copy:**

An AI-generated change can satisfy a new requirement while introducing failures elsewhere.

Our evaluation approach considers both task completion and regression risk, helping teams understand whether a change improves the overall system.

### Recommended Diagram

```text
        Proposed AI Change
                 |
                 v
          Run Evaluation
                 |
        +--------+--------+
        |                 |
   New Requirements   Existing Behavior
        |                 |
        v                 v
   Acceptance Tests   Regression Tests
        |                 |
        +--------+--------+
                 |
                 v
          Release Decision
```

### Implementation Checklist

- [ ] Explain new-task verification versus regression testing.
- [ ] Distinguish benchmark scores from enterprise-specific scores.
- [ ] Show examples of changes that pass one criterion but fail another.
- [ ] Include regression metrics in sample client reports.
- [ ] Explain how regression thresholds influence release decisions.

---

# 10. Strengthen the AI-Native Engineering Page

## Preserve Existing Messaging

The current Engineering page uses:

> Rebuild how software gets made — around agents.

And:

> Humans decide. Agents execute. Tests arbitrate.

Both are strong.

Retain them.

## Add a Methodology Section

**Suggested headline:**

Engineering built around verification.

**Supporting copy:**

AI coding agents can generate software quickly. Reliable delivery requires more than generation.

Our engineering methodology combines structured specifications, bounded implementation sessions, independent verification, and retained evidence.

The result is a development process designed to make agent-generated changes understandable, reviewable, and testable.

## Recommended Workflow

```text
Research
   |
   v
Specify
   |
   v
Plan
   |
   v
Implement
   |
   v
Verify
   |
   v
Review
   |
   v
Deploy
   |
   v
Observe
```

### Research

Understand the repository, architecture, dependencies, and constraints.

### Specify

Define requirements, acceptance criteria, interfaces, and exclusions.

### Plan

Develop a bounded implementation approach before modifying code.

### Implement

Execute the approved work in manageable increments.

### Verify

Run automated tests and inspect evidence in a controlled environment.

### Review

Evaluate correctness, maintainability, security, and unintended changes.

### Deploy

Release the verified implementation.

### Observe

Monitor real-world behavior and detect regressions.

## Recommended Addition

Include a small module titled:

**Built with the same discipline we measure.**

Link this directly to the Wharf research case study.

---

# 11. Incorporate Sessions and RPI

Wharf's engineering retrospective describes two complementary development practices.

## Sessions

A session is a bounded unit of engineering work.

Each session should define:

- One primary objective.
- Explicit exclusions.
- Expected deliverables.
- Acceptance criteria.
- Failure conditions.
- Review requirements.
- A documented checkpoint.

## RPI

RPI stands for:

**Research → Plan → Implement → Review**

These stages separate understanding a problem from executing a solution.

## Why This Matters

AI agents can make incorrect assumptions early and build increasingly complex implementations around those assumptions.

Structured research and planning reduce this risk.

Bounded sessions make changes easier to review and help prevent long-running agent workflows from becoming difficult to manage.

## Recommended Playbook Article

**Title:**

From Vibe Coding to Verifiable Engineering

**Sections:**

1. Why unrestricted agent execution creates engineering risk.
2. How to structure bounded development sessions.
3. Research before implementation.
4. Writing useful specifications.
5. Independent verification.
6. Managing context between sessions.
7. Recording evidence and decisions.
8. When human approval is necessary.

### Suggested Website Copy

AI-native engineering doesn't mean removing engineering discipline.

It means adapting that discipline to systems capable of generating and modifying software autonomously.

We structure agent workflows around explicit objectives, controlled execution, and measurable acceptance criteria.

---

# 12. Independent Verification

## Recommendation

Make verification architecture a visible component of the Engineering and Model Testing pages.

## Concept

An AI coding agent should not be the sole authority determining whether its own work is correct.

A separate verifier should evaluate the resulting changes.

### Example Architecture

```text
          Task Definition
                |
                v
         Coding Agent
                |
                v
         Generated Patch
                |
                v
      Independent Verifier
                |
       +--------+--------+
       |                 |
     Pass               Fail
       |                 |
       v                 v
  Retain Evidence   Diagnose Failure
       |                 |
       +--------+--------+
                |
                v
          Final Result
```

## Benefits

- Reduces dependence on agent self-assessment.
- Supports reproducible evaluation.
- Helps prevent test contamination.
- Enables consistent scoring.
- Makes failures easier to investigate.

### Proposed Website Copy

**Headline:**

The agent doesn't grade its own homework.

**Copy:**

We separate implementation from verification.

Agent-generated changes are evaluated against defined acceptance criteria in controlled environments, producing evidence that can be inspected independently.

This allows teams to distinguish claimed completion from verified correctness.

---

# 13. Reproducibility and Evidence Retention

## Recommendation

Introduce reproducibility as a core feature of Frontier's evaluation services.

## What Should Be Retained

For every evaluation:

- Task definition.
- Dataset version.
- Model identifier.
- Model version.
- Harness version.
- Prompt configuration.
- Reasoning effort.
- Tool configuration.
- Execution environment.
- Generated output.
- Verification results.
- Failure classification.
- Token usage.
- Cost observations.
- Execution time.
- Logs and relevant artifacts.

## Proposed Website Section

**Headline:**

Every result should have a trail of evidence.

**Copy:**

A benchmark score without its underlying configuration is difficult to reproduce and easy to misinterpret.

Our evaluation approach retains the information needed to understand how a result was produced, investigate failures, and compare future system changes against a reliable baseline.

## Business Benefits

This supports:

- Model upgrade decisions.
- Regression investigations.
- Compliance reviews.
- Vendor comparisons.
- Cost optimization.
- Long-term performance tracking.

---

# 14. Continuous Evaluation and Release Gates

## Recommendation

Expand Frontier's offering beyond one-time benchmarking.

Introduce continuous evaluation as an operational capability.

## Concept

Changes to any component of an AI system can affect performance.

Examples include:

- Model upgrades.
- Prompt revisions.
- Harness updates.
- New tools.
- Retrieval changes.
- Routing policies.
- Reasoning configurations.
- Dependency upgrades.

These changes should trigger appropriate evaluations.

### Proposed Workflow

```text
         System Change
               |
               v
       Evaluation Dataset
               |
               v
         Run Test Suite
               |
               v
       Compare to Baseline
               |
       +-------+-------+
       |       |       |
     Quality  Cost   Latency
       |       |       |
       +-------+-------+
               |
               v
        Regression Check
               |
       +-------+-------+
       |               |
     Approve          Hold
```

## Proposed Website Copy

**Headline:**

Every AI update is a potential regression.

**Copy:**

Models, prompts, tools, and agent frameworks evolve continuously.

We help organizations establish evaluation pipelines that measure the impact of changes before they reach production.

Instead of relying on assumptions about newer models or configurations, teams can make release decisions using evidence from their own workloads.

---

# 15. Create a Flagship Wharf Research Page

## Proposed URL

`/research/wharf-deepswe`

## Proposed Page Structure

### Section 1 — Hero

**Headline:**

What thousands of coding-agent trials reveal about AI reliability.

**Subheadline:**

An empirical investigation into model performance, agent harnesses, execution configurations, cost, and verification.

**CTAs:**

- Explore the Results
- Read the Methodology
- View the Repository

### Section 2 — Research Overview

Explain:

- What DeepSWE measures.
- Why repeated attempts matter.
- Which configurations were tested.
- How success was verified.
- Which metrics were collected.

### Section 3 — Key Findings

Feature three primary findings:

**Finding 01 — Harnesses influence performance.**

The same model can behave differently under different execution frameworks.

**Finding 02 — Cost and quality must be evaluated together.**

More expensive configurations do not necessarily produce better outcomes.

**Finding 03 — Reliability extends beyond passing a task.**

Consistency, regressions, infrastructure failures, and verification quality matter.

### Section 4 — Interactive Results

Provide:

- Quality-versus-cost scatterplot.
- Model and harness comparison table.
- Task-level reliability heatmap.
- Regression analysis.
- Cost coverage indicators.

### Section 5 — Methodology

Explain the benchmark's execution and verification architecture.

### Section 6 — Limitations

Clearly explain:

- Results apply to the tested tasks and configurations.
- Performance may differ on enterprise workloads.
- Some comparisons involve multiple changing variables.
- Repeated attempts are not necessarily independent across tasks.
- Missing observations affect interpretation.
- Benchmark findings can become outdated as models evolve.

### Section 7 — Practical Applications

Connect the research to:

- Enterprise model selection.
- Agent framework selection.
- AI cost optimization.
- Continuous evaluation.
- Deployment reliability.
- Regression detection.

### Section 8 — Research Artifacts

Provide links to the underlying repository, results, methodology, and available data.

---

# 16. Improve the Model Testing Page

## Recommended Additions

### A. Evaluation Dimensions

Introduce a compact matrix:

| Dimension | Question |
|---|---|
| Quality | Does the system produce the correct outcome? |
| Reliability | Does it succeed consistently? |
| Cost | What does verified success cost? |
| Latency | How long does the workflow take? |
| Regression | Does the change break existing behavior? |
| Safety | Does it respect defined boundaries? |
| Reproducibility | Can the result be independently examined? |

### B. Benchmark Methodology

Explain:

- Dataset construction.
- Golden test cases.
- Independent grading.
- Repeated trials.
- Failure classification.
- Statistical uncertainty.
- Versioned configurations.

### C. Evaluation Deliverables

Show what customers receive.

For example:

**AI System Evaluation Report**

Includes:

1. Executive findings.
2. System configurations tested.
3. Dataset description.
4. Quality and reliability scorecards.
5. Cost and latency comparisons.
6. Failure analysis.
7. Regression findings.
8. Recommended configuration.
9. Deployment considerations.
10. Reproducibility artifacts.

### D. Sample Report

Publish a representative sample evaluation report.

If using illustrative data, clearly label it as such.

---

# 17. Strengthen the AI-Native Playbook

## Recommended Article Series

### Article 1

**From Vibe Coding to Verifiable Engineering**

Explain structured agent workflows and the importance of evidence.

### Article 2

**Research, Plan, Implement, Review**

Demonstrate the RPI methodology with a realistic software engineering task.

### Article 3

**Why AI Coding Agents Need Independent Verification**

Explain the separation between implementation and evaluation.

### Article 4

**Understanding AI Benchmark Metrics**

Explain attempt pass rates, task-level success, retries, cost, and reliability.

### Article 5

**The Hidden Importance of Agent Harnesses**

Demonstrate how tool orchestration and execution environments influence results.

### Article 6

**How to Evaluate AI Systems Before Production**

Explain golden datasets, acceptance criteria, regression testing, and release gates.

### Article 7

**The Economics of AI Agents**

Explore cost per attempt, cost per successful task, verification overhead, and escalation strategies.

### Article 8

**Why Model Upgrades Need Regression Testing**

Explain why newer configurations should be tested against existing production requirements.

---

# 18. Website Information Architecture

## Recommended Structure

```text
Frontier Engineering
│
├── Home
│
├── Engineering
│   ├── AI-Native Engineering
│   └── Forward-Deployed Engineering
│
├── Model Testing
│   ├── Evaluation Services
│   ├── Methodology
│   └── Sample Report
│
├── Research
│   └── Wharf / DeepSWE
│
├── Playbook
│   ├── Engineering Practices
│   ├── Evaluation Guides
│   └── Technical Articles
│
└── Contact
```

## Design Principle

Commercial pages should remain understandable to nontechnical buyers.

Research pages should provide the depth expected by technical evaluators.

This creates two layers:

**Layer 1: Business understanding**

What problem does Frontier solve?

**Layer 2: Technical evidence**

How does Frontier solve it, and what evidence supports its approach?

Both audiences should be able to navigate naturally between these layers.

---

# 19. Website Design Recommendations

## Preserve the Existing Brand

Retain the established Frontier Engineering identity:

- Midnight navy.
- Copper accents.
- Ivory backgrounds.
- Slate secondary text.
- Minimalist typography.
- Restrained technical visualizations.

## Recommended Design Improvements

### Use Technical Diagrams

Prioritize:

- Evaluation pipelines.
- Agent execution architecture.
- Verification workflows.
- Model comparison charts.
- Release gate diagrams.

Avoid generic AI imagery.

### Make Metrics Interactive

Where practical, allow users to:

- Filter models.
- Compare harnesses.
- Inspect individual configurations.
- Understand denominators.
- View methodology notes.

### Use Progressive Disclosure

Present a simple explanation first.

Allow interested users to expand technical details.

For example:

**Headline:** What does a 75% pass rate mean?

**Short explanation:** Three out of four measured attempts succeeded.

**Expandable detail:** Planned denominators, missing observations, repeated attempts, and statistical uncertainty.

### Preserve Visual Restraint

The website should feel like an engineering consultancy with serious research capabilities, not a speculative AI startup.

---

# 20. Benchmark Integrity and Editorial Standards

Before publishing research claims, establish a simple review process.

## Claims Registry

Maintain a table containing:

| Field | Purpose |
|---|---|
| Claim | Exact website statement |
| Source | Repository file or dataset |
| Run | Exact benchmark configuration |
| Formula | How the metric was calculated |
| Date | When the result was generated |
| Limitations | Important qualifications |
| Reviewer | Person approving publication |

## Required Standards

- [ ] Do not combine results from different runs without disclosure.
- [ ] Distinguish planned attempts from completed attempts.
- [ ] Distinguish task-level success from attempt-level success.
- [ ] Disclose missing cost observations.
- [ ] Identify model and harness versions.
- [ ] Avoid unsupported causal claims.
- [ ] Do not equate benchmark performance with production reliability.
- [ ] Clearly identify illustrative examples.
- [ ] Attribute research accurately.
- [ ] Update findings when new evidence changes conclusions.

---

# 21. Implementation Roadmap

## Phase 1 — Accuracy and Credibility

**Priority: Critical**

- [ ] Verify Wharf research ownership and attribution.
- [ ] Reconcile the README and RESULTS benchmark figures.
- [ ] Verify actual completed trial counts.
- [ ] Correct cost and pass-rate terminology.
- [ ] Add benchmark configuration metadata.
- [ ] Establish a canonical claims registry.

**Outcome:** Published technical claims are accurate, reproducible, and defensible.

## Phase 2 — Strengthen Existing Pages

**Priority: High**

- [ ] Add system-level evaluation messaging.
- [ ] Expand the Engineering methodology section.
- [ ] Introduce independent verification.
- [ ] Add a benchmark metrics explainer.
- [ ] Explain regression testing.
- [ ] Add continuous evaluation and release gates.
- [ ] Link relevant sections to Wharf research.

**Outcome:** The existing website communicates a more sophisticated technical methodology.

## Phase 3 — Publish Wharf Research

**Priority: High**

- [ ] Create the Wharf case study page.
- [ ] Build a quality-versus-cost chart.
- [ ] Build a task reliability visualization.
- [ ] Add a versioned benchmark comparison table.
- [ ] Document the methodology.
- [ ] Explain limitations.
- [ ] Link the underlying research artifacts.

**Outcome:** Frontier has a substantial, evidence-backed technical case study.

## Phase 4 — Expand Educational Content

**Priority: Medium**

- [ ] Publish the RPI methodology article.
- [ ] Publish the benchmark metrics guide.
- [ ] Publish the harness comparison article.
- [ ] Publish the independent verification guide.
- [ ] Publish the continuous evaluation guide.
- [ ] Create a sample evaluation report.

**Outcome:** The website becomes a useful technical resource and supports Frontier's education offering.

## Phase 5 — Advanced Research Experience

**Priority: Future**

- [ ] Add interactive benchmark filtering.
- [ ] Add task-level reliability analysis.
- [ ] Add uncertainty estimates where statistically appropriate.
- [ ] Automate chart generation from versioned benchmark exports.
- [ ] Introduce comparison snapshots.
- [ ] Create downloadable evaluation datasets.
- [ ] Develop additional enterprise evaluation case studies.

**Outcome:** Frontier develops a research experience that can evolve alongside its evaluation capabilities.

---

# 22. Final Strategic Recommendation

Wharf should become a central example of Frontier Engineering's technical philosophy.

Its value extends beyond individual benchmark rankings.

It demonstrates an approach to AI engineering built around:

- Structured experimentation.
- Controlled environments.
- Independent verification.
- Reproducible measurements.
- Explicit failure accounting.
- Cost and performance analysis.
- Regression detection.
- Durable execution.
- Evidence-based decision-making.

The most important commercial message is not:

**We know which AI model is best.**

That answer changes as models, tools, and workloads evolve.

The stronger proposition is:

**We help organizations build the engineering practices and evaluation systems needed to determine what works, prove that it works, and keep improving it.**

This connects Frontier Engineering's core offerings:

**Education:** Teach organizations how to use and evaluate AI effectively.

**Engineering:** Build reliable AI-native systems and development workflows.

**Forward-Deployed Engineering:** Apply these capabilities directly to customer environments.

**Model Testing:** Measure quality, reliability, cost, and performance continuously.

## Recommended Closing Statement

**Frontier Engineering**

*Build with evidence. Evaluate with rigor. Improve continuously.*

---

## Research References

- Wharf repository: https://github.com/bartr/wharf
- Wharf results: https://github.com/bartr/wharf/blob/main/RESULTS.md
- Wharf analytics: https://github.com/bartr/wharf/blob/main/ANALYTICS.md
- Wharf retrospective: https://github.com/bartr/skills/blob/main/docs/wharf-retro.md
- Frontier Engineering: https://frontier-engineering-site.vercel.app/engineering
- Frontier Model Testing: https://frontier-engineering-site.vercel.app/model-testing

**Document status:** Recommendations for review and implementation. Benchmark figures are repository-reported and should be regenerated or verified against the underlying exports before being used as definitive marketing claims.