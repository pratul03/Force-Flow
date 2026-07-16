import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BackendShift } from "@/features/shifts/types";
import { useCreateShift, useUpdateShift } from "@/features/shifts/queries";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  shift: BackendShift | null;
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export function ShiftDialog({ shift, isOpen, onClose }: Props) {
  const { mutate: createShift, isPending: isCreating } = useCreateShift();
  const { mutate: updateShift, isPending: isUpdating } = useUpdateShift();
  
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [gracePeriodMins, setGracePeriodMins] = useState("0");
  const [halfDayMarkMins, setHalfDayMarkMins] = useState("240");
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (shift) {
      setName(shift.name);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
      setGracePeriodMins(shift.gracePeriodMins.toString());
      setHalfDayMarkMins(shift.halfDayMarkMins.toString());
      setWorkingDays(shift.workingDays);
      setIsDefault(shift.isDefault);
      setIsActive(shift.isActive);
    } else {
      setName("");
      setStartTime("09:00");
      setEndTime("17:00");
      setGracePeriodMins("0");
      setHalfDayMarkMins("240");
      setWorkingDays([1, 2, 3, 4, 5]);
      setIsDefault(false);
      setIsActive(true);
    }
  }, [shift, isOpen]);

  const toggleDay = (day: number) => {
    setWorkingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name,
      startTime,
      endTime,
      gracePeriodMins: parseInt(gracePeriodMins) || 0,
      halfDayMarkMins: parseInt(halfDayMarkMins) || 240,
      workingDays,
      isDefault,
      isActive,
    };

    if (shift) {
      updateShift({ id: shift.id, data: payload }, { onSuccess: onClose });
    } else {
      createShift(payload, { onSuccess: onClose });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{shift ? "Edit Shift" : "Add Shift"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. General Shift"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Grace Period (mins)</Label>
              <Input
                type="number"
                min="0"
                value={gracePeriodMins}
                onChange={(e) => setGracePeriodMins(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Half-Day Mark (mins)</Label>
              <Input
                type="number"
                min="0"
                value={halfDayMarkMins}
                onChange={(e) => setHalfDayMarkMins(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Working Days</Label>
            <div className="flex flex-wrap gap-3 pt-1">
              {DAYS.map(day => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day.value}`}
                    checked={workingDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="cursor-pointer font-normal text-sm">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Default Shift</Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Set as the default shift for new employees
              </div>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>

          {shift && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}
          
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Shift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
