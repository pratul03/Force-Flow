"use client";

import { useEffect, useState } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { TimesheetTable } from "@/components/timesheet/TimesheetTable";
import { ManualAdjustDialog } from "@/components/timesheet/ManualAdjustDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Filter } from "lucide-react";
import Link from "next/link";
import { useTimesheetsStore } from "@/features/timesheets/store";
import { useTimesheets, useUpdateTimesheet, useDeleteTimesheet } from "@/features/timesheets/queries";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TimesheetPage() {
  const { filterStatus, setFilterStatus } = useTimesheetsStore();
  const { user } = useAuth();
  
  const { data: entries = [], isLoading, error, refetch } = useTimesheets();
  const { mutate: updateTimesheet } = useUpdateTimesheet();
  const { mutate: deleteTimesheet } = useDeleteTimesheet();
  
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);

  // Filter entries
  const filteredEntries =
    filterStatus === "all"
      ? entries
      : entries.filter((entry) => entry.status.toLowerCase() === filterStatus);

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

        {/* Summary cards */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    Total Hours
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalHours.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entries.length} entries
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    Overtime Hours
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {totalOvertime.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">Extra hours worked</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Approval
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {pendingCount}
                  </p>
                  <p className="text-xs text-gray-500">Awaiting review</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    <Filter className="inline h-4 w-4 mr-2" />
                    Filter by Status
                  </label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Timesheet table */}
        <StaggerItem>
          <TimesheetTable
            entries={filteredEntries}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onEdit={handleEdit}
            isLoading={isLoading}
          />
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
