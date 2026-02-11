# Index Reference

**Purpose:** Reference document: Index Reference
**Detail Level:** Full reference

---

## Context - Package needs its own delivery process configuration

The `@libar-dev/delivery-process` package generates documentation for other
    projects but also needs to document its own development. Without a defined
    process, the package's roadmap and releases would be undocumented.

---

## Decision - Dog-food the delivery process for self-documentation

The package uses its own tooling for documentation:

    **Key Commands:**
    - `pnpm docs:all` - Generate all documentation
    - `pnpm validate:all` - Validate patterns, DoD, and anti-patterns
    - `pnpm docs:tag-taxonomy` - Generate TAG_TAXONOMY.md

| Artifact | Location | Generator |
| --- | --- | --- |
| Roadmap specs | `delivery-process/specs/` | roadmap |
| Releases | `delivery-process/releases/` | changelog |
| Decisions | `delivery-process/decisions/` | doc-from-decision |
| Reference docs | convention-tagged decisions | reference codec |
| Generated docs | `docs-generated/` | all |

---

## Decision - Relationship tags in use (libar-generic preset)

The following relationship tags from PatternRelationshipModel are effective in this repo:

    **Currently Used:**

    **Available but not yet used:**

    **Note:** Full relationship taxonomy documented in `delivery-process/specs/pattern-relationship-model.feature`

| Tag | Purpose | Example |
| --- | --- | --- |
| `implements` | Behavior test → Tier 1 spec traceability | `@libar-docs-implements:ProcessGuardLinter` |
| `uses` | Technical dependency (code→code) | `@libar-docs-uses:ConfigLoader,TagRegistry` |
| `used-by` | Reverse dependency annotation | `@libar-docs-used-by:CLI` |
| `executable-specs` | Tier 1 → behavior test location | `@libar-docs-executable-specs:tests/features/validation` |
| `release` | Version association | `@libar-docs-release:v1.0.0` |
| `arch-role` | Component type for architecture diagrams | `@libar-docs-arch-role:infrastructure` |
| `arch-context` | Bounded context grouping | `@libar-docs-arch-context:scanner` |
| `arch-layer` | Layer for layered diagrams | `@libar-docs-arch-layer:application` |

| Tag | Future Use Case |
| --- | --- |
| `extends` | Pattern inheritance (e.g., specialized codecs) |
| `depends-on` | Roadmap sequencing between tier 1 specs |
| `enables` | Inverse of depends-on |
| `roadmap-spec` | Back-link from behavior to tier 1 spec |
| `parent`/`level` | Epic→phase→task breakdown |

---

## Decision - Relationship requirements by workflow

Different workflows require different relationship annotations:

    **Planning Session:** Create roadmap spec with `status:roadmap`, `phase` number. Add `depends-on`
    to declare sequencing constraints. Optional `priority`, `effort`, `quarter` for timeline planning.

    **Design Session:** Source code stubs use `uses` for runtime dependencies. Architecture tags
    (`arch-role`, `arch-context`, `arch-layer`) recommended for files appearing in architecture diagrams.
    Use `extends` for pattern inheritance hierarchies.

    **Implementation Session:** Behavior tests MUST have `@libar-docs-implements:PatternName` linking
    to the tier 1 spec they validate. Source code should have `uses`/`used-by` for dependency graphs.

| Workflow | Required | Recommended | Optional |
| --- | --- | --- | --- |
| **Planning** | `status`, `phase` | `depends-on`, `enables` | `priority`, `effort`, `quarter` |
| **Design** | `status`, `uses` | `arch-*` tags, `extends` | `see-also` |
| **Implementation** | `implements` (behavior tests) | `uses`, `used-by` | `api-ref` |

---

## Decision - Executable specs linkage patterns

Behavior tests in `tests/features/` follow two valid patterns:

    **Linked tests** trace to tier 1 specs for:
    - Completeness tracking (DoD validation)
    - Traceability matrix generation
    - Impact analysis

    **Standalone tests** are appropriate when:
    - Testing pure utility functions (no business logic)
    - Testing infrastructure plumbing
    - POC/exploration tests
    - Tests for code patterns without explicit tier 1 specs

    **Note:** Tests that define their OWN `@libar-docs-pattern` tag ARE tier 1 specs themselves
    and should NOT also have `implements` (they are the specification, not an implementation).

| Pattern | When to Use | Tag Required | Example |
| --- | --- | --- | --- |
| **Linked** | Tests validate a tier 1 spec | `@libar-docs-implements:PatternName` | `fsm-validator.feature` → `PhaseStateMachineValidation` |
| **Standalone** | Utility/infrastructure tests | None | `result-monad.feature`, `string-utils.feature` |

---

## Decision - Architecture tags for diagram generation

Architecture diagram generation uses three tags to create Mermaid component diagrams:

    **When to add arch tags:**
    - Core patterns that should appear in architecture overview
    - Entry points and orchestration components
    - Key infrastructure like scanners, extractors, generators

    **When NOT needed:**
    - Internal utility functions
    - Type definition files
    - Test support code

    **Command:** `pnpm docs:architecture` generates `docs-generated/ARCHITECTURE.md`

| Tag | Purpose | Values | Example |
| --- | --- | --- | --- |
| `arch-role` | Component type | `infrastructure`, `service`, `repository`, `handler` | `@libar-docs-arch-role infrastructure` |
| `arch-context` | Bounded context grouping | Free text | `@libar-docs-arch-context scanner` |
| `arch-layer` | Layer for layered diagrams | `domain`, `application`, `infrastructure` | `@libar-docs-arch-layer application` |

---

## Consequences - Benefits and trade-offs

**Benefits:**
    - (+) Validates the tooling works by using it
    - (+) Provides real-world examples for consumers
    - (+) Keeps package roadmap visible and tracked

    **Trade-offs:**
    - (-) Requires maintaining process discipline for a tooling package
    - (-) Generated docs add to package size

---

## Core Thesis

**Context:** Traditional documentation fails because it exists outside the code.
    Developers update code, forget to update docs, and the gap widens until docs become fiction.

    **Decision:** The USDP (Unified Software Delivery Process) inverts this:

    **Principle:** Git is the event store. Documentation artifacts are projections.
    Annotated code is the single source of truth.

| Traditional Approach | USDP Approach |
| --- | --- |
| Docs are written | Docs are generated |
| Status is tracked manually | Status is FSM-enforced |
| Requirements live in Jira | Requirements are Gherkin scenarios |
| AI agents parse stale Markdown | AI agents query typed APIs |

---

## Why Generated Documentation

**Context:** Generated documentation addresses fundamental problems with manual docs.

    **Manual Documentation Problems:**

    **Generated Documentation Benefits:**

    **Cost-Benefit:**

    **When to Use Generated Docs:**

| Problem | Impact |
| --- | --- |
| Docs exist outside code | Developers forget to update them |
| No validation | Stale docs become fiction |
| Duplicate information | Conflicts between sources |
| Status is opinion | No way to verify claims |
| Tribal knowledge | Information locked in heads |

| Benefit | How Achieved |
| --- | --- |
| Always current | Regenerated from source on every build |
| Single source of truth | Annotations in code ARE the docs |
| Machine-verifiable status | FSM enforces valid transitions |
| Typed queries | ProcessStateAPI provides structured access |
| No drift | Impossible for docs to diverge from code |

| Investment | Return |
| --- | --- |
| Initial annotation setup | Elimination of all manual doc maintenance |
| Learning annotation syntax | Consistent documentation across team |
| Running generators | Always-accurate project state |
| FSM compliance | Prevented scope creep and invalid states |

| Use Generated | Keep Manual |
| --- | --- |
| Pattern registry | Conceptual architecture guides |
| Roadmap status | Marketing materials |
| Business rules | Tutorials for external users |
| API reference | High-level overviews |
| Traceability | Changelog summaries |

---

## Event Sourcing Insight

**Context:** Event sourcing teaches us to derive state, not store it.
    Apply this to documentation.

    **Decision:** Documentation follows the event sourcing pattern:

    When you run generate-docs, you are rebuilding read models from the event stream.
    The source annotations are always authoritative.

| Event Sourcing Concept | Documentation Equivalent |
| --- | --- |
| Events | Git commits (changes to annotated code) |
| Projections | Generated docs (PATTERNS.md, ROADMAP.md) |
| Read Model | ProcessStateAPI (typed queries) |

---

## Dogfooding

**Context:** Every pattern in this package uses its own annotation system.

    **Decision:** Real examples from this codebase:

    **ProcessGuardDecider** (pure validation logic):

    

    **PatternScanner** (file discovery):

    

    Run pnpm docs:patterns and these annotations become a searchable pattern registry
    with dependency graphs.

---

## Four-Stage Workflow

**Context:** The delivery process follows four stages with clear inputs and outputs.

    **Decision:** The four stages are:

| Stage | Input | Output | FSM State |
| --- | --- | --- | --- |
| Ideation | Pattern brief | Roadmap spec (.feature) | roadmap |
| Design | Complex requirement | Decision specs + code stubs | roadmap |
| Planning | Roadmap spec | Implementation plan | roadmap |
| Coding | Implementation plan | Code + tests | roadmap to active to completed |

---

## Skip Conditions

**Invariant:** Stages may only be skipped when conditions below are met.

**Context:** Not all stages are required for every task.

    **Decision:** When to skip stages:

**Rationale:** Prevents accidental omissions while allowing efficiency for simple tasks.

| Skip | When |
| --- | --- |
| Design | Single valid approach, straightforward implementation |
| Planning | Single-session work, clear scope |
| Neither | Multi-session work, architectural decisions |

**Verified by:** @acceptance-criteria Scenario: Reference generates Methodology documentation

---

## Annotation Ownership

**Context:** Feature files and code stubs serve different purposes.
    Split-Ownership Principle: Feature files own _what_ and _when_ (planning).
    Code stubs own _how_ and _with what_ (implementation). Neither duplicates the other.

    **Decision:** Feature files own planning metadata:

    Code stubs own implementation metadata:

| Tag | Purpose |
| --- | --- |
| at-prefix-status | FSM state (roadmap, active, completed, deferred) |
| at-prefix-phase | Milestone sequencing |
| at-prefix-depends-on | Pattern-level roadmap dependencies |
| at-prefix-enables | What this unblocks |
| at-prefix-release | Version targeting |

| Tag | Purpose |
| --- | --- |
| at-prefix-uses | Technical dependencies (what this calls) |
| at-prefix-used-by | Technical consumers (what calls this) |
| at-prefix-usecase | When/how to use |
| Category flags | Domain classification (core, api, infra, etc.) |

---

## Example Annotation Split

**Context:** Demonstrates the split between feature files and code stubs.

    **Decision:** Feature file (specs/my-pattern.feature):

    

    Code stub (src/event-store/durability.ts):

    

    Note: Code stubs must NOT use at-prefix-pattern. The feature file is the canonical pattern definition.

---

## Two-Tier Spec Architecture

**Context:** Specifications are organized in two tiers for different purposes.

    **Decision:** The two tiers are:

    **Traceability:**
    - Roadmap spec: at-prefix-executable-specs:package/tests/features/behavior/feature
    - Package spec: at-prefix-implements:PatternName

    This separation keeps test output clean (no roadmap noise) while maintaining
    bidirectional traceability.

| Tier | Location | Purpose | Executable |
| --- | --- | --- | --- |
| Roadmap | specs/area/ | Planning, deliverables, acceptance criteria | No |
| Package | pkg/tests/features/ | Implementation proof, regression testing | Yes |

---

## Code Stub Levels

**Context:** Code is the source of truth. Feature files reference code, not duplicate it.

    **Decision:** Code stubs come in three levels:

    **Minimal Stub Example:**

| Level | Contains | When |
| --- | --- | --- |
| Minimal | JSDoc annotations only | Quick exploration |
| Interface | Types + stub functions | API contracts |
| Partial | Working code + some stubs | Progressive implementation |

---

## Planning Stubs Architecture

**Context:** Step definitions created during Planning sessions need a separate location
    excluded from test execution.

    **Decision:** Directory structure:

    

    Phase progression:

    This avoids .skip() (forbidden by test safety policy) while preserving planning artifacts.

| Phase | Location | Status |
| --- | --- | --- |
| Planning | planning-stubs/ | throw new Error("Not implemented") |
| Implementation | Move to steps/ | Replace with real logic |
| Completed | steps/ | Fully executable |

---

## Pattern Extraction Workflow

**Context:** Understanding how patterns flow from source to docs.

    **Extraction Pipeline:**

    **What Gets Extracted:**

    **Annotation Syntax:**

    **MasterDataset Structure:**

    The MasterDataset is the central data structure with pre-computed views:
    - byName: O(1) pattern lookup by name
    - byCategory: Patterns grouped by category
    - byStatus: Patterns grouped by FSM status
    - bySource: Patterns grouped by file type (typescript, gherkin)
    - dependencies: Computed dependency graph
    - metrics: Aggregate statistics

| Stage | Input | Output | Module |
| --- | --- | --- | --- |
| 1. Scan | File patterns | File list | src/scanner/ |
| 2. Parse | Files | AST nodes | TypeScript/Gherkin parsers |
| 3. Extract | AST nodes | Pattern objects | src/extractor/ |
| 4. Transform | Patterns | MasterDataset | src/generators/pipeline/ |
| 5. Render | MasterDataset | RenderableDocument | src/renderable/ |
| 6. Output | RenderableDocument | Markdown files | Codec system |

| Source | Extracted Data |
| --- | --- |
| TypeScript JSDoc | Pattern name, status, uses, used-by, category flags |
| Feature file tags | Pattern name, status, phase, depends-on, enables |
| Feature description | Problem/Solution content, tables, lists |
| Rule blocks | Business constraints, invariants, rationale |
| Background tables | Deliverables with status |
| Scenarios | Acceptance criteria, test coverage |

| Annotation Type | TypeScript Syntax | Gherkin Syntax |
| --- | --- | --- |
| Opt-in marker | at-libar-docs (JSDoc) | at-libar-docs (feature tag) |
| Pattern name | at-libar-docs-pattern Name | at-libar-docs-pattern:Name |
| Status | at-libar-docs-status active | at-libar-docs-status:active |
| Dependencies | at-libar-docs-uses A, B | at-libar-docs-depends-on:A |
| Category | at-libar-docs-core | at-libar-docs-core |

---

## Related Documentation - Methodology

**Context:** This methodology document connects to other documentation.

    **Decision:** Related documents:

| Document | Purpose |
| --- | --- |
| README.md | Quick start, FSM diagram, ProcessStateAPI usage |
| PROCESS-GUARD.md | FSM validation rules, protection levels, CLI |
| CONFIGURATION.md | Tag prefixes, presets, customization |
| GHERKIN-PATTERNS.md | Writing effective specs |
| INSTRUCTIONS.md | Complete tag reference |
| ARCHITECTURE-REFERENCE.md | Four-stage pipeline details |

---

## Package Metadata

**Context:** Essential package information for orientation.

| Field | Value |
| --- | --- |
| Package | @libar-dev/delivery-process |
| Version | 0.1.0-pre.0 |
| Purpose | Turn TypeScript annotations and Gherkin specs into living docs, architecture graphs, and AI-queryable delivery state |
| Node.js | >=18.0.0 |
| License | MIT |

---

## Quick Start Paths

**Context:** Common tasks with recommended documentation paths.

| Task | Start Here | Then Read |
| --- | --- | --- |
| Set up pre-commit hooks | PROCESS-GUARD.md | CONFIGURATION.md |
| Add annotations to TypeScript | INSTRUCTIONS.md | GHERKIN-PATTERNS.md |
| Run AI-assisted implementation | SESSION-GUIDES.md | PROCESS-GUARD.md |
| Generate documentation | CONFIGURATION.md | ARCHITECTURE.md |
| Validate before PR | VALIDATION.md | PROCESS-GUARD.md |
| Understand the system | METHODOLOGY.md | ARCHITECTURE.md |

---

## Quick Navigation

**Context:** Direct links to documentation by task.

| If you want to... | Read this |
| --- | --- |
| Get started quickly | README.md |
| Configure presets and tags | CONFIGURATION.md |
| Understand the why | METHODOLOGY.md |
| Learn the architecture | ARCHITECTURE.md |
| Run AI coding sessions | SESSION-GUIDES.md |
| Write Gherkin specs | GHERKIN-PATTERNS.md |
| Enforce delivery process rules | PROCESS-GUARD.md |
| Validate annotation quality | VALIDATION.md |
| Look up tag definitions | INSTRUCTIONS.md |
| Understand the taxonomy | TAXONOMY.md |
| Publish to npm | PUBLISHING.md |

---

## Reading Order for New Users

**Context:** Recommended path for developers new to the package.

| Order | Document | Focus |
| --- | --- | --- |
| 1 | README.md | Installation, quick start, ProcessStateAPI overview |
| 2 | CONFIGURATION.md | Presets, tag prefixes, config files |
| 3 | METHODOLOGY.md | Core thesis, dual-source architecture |

---

## Reading Order for Developers

**Context:** Recommended path for developers implementing features.

| Order | Document | Focus |
| --- | --- | --- |
| 4 | ARCHITECTURE.md | Four-stage pipeline, codecs, MasterDataset |
| 5 | SESSION-GUIDES.md | Planning/Design/Implementation workflows |
| 6 | GHERKIN-PATTERNS.md | Writing effective Gherkin specs |
| 7 | INSTRUCTIONS.md | Complete tag and CLI reference |

---

## Reading Order for Team Leads

**Context:** Recommended path for team leads and CI/CD setup.

| Order | Document | Focus |
| --- | --- | --- |
| 8 | PROCESS-GUARD.md | FSM enforcement, pre-commit hooks |
| 9 | VALIDATION.md | Lint rules, DoD checks, anti-patterns |

---

## Document Contents Summary

**Context:** Quick reference to key sections within each document.

    **README.md Key Sections:**

    **ARCHITECTURE.md Key Sections:**

    **SESSION-GUIDES.md Key Sections:**

    **PROCESS-GUARD.md Key Sections:**

| Section | Lines | Topics |
| --- | --- | --- |
| The Problem / The Solution | 16-33 | Documentation drift, code as source of truth |
| Built for AI-Assisted Dev | 36-57 | ProcessStateAPI typed queries |
| How It Works | 60-111 | Annotation examples, dual-source |
| Quick Start | 114-170 | Install, annotate, generate, lint |
| CLI Commands | 173-183 | Command summary table |
| FSM-Enforced Workflow | 187-217 | State diagram, protection levels |

| Section | Lines | Topics |
| --- | --- | --- |
| Executive Summary | 28-66 | What it does, key principles, overview |
| Four-Stage Pipeline | 140-245 | Scanner, Extractor, Transformer, Codec |
| Unified Transformation | 248-362 | MasterDataset schema, single-pass |
| Codec Architecture | 366-407 | Concepts, block vocabulary, factory |
| Available Codecs | 410-607 | All 16 codecs with options tables |
| Data Flow Diagrams | 823-980 | Pipeline flow, MasterDataset views |

| Section | Lines | Topics |
| --- | --- | --- |
| Session Decision Tree | 7-24 | Which session type to use |
| Planning Session | 27-83 | Create roadmap spec, checklist |
| Design Session | 86-132 | When required, checklist, code stubs |
| Implementation Session | 135-192 | Pre-flight, execution, FSM transitions |
| Handoff Documentation | 277-313 | Template, discovery tags |

| Section | Lines | Topics |
| --- | --- | --- |
| Quick Reference | 9-37 | Protection levels, transitions, escapes |
| Error completed-protection | 40-65 | Fix with unlock reason |
| Error invalid-status-transition | 68-98 | Follow FSM path |
| CLI Usage | 187-235 | Modes, options, exit codes |
| Pre-commit Setup | 238-260 | Husky, package.json scripts |

---

## Dual-Source Architecture

**Context:** TypeScript and Gherkin files have distinct ownership domains.

    **Split Ownership Table:**

**Rationale:** Gherkin owns timeline/planning metadata (when/priority). TypeScript owns runtime metadata (dependencies/categories).

| Source | Owns | Example Tags |
| --- | --- | --- |
| Feature files | Planning: status, phase, quarter, effort | status, phase, depends-on |
| TypeScript | Implementation: uses, used-by, category | uses, used-by, core |

---

## Delivery Workflow FSM

**Context:** Status transitions follow a finite state machine for process integrity.

    **FSM Diagram:**

    

    **Key Transitions:**

| From | To | When |
| --- | --- | --- |
| roadmap | active | Starting implementation work |
| active | completed | All deliverables done |
| active | roadmap | Blocked or regressed |
| deferred | roadmap | Ready to resume |

---

## ProcessStateAPI

**Context:** Typed queries for AI agents and tooling integration.

    **Usage Example:**

    

    **Key Methods:**

| Method | Returns |
| --- | --- |
| getCurrentWork() | Patterns with active status |
| getRoadmapItems() | Patterns with roadmap status |
| isValidTransition(from, to) | Boolean for FSM validation |
| getPattern(id) | Single pattern by ID |
| getPatternsByCategory(cat) | Patterns in a category |

---

## Document Roles

**Context:** Each document serves a specific audience and focus area.

| Document | Audience | Focus |
| --- | --- | --- |
| README.md | Everyone | Quick start, value proposition |
| METHODOLOGY.md | Everyone | Why - core thesis, principles |
| CONFIGURATION.md | Users | Setup - presets, tags, config |
| ARCHITECTURE.md | Developers | How - pipeline, codecs, schemas |
| SESSION-GUIDES.md | AI/Devs | Workflow - day-to-day usage |
| GHERKIN-PATTERNS.md | Writers | Specs - writing effective Gherkin |
| PROCESS-GUARD.md | Team Leads | Governance - enforcement rules |
| VALIDATION.md | CI/CD | Quality - automated checks |
| INSTRUCTIONS.md | Reference | Lookup - tag and CLI reference |
| TAXONOMY.md | Reference | Lookup - tag format definitions |
| PUBLISHING.md | Maintainers | Release - npm publishing |

---
