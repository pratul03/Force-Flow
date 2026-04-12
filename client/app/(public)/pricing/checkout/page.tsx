"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InlineTextLoadingSkeleton,
  PageLoadingSkeleton,
} from "@/components/ui/loading-skeletons";
import { subscriptionsApi } from "@/lib/api";
import { BackendOrganizationSubscription } from "@/lib/types";

type CheckoutState = "loading" | "success" | "error";

export default function PricingCheckoutPage() {
  return (
    <PublicLayout>
      <Suspense fallback={<CheckoutFallback />}>
        <PricingCheckoutContent />
      </Suspense>
    </PublicLayout>
  );
}

function CheckoutFallback() {
  return <PageLoadingSkeleton className="max-w-2xl" />;
}

function PricingCheckoutContent() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken");

  const [state, setState] = useState<CheckoutState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] =
    useState<BackendOrganizationSubscription | null>(null);

  useEffect(() => {
    async function completeSession() {
      if (!sessionToken) {
        setState("error");
        setError("Missing checkout session token.");
        return;
      }

      const response =
        await subscriptionsApi.completeCheckoutSession(sessionToken);
      if (!response.success || !response.data) {
        setState("error");
        setError(response.error || "Unable to complete checkout session.");
        return;
      }

      setSubscription(response.data.subscription);
      setState("success");
    }

    void completeSession();
  }, [sessionToken]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" ? <InlineTextLoadingSkeleton lines={2} /> : null}

          {state === "error" ? (
            <>
              <p className="text-sm text-rose-600">
                {error || "Checkout failed."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/pricing">Back to Pricing</Link>
                </Button>
                <Button asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            </>
          ) : null}

          {state === "success" && subscription ? (
            <>
              <p className="text-sm text-emerald-700">
                Subscription activated successfully.
              </p>
              <div className="rounded-md border border-slate-200 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Plan:</span>{" "}
                  {subscription.plan?.name || subscription.planId}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {subscription.status}
                </p>
                <p>
                  <span className="font-semibold">Renews / ends:</span>{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
