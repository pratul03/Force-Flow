"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Clock,
  FileText,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Lock,
  Bell,
  Users2,
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description:
        "Centralized database for all employee information. Track departments, positions, contact details, and employment history.",
    },
    {
      icon: Clock,
      title: "Timesheet Tracking",
      description:
        "Easy timesheet submission with automatic hour calculation, overtime tracking, and approval workflows.",
    },
    {
      icon: FileText,
      title: "Leave Management",
      description:
        "Streamlined leave request process with approval workflow, balance tracking, and leave policy management.",
    },
    {
      icon: TrendingUp,
      title: "Analytics & Reports",
      description:
        "Comprehensive dashboards and reports to track team performance, attendance, and HR metrics.",
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      description:
        "Enterprise-grade security with data encryption, role-based access control, and compliance certifications.",
    },
    {
      icon: Zap,
      title: "Fast & Reliable",
      description:
        "Lightning-fast performance with 99.9% uptime guarantee, automatic backups, and 24/7 monitoring.",
    },
    {
      icon: BarChart3,
      title: "Advanced Reporting",
      description:
        "Generate custom reports, export data in multiple formats, and schedule automated report delivery.",
    },
    {
      icon: Lock,
      title: "Data Privacy",
      description:
        "Your data is encrypted at rest and in transit. GDPR and SOC 2 compliant infrastructure.",
    },
    {
      icon: Bell,
      title: "Notifications",
      description:
        "Real-time notifications for approvals, rejections, and important HR events via email or in-app.",
    },
    {
      icon: Users2,
      title: "Team Collaboration",
      description:
        "Enable teams to work together efficiently with shared calendars, comments, and activity feeds.",
    },
  ];

  return (
    <PublicLayout>
      <StaggerContainer>
        {/* Hero Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Powerful Features
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your HR operations efficiently and
                securely.
              </p>
            </div>
          </section>
        </StaggerItem>

        {/* Features Grid */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.title} className="p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* Detailed Features Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="space-y-16">
                {/* Feature 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">
                      Comprehensive Employee Database
                    </h2>
                    <p className="text-lg text-muted-foreground mb-4">
                      Store and manage all employee information in one secure
                      location. Track employment history, departments,
                      positions, and more.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>✓ Centralized employee records</li>
                      <li>✓ Department and position tracking</li>
                      <li>✓ Employment history management</li>
                      <li>✓ Custom fields and attributes</li>
                    </ul>
                  </div>
                  <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-lg h-64 flex items-center justify-center">
                    <span className="text-muted-foreground">
                      Employee Database Visual
                    </span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-lg h-64 flex items-center justify-center order-last md:order-first">
                    <span className="text-muted-foreground">
                      Timesheet Tracking Visual
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-4">
                      Easy Timesheet Submission
                    </h2>
                    <p className="text-lg text-muted-foreground mb-4">
                      Simplify the timesheet process with automated calculations
                      and approval workflows.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>✓ Automatic hour calculations</li>
                      <li>✓ Overtime tracking</li>
                      <li>✓ Approval workflows</li>
                      <li>✓ Historical records</li>
                    </ul>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">
                      Leave Management System
                    </h2>
                    <p className="text-lg text-muted-foreground mb-4">
                      Streamline leave requests with automatic balance tracking
                      and policy enforcement.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>✓ Multiple leave types</li>
                      <li>✓ Automatic balance calculation</li>
                      <li>✓ Approval workflows</li>
                      <li>✓ Leave policy templates</li>
                    </ul>
                  </div>
                  <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-lg h-64 flex items-center justify-center">
                    <span className="text-muted-foreground">
                      Leave Management Visual
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* Integration Section */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Integrations & Scalability
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
                Connect FlowForce with your existing tools and systems for
                seamless workflows.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "Google Workspace",
                  "Microsoft 365",
                  "Slack",
                  "Email",
                  "PayPal",
                  "Stripe",
                  "Custom API",
                  "Webhooks",
                ].map((item) => (
                  <div
                    key={item}
                    className="p-4 bg-background rounded-lg border border-border"
                  >
                    <p className="font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* CTA Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Experience all features free
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get full access to all FlowForce features for 14 days. No credit
                card required.
              </p>
              <Button size="lg" asChild>
                <Link href="/register">Start Free Trial</Link>
              </Button>
            </div>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </PublicLayout>
  );
}
