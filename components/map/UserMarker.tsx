"use client";

import { motion } from "framer-motion";

interface Props {
  x: number;
  y: number;
}

export function UserMarker({ x, y }: Props) {
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={18}
        fill="#38bdf8"
        opacity={0.2}
        animate={{ r: [14, 22, 14], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle
        cx={x}
        cy={y}
        r={8}
        fill="#38bdf8"
        stroke="#0f172a"
        strokeWidth={2}
      />
      <circle cx={x} cy={y} r={3} fill="#0f172a" />
    </g>
  );
}
