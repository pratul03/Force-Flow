"use client";

import { useState } from "react";
import { Plus, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { LeaveTable } from "@/components/leaves/LeaveTable";
import { LeaveRequestForm } from "@/components/leaves/LeaveRequestForm";
import { ConfirmDeleteDialog } from "@/components/shared/dialogs/ConfirmDeleteDialog";
import { BackendLeave } from "@/features/leaves/types";
import { useAuth } from "@/hooks/useAuth";
import {
  useLeaves,
  useCreateLeave,
  useCancelLeave,
} from "@/features/leaves/queries";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export default function MyLeavesPage() {
  const { user } = useAuth();
  // Filter for only the logged-in user's leaves
  const { data: leaves = [], isLoading, error } = useLeaves(user ? { userId: user.id } : undefined);
  const { mutateAsync: createLeave, isPending: isCreating } = useCreateLeave();
  const { mutateAsync: cancelLeave, isPending: isCanceling } = useCancelLeave();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState<BackendLeave | null>(null);

  const handleCreateSubmit = async (data: any) => {
    if (!user) return;
    try {
      await createLeave({ ...data, userId: user.id });
      setIsFormOpen(false);
      toast({
        title: "Leave Requested",
        description: "Your leave request has been submitted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request.",
        variant: "destructive",
      });
    }
  };

  const handleCancelConfirm = async () => {
    if (!leaveToCancel) return;
    try {
      await cancelLeave({ id: leaveToCancel.id });
      setLeaveToCancel(null);
      toast({
        title: "Leave Cancelled",
        description: "Your leave request has been cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel leave request.",
        variant: "destructive",
      });
    }
  };

  const totalLeavesThisYear = leaves.filter(
    l => l.status === 'APPROVED' && new Date(l.startDate).getFullYear() === new Date().getFullYear()
  ).reduce((acc, curr) => acc + curr.totalDays, 0);

  const pendingLeavesCount = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <PageShell
      title="My Leaves"
      description="Manage your leave requests and time off"
      error={error?.message}
      action={
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      }
    >
      <StaggerItem>
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{leaves.length}</p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingLeavesCount}</p>
              </div>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Approved Days (This Year)</p>
                <p className="text-2xl font-bold">{totalLeavesThisYear}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardContent>
          </Card>
        </div>

        <LeaveTable
          leaves={leaves}
          isLoading={isLoading}
          onCancel={setLeaveToCancel}
        />
      </StaggerItem>

      <LeaveRequestForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateSubmit}
        isSubmitting={isCreating}
      />

      <ConfirmDeleteDialog
        isOpen={!!leaveToCancel}
        onClose={() => setLeaveToCancel(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Leave Request"
        description="Are you sure you want to cancel this leave request? This action cannot be undone."
        isDeleting={isCanceling}
      />
    </PageShell>
  );
}
