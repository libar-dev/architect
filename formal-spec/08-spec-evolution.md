# 08 — Spec Evolution

> **Architect Spec v0.2.0** — The maturation model for specifications from candidate
> through plan and design to executable tests.

---

## The Core Principle: Design Artifacts Are Ephemeral

Specifications mature through distinct stages. Plan-level specs evolve into design-level
specs (same file, enriched). But when implementation begins, value transfers to **executable
specs** — and the design-level spec is **deleted**, just as stubs are deleted when
implementation code exists.

The executable spec is the permanent artifact. The design-level spec was scaffolding.

```
candidate.feature → plan-level.feature → design-level.feature → (deleted)
                                              ↓                      ↓
                                         stubs/*.ts → (deleted)    implementation
                                                                       ↓
                                                              executable.feature + step-defs
                                                              (permanent living tests)
```

This is the same principle as construction: you don't keep the blueprints taped to the
building. The building (executable spec + code) IS the source of truth.

## Two Lifecycle Tracks

Specs follow two distinct tracks separated by an **acceptance gate**:

### Track 1: Refinement (Pre-Acceptance)

Candidate specs are ideas being explored and refined. They live in the refinement
backlog and are not yet committed to the delivery pipeline.

### Track 2: Delivery (Post-Acceptance)

Accepted specs enter the delivery pipeline: plan → design → implementation → executable.
Each stage has defined quality criteria, artifacts, and transition rules.

```
REFINEMENT TRACK                    DELIVERY TRACK
(inbox / exploration)               (committed pipeline)

  Candidate Spec                    Plan-Level Spec
       │                                 │
       │  refine, explore,               │  evolve in same file
       │  validate scope                 │
       │                                 ▼
       │                            Design-Level Spec
       │ ─── acceptance gate ──→         │
       │                                 │  + stubs created
       │                                 │
       │  reject / defer                 ▼
       ▼                            Implementation
   (archived or                          │  stubs deleted → code exists
    deleted)                             │  design spec deleted → executable spec exists
                                         │
                                         ▼
                                    Executable Spec
                                    (permanent: .feature + step-defs)
```

## Five Maturity Levels

### Level 0: Brief (Optional, Pre-Candidate)

**Format:** Markdown (not Gherkin)
**Location:** `architect/briefs/<pattern-name>.md` (convention, not enforced)
**Purpose:** Capture intent and scope before writing even a candidate spec
**Lifecycle:** Deleted or archived after the candidate spec is created

A brief is a lightweight document that captures WHY a feature might exist. Briefs are
useful for communicating intent to non-technical stakeholders and for early-stage
exploration before committing to Gherkin syntax.

```markdown
# Brief: UserRegistration

## Why

Users need to create accounts. Self-service registration eliminates
manual onboarding and is the entry point for the identity bounded context.

## Scope

In scope: Email/password registration, email verification, duplicate detection
Out of scope: OAuth/social login, password reset (separate features)

## Open Questions

- Should we support social login in v1?
- What is the verification email timeout?
```

Briefs are NOT processed by the extraction pipeline and are NOT part of the pattern graph.

### Idea Tier — Lightweight Pre-Candidate

**Format:** Gherkin `.feature`
**Location:** `architect/specs/ideas/<feature-name>.feature` (folder convention)
**Status:** `@architect-status:candidate`
**Maturity:** `@architect-maturity:idea`
**Purpose:** Capture a feature idea cheaply — ≤30 lines (warn-only soft budget — there is no minimum) — so creating, splitting,
combining, and discarding ideas is as low-friction as writing a brief

The idea tier is **not** a separate maturity level — it is the lightest shape of a
Level 1 Candidate spec, distinguished by the `@architect-maturity:idea` value rather than
a different status. A spec at idea tier already lives in the pattern graph (visible,
queryable) but carries minimum viable structure.

**Discriminator:** Idea-tier specs have `@architect-status:candidate` plus
`@architect-maturity:idea`. The maturity value MAY be auto-defaulted by the toolchain
from `status:candidate` (the reference implementation maps `candidate → idea` via
`DEFAULT_MATURITY_BY_STATUS`), but explicit authoring is preferred for clarity.

**Six-tag minimum:**

| Tag                       | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `@architect`              | Gate (extraction opt-in)                         |
| `@architect-pattern`      | PascalCase pattern name                          |
| `@architect-status`       | `candidate`                                      |
| `@architect-maturity`     | `idea` (explicit, or auto-defaulted from status) |
| `@architect-product-area` | Product area grouping                            |
| `@architect-parent`       | Parent epic — every idea belongs to an epic      |

**Parent carve-out for level variants.** Files carrying `@architect-level:epic` or `@architect-level:slice` MAY omit `@architect-parent` — they are top-of-chain or cross-cutting and have no parent by design. The other five baseline tags remain required.

**Line budget:** ≤30 lines (warn-only soft budget — there is no minimum) of content (excluding blank lines and `#` comments).

**Shape:**

```gherkin
@architect
@architect-pattern:<PatternName>
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:Desktop
@architect-parent:<EpicName>
Feature: <PatternName> - <one-line purpose>

  **User Story:** As a <role>, I want <capability> so that <outcome>.

  Rule: <single business constraint>
    **Invariant:** <what must always be true>

  Rule: <optional second constraint>
    **Invariant:** <what must always be true>
```

**What an idea spec contains:**

- A one-line `Feature:` description
- A `**User Story:**` line in the standard "As a / I want / so that" form
- 1–3 `Rule:` blocks, each with `**Invariant:**` only

**What an idea spec does NOT contain:**

- No `Background:` block (no `Deliverables` table at idea tier)
- No `Scenario:` blocks (rules carry intent; scenarios come with commitment)
- No `**Rationale:**` or `**Verified by:**` on rules (those are candidate/plan tier)
- No narrative description beyond the one-line `Feature:` line

#### Anti-Patterns at Idea Tier

**Do not:**

- Add deliverables — ideas are not committed to files.
- Add planning-metadata tags (`@architect-phase`, `@architect-effort`,
  `@architect-priority`, `@architect-release`, or any custom planning tag a project
  has adopted) — planning metadata implies commitment the idea does not yet have.
  Note: these planning tags are not part of the v0.2.0 canonical taxonomy (§04); they
  exist only as project-specific custom extensions.
- Add ADR references — if an idea requires a decision, note it in the parent epic.
- Write narrative descriptions — one-line `Feature:` only. If you need more than one line, the
  idea is ready for promotion to candidate tier.
- Enumerate scenarios — rules with invariants are sufficient at idea tier.

#### Promotion: Idea → Candidate

Promoting an idea-tier spec to a full Level 1 Candidate spec adds:

- An `**Open Questions:**` block listing unresolved questions
- 1–2 `Scenario:` blocks tagged `@acceptance-criteria @happy-path`
- Bumps `@architect-maturity:idea` → `@architect-maturity:plan` (status stays `candidate`
  until the acceptance gate further promotes to `roadmap`)
- Optionally moves the file from `architect/specs/ideas/` to `architect/specs/candidates/`
  (or keeps it in place — the maturity tag is the source of truth)

The same file evolves; the idea-tier spec is the seed of the candidate. From candidate onward,
the existing acceptance gate (below) governs promotion to plan-level.

### Level 1: Candidate Spec

**Format:** Gherkin `.feature`
**Location:** `architect/specs/<group>/<feature-name>.feature`
**Status:** `@architect-status:candidate`
**Purpose:** Explore and refine a feature idea in structured Gherkin format

Candidate specs are **proposals under refinement**. They use Gherkin syntax so they're
parseable by the toolchain, but they have reduced structural requirements compared to
accepted plan-level specs.

**What makes a candidate different from a plan-level spec:**

| Aspect               | Candidate                                             | Plan-Level (Accepted)                   |
| -------------------- | ----------------------------------------------------- | --------------------------------------- |
| Status               | `candidate`                                           | `roadmap`                               |
| Required tags        | Gate + pattern + status only                          | Full tag set (§03)                      |
| Deliverables table   | OPTIONAL                                              | MUST                                    |
| Rule metadata        | Invariant RECOMMENDED, Rationale/Verified-by OPTIONAL | All three MUST                          |
| Scenario tags        | OPTIONAL                                              | MUST (`@acceptance-criteria` + subtype) |
| Quality review       | Not required                                          | MUST pass quality checklist             |
| In pattern graph     | Yes (visible, queryable)                              | Yes                                     |
| In delivery pipeline | No                                                    | Yes                                     |

**Candidate spec example:**

```gherkin
@architect
@architect-pattern:DarkModeTheme
@architect-status:candidate
@architect-product-area:Desktop
@architect-bounded-context:desktop
Feature: DarkModeTheme - System-aware dark/light theme toggle

  **Idea:** Users expect dark mode in desktop apps. Tailwind CSS 4 supports
  dark: variants natively. System preference detection is standard.

  **Open Questions:**
  - Should we support a third "system" option beyond dark/light?
  - Where does the preference persist? Electron store? localStorage?
  - Should theme affect the Paper wireframe viewer?

  Rule: Theme follows system preference by default

    **Invariant:** The app uses the OS dark/light preference unless overridden.

    Scenario: System preference is respected on first launch
      Given the OS is set to dark mode
      When the app launches for the first time
      Then the app renders in dark mode

    Scenario: User override persists across sessions
      Given the user has set the theme to "light"
      When the app launches
      Then the app renders in light mode regardless of OS preference
```

**Acceptance gate:** A candidate spec is promoted to plan-level when:

1. Open questions are resolved
2. Full tag set is applied (§03, §04)
3. Deliverables table is added with concrete file paths
4. All rules have Invariant + Rationale + Verified by
5. All scenarios have `@acceptance-criteria` + subtype tags
6. Status changes from `candidate` to `roadmap`

**Rejection:** Candidate specs that are rejected are deleted or moved to an archive.
Unlike OpenSpec's archive (which preserves full context), rejected candidates in Architect
have no archival obligation — the version control history preserves them.

### Level 2: Plan-Level Spec (Accepted)

**Format:** Gherkin `.feature`
**Status:** `@architect-status:roadmap`
**Purpose:** Define WHAT and WHY — business value, key rules, acceptance criteria

A plan-level spec is an **accepted feature** committed to the delivery pipeline. It has
passed the acceptance gate and meets all Level 2 conformance requirements (§01).

**Characteristics:**

| Aspect             | Plan-Level                                  |
| ------------------ | ------------------------------------------- |
| Description        | `**Business Value:**` + `**How It Works:**` |
| Rules              | 4-6                                         |
| Scenarios per rule | 2-3                                         |
| Total scenarios    | 9-15                                        |
| Scenario detail    | Intent-focused (WHAT happens)               |
| Input/Output       | Not present                                 |
| Section separators | Typically omitted                           |
| Stubs              | NOT created (stubs are design-level only)   |
| Deliverables       | 5-column table, all `pending`               |
| File length        | 60-150 lines                                |

**What plan-level specs do NOT contain:**

- Implementation details or technical approach
- Input/Output type declarations
- Sequence ordering tags
- Exhaustive edge cases
- Design stubs

### Level 3: Design-Level Spec (Ephemeral)

**Format:** Same `.feature` file, enriched from plan-level
**Status:** `@architect-status:roadmap` (still roadmap until implementation starts)
**Purpose:** Implementation-ready detail — the "construction drawing"

Design-level specs are created by **evolving** the plan-level spec in the same file.
The file grows with additional rules, exhaustive scenarios, Input/Output declarations,
and sequence tags.

**Critical:** Design-level specs are **ephemeral**. They exist to guide implementation
and are **deleted** when the executable spec replaces them. Do not treat design-level
specs as permanent documentation.

**What changes from plan to design (same file):**

| Aspect             | Plan → Design                                         |
| ------------------ | ----------------------------------------------------- |
| Description        | Business Value/How It Works → Problem/Solution        |
| Rules              | 4-6 → 6-9 (new rules for error handling, integration) |
| Scenarios per rule | 2-3 → 3-5 (exhaustive edge cases)                     |
| Total scenarios    | 9-15 → 20-40                                          |
| Scenario detail    | Intent → Behavior (HOW it happens)                    |
| Input/Output       | Added to rules                                        |
| Section separators | Added (`# ===...`)                                    |
| Stubs              | Created in `architect/stubs/`                         |
| Sequence tags      | Added when applicable                                 |
| File length        | 60-150 → 200-600 lines                                |

**Artifacts created alongside the design-level spec:**

- Stubs in `architect/stubs/<pattern-name>/` (interfaces, types, API shapes)
- Optionally: design notes, diagrams, or wireframe references

### Level 4: Executable Spec (Permanent)

**Format:** `.feature` file + step definition files
**Location:** Test directory (e.g., `tests/features/<group>/`)
**Status:** `@architect-status:completed`
**Purpose:** Living tests that verify implementation — the permanent artifact

During implementation, the **test file** that exercises the feature becomes the canonical
home for the pattern. This is a **promotion**, not a creation — the test file already
exists (or is created as part of implementation), and it inherits the canonical pattern
name and essential metadata from the design-level spec.

### The Value Transfer Process

For each design-level spec being retired:

1. **Identify the primary test file** — the `.feature` file in `tests/features/` that
   has the broadest behavioral coverage of the spec's scenarios
2. **Transfer the canonical pattern name** — the primary test file's `@architect-pattern`
   changes to the design spec's canonical name
3. **Transfer surviving tags** — `@architect-uses`, `@architect-product-area`,
   `@architect-bounded-context`, `@architect-arch-layer`, `@architect-role`,
   `@architect-level`, `@architect-parent`, and any `@architect-implements` /
   `@architect-extends` / `@architect-see-also` are copied from the design spec to the
   primary test file
4. **Link siblings** — other test files that implement the same spec get
   `@architect-implements:<CanonicalName>` added (N:1 mapping)
5. **Transfer the Feature description** — if the test file lacks a Problem/Solution
   narrative, prepend the design spec's narrative
6. **Delete the design spec** from `architect/specs/`
7. **Delete the stubs** from `architect/stubs/`

### What Survives the Transfer

| Tag / Element                    | Survives to Executable?                    | Reason                                     |
| -------------------------------- | ------------------------------------------ | ------------------------------------------ |
| `@architect-pattern`             | **Yes** — transferred to primary test file | Pattern identity must persist in the graph |
| `@architect-status`              | **Yes** — becomes `completed`              | Lifecycle tracking                         |
| `@architect-uses`                | **Yes** — transferred                      | Dependency graph integrity                 |
| `@architect-implements`          | **Yes** — transferred                      | Realization edge into executable file      |
| `@architect-product-area`        | **Yes** — if not already present           | Classification                             |
| `@architect-bounded-context`     | **Yes** — if not already present           | Architecture grouping                      |
| `@architect-arch-layer`          | **Yes** — if not already present           | Architecture layer                         |
| `@architect-role`                | **Yes** — if not already present           | Canonical role                             |
| `@architect-level` / `-parent`   | **Yes** — if hierarchy applies             | Hierarchy preservation                     |
| Feature description narrative    | **Yes** — transferred if missing           | Generated docs, context assembly           |
| Rule blocks + scenarios          | **Yes** — already in test file             | The test IS the executable spec            |
| `Background: Deliverables` table | **No** — dropped                           | The implementation IS the deliverable      |
| `**Input:**` / `**Output:**`     | **No** — dropped                           | Now expressed in the implementation code   |

> _Informative:_ Earlier drafts of this table listed `@architect-phase`,
> `@architect-effort`, `@architect-priority`, `@architect-release`,
> `@architect-business-value`, and sequence tags. These are not part of the v0.2.0
> canonical taxonomy and therefore do not appear in either the surviving or dropped
> column above.

### N:1 Pattern Mapping

A single design-level spec may map to multiple test files (e.g., a feature with 8 rules
might have tests split across 4 test files by concern). In this case:

- **One test file becomes the primary** — it gets the canonical `@architect-pattern` name
- **Sibling test files get `@architect-implements`** pointing to the canonical name
- **The primary is chosen** based on broadest behavioral coverage or closest scope match

```gherkin
# Primary test file (inherits canonical name):
@architect
@architect-pattern:ShapeExtraction          # ← was ShapeExtractionTypesTesting
@architect-status:completed
@architect-uses:PatternGraphExtraction

# Sibling test file (links to primary):
@architect
@architect-pattern:ShapeMatcherTesting      # ← keeps its own name
@architect-implements:ShapeExtraction       # ← links to canonical
@architect-status:completed
```

### Process and Editorial Specs

Some specs describe documentation moves, editorial decisions, or process changes with
**no executable behavior** — there is no code to test and no test file to promote. These
specs are **deleted outright** during consolidation. Version control history preserves them.

Examples: documentation restructuring specs, README rationalization specs, module
reorganization specs. These served their purpose during the planning phase and have
no permanent form to transfer to.

### File Locations After Transfer

```
architect/specs/identity/user-registration.feature     ← DELETED
architect/stubs/user-registration/                     ← DELETED
tests/features/identity/user-registration.feature      ← PERMANENT (promoted to canonical)
tests/features/identity/user-registration.steps.ts     ← PERMANENT (step definitions)
src/identity/registration-service.ts                   ← PERMANENT (implementation)
```

**The payoff:** After implementation, the project has:

- **Executable specs** that verify behavior (living documentation that runs as tests)
- **Implementation code** that fulfills the contracts
- **No stale design artifacts** — everything ephemeral is deleted
- **Pattern graph intact** — canonical names now source from test files, not spec files

## Value Transfer Summary

Implementation is a structured transfer of value from ephemeral design artifacts to
permanent production artifacts:

| Ephemeral Artifact        | Permanent Replacement                | Transfer Mechanism                             |
| ------------------------- | ------------------------------------ | ---------------------------------------------- |
| Design-level spec         | Test file promoted to canonical name | Pattern name + phase + deps transferred        |
| Stubs                     | Implementation source code           | Contracts fulfilled, stubs deleted             |
| Deliverables table        | Implementation files at paths        | Table dropped — the files ARE the deliverables |
| Design notes / wireframes | Implementation + executable spec     | Archived or deleted                            |

**No architectural value is lost.** The pattern graph retains the same canonical names,
dependency relationships, and phase assignments — but sourced from executable specs
(permanent) instead of planning specs (ephemeral).

## Lifecycle Diagram

```
                    REFINEMENT                    DELIVERY
                    ──────────                    ────────

                    ┌──────────┐
                    │  Brief   │ (optional, Markdown)
                    │  Level 0 │
                    └────┬─────┘
                         │ write candidate spec
                         ▼
                    ┌──────────┐
                    │Candidate │ (Gherkin, lightweight)
                    │ Level 1  │ @architect-status:candidate
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │                     │
         acceptance              rejection
           gate                    │
              │                    ▼
              │              (deleted or archived)
              ▼
         ┌──────────┐
         │Plan-Level│ (Gherkin, full structure)
         │ Level 2  │ @architect-status:roadmap
         └────┬─────┘
              │ evolve same file
              ▼
         ┌──────────┐
         │ Design   │ (Gherkin, enriched + stubs)
         │ Level 3  │ @architect-status:roadmap
         └────┬─────┘
              │
              │ IMPLEMENTATION
              │ (value transfer)
              │
              ├─── design spec ──→ executable spec ──→ tests/features/
              │    (DELETED)        (.feature + .steps.ts)
              │
              ├─── stubs ──────→ implementation code ──→ src/
              │    (DELETED)     (.ts source files)
              │
              ▼
         ┌──────────┐
         │Executable│ (Gherkin + step definitions)
         │ Level 4  │ @architect-status:completed
         └──────────┘ (PERMANENT — living tests)
```

## Comparison: Plan vs. Design vs. Executable

| Aspect             | Plan (Level 2)                | Design (Level 3)                       | Executable (Level 4)                                              |
| ------------------ | ----------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Location           | `architect/specs/<group>/`    | `architect/specs/<group>/` (same file) | `tests/features/<group>/`                                         |
| Status             | `roadmap`                     | `roadmap`                              | `completed`                                                       |
| Description        | Business Value + How It Works | Problem + Solution                     | Narrative transferred from design                                 |
| Rules              | 4-6                           | 6-9                                    | 6-9 (from design)                                                 |
| Scenarios          | 9-15 (intent)                 | 20-40 (behavior)                       | 20-40 (executable)                                                |
| Deliverables table | 5-column, all `pending`       | 5-column, statuses updated             | **Dropped** (implementation IS the deliverable)                   |
| Input/Output       | —                             | Present                                | **Dropped** (in implementation code)                              |
| Surviving tags     | All present                   | All present                            | Pattern, status, uses, implements, product-area, bounded-context, arch-layer, role, level, parent |
| Stubs              | —                             | Created alongside                      | **Deleted**                                                       |
| Step definitions   | —                             | —                                      | Present                                                           |
| N:1 mapping        | —                             | —                                      | Primary gets canonical name; siblings get `@architect-implements` |
| Permanent?         | Evolves into design           | **Deleted** at implementation          | **Yes**                                                           |

## Folder Organization

Specs are organized into **groups** — domain areas, bounded contexts, or feature families.
This follows the OpenSpec convention of domain-based folder organization:

```
architect/specs/
  foundation/                   # Group: Phase 1 foundation features
    project-connection.feature
    mcp-integration.feature
    ipc-bridge.feature
    app-shell.feature
  core-views/                   # Group: Phase 2 primary views
    architecture-dashboard.feature
    pattern-browser-view.feature
    architecture-explorer.feature
    settings-view.feature
  authoring/                    # Group: Phase 3 authoring tools
    guided-spec-creator.feature
    stub-editor.feature
    deliverable-tracker.feature
  workflow/                     # Group: Phase 4 lifecycle management
    feature-planning-board.feature
    design-review-workspace.feature
    implementation-queue.feature
```

Groups MAY be organized by:

- **Phase** — matching the delivery roadmap phases (as above)
- **Bounded context** — matching architecture domains (`identity/`, `billing/`, `platform/`)
- **Feature family** — related features grouped logically

The grouping choice is project-specific and configured via source globs in
`architect.config.ts` (§11).

## Anti-Patterns

**DO NOT:**

- Keep design-level specs after implementation is complete (they are ephemeral)
- Create stubs for candidate or plan-level specs (stubs are design-level only)
- Skip the candidate stage for speculative features (use it to refine before committing)
- Create executable specs without a preceding design-level spec (except for refactoring)
- Keep both the design-level and executable spec for the same feature

**Exception: Refactoring specs.** Specs that document already-implemented code MAY skip
the candidate and plan stages, going directly to design-level (or even executable) since
the implementation already exists and the spec is capturing existing behavior.
