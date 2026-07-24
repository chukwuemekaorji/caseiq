import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { parseWorkbook } from "../lib/parseWorkbook";
import type { ParseResult } from "../types";

export default function FileDrop({ onParsed }: { onParsed: (result: ParseResult) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const handle = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        onParsed(await parseWorkbook(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "That file could not be read.");
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
        const file = event.dataTransfer.files[0];
        if (file) void handle(file);
      }}
    >
      <Upload className="mx-auto mb-4 text-graphite" size={28} strokeWidth={1.5} />
      <p className="mb-2 font-display text-2xl uppercase">
        {busy ? "Reading records" : "Drop a medical chronology"}
      </p>
      <p className="mb-6 font-mono text-xs text-graphite">
        .xlsx · parsed in your browser · nothing is uploaded
      </p>
      <label className="cursor-pointer border border-ink px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-ink hover:text-film">
        Choose file
        <input
          accept=".xlsx,.xls"
          className="hidden"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handle(file);
          }}
        />
      </label>
      {error && <p className="mt-6 font-mono text-xs text-amber">{error}</p>}
    </div>
  );
}