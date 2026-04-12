"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsApi } from "@/lib/api";

type Overview = {
  organizations?: number;
  users?: number;
  leaves?: number;
  timelogs?: number;
  wallets?: number;
  queuePending?: number;
  generatedAt?: string;
};

export default function ReportsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      const response = await reportsApi.overview();
      if (!response.success || !response.data) {
        setError(response.error || "Failed to load reports overview");
        return;
      }

      setOverview(response.data as Overview);
    }

    void loadOverview();
  }, []);

  const cards = [
    { label: "Organizations", value: overview?.organizations ?? 0 },
    { label: "Users", value: overview?.users ?? 0 },
    { label: "Leaves", value: overview?.leaves ?? 0 },
    { label: "Timelogs", value: overview?.timelogs ?? 0 },
    { label: "Wallets", value: overview?.wallets ?? 0 },
    { label: "Pending Queue Jobs", value: overview?.queuePending ?? 0 },
  ];

  return (
    <MainLayout>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-2 text-gray-600">
              Organization-wide backend metrics.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader>
                  <CardTitle className="text-base">{card.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </StaggerItem>
      </StaggerContainer>
    </MainLayout>
  );
}
