"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { buttonVariants } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <AnimatedThemeToggler
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    />
  );
}
