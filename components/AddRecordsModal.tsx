"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import FileDrop from "./FileDrop";
import type { ParseResult } from "../types";

interface Props {
  onAdd: (results: ParseResult[]) => void;
  onClose: () => void;
}

export default function AddRecordsModal({ onAdd, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl bg-film p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-graphite hover:text-ink"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">Keep the case current</p>
        <h2 className="mb-6 font-display text-2xl uppercase tracking-tight">Add records to this case</h2>
        <FileDrop
          onParsed={(results) => {
            onAdd(results);
            onClose();
          }}
          title="Drop additional records"
          subtitle=".xlsx · merged into the existing timeline · nothing is uploaded"
        />
      </motion.div>
    </div>
  );
}
