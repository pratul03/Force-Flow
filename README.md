# Force-Flow

Force-Flow is a full-stack HR and workforce management platform with a modern web client and a modular backend API.

## Tech Stack

### Frontend (client)

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui + Radix primitives
- Zustand for client state
- Motion for transitions/animations
- React Hook Form + Zod

### Backend (server)

- NestJS 11 + TypeScript
- Prisma ORM + PostgreSQL (`@prisma/adapter-pg`)
- JWT auth
- Swagger/OpenAPI
- Class Validator / Class Transformer
- Multer (uploads), Cloudinary integration
- Razorpay integration
- Puppeteer (document rendering use cases)

## Monorepo Folder Architecture

```text
hmr/
├── client/                          # Next.js app (UI)
│   ├── app/                         # App Router pages
│   │   ├── (public)/                # Public marketing/legal pages
│   │   ├── dashboard/               # Authenticated dashboard
│   │   ├── employees/               # Employee management UI
│   │   ├── leads/                   # Lead management UI
│   │   ├── leave/                   # Leave management UI
│   │   ├── mailbox/                 # Mailbox/inbox UI
│   │   ├── reports/                 # Reporting UI
│   │   ├── settings/                # App/account settings
│   │   ├── tickets/                 # Ticketing/support UI
│   │   └── timesheet/               # Timesheet UI
│   ├── components/                  # Reusable UI and feature components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── layout/
│   │   ├── leave/
│   │   ├── mail/
│   │   ├── timesheet/
│   │   └── ui/                      # shadcn/ui components
│   ├── hooks/                       # Custom React hooks
│   ├── lib/                         # API client, utils, stores, shared types
│   │   └── stores/                  # Zustand stores
│   └── public/                      # Static assets
│
├── server/                          # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma            # DB schema
│   │   ├── migrations/              # Prisma migrations
│   │   └── seed.cjs                 # Demo seed script
│   ├── src/
│   │   ├── common/                  # Shared backend utilities
│   │   ├── health/                  # Health checks
│   │   ├── prisma/                  # Prisma service/module
│   │   ├── swagger/                 # Swagger config
│   │   └── modules/                 # Domain-driven modules
│   │       ├── auth/
│   │       ├── users/
│   │       ├── organizations/
│   │       ├── departments/
│   │       ├── designations/
│   │       ├── locations/
│   │       ├── shifts/
│   │       ├── attendance/
│   │       ├── timelogs/
│   │       ├── leaves/
│   │       ├── tickets/
│   │       ├── leads/
│   │       ├── mailbox/
│   │       ├── reports/
│   │       ├── payroll/
│   │       ├── invoices + templates/
│   │       ├── wallets/ + currency/
│   │       ├── compensation/
│   │       ├── subscriptions/
│   │       ├── notifications/
│   │       ├── queue/ + scheduler/
│   │       ├── uploads/
│   │       ├── audit/
│   │       ├── recruitment/ + performance/
│   │       └── quotations/ + razorpay/
│   └── test/                        # e2e tests
│
├── log/                             # Local logs/artifacts
└── .gitignore
```

## Data Flow

### 1) Authentication Flow

1. User signs in from the Next.js client.
2. Client calls backend auth endpoints.
3. Backend validates credentials and issues JWT.
4. Client stores auth/session state in app store and uses token for API calls.
5. Protected routes/components render only for authenticated users.

### 2) Core CRUD Flow (Employees, Leaves, Timesheets, Tickets, etc.)

1. User action in feature page/form (`client/app/*` + `client/components/*`).
2. API request via client API layer (`client/lib/api.ts`).
3. NestJS controller in matching module receives request.
4. Service applies business rules/validation.
5. Prisma persists/queries PostgreSQL.
6. Response returns to UI, store updates, and the screen re-renders.

### 3) Mailbox Flow

1. Mailbox UI triggers provider connect/sync/send actions.
2. Backend mailbox module handles provider integration and message operations.
3. Messages are normalized and returned to frontend store.
4. UI displays folders, message list, detail pane, and compose/reply actions.

### 4) Background Jobs and Schedulers

1. Jobs are created (notifications, payroll cycles, async work).
2. Queue/scheduler modules pick and process jobs.
3. Results/errors are recorded for retries, audits, and status dashboards.

## Supported Features

- Authentication and protected app routes
- Organization and user management
- Department, designation, and location management
- Shift and attendance workflows
- Timesheet and time log tracking
- Leave request and approval management
- Leads and ticketing modules
- Mailbox integration and message operations
- Payroll, invoice generation, invoice templates
- Wallets, currency handling, compensation workflows
- Recruitment and performance modules
- Reports and analytics endpoints/UI
- Notifications, queue jobs, and schedulers
- File uploads and media integrations
- Subscription and payment integrations (Razorpay)
- Audit-related module support

## Local Development

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL

### Install

```bash
# frontend
cd client
pnpm install

# backend
cd ../server
pnpm install
```

### Run

```bash
# terminal 1 - backend
cd server
pnpm run dev

# terminal 2 - frontend
cd client
pnpm run dev
```

### Database (server)

```bash
cd server
pnpm run prisma:generate
pnpm run prisma:migrate:dev
pnpm run prisma:seed
```

## API and Docs

- Backend uses Swagger/OpenAPI configuration under `server/src/swagger`.
- Start server and open the configured Swagger route for endpoint docs.

## Notes

- Use `.env` files for local credentials/secrets (not committed).
- Root `.gitignore` is configured to exclude build outputs, local logs, env files, and dependency directories.
