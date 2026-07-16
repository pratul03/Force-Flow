"use client";

import { useEffect, useState, useMemo } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { TableLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { useDepartmentsStore } from "@/features/departments/store";
import { useDepartments, useCreateDepartment, useDeleteDepartment } from "@/features/departments/queries";
import { useEmployees } from "@/features/employees/queries";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";

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
        <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-4">
                      <TableLoadingSkeleton rows={3} />
                    </TableCell>
                  </TableRow>
                ) : departments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No departments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept) => (
                    <TableRow
                      key={dept.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {dept.code}
                      </TableCell>
                      <TableCell>{dept.name}</TableCell>
                      <TableCell>
                        {dept.parent ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            {dept.parent.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            Top Level
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {dept.manager ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                {dept.manager.name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {dept.manager.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(dept.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </StaggerItem>
    </PageShell>
  );
}
