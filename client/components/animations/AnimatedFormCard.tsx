"use client";

import * as motion from "motion/react-client";
import { MOTION_TRANSITIONS } from "@/lib/motion-presets";

export function AnimatedFormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.985 }}
      transition={MOTION_TRANSITIONS.reveal}
      className={className}
    >
      {children}
    </motion.div>
  );
}
