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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackendHoliday, HolidayType } from "@/features/holidays/types";
import { useCreateHoliday, useUpdateHoliday } from "@/features/holidays/queries";
import { Switch } from "@/components/ui/switch";

interface Props {
  holiday: BackendHoliday | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HolidayDialog({ holiday, isOpen, onClose }: Props) {
  const { mutate: createHoliday, isPending: isCreating } = useCreateHoliday();
  const { mutate: updateHoliday, isPending: isUpdating } = useUpdateHoliday();
  
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<HolidayType>("PUBLIC");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (holiday) {
      setName(holiday.name);
      setDate(holiday.date ? holiday.date.split('T')[0] : "");
      setType(holiday.type);
      setDescription(holiday.description || "");
      setIsActive(holiday.isActive);
    } else {
      setName("");
      setDate("");
      setType("PUBLIC");
      setDescription("");
      setIsActive(true);
    }
  }, [holiday, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name,
      date: new Date(date).toISOString(),
      type,
      description,
      isActive,
    };

    if (holiday) {
      updateHoliday({ id: holiday.id, data: payload }, { onSuccess: onClose });
    } else {
      createHoliday(payload, { onSuccess: onClose });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{holiday ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Year's Day"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as HolidayType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="COMPANY">Company</SelectItem>
                <SelectItem value="OPTIONAL">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
          {holiday && (
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
              {isPending ? "Saving..." : "Save Holiday"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
