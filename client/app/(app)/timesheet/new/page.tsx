"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { TimesheetForm } from "@/components/timesheet/TimesheetForm";
import { TimesheetEntry } from "@/lib/types";
import { useCreateTimesheet } from "@/features/timesheets/queries";
import { useAuth } from "@/hooks/useAuth";

function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export default function NewTimesheetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { mutateAsync: createTimesheet, isPending } = useCreateTimesheet();
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

    try {
      await createTimesheet({
        userId: user.id,
        clockIn: toIsoDateTime(data.date, data.startTime),
        clockOut: toIsoDateTime(data.date, data.endTime),
        totalHours: data.hoursWorked,
        notes: data.notes,
      });
      router.push("/timesheet");
    } catch (err: any) {
      setError(err.message || "Failed to create timesheet entry");
    }
  };

  return (
    <PageShell
      title="Add Timesheet Entry"
      description="Track your daily work hours and notes."
    >
      <TimesheetForm
        onSubmit={handleSubmit}
        isLoading={isPending}
        error={error}
      />
    </PageShell>
  );
}
