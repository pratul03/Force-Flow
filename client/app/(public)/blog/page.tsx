"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "Getting Started with FlowForce: Your First 24 Hours",
      excerpt:
        "Learn how to set up your FlowForce account, add employees, and start managing HR efficiently in just one day.",
      author: "Sarah Chen",
      date: "April 15, 2024",
      category: "Getting Started",
      readTime: "5 min read",
    },
    {
      id: 2,
      title: "Best Practices for Employee Onboarding",
      excerpt:
        "Discover proven strategies for streamlining your employee onboarding process and ensuring new hires feel welcomed.",
      author: "Michael Rodriguez",
      date: "April 10, 2024",
      category: "Best Practices",
      readTime: "8 min read",
    },
    {
      id: 3,
      title: "Timesheet Management: Tips for Better Accuracy",
      excerpt:
        "Implement systems and practices that reduce timesheet errors and improve payroll accuracy across your organization.",
      author: "Emily Watson",
      date: "April 5, 2024",
      category: "Tips & Tricks",
      readTime: "6 min read",
    },
    {
      id: 4,
      title: "Understanding Leave Policies and Compliance",
      excerpt:
        "Navigate the complexities of leave policies, understand legal requirements, and implement compliant policies.",
      author: "Sarah Chen",
      date: "March 28, 2024",
      category: "Compliance",
      readTime: "10 min read",
    },
    {
      id: 5,
      title: "Remote Work: Managing Teams Across Locations",
      excerpt:
        "Learn how to effectively manage remote and hybrid teams using FlowForce tools and best practices.",
      author: "Michael Rodriguez",
      date: "March 20, 2024",
      category: "Remote Work",
      readTime: "7 min read",
    },
    {
      id: 6,
      title: "Data Security: Protecting Employee Information",
      excerpt:
        "Understand the importance of data security in HR and how FlowForce protects sensitive employee data.",
      author: "Emily Watson",
      date: "March 12, 2024",
      category: "Security",
      readTime: "9 min read",
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
                FlowForce Blog
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Tips, guides, and insights to help you manage HR more
                effectively.
              </p>
            </div>
          </section>
        </StaggerItem>

        {/* Blog Grid */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    className="p-6 flex flex-col hover:shadow-lg transition-shadow"
                  >
                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                        {post.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold mb-3 line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-muted-foreground mb-4 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta Information */}
                    <div className="space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{post.date}</span>
                        </div>
                        <span className="text-xs">{post.readTime}</span>
                      </div>
                    </div>

                    {/* Read More Link */}
                    <Link
                      href={`/blog/${post.id}`}
                      className="mt-4 flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </StaggerItem>

        {/* Newsletter Section */}
        <StaggerItem>
          <section className="py-16 md:py-24 bg-primary text-primary-foreground">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">Stay Updated</h2>
              <p className="text-lg opacity-90">
                Subscribe to our newsletter to receive tips and updates about HR
                management.
              </p>

              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-primary-foreground text-primary placeholder:text-primary/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-primary"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-foreground text-primary font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </PublicLayout>
  );
}
