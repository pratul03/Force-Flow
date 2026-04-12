"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <PublicLayout>
      <StaggerContainer>
        {/* Hero Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  About FlowForce
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  We're building the future of HR management, one team at a
                  time.
                </p>
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* Mission Section */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Our Mission
                  </h2>
                  <p className="text-lg text-muted-foreground mb-4">
                    We believe that HR management should be simple, intuitive,
                    and accessible to teams of all sizes. Too many businesses
                    are still using outdated systems that waste time and create
                    frustration.
                  </p>
                  <p className="text-lg text-muted-foreground mb-6">
                    FlowForce was built to change that. We&apos;re committed to
                    providing tools that help HR professionals focus on what
                    matters most: building great teams and supporting employee
                    growth.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <span>Modern, intuitive interface</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <span>Secure data management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <span>24/7 customer support</span>
                    </div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-lg h-96 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">Our Vision</p>
                    <p className="text-sm mt-2">
                      Building the most trusted HR platform
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* Values Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Our Values
                </h2>
                <p className="text-lg text-muted-foreground">
                  These principles guide everything we do
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8">
                  <h3 className="text-xl font-semibold mb-3">Simplicity</h3>
                  <p className="text-muted-foreground">
                    We believe complex problems should have simple solutions.
                    Every feature is designed with user experience in mind.
                  </p>
                </Card>

                <Card className="p-8">
                  <h3 className="text-xl font-semibold mb-3">Trust</h3>
                  <p className="text-muted-foreground">
                    Your data is sacred. We use enterprise-grade security and
                    never compromise on privacy or compliance.
                  </p>
                </Card>

                <Card className="p-8">
                  <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                  <p className="text-muted-foreground">
                    We continuously improve and evolve, staying ahead of
                    industry trends to serve our customers better.
                  </p>
                </Card>
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* Team Section */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Our Team
                </h2>
                <p className="text-lg text-muted-foreground">
                  Experienced leaders passionate about improving HR
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Sarah Chen",
                    role: "CEO & Co-founder",
                    experience: "12+ years in HR tech",
                  },
                  {
                    name: "Michael Rodriguez",
                    role: "CTO & Co-founder",
                    experience: "15+ years in software",
                  },
                  {
                    name: "Emily Watson",
                    role: "Head of Product",
                    experience: "10+ years in product",
                  },
                ].map((member) => (
                  <Card key={member.name} className="p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-linear-to-br from-primary/20 to-primary/10 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {member.name[0]}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm text-primary font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.experience}
                    </p>
                  </Card>
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
                Join our growing community
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the FlowForce difference. Start your free trial
                today.
              </p>
              <Button size="lg" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </PublicLayout>
  );
}
