"use client";

import { useState } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { CURRENCIES } from "@/lib/config/currencies";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DesignationTable } from "@/components/designations/DesignationTable";
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
import { useDesignationsStore } from "@/features/designations/store";
import {
  useDesignations,
  useCreateDesignation,
  useDeleteDesignation,
} from "@/features/designations/queries";
import { toast } from "sonner";

export default function DesignationsPage() {
  const { user } = useAuth();

  const {
    isCreateModalOpen: isDialogOpen,
    setCreateModalOpen: setIsDialogOpen,
  } = useDesignationsStore();

  const { data: designations = [], isLoading } = useDesignations(
    user?.organizationId,
  );
  const { mutateAsync: createDesignation, isPending: isSaving } =
    useCreateDesignation();
  const { mutateAsync: deleteDesignation } = useDeleteDesignation();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    minSalary: "",
    maxSalary: "",
    currency: "USD",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organizationId) return;

    try {
      await createDesignation({
        name: formData.name,
        code: formData.code,
        organizationId: user.organizationId,
        minSalary: formData.minSalary
          ? parseFloat(formData.minSalary)
          : undefined,
        maxSalary: formData.maxSalary
          ? parseFloat(formData.maxSalary)
          : undefined,
        currency: formData.currency,
      });
      toast.success("Designation created successfully");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        code: "",
        minSalary: "",
        maxSalary: "",
        currency: "USD",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create designation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this designation?")) return;
    try {
      await deleteDesignation(id);
      toast.success("Designation deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete designation");
    }
  };

  return (
    <PageShell
      title="Designations"
      description="Manage job titles and salary bands across the organization."
      action={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
              Create Designation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Designation</DialogTitle>
                <DialogDescription>
                  Create a job title and assign an optional salary band to it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Job Title (Name)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Senior Backend Engineer"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Job Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="e.g. SBE-3"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t mt-2">
                  <h4 className="text-sm font-medium mb-4 text-gray-700">
                    Salary Band (Optional)
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="minSalary">Min Salary</Label>
                      <Input
                        id="minSalary"
                        type="number"
                        value={formData.minSalary}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minSalary: e.target.value,
                          })
                        }
                        placeholder="60000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxSalary">Max Salary</Label>
                      <Input
                        id="maxSalary"
                        type="number"
                        value={formData.maxSalary}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxSalary: e.target.value,
                          })
                        }
                        placeholder="90000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(val) =>
                          setFormData({ ...formData, currency: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
        <DesignationTable
          designations={designations}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </StaggerItem>
    </PageShell>
  );
}
