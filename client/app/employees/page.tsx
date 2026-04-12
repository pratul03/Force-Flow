"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { Employee } from "@/lib/types";
import { useApp } from "@/hooks/useApp";
import { employeeApi, mapBackendUserToEmployee } from "@/lib/api";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setEmployees: setAppEmployees } = useApp();

  useEffect(() => {
    async function loadEmployees() {
      setIsLoading(true);
      setError(null);

      const response = await employeeApi.getAll();

      if (!response.success || !response.data) {
        setError(response.error || "Failed to load employees");
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      setEmployees(response.data.map(mapBackendUserToEmployee));
      setIsLoading(false);
    }

    void loadEmployees();
  }, []);

  // Update app store with employees
  useEffect(() => {
    setAppEmployees(employees);
  }, [employees, setAppEmployees]);

  // Filter employees based on search
  useEffect(() => {
    const filtered = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const handleDelete = async (employeeId: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      const response = await employeeApi.delete(employeeId);
      if (!response.success) {
        setError(response.error || "Failed to delete employee");
        return;
      }
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    }
  };

  return (
    <MainLayout>
      <StaggerContainer className="space-y-6">
        {/* Page header */}
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
              <p className="text-gray-600 mt-2">
                Manage your team members and their information
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <Link href="/employees/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </Link>
          </div>
        </StaggerItem>

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
      </StaggerContainer>
    </MainLayout>
  );
}
