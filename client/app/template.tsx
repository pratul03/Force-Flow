"use client";

import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { usePathname } from "next/navigation";
import { MOTION_TRANSITIONS } from "@/lib/motion-presets";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        layout
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
        transition={MOTION_TRANSITIONS.page}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
