"use client";

import { useEffect, useState } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { useEmployeesStore } from "@/features/employees/store";
import { useEmployees, useDeleteEmployee } from "@/features/employees/queries";

export default function EmployeesPage() {
  const { searchTerm, setSearchTerm } = useEmployeesStore();
  
  // React Query Hook handles fetching, caching, and loading state
  const { data: employees = [], isLoading, error } = useEmployees();
  const { mutate: deleteEmployee } = useDeleteEmployee();

  // Client-side filtering
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = (employeeId: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteEmployee(employeeId);
    }
  };

  return (
    <PageShell
      title="Employees"
      description="Manage your team members and their information"
      error={error?.message}
      action={
        <Link href="/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      }
    >
      {/* Search and filters */}
      <StaggerItem>
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Employee table */}
      <StaggerItem>
        <EmployeeTable
          employees={filteredEmployees}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </StaggerItem>
    </PageShell>
  );
}
