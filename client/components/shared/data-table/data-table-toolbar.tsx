"use client";

import React, { useEffect, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  facetedFilters?: {
    column: string;
    title: string;
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[];
  }[];
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  facetedFilters,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  
  // Local state for debounced searching
  const [searchValue, setSearchValue] = useState<string>(
    (searchKey && (table.getColumn(searchKey)?.getFilterValue() as string)) || ""
  );

  // Track whether this is the first render to avoid firing the filter on mount
  const isMounted = React.useRef(false);

  // Debounce the search input
  useEffect(() => {
    if (!searchKey) return;
    
    // Skip the very first render to avoid the "state update before mount" React warning
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const timeout = setTimeout(() => {
      table.getColumn(searchKey)?.setFilterValue(searchValue);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchValue, searchKey, table]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <div className="relative">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-10 w-50 lg:w-87.5 text-sm pr-8"
            />
            {searchValue && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchValue("");
                  table.getColumn(searchKey)?.setFilterValue("");
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Cross2Icon className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        )}
        
        {facetedFilters?.map((filter) => {
          const column = table.getColumn(filter.column);
          if (!column) return null;
          return (
            <DataTableFacetedFilter
              key={filter.column}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setSearchValue("");
            }}
            className="h-10 px-2 lg:px-3 text-sm"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
