"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { DynamicViewPage } from "@/components/shared/dialogs/DynamicViewPage";
import { useEmployee, useDeleteEmployee, useUpdateEmployee } from "@/features/employees/queries";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/shared/dialogs/ConfirmDeleteDialog";
import { DynamicModal } from "@/components/shared/dialogs/DynamicModal";
import { EditEmployeeFormWrapper } from "@/components/employees/EditEmployeeFormWrapper";
import { Employee } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, User, Briefcase } from "lucide-react";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { uploadsApi } from "@/features/uploads/api";
import { useQueryClient } from "@tanstack/react-query";
import { employeeKeys } from "@/features/employees/queries";
import { toast } from "@/components/ui/use-toast";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Employee",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

export default function EmployeeDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  
  const { data: employee, isLoading, error } = useEmployee(params?.id as string);
  const { mutateAsync: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();

  const handlePhotoUpload = async (file: File) => {
    if (!employee?.id) return;
    try {
      setIsUploadingPhoto(true);
      const res = await uploadsApi.uploadUserProfilePhotoDirect(employee.id, file);
      if (res.success) {
        toast({ title: "Photo updated successfully" });
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employee.id) });
      } else {
        throw new Error(res.error || "Failed to upload photo");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!employee?.id) return;
    try {
      setIsUploadingPhoto(true);
      const res = await uploadsApi.deleteUserProfilePhoto(employee.id);
      if (res.success) {
        toast({ title: "Photo removed successfully" });
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employee.id) });
      } else {
        throw new Error(res.error || "Failed to remove photo");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!employee) return;
    try {
      await deleteEmployee(employee.id);
      router.push("/employees");
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleUpdateSubmit = async (data: Partial<Employee>) => {
    setFormError(null);
    if (!employee) return;

    try {
      const payload: any = {};
      if (data.name) {
        const { firstName, lastName } = splitName(data.name);
        payload.firstName = firstName;
        payload.lastName = lastName;
      }
      if (data.email) payload.email = data.email;
      if (data.joinDate) payload.joiningDate = new Date(data.joinDate).toISOString();
      if (data.status) payload.status = data.status === "inactive" ? "INACTIVE" : "ACTIVE";
      if (data.department) payload.departmentId = data.department;
      if (data.position) payload.role = data.position;
      
      await updateEmployee({
        id: employee.id,
        payload
      });
      setIsEditModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || "Failed to update employee");
    }
  };

  return (
    <>
      <DynamicViewPage
        title={employee?.name || "Employee"}
        subtitle={employee?.position || "View detailed profile information"}
        backUrl="/employees"
        isLoading={isLoading}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        }
      >
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="job" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Job Details
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* PERSONAL INFO TAB */}
          <TabsContent value="personal" className="space-y-6 mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Profile Photo</h3>
                  <div className="flex justify-center">
                    <div className="w-40">
                      <ImageUpload
                        currentImageUrl={employee?.avatarUrl}
                        onUpload={handlePhotoUpload}
                        onRemove={handlePhotoRemove}
                        isUploading={isUploadingPhoto}
                        shape="circle"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4 text-sm text-gray-700">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{employee?.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{employee?.phone || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4 text-sm text-gray-700">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Identity & Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Employee ID</p>
                      <p className="font-medium text-foreground">{employee?.employeeId || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          employee?.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee?.status || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* JOB DETAILS TAB */}
          <TabsContent value="job" className="space-y-6 mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6 space-y-4 text-sm text-gray-700">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Role Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium text-foreground">{employee?.department || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Position</p>
                      <p className="font-medium text-foreground">{employee?.position || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Join Date</p>
                      <p className="font-medium text-foreground">
                        {employee?.joinDate ? new Date(employee.joinDate).toLocaleDateString() : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4 text-sm text-gray-700 flex flex-col items-center justify-center text-center min-h-[160px]">
                  <Briefcase className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">Reporting structure and manager assignments will appear here.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="mt-0">
            <Card>
              <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
                <div className="bg-primary/5 p-4 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Secure document storage and uploads (ID proofs, contracts) will be enabled in a future update.
                </p>
                <Button variant="outline" disabled>
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DynamicViewPage>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={employee?.name}
        isLoading={isDeleting}
      />

      <DynamicModal
        title="Edit Employee"
        description="Update employee details."
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="lg"
      >
        {employee && (
          <EditEmployeeFormWrapper 
            employeeId={employee.id} 
            onSubmit={handleUpdateSubmit} 
            onCancel={() => setIsEditModalOpen(false)}
            isUpdating={isUpdating} 
            formError={formError} 
          />
        )}
      </DynamicModal>
    </>
  );
}
