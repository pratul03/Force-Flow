import { Droppable } from "@atlaskit/pragmatic-drag-and-drop-react-beautiful-dnd-migration";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackendTicket, BackendUser, TicketStatus } from "@/lib/types";
import { TicketColumnMeta } from "./constants";
import { TicketCard } from "./TicketCard";
import { CreateTicketDialog } from "./CreateTicketDialog";
import { Ref, ClassAttributes, HTMLAttributes, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import { JSX } from "react/jsx-runtime";

type TicketColumnProps = {
  column: TicketColumnMeta;
  tickets: BackendTicket[];
  busyTicketId: string | null;
  canAssign: boolean;
  supportUsers: BackendUser[];
  onAssign: (ticketId: string, assigneeId: string) => void;
  onDropTicket: (ticketId: string, status: TicketStatus) => void;
};

export function TicketColumn({
  column,
  tickets,
  busyTicketId,
  canAssign,
  supportUsers,
  onAssign,
}: TicketColumnProps) {
  return (
    <Droppable droppableId={column.status}>
      {(provided: { innerRef: Ref<HTMLDivElement> | undefined; droppableProps: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>; placeholder: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, snapshot: { isDraggingOver: any; }) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            min-w-96 w-96 shrink-0 rounded-xl border bg-slate-50 dark:bg-slate-900/40 p-3
            transition-all flex flex-col h-full ${column.borderClass}
            ${snapshot.isDraggingOver ? "ring-2 ring-blue-400 bg-blue-50/50 dark:bg-blue-900/20" : ""}
          `}
        >
          <div className="mb-3 space-y-1 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {column.title}
              </h3>
              <div className="flex items-center gap-1">
                <CreateTicketDialog
                  supportUsers={supportUsers}
                  canAssign={canAssign}
                  initialStatus={column.status}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
                <Badge variant="secondary">{tickets.length}</Badge>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{column.subtitle}</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                index={index}
                ticket={ticket}
                canAssign={canAssign}
                isBusy={busyTicketId === ticket.id}
                supportUsers={supportUsers}
                onAssign={onAssign}
              />
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
