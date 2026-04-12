"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  RecentActivity,
  ActivityItem,
} from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { Users, UserCheck, Calendar, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

const defaultStats: DashboardStats = {
  totalEmployees: 0,
  presentToday: 0,
  onLeave: 0,
  absentToday: 0,
  pendingLeaveRequests: 0,
  pendingTimesheets: 0,
};

type AuditActivityResponse = {
  queueJobs?: Array<{
    id: string;
    type?: string;
    status?: string;
    createdAt?: string;
  }>;
  leaves?: Array<{
    id: string;
    userId: string;
    leaveType: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  walletTransactions?: Array<{
    id: string;
    userId: string;
    amount?: number;
    currency?: string;
    createdAt: string;
  }>;
};

function mapLeaveStatus(status: string): ActivityItem["status"] | undefined {
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  if (status === "PENDING") return "pending";
  return undefined;
}

function mapActivityData(payload?: AuditActivityResponse): ActivityItem[] {
  if (!payload) return [];

  const leaveItems = (payload.leaves || []).map((leave) => ({
    id: `leave-${leave.id}`,
    type: leave.status === "APPROVED" ? "leave_approved" : "leave_request",
    title:
      leave.status === "APPROVED"
        ? `Leave approved for ${leave.userId}`
        : `Leave request from ${leave.userId}`,
    description: `${leave.leaveType} leave (${leave.status.toLowerCase()})`,
    timestamp: new Date(leave.updatedAt || leave.createdAt),
    user: { name: leave.userId },
    status: mapLeaveStatus(leave.status),
  })) as ActivityItem[];

  const queueItems = (payload.queueJobs || []).map((job) => ({
    id: `queue-${job.id}`,
    type: "timesheet",
    title: `Queue job ${job.status?.toLowerCase() || "updated"}`,
    description: job.type || "Background processing event",
    timestamp: new Date(job.createdAt || new Date().toISOString()),
  })) as ActivityItem[];

  const walletItems = (payload.walletTransactions || []).map((tx) => ({
    id: `wallet-${tx.id}`,
    type: "employee_joined",
    title: `Wallet transaction for ${tx.userId}`,
    description:
      tx.amount !== undefined
        ? `${tx.amount} ${tx.currency || ""}`.trim()
        : "Wallet ledger update",
    timestamp: new Date(tx.createdAt),
    user: { name: tx.userId },
  })) as ActivityItem[];

  return [...leaveItems, ...queueItems, ...walletItems]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      const [statsResp, activitiesResp] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivities(),
      ]);

      if (statsResp.success && statsResp.data) {
        setStats(statsResp.data);
      } else {
        setError(statsResp.error || "Failed to load dashboard stats");
      }

      if (activitiesResp.success && activitiesResp.data) {
        setActivities(
          mapActivityData(activitiesResp.data as AuditActivityResponse),
        );
      }

      setIsLoading(false);
    }

    void loadDashboard();
  }, []);

  return (
    <MainLayout>
      <StaggerContainer className="space-y-8">
        {/* Page Title */}
        <StaggerItem>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-300">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2 dark:text-gray-400">
              Welcome back! Here&apos;s an overview of your organization.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </StaggerItem>

        {/* Statistics Cards */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Users}
              color="blue"
              description={isLoading ? "Loading..." : "Active employees"}
            />
            <StatCard
              title="Present Today"
              value={stats.presentToday}
              icon={UserCheck}
              color="green"
              trend={{ value: 5, isPositive: true }}
              description="Employees at work"
            />
            <StatCard
              title="On Leave"
              value={stats.onLeave}
              icon={Calendar}
              color="yellow"
              description="Currently on leave"
            />
            <StatCard
              title="Pending Requests"
              value={stats.pendingLeaveRequests}
              icon={Clock}
              color="red"
              description="Leave requests awaiting approval"
            />
          </div>
        </StaggerItem>

        {/* Main Content Grid */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <RecentActivity activities={activities} />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/employees/new" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users size={18} className="mr-2" />
                    Add Employee
                  </Button>
                </Link>
                <Link href="/leave" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar size={18} className="mr-2" />
                    Review Leave
                  </Button>
                </Link>
                <Link href="/timesheet" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock size={18} className="mr-2" />
                    View Timesheets
                  </Button>
                </Link>
                <Link href="/reports" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp size={18} className="mr-2" />
                    View Reports
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </MainLayout>
  );
}
