"use client";

import { useMemo } from "react";
import { Department } from "@/lib/types";
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
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";

interface DepartmentTableProps {
  departments: Department[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function DepartmentTable({
  departments,
  onDelete,
  isLoading = false,
}: DepartmentTableProps) {
  const columns = useMemo<ColumnDef<Department>[]>(() => [
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
        <DataTableColumnHeader column={column} title="Department Name" />
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      id: "parent",
      accessorFn: (row) => row.parent?.name || "Top Level",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parent Department" />
      ),
      cell: ({ row }) => {
        const parentName = row.original.parent?.name;
        if (parentName) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {parentName}
            </span>
          );
        }
        return <span className="text-gray-400 italic text-sm">Top Level</span>;
      },
    },
    {
      id: "manager",
      accessorFn: (row) => row.manager?.name || "Unassigned",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Manager" />
      ),
      cell: ({ row }) => {
        const manager = row.original.manager;
        if (manager) {
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700 rounded-full h-full w-full flex items-center justify-center font-semibold">
                  {manager.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{manager.name}</span>
            </div>
          );
        }
        return <span className="text-gray-400 italic text-sm">Unassigned</span>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const dept = row.original;
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
                  onClick={() => onDelete?.(dept.id)}
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
      data={departments}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Search departments..."
    />
  );
}
