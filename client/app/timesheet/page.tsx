"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { TimesheetTable } from "@/components/timesheet/TimesheetTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Filter } from "lucide-react";
import Link from "next/link";
import { TimesheetEntry } from "@/lib/types";
import { useApp } from "@/hooks/useApp";
import { mapBackendTimelogToUi, timesheetApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TimesheetPage() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredEntries, setFilteredEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTimesheetEntries } = useApp();

  useEffect(() => {
    async function loadTimesheets() {
      setIsLoading(true);
      setError(null);

      const response = await timesheetApi.getAll();

      if (!response.success || !response.data) {
        setError(response.error || "Failed to load timesheets");
        setEntries([]);
        setIsLoading(false);
        return;
      }

      setEntries(response.data.map(mapBackendTimelogToUi));
      setIsLoading(false);
    }

    void loadTimesheets();
  }, []);

  // Update app store
  useEffect(() => {
    setTimesheetEntries(entries);
  }, [entries, setTimesheetEntries]);

  // Filter entries
  useEffect(() => {
    const filtered =
      statusFilter === "all"
        ? entries
        : entries.filter((entry) => entry.status === statusFilter);
    setFilteredEntries(filtered);
  }, [statusFilter, entries]);

  const handleApprove = async (entryId: string) => {
    const response = await timesheetApi.update(entryId, { status: "APPROVED" });
    if (!response.success) {
      setError(response.error || "Failed to approve timesheet");
      return;
    }

    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, status: "approved" } : entry,
      ),
    );
  };

  const handleReject = async (entryId: string) => {
    const response = await timesheetApi.update(entryId, { status: "REJECTED" });
    if (!response.success) {
      setError(response.error || "Failed to reject timesheet");
      return;
    }

    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, status: "rejected" } : entry,
      ),
    );
  };

  const handleDelete = async (entryId: string) => {
    if (confirm("Are you sure you want to delete this timesheet entry?")) {
      const response = await timesheetApi.delete(entryId);
      if (!response.success) {
        setError(response.error || "Failed to delete timesheet entry");
        return;
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const totalOvertime = entries.reduce((sum, entry) => sum + entry.overtime, 0);
  const pendingCount = entries.filter(
    (entry) => entry.status === "pending",
  ).length;

  return (
    <MainLayout>
      <StaggerContainer className="space-y-6">
        {/* Page header */}
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Timesheet</h1>
              <p className="text-gray-600 mt-2">
                Track and manage employee working hours
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <Link href="/timesheet/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </Link>
          </div>
        </StaggerItem>

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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            isLoading={isLoading}
          />
        </StaggerItem>
      </StaggerContainer>
    </MainLayout>
  );
}
