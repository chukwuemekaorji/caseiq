"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { parseWorkbook } from "../lib/parseWorkbook";
import type { ParseResult } from "../types";

interface Props {
  onParsed: (results: ParseResult[]) => void;
  title?: string;
  subtitle?: string;
}

export default function FileDrop({ onParsed, title, subtitle }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const handle = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setBusy(true);
      setError(null);
      try {
        onParsed(await Promise.all(list.map(parseWorkbook)));
      } catch (e) {
        setError(e instanceof Error ? e.message : "One of those files could not be read.");
      } finally {
        setBusy(false);
      }
    },
    [onParsed]
  );

  return (
    <div
      className={`rounded-sm border-2 border-dashed p-16 text-center transition-colors ${
        over ? "border-teal bg-teal/5" : "border-ink/20"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (event.dataTransfer.files.length) void handle(event.dataTransfer.files);
      }}
    >
      <Upload className="mx-auto mb-4 text-graphite" size={28} strokeWidth={1.5} />
      <p className="mb-2 font-display text-2xl uppercase">
        {busy ? "Reading records" : (title ?? "Drop one or more medical chronologies")}
      </p>
      <p className="mb-6 font-mono text-xs text-graphite">
        {subtitle ?? ".xlsx · parsed in your browser · nothing is uploaded"}
      </p>
      <label className="cursor-pointer border border-ink px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-ink hover:text-film">
        Choose files
        <input
          accept=".xlsx,.xls"
          className="hidden"
          type="file"
          multiple
          onChange={(event) => {
            if (event.target.files?.length) void handle(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {error && <p className="mt-6 font-mono text-xs text-amber">{error}</p>}
    </div>
  );
}
