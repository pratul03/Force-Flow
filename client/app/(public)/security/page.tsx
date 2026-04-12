"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SecurityPage() {
  return (
    <PublicLayout>
      <StaggerContainer>
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl md:text-5xl font-bold">
                  Security & Compliance
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Your data security is our top priority. We maintain
                  enterprise-grade security standards and compliance
                  certifications.
                </p>
              </div>

              {/* Security Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {[
                  {
                    title: "Data Encryption",
                    description:
                      "All data is encrypted both in transit (TLS 1.3) and at rest (AES-256). Your sensitive information is always protected.",
                  },
                  {
                    title: "Access Control",
                    description:
                      "Role-based access control (RBAC) ensures employees only access data relevant to their role.",
                  },
                  {
                    title: "Regular Backups",
                    description:
                      "Automated daily backups with multiple geographic redundancy ensure data recovery in any scenario.",
                  },
                  {
                    title: "Network Security",
                    description:
                      "Advanced firewalls, DDoS protection, and intrusion detection systems safeguard our infrastructure.",
                  },
                  {
                    title: "Security Audits",
                    description:
                      "Annual third-party security audits and penetration testing verify our security posture.",
                  },
                  {
                    title: "24/7 Monitoring",
                    description:
                      "Continuous monitoring and logging of all system activities to detect and respond to threats.",
                  },
                ].map((item) => (
                  <Card key={item.title} className="p-8">
                    <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </Card>
                ))}
              </div>

              {/* Compliance Section */}
              <StaggerItem>
                <section className="py-16 md:py-24 bg-muted/30 rounded-lg p-8">
                  <h2 className="text-3xl font-bold mb-12 text-center">
                    Compliance Certifications
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      {
                        cert: "SOC 2 Type II",
                        description:
                          "Compliant with Service Organization Control security standards",
                      },
                      {
                        cert: "GDPR",
                        description:
                          "Fully compliant with General Data Protection Regulation",
                      },
                      {
                        cert: "CCPA",
                        description:
                          "Compliant with California Consumer Privacy Act",
                      },
                      {
                        cert: "ISO 27001",
                        description:
                          "Certified for information security management system",
                      },
                    ].map((item) => (
                      <div key={item.cert} className="flex gap-4">
                        <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold mb-1">{item.cert}</h3>
                          <p className="text-muted-foreground text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </StaggerItem>

              {/* Additional Security Measures */}
              <StaggerItem>
                <section className="py-16 md:py-24">
                  <h2 className="text-3xl font-bold mb-12 text-center">
                    Additional Security Measures
                  </h2>
                  <div className="space-y-6">
                    <Card className="p-8">
                      <h3 className="text-xl font-semibold mb-4">
                        Two-Factor Authentication (2FA)
                      </h3>
                      <p className="text-muted-foreground">
                        Users can enable two-factor authentication for enhanced
                        account security. Supported methods include
                        authenticator apps and SMS.
                      </p>
                    </Card>

                    <Card className="p-8">
                      <h3 className="text-xl font-semibold mb-4">
                        Session Management
                      </h3>
                      <p className="text-muted-foreground">
                        Secure session tokens with automatic expiration prevent
                        unauthorized access. Users can manage active sessions
                        and log out remotely.
                      </p>
                    </Card>

                    <Card className="p-8">
                      <h3 className="text-xl font-semibold mb-4">
                        Password Security
                      </h3>
                      <p className="text-muted-foreground">
                        Passwords are hashed using bcrypt with strong salting.
                        We enforce strong password policies and support password
                        managers.
                      </p>
                    </Card>

                    <Card className="p-8">
                      <h3 className="text-xl font-semibold mb-4">
                        Audit Logging
                      </h3>
                      <p className="text-muted-foreground">
                        All system activities are logged with detailed audit
                        trails. Admins can review action history for compliance
                        and security purposes.
                      </p>
                    </Card>

                    <Card className="p-8">
                      <h3 className="text-xl font-semibold mb-4">
                        Vulnerability Management
                      </h3>
                      <p className="text-muted-foreground">
                        We conduct regular vulnerability assessments and
                        maintain a responsible disclosure program. Security
                        updates are deployed immediately.
                      </p>
                    </Card>

                    <Card className="p-8">
                      <h3 className="text-xl font-semibold mb-4">
                        Employee Training
                      </h3>
                      <p className="text-muted-foreground">
                        Our team receives regular security training and follows
                        secure development practices. We maintain a strong
                        security culture.
                      </p>
                    </Card>
                  </div>
                </section>
              </StaggerItem>

              {/* Contact Security Team */}
              <StaggerItem>
                <section className="py-16 md:py-24 bg-primary text-primary-foreground rounded-lg p-8 text-center">
                  <h2 className="text-3xl font-bold mb-4">
                    Report a Security Issue
                  </h2>
                  <p className="text-lg opacity-90 mb-6">
                    Found a security vulnerability? Please report it responsibly
                    to our security team.
                  </p>
                  <a
                    href="mailto:security@flowforce.com"
                    className="inline-block px-6 py-2 bg-primary-foreground text-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    security@flowforce.com
                  </a>
                </section>
              </StaggerItem>
            </div>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </PublicLayout>
  );
}
