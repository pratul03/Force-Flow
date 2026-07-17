"use client";

import { useCallback, useMemo, useState } from "react";
import { DragDropContext, DropResult } from "@atlaskit/pragmatic-drag-and-drop-react-beautiful-dnd-migration";
import { PageShell } from "@/components/layout/PageShell";
import { TableLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  useTickets,
  useAssignTicket,
  useUpdateTicketStatus,
  useReorderTickets,
} from "@/features/tickets/queries";
import { useTicketsSocket } from "@/features/tickets/useTicketsSocket";
import { usersApi } from "@/features/users/api";
import { BackendTicket, TicketStatus } from "@/lib/types";

import {
  TICKET_COLUMNS,
  TERMINAL_STATUSES,
} from "@/components/tickets/constants";
import { canAssignByRole } from "@/components/tickets/utils";
import { TicketColumn } from "@/components/tickets/TicketColumn";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";

export default function TicketsPage() {
  const { user } = useAuth();

  const [busyTicketId, setBusyTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAssign = canAssignByRole(user?.role);

  // Real-time synchronization
  useTicketsSocket(user?.organizationId);

  // Queries
  const { data: tickets = [], isLoading: isLoadingTickets } = useTickets({
    organizationId: user?.organizationId,
    limit: 500,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", user?.organizationId],
    queryFn: async () => {
      const res = await usersApi.getAll();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!user?.organizationId,
  });

  // Mutations
  const { mutateAsync: assignTicket } = useAssignTicket();
  const { mutateAsync: updateTicketStatus } = useUpdateTicketStatus();
  const { mutateAsync: reorderTickets } = useReorderTickets();

  // Derived state
  const supportUsers = useMemo(
    () => users.filter((member) => member.status !== "INACTIVE"),
    [users],
  );

  const handleAssign = async (ticketId: string, assigneeId: string) => {
    if (!user?.id || !canAssign) return;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    setBusyTicketId(ticketId);
    setError(null);

    try {
      await assignTicket({
        id: ticketId,
        payload: {
          actorUserId: user.id,
          assigneeId,
          status: ticket.status === "OPEN" ? "ASSIGNED" : ticket.status,
        },
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
      const isAdmin =
        user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        user.role === "HR_MANAGER";

      const isAssignee = ticket.assigneeId === user.id;
      const isRequester = ticket.requesterId === user.id;

      if (isAdmin) return true;
      if (
        nextStatus === "RESOLVED" ||
        nextStatus === "FAILED" ||
        nextStatus === "TIMED_OUT"
      ) {
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

      setBusyTicketId(ticketId);
      setError(null);

      try {
        await updateTicketStatus({
          id: ticketId,
          payload: {
            actorUserId: user.id,
            status: nextStatus,
            resolutionNote,
          },
        });
      } catch (err: any) {
        setError(err.message || "Failed to update ticket status");
      } finally {
        setBusyTicketId(null);
      }
    },
    [canMoveTicket, tickets, user?.id, updateTicketStatus],
  );

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

    // Ensure they are sorted by orderIndex
    for (const status of Object.keys(grouped) as TicketStatus[]) {
      grouped[status].sort((a, b) => a.orderIndex - b.orderIndex);
    }

    return grouped;
  }, [tickets]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const sourceCol = source.droppableId as TicketStatus;
      const destCol = destination.droppableId as TicketStatus;

      if (sourceCol === destCol) {
        // Intra-column reorder
        const colTickets = Array.from(groupedTickets[sourceCol]);
        const [movedTicket] = colTickets.splice(source.index, 1);
        colTickets.splice(destination.index, 0, movedTicket);

        const updates = colTickets.map((t, index) => ({
          id: t.id,
          orderIndex: index,
        }));
        reorderTickets({ updates }).catch((err: any) => setError(err.message));
      } else {
        // Inter-column move + reorder
        const destTickets = Array.from(groupedTickets[destCol]);
        const movedTicket = tickets.find((t) => t.id === draggableId);
        if (movedTicket) {
          destTickets.splice(destination.index, 0, movedTicket);
          const updates = destTickets.map((t, index) => ({
            id: t.id,
            orderIndex: index,
          }));
          reorderTickets({ updates }).catch(console.error);
        }
        await handleDropTicket(draggableId, destCol);
      }
    },
    [handleDropTicket, groupedTickets, tickets, reorderTickets],
  );

  return (
    <PageShell
      title="Ticketing Board"
      description="Drag and drop tickets across the board to update workflow stages."
      error={error}
      action={
        <CreateTicketDialog supportUsers={supportUsers} canAssign={canAssign} />
      }
    >
      <div className="h-[calc(100vh-140px)] w-full overflow-hidden flex flex-col">
        {isLoadingTickets ? (
          <div className="p-4">
            <TableLoadingSkeleton rows={5} />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
              <div className="flex gap-6 h-full p-2">
                {TICKET_COLUMNS.map((column) => (
                  <TicketColumn
                    key={column.status}
                    column={column}
                    tickets={groupedTickets[column.status]}
                    busyTicketId={busyTicketId}
                    canAssign={canAssign}
                    supportUsers={supportUsers}
                    onAssign={handleAssign}
                    onDropTicket={handleDropTicket}
                  />
                ))}
              </div>
            </div>
          </DragDropContext>
        )}
      </div>
    </PageShell>
  );
}
