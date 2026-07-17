"use client";

import { useState, useCallback } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useEmployeesStore } from "@/features/employees/store";
import {
  useEmployees,
  useEmployee,
  useDeleteEmployee,
  useUpdateEmployee,
  useCreateEmployee,
} from "@/features/employees/queries";
import { ConfirmDeleteDialog } from "@/components/shared/dialogs/ConfirmDeleteDialog";
import { DynamicModal } from "@/components/shared/dialogs/DynamicModal";
import { Employee } from "@/lib/types";
import { ButtonLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { EditEmployeeFormWrapper } from "@/components/employees/EditEmployeeFormWrapper";
import { useAuth } from "@/hooks/useAuth";
import { reportsApi } from "@/features/reports/api";
import { toast } from "sonner";

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

export default function EmployeesPage() {
  const { user } = useAuth();

  // Queries & Mutations
  const { data: employees = [], isLoading, error } = useEmployees();
  const { mutateAsync: deleteEmployee, isPending: isDeleting } =
    useDeleteEmployee();
  const { mutateAsync: updateEmployee, isPending: isUpdating } =
    useUpdateEmployee();
  const { mutateAsync: createEmployee, isPending: isCreating } =
    useCreateEmployee();

  // Local State
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await reportsApi.exportEmployees();
      toast.success("Export successful");
    } catch (e: any) {
      toast.error(e.message || "Failed to export employees");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateSubmit = async (data: Partial<Employee>) => {
    setFormError(null);
    if (!user?.organizationId) return setFormError("Organization is required");
    if (!data.name || !data.email || !data.joinDate)
      return setFormError("Name, email, and join date are required");

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
      setIsCreateModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || "Failed to create employee");
    }
  };

  const handleUpdateSubmit = async (data: Partial<Employee>) => {
    setFormError(null);
    if (!employeeToEdit || !user?.organizationId) return;

    try {
      const payload: any = {};
      if (data.name) {
        const { firstName, lastName } = splitName(data.name);
        payload.firstName = firstName;
        payload.lastName = lastName;
      }
      if (data.email) payload.email = data.email;
      if (data.joinDate)
        payload.joiningDate = new Date(data.joinDate).toISOString();
      if (data.status)
        payload.status = data.status === "inactive" ? "INACTIVE" : "ACTIVE";
      if (data.department) payload.departmentId = data.department;
      if (data.position) payload.role = data.position;

      await updateEmployee({
        id: employeeToEdit.id,
        payload,
      });
      setEmployeeToEdit(null);
    } catch (e: any) {
      setFormError(e.message || "Failed to update employee");
    }
  };

  const handleDeleteRequest = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee);
  }, []);

  return (
    <PageShell
      title="Employees"
      description="Manage your team members and their information"
      error={error?.message}
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting || employees.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      }
    >
      <StaggerItem>
        <EmployeeTable
          employees={employees}
          onEdit={setEmployeeToEdit}
          onDelete={handleDeleteRequest}
          isLoading={isLoading}
        />
      </StaggerItem>

      <ConfirmDeleteDialog
        isOpen={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={handleDeleteConfirm}
        itemName={employeeToDelete?.name}
        isLoading={isDeleting}
      />

      <DynamicModal
        title="Create Employee"
        description="Add a new employee to your organization."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="lg"
      >
        <EmployeeForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isCreating}
          error={formError}
        />
      </DynamicModal>

      <DynamicModal
        title="Edit Employee"
        description="Update employee details."
        isOpen={!!employeeToEdit}
        onClose={() => setEmployeeToEdit(null)}
        maxWidth="lg"
      >
        {employeeToEdit && (
          <EditEmployeeFormWrapper 
            employeeId={employeeToEdit.id} 
            onSubmit={handleUpdateSubmit} 
            onCancel={() => setEmployeeToEdit(null)}
            isUpdating={isUpdating} 
            formError={formError} 
          />
        )}
      </DynamicModal>
    </PageShell>
  );
}


