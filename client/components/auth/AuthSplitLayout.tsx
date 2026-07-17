"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import { MOTION_TRANSITIONS } from "@/lib/motion-presets";
import Link from "next/link";

type AuthScreen = "login" | "register";

type Speech = {
  title: string;
  body: string;
  cue: string;
};

const LOGIN_SPEECHES: Speech[] = [
  {
    title: "Welcome back, leaders.",
    body: "Your people data, leave requests, and timesheets are already in motion. Pick up exactly where your team left off.",
    cue: "Shift starts in 3 minutes",
  },
  {
    title: "Run HR like a command center.",
    body: "Track attendance, approvals, and performance with one focused workflow built for fast decisions.",
    cue: "4 approvals waiting",
  },
  {
    title: "Daily operations, zero chaos.",
    body: "From onboarding to payroll prep, every task stays visible, assigned, and on schedule.",
    cue: "19 employees online",
  },
];

const REGISTER_SPEECHES: Speech[] = [
  {
    title: "Build your HROS in minutes.",
    body: "Create your workspace, invite your team, and launch a modern operating layer for people and process.",
    cue: "First setup takes under 10 mins",
  },
  {
    title: "One platform, every workflow.",
    body: "Employee records, tickets, reports, and leave approvals connect in one predictable system.",
    cue: "No-code setup",
  },
  {
    title: "Scale people operations with confidence.",
    body: "Design repeatable workflows now so your team grows without adding operational overhead.",
    cue: "Ready for 5 to 500 employees",
  },
];

export function AuthSplitLayout({
  screen,
  children,
}: {
  screen: AuthScreen;
  children: React.ReactNode;
}) {
  const speeches = useMemo(
    () => (screen === "register" ? REGISTER_SPEECHES : LOGIN_SPEECHES),
    [screen],
  );
  const [speechIndex, setSpeechIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSpeechIndex((current) => (current + 1) % speeches.length);
    }, 4300);

    return () => window.clearInterval(interval);
  }, [speeches]);

  const activeSpeech = speeches[speechIndex];

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.06fr_0.94fr]">
        <section className="relative overflow-hidden bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:px-14 lg:py-12">
          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col justify-between gap-10">
            <div className="flex flex-col items-start gap-4">
              <Link href="/" className="group inline-flex">
                <span className="relative block h-24 w-48 sm:h-24 sm:w-56 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur-md shadow-[0_4px_20px_rgba(255,255,255,0.06)] transition-all duration-300 group-hover:bg-primary-foreground/10 group-hover:shadow-[0_4px_24px_rgba(255,255,255,0.1)]">
                  <Image
                    src="/transparent-logo.png"
                    alt="FlowForce"
                    fill
                    sizes="(min-width: 640px) 256px, 224px"
                    className="object-contain object-center transition-transform duration-300 ease-out group-hover:scale-[1.02] mix-blend-color-dodge"
                    priority
                  />
                </span>
              </Link>

              <div className="inline-flex w-fit items-center rounded-2xl border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2.5 backdrop-blur-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/70">
                    FlowForce HRM
                  </p>
                  <p className="text-sm font-semibold tracking-wide">
                    Workforce Control Deck
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <p className="max-w-md text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                Shift planning, approvals, people records, and insights built
                into one focused operating experience.
              </p>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSpeech.title}
                  initial={{ opacity: 0, y: 12, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={MOTION_TRANSITIONS.reveal}
                  className="rounded-3xl border border-primary-foreground/20 bg-primary-foreground/10 p-6 backdrop-blur-sm"
                >
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/85">
                    Live Pulse
                  </p>
                  <h2 className="text-2xl font-semibold leading-tight text-primary-foreground sm:text-3xl">
                    {activeSpeech.title}
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/90 sm:text-base">
                    {activeSpeech.body}
                  </p>
                  <div className="mt-5 inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs text-primary-foreground/85">
                    {activeSpeech.cue}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-2">
                {speeches.map((speech, index) => (
                  <motion.span
                    key={speech.title}
                    className="h-1.5 rounded-full"
                    initial={false}
                    animate={{
                      width: speechIndex === index ? 26 : 8,
                      opacity: speechIndex === index ? 1 : 0.45,
                      backgroundColor:
                        speechIndex === index
                          ? "rgb(255 255 255 / 0.95)"
                          : "rgb(186 230 253 / 0.6)",
                    }}
                    transition={MOTION_TRANSITIONS.base}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80">
                  Accuracy
                </p>
                <p className="mt-2 text-xl font-semibold text-primary-foreground">
                  99.4%
                </p>
              </div>
              <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80">
                  Resolution
                </p>
                <p className="mt-2 text-xl font-semibold text-primary-foreground">
                  2.1h
                </p>
              </div>
              <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80">
                  Visibility
                </p>
                <p className="mt-2 text-xl font-semibold text-primary-foreground">
                  24/7
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden bg-background px-5 py-10 sm:px-8 lg:px-12">
          <div className="relative w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
