import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimesheetEntry } from "@/lib/types";
import { attendanceApi } from "@/features/attendance/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  entry: TimesheetEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualAdjustDialog({ entry, isOpen, onClose, onSuccess }: Props) {
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      // Assuming entry.date and entry.startTime/endTime are available
      // The backend expects ISO strings for clockIn and clockOut
      const [startH, startM] = entry.startTime.split(':');
      const d1 = new Date(entry.date);
      d1.setHours(parseInt(startH), parseInt(startM));
      setClockIn(format(d1, "yyyy-MM-dd'T'HH:mm"));

      if (entry.endTime) {
        const [endH, endM] = entry.endTime.split(':');
        const d2 = new Date(entry.date);
        d2.setHours(parseInt(endH), parseInt(endM));
        setClockOut(format(d2, "yyyy-MM-dd'T'HH:mm"));
      } else {
        setClockOut("");
      }
      
      setNotes(entry.notes || "");
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setIsSaving(true);
    // user.id is in entry?
    const res = await attendanceApi.adjustTimeLog(entry.id, {
      clockIn: new Date(clockIn).toISOString(),
      clockOut: clockOut ? new Date(clockOut).toISOString() : undefined,
      notes
    });

    if (res.success) {
      toast.success("Timelog adjusted successfully");
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || "Failed to adjust timelog");
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manually Adjust Timelog</DialogTitle>
          <DialogDescription>
            Forcefully update the punch-in and punch-out times for this employee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Clock In</Label>
            <Input type="datetime-local" value={clockIn} onChange={e => setClockIn(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Clock Out</Label>
            <Input type="datetime-local" value={clockOut} onChange={e => setClockOut(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for adjustment" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Adjustments"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
