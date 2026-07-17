import { Draggable } from "@atlaskit/pragmatic-drag-and-drop-react-beautiful-dnd-migration";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime12Hour } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { BackendTicket, BackendUser } from "@/lib/types";
import {
  computeSla,
  formatDuration,
  formatName,
  priorityBadgeVariant,
  statusBadgeClass,
} from "./utils";
import { Ref, ClassAttributes, HTMLAttributes, useState } from "react";
import { JSX } from "react/jsx-runtime";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { TicketHistoryModal } from "./TicketHistoryModal";
import Link from "next/link";

type TicketCardProps = {
  ticket: BackendTicket;
  canAssign: boolean;
  isBusy: boolean;
  supportUsers: BackendUser[];
  index: number;
  onAssign: (ticketId: string, assigneeId: string) => void;
};

function getInitials(
  user?: { firstName?: string; lastName?: string; email?: string } | null,
) {
  if (!user) return "?";
  if (user.firstName && user.lastName)
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
  if (user.email) return user.email.substring(0, 2).toUpperCase();
  return "?";
}

export function TicketCard({
  ticket,
  canAssign,
  isBusy,
  supportUsers,
  index,
  onAssign,
}: TicketCardProps) {
  const sla = computeSla(ticket);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <>
      <Draggable draggableId={ticket.id} index={index}>
      {(provided: { innerRef: Ref<HTMLDivElement> | undefined; draggableProps: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>; dragHandleProps: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>; }, snapshot: { isDragging: any; }) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
        >
          <ContextMenu>
            <ContextMenuTrigger>
              <Card
            className={`border-slate-200 shadow-sm transition-all h-65 flex flex-col bg-white dark:bg-slate-800 dark:border-slate-700 ${
              snapshot.isDragging
                ? "shadow-lg scale-[1.02] ring-2 ring-blue-300 z-50 bg-white dark:bg-slate-800"
                : ""
            }`}
          >
            <CardContent className="p-4 flex flex-col flex-1 gap-3 overflow-hidden">
              <div className="flex items-start justify-between gap-2 shrink-0">
                <h4 className="font-semibold text-sm leading-5 text-slate-900 dark:text-slate-100 line-clamp-2">
                  {ticket.title}
                </h4>
                <Badge variant={priorityBadgeVariant(ticket.priority)} className="shrink-0">
                  {ticket.priority}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[32px] shrink-0">
                {ticket.description}
              </p>

              <div className="flex items-center justify-between gap-2 text-xs shrink-0">
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  By: {formatName(ticket.requester)}
                </span>
                <Badge className={statusBadgeClass(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>

              <div className="mt-auto flex items-end justify-between shrink-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <div className={`rounded px-1.5 py-1 leading-tight ${sla.isAssignBreached ? 'bg-rose-100 text-rose-800 font-medium dark:bg-rose-900/50 dark:text-rose-200' : sla.isAssignWarning ? 'bg-amber-100 text-amber-800 font-medium dark:bg-amber-900/50 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                      TTA: {formatDuration(sla.timeToAssignMinutes)} / {formatDuration(sla.maxAssignMinutes)}
                    </div>
                    <div className={`rounded px-1.5 py-1 leading-tight ${sla.isResolveBreached ? 'bg-rose-100 text-rose-800 font-medium dark:bg-rose-900/50 dark:text-rose-200' : sla.isResolveWarning ? 'bg-amber-100 text-amber-800 font-medium dark:bg-amber-900/50 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                      TTR: {formatDuration(sla.timeToResolveMinutes)} / {formatDuration(sla.maxResolveMinutes)}
                    </div>
                    <div className="rounded bg-slate-100 px-1.5 py-1 text-slate-700 dark:bg-slate-700 dark:text-slate-300 leading-tight">
                      Age: {formatDuration(sla.ageMinutes)}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Updated {formatDateTime12Hour(ticket.updatedAt)}
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {canAssign ? (
                    <Select
                      disabled={isBusy}
                      value={ticket.assigneeId || "unassigned"}
                      onValueChange={(val) => {
                        const nextAssigneeId = val === "unassigned" ? "" : val;
                        if (nextAssigneeId !== ticket.assigneeId) {
                          onAssign(ticket.id, nextAssigneeId);
                        }
                      }}
                    >
                      <SelectTrigger className="w-9 h-9 rounded-full p-0 flex items-center justify-center border-none shadow-none focus:ring-0 [&>svg]:hidden ring-offset-0 bg-transparent hover:ring-2 hover:ring-blue-300 transition-all dark:text-slate-100">
                        <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700 cursor-pointer">
                          <AvatarFallback className="text-xs bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
                            {getInitials(ticket.assignee)}
                          </AvatarFallback>
                        </Avatar>
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {supportUsers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {formatName(member)} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700">
                      <AvatarFallback className="text-xs bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
                        {getInitials(ticket.assignee)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <Link href={`/tickets/${ticket.slug}`}>
                <ContextMenuItem>View Ticket</ContextMenuItem>
              </Link>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => setIsHistoryOpen(true)}>
                View History
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )}
    </Draggable>
    <TicketHistoryModal 
      ticketId={ticket.id} 
      isOpen={isHistoryOpen} 
      onClose={() => setIsHistoryOpen(false)} 
    />
    </>
  );
}
