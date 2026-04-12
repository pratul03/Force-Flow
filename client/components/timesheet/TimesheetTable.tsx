"use client";

import { TimesheetEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react";
import { format } from "date-fns";

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string) => void;
  onEdit?: (entry: TimesheetEntry) => void;
  onDelete?: (entryId: string) => void;
  isLoading?: boolean;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function TimesheetTable({
  entries,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isLoading = false,
}: TimesheetTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} />;
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
        <p className="text-gray-500">No timesheet entries found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {format(new Date(entry.date), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-sm">{entry.startTime}</TableCell>
              <TableCell className="text-sm">{entry.endTime}</TableCell>
              <TableCell className="text-sm font-semibold">
                {entry.hoursWorked.toFixed(2)} h
              </TableCell>
              <TableCell className="text-sm">
                {entry.overtime > 0 ? (
                  <span className="text-orange-600 font-semibold">
                    {entry.overtime.toFixed(2)} h
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <Badge
                  className={`text-xs ${statusColors[entry.status]}`}
                  variant="outline"
                >
                  {entry.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {entry.status === "pending" && (
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
                    {entry.status !== "approved" && (
                      <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete?.(entry.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
