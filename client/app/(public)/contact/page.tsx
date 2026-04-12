"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send to a backend
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <PublicLayout>
      <StaggerContainer>
        {/* Hero Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl md:text-5xl font-bold">Get in Touch</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Have questions? We&apos;d love to hear from you. Send us a
                  message and we&apos;ll respond as soon as possible.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {/* Email */}
                <Card className="p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Email</h3>
                  <p className="text-muted-foreground mb-4">
                    Send us an email and we&apos;ll get back to you within 24
                    hours.
                  </p>
                  <a
                    href="mailto:support@flowforce.com"
                    className="text-primary font-medium hover:underline"
                  >
                    support@flowforce.com
                  </a>
                </Card>

                {/* Phone */}
                <Card className="p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-4">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Phone</h3>
                  <p className="text-muted-foreground mb-4">
                    Call us during business hours for immediate assistance.
                  </p>
                  <a
                    href="tel:+1234567890"
                    className="text-primary font-medium hover:underline"
                  >
                    +1 (234) 567-890
                  </a>
                </Card>

                {/* Address */}
                <Card className="p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-4">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Office</h3>
                  <p className="text-muted-foreground">
                    123 Business Street
                    <br />
                    Tech City, TC 12345
                    <br />
                    United States
                  </p>
                </Card>
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* Contact Form Section */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Send us a message</h2>
                <p className="text-lg text-muted-foreground">
                  Fill out the form below and we&apos;ll get back to you
                  shortly.
                </p>
              </div>

              <Card className="p-8">
                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">
                      Thank you! Your message has been sent successfully.
                      We&apos;ll get back to you soon.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                    >
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-2"
                    >
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium mb-2"
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>
          </section>
        </StaggerItem>

        {/* FAQ Section */}
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
                <p className="text-lg text-muted-foreground">
                  Check out our FAQ section for quick answers
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    q: "What is your response time?",
                    a: "We typically respond to support inquiries within 24 hours on business days.",
                  },
                  {
                    q: "Do you offer phone support?",
                    a: "Yes, phone support is available for Professional and Enterprise plans during business hours.",
                  },
                  {
                    q: "Can I request a demo?",
                    a: "Absolutely! We&apos;d love to show you FlowForce in action. Please contact our sales team.",
                  },
                  {
                    q: "How do I become a partner?",
                    a: "Visit our partners page or contact our partnerships team at partners@flowforce.com",
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
      </StaggerContainer>
    </PublicLayout>
  );
}
