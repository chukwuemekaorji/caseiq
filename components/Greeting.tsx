"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import WavingBuddy from "./illustrations/WavingBuddy";

interface Props {
  name: string;
  onDone: () => void;
}

export default function Greeting({ name, onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-4 bg-ink text-film"
      onClick={onDone}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <WavingBuddy className="h-32 w-32 sm:h-40 sm:w-40" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-6xl uppercase tracking-tight sm:text-7xl"
      >
        Hey, <span className="text-coral">{name}</span>
      </motion.h1>
    </motion.div>
  );
}
