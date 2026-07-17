"use client";

import { useEffect, useState } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { TimesheetTable } from "@/components/timesheet/TimesheetTable";
import { ManualAdjustDialog } from "@/components/timesheet/ManualAdjustDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTimesheetsStore } from "@/features/timesheets/store";
import {
  useTimesheets,
  useUpdateTimesheet,
  useDeleteTimesheet,
} from "@/features/timesheets/queries";
import { useAuth } from "@/hooks/useAuth";


export default function TimesheetPage() {
  const { user } = useAuth();

  const isManager = user?.role && ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'].includes(user.role);
  
  // If user is a manager, fetch all timesheets for the organization. Otherwise, just fetch theirs.
  const { data: entries = [], isLoading, error, refetch } = useTimesheets(isManager ? undefined : user?.id);
  const { mutate: updateTimesheet } = useUpdateTimesheet();
  const { mutate: deleteTimesheet } = useDeleteTimesheet();

  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);

  const handleApprove = (entryId: string) => {
    updateTimesheet({ id: entryId, payload: { status: "APPROVED" } as any });
  };

  const handleReject = (entryId: string) => {
    updateTimesheet({ id: entryId, payload: { status: "REJECTED" } as any });
  };

  const handleDelete = (entryId: string) => {
    if (confirm("Are you sure you want to delete this timesheet entry?")) {
      deleteTimesheet(entryId);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setIsAdjustDialogOpen(true);
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const totalOvertime = entries.reduce((sum, entry) => sum + entry.overtime, 0);
  const pendingCount = entries.filter(
    (entry) => entry.status === "pending",
  ).length;

  return (
    <PageShell
      title="Timesheet"
      description="Track and manage employee working hours"
      error={error?.message}
      action={
        <Link href="/timesheet/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </Link>
      }
    >
      {/* Bento Grid Summary */}
      <StaggerItem>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card className="md:col-span-2 border-blue-200/50 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                    Total Hours Tracked
                  </p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">
                    {totalHours.toFixed(1)}{" "}
                    <span className="text-xl text-gray-500 font-normal">
                      hrs
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Entries
                  </p>
                  <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                    {entries.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200/50 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-400">
                  Overtime
                </p>
                <p className="text-4xl font-bold text-orange-600 dark:text-orange-500">
                  {totalOvertime.toFixed(1)}{" "}
                  <span className="text-xl font-normal">hrs</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200/50 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  Pending Review
                </p>
                <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-500">
                  {pendingCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="grid grid-cols-1 gap-4">
          <TimesheetTable
            entries={entries}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onEdit={handleEdit}
            isLoading={isLoading}
          />
        </div>
      </StaggerItem>

      <ManualAdjustDialog
        entry={editingEntry}
        isOpen={isAdjustDialogOpen}
        onClose={() => setIsAdjustDialogOpen(false)}
        onSuccess={() => refetch()}
      />
    </PageShell>
  );
}
