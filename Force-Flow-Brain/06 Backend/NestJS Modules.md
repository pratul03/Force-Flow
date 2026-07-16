# NestJS Modules

*Part of the Force-Flow Knowledge Base*

## Overview
The backend strictly follows a modular, domain-driven architecture. Each feature is encapsulated within its own module containing its specific controllers, services, and DTOs.

## Scaffolding Status (As of July 2026)
Following a massive architectural scaffolding push, the following modules are fully defined in `server/src/modules/` with Controllers, Services, and DTOs:

### Core & Users
- `AuthModule`
- `UsersModule`
- `OrganizationsModule`
- `LocationsModule`

### Time & Attendance
- `ShiftsModule`
- `TimelogsModule`
- `LeavesModule`

### Finance & Payroll
- `WalletsModule`
- `PayrollModule`
- `QuotationsModule`
- `RazorpayModule`
- `SubscriptionsModule`
- `InvoiceTemplatesModule`

### HR & Operations
- `RecruitmentModule`
- `PerformanceModule`
- `TicketsModule`
- `MailboxModule`
- `ReportsModule`
- `UploadsModule`

### Infrastructure
- `QueueModule` (Handles in-house workers)
- `SchedulerModule` (Handles cron jobs)
- `NotificationsModule`
- `PrismaModule` (Global Database Provider in `server/src/prisma`)

## Dependencies
- Most feature modules rely on the `PrismaModule` and `QueueModule`.

---
#force-flow #backend #nestjs
