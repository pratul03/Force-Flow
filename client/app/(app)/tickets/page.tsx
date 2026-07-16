"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ButtonLoadingSkeleton,
  ListLoadingSkeleton,
  TableLoadingSkeleton,
} from "@/components/ui/loading-skeletons";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from '@tanstack/react-query';
import {
  useTickets,
  useTicketComments,
  useTicketHistory,
  useCreateTicket,
  useAssignTicket,
  useUpdateTicketStatus,
  useAddTicketComment
} from "@/features/tickets/queries";
import { usersApi } from "@/features/users/api";
import {
  BackendTicketComment,
  BackendTicketStatusEvent,
  BackendTicket,
  BackendUser,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";
import { PlusCircle, Send } from "lucide-react";

type TicketColumnMeta = {
  status: TicketStatus;
  title: string;
  subtitle: string;
  borderClass: string;
};

const TICKET_COLUMNS: TicketColumnMeta[] = [
  {
    status: "OPEN",
    title: "Open",
    subtitle: "Newly raised tickets",
    borderClass: "border-slate-300",
  },
  {
    status: "ASSIGNED",
    title: "Assigned",
    subtitle: "Assigned to support",
    borderClass: "border-blue-300",
  },
  {
    status: "IN_PROGRESS",
    title: "In Progress",
    subtitle: "Work in progress",
    borderClass: "border-amber-300",
  },
  {
    status: "RESOLVED",
    title: "Done",
    subtitle: "Resolved successfully",
    borderClass: "border-emerald-300",
  },
  {
    status: "FAILED",
    title: "Failed",
    subtitle: "Could not complete",
    borderClass: "border-rose-300",
  },
  {
    status: "TIMED_OUT",
    title: "Timed Out",
    subtitle: "Exceeded expected turnaround",
    borderClass: "border-fuchsia-300",
  },
];

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const TERMINAL_STATUSES: TicketStatus[] = ["RESOLVED", "FAILED", "TIMED_OUT"];

type TicketSla = {
  ageMinutes: number;
  timeToAssignMinutes: number | null;
  timeToResolveMinutes: number | null;
};

function formatName(
  user?: { firstName?: string; lastName?: string; email?: string } | null,
) {
  if (!user) return "Unassigned";
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return fullName || user.email || "Unknown";
}

function priorityBadgeVariant(priority: TicketPriority) {
  if (priority === "CRITICAL") return "destructive" as const;
  if (priority === "HIGH") return "default" as const;
  return "secondary" as const;
}

function statusBadgeClass(status: TicketStatus) {
  if (status === "RESOLVED") return "bg-emerald-100 text-emerald-800";
  if (status === "FAILED") return "bg-rose-100 text-rose-800";
  if (status === "TIMED_OUT") return "bg-fuchsia-100 text-fuchsia-800";
  if (status === "IN_PROGRESS") return "bg-amber-100 text-amber-800";
  if (status === "ASSIGNED") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

function canAssignByRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "HR_MANAGER";
}

function minutesBetween(from?: string | null, to?: string | null) {
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

function computeSla(ticket: BackendTicket): TicketSla {
  const ageTo = ticket.resolvedAt || new Date().toISOString();
  return {
    ageMinutes: minutesBetween(ticket.createdAt, ageTo) ?? 0,
    timeToAssignMinutes: minutesBetween(
      ticket.createdAt,
      ticket.assignedAt || null,
    ),
    timeToResolveMinutes: minutesBetween(
      ticket.createdAt,
      ticket.resolvedAt || null,
    ),
  };
}

function formatDuration(totalMinutes: number | null) {
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

type TicketCardProps = {
  ticket: BackendTicket;
  canAssign: boolean;
  isBusy: boolean;
  isSelected: boolean;
  supportUsers: BackendUser[];
  onAssign: (ticketId: string, assigneeId: string) => void;
  onSelect: (ticketId: string) => void;
};

function TicketCard({
  ticket,
  canAssign,
  isBusy,
  isSelected,
  supportUsers,
  onAssign,
  onSelect,
}: TicketCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const sla = computeSla(ticket);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) {
      return;
    }

    return draggable({
      element,
      getInitialData: () => ({ ticketId: ticket.id }),
    });
  }, [ticket.id]);

  return (
    <Card
      ref={cardRef}
      onClick={() => onSelect(ticket.id)}
      className={`cursor-grab active:cursor-grabbing border-slate-200 shadow-sm ${
        isSelected ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-5 text-slate-900">
            {ticket.title}
          </h4>
          <Badge variant={priorityBadgeVariant(ticket.priority)}>
            {ticket.priority}
          </Badge>
        </div>

        <p className="text-xs text-slate-600 line-clamp-3">
          {ticket.description}
        </p>

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">
            By: {formatName(ticket.requester)}
          </span>
          <Badge className={statusBadgeClass(ticket.status)}>
            {ticket.status}
          </Badge>
        </div>

        <div className="text-xs text-slate-600">
          Assigned: {formatName(ticket.assignee)}
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">
            TTA: {formatDuration(sla.timeToAssignMinutes)}
          </div>
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">
            TTR: {formatDuration(sla.timeToResolveMinutes)}
          </div>
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">
            Age: {formatDuration(sla.ageMinutes)}
          </div>
        </div>

        {canAssign && (
          <select
            disabled={isBusy}
            value={ticket.assigneeId || ""}
            onChange={(event) => {
              const nextAssigneeId = event.target.value;
              if (!nextAssigneeId || nextAssigneeId === ticket.assigneeId) {
                return;
              }
              onAssign(ticket.id, nextAssigneeId);
            }}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs"
          >
            <option value="">Select support assignee</option>
            {supportUsers.map((member) => (
              <option key={member.id} value={member.id}>
                {formatName(member)} ({member.role})
              </option>
            ))}
          </select>
        )}

        <div className="text-[11px] text-slate-500">
          Updated {new Date(ticket.updatedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

type TicketColumnProps = {
  column: TicketColumnMeta;
  tickets: BackendTicket[];
  busyTicketId: string | null;
  selectedTicketId: string | null;
  canAssign: boolean;
  supportUsers: BackendUser[];
  onAssign: (ticketId: string, assigneeId: string) => void;
  onDropTicket: (ticketId: string, status: TicketStatus) => void;
  onSelect: (ticketId: string) => void;
};

function TicketColumn({
  column,
  tickets,
  busyTicketId,
  selectedTicketId,
  canAssign,
  supportUsers,
  onAssign,
  onDropTicket,
  onSelect,
}: TicketColumnProps) {
  const columnRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    const element = columnRef.current;
    if (!element) {
      return;
    }

    return dropTargetForElements({
      element,
      getData: () => ({ status: column.status }),
      onDragEnter: () => setIsDraggingOver(true),
      onDragLeave: () => setIsDraggingOver(false),
      onDrop: ({ source }) => {
        setIsDraggingOver(false);
        const sourceData = source.data as { ticketId?: unknown };
        const ticketId =
          typeof sourceData.ticketId === "string" ? sourceData.ticketId : null;

        if (!ticketId) {
          return;
        }

        onDropTicket(ticketId, column.status);
      },
    });
  }, [column.status, onDropTicket]);

  return (
    <div
      ref={columnRef}
      className={`
        min-w-75 w-75 shrink-0 rounded-xl border bg-white p-3
        transition-all ${column.borderClass}
        ${isDraggingOver ? "ring-2 ring-blue-400 bg-blue-50/30" : ""}
      `}
    >
      <div className="mb-3 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {column.title}
          </h3>
          <Badge variant="secondary">{tickets.length}</Badge>
        </div>
        <p className="text-xs text-slate-500">{column.subtitle}</p>
      </div>

      <div className="space-y-3 min-h-50">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            canAssign={canAssign}
            isBusy={busyTicketId === ticket.id}
            isSelected={selectedTicketId === ticket.id}
            supportUsers={supportUsers}
            onAssign={onAssign}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const { user } = useAuth();
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [busyTicketId, setBusyTicketId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [defaultAssigneeId, setDefaultAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canAssign = canAssignByRole(user?.role);

  // Queries
  const { data: tickets = [], isLoading: isLoadingTickets } = useTickets({
    organizationId: user?.organizationId,
    limit: 500
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', user?.organizationId],
    queryFn: async () => {
      const res = await usersApi.getAll();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!user?.organizationId,
  });
  
  const { data: comments = [], isLoading: isLoadingComments } = useTicketComments(selectedTicketId || "", user?.id);
  const { data: history = [], isLoading: isLoadingHistory } = useTicketHistory(selectedTicketId || "", user?.id);
  
  const isLoadingDetails = isLoadingComments || isLoadingHistory;
  
  // Mutations
  const { mutateAsync: createTicket, isPending: isSubmitting } = useCreateTicket();
  const { mutateAsync: assignTicket } = useAssignTicket();
  const { mutateAsync: updateTicketStatus } = useUpdateTicketStatus();
  const { mutateAsync: addTicketComment, isPending: isPostingComment } = useAddTicketComment();

  // Derived state
  const supportUsers = useMemo(() => 
    users.filter(member => member.status !== "INACTIVE"),
  [users]);

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (byPriority !== 0) return byPriority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tickets]);

  // Set default selected ticket
  useEffect(() => {
    if (!selectedTicketId && sortedTickets.length > 0) {
      setSelectedTicketId(sortedTickets[0].id);
    }
  }, [sortedTickets, selectedTicketId]);

  const selectedTicket = useMemo(
    () => sortedTickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [sortedTickets, selectedTicketId],
  );

  const selectedTicketSla = useMemo(() => {
    if (!selectedTicket) return null;
    return computeSla(selectedTicket);
  }, [selectedTicket]);

  const handleCreateTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.organizationId || !user?.id) {
      setError("Please login before raising a ticket.");
      return;
    }

    setError(null);
    try {
      const res = await createTicket({
        organizationId: user.organizationId,
        requesterId: user.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        assigneeId: defaultAssigneeId || undefined,
      });
      
      setSelectedTicketId(res.data?.id || null);
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDefaultAssigneeId("");
    } catch (err: any) {
      setError(err.message || "Failed to create ticket");
    }
  };

  const handleAssign = async (ticketId: string, assigneeId: string) => {
    if (!user?.id || !canAssign) return;

    setBusyTicketId(ticketId);
    setError(null);

    try {
      await assignTicket({
        id: ticketId,
        payload: {
          actorUserId: user.id,
          assigneeId,
          status: "ASSIGNED",
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to assign ticket");
    } finally {
      setBusyTicketId(null);
    }
  };

  const canMoveTicket = useCallback(
    (ticket: BackendTicket, nextStatus: TicketStatus) => {
      if (!user) return false;
      const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "HR_MANAGER";
      
      const isAssignee = ticket.assigneeId === user.id;
      const isRequester = ticket.requesterId === user.id;

      if (isAdmin) return true;
      if (nextStatus === "RESOLVED" || nextStatus === "FAILED" || nextStatus === "TIMED_OUT") {
        return isAssignee || isRequester;
      }
      return isAssignee;
    },
    [user],
  );

  const handleDropTicket = useCallback(
    async (ticketId: string, nextStatus: TicketStatus) => {
      if (!user?.id) return;

      const currentTicket = tickets.find((ticket) => ticket.id === ticketId);
      if (!currentTicket || currentTicket.status === nextStatus) return;

      if (!canMoveTicket(currentTicket, nextStatus)) {
        setError("You are not allowed to move this ticket to that column.");
        return;
      }

      let resolutionNote: string | undefined;
      if (TERMINAL_STATUSES.includes(nextStatus)) {
        const promptValue = window.prompt(
          "Add a short resolution note before closing this ticket:",
          currentTicket.resolutionNote || "",
        );

        if (promptValue === null) return;

        if (!promptValue.trim()) {
          setError("Resolution note is required for Resolved / Failed / Timed Out.");
          return;
        }

        resolutionNote = promptValue.trim();
      }

      setBusyTicketId(ticketId);
      setError(null);

      try {
        await updateTicketStatus({
          id: ticketId,
          payload: {
            actorUserId: user.id,
            status: nextStatus,
            resolutionNote,
          }
        });
        if (selectedTicketId !== ticketId) {
           setSelectedTicketId(ticketId);
        }
      } catch (err: any) {
        setError(err.message || "Failed to update ticket status");
      } finally {
        setBusyTicketId(null);
      }
    },
    [canMoveTicket, selectedTicketId, tickets, user?.id, updateTicketStatus],
  );

  const handleAddComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTicketId || !user?.id || !commentDraft.trim()) return;

    setError(null);

    try {
      await addTicketComment({
        id: selectedTicketId,
        payload: {
          actorUserId: user.id,
          body: commentDraft.trim(),
        }
      });
      setCommentDraft("");
    } catch (err: any) {
      setError(err.message || "Failed to add comment");
    }
  };

  const groupedTickets = useMemo(() => {
    const grouped: Record<TicketStatus, BackendTicket[]> = {
      OPEN: [],
      ASSIGNED: [],
      IN_PROGRESS: [],
      RESOLVED: [],
      FAILED: [],
      TIMED_OUT: [],
    };

    for (const ticket of tickets) {
      grouped[ticket.status].push(ticket);
    }

    return grouped;
  }, [tickets]);

  return (
    <PageShell
      title="Ticketing Board"
      description="Raise support tickets, assign to support team, and update status by drag and drop."
      error={error}
    >

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>Raise a Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={handleCreateTicket}
              >
                <div className="md:col-span-2">
                  <Input
                    placeholder="Ticket title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    minLength={5}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Describe the issue in detail"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    minLength={10}
                    rows={4}
                    required
                  />
                </div>
                <select
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as TicketPriority)
                  }
                >
                  <option value="LOW">Low priority</option>
                  <option value="MEDIUM">Medium priority</option>
                  <option value="HIGH">High priority</option>
                  <option value="CRITICAL">Critical priority</option>
                </select>

                <select
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={defaultAssigneeId}
                  onChange={(event) => setDefaultAssigneeId(event.target.value)}
                  disabled={!canAssign}
                >
                  <option value="">Assign later</option>
                  {supportUsers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {formatName(member)} ({member.role})
                    </option>
                  ))}
                </select>

                <div className="md:col-span-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <ButtonLoadingSkeleton inverted className="w-26" />
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Kanban Board</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-600">
                  Drag any ticket card and drop it into another column to update
                  the workflow stage.
                </p>

                {isLoadingTickets ? (
                  <div className="min-h-45">
                    <TableLoadingSkeleton rows={5} />
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-4">
                      {TICKET_COLUMNS.map((column) => (
                        <TicketColumn
                          key={column.status}
                          column={column}
                          tickets={groupedTickets[column.status]}
                          busyTicketId={busyTicketId}
                          selectedTicketId={selectedTicketId}
                          canAssign={canAssign}
                          supportUsers={supportUsers}
                          onAssign={handleAssign}
                          onDropTicket={handleDropTicket}
                          onSelect={setSelectedTicketId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {!selectedTicket ? (
                  <p className="text-sm text-slate-500">
                    Select any ticket card to view comments, status trail, and
                    SLA details.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {selectedTicket.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {selectedTicket.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={priorityBadgeVariant(
                            selectedTicket.priority,
                          )}
                        >
                          {selectedTicket.priority}
                        </Badge>
                        <Badge
                          className={statusBadgeClass(selectedTicket.status)}
                        >
                          {selectedTicket.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Requester: {formatName(selectedTicket.requester)} |
                        Assignee: {formatName(selectedTicket.assignee)}
                      </p>
                    </div>

                    {selectedTicketSla && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                          <p className="text-[11px] uppercase text-slate-500">
                            Time to assign
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDuration(
                              selectedTicketSla.timeToAssignMinutes,
                            )}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                          <p className="text-[11px] uppercase text-slate-500">
                            Time to resolve
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDuration(
                              selectedTicketSla.timeToResolveMinutes,
                            )}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                          <p className="text-[11px] uppercase text-slate-500">
                            Ticket age
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDuration(selectedTicketSla.ageMinutes)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Status History
                      </h4>
                      {isLoadingDetails ? (
                        <ListLoadingSkeleton items={3} />
                      ) : history.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No status events yet.
                        </p>
                      ) : (
                        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                          {history.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-md border border-slate-200 p-2"
                            >
                              <p className="text-xs font-medium text-slate-900">
                                {item.fromStatus
                                  ? `${item.fromStatus} -> ${item.toStatus}`
                                  : `Created as ${item.toStatus}`}
                              </p>
                              <p className="text-xs text-slate-600">
                                By {formatName(item.actorUser)} on{" "}
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                              {item.note && (
                                <p className="mt-1 text-xs text-slate-700">
                                  {item.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Comments
                      </h4>
                      {isLoadingDetails ? (
                        <ListLoadingSkeleton items={3} />
                      ) : comments.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No comments yet.
                        </p>
                      ) : (
                        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                          {comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-md border border-slate-200 p-2"
                            >
                              <p className="text-xs font-medium text-slate-900">
                                {formatName(comment.author)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                              <p className="mt-1 text-sm text-slate-700">
                                {comment.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <form className="space-y-2" onSubmit={handleAddComment}>
                        <Textarea
                          value={commentDraft}
                          onChange={(event) =>
                            setCommentDraft(event.target.value)
                          }
                          placeholder="Add a comment to this ticket"
                          rows={3}
                        />
                        <Button
                          type="submit"
                          disabled={
                            !selectedTicketId ||
                            !commentDraft.trim() ||
                            isPostingComment
                          }
                          className="w-full"
                        >
                          {isPostingComment ? (
                            <ButtonLoadingSkeleton inverted className="w-30" />
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Add Comment
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </StaggerItem>
    </PageShell>
  );
}
