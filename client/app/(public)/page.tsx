"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Users, Clock, FileText, TrendingUp, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <PublicLayout>
      <StaggerContainer>
        {/* Hero Section */}
        <StaggerItem>
          <section className="relative overflow-hidden py-20 md:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-8">
                {/* Announcement Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    ✨ Now integrated with advanced analytics
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
                  Modern HR Management for Growing Teams
                </h1>

                {/* Subheading */}
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                  Streamline employee management, timesheets, and leave requests
                  with FlowForce. Built for teams that value simplicity and
                  efficiency.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" asChild>
                    <Link href="/register">Start Free Trial</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>

                {/* Social Proof */}
                <div className="pt-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Trusted by leading companies
                  </p>
                  <div className="flex justify-center gap-6 flex-wrap">
                    <div className="text-sm font-medium text-muted-foreground">
                      TechCorp
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      StartupXYZ
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Global Inc
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* Features Section */}
        <StaggerItem>
          <section className="py-20 md:py-32 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Everything you need to manage HR
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Powerful features designed to save time and reduce
                  administrative burden
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Employee Management
                  </h3>
                  <p className="text-muted-foreground">
                    Centralized database for all employee information,
                    departments, and roles.
                  </p>
                </Card>

                {/* Feature 2 */}
                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Timesheet Tracking
                  </h3>
                  <p className="text-muted-foreground">
                    Easy timesheet submission with automatic hour calculation
                    and overtime tracking.
                  </p>
                </Card>

                {/* Feature 3 */}
                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Leave Management
                  </h3>
                  <p className="text-muted-foreground">
                    Streamlined leave request process with approval workflow and
                    balance tracking.
                  </p>
                </Card>

                {/* Feature 4 */}
                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Analytics & Reports
                  </h3>
                  <p className="text-muted-foreground">
                    Comprehensive dashboards and reports to track team
                    performance and metrics.
                  </p>
                </Card>

                {/* Feature 5 */}
                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Secure & Compliant
                  </h3>
                  <p className="text-muted-foreground">
                    Enterprise-grade security with data encryption and
                    compliance certifications.
                  </p>
                </Card>

                {/* Feature 6 */}
                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Fast & Reliable
                  </h3>
                  <p className="text-muted-foreground">
                    Lightning-fast performance with 99.9% uptime guarantee and
                    24/7 support.
                  </p>
                </Card>
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* CTA Section */}
        <StaggerItem>
          <section className="py-20 md:py-32 bg-primary text-primary-foreground">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to transform your HR?
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Join hundreds of companies using FlowForce to manage their teams
                efficiently.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Get Started Free</Link>
              </Button>
            </div>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </PublicLayout>
  );
}
