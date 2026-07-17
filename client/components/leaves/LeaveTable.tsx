"use client";

import { useMemo } from "react";
import { BackendLeave } from "@/features/leaves/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, XCircle, CheckCircle2, Ban } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table";

interface LeaveTableProps {
  leaves: BackendLeave[];
  isLoading?: boolean;
  onCancel?: (leave: BackendLeave) => void;
  onApprove?: (leave: BackendLeave) => void;
  onReject?: (leave: BackendLeave) => void;
  isManagerView?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
};

const typeColors: Record<string, string> = {
  SICK: "bg-red-50 text-red-700",
  VACATION: "bg-blue-50 text-blue-700",
  PERSONAL: "bg-purple-50 text-purple-700",
  MATERNITY: "bg-pink-50 text-pink-700",
  PATERNITY: "bg-indigo-50 text-indigo-700",
  UNPAID: "bg-slate-50 text-slate-700",
  OTHER: "bg-gray-50 text-gray-700",
};

export function LeaveTable({
  leaves,
  isLoading = false,
  onCancel,
  onApprove,
  onReject,
  isManagerView = false,
}: LeaveTableProps) {
  const columns = useMemo<ColumnDef<BackendLeave>[]>(() => {
    const cols: ColumnDef<BackendLeave>[] = [
      {
        accessorKey: "leaveType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Leave Type" />
        ),
        cell: ({ row }) => {
          const type = row.getValue("leaveType") as string;
          return (
            <Badge variant="outline" className={typeColors[type] || ""}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </Badge>
          );
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: "dates",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date Range" />
        ),
        cell: ({ row }) => {
          const startDate = new Date(row.original.startDate);
          const endDate = new Date(row.original.endDate);
          const isSameDay = startDate.toDateString() === endDate.toDateString();
          
          return (
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {isSameDay 
                  ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                }
              </span>
              <span className="text-xs text-muted-foreground">
                {row.original.isHalfDay ? "Half Day" : `${row.original.totalDays} Days`}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate text-sm" title={row.original.reason || "No reason provided"}>
            {row.original.reason || <span className="text-muted-foreground italic">No reason provided</span>}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <div className="flex flex-col items-start gap-1">
              <Badge
                className={`text-xs ${statusColors[status] || ""}`}
                variant="outline"
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Badge>
              {status === "REJECTED" && row.original.rejectionReason && (
                <span className="text-[10px] text-red-600 truncate max-w-[120px]" title={row.original.rejectionReason}>
                  {row.original.rejectionReason}
                </span>
              )}
            </div>
          );
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const leave = row.original;
          const isPending = leave.status === "PENDING";
          
          if (!isPending) return null; // Only show actions for pending leaves

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isManagerView && onCancel && (
                    <DropdownMenuItem
                      onClick={() => onCancel(leave)}
                      className="text-gray-600"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Request
                    </DropdownMenuItem>
                  )}
                  {isManagerView && (
                    <>
                      {onApprove && (
                        <DropdownMenuItem
                          onClick={() => onApprove(leave)}
                          className="text-green-600 focus:text-green-600 focus:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {onReject && (
                        <DropdownMenuItem
                          onClick={() => onReject(leave)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];

    if (isManagerView) {
      // Add employee column if manager view
      cols.splice(1, 0, {
        accessorKey: "userId",
        header: "Employee ID", // Normally you'd want to join this with user data or fetch user details
        cell: ({ row }) => (
          <span className="text-sm font-medium font-mono">{row.original.userId.slice(0, 8)}</span>
        ),
      });
    }

    return cols;
  }, [onApprove, onReject, onCancel, isManagerView]);

  return (
    <DataTable
      columns={columns}
      data={leaves}
      isLoading={isLoading}
      searchKey="reason"
      searchPlaceholder="Search by reason..."
      facetedFilters={[
        {
          column: "status",
          title: "Status",
          options: [
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
            { label: "Cancelled", value: "CANCELLED" },
          ],
        },
        {
          column: "leaveType",
          title: "Type",
          options: [
            { label: "Sick", value: "SICK" },
            { label: "Vacation", value: "VACATION" },
            { label: "Personal", value: "PERSONAL" },
            { label: "Maternity", value: "MATERNITY" },
            { label: "Paternity", value: "PATERNITY" },
            { label: "Unpaid", value: "UNPAID" },
            { label: "Other", value: "OTHER" },
          ],
        },
      ]}
    />
  );
}
