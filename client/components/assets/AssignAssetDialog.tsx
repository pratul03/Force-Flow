import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackendAsset } from "@/features/assets/types";
import { useAssignAsset } from "@/features/assets/queries";
import { useEmployees } from "@/features/employees/queries";
import { Input } from "@/components/ui/input";

interface Props {
  asset: BackendAsset | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignAssetDialog({ asset, isOpen, onClose }: Props) {
  const { mutate: assignAsset, isPending } = useAssignAsset();
  const { data: employees = [] } = useEmployees();
  
  const [userId, setUserId] = useState("");
  const [assignedDate, setAssignedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    
    assignAsset({
      id: asset.id,
      data: {
        userId,
        assignedDate: new Date(assignedDate).toISOString(),
      }
    }, {
      onSuccess: () => {
        onClose();
        setUserId("");
      }
    });
  };

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Asset: {asset.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assignment Date</Label>
            <Input 
              type="date" 
              value={assignedDate} 
              onChange={e => setAssignedDate(e.target.value)} 
              required 
            />
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !userId}>
              {isPending ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
