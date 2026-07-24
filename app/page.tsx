"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useIdentityContext } from "@/components/IdentityProvider";
import { useCaseList } from "@/hooks/useCaseList";
import ReadingBuddy from "@/components/illustrations/ReadingBuddy";

export default function CaseListPage() {
  const identity = useIdentityContext();
  const { cases, loading, error } = useCaseList();

  return (
    <div className="min-h-screen bg-film text-ink">
      <header className="border-b border-ink/10 px-8 py-5 flex items-center gap-4">
        <Image src="/logo.png" alt="CaseIQ" width={604} height={137} className="h-9 w-auto" priority />
        <span className="ml-auto font-mono text-xs text-graphite uppercase tracking-widest">
          Hey, {identity.name} ·{" "}
          <button type="button" onClick={identity.clear} className="underline hover:text-ink">
            not you?
          </button>
        </span>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 border border-ink px-3 py-1 font-mono text-xs uppercase tracking-widest"
        >
          <Plus size={12} /> New case
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-8 py-12">
        <h2 className="mb-6 font-display text-2xl uppercase tracking-tight">Your cases</h2>

        {error && (
          <p className="mb-6 border border-amber/40 bg-amber/5 px-4 py-3 font-mono text-xs uppercase tracking-widest text-amber">
            Couldn&apos;t reach the database — the case list may be incomplete.
          </p>
        )}

        {loading ? (
          <p className="font-mono text-xs uppercase tracking-widest text-graphite">Loading…</p>
        ) : cases.length === 0 ? (
          <div className="border border-dashed border-ink/20 p-12 text-center">
            <ReadingBuddy className="mx-auto mb-4 h-32 w-32" />
            <p className="mb-4 text-sm text-graphite">No cases yet.</p>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 border border-ink px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-coral hover:text-film"
            >
              Create your first case
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink/10 border-t border-ink/10">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-white/40"
              >
                <div>
                  <p className="font-display text-xl uppercase tracking-tight">
                    {c.clientName ?? c.caseName ?? "Untitled case"}
                  </p>
                  <p className="font-mono text-xs text-graphite">
                    {c.matterNumber ? `${c.matterNumber} · ` : ""}
                    {c.eventCount} record{c.eventCount === 1 ? "" : "s"} · created{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-mono text-xs uppercase tracking-widest text-teal">Open →</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
