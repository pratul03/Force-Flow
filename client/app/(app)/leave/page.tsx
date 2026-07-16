"use client";

import { useEffect, useState } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { LeaveTable } from "@/components/leave/LeaveTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Filter } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLeavesStore } from "@/features/leaves/store";
import { useLeaves, useUpdateLeaveStatus, useDeleteLeave } from "@/features/leaves/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeavePage() {
  const { filterStatus, setFilterStatus, filterType, setFilterType } = useLeavesStore();
  const { user } = useAuth();
  
  // React Query Hook handles fetching, caching, and loading state
  const { data: leaves = [], isLoading, error } = useLeaves(user?.organizationId);
  const { mutate: updateStatus } = useUpdateLeaveStatus();
  const { mutate: deleteLeave } = useDeleteLeave();

  // Client-side filtering
  const filteredRequests = leaves.filter((req) => {
    const matchStatus = filterStatus === "all" || req.status.toLowerCase() === filterStatus;
    const matchType = filterType === "all" || req.leaveType.toLowerCase() === filterType;
    return matchStatus && matchType;
  });

  const handleApprove = (requestId: string) => {
    if (!user?.id) return;
    updateStatus({
      leaveId: requestId,
      payload: { actorUserId: user.id, status: "APPROVED" },
    });
  };

  const handleReject = (requestId: string) => {
    if (!user?.id) return;
    const reason = prompt("Please enter rejection reason");
    if (!reason) return;

    updateStatus({
      leaveId: requestId,
      payload: { actorUserId: user.id, status: "REJECTED", rejectionReason: reason },
    });
  };

  const handleDelete = (requestId: string) => {
    if (confirm("Are you sure you want to delete this leave request?")) {
      deleteLeave(requestId);
    }
  };

  const stats = {
    total: leaves.length,
    pending: leaves.filter((r) => r.status === "PENDING").length,
    approved: leaves.filter((r) => r.status === "APPROVED").length,
    rejected: leaves.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <PageShell
      title="Leave Management"
      description="Manage and approve employee leave requests"
      error={error?.message}
      action={
        <Link href="/leave/request">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </Link>
      }
    >
      {/* Summary cards */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    Total Requests
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.approved}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
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

                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Filter by Type
                  </label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Leave requests table */}
        <StaggerItem>
          <LeaveTable
            requests={filteredRequests}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </StaggerItem>
    </PageShell>
  );
}
