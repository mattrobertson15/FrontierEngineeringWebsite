/**
 * Display names for the raw model and agent ids in Wharf's DeepSWE exports. Shared by the
 * site (content/wharf.ts) and the sync script, which fails on any id missing here — so a
 * new model in Wharf's data gets a deliberate name rather than a raw slug.
 *
 * No JSON imports in this file: the sync script loads it directly under Node.
 */

export const deepSweModelNames: Record<string, string> = {
  auto: "Auto",
  "claude-opus-5": "Claude Opus 5",
  "claude-opus-5.5": "Claude Opus 5.5",
  "gemini-3.8-flash": "Gemini 3.8 Flash",
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "gpt-5.6-sol": "GPT-5.6 Sol",
  "gpt-5.6-terra": "GPT-5.6 Terra",
  "gpt-6-astra": "GPT-6 Astra",
  "gpt-6-luna": "GPT-6 Luna",
  "gpt-6.1-sol": "GPT-6.1 Sol",
  hydrafusion: "HydraFusion",
  "muse-spark-1.2-contributor": "Muse Spark 1.2",
};

export const deepSweHarnessNames: Record<string, string> = {
  "copilot-cli": "Copilot",
  "claude-code": "Claude Code",
  "muse-cli": "Muse Code",
};

/** Runs that need more than model + harness release + effort to tell them apart. */
export const deepSweRunLabels: Record<string, string> = {
  "copilot-hydrafusion-max-1.0.95": "HydraFusion (run 1)",
  "copilot-hydrafusion-max-1.0.95-all-2": "HydraFusion (run 2)",
};
