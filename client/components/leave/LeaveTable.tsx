"use client";

import { LeaveRequest } from "@/lib/types";
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

interface LeaveTableProps {
  requests: LeaveRequest[];
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onEdit?: (request: LeaveRequest) => void;
  onDelete?: (requestId: string) => void;
  isLoading?: boolean;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const typeColors = {
  vacation: "bg-blue-100 text-blue-800",
  sick: "bg-red-100 text-red-800",
  personal: "bg-purple-100 text-purple-800",
  unpaid: "bg-gray-100 text-gray-800",
};

export function LeaveTable({
  requests,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isLoading = false,
}: LeaveTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton rows={6} />;
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
        <p className="text-gray-500">No leave requests found</p>
      </div>
    );
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                <div className="text-sm">{request.employeeId}</div>
              </TableCell>
              <TableCell>
                <Badge
                  className={`text-xs ${typeColors[request.type]}`}
                  variant="outline"
                >
                  {request.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(request.startDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(request.endDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="font-semibold">
                {calculateDays(request.startDate, request.endDate)} days
              </TableCell>
              <TableCell className="text-sm max-w-xs truncate">
                {request.reason || "-"}
              </TableCell>
              <TableCell>
                <Badge
                  className={`text-xs ${statusColors[request.status]}`}
                  variant="outline"
                >
                  {request.status}
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
                    {request.status === "pending" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onApprove?.(request.id)}
                          className="text-green-600"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onReject?.(request.id)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {request.status !== "approved" && (
                      <DropdownMenuItem onClick={() => onEdit?.(request)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete?.(request.id)}
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
