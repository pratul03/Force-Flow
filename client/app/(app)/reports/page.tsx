"use client";

import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { useReportsOverview } from "@/features/reports/queries";

export default function ReportsPage() {
  const { data: overview, isLoading, error: queryError } = useReportsOverview();
  const error = queryError ? (queryError as Error).message : null;

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  const cards = [
    { label: "Organizations", value: overview?.organizations ?? 0 },
    { label: "Users", value: overview?.users ?? 0 },
    { label: "Leaves", value: overview?.leaves ?? 0 },
    { label: "Timelogs", value: overview?.timelogs ?? 0 },
    { label: "Wallets", value: overview?.wallets ?? 0 },
    { label: "Pending Queue Jobs", value: overview?.queuePending ?? 0 },
  ];

  return (
    <PageShell
      title="Reports"
      description="Organization-wide backend metrics."
      error={error}
    >
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
    </PageShell>
  );
}
