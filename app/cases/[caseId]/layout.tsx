"use client";

import type { ReactNode } from "react";
import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { LayoutList } from "lucide-react";
import { useIdentityContext } from "@/components/IdentityProvider";
import { useCaseSummary } from "@/hooks/useCaseSummary";

const TABS = [
  { href: "overview", label: "Overview" },
  { href: "timeline", label: "Timeline" },
  { href: "context", label: "Client context" },
  { href: "evidence", label: "Evidence" },
  { href: "evidence-composition", label: "Evidence composition" },
  { href: "story", label: "Story" },
  { href: "presentation", label: "Presentation" },
  { href: "similar-cases", label: "Similar cases" },
  { href: "moot-court", label: "Moot court" },
  { href: "ask", label: "Ask the record" },
];

export default function CaseLayout({ children }: { children: ReactNode }) {
  const identity = useIdentityContext();
  const params = useParams<{ caseId: string }>();
  const pathname = usePathname();
  const { caseRecord } = useCaseSummary(params.caseId);

  return (
    <div className="min-h-screen bg-film text-ink">
      <header className="flex items-center gap-4 border-b border-ink/10 px-8 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-graphite hover:text-ink"
        >
          <LayoutList size={12} /> My cases
        </Link>
        {caseRecord && (
          <span className="font-mono text-xs text-graphite uppercase tracking-widest">
            {caseRecord.clientName ?? caseRecord.caseName ?? "Untitled case"}
            {caseRecord.matterNumber ? ` · ${caseRecord.matterNumber}` : ""}
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-graphite uppercase tracking-widest">
          Hey, {identity.name} ·{" "}
          <button type="button" onClick={identity.clear} className="underline hover:text-ink">
            not you?
          </button>
        </span>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-ink/10 bg-white/40 px-8 py-2 print:hidden">
        {TABS.map((tab) => {
          const href = `/cases/${params.caseId}/${tab.href}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.href}
              href={href}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                active ? "bg-ink text-film" : "text-graphite hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto max-w-[1400px] px-8 py-10">{children}</main>
    </div>
  );
}
