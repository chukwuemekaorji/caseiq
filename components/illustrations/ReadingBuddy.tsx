"use client";

import { motion } from "framer-motion";

export default function ReadingBuddy({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 160 170"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="80" cy="150" rx="50" ry="9" fill="#0B1520" opacity="0.08" />

      {/* crossed legs, seated */}
      <path d="M35 138 Q80 158 125 138 L125 150 Q80 170 35 150 Z" fill="#1B4F63" />

      {/* body */}
      <rect x="46" y="72" width="68" height="66" rx="30" fill="#2DD4A7" />

      {/* arms holding the clipboard */}
      <rect x="34" y="94" width="15" height="38" rx="7.5" fill="#2DD4A7" />
      <rect x="111" y="94" width="15" height="38" rx="7.5" fill="#2DD4A7" />

      {/* clipboard */}
      <rect x="56" y="88" width="48" height="58" rx="6" fill="#F4F6F7" stroke="#0B1520" strokeWidth="2" />
      <rect x="70" y="82" width="20" height="10" rx="3" fill="#FFC145" />
      <rect x="65" y="104" width="30" height="4" rx="2" fill="#8A939B" />
      <rect x="65" y="114" width="30" height="4" rx="2" fill="#8A939B" />
      <rect x="65" y="124" width="20" height="4" rx="2" fill="#8A939B" />

      {/* head */}
      <circle cx="80" cy="44" r="27" fill="#8B5CF6" />
      <circle cx="71" cy="42" r="3.2" fill="#0B1520" />
      <circle cx="89" cy="42" r="3.2" fill="#0B1520" />
      <path d="M71 53 Q80 59 89 53" stroke="#0B1520" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* floating sparkle accents */}
      <motion.circle
        cx="24" cy="60" r="5" fill="#FF6B6B"
        animate={{ y: [0, -8, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="136" cy="76" r="4" fill="#FFC145"
        animate={{ y: [0, 7, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
    </motion.svg>
  );
}
