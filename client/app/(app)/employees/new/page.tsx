"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { useCreateEmployee } from "@/features/employees/queries";
import { Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Employee",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

function buildEmployeeId() {
  return `EMP${Date.now().toString().slice(-6)}`;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { mutateAsync: createEmployee, isPending } = useCreateEmployee();
  const [error, setError] = useState<string | null>(null);

  const formTitle = useMemo(() => "Create Employee", []);

  const handleSubmit = async (data: Partial<Employee>) => {
    setError(null);

    if (!user?.organizationId) {
      setError("Organization is required to create an employee");
      return;
    }

    if (!data.name || !data.email || !data.joinDate) {
      setError("Name, email, and join date are required");
      return;
    }

    const { firstName, lastName } = splitName(data.name);

    try {
      await createEmployee({
        firstName,
        lastName,
        email: data.email,
        password: "TempPass123!",
        employeeId: buildEmployeeId(),
        organizationId: user.organizationId,
        joiningDate: new Date(data.joinDate).toISOString(),
        role: "EMPLOYEE",
        status: data.status === "inactive" ? "INACTIVE" : "ACTIVE",
      });
      router.push("/employees");
    } catch (e: any) {
      setError(e.message || "Failed to create employee");
    }
  };

  return (
    <PageShell
      title={formTitle}
      description="Add a new employee to your organization."
    >
      <EmployeeForm
        onSubmit={handleSubmit}
        isLoading={isPending}
        error={error}
      />
    </PageShell>
  );
}
