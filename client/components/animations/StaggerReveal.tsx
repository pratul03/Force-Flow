"use client";

import * as motion from "motion/react-client";

import {
  createRevealUpVariants,
  createStaggerContainerVariants,
} from "@/lib/motion-presets";

export function StaggerContainer({
  children,
  className,
  delayChildren = 0,
  staggerChildren = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  return (
    <motion.div
      variants={createStaggerContainerVariants(delayChildren, staggerChildren)}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  distance = 12,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  return (
    <motion.div
      variants={createRevealUpVariants(distance)}
      className={className}
    >
      {children}
    </motion.div>
  );
}
