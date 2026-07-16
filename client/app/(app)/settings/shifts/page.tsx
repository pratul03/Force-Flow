"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useShifts, useDeleteShift } from "@/features/shifts/queries";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Trash2, Edit2 } from "lucide-react";
import { BackendShift } from "@/features/shifts/types";
import { ShiftDialog } from "@/components/settings/ShiftDialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListLoadingSkeleton } from "@/components/ui/loading-skeletons";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ShiftsPage() {
  const { data: shifts, isLoading } = useShifts();
  const { mutate: deleteShift } = useDeleteShift();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<BackendShift | null>(null);

  const handleEdit = (shift: BackendShift) => {
    setEditingShift(shift);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingShift(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this shift?")) {
      deleteShift(id);
    }
  };

  const formatDays = (days: number[]) => {
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Weekdays";
    if (days.length === 7) return "Every day";
    return days.map(d => DAY_NAMES[d]).join(', ');
  };

  return (
    <PageShell title="Shifts & Work Hours" description="Manage shift timings and attendance rules">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1" />
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Shift
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <ListLoadingSkeleton items={3} />
          </div>
        ) : shifts?.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No shifts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Shift Name</th>
                  <th className="px-4 py-3 font-medium">Timings</th>
                  <th className="px-4 py-3 font-medium">Working Days</th>
                  <th className="px-4 py-3 font-medium">Rules</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts?.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <p className="font-medium text-slate-900">{shift.name}</p>
                        {shift.isDefault && (
                          <Badge variant="secondary" className="text-[10px]">Default</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {shift.startTime} - {shift.endTime}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDays(shift.workingDays)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      Grace: {shift.gracePeriodMins}m<br/>
                      Half-day: {Math.floor(shift.halfDayMarkMins / 60)}h {shift.halfDayMarkMins % 60}m
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={shift.isActive ? 'default' : 'secondary'}>
                        {shift.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(shift)}>
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ShiftDialog 
        shift={editingShift}
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </PageShell>
  );
}
