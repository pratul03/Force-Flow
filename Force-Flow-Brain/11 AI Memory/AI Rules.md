# AI Rules

*Part of the Force-Flow Knowledge Base*

These are strict operational rules that all AI agents must follow when modifying the Force-Flow codebase.

## 🧱 Backend (NestJS & Prisma)
- **Use Service Layer:** Never access Prisma directly from controllers. Always use the service layer.
- **Respect Boundaries:** Follow NestJS module boundaries.
- **DRY Logic:** Never duplicate business logic. Prefer existing services.
- **Reusability:** Always reuse DTOs. Never create duplicate APIs.
- **Validation:** Always validate incoming payloads using `class-validator`.

## 🖥️ Frontend (Next.js & React)
- **Component Size:** Keep React components under 250 lines.
- **State Management:** Use Zustand only for global state. Feature state stays local.
- **Rendering:** Use Server Components where possible.
- **UI Consistency:** Prefer shadcn components for all UI elements.
- **Validation:** Always validate forms/data using Zod.

## 📚 General Workflow
- **Maintain Memory:** Update Obsidian notes whenever the architecture changes to keep this AI Knowledge Base accurate.

---
#force-flow #aimemory #rules
