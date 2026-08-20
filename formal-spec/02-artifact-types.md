# 02 — Artifact Types

> **Architect Spec v0.2.0** — The three authored artifact types, their directory conventions, and naming rules.

---

## Overview

The Architect Spec defines three authored artifact types. Each type serves a distinct purpose in the
architecture-connected specification system, has its own structural conventions, and lives
in a designated directory.

| Type                             | Format             | Directory                 | Purpose                                             |
| -------------------------------- | ------------------ | ------------------------- | --------------------------------------------------- |
| **Feature Spec**                 | Gherkin `.feature` | `architect/specs/`        | Behavioral specification with architecture metadata |
| **Architecture Decision Record** | Gherkin `.feature` | `architect/decisions/`    | Formalized architecture decision with rationale     |
| **Design Stub**                  | TypeScript `.ts`   | `architect/stubs/<name>/` | Interface and type definitions as design artifacts  |

All three authored artifact types use the same `@architect-*` tag system (§03) but differ in required tags,
structural sections, and lifecycle behavior.

Release reporting is a **derived view**, not an authored artifact type. When a project needs
release deltas or changelog material, it derives them from git tags and graph state instead of
maintaining `architect/releases/` manifests.

## Canonical Directory Layout

A conforming project MUST organize architect artifacts in the following structure:

```
project-root/
  architect/
    specs/                  # Feature specifications (.feature), grouped by domain
      <group>/              # Domain area, bounded context, or feature family
        <feature>.feature   # Individual feature spec
    decisions/              # Architecture Decision Records (.feature)
    stubs/                  # Design stubs (.ts), one directory per pattern (ephemeral)
      <pattern-name>/       # kebab-case directory matching pattern name
    briefs/                 # Optional: pre-candidate Markdown briefs
    tag-taxonomy.md         # OPTIONAL: project-specific tag taxonomy reference (informative)
  architect.config.ts       # Project configuration (§11)
  tests/
    features/               # Executable specs (.feature + step definitions, permanent)
      <group>/              # Same grouping as architect/specs/
        <feature>.feature
        <feature>.steps.ts
```

### Spec Group Organization

Feature specs are organized into **groups** within `architect/specs/`. Groups can be
organized by phase, bounded context, or feature family — the choice is project-specific:

```
# By delivery phase:                    # By bounded context:
architect/specs/                        architect/specs/
  foundation/                             identity/
    project-connection.feature              user-registration.feature
    mcp-integration.feature                 user-authentication.feature
  core-views/                             billing/
    dashboard.feature                       subscription.feature

# By feature family:
architect/specs/
  architecture-views/
    dashboard.feature
    explorer.feature
  authoring-tools/
    spec-creator.feature
    stub-editor.feature
```

This follows the OpenSpec convention of domain-based folder organization, providing
natural grouping for related specs.

### Ephemeral vs. Permanent Artifacts

A key distinction in the directory layout:

| Location               | Lifecycle                                                                                                                  | Purpose                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `architect/specs/`     | **Ephemeral** — deleted during implementation                                                                              | Candidate, plan, and design specs                                               |
| `architect/stubs/`     | **Promoted** — code/contract stub moves to `src/` during implementation (identity persists, ADR-003); staging copy removed | Design-level interface definitions, embryos of shipped code-originated patterns |
| `architect/decisions/` | **Permanent**                                                                                                              | Architecture decisions (historical record)                                      |
| `tests/features/`      | **Permanent** — created during implementation                                                                              | Executable specs (living tests)                                                 |

During implementation, value transfers from ephemeral artifacts to permanent ones:

- Design-level specs → executable specs (in `tests/features/`)
- Stubs → implementation code (in `src/`)

See §08 (Spec Evolution) for the full lifecycle.

## Type 1: Feature Spec

**File format:** Gherkin `.feature`
**Directory:** `architect/specs/<group>/`
**Naming:** `kebab-case-pattern-name.feature`

Feature specs are the primary artifact type. They describe behavioral requirements,
business rules, and implementation deliverables for a single architectural pattern.

Feature specs exist at three maturity levels (see §08 — Spec Evolution):

- **Candidate** (`@architect-status:candidate`) — idea under refinement, reduced requirements
- **Plan-level** (`@architect-status:roadmap`) — accepted feature with full structure
- **Design-level** (`@architect-status:roadmap`) — implementation-ready detail, creates stubs

Candidate specs evolve to plan-level through an acceptance gate. Plan-level specs evolve
to design-level through enrichment (same file). Design-level specs are **ephemeral** —
they are deleted during implementation, replaced by executable specs in `tests/features/`.

The executable spec is the permanent artifact. The design-level spec is construction scaffolding.

**Required tags (Level 2):**

| Tag                          | Purpose                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `@architect`                 | Gate tag (opt-in)                                                  |
| `@architect-pattern`         | PascalCase pattern name                                            |
| `@architect-status`          | FSM state                                                          |
| `@architect-product-area`    | Product area grouping                                              |
| `@architect-bounded-context` | Architecture grouping                                              |
| `@architect-arch-layer`      | Architecture layer (`domain` \| `application` \| `infrastructure`) |
| `@architect-role`            | Canonical role                                                     |

> _Informative:_ Earlier draft versions of this spec also listed `@architect-phase`,
> `@architect-effort`, `@architect-priority`, and `@architect-release` as required.
> These planning-oriented tags are not part of the v0.2.0 canonical taxonomy. Projects MAY
> add them as custom extensions; the reference implementation does not recognise them.

**Required structural sections:**

- Feature title and description (§05)
- `Background: Deliverables` table (§05)
- At least one `Rule:` block with Invariant/Rationale/Verified by (§05)
- At least one `Scenario:` with acceptance criteria tags (§05)

**Full format specification:** §05 — Feature Spec Format.

## Type 2: Architecture Decision Record (ADR)

**File format:** Gherkin `.feature`
**Directory:** `architect/decisions/`
**Naming:** `adr-NNN-kebab-case-title.feature` (NNN = zero-padded number)

ADRs formalize architecture decisions in Gherkin format, capturing the context, decision,
and consequences alongside machine-extractable rules and acceptance criteria.

Variant: **PDR** (Process Decision Record) uses the same format but the `pdr-` prefix
for process-level rather than architecture-level decisions.

**Required tags (Level 2):**

| Tag                       | Purpose                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@architect`              | Gate tag                                                                                                                                               |
| `@architect-adr`          | ADR number (e.g., `004`)                                                                                                                               |
| `@architect-adr-status`   | Decision status: `proposed`, `accepted`, `deprecated` in live-state bootstrap deployments; append-only deployments may additionally model `superseded` |
| `@architect-adr-category` | Category: `architecture`, `process`, `testing`, `documentation`                                                                                        |
| `@architect-pattern`      | Pattern name (ADR prefix convention: `ADR004PatternName`)                                                                                              |
| `@architect-status`       | FSM state (typically `completed` for accepted ADRs)                                                                                                    |
| `@architect-product-area` | Product area                                                                                                                                           |

**Required structural sections:**

- Feature title: `ADR-NNN - Decision Title`
- Feature description with `**Context:**`, `**Decision:**`, `**Consequences:**`
- `Background: Deliverables` table
- At least one `Rule:` block (prefixed with `Decision:`)

**Full format specification:** §06 — ADR Format.

## Type 3: Design Stub

**File format:** TypeScript `.ts`
**Directory:** `architect/stubs/<kebab-case-pattern-name>/`
**Naming:** Descriptive kebab-case filename within the pattern directory

Design stubs are TypeScript files that define interfaces, types, and API shapes as
**design artifacts** — not compiled or linted code. They live in `architect/stubs/`
(outside the source tree) and represent the contract between specification and implementation.

Stubs are **design-level artifacts** — they are created when a spec is promoted from
plan-level to design-level. They MUST NOT be created for plan-level specs.

**Required tags (Level 2):**

| Tag                     | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `@architect`            | Gate tag (in JSDoc block)                  |
| `@architect-status`     | Always `roadmap` for stubs                 |
| `@architect-pattern`    | PascalCase pattern name                    |
| `@architect-implements` | Which feature spec this stub realizes      |
| `@architect-target`     | Destination file path when moved to `src/` |

**Lifecycle:**

1. Stub created in `architect/stubs/<name>/` during design-level spec work
2. Stub used as reference during implementation
3. Implementation created in `src/` (or equivalent) at `@architect-target`, following the stub's contracts
4. Stub **promoted**, not discarded: its `@architect-pattern` identity (role, decisions, use-cases) travels with the code to `src/` and persists there as a code-originated pattern (ADR-003), its `@architect-status` advancing `roadmap → completed`; only the now-redundant staging copy under `architect/stubs/` is removed once tests pass. (A _step-definition_ stub carries no `@architect-pattern` and is deleted outright — §08.)

**Full format specification:** §07 — Stub Format.

## File Naming Rules

| Artifact Type | File Name Pattern                     | Examples                                                                      |
| ------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| Feature spec  | `kebab-case-name.feature`             | `user-registration.feature`, `mcp-server-integration.feature`                 |
| ADR           | `adr-NNN-kebab-case-title.feature`    | `adr-001-mcp-communication.feature`, `adr-004-lifecycle-architecture.feature` |
| PDR           | `pdr-NNN-kebab-case-title.feature`    | `pdr-001-session-workflow.feature`                                            |
| Design stub   | `kebab-case-name.ts` (in pattern dir) | `architect/stubs/ipc-bridge/architect-bridge.ts`                              |

**Pattern name to file name mapping:**

- Pattern name (`@architect-pattern`): `PascalCase` — e.g., `UserRegistration`
- File name: `kebab-case` — e.g., `user-registration.feature`
- Stub directory: `kebab-case` — e.g., `architect/stubs/user-registration/`

## Artifact Type Selection Guide

| Situation                                           | Artifact Type                                |
| --------------------------------------------------- | -------------------------------------------- |
| Defining a new feature or capability                | Feature Spec                                 |
| Recording an architecture or technology decision    | ADR                                          |
| Recording a process or methodology decision         | PDR                                          |
| Defining interfaces and types before implementation | Design Stub                                  |
| Tracking what shipped between releases              | Git tags + derived release reporting view    |
| Capturing pre-plan intent before writing a spec     | Feature Brief (Markdown, outside spec scope) |
