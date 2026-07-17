"use client";

import { useMemo } from "react";
import { BackendHoliday } from "@/features/holidays/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table";

interface HolidayTableProps {
  holidays: BackendHoliday[];
  onEdit?: (holiday: BackendHoliday) => void;
  onDelete?: (holiday: BackendHoliday) => void;
  isLoading?: boolean;
}

const typeColors: Record<string, string> = {
  PUBLIC: "bg-blue-100 text-blue-800 border-blue-200",
  COMPANY: "bg-green-100 text-green-800 border-green-200",
  OPTIONAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function HolidayTable({
  holidays,
  onEdit,
  onDelete,
  isLoading = false,
}: HolidayTableProps) {
  const columns = useMemo<ColumnDef<BackendHoliday>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Holiday Name" />
      ),
      cell: ({ row }) => {
        return (
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            {row.original.description && (
              <p className="text-xs text-muted-foreground">{row.original.description}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString(undefined, { weekday: 'long' })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = (row.getValue("type") as string) || "";
        if (!type) return null;
        return (
          <Badge
            className={`text-xs ${typeColors[type] || ""}`}
            variant="outline"
          >
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "locations",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Locations" />
      ),
      cell: ({ row }) => {
        const locations = row.original.locations;
        if (!locations || locations.length === 0) {
          return <span className="text-muted-foreground text-sm">All Locations</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {locations.map((loc) => (
              <Badge key={loc.id} variant="secondary" className="text-[10px]">
                {loc.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const holiday = row.original;
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
                <DropdownMenuItem onClick={() => onEdit?.(holiday)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(holiday)}
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
  ], [onEdit, onDelete]);

  return (
    <DataTable
      columns={columns}
      data={holidays}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Search holidays..."
      facetedFilters={[
        {
          column: "type",
          title: "Type",
          options: [
            { label: "Public", value: "PUBLIC" },
            { label: "Company", value: "COMPANY" },
            { label: "Optional", value: "OPTIONAL" },
          ],
        },
      ]}
    />
  );
}
