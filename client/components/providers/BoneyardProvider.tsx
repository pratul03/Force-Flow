"use client";

import { configureBoneyard } from "boneyard-js/react";

let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) {
    return;
  }

  configureBoneyard({
    animate: "shimmer",
    transition: 220,
    stagger: 60,
    color: "rgba(15, 23, 42, 0.09)",
    darkColor: "rgba(255, 255, 255, 0.1)",
  });

  isConfigured = true;
}

export function BoneyardProvider({ children }: { children: React.ReactNode }) {
  ensureConfigured();
  return <>{children}</>;
}
