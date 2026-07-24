import { useState, useCallback, useMemo } from "react";
import type { MedicalEvent } from "../types";
import type { TreatmentGap } from "../lib/analyze";
import {
  buildContext,
  generateStory,
  generateKeyMoments,
  answerQuestion,
  runStressTest,
  type AIKeyMoment,
  type Challenge,
} from "../lib/ai";

export interface QA {
  question: string;
  answer: string;
}

export function useAI(events: MedicalEvent[], incidentDate: Date | null, gaps: TreatmentGap[]) {
  const [story, setStory] = useState<string | null>(null);
  const [moments, setMoments] = useState<AIKeyMoment[] | null>(null);
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [qa, setQa] = useState<QA[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const context = useMemo(() => buildContext(events, incidentDate), [events, incidentDate]);

  const gapSummary = useMemo(
    () =>
      gaps.length
        ? gaps
            .map((gap) => `${gap.days} days (${gap.start.toLocaleDateString()} → ${gap.end.toLocaleDateString()})`)
            .join("; ")
        : "none over 60 days",
    [gaps]
  );

  const guard = useCallback(async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }, []);

  const runStory = useCallback(
    () => guard("story", async () => setStory(await generateStory(context))),
    [guard, context]
  );

  const runMoments = useCallback(
    () => guard("moments", async () => setMoments(await generateKeyMoments(context))),
    [guard, context]
  );

  const runChallenges = useCallback(
    () => guard("stress", async () => setChallenges(await runStressTest(context, gapSummary))),
    [guard, context, gapSummary]
  );

  const ask = useCallback(
    (question: string) =>
      guard("qa", async () => {
        const answer = await answerQuestion(context, question);
        setQa((previous) => [{ question, answer }, ...previous]);
      }),
    [guard, context]
  );

  const clearAll = useCallback(() => {
    setStory(null);
    setMoments(null);
    setChallenges(null);
    setQa([]);
    setError(null);
  }, []);

  return {
    story,
    moments,
    challenges,
    qa,
    busy,
    error,
    runStory,
    runMoments,
    runChallenges,
    ask,
    clearAll,
  };
}