import { BackendTicket, TicketPriority, TicketStatus } from "@/lib/types";

export type TicketSla = {
  ageMinutes: number;
  timeToAssignMinutes: number | null;
  timeToResolveMinutes: number | null;
  
  // SLA Engine Thresholds
  maxAssignMinutes: number;
  maxResolveMinutes: number;
  isAssignBreached: boolean;
  isResolveBreached: boolean;
  isAssignWarning: boolean; // < 20% time left
  isResolveWarning: boolean;
};

// Same as backend SLA_THRESHOLDS
const SLA_THRESHOLDS_HOURS = {
  CRITICAL: { assign: 1, resolve: 4 },
  HIGH: { assign: 4, resolve: 24 },
  MEDIUM: { assign: 24, resolve: 72 },
  LOW: { assign: 48, resolve: 120 },
};

export function formatName(
  user?: { firstName?: string; lastName?: string; email?: string } | null,
) {
  if (!user) return "Unassigned";
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return fullName || user.email || "Unknown";
}

export function priorityBadgeVariant(priority: TicketPriority) {
  if (priority === "CRITICAL") return "destructive" as const;
  if (priority === "HIGH") return "default" as const;
  return "secondary" as const;
}

export function statusBadgeClass(status: TicketStatus) {
  if (status === "RESOLVED") return "bg-emerald-100 text-emerald-800";
  if (status === "FAILED") return "bg-rose-100 text-rose-800";
  if (status === "TIMED_OUT") return "bg-fuchsia-100 text-fuchsia-800";
  if (status === "IN_PROGRESS") return "bg-amber-100 text-amber-800";
  if (status === "ASSIGNED") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

export function canAssignByRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "HR_MANAGER";
}

export function minutesBetween(from?: string | null, to?: string | null) {
  if (!from || !to) {
    return null;
  }

  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();

  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
    return null;
  }

  return Math.max(0, Math.round((toMs - fromMs) / 60000));
}

export function computeSla(ticket: BackendTicket): TicketSla {
  const ageTo = ticket.resolvedAt || new Date().toISOString();
  const ageMinutes = minutesBetween(ticket.createdAt, ageTo) ?? 0;
  const timeToAssignMinutes = minutesBetween(ticket.createdAt, ticket.assignedAt || null);
  const timeToResolveMinutes = minutesBetween(ticket.createdAt, ticket.resolvedAt || null);
  
  const limits = SLA_THRESHOLDS_HOURS[ticket.priority];
  const maxAssignMinutes = limits.assign * 60;
  const maxResolveMinutes = limits.resolve * 60;
  
  const currentAssignCompare = timeToAssignMinutes ?? ageMinutes;
  const currentResolveCompare = timeToResolveMinutes ?? ageMinutes;

  return {
    ageMinutes,
    timeToAssignMinutes,
    timeToResolveMinutes,
    maxAssignMinutes,
    maxResolveMinutes,
    isAssignBreached: currentAssignCompare > maxAssignMinutes,
    isResolveBreached: currentResolveCompare > maxResolveMinutes,
    isAssignWarning: timeToAssignMinutes === null && (maxAssignMinutes - currentAssignCompare) < (maxAssignMinutes * 0.2),
    isResolveWarning: timeToResolveMinutes === null && (maxResolveMinutes - currentResolveCompare) < (maxResolveMinutes * 0.2),
  };
}

export function formatDuration(totalMinutes: number | null) {
  if (totalMinutes === null) {
    return "-";
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const mins = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
}
