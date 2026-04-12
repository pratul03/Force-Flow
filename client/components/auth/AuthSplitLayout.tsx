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
        <section className="relative overflow-hidden bg-[linear-gradient(145deg,#0f274f_0%,#1b4f97_52%,#2d7de7_100%)] px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-12 dark:bg-[linear-gradient(145deg,#050a14_0%,#0b1832_52%,#15396e_100%)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-28 top-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-300/30" />
            <div className="absolute -right-14 -top-8 h-52 w-52 rounded-full bg-blue-100/15 blur-2xl dark:bg-blue-200/20" />
            <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-400/25" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(255,255,255,0.16),transparent_40%),radial-gradient(circle_at_78%_65%,rgba(255,255,255,0.1),transparent_32%)]" />
          </div>

          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col justify-between gap-10">
            <div className="flex flex-col items-start gap-4">
              <Link href="/" className="group inline-flex">
                <span className="relative block h-24 w-56 sm:h-28 sm:w-64">
                  <Image
                    src="/flowforce.png"
                    alt="FlowForce"
                    fill
                    sizes="(min-width: 640px) 256px, 224px"
                    className="object-contain object-left transition-transform duration-300 ease-out group-hover:scale-[1.02] mix-blend-difference"
                    priority
                  />
                </span>
              </Link>

              <div className="inline-flex w-fit items-center rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">
                    FlowForce HRM
                  </p>
                  <p className="text-sm font-semibold tracking-wide">
                    Workforce Control Deck
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <p className="max-w-md text-sm leading-relaxed text-blue-100/85 sm:text-base">
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
                  className="rounded-3xl border border-white/22 bg-white/12 p-6 backdrop-blur-sm"
                >
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/85">
                    Live Pulse
                  </p>
                  <h2 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    {activeSpeech.title}
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-blue-50/88 sm:text-base">
                    {activeSpeech.body}
                  </p>
                  <div className="mt-5 inline-flex items-center rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs text-white/85">
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
              <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">
                  Accuracy
                </p>
                <p className="mt-2 text-xl font-semibold text-white">99.4%</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">
                  Resolution
                </p>
                <p className="mt-2 text-xl font-semibold text-white">2.1h</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">
                  Visibility
                </p>
                <p className="mt-2 text-xl font-semibold text-white">24/7</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden bg-[linear-gradient(150deg,#f8fbff_0%,#edf5ff_56%,#f7fbff_100%)] px-5 py-10 sm:px-8 lg:px-12 dark:bg-[linear-gradient(150deg,#090f1b_0%,#0d1729_56%,#101d33_100%)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl dark:bg-sky-400/20" />
            <div className="absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-cyan-300/15 blur-3xl dark:bg-cyan-300/25" />
          </div>
          <div className="relative w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
