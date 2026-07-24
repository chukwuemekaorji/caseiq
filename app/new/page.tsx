"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CaseIntake from "@/components/CaseIntake";
import FileDrop from "@/components/FileDrop";
import { useIdentityContext } from "@/components/IdentityProvider";
import { mergeParseResults } from "@/lib/mergeImports";
import type { CaseDraft, ParseResult } from "@/types";

type Mode = "single" | "bulk";

async function createCase(results: ParseResult[], draft?: CaseDraft) {
  const merged = mergeParseResults(results, 1);
  const res = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...merged,
      clientName: draft?.clientName,
      matterNumber: draft?.matterNumber,
    }),
  });
  if (!res.ok) throw new Error("Could not save that case.");
  return (await res.json()) as { caseId: string };
}

export default function NewCasePage() {
  const identity = useIdentityContext();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("single");
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSingleUpload = async (results: ParseResult[]) => {
    setBusy(true);
    setError(null);
    try {
      const { caseId } = await createCase(results, draft ?? undefined);
      router.push(`/cases/${caseId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  const handleBulkUpload = async (results: ParseResult[]) => {
    setBusy(true);
    setError(null);
    try {
      for (const result of results) {
        await createCase([result]);
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Some files could not be saved.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-film text-ink">
      <header className="border-b border-ink/10 px-8 py-5 flex items-center gap-4">
        <Link href="/" className="font-display text-3xl uppercase tracking-tight">
          CaseIQ
        </Link>
        <span className="ml-auto font-mono text-xs text-graphite uppercase tracking-widest">
          Hey, {identity.name} ·{" "}
          <button type="button" onClick={identity.clear} className="underline hover:text-ink">
            not you?
          </button>
        </span>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-8 py-12">
        <div className="flex gap-2 font-mono text-xs uppercase tracking-widest">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`border px-3 py-1.5 ${
              mode === "single" ? "border-ink bg-ink text-film" : "border-ink/30 text-graphite"
            }`}
          >
            New case
          </button>
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`border px-3 py-1.5 ${
              mode === "bulk" ? "border-ink bg-ink text-film" : "border-ink/30 text-graphite"
            }`}
          >
            Bulk import (multiple cases)
          </button>
        </div>

        {busy && (
          <p className="font-mono text-xs uppercase tracking-widest text-graphite">Saving…</p>
        )}
        {error && <p className="font-mono text-xs text-amber">{error}</p>}

        {mode === "single" ? (
          !draft ? (
            <CaseIntake onContinue={setDraft} />
          ) : (
            <FileDrop onParsed={handleSingleUpload} />
          )
        ) : (
          <div>
            <p className="mb-4 text-sm text-ink/70">
              Drop several workbooks at once — each becomes its own case, named from its file. You can add a client
              name and matter number afterward from the case view.
            </p>
            <FileDrop
              onParsed={handleBulkUpload}
              title="Drop one or more case files"
              subtitle=".xlsx · each file becomes its own case"
            />
          </div>
        )}
      </main>
    </div>
  );
}
