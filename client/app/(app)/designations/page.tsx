"use client";

import { useEffect, useState } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { CURRENCIES } from "@/lib/config/currencies";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useDesignationsStore } from "@/features/designations/store";
import { useDesignations, useCreateDesignation, useDeleteDesignation } from "@/features/designations/queries";
import { toast } from "sonner";

export default function DesignationsPage() {
  const { user } = useAuth();
  
  const { isCreateModalOpen: isDialogOpen, setCreateModalOpen: setIsDialogOpen } = useDesignationsStore();
  
  const { data: designations = [], isLoading } = useDesignations(user?.organizationId);
  const { mutateAsync: createDesignation, isPending: isSaving } = useCreateDesignation();
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
        minSalary: formData.minSalary ? parseFloat(formData.minSalary) : undefined,
        maxSalary: formData.maxSalary ? parseFloat(formData.maxSalary) : undefined,
        currency: formData.currency,
      });
      toast.success("Designation created successfully");
      setIsDialogOpen(false);
      setFormData({ name: "", code: "", minSalary: "", maxSalary: "", currency: "USD" });
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
  }

  // Format currency helper
  const formatCurrency = (amount: number | null | undefined, currency: string) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(amount);
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
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Senior Backend Engineer"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Job Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. SBE-3"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-2 border-t mt-2">
                  <h4 className="text-sm font-medium mb-4 text-gray-700">Salary Band (Optional)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="minSalary">Min Salary</Label>
                      <Input
                        id="minSalary"
                        type="number"
                        value={formData.minSalary}
                        onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                        placeholder="60000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxSalary">Max Salary</Label>
                      <Input
                        id="maxSalary"
                        type="number"
                        value={formData.maxSalary}
                        onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                        placeholder="90000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Currency</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(val) => setFormData({ ...formData, currency: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                      <TableHead>Job Title</TableHead>
                      <TableHead>Salary Band</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                          Loading designations...
                        </TableCell>
                      </TableRow>
                    ) : designations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                          No designations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      designations.map((des) => (
                        <TableRow key={des.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {des.code}
                          </TableCell>
                          <TableCell>{des.name}</TableCell>
                          <TableCell>
                            {des.minSalary || des.maxSalary ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                {formatCurrency(des.minSalary, des.currency || 'USD')} - {formatCurrency(des.maxSalary, des.currency || 'USD')}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-sm">Not specified</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(des.id)}>
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
