import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ButtonLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCreateTicket } from "@/features/tickets/queries";
import { TicketPriority, TicketStatus, BackendUser } from "@/lib/types";
import { formatName } from "./utils";

interface CreateTicketDialogProps {
  supportUsers: BackendUser[];
  canAssign: boolean;
  initialStatus?: TicketStatus;
  trigger?: React.ReactNode;
}

export function CreateTicketDialog({
  supportUsers,
  canAssign,
  initialStatus,
  trigger,
}: CreateTicketDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [status, setStatus] = useState<TicketStatus>(initialStatus || "OPEN");
  const [defaultAssigneeId, setDefaultAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStatus(initialStatus || "OPEN");
    }
  }, [open, initialStatus]);

  const { mutateAsync: createTicket, isPending: isSubmitting } =
    useCreateTicket();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.organizationId || !user?.id) {
      setError("Please login before raising a ticket.");
      return;
    }

    setError(null);
    try {
      await createTicket({
        organizationId: user.organizationId,
        requesterId: user.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        assigneeId: defaultAssigneeId || undefined,
      });

      // Reset form and close
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setStatus("OPEN");
      setDefaultAssigneeId("");
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to create ticket");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Raise a Ticket</DialogTitle>
          <DialogDescription>
            Create a new support ticket. Provide as much detail as possible to
            help us resolve the issue quickly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="space-y-2">
            <Label>Ticket Title (Max 30 words)</Label>
            <Input
              placeholder="Ticket title"
              value={title}
              autoComplete="off"
              onChange={(event) => {
                const val = event.target.value;
                const wordCount = val
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length;
                if (wordCount <= 30 || val.length < title.length) {
                  setTitle(val);
                }
              }}
              minLength={5}
              required
            />
            <div className="text-xs text-slate-500 text-right">
              {title.trim().split(/\s+/).filter(Boolean).length} / 30 words
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (Max 200 words)</Label>
            <Textarea
              placeholder="Describe the issue in detail"
              value={description}
              onChange={(event) => {
                const val = event.target.value;
                const wordCount = val
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length;
                if (wordCount <= 200 || val.length < description.length) {
                  setDescription(val);
                }
              }}
              minLength={10}
              rows={4}
              required
            />
            <div className="text-xs text-slate-500 text-right">
              {description.trim().split(/\s+/).filter(Boolean).length} / 200
              words
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as TicketStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="TIMED_OUT">Timed Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as TicketPriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low priority</SelectItem>
                  <SelectItem value="MEDIUM">Medium priority</SelectItem>
                  <SelectItem value="HIGH">High priority</SelectItem>
                  <SelectItem value="CRITICAL">Critical priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={defaultAssigneeId || "unassigned"}
                onValueChange={(val) =>
                  setDefaultAssigneeId(val === "unassigned" ? "" : val)
                }
                disabled={!canAssign}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign later" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Assign later</SelectItem>
                  {supportUsers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {formatName(member)} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <ButtonLoadingSkeleton inverted className="w-26" />
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
