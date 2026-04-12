"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { TimesheetForm } from "@/components/timesheet/TimesheetForm";
import { TimesheetEntry } from "@/lib/types";
import { timesheetApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export default function NewTimesheetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<TimesheetEntry>) => {
    setError(null);

    if (!user?.id) {
      setError("You must be logged in to add a timesheet entry");
      return;
    }

    if (!data.date || !data.startTime || !data.endTime) {
      setError("Date, start time, and end time are required");
      return;
    }

    setIsSubmitting(true);

    const response = await timesheetApi.create({
      userId: user.id,
      clockIn: toIsoDateTime(data.date, data.startTime),
      clockOut: toIsoDateTime(data.date, data.endTime),
      totalHours: data.hoursWorked,
      overtimeHours: data.overtime,
      notes: data.notes,
      status: "PENDING_APPROVAL",
    });

    if (!response.success) {
      setError(response.error || "Failed to create timesheet entry");
      setIsSubmitting(false);
      return;
    }

    router.push("/timesheet");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Add Timesheet Entry
          </h1>
          <p className="mt-2 text-gray-600">
            Track your daily work hours and notes.
          </p>
        </div>

        <TimesheetForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          error={error}
        />
      </div>
    </MainLayout>
  );
}
