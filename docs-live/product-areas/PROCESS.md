# Process Overview

**Purpose:** Process product area overview
**Detail Level:** Full reference

---

**How does the session workflow work?** Process defines the session workflow and canonical taxonomy. Git is the event store; documentation artifacts are projections; feature files are the single source of truth. TypeScript source owns pattern identity (ADR-003), while Tier 1 specs are ephemeral planning documents that lose value after completion.

## Key Invariants

- TypeScript source owns pattern identity: `@libar-docs-pattern` in TypeScript defines the pattern. Tier 1 specs are ephemeral working documents
- 7 canonical product-area values: Annotation, Configuration, Generation, Validation, DataAPI, CoreTypes, Process — reader-facing sections, not source modules
- Two distinct status domains: Pattern FSM status (4 values) vs. deliverable status (6 values). Never cross domains

---

## Behavior Specifications

### SessionHandoffs

[View SessionHandoffs source](tests/features/behavior/session-handoffs.feature)

The delivery process supports mid-phase handoffs between sessions and
coordination across multiple developers through structured templates,
checklists, and generated documentation.

**Problem:**

- Context is lost when work pauses mid-phase (LLM sessions have no memory)
- Discoveries made during sessions are not captured for roadmap refinement
- Multiple developers working on same phase can create conflicts
- Resuming work requires re-reading scattered feature files

**Solution:**

- Discovery tags (@libar-process-discovered-\*) capture learnings inline
- SESSION-CONTEXT.md provides complete phase context for LLM planning
- Handoff template standardizes state capture at session boundaries
- Retrospective checklist ensures discoveries flow to findings generator
- PROCESS_SETUP.md documents coordination patterns for parallel work

### SessionFileLifecycle

[View SessionFileLifecycle source](tests/features/behavior/session-file-lifecycle.feature)

Orphaned session files are automatically cleaned up during generation,
maintaining a clean docs-living/sessions/ directory.

**Problem:**

- Session files for completed phases become orphaned and show stale data
- Manual cleanup is error-prone and easily forgotten
- Stale session files mislead LLMs reading docs-living/ for context
- No tracking of which files were cleaned up during generation
- Accumulating orphaned files clutter the sessions directory over time

**Solution:**

- DELETE strategy removes orphaned files during session-context generation
- Only active phase session files are preserved and regenerated
- COMPLETED-MILESTONES.md serves as authoritative history (no session files needed)
- Generator output tracks deleted files for transparency and debugging
- Cleanup is idempotent and handles edge cases (missing dirs, empty state)

---
