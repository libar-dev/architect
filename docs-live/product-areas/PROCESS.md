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

<details>
<summary>Handoff context generation captures session state (3 scenarios)</summary>

#### Handoff context generation captures session state

**Invariant:** Active phases with handoff context enabled must include session handoff sections with template and checklist links.

**Verified by:**

- SESSION-CONTEXT.md includes handoff section for active phases
- Discovery tags appear in handoff context section
- Paused phase shows status indicator

</details>

<details>
<summary>Handoff templates and checklists contain required sections (2 scenarios)</summary>

#### Handoff templates and checklists contain required sections

**Invariant:** Session handoff template and retrospective checklist must exist and contain all required sections for structured knowledge transfer.

**Verified by:**

- Handoff template exists and contains required sections
- Retrospective checklist exists and contains required sections

</details>

<details>
<summary>PROCESS_SETUP.md documents handoff and coordination protocols (2 scenarios)</summary>

#### PROCESS_SETUP.md documents handoff and coordination protocols

**Invariant:** PROCESS_SETUP.md must document both session handoff protocol and multi-developer coordination patterns.

**Verified by:**

- PROCESS_SETUP.md documents handoff protocol
- PROCESS_SETUP.md documents multi-developer coordination

</details>

<details>
<summary>Edge cases and acceptance criteria ensure robustness (5 scenarios)</summary>

#### Edge cases and acceptance criteria ensure robustness

**Invariant:** Handoff context must degrade gracefully when no discoveries exist and must be disableable. Mid-phase handoffs, multi-developer coordination, and retrospective capture must all preserve context.

**Verified by:**

- Fresh phase shows no previous context message
- Handoff context can be disabled
- Mid-phase handoff preserves context
- Multiple developers can coordinate
- Session retrospective captures learnings

</details>

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
