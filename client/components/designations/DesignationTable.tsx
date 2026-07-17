"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table";

// Re-using the formatCurrency helper from the page
const formatCurrency = (amount: number | null | undefined, currency: string) => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

interface DesignationTableProps {
  designations: any[]; // We can use 'any' or the specific Designation type
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function DesignationTable({
  designations,
  onDelete,
  isLoading = false,
}: DesignationTableProps) {
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Code" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {row.getValue("code") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Job Title" />
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      id: "salaryBand",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Salary Band" />
      ),
      cell: ({ row }) => {
        const des = row.original;
        if (des.minSalary || des.maxSalary) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {formatCurrency(des.minSalary, des.currency || 'USD')} - {formatCurrency(des.maxSalary, des.currency || 'USD')}
            </span>
          );
        }
        return <span className="text-gray-400 italic text-sm">Not specified</span>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const des = row.original;
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
                <DropdownMenuItem
                  onClick={() => onDelete?.(des.id)}
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
  ], [onDelete]);

  return (
    <DataTable
      columns={columns}
      data={designations}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Search designations..."
    />
  );
}
