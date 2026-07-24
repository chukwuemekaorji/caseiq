import { useState, useCallback, useMemo } from "react";
import type { MedicalEvent } from "../types";
import { buildContext, answerQuestion } from "../lib/ai";

export interface QA {
  question: string;
  answer: string;
}

export function useAI(events: MedicalEvent[], incidentDate: Date | null) {
  const [qa, setQa] = useState<QA[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const context = useMemo(() => buildContext(events, incidentDate), [events, incidentDate]);

  const ask = useCallback(
    (question: string) => {
      setBusy("qa");
      setError(null);
      answerQuestion(context, question)
        .then((answer) => setQa((previous) => [{ question, answer }, ...previous]))
        .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong."))
        .finally(() => setBusy(null));
    },
    [context]
  );

  return { qa, busy, error, ask };
}
