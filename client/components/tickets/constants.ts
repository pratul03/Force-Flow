import { TicketPriority, TicketStatus } from "@/lib/types";

export type TicketColumnMeta = {
  status: TicketStatus;
  title: string;
  subtitle: string;
  borderClass: string;
};

export const TICKET_COLUMNS: TicketColumnMeta[] = [
  {
    status: "OPEN",
    title: "Open",
    subtitle: "Newly raised tickets",
    borderClass: "border-slate-300 dark:border-slate-700/80",
  },
  {
    status: "ASSIGNED",
    title: "Assigned",
    subtitle: "Assigned to support",
    borderClass: "border-blue-300 dark:border-blue-500/40",
  },
  {
    status: "IN_PROGRESS",
    title: "In Progress",
    subtitle: "Work in progress",
    borderClass: "border-amber-300 dark:border-amber-500/40",
  },
  {
    status: "RESOLVED",
    title: "Done",
    subtitle: "Resolved successfully",
    borderClass: "border-emerald-300 dark:border-emerald-500/40",
  },
  {
    status: "FAILED",
    title: "Failed",
    subtitle: "Could not complete",
    borderClass: "border-rose-300 dark:border-rose-500/40",
  },
  {
    status: "TIMED_OUT",
    title: "Timed Out",
    subtitle: "Exceeded expected turnaround",
    borderClass: "border-fuchsia-300 dark:border-fuchsia-500/40",
  },
];

export const PRIORITY_ORDER: Record<TicketPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const TERMINAL_STATUSES: TicketStatus[] = ["RESOLVED", "FAILED", "TIMED_OUT"];
