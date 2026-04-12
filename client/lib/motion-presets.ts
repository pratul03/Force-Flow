import type { Transition, Variants } from "motion/react";

export const MOTION_TRANSITIONS = {
  base: {
    duration: 0.24,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,
  page: {
    type: "spring",
    damping: 24,
    stiffness: 280,
    mass: 0.7,
  } satisfies Transition,
  layout: {
    type: "spring",
    damping: 24,
    stiffness: 280,
    mass: 0.72,
  } satisfies Transition,
  panel: {
    type: "spring",
    damping: 30,
    stiffness: 320,
    mass: 0.75,
  } satisfies Transition,
  reveal: {
    type: "spring",
    damping: 26,
    stiffness: 300,
    mass: 0.72,
  } satisfies Transition,
} as const;

export function createStaggerContainerVariants(
  delayChildren = 0,
  staggerChildren = 0.08,
): Variants {
  return {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        delayChildren,
        staggerChildren,
        when: "beforeChildren",
      },
    },
  };
}

export function createRevealUpVariants(distance = 12): Variants {
  return {
    hidden: {
      opacity: 0,
      y: distance,
      filter: "blur(3px)",
    },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: MOTION_TRANSITIONS.reveal,
    },
  };
}
