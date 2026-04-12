"use client";

import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";
import { cn } from "@/lib/utils";

function BoneyardFrame({
  name,
  className,
  children,
}: {
  name: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <BoneyardSkeleton
      loading
      name={name}
      animate="shimmer"
      transition={220}
      stagger={60}
      className={className}
      fallback={children}
    >
      {children}
    </BoneyardSkeleton>
  );
}

export function PageLoadingSkeleton({ className }: { className?: string }) {
  const layout = (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10",
        className,
      )}
    >
      <div className="h-10 w-44 animate-pulse rounded-lg bg-muted/55" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-muted/50" />
        <div className="h-40 animate-pulse rounded-xl bg-muted/45" />
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-muted/45" />
    </div>
  );

  return <BoneyardFrame name="page-loading-v1">{layout}</BoneyardFrame>;
}

export function TableLoadingSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  const layout = (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <div className="h-12 w-full animate-pulse border-b bg-muted/45" />
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-3">
            <div className="col-span-2 h-4 animate-pulse rounded bg-muted/50" />
            <div className="h-4 animate-pulse rounded bg-muted/45" />
            <div className="h-4 animate-pulse rounded bg-muted/45" />
            <div className="h-4 animate-pulse rounded bg-muted/45" />
            <div className="h-4 animate-pulse rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );

  return <BoneyardFrame name="table-loading-v1">{layout}</BoneyardFrame>;
}

export function ListLoadingSkeleton({
  items = 5,
  className,
}: {
  items?: number;
  className?: string;
}) {
  const layout = (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="rounded-md border p-3">
          <div className="h-4 w-40 animate-pulse rounded bg-muted/50" />
          <div className="mt-2 h-3 w-56 animate-pulse rounded bg-muted/45" />
          <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted/40" />
        </div>
      ))}
    </div>
  );

  return <BoneyardFrame name="list-loading-v1">{layout}</BoneyardFrame>;
}

export function InlineTextLoadingSkeleton({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const layout = (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-3 animate-pulse rounded bg-muted/50",
            index === lines - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );

  return <BoneyardFrame name="inline-loading-v1">{layout}</BoneyardFrame>;
}

export function ButtonLoadingSkeleton({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  const layout = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "h-3.5 w-3.5 animate-pulse rounded-full",
          inverted ? "bg-white/75" : "bg-muted/55",
        )}
      />
      <span
        className={cn(
          "h-3.5 w-20 animate-pulse rounded",
          inverted ? "bg-white/70" : "bg-muted/50",
        )}
      />
    </span>
  );

  return (
    <BoneyardFrame name="button-loading-v1" className="inline-flex">
      {layout}
    </BoneyardFrame>
  );
}
