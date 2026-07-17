"use client";

import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { HolidayTable } from "@/components/holidays/HolidayTable";
import { HolidayForm } from "@/components/holidays/HolidayForm";
import { ConfirmDeleteDialog } from "@/components/shared/dialogs/ConfirmDeleteDialog";
import { BackendHoliday } from "@/features/holidays/types";
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from "@/features/holidays/queries";
import { Card, CardContent } from "@/components/ui/card";

export default function HolidaysPage() {
  const { data: holidays = [], isLoading, error } = useHolidays();
  const { mutateAsync: createHoliday, isPending: isCreating } = useCreateHoliday();
  const { mutateAsync: updateHoliday, isPending: isUpdating } = useUpdateHoliday();
  const { mutateAsync: deleteHoliday, isPending: isDeleting } = useDeleteHoliday();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [holidayToEdit, setHolidayToEdit] = useState<BackendHoliday | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<BackendHoliday | null>(null);

  const handleCreateSubmit = async (data: any) => {
    try {
      await createHoliday(data);
      setIsFormOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!holidayToEdit) return;
    try {
      await updateHoliday({ id: holidayToEdit.id, data });
      setIsFormOpen(false);
      setHolidayToEdit(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteConfirm = async () => {
    if (!holidayToDelete) return;
    try {
      await deleteHoliday(holidayToDelete.id);
      setHolidayToDelete(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <PageShell
      title="Holiday Calendar"
      description="Manage company holidays and observances"
      error={error?.message}
      action={
        <Button
          onClick={() => {
            setHolidayToEdit(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Holiday
        </Button>
      }
    >
      <StaggerItem>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Holidays</p>
                <p className="text-2xl font-bold">{holidays.length}</p>
              </div>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Public Holidays</p>
                <p className="text-2xl font-bold">
                  {holidays.filter(h => h.type === 'PUBLIC').length}
                </p>
              </div>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Company Holidays</p>
                <p className="text-2xl font-bold">
                  {holidays.filter(h => h.type === 'COMPANY').length}
                </p>
              </div>
              <CalendarDays className="h-4 w-4 text-green-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Optional Holidays</p>
                <p className="text-2xl font-bold">
                  {holidays.filter(h => h.type === 'OPTIONAL').length}
                </p>
              </div>
              <CalendarDays className="h-4 w-4 text-yellow-500" />
            </CardContent>
          </Card>
        </div>

        <HolidayTable
          holidays={holidays}
          isLoading={isLoading}
          onEdit={(holiday) => {
            setHolidayToEdit(holiday);
            setIsFormOpen(true);
          }}
          onDelete={setHolidayToDelete}
        />
      </StaggerItem>

      <HolidayForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setHolidayToEdit(null);
        }}
        holiday={holidayToEdit}
        onSubmit={holidayToEdit ? handleEditSubmit : handleCreateSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <ConfirmDeleteDialog
        isOpen={!!holidayToDelete}
        onClose={() => setHolidayToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Holiday"
        description={`Are you sure you want to delete ${holidayToDelete?.name}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </PageShell>
  );
}
