import { Injectable } from '@nestjs/common';
import {
  InvoiceStatus,
  LeaveStatus,
  TimeLogStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DashboardPeriod } from '../dto/dashboard-charts-query.dto';

// Simple CSV utility function
function jsonToCsv(items: any[]): string {
  if (!items || items.length === 0) return '';
  const headers = Object.keys(items[0]);
  const rows = items.map((item) =>
    headers
      .map((header) => {
        const val = item[header];
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        if (val instanceof Date) return `"${val.toISOString()}"`;
        if (val === null || val === undefined) return '';
        return val;
      })
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

type ChartPoint = {
  label: string;
  value: number;
};

type DepartmentChartPoint = ChartPoint & {
  color: string;
};

const CHART_COLORS = ['#2563eb', '#0ea5e9', '#22c55e', '#f59e0b', '#f97316', '#14b8a6'];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(organizationId: string) {
    const [users, leaves, timelogs, wallets, queuePending] = await Promise.all([
      this.prisma.user.count({
        where: {
          organizationId,
        },
      }),
      this.prisma.leave.count({
        where: {
          user: {
            organizationId,
          },
        },
      }),
      this.prisma.timeLog.count({
        where: {
          user: {
            organizationId,
          },
        },
      }),
      this.prisma.wallet.count({
        where: {
          user: {
            organizationId,
          },
        },
      }),
      this.countPendingQueueJobsForOrganization(organizationId),
    ]);

    return {
      organizations: 1,
      users,
      leaves,
      timelogs,
      wallets,
      queuePending,
      generatedAt: new Date().toISOString(),
    };
  }

  async dashboardStats(organizationId: string) {
    const today = new Date();
    const { start, end } = this.dayRange(today);
    return this.buildSnapshotStats(organizationId, { start, end });
  }

  async dashboardCharts(organizationId: string, period: DashboardPeriod) {
    const periodRange = this.getRangeForPeriod(period);
    const snapshotRange = this.dayRange(new Date());

    const [stats, attendanceTrend, departmentDistribution, salaryResult, organization] =
      await Promise.all([
        this.buildSnapshotStats(organizationId, snapshotRange),
        this.buildAttendanceTrend(organizationId, period),
        this.buildDepartmentDistribution(organizationId),
        this.buildSalaryDistribution(organizationId, period),
        this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: { currency: true },
        }),
      ]);

    const workload = await this.buildWorkload(organizationId, periodRange, stats.totalEmployees);

    return {
      period,
      currency: organization?.currency ?? 'INR',
      attendanceTrend,
      workload,
      departmentDistribution,
      salaryDistribution: salaryResult.salaryDistribution,
      totalSalary: salaryResult.totalSalary,
      generatedAt: new Date().toISOString(),
    };
  }

  private async buildSnapshotStats(
    organizationId: string,
    dateRange: { start: Date; end: Date },
  ) {
    const [totalEmployees, presentUsersToday, onLeaveToday, pendingLeaveRequests, pendingTimesheets] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            organizationId,
            status: {
              in: [UserStatus.ACTIVE, UserStatus.ON_LEAVE, UserStatus.PROBATION],
            },
          },
        }),
        this.prisma.timeLog.findMany({
          where: {
            user: { organizationId },
            clockIn: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
          distinct: ['userId'],
          select: { userId: true },
        }),
        this.prisma.leave.findMany({
          where: {
            user: { organizationId },
            status: LeaveStatus.APPROVED,
            startDate: {
              lte: dateRange.end,
            },
            endDate: {
              gte: dateRange.start,
            },
          },
          distinct: ['userId'],
          select: { userId: true },
        }),
        this.prisma.leave.count({
          where: {
            user: { organizationId },
            status: LeaveStatus.PENDING,
          },
        }),
        this.prisma.timeLog.count({
          where: {
            user: { organizationId },
            status: TimeLogStatus.PENDING_APPROVAL,
          },
        }),
      ]);

    const presentToday = presentUsersToday.length;
    const onLeave = onLeaveToday.length;
    const absentToday = Math.max(0, totalEmployees - presentToday - onLeave);

    return {
      totalEmployees,
      presentToday,
      onLeave,
      absentToday,
      pendingLeaveRequests,
      pendingTimesheets,
    };
  }

  private async buildAttendanceTrend(
    organizationId: string,
    period: DashboardPeriod,
  ): Promise<ChartPoint[]> {
    if (period === 'monthly') {
      const lastDays = Array.from({ length: 8 }).map((_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (7 - index));

        const label = new Intl.DateTimeFormat('en', {
          day: '2-digit',
          month: 'short',
        }).format(date);

        const { start, end } = this.dayRange(date);
        return { label, start, end };
      });

      const values = await Promise.all(
        lastDays.map((bucket) =>
          this.countDistinctTimelogUsers(organizationId, bucket.start, bucket.end),
        ),
      );

      return lastDays.map((bucket, index) => ({
        label: bucket.label,
        value: values[index],
      }));
    }

    if (period === 'yearly') {
      const now = new Date();
      const year = now.getFullYear();
      const months = Array.from({ length: 12 }).map((_, monthIndex) => {
        const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
        const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        const label = new Intl.DateTimeFormat('en', { month: 'short' }).format(start);
        return { label, start, end };
      });

      const values = await Promise.all(
        months.map((bucket) =>
          this.countDistinctTimelogUsers(organizationId, bucket.start, bucket.end),
        ),
      );

      return months.map((bucket, index) => ({
        label: bucket.label,
        value: values[index],
      }));
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }).map((_, index) => {
      const year = currentYear - 4 + index;
      const start = new Date(year, 0, 1, 0, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return {
        label: String(year),
        start,
        end,
      };
    });

    const values = await Promise.all(
      years.map((bucket) =>
        this.countDistinctTimelogUsers(organizationId, bucket.start, bucket.end),
      ),
    );

    return years.map((bucket, index) => ({
      label: bucket.label,
      value: values[index],
    }));
  }

  private async buildDepartmentDistribution(
    organizationId: string,
  ): Promise<DepartmentChartPoint[]> {
    const grouped = await this.prisma.user.groupBy({
      by: ['departmentId'],
      where: {
        organizationId,
        status: {
          in: [UserStatus.ACTIVE, UserStatus.ON_LEAVE, UserStatus.PROBATION],
        },
      },
      _count: {
        _all: true,
      },
    });

    const departmentIds = grouped
      .map((entry) => entry.departmentId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const departments = departmentIds.length
      ? await this.prisma.department.findMany({
          where: {
            id: {
              in: departmentIds,
            },
            organizationId,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const departmentNameById = new Map(departments.map((dept) => [dept.id, dept.name]));

    const distribution = grouped
      .map((entry) => {
        const label =
          (entry.departmentId ? departmentNameById.get(entry.departmentId) : null) ??
          'Unassigned';

        return {
          label,
          value: entry._count._all,
        };
      })
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    return distribution.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }

  private async buildSalaryDistribution(
    organizationId: string,
    period: DashboardPeriod,
  ): Promise<{ salaryDistribution: DepartmentChartPoint[]; totalSalary: number }> {
    const now = new Date();

    const invoices = await this.prisma.invoice.findMany({
      where: {
        user: {
          organizationId,
        },
        status: InvoiceStatus.PAID,
        ...(period === 'monthly'
          ? {
              year: now.getFullYear(),
              month: now.getMonth() + 1,
            }
          : {}),
        ...(period === 'yearly'
          ? {
              year: now.getFullYear(),
            }
          : {}),
      },
      select: {
        grossAmount: true,
        user: {
          select: {
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const salaryByDepartment = new Map<string, number>();

    for (const invoice of invoices) {
      const label = invoice.user.department?.name ?? 'Unassigned';
      salaryByDepartment.set(label, (salaryByDepartment.get(label) ?? 0) + invoice.grossAmount);
    }

    const sorted = Array.from(salaryByDepartment.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    const salaryDistribution = sorted.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const totalSalary = salaryDistribution.reduce((sum, item) => sum + item.value, 0);

    return {
      salaryDistribution,
      totalSalary,
    };
  }

  private async buildWorkload(
    organizationId: string,
    range: { start: Date; end: Date } | null,
    totalEmployees: number,
  ): Promise<ChartPoint[]> {
    const [pendingLeaveRequests, approvedLeaveUsers, pendingTimesheets, presentUsers] =
      await Promise.all([
        this.prisma.leave.count({
          where: {
            user: { organizationId },
            status: LeaveStatus.PENDING,
            ...(range
              ? {
                  createdAt: {
                    gte: range.start,
                    lte: range.end,
                  },
                }
              : {}),
          },
        }),
        this.prisma.leave.findMany({
          where: {
            user: { organizationId },
            status: LeaveStatus.APPROVED,
            ...(range
              ? {
                  startDate: {
                    lte: range.end,
                  },
                  endDate: {
                    gte: range.start,
                  },
                }
              : {}),
          },
          distinct: ['userId'],
          select: { userId: true },
        }),
        this.prisma.timeLog.count({
          where: {
            user: { organizationId },
            status: TimeLogStatus.PENDING_APPROVAL,
            ...(range
              ? {
                  clockIn: {
                    gte: range.start,
                    lte: range.end,
                  },
                }
              : {}),
          },
        }),
        this.prisma.timeLog.findMany({
          where: {
            user: { organizationId },
            ...(range
              ? {
                  clockIn: {
                    gte: range.start,
                    lte: range.end,
                  },
                }
              : {}),
          },
          distinct: ['userId'],
          select: { userId: true },
        }),
      ]);

    const engagedUsers = new Set<string>([
      ...approvedLeaveUsers.map((entry) => entry.userId),
      ...presentUsers.map((entry) => entry.userId),
    ]);

    const absent = Math.max(0, totalEmployees - engagedUsers.size);

    return [
      {
        label: 'Pending Leaves',
        value: pendingLeaveRequests,
      },
      {
        label: 'On Leave',
        value: approvedLeaveUsers.length,
      },
      {
        label: 'Pending Timesheets',
        value: pendingTimesheets,
      },
      {
        label: 'Absent',
        value: absent,
      },
    ];
  }

  private async countDistinctTimelogUsers(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const users = await this.prisma.timeLog.findMany({
      where: {
        user: {
          organizationId,
        },
        clockIn: {
          gte: start,
          lte: end,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    return users.length;
  }

  private getRangeForPeriod(period: DashboardPeriod): { start: Date; end: Date } | null {
    const now = new Date();
    if (period === 'monthly') {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    }

    if (period === 'yearly') {
      return {
        start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    }

    return null;
  }

  private dayRange(day: Date): { start: Date; end: Date } {
    return {
      start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0),
      end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999),
    };
  }

  private async countPendingQueueJobsForOrganization(organizationId: string): Promise<number> {
    const pendingJobs = await this.prisma.queueJob.findMany({
      where: {
        status: 'PENDING',
      },
      select: {
        payload: true,
      },
      take: 500,
    });

    return pendingJobs.filter((job) => this.extractOrganizationId(job.payload) === organizationId)
      .length;
  }

  private extractOrganizationId(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;
    if (typeof data.organizationId === 'string' && data.organizationId.length > 0) {
      return data.organizationId;
    }

    if (
      data.metadata &&
      typeof data.metadata === 'object' &&
      typeof (data.metadata as Record<string, unknown>).organizationId === 'string'
    ) {
      return (data.metadata as Record<string, string>).organizationId;
    }

    return null;
  }

  async exportEmployeesCsv(organizationId: string): Promise<string> {
    const employees = await this.prisma.user.findMany({
      where: { organizationId },
      include: {
        department: true,
        designation: true,
      },
      orderBy: { firstName: 'asc' },
    });

    const data = employees.map((emp) => ({
      'Employee ID': emp.employeeId || '',
      'First Name': emp.firstName,
      'Last Name': emp.lastName,
      'Email': emp.email,
      'Role': emp.role,
      'Status': emp.status,
      'Department': emp.department?.name || '',
      'Designation': emp.designation?.name || '',
      'Joining Date': emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : '',
    }));

    return jsonToCsv(data);
  }

  async exportLeavesCsv(organizationId: string): Promise<string> {
    const leaves = await this.prisma.leave.findMany({
      where: { user: { organizationId } },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = leaves.map((leave) => ({
      'Employee Name': `${leave.user.firstName} ${leave.user.lastName}`,
      'Employee Email': leave.user.email,
      'Leave Type': leave.leaveType,
      'Start Date': leave.startDate.toISOString().split('T')[0],
      'End Date': leave.endDate.toISOString().split('T')[0],
      'Total Days': leave.totalDays,
      'Reason': leave.reason,
      'Status': leave.status,
      'Applied On': leave.createdAt.toISOString().split('T')[0],
    }));

    return jsonToCsv(data);
  }
}
