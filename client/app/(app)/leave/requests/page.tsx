"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { LeaveTable } from "@/components/leaves/LeaveTable";
import { BackendLeave } from "@/features/leaves/types";
import { useAuth } from "@/hooks/useAuth";
import {
  usePendingLeaves,
  useApproveLeave,
  useRejectLeave,
} from "@/features/leaves/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Download } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { toast } from "@/components/ui/use-toast";
import { reportsApi } from "@/features/reports/api";
import { ConfirmDeleteDialog } from "@/components/shared/dialogs/ConfirmDeleteDialog";

export default function LeaveRequestsPage() {
  const { user } = useAuth();
  
  // The API uses `approverId` in the query to restrict leaves to those needing this user's approval.
  // We can pass user.id if they are a manager. If they are HR/Admin, they might want to see all.
  const { data: leaves = [], isLoading, error } = usePendingLeaves(user?.id);
  
  const { mutateAsync: approveLeave, isPending: isApproving } = useApproveLeave();
  const { mutateAsync: rejectLeave, isPending: isRejecting } = useRejectLeave();

  const [leaveToReject, setLeaveToReject] = useState<BackendLeave | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await reportsApi.exportLeaves();
      sonnerToast.success("Export successful");
    } catch (e: any) {
      sonnerToast.error(e.message || "Failed to export leave requests");
    } finally {
      setIsExporting(false);
    }
  };

  const handleApprove = async (leave: BackendLeave) => {
    try {
      await approveLeave({ id: leave.id });
      toast({
        title: "Leave Approved",
        description: "The leave request has been approved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve leave request.",
        variant: "destructive",
      });
    }
  };

  const handleRejectConfirm = async () => {
    if (!leaveToReject) return;
    try {
      // For simplicity, providing a generic reason. 
      // A more robust implementation would use a form modal to gather the rejection reason.
      await rejectLeave({ id: leaveToReject.id, payload: { reason: "Rejected by manager." } });
      setLeaveToReject(null);
      toast({
        title: "Leave Rejected",
        description: "The leave request has been rejected.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject leave request.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageShell
      title="Leave Approvals"
      description="Review and manage pending leave requests from your team"
      error={error?.message}
      action={
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      }
    >
      <StaggerItem>
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{leaves.length}</p>
              </div>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Requires Your Attention</p>
                <p className="text-2xl font-bold">{leaves.length}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardContent>
          </Card>
        </div>

        <LeaveTable
          leaves={leaves}
          isLoading={isLoading}
          isManagerView={true}
          onApprove={handleApprove}
          onReject={setLeaveToReject}
        />
      </StaggerItem>

      <ConfirmDeleteDialog
        isOpen={!!leaveToReject}
        onClose={() => setLeaveToReject(null)}
        onConfirm={handleRejectConfirm}
        title="Reject Leave Request"
        description="Are you sure you want to reject this leave request? The employee will be notified."
        isLoading={isRejecting}
      />
    </PageShell>
  );
}
