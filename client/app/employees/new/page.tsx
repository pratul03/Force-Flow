"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { employeeApi, usersApi } from "@/lib/api";
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
  const [organizationId, setOrganizationId] = useState<string | null>(
    user?.organizationId || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveOrganizationId() {
      if (organizationId || !user?.id) return;

      const response = await usersApi.getById(user.id);
      if (!response.success || !response.data?.organizationId) {
        setError("Unable to resolve organization for employee creation");
        return;
      }

      setOrganizationId(response.data.organizationId);
    }

    void resolveOrganizationId();
  }, [organizationId, user?.id]);

  const formTitle = useMemo(() => "Create Employee", []);

  const handleSubmit = async (data: Partial<Employee>) => {
    setError(null);

    if (!organizationId) {
      setError("Organization is required to create an employee");
      return;
    }

    if (!data.name || !data.email || !data.joinDate) {
      setError("Name, email, and join date are required");
      return;
    }

    setIsSubmitting(true);

    const { firstName, lastName } = splitName(data.name);

    const response = await employeeApi.create({
      firstName,
      lastName,
      email: data.email,
      password: "TempPass123!",
      employeeId: buildEmployeeId(),
      organizationId,
      joiningDate: new Date(data.joinDate).toISOString(),
      role: "EMPLOYEE",
      status: data.status === "inactive" ? "INACTIVE" : "ACTIVE",
    });

    if (!response.success) {
      setError(response.error || "Failed to create employee");
      setIsSubmitting(false);
      return;
    }

    router.push("/employees");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{formTitle}</h1>
          <p className="mt-2 text-gray-600">
            Add a new employee to your organization.
          </p>
        </div>

        <EmployeeForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          error={error}
        />
      </div>
    </MainLayout>
  );
}
