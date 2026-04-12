"use client";

import { MotionConfig } from "motion/react";
import { MOTION_TRANSITIONS } from "@/lib/motion-presets";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={MOTION_TRANSITIONS.base}>
      {children}
    </MotionConfig>
  );
}
