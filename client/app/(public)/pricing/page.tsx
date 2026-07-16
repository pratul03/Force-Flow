"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { subscriptionsApi } from "@/features/subscriptions/api";
import { useAuth } from "@/hooks/useAuth";

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, user, isInitialized } = useAuth();
  const [checkoutPlanCode, setCheckoutPlanCode] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const plans = [
    {
      name: "Starter",
      code: "STARTER_MONTHLY",
      price: "$99",
      period: "/month",
      description: "Perfect for small teams",
      features: [
        "Up to 50 employees",
        "Basic employee management",
        "Simple timesheet tracking",
        "Leave request management",
        "Email support",
      ],
      highlighted: false,
      checkoutEnabled: true,
    },
    {
      name: "Professional",
      code: "PROFESSIONAL_MONTHLY",
      price: "$299",
      period: "/month",
      description: "For growing businesses",
      features: [
        "Up to 500 employees",
        "Advanced employee management",
        "Timesheet with approval workflow",
        "Leave management & policies",
        "Analytics & reports",
        "Priority email & chat support",
        "Custom branding",
      ],
      highlighted: true,
      checkoutEnabled: true,
    },
    {
      name: "Enterprise",
      code: "ENTERPRISE_CONTACT",
      price: "Custom",
      period: "pricing",
      description: "For large organizations",
      features: [
        "Unlimited employees",
        "All Professional features",
        "Advanced API access",
        "Custom integrations",
        "Dedicated account manager",
        "24/7 phone support",
        "On-premise deployment option",
      ],
      highlighted: false,
      checkoutEnabled: false,
    },
  ];

  async function startCheckout(planCode: string, checkoutEnabled: boolean) {
    if (!checkoutEnabled) {
      router.push("/contact");
      return;
    }

    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated || !user?.organizationId) {
      router.push(`/register?plan=${encodeURIComponent(planCode)}`);
      return;
    }

    setCheckoutError(null);
    setCheckoutPlanCode(planCode);

    const response = await subscriptionsApi.createCheckoutSession({
      planCode,
      billingProvider: 'RAZORPAY' as any,
    });

    if (!response.success || !response.data) {
      setCheckoutError(response.error || "Failed to start checkout session");
      setCheckoutPlanCode(null);
      return;
    }

    window.location.href = response.data.checkoutUrl;
  }

  return (
    <PublicLayout>
      <StaggerContainer>
        {/* Hero Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the perfect plan for your organization. All plans include
                a 14-day free trial.
              </p>
              {checkoutError && (
                <p className="mt-4 text-sm text-rose-600">{checkoutError}</p>
              )}
            </div>
          </section>
        </StaggerItem>

        {/* Pricing Cards */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={`relative p-8 flex flex-col ${
                      plan.highlighted ? "md:scale-105 border-primary" : ""
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground mb-6">
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">
                        {plan.period}
                      </span>
                    </div>

                    <Button
                      className="mb-8 w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      disabled={checkoutPlanCode === plan.code}
                      onClick={() =>
                        void startCheckout(plan.code, plan.checkoutEnabled)
                      }
                    >
                      {checkoutPlanCode === plan.code
                        ? "Starting checkout..."
                        : plan.checkoutEnabled
                          ? "Start Subscription"
                          : "Contact Sales"}
                    </Button>

                    <ul className="space-y-4 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* FAQ Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>

              <div className="space-y-6">
                {[
                  {
                    q: "Can I switch plans anytime?",
                    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
                  },
                  {
                    q: "What payment methods do you accept?",
                    a: "We accept all major credit cards, bank transfers, and wire transfers for enterprise customers.",
                  },
                  {
                    q: "Is there a setup fee?",
                    a: "No, there are no setup fees. You only pay the monthly subscription cost.",
                  },
                  {
                    q: "What happens after my free trial?",
                    a: "After your 14-day free trial, your account will convert to your chosen plan. You&apos;ll be charged according to the pricing you selected.",
                  },
                  {
                    q: "Do you offer annual billing discounts?",
                    a: "Yes, annual billing customers receive a 20% discount. Contact our sales team for more details.",
                  },
                  {
                    q: "Is there a money-back guarantee?",
                    a: "We offer a 30-day money-back guarantee if you&apos;re not satisfied with our service.",
                  },
                ].map((item, idx) => (
                  <Card key={idx} className="p-6">
                    <h3 className="text-lg font-semibold mb-3">{item.q}</h3>
                    <p className="text-muted-foreground">{item.a}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* CTA Section */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-primary text-primary-foreground">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to get started?
              </h2>
              <p className="text-lg opacity-90">
                Try FlowForce free for 14 days. No credit card required.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Start Free Trial</Link>
              </Button>
            </div>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </PublicLayout>
  );
}
