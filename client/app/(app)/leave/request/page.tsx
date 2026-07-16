"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { LeaveForm } from "@/components/leave/LeaveForm";
import { LeaveRequest } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useCreateLeave } from "@/features/leaves/queries";
import { LeaveType } from "@/features/leaves/types";

const leaveTypeMap: Record<LeaveRequest["type"], LeaveType> = {
  vacation: "EARNED",
  sick: "SICK",
  personal: "CASUAL",
  unpaid: "UNPAID",
};

export default function LeaveRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { mutateAsync: createLeave, isPending } = useCreateLeave();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<LeaveRequest>) => {
    setError(null);

    if (!user?.id || !user?.organizationId) {
      setError("You must be logged in with an organization to request leave");
      return;
    }

    if (!data.startDate || !data.endDate || !data.type || !data.reason) {
      setError("Leave type, start date, end date, and reason are required");
      return;
    }

    try {
      await createLeave({
        userId: user.id,
        organizationId: user.organizationId,
        leaveType: leaveTypeMap[data.type],
        startDate: new Date(`${data.startDate}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${data.endDate}T00:00:00.000Z`).toISOString(),
        reason: data.reason,
      });

      router.push("/leave");
    } catch (e: any) {
      setError(e.message || "Failed to submit leave request");
    }
  };

  return (
    <PageShell
      title="Request Leave"
      description="Submit a new leave request for approval."
    >
      <LeaveForm
        onSubmit={handleSubmit}
        isLoading={isPending}
        error={error}
      />
    </PageShell>
  );
}
