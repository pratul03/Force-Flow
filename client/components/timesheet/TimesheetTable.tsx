"use client";

import { useMemo } from "react";
import { TimesheetEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string) => void;
  onEdit?: (entry: TimesheetEntry) => void;
  onDelete?: (entryId: string) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function TimesheetTable({
  entries,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isLoading = false,
}: TimesheetTableProps) {
  const columns = useMemo<ColumnDef<TimesheetEntry>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {format(new Date(row.original.date), "MMM dd, yyyy")}
          </span>
        ),
      },
      {
        accessorKey: "employeeName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.employeeName || "You"}
          </span>
        ),
      },
      {
        accessorKey: "startTime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Start Time" />
        ),
        cell: ({ row }) => <span className="text-sm">{row.getValue("startTime")}</span>,
      },
      {
        accessorKey: "endTime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="End Time" />
        ),
        cell: ({ row }) => <span className="text-sm">{row.getValue("endTime")}</span>,
      },
      {
        accessorKey: "hoursWorked",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Hours Worked" />
        ),
        cell: ({ row }) => {
          const hours = row.getValue("hoursWorked") as number;
          return <span className="text-sm font-semibold">{hours.toFixed(2)} h</span>;
        },
      },
      {
        accessorKey: "overtime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Overtime" />
        ),
        cell: ({ row }) => {
          const ot = row.getValue("overtime") as number;
          return (
            <span className="text-sm">
              {ot > 0 ? (
                <span className="text-orange-600 font-semibold">
                  {ot.toFixed(2)} h
                </span>
              ) : (
                "-"
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const normalizedStatus = status.toLowerCase();
          return (
            <Badge
              className={`text-xs capitalize ${statusColors[normalizedStatus] || "bg-gray-100 text-gray-800"}`}
              variant="outline"
            >
              {status}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const entry = row.original;
          const status = entry.status.toLowerCase();
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
                  {status === "pending" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onApprove?.(entry.id)}
                        className="text-green-600"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onReject?.(entry.id)}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  {status !== "approved" && (
                    <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete?.(entry.id)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onApprove, onReject, onEdit, onDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={entries}
      isLoading={isLoading}
      searchKey="date"
      searchPlaceholder="Search by date (YYYY-MM-DD)..."
      facetedFilters={[
        {
          column: "status",
          title: "Status",
          options: statuses,
        },
      ]}
    />
  );
}
