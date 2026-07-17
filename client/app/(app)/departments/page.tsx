"use client";

import { useEffect, useState, useMemo } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DepartmentTable } from "@/components/departments/DepartmentTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useDepartmentsStore } from "@/features/departments/store";
import { useDepartments, useCreateDepartment, useDeleteDepartment } from "@/features/departments/queries";
import { useEmployees } from "@/features/employees/queries";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const { user } = useAuth();
  
  const { isCreateModalOpen: isDialogOpen, setCreateModalOpen: setIsDialogOpen } = useDepartmentsStore();

  const { data: departments = [], isLoading: isLoadingDepts } = useDepartments(user?.organizationId);
  const { data: users = [], isLoading: isLoadingUsers } = useEmployees();
  
  const { mutateAsync: createDepartment, isPending: isSaving } = useCreateDepartment();
  const { mutateAsync: deleteDepartment } = useDeleteDepartment();

  const isLoading = isLoadingDepts || isLoadingUsers;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    parentId: "none",
    managerId: "none",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organizationId) return;

    try {
      await createDepartment({
        name: formData.name,
        code: formData.code,
        organizationId: user.organizationId,
        managerId: formData.managerId === "none" ? undefined : formData.managerId,
        // parentId: formData.parentId === "none" ? undefined : formData.parentId, // Backend support needed
      });
      toast.success("Department created successfully");
      setIsDialogOpen(false);
      setFormData({ name: "", code: "", parentId: "none", managerId: "none" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create department");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartment(id);
      toast.success("Department deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete department");
    }
  };

  return (
    <PageShell
      title="Departments"
      description="Manage your organization's hierarchy and department managers."
      action={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
              Create Department
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new department and assign its manager and parent.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Engineering"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Department Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="e.g. ENG"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Parent Department</Label>
                  <Select
                    value={formData.parentId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, parentId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Parent Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        -- Top Level (No Parent) --
                      </SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Department Manager</Label>
                  <Select
                    value={formData.managerId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, managerId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Manager --</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <StaggerItem>
        <DepartmentTable
          departments={departments}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </StaggerItem>
    </PageShell>
  );
}
