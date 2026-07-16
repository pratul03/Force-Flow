"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/PageShell";
import { useEmployee } from "@/features/employees/queries";
import { Employee } from "@/lib/types";

export default function EmployeeDetailsPage() {
  const params = useParams<{ id: string }>();
  
  const { data: employee, isLoading, error } = useEmployee(params?.id as string);

  return (
    <PageShell
      title="Employee Details"
      description="View detailed profile information."
      error={error?.message}
    >
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
    </PageShell>
  );
}
