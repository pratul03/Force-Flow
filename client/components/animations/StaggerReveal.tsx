"use client";

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
    <div className={className}>
      {children}
    </div>
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
    <div className={className}>
      {children}
    </div>
  );
}
