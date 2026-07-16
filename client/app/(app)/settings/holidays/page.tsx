"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useHolidays, useDeleteHoliday } from "@/features/holidays/queries";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Trash2, Edit2 } from "lucide-react";
import { BackendHoliday } from "@/features/holidays/types";
import { HolidayDialog } from "@/components/settings/HolidayDialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { format } from "date-fns";

export default function HolidaysPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { data: holidays, isLoading } = useHolidays({ year: currentYear });
  const { mutate: deleteHoliday } = useDeleteHoliday();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<BackendHoliday | null>(null);

  const handleEdit = (holiday: BackendHoliday) => {
    setEditingHoliday(holiday);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingHoliday(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this holiday?")) {
      deleteHoliday(id);
    }
  };

  return (
    <PageShell title="Holidays" description="Manage company holidays and observances">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentYear(y => y - 1)}>
            {currentYear - 1}
          </Button>
          <span className="font-semibold px-4">{currentYear}</span>
          <Button variant="outline" onClick={() => setCurrentYear(y => y + 1)}>
            {currentYear + 1}
          </Button>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Holiday
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <ListLoadingSkeleton items={5} />
          </div>
        ) : holidays?.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No holidays found for {currentYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holidays?.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(holiday.date), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{holiday.name}</p>
                      {holiday.description && (
                        <p className="text-xs text-slate-500">{holiday.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {holiday.type.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={holiday.isActive ? 'default' : 'secondary'}>
                        {holiday.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(holiday)}>
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(holiday.id)}>
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

      <HolidayDialog 
        holiday={editingHoliday}
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </PageShell>
  );
}
