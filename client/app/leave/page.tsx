"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { LeaveTable } from "@/components/leave/LeaveTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Filter } from "lucide-react";
import Link from "next/link";
import { LeaveRequest } from "@/lib/types";
import { useApp } from "@/hooks/useApp";
import { leaveApi, mapBackendLeaveToUi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLeaveRequests } = useApp();
  const { user } = useAuth();

  useEffect(() => {
    async function loadLeaveRequests() {
      setIsLoading(true);
      setError(null);

      const response = await leaveApi.getAll();

      if (!response.success || !response.data) {
        setError(response.error || "Failed to load leave requests");
        setRequests([]);
        setIsLoading(false);
        return;
      }

      setRequests(response.data.map(mapBackendLeaveToUi));
      setIsLoading(false);
    }

    void loadLeaveRequests();
  }, []);

  // Update app store
  useEffect(() => {
    setLeaveRequests(requests);
  }, [requests, setLeaveRequests]);

  // Filter requests
  useEffect(() => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((req) => req.type === typeFilter);
    }

    setFilteredRequests(filtered);
  }, [statusFilter, typeFilter, requests]);

  const handleApprove = async (requestId: string) => {
    if (!user?.id) {
      setError("User not found");
      return;
    }

    const response = await leaveApi.approve(requestId, user.id);
    if (!response.success) {
      setError(response.error || "Failed to approve leave request");
      return;
    }

    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "approved",
              approvedAt: new Date().toISOString(),
              approverName: user.name,
            }
          : req,
      ),
    );
  };

  const handleReject = async (requestId: string) => {
    if (!user?.id) {
      setError("User not found");
      return;
    }

    const reason = prompt("Please enter rejection reason");
    if (!reason) {
      return;
    }

    const response = await leaveApi.reject(requestId, user.id, reason);
    if (!response.success) {
      setError(response.error || "Failed to reject leave request");
      return;
    }

    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: "rejected" } : req,
      ),
    );
  };

  const handleDelete = async (requestId: string) => {
    if (confirm("Are you sure you want to delete this leave request?")) {
      const response = await leaveApi.delete(requestId);
      if (!response.success) {
        setError(response.error || "Failed to delete leave request");
        return;
      }

      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <MainLayout>
      <StaggerContainer className="space-y-6">
        {/* Page header */}
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Leave Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and approve employee leave requests
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <Link href="/leave/request">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request Leave
              </Button>
            </Link>
          </div>
        </StaggerItem>

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

                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Filter by Type
                  </label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
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
      </StaggerContainer>
    </MainLayout>
  );
}
