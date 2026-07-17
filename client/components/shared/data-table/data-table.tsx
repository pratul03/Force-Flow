"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;

  // Handlers for controlled (server-side) mode
  onPaginationChange?: (updater: any) => void;
  onSortingChange?: (updater: any) => void;
  onColumnFiltersChange?: (updater: any) => void;

  // State for controlled (server-side) mode
  pagination?: { pageIndex: number; pageSize: number };
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;

  // Toolbar configuration
  searchKey?: string;
  searchPlaceholder?: string;
  facetedFilters?: {
    column: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];

  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
  pagination: controlledPagination,
  sorting: controlledSorting,
  columnFilters: controlledFilters,
  searchKey,
  searchPlaceholder,
  facetedFilters,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const isControlled = pageCount !== undefined;

  // Explicit local state so useReactTable never self-initializes state during render
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [localPagination, setLocalPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data,
    columns,
    pageCount: isControlled ? pageCount : undefined,
    state: {
      sorting: isControlled && controlledSorting !== undefined ? controlledSorting : sorting,
      columnFilters: isControlled && controlledFilters !== undefined ? controlledFilters : columnFilters,
      columnVisibility,
      rowSelection,
      pagination: isControlled && controlledPagination ? controlledPagination : localPagination,
    },
    onSortingChange: isControlled && onSortingChange ? onSortingChange : setSorting,
    onColumnFiltersChange: isControlled && onColumnFiltersChange ? onColumnFiltersChange : setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: isControlled && onPaginationChange ? onPaginationChange : setLocalPagination,
    enableRowSelection: true,
    manualPagination: isControlled,
    manualSorting: isControlled,
    manualFiltering: isControlled,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Card className="w-full h-full flex flex-col shadow-sm border-muted">
      <div className="p-3 flex-none">
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          facetedFilters={facetedFilters}
        />
      </div>
      <div className="flex-1 overflow-auto border-t">
        <Table>
          <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="h-11 px-4 first:pl-6 last:pr-6 whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 px-4 first:pl-6 last:pr-6 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="p-4 border-t flex-none bg-muted/10">
        <DataTablePagination table={table} />
      </div>
    </Card>
  );
}
