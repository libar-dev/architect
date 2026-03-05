# Plan: Redesign `session-guides-elimination.feature`

## Context

The current `session-guides-elimination.feature` (Phase 39) proposes to delete
`docs/SESSION-GUIDES.md` and merge its unique Handoff section into CLAUDE.md.
This is the wrong direction for two reasons:

1. **SESSION-GUIDES.md is a public-facing document** deployed to libar.dev. Its
   audience is developers and users visiting the website — not AI sessions. Deleting
   it removes a critical operational guide from the public surface.

2. **CLAUDE.md should be a derived artifact, not the canonical storage.** The USDP
   principle ("docs are projections, code is the event store") means that CLAUDE.md
   session workflow content should be _generated_ from annotated specs — not manually
   maintained, and not the merge target for content from other files.

The real opportunity at Phase 39 is different: **remove the manually-maintained
"Session Workflows" section from CLAUDE.md** by generating it from annotated behavior
specs via the planned `ClaudeModuleGeneration` pattern (Phase 25). SESSION-GUIDES.md
is retained as the authoritative human reference.

---

## What Changes

### 1. Rename + rewrite `session-guides-elimination.feature`

**Rename to:** `session-guides-module-source.feature`
**New pattern name:** `SessionGuidesModuleSource`
**Keep phase:** 39

The spec's purpose flips from "eliminate SESSION-GUIDES.md" to "establish the
session workflow content as an annotated, queryable source that generates compact
\_claude-md modules, removing the manually-maintained CLAUDE.md Session Workflows
section."

### 2. Update `docs-consolidation-strategy.feature`

Two targeted changes to the umbrella spec:

**In the Scope table (Feature description):**

Old:

```
| SESSION-GUIDES.md | 389 | Phase 39: merge Handoff section to CLAUDE.md, delete file |
```

New:

```
| SESSION-GUIDES.md | 389 | Phase 39: retained as public reference; CLAUDE.md session section generated from annotated behavior specs |
```

**In the Deliverables Background table (Phase 39 row):**

Old:

```
| Phase 39 - SESSION-GUIDES.md elimination | pending | docs/SESSION-GUIDES.md, CLAUDE.md | No | n/a |
```

New:

```
| Phase 39 - Session workflow CLAUDE.md module generation | pending | delivery-process/specs/, _claude-md/workflow/ | No | n/a |
```

No other changes needed to the umbrella spec — the Rule "Manual docs retain editorial
and tutorial content" is actually _consistent_ with the new direction (SESSION-GUIDES.md
stays manual). The Rule about "Audience alignment" incorrectly frames SESSION-GUIDES.md
as AI-facing, but fixing that Rule is editorial and can be done while updating the
scope table.

---

## New Spec Design: `SessionGuidesModuleSource`

### Problem Statement

CLAUDE.md contains a large "Session Workflows" section (~220 lines) that is entirely
hand-maintained. It duplicates SESSION-GUIDES.md content and has no annotation link to
any source of truth. When session workflow guidance changes, both files need manual
updates — this is exactly the drift risk USDP is designed to eliminate.

The `_claude-md/workflow/` directory (3 hand-written files: session-workflows.md,
session-details.md, fsm-handoff.md) also have no annotated source — they are opaque
markdown blobs.

### Solution: Three-Layer Architecture

```
Annotated Gherkin specs (single source)
          │
          ├──[existing codec]──→ SESSION-GUIDES.md (public human reference, comprehensive)
          │
          ├──[ClaudeModuleGeneration codec]──→ _claude-md/workflow/ (compact AI modules, generated)
          │
          └──[Process Data API]──→ pnpm process:query -- rules SessionWorkflowInvariants
                                   (queryable, replaces reading the full guide in AI sessions)
```

SESSION-GUIDES.md itself remains the comprehensive operational guide (manual editorial
content with full checklists and examples). What changes is that its _invariants and
structure_ also exist in annotated Gherkin specs, making them machine-readable and
enabling the compact \_claude-md module generation.

### Deliverables

| Deliverable                                                                                                               | Location                                                                  | Tests | Notes                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------- |
| Session workflow behavior spec(s) annotated with `@libar-docs-claude-module` + `@libar-docs-claude-section:workflow` tags | `delivery-process/specs/` or `tests/features/behavior/session-workflows/` | No    | Source for generation; Rule: blocks capture FSM invariants, session contracts, handoff patterns |
| Add `@libar-docs-claude-module` tags to ADR-001, ADR-003, PDR-001 decision specs                                          | `delivery-process/decisions/`                                             | No    | Existing Rule: blocks become queryable module content without new content authoring             |
| Generated `_claude-md/workflow/session-workflows.md` replaces hand-written version                                        | `_claude-md/workflow/`                                                    | No    | Via ClaudeModuleGeneration (depends on Phase 25)                                                |
| Generated `_claude-md/workflow/fsm-handoff.md` replaces hand-written version                                              | `_claude-md/workflow/`                                                    | No    | Via ClaudeModuleGeneration                                                                      |
| CLAUDE.md "Session Workflows" section → modular-claude-md include reference                                               | `CLAUDE.md`                                                               | No    | Remove ~220 manual lines; modular-claude-md framework composes from generated modules           |
| Process Data API demonstration: `rules SessionWorkflowInvariants` returns session constraints                             | `delivery-process/specs/`                                                 | No    | Validates content is queryable from the API, not just in a flat doc                             |
| SESSION-GUIDES.md: no change                                                                                              | `docs/SESSION-GUIDES.md`                                                  | No    | Retained as authoritative public reference                                                      |

### Rules (for the new spec)

**Rule 1: SESSION-GUIDES.md is the authoritative public human reference**

- Invariant: docs/SESSION-GUIDES.md exists and is not deleted, shortened, or made a redirect
- It serves a public audience (developers visiting libar.dev), not AI sessions
- Its comprehensive checklists cannot be expressed purely as Gherkin invariants

**Rule 2: CLAUDE.md session content is derived, not hand-authored**

- Invariant: The "Session Workflows" section in CLAUDE.md has no manually-authored
  content after Phase 39 — it is composed from generated \_claude-md/workflow/ modules
- modular-claude-md framework handles module assembly

**Rule 3: Session workflow invariants exist as annotated Gherkin Rule: blocks**

- Invariant: The three canonical session workflow decision specs (ADR-001, ADR-003,
  PDR-001) each carry `@libar-docs-claude-module` and `@libar-docs-claude-section`
  tags, making their Rule: blocks extractable by ClaudeModuleGeneration
- `pnpm process:query -- rules SessionWorkflowInvariants` returns the invariants
  without reading SESSION-GUIDES.md

**Rule 4: ClaudeModuleGeneration is the generation mechanism**

- Invariant: Phase 39 depends on ClaudeModuleGeneration (Phase 25)
- The `@libar-docs-claude-module` + `@libar-docs-claude-section:workflow` tags on
  spec files trigger the codec to produce `_claude-md/workflow/{module}.md` outputs

### Dependencies

- `DocsConsolidationStrategy` (umbrella, already present)
- `ClaudeModuleGeneration` (Phase 25, roadmap — Phase 39 cannot complete until Phase 25 ships)

This dependency ordering is key: Phase 39 can be _designed and annotated_ before
Phase 25 ships, but the generation deliverables require Phase 25 to be complete.

---

## Process Data API Sources

The process:query API already surfaces session workflow content from existing annotated
specs. Running `pnpm process:query -- rules <PatternName>` on the decision specs returns
their Rule: blocks as structured JSON with invariant, rationale, and verifiedBy fields.
This is the demonstration that the content is already in the annotated source — the
`_claude-md` generation just makes it available in compact form for AI sessions.

Test commands that verify the content pipeline works:

```bash
# Session workflow invariants via API (after annotation)
pnpm process:query -- rules ADR001TaxonomyCanonicalValues   # FSM states, canonical values
pnpm process:query -- rules ADR003SourceFirstPatternArchitecture  # session lifecycle
pnpm process:query -- rules PDR001SessionWorkflowCommands   # command design decisions

# Handoff state for the pattern itself
pnpm process:query -- handoff --pattern SessionGuidesModuleSource
```

---

## Critical Files

| File                                                                                      | Change                                                          |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `delivery-process/specs/session-guides-elimination.feature`                               | **Rewrite** — new pattern name, new deliverables, new Rules     |
| `delivery-process/specs/docs-consolidation-strategy.feature`                              | **Update** — Phase 39 scope table row + deliverable description |
| (existing) `delivery-process/decisions/adr-001-taxonomy-canonical-values.feature`         | Reference only — add `claude-module` tags as deliverable        |
| (existing) `delivery-process/decisions/adr-003-source-first-pattern-architecture.feature` | Reference only — add `claude-module` tags as deliverable        |
| (existing) `delivery-process/decisions/pdr-001-session-workflow-commands.feature`         | Reference only — add `claude-module` tags as deliverable        |

---

## Verification

After writing the new spec:

1. `pnpm process:query -- context SessionGuidesModuleSource --session design` — confirm deliverables are listed correctly
2. `pnpm process:query -- handoff --pattern SessionGuidesModuleSource` — confirm blockers include ClaudeModuleGeneration
3. `pnpm process:query -- dep-tree SessionGuidesModuleSource` — confirm dependency chain is correct
4. Check `docs/INDEX.md` still references SESSION-GUIDES.md (no broken links)
5. Confirm `docs-consolidation-strategy.feature` scope table still renders correctly (Gherkin parse check)
