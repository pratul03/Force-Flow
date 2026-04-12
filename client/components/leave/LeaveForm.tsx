"use client";

import { useState } from "react";
import { LeaveRequest } from "@/lib/types";
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
import { differenceInDays } from "date-fns";
import { AnimatedFormCard } from "@/components/animations/AnimatedFormCard";
import { ButtonLoadingSkeleton } from "@/components/ui/loading-skeletons";

interface LeaveFormProps {
  request?: LeaveRequest;
  onSubmit: (data: Partial<LeaveRequest>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const leaveTypes = ["vacation", "sick", "personal", "unpaid"];

export function LeaveForm({
  request,
  onSubmit,
  isLoading = false,
  error = null,
}: LeaveFormProps) {
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    type: request?.type || "vacation",
    startDate: request?.startDate || new Date().toISOString().split("T")[0],
    endDate: request?.endDate || new Date().toISOString().split("T")[0],
    reason: request?.reason || "",
    status: request?.status || "pending",
  });

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    return Math.ceil(differenceInDays(end, start)) + 1;
  };

  const days = calculateDays();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <AnimatedFormCard>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {request ? "Edit Leave Request" : "Request Leave"}
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
                <Label htmlFor="type">Leave Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Duration summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700">
                Leave Duration:{" "}
                <span className="text-lg font-bold text-blue-600">
                  {days} days
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <textarea
                id="reason"
                placeholder="Provide reason for your leave request..."
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
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
                  <ButtonLoadingSkeleton inverted className="w-30" />
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AnimatedFormCard>
  );
}
