"use client";

import { useState } from "react";
import { TimesheetEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface TimesheetFormProps {
  entry?: TimesheetEntry;
  onSubmit: (data: Partial<TimesheetEntry>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function TimesheetForm({
  entry,
  onSubmit,
  isLoading = false,
  error = null,
}: TimesheetFormProps) {
  const [formData, setFormData] = useState<Partial<TimesheetEntry>>({
    date: entry?.date || new Date().toISOString().split("T")[0],
    startTime: entry?.startTime || "09:00",
    endTime: entry?.endTime || "17:00",
    notes: entry?.notes || "",
    status: entry?.status || "pending",
  });

  const calculateHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;

    const [startHours, startMinutes] = formData.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = formData.endTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    const differenceMinutes = endTotalMinutes - startTotalMinutes;
    return differenceMinutes / 60;
  };

  const hours = calculateHours();
  const overtime = Math.max(0, hours - 8);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursWorked = calculateHours();

    await onSubmit({
      ...formData,
      hoursWorked,
      overtime: Math.max(0, hoursWorked - 8),
    });
  };

  return (
    <AnimatedFormCard>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {entry ? "Edit Timesheet Entry" : "Add Timesheet Entry"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleChange("status", value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary info */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Hours Worked:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {hours.toFixed(2)} hours
                </span>
              </div>
              {overtime > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Overtime:
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    {overtime.toFixed(2)} hours
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Add any notes or comments..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <ButtonLoadingSkeleton inverted className="w-24" />
                ) : (
                  "Save Entry"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AnimatedFormCard>
  );
}
