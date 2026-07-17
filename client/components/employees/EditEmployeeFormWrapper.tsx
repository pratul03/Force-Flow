"use client";

import { useEmployee } from "@/features/employees/queries";
import { EmployeeForm } from "./EmployeeForm";
import { ButtonLoadingSkeleton } from "@/components/ui/loading-skeletons";

export function EditEmployeeFormWrapper({
  employeeId,
  onSubmit,
  onCancel,
  isUpdating,
  formError,
}: {
  employeeId: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isUpdating: boolean;
  formError: string | null;
}) {
  const { data: freshEmployee, isLoading } = useEmployee(employeeId);

  if (isLoading || !freshEmployee) {
    return (
      <div className="p-8 flex justify-center">
        <ButtonLoadingSkeleton className="w-32" />
      </div>
    );
  }

  return (
    <EmployeeForm
      employee={freshEmployee}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isUpdating}
      error={formError}
    />
  );
}
