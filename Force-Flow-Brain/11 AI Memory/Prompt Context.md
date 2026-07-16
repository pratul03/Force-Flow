# Prompt Context

*Part of the Force-Flow Knowledge Base*

**CRITICAL CONTEXT FOR AI AGENTS:** This document defines the primary environment, technology stack, and overriding architectural philosophy for the Force-Flow repository.

## Project Summary
Force-Flow is a production-grade Human Resource Management System (HRMS).

## Tech Stack
- Next.js 16 (App Router)
- NestJS 11
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Tailwind CSS v4

## Architectural Philosophy
- **Feature-First:** The project follows a strict feature-first architecture.
- **Backend Modularity:** The NestJS backend is highly modular.
- **Controller Boundary:** Controllers must contain **NO** business logic.
- **Service Ownership:** Services exclusively own and execute business logic.
- **Database Access:** All database transactions are executed strictly via Prisma.

## Strict Coding Principles
- **Search First:** Always search existing implementations before creating new modules.
- **DRY:** Avoid duplicating utilities.
- **Composition:** Prefer composition over inheritance.
- **Consistency:** Maintain absolute consistency with the current architecture at all times.

---
#force-flow #aimemory #context
