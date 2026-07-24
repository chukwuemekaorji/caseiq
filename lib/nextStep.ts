export interface NextStep {
  label: string;
  detail?: string;
}

/**
 * A single recommended next action, derived from how far the case has
 * progressed. Deliberately conservative — it only points at things this
 * build actually has (confirming the incident, reviewing import gaps,
 * running the AI panels), not the fuller case lifecycle in the PRD.
 */
export function computeNextStep(input: {
  incidentConfirmed: boolean;
  skippedCount: number;
  hasStory: boolean;
  hasMoments: boolean;
  gapsCount: number;
}): NextStep {
  if (!input.incidentConfirmed) {
    return { label: "Confirm the incident date" };
  }
  if (input.skippedCount > 0) {
    const n = input.skippedCount;
    return { label: `Review ${n} skipped record${n === 1 ? "" : "s"}`, detail: "See the import summary above" };
  }
  if (!input.hasStory) {
    return { label: "Generate the case story", detail: "See the story panel below" };
  }
  if (!input.hasMoments) {
    return { label: "Identify the key moments", detail: "See the key moments panel below" };
  }
  if (input.gapsCount > 0) {
    const n = input.gapsCount;
    return { label: "Review treatment gaps", detail: `${n} gap${n === 1 ? "" : "s"} over 60 days` };
  }
  return { label: "Case ready", detail: "Explore the timeline or ask a question about the record" };
}
