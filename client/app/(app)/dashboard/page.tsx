"use client";

import { useMemo } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  RecentActivity,
  ActivityItem,
} from "@/components/dashboard/RecentActivity";
import { D3Charts } from "@/components/dashboard/D3Charts";
import { AttendanceWidget } from "@/components/attendance/AttendanceWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BentoGrid } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { useDashboardStats, useRecentActivities } from "@/features/dashboard/queries";
import { DashboardStats } from "@/features/dashboard/types";
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
  const { data: stats = defaultStats, isLoading: isStatsLoading, error: statsError } = useDashboardStats();
  const { data: activitiesPayload, isLoading: isActivitiesLoading, error: activitiesError } = useRecentActivities();
  
  const activities = useMemo(() => mapActivityData(activitiesPayload as unknown as AuditActivityResponse), [activitiesPayload]);

  const isLoading = isStatsLoading || isActivitiesLoading;
  const error = (statsError as Error)?.message || (activitiesError as Error)?.message || null;

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <PageShell
      title="Dashboard"
      description="Welcome back! Here's an overview of your organization."
      error={error}
    >
        <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto">
          {/* Row 1 */}
          <div className="md:col-span-2">
            <D3Charts isLoading={false} />
          </div>
          <div className="md:col-span-1">
            <Card className="h-full">
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

          {/* Row 2 */}
          <div className="md:col-span-1">
            <div className="h-full">
              <AttendanceWidget />
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Users}
              color="blue"
              description="Active employees"
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

          {/* Row 3 */}
          <div className="md:col-span-3">
            <RecentActivity activities={activities} />
          </div>
        </BentoGrid>
    </PageShell>
  );
}
