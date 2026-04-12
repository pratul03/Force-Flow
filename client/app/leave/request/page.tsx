"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { LeaveForm } from "@/components/leave/LeaveForm";
import { LeaveRequest } from "@/lib/types";
import { leaveApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const leaveTypeMap: Record<LeaveRequest["type"], string> = {
  vacation: "EARNED",
  sick: "SICK",
  personal: "CASUAL",
  unpaid: "UNPAID",
};

export default function LeaveRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<LeaveRequest>) => {
    setError(null);

    if (!user?.id) {
      setError("You must be logged in to request leave");
      return;
    }

    if (!data.startDate || !data.endDate || !data.type || !data.reason) {
      setError("Leave type, start date, end date, and reason are required");
      return;
    }

    setIsSubmitting(true);

    const response = await leaveApi.create({
      userId: user.id,
      leaveType: leaveTypeMap[data.type],
      startDate: new Date(`${data.startDate}T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${data.endDate}T00:00:00.000Z`).toISOString(),
      reason: data.reason,
    });

    if (!response.success) {
      setError(response.error || "Failed to submit leave request");
      setIsSubmitting(false);
      return;
    }

    router.push("/leave");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Request Leave</h1>
          <p className="mt-2 text-gray-600">
            Submit a new leave request for approval.
          </p>
        </div>

        <LeaveForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          error={error}
        />
      </div>
    </MainLayout>
  );
}
