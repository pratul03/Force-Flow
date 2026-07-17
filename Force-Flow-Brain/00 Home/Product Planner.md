# Force-Flow Product Planner & Roadmap

*Mapping our development roadmap across our 4-tier strategic pricing model.*

## Overview
This document tracks our progress in transforming Force-Flow into a fully marketable product across 4 distinct pricing tiers. By defining exactly what is required for each tier, we can strategically plan our development cycles.

---

## 🟢 1. Starter Plan (₹18k–30k/year)
*Best for: 5–30 employees | Target: Essential HR Operations*

**Goal:** A clean, functional MVP that completely replaces spreadsheets for small businesses.

### Features Included:
- Employee Directory & Profiles
- Basic Attendance (Clock In/Out, Geo-fence)
- Leave Management & Holiday Calendar
- Department & Designation Management
- Basic Document Storage
- Core Dashboard & Email Notifications

### What We Need to Consider & Build:
- **UI/UX Completion:** Finish the Employee Profile and Dashboard pages.
- **Leave Engine:** We must build the backend accrual engine (cron jobs that add leave days per month) and the UI for requesting/approving leaves.
- **Notification Hookup:** Integrate Nodemailer so alerts actually trigger when leaves are applied or approved.
- **Exporting:** Build a simple CSV/Excel export for basic reports so small companies can run their own payroll offline.

---

## 🔵 2. Professional Plan (₹60k–1.2L/year)
*Best for: 30–200 employees | Target: Automated & Integrated Workflows*

**Goal:** Automate time-consuming HR tasks and connect timesheets directly to payroll generation.

### Features Included:
- Everything in Starter
- Shift Management & Timesheets
- Recruitment (Applicant Tracking)
- Basic Payroll Integration (Payslip Generation)
- Expense Claims
- Advanced Analytics & Audit Logs

### What We Need to Consider & Build:
- **Payroll Logic:** This is complex. We need an engine that takes Attendance + Leaves + Compensation schema to generate accurate Invoices/Payslips.
- **Recruitment Pipeline:** A complete UI for tracking applicants through interview stages and eventually converting them into "Employees".
- **Expense Claims Module:** We currently lack this in our Prisma schema. We need to design the DB schema, API, and UI for employees to upload receipts and managers to approve them.
- **Audit Implementation:** We need to implement a global interceptor to track *who* changed *what* across the app.

---

## 🟣 3. Enterprise Plan (₹2.5L–10L+/year)
*Best for: 200+ employees | Target: Scale, Performance & Customization*

**Goal:** Provide the structure, hierarchy, and customization large organizations need to run complex HR policies.

### Features Included:
- Everything in Professional
- Multi-company / Multi-tenant Architecture
- Organization Hierarchy (Multi-level approvals)
- Performance Reviews & Goals (OKRs)
- Asset Management
- SSO (Google/Microsoft)
- Custom Leave Policies

### What We Need to Consider & Build:
- **Advanced Approvals:** We need a dynamic approval workflow engine (e.g., Leave requests need to go to Manager, then to HR Head).
- **OAuth Integration:** We need to integrate Google and Microsoft SSO into our existing NestJS Auth module.
- **Performance Module:** Build the UI for quarterly/annual review cycles and goal tracking.
- **Asset Management:** Build the UI for tracking laptops, IDs, and assigning them to employees.

---

## ⚪ 4. Custom Plan (Contact Sales)
*Best for: Large Enterprises | Target: Bespoke Integrations & Compliance*

**Goal:** Maximum flexibility. This tier requires us to act almost as an agency, providing custom deployments and integrations.

### Features Included:
- Everything in Enterprise
- Active Directory / LDAP Sync
- ERP / Accounting Integrations (Tally, SAP, QuickBooks)
- AI HR Assistant & Predictive Analytics
- Custom Branding (White Labeling)
- On-Premise Deployment options
- Dedicated Webhooks & Open API Access

### What We Need to Consider & Build:
- **Integration Engine:** We'll need to build generic adapters or rely on middleware tools to sync our data with external ERPs.
- **AI Integration:** Integrating OpenAI or Gemini for predictive analytics (e.g., flight risk) and a chatbot assistant.
- **DevOps Hardening:** We need Helm charts and Docker Compose setups ready for clients who want the software hosted on their own AWS/Azure servers.
- **White Labeling:** Our Next.js app needs to support dynamic themes, colors, and logos based on the requested domain.

---

## 🚀 Decision Point
To get to revenue the fastest, we should secure the **Starter Plan** first. 

*What should our immediate focus be?*
1. **Finish Starter Tier UI** (Employees, Leaves, Dashboard).
2. **Jump to Professional Tier** (Start tackling the complex Payroll engine).
3. **Build Core Infrastructure** (Work on Enterprise-level SSO or Approvals early so we don't have to rewrite things later).
