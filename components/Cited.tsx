"use client";

import type { MedicalEvent } from "../types";

interface Props {
  text: string;
  events: MedicalEvent[];
  onCite: (recordNumber: number) => void;
}

/** Turns "[record 42]" into a clickable chip that jumps to that record. */
export default function Cited({ text, events, onCite }: Props) {
  const known = new Set(events.map((event) => event.recordNumber));
  const parts = text.split(/(\[records?\s*[\d,\s]+\])/gi);

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[records?\s*([\d,\s]+)\]$/i);
        if (!match) return <span key={index}>{part}</span>;

        const records = match[1]
          .split(",")
          .map((record) => parseInt(record.trim(), 10))
          .filter((record) => !Number.isNaN(record));

        return (
          <span key={index} className="mx-0.5 inline-flex gap-1">
            {records.map((record) => (
              <button
                key={record}
                onClick={() => onCite(record)}
                disabled={!known.has(record)}
                className={`align-baseline border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                  known.has(record)
                    ? "cursor-pointer border-teal/40 text-teal hover:bg-teal hover:text-film"
                    : "cursor-not-allowed border-amber/40 text-amber"
                }`}
                title={known.has(record) ? `Go to record ${record}` : `Record ${record} is not in this case`}
              >
                {record}
              </button>
            ))}
          </span>
        );
      })}
    </>
  );
}
