"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapBackendUserToEmployee, usersApi } from "@/lib/api";
import { Employee } from "@/lib/types";

export default function EmployeeDetailsPage() {
  const params = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployee() {
      if (!params?.id) return;

      const response = await usersApi.getById(params.id);
      if (!response.success || !response.data) {
        setError(response.error || "Failed to load employee details");
        return;
      }

      setEmployee(mapBackendUserToEmployee(response.data));
    }

    void loadEmployee();
  }, [params?.id]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Details</h1>
          <p className="mt-2 text-gray-600">
            View detailed profile information.
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{employee?.name || "Employee"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {employee?.email || "-"}
            </p>
            <p>
              <span className="font-semibold">Department:</span>{" "}
              {employee?.department || "-"}
            </p>
            <p>
              <span className="font-semibold">Position:</span>{" "}
              {employee?.position || "-"}
            </p>
            <p>
              <span className="font-semibold">Join Date:</span>{" "}
              {employee?.joinDate || "-"}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {employee?.status || "-"}
            </p>
            <p>
              <span className="font-semibold">Employee ID:</span>{" "}
              {employee?.employeeId || "-"}
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
