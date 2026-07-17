"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AnimatedFormCard } from "@/components/animations/AnimatedFormCard";
import { ButtonLoadingSkeleton } from "@/components/ui/loading-skeletons";

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const departments = [
  "org_eng",
  "org_sales",
  "org_hr",
  "Engineering",
  "Sales",
  "Marketing",
  "Finance",
  "Operations",
  "HR",
  "Legal",
  "Customer Support",
];

const positions = [
  "SUPER_ADMIN",
  "ADMIN",
  "HR_MANAGER",
  "MANAGER",
  "EMPLOYEE",
  "INTERN",
];

export function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    department: employee?.department || "",
    position: employee?.position || "",
    joinDate: employee?.joinDate || new Date().toISOString().split("T")[0],
    status: employee?.status || "active",
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        department: employee.department || "",
        position: employee.position || "",
        joinDate: employee.joinDate || "",
        status: employee.status || "",
      });
    }
  }, [employee]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department ID</Label>
          <Input
            id="department"
            placeholder="e.g. seed_dept_eng"
            value={formData.department}
            onChange={(e) => handleChange("department", e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Role / Position</Label>
          <Select
            value={formData.position}
            onValueChange={(value) => handleChange("position", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="INTERN">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="joinDate">Join Date *</Label>
          <Input
            id="joinDate"
            type="date"
            value={formData.joinDate}
            onChange={(e) => handleChange("joinDate", e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              handleChange("status", value as "active" | "inactive")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 justify-end pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <ButtonLoadingSkeleton inverted className="w-28" />
          ) : employee ? (
            "Update Employee"
          ) : (
            "Create Employee"
          )}
        </Button>
      </div>
    </form>
  );
}
