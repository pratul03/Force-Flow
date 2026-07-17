import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTicketHistory } from '@/features/tickets/queries';
import { useAuth } from '@/hooks/useAuth';
import { formatDateTime12Hour } from '@/lib/utils';
import { TicketStatus } from '@/lib/types';
import { formatName } from '@/components/tickets/utils';

interface TicketHistoryModalProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketHistoryModal({ ticketId, isOpen, onClose }: TicketHistoryModalProps) {
  const { user } = useAuth();
  const { data: history = [], isLoading } = useTicketHistory(ticketId || '', user?.id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ticket History</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
          {isLoading ? (
            <div className="text-sm text-slate-500 text-center py-4">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No history available.</div>
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-6">
              {history.map((event) => (
                <div key={event.id} className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-slate-200 border-2 border-white dark:bg-slate-700 dark:border-slate-900" />
                  
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime12Hour(event.createdAt)}
                    </div>
                    
                    <div className="text-sm text-slate-900 dark:text-slate-100">
                      <span className="font-medium">{formatName(event.actorUser as any)}</span>
                      {event.fromStatus ? (
                        <span> changed status from <span className="font-semibold">{event.fromStatus}</span> to <span className="font-semibold">{event.toStatus}</span></span>
                      ) : event.note === 'Updated ticket details' ? (
                        <span> updated the ticket details</span>
                      ) : (
                        <span> created the ticket</span>
                      )}
                    </div>

                    {event.note && event.note !== 'Updated ticket details' && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded-md mt-1">
                        {event.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
