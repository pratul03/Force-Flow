# Agent Instructions

*Part of the Force-Flow Knowledge Base*

## Autonomous Memory Management Workflow

**CRITICAL RULE:** The AI CLI must automatically update its memory whenever a feature is completed. Do NOT wait for user prompting.

Upon completion of any feature or major task, you MUST automatically execute the following steps in sequence:

1. **Update [[Session Memory]]**: Append a chronological entry documenting the work done, files changed, and reason.
2. **Update [[Feature Progress]]**: Adjust completion percentages, shift items from "Missing" to "Completed", and update future roadmap items.
3. **Update [[Changelog]]**: Log technical milestones and user-facing changes.
4. **Update Architecture**: Modify structural documentation in the `01 Architecture` folder if boundaries, data flow, or tech stack components changed.
5. **Update Module Documentation**: Keep APIs, database models, and dependencies up to date for the modified module in the `04 Modules` folder.
6. **Update [[Repository Summary]]**: Adjust the high-level summary if necessary.

### Execution Constraints
- **Chronological History:** Always append logs (e.g. Session Memory and Changelog). **Never overwrite previous memories.**
- **Maintain Backlinks:** You must aggressively maintain and utilize Obsidian `[[Backlinks]]` to tie related concepts together when modifying files.

---
#force-flow #aimemory #instructions
