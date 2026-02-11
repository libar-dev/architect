# Instructions Reference

**Purpose:** Reference document: Instructions Reference
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

## Quick Tag Reference

**Context:** Most commonly used tags for quick lookup.

    **Essential Tags (required for most patterns):**

    **Relationship Tags:**

    **Process Tags:**

| Tag | Format | Purpose | Example Value |
| --- | --- | --- | --- |
| pattern | value | Pattern identifier | MyPattern |
| status | enum | FSM state | roadmap, active, completed |
| phase | number | Roadmap phase | 15 |
| core | flag | Mark as essential | (no value) |

| Tag | Format | Source | Purpose |
| --- | --- | --- | --- |
| uses | csv | TypeScript | Runtime dependencies |
| used-by | csv | TypeScript | Reverse dependencies |
| depends-on | csv | Gherkin | Planning dependencies |
| enables | csv | Either | What this unlocks |

| Tag | Format | Purpose | Example Value |
| --- | --- | --- | --- |
| quarter | value | Timeline | Q1-2026 |
| effort | value | Estimate | 2d, 4h, 1w |
| team | value | Assignment | platform-team |
| priority | enum | Urgency | critical, high, medium, low |

---

## File-Level Opt-In

**Context:** Files must explicitly opt-in to be scanned for annotations.

    **Decision:** Add the opt-in marker as the first annotation in a JSDoc comment.

    **Important:** Only files with the opt-in marker are scanned. Files without
    the marker are ignored by the scanner even if they contain other annotations.

| Preset | Opt-In Marker | Example |
| --- | --- | --- |
| libar-generic | at-libar-docs | JSDoc comment with at-libar-docs |
| generic | at-docs | JSDoc comment with at-docs |
| ddd-es-cqrs | at-libar-docs | JSDoc comment with at-libar-docs |

---

## Category Tags

**Context:** Category tags classify patterns by domain area.

    The full category list (21 categories in ddd-es-cqrs preset) is extracted from
    `src/taxonomy/categories.ts`. Each category has: tag, domain, priority, description.

    **Simple Presets (generic, libar-generic):** Only core, api, infra categories.

    **Usage:** Add category tag as a flag (no value needed).

---

## Metadata Tags

**Context:** Metadata tags are extracted from `src/taxonomy/registry-builder.ts`.
    The `METADATA_TAGS_BY_GROUP` constant organizes all 42 tags into functional groups:
    core, relationship, process, prd, adr, hierarchy, traceability, architecture, extraction.

    Each tag definition includes: tag name, format, purpose, and example.

    **Status Values:** roadmap, active, completed, deferred

---

## Format Types

**Context:** Format types define how tag values are parsed.

| Format | Parsing | Example |
| --- | --- | --- |
| flag | Boolean presence (no value) | at-libar-docs-core |
| value | Simple string | at-libar-docs-pattern MyPattern |
| enum | Constrained to predefined list | at-libar-docs-status completed |
| csv | Comma-separated values | at-libar-docs-uses A, B, C |
| number | Numeric value | at-libar-docs-phase 15 |
| quoted-value | Preserves spaces | at-libar-docs-brief:'Multi word' |

---

## Source Ownership

**Context:** Relationship tags have specific ownership rules.

    Relationship tag definitions are extracted from `src/taxonomy/registry-builder.ts`.
    This table defines WHERE each tag type should be used (architectural guidance):

    TypeScript files own runtime dependencies (`uses`).
    Feature files own planning dependencies (`depends-on`).

| Tag | Correct Location | Wrong Location |
| --- | --- | --- |
| uses | TypeScript | Feature files |
| depends-on | Feature files | TypeScript |

---

## Hierarchy Duration

**Context:** Hierarchy tags organize work into epic, phase, task structure.
    Tag definitions (level, parent) are extracted from `src/taxonomy/registry-builder.ts`.
    This table provides planning guidance for duration estimates:

| Level | Duration | Description |
| --- | --- | --- |
| epic | Multi-quarter | Strategic initiatives |
| phase | 2-5 days | Standard work units |
| task | 1-4 hours | Session-level work |

---

## Two-Tier Spec Architecture

**Context:** Traceability tags link roadmap specs to executable specs (PDR-007).
    Tag definitions (executable-specs, roadmap-spec) are in `src/taxonomy/registry-builder.ts`.
    This table explains the two-tier architecture:

| Tier | Location | Purpose |
| --- | --- | --- |
| Tier 1 | delivery-process/specs/ | Roadmap and planning specifications |
| Tier 2 | package/tests/features/ | Executable test specifications |

---

## CLAUDE.md Generation

**Context:** The package generates CLAUDE.md files for AI assistant context.

    **Output Locations:**

    **Section Routing Tag:** Use `claude-md-section` to route patterns to specific
    _claude-md subdirectories. This organizes AI context by domain.

    **Available Sections:**

| Format | Location | Purpose |
| --- | --- | --- |
| Compact | _claude-md/ subdirectories | Minimal AI context (low token cost) |
| Detailed | docs/ directory | Full human-readable documentation |

| Section Value | Output Directory | Content Type |
| --- | --- | --- |
| index | _claude-md/index/ | Navigation and overview |
| reference | _claude-md/reference/ | Tag and CLI reference |
| validation | _claude-md/validation/ | Validation rules and process guard |
| sessions | _claude-md/sessions/ | Session workflow guides |
| architecture | _claude-md/architecture/ | System architecture |
| methodology | _claude-md/methodology/ | Core principles |
| gherkin | _claude-md/gherkin/ | Gherkin writing patterns |
| config | _claude-md/config/ | Configuration reference |
| taxonomy | _claude-md/taxonomy/ | Tag taxonomy |
| publishing | _claude-md/publishing/ | Publishing guides |

---

## AI Context Optimization

**Context:** Guidelines for writing content that works well in AI assistant context.

    **Compact vs Detailed Format:**

    **Content Optimization Guidelines:**

| Aspect | Compact (AI) | Detailed (Human) |
| --- | --- | --- |
| Token budget | Minimize (cost-sensitive) | No limit |
| Examples | 1-2 essential | Many with variations |
| Tables | Dense, reference-style | Expanded with context |
| Prose | Bullet points preferred | Full sentences OK |
| Code | Minimal snippets | Full implementations |

| Guideline | Rationale |
| --- | --- |
| Use tables for reference data | Scannable, low tokens |
| Prefer bullet lists over paragraphs | AI parses structure well |
| Include concrete examples | Reduces ambiguity |
| State constraints explicitly | AI follows rules better |
| Avoid redundant explanations | Every token costs money |

---

## Gherkin Integration

**Context:** Gherkin feature files serve as both executable specs and documentation source.

    **File-Level Tags (at top of .feature file):**

    **Background Deliverables Table:**

    Use a Background section with a DataTable to define deliverables. The table
    must have columns: Deliverable, Status, Location.

    **Rule Block Structure:**

    **Scenario Tags:**

    **Feature Description Patterns:**

| Tag | Purpose | Example |
| --- | --- | --- |
| at-libar-docs | Opt-in marker | First line in tag block |
| at-libar-docs-pattern:Name | Pattern identifier | at-libar-docs-pattern:ProcessGuardLinter |
| at-libar-docs-status:value | FSM status | at-libar-docs-status:roadmap |
| at-libar-docs-phase:N | Phase number | at-libar-docs-phase:99 |

| Component | Purpose |
| --- | --- |
| Rule: Name | Groups related scenarios |
| Invariant header | States the business rule |
| Rationale header | Explains why the rule exists |
| Verified by header | References scenarios that verify the rule |

| Tag | Purpose |
| --- | --- |
| at-happy-path | Primary success scenario |
| at-edge-case | Boundary conditions |
| at-error-handling | Error recovery |
| at-validation | Input validation |
| at-acceptance-criteria | Required for DoD validation |
| at-integration | Cross-component behavior |

| Structure | Headers | Best For |
| --- | --- | --- |
| Problem/Solution | Problem and Solution | Pain point to fix |
| Value-First | Business Value and How It Works | TDD-style specs |
| Context/Approach | Context and Approach | Technical patterns |

---

## Preset Quick Reference

**Context:** Three presets are available with different tag prefixes and category counts.
    Preset definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Preset Comparison:**

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

| Preset | Tag Prefix | File Opt-In | Categories | Use Case |
| --- | --- | --- | --- | --- |
| libar-generic (default) | libar-docs- | libar-docs | 3 | Simple projects (this package) |
| generic | docs- | docs | 3 | Simple projects with shorter prefix |
| ddd-es-cqrs | libar-docs- | libar-docs | 21 | DDD/Event Sourcing architectures |

---

## Preset Category Behavior

**Context:** Presets define complete category sets that replace base taxonomy.
    Category definitions are extracted from `src/config/presets.ts` via extract-shapes.

    **Design Decision:** Preset categories REPLACE base taxonomy (not merged).
    If you need DDD categories (ddd, event-sourcing, cqrs, saga, projection, decider, etc.),
    use the ddd-es-cqrs preset explicitly.

    **Category Counts by Preset:**

| Preset | Category Count | Example Categories |
| --- | --- | --- |
| libar-generic | 3 | core, api, infra |
| generic | 3 | core, api, infra |
| ddd-es-cqrs | 21 | domain, ddd, bounded-context, event-sourcing, decider, cqrs, saga, projection |

---

## Default Preset Selection

**Context:** All entry points use consistent defaults.
    Default behavior is documented in `createDeliveryProcess` (factory.ts) and `loadConfig` (config-loader.ts).

    **Default Selection by Entry Point:**

**Rationale:** Simple defaults for most users. Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

| Entry Point | Default Preset | Categories | Context |
| --- | --- | --- | --- |
| createDeliveryProcess() | libar-generic | 3 | Programmatic API |
| loadConfig() fallback | libar-generic | 3 | CLI tools (no config file) |
| This package config file | libar-generic | 3 | Standalone package usage |

---

## Libar Generic Preset

**Context:** Default preset with libar-docs- prefix and 3 categories.
    Full definition extracted from `LIBAR_GENERIC_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

    **Example Annotation:**

    

    Note: Tag lines above should each be prefixed with the at-symbol.

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 3 (core, api, infra) |

---

## Generic Preset

**Context:** Same 3 categories as libar-generic but with shorter docs- prefix.
    Full definition extracted from `GENERIC_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

    **Example Annotation:**

    

    Note: Tag lines above should each be prefixed with the at-symbol.

| Property | Value |
| --- | --- |
| Tag Prefix | docs- |
| File Opt-In | docs |
| Categories | 3 (core, api, infra) |

---

## DDD ES CQRS Preset

**Context:** Full taxonomy for domain-driven architectures with 21 categories.
    Full definition extracted from `DDD_ES_CQRS_PRESET` in `src/config/presets.ts`.

    **Preset Properties:**

    **DDD Category List:**

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 21 |

| Category | Domain | Priority | Description |
| --- | --- | --- | --- |
| domain | Domain | 1 | Domain layer patterns |
| ddd | DDD | 2 | Domain-Driven Design core |
| bounded-context | Bounded Context | 3 | Context boundaries |
| event-sourcing | Event Sourcing | 4 | Event sourcing patterns |
| decider | Decider | 5 | Decision functions |
| cqrs | CQRS | 6 | Command/Query separation |
| saga | Saga | 7 | Process orchestration |
| projection | Projection | 8 | Read model projections |
| aggregate | Aggregate | 9 | Aggregate roots |
| entity | Entity | 10 | Domain entities |
| value-object | Value Object | 11 | Immutable values |
| repository | Repository | 12 | Data access |
| factory | Factory | 13 | Object creation |
| service | Service | 14 | Domain services |
| event | Event | 15 | Domain events |
| command | Command | 16 | Command objects |
| query | Query | 17 | Query objects |
| integration | Integration | 18 | External integrations |
| infrastructure | Infrastructure | 19 | Infrastructure layer |
| application | Application | 20 | Application layer |
| presentation | Presentation | 21 | Presentation layer |

---

## Hierarchical Configuration

**Context:** CLI tools discover config files automatically via directory traversal.
    Discovery logic extracted from `findConfigFile` and `loadConfig` in `src/config/config-loader.ts`.

    **Discovery Order:**

    **Monorepo Strategy:**

    CLI tools use the nearest config file to the working directory.

| Step | Location | Action |
| --- | --- | --- |
| 1 | Current directory | Look for delivery-process.config.ts |
| 2 | Parent directories | Walk up to repo root (find .git folder) |
| 3 | Fallback | Use libar-generic preset (3 categories) |

| Location | Config File | Typical Preset | Use Case |
| --- | --- | --- | --- |
| Repo root | delivery-process.config.ts | ddd-es-cqrs | Full DDD taxonomy for platform |
| packages/my-package/ | delivery-process.config.ts | generic | Simpler taxonomy for individual package |
| packages/simple/ | (none) | libar-generic (fallback) | Uses root or default |

---

## Config File Format

**Context:** Config files export a DeliveryProcessInstance.

    **Basic Config File:**

    

    CLI tools use the nearest config file to the working directory.

---

## Custom Configuration

**Context:** Customize tag prefix while keeping preset taxonomy.

    **Custom Configuration Options:**

    **Custom Tag Prefix Example:**

    

    **Custom Categories Example:**

| Option | Type | Description |
| --- | --- | --- |
| preset | string | Base preset to use (libar-generic, generic, ddd-es-cqrs) |
| tagPrefix | string | Custom tag prefix (replaces preset default) |
| fileOptInTag | string | Custom file opt-in marker |
| categories | array | Custom category definitions (replaces preset categories) |

---

## RegexBuilders API

**Context:** DeliveryProcessInstance includes utilities for tag detection.
    API methods extracted from `createRegexBuilders` in `src/config/regex-builders.ts`.

    **RegexBuilders Methods:**

    **Usage Example:**

| Method | Return Type | Description |
| --- | --- | --- |
| hasFileOptIn(content) | boolean | Check if file contains opt-in marker |
| hasDocDirectives(content) | boolean | Check for any documentation directives |
| normalizeTag(tag) | string | Normalize tag for lookup (strip prefix) |
| directivePattern | RegExp | Pattern to match documentation directives |

---

## Programmatic Config Loading

**Context:** Tools that need to load configuration files dynamically.

    **loadConfig Return Value:**

    **Usage Example:**

| Field | Type | Description |
| --- | --- | --- |
| instance | DeliveryProcessInstance | The loaded configuration instance |
| isDefault | boolean | True if no config file was found |
| path | string or undefined | Path to config file (if found) |

---

## Common Configuration Patterns

**Context:** Frequently used configuration patterns.

    **Pattern Selection Guide:**

    **Tag Registry Access:**

| Scenario | Recommended Config | Reason |
| --- | --- | --- |
| Simple library | libar-generic (default) | Minimal categories sufficient |
| DDD microservice | ddd-es-cqrs | Full domain modeling taxonomy |
| Multi-team monorepo | Root: ddd-es-cqrs, packages: vary | Shared taxonomy with package overrides |
| Custom domain vocabulary | Custom categories | Domain-specific terms |
| Shorter annotations | generic preset | Uses docs- prefix vs libar-docs- |

| Access Pattern | Description |
| --- | --- |
| instance.registry.categories | Array of category definitions |
| instance.registry.statusValues | Valid status values (roadmap, active, completed, deferred) |
| instance.registry.metadataTags | Metadata tag definitions |

---

## Related Documentation - Configuration

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| TAXONOMY-REFERENCE.md | Reference | Tag definitions, categories, status values |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

---

## Concept

**Context:** A taxonomy is a classification system for organizing knowledge.

    **Definition:** In delivery-process, the taxonomy defines the vocabulary for
    pattern annotations. It determines what tags exist, their valid values, and
    how they are parsed from source code.

    **Components:**

    **Key Principle:** The taxonomy is NOT a fixed schema. Presets select
    different subsets, and you can define custom categories.

| Component | Purpose | Source File |
| --- | --- | --- |
| Categories | Domain classifications (e.g., core, api, ddd) | categories.ts |
| Status Values | FSM states (roadmap, active, completed, deferred) | status-values.ts |
| Format Types | How tag values are parsed (flag, csv, enum) | format-types.ts |
| Hierarchy Levels | Work item levels (epic, phase, task) | hierarchy-levels.ts |
| Risk Levels | Risk assessment (low, medium, high) | risk-levels.ts |
| Layer Types | Feature layer (timeline, domain, integration) | layer-types.ts |

---

## Complete Category Reference

**Context:** The ddd-es-cqrs preset includes all 21 categories. Simpler
    presets use subsets (core, api, generator for libar-generic).

    **All Categories:**

    **Category Selection Guide:**

    **Usage:** Add category tags to patterns using the tag prefix:

| Tag | Domain | Priority | Description | Aliases |
| --- | --- | --- | --- | --- |
| domain | Strategic DDD | 1 | Bounded contexts, aggregates, strategic design | - |
| ddd | Domain-Driven Design | 2 | DDD tactical patterns | - |
| bounded-context | Bounded Context | 3 | BC contracts and definitions | - |
| event-sourcing | Event Sourcing | 4 | Event store, aggregates, replay | es |
| decider | Decider | 5 | Decider pattern | - |
| fsm | FSM | 5 | Finite state machine patterns | - |
| cqrs | CQRS | 5 | Command/query separation | - |
| projection | Projection | 6 | Read models, checkpoints | - |
| saga | Saga | 7 | Cross-context coordination, process managers | process-manager |
| command | Command | 8 | Command handlers, orchestration | - |
| arch | Architecture | 9 | Architecture patterns, decisions | - |
| infra | Infrastructure | 10 | Infrastructure, composition root | infrastructure |
| validation | Validation | 11 | Input validation, schemas | - |
| testing | Testing | 12 | Test patterns, BDD | - |
| performance | Performance | 13 | Optimization, caching | - |
| security | Security | 14 | Auth, authorization | - |
| core | Core | 15 | Core utilities | - |
| api | API | 16 | Public APIs | - |
| generator | Generator | 17 | Code generators | - |
| middleware | Middleware | 18 | Middleware patterns | - |
| correlation | Correlation | 19 | Correlation tracking | - |

| Project Type | Recommended Preset | Categories Available |
| --- | --- | --- |
| Simple utility packages | libar-generic | core, api, generator |
| DDD/Event Sourcing systems | ddd-es-cqrs | All 21 categories |
| Generic projects | generic | core, api, generator |

---

## Format Types

**Context:** Tags have different value formats that determine parsing.

    **Decision:** Six format types are supported. See `src/taxonomy/format-types.ts`
    for the canonical `FORMAT_TYPES` array with inline documentation.

    **Format Types Reference:**

    **Implementation:** The format type is specified in the tag definition
    within the TagRegistry. The extractor uses the format to parse values.

| Format | Example Tag | Example Value | Parsing Behavior |
| --- | --- | --- | --- |
| flag | @libar-docs-core | (none) | Boolean presence, no value needed |
| value | @libar-docs-pattern | MyPattern | Simple string value |
| enum | @libar-docs-status | completed | Constrained to predefined list |
| csv | @libar-docs-uses | A, B, C | Comma-separated values |
| number | @libar-docs-phase | 15 | Numeric value |
| quoted-value | @libar-docs-brief | 'Multi-word-text' | Preserves quoted values (use hyphens in .feature tags) |

---

## Status Values

**Context:** Status values control the FSM workflow for pattern lifecycle.

    **Decision:** Four canonical status values are defined (per PDR-005).
    See `src/taxonomy/status-values.ts` for the `PROCESS_STATUS_VALUES` array
    with inline documentation on FSM transitions and protection levels.

    **Status Values Reference:**

    **Valid FSM Transitions:**

    **FSM Diagram:**

| Status | Protection Level | Description | Editable |
| --- | --- | --- | --- |
| roadmap | None | Planned work, not yet started | Full editing |
| active | Scope-locked | Work in progress | Edit existing only |
| completed | Hard-locked | Work finished | Requires unlock tag |
| deferred | None | On hold, may resume later | Full editing |

| From | To | Trigger |
| --- | --- | --- |
| roadmap | active | Start work |
| roadmap | deferred | Postpone before start |
| active | completed | Finish work |
| active | roadmap | Regress (blocked) |
| deferred | roadmap | Resume planning |

---

## Normalized Status

**Context:** Display requires mapping 4 FSM states to 3 presentation buckets.

    **Decision:** Raw status values normalize to display status.
    See `src/taxonomy/normalized-status.ts` for the `STATUS_NORMALIZATION_MAP`
    and `normalizeStatus()` function with complete mapping logic.

**Rationale:** This separation follows DDD principles - the domain model (raw FSM states) is distinct from the view model (normalized display).

---

## Presets

**Context:** Different projects need different taxonomy subsets.

    **Decision:** Three presets are available:

    **Behavior:** The preset determines which categories are available.
    All presets share the same status values and format types.

| Preset | Categories | Tag Prefix | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | 3 | @libar-docs- | Simple projects (this package) |
| ddd-es-cqrs | 21 | @libar-docs- | DDD/Event Sourcing architectures |
| generic | 3 | @docs- | Simple projects with @docs- prefix |

---

## Hierarchy Levels

**Context:** Work items need hierarchical breakdown for planning.

    **Decision:** Three hierarchy levels are defined (epic, phase, task).
    See `src/taxonomy/hierarchy-levels.ts` for the `HIERARCHY_LEVELS` array
    with JSDoc documentation on duration guidelines and usage.

    **Usage:** The level tag organizes work for roadmap generation.
    Phases can have a parent epic; tasks can have a parent phase.

---

## Architecture

**Context:** The taxonomy module structure supports the type-safe annotation system.

    **File Structure:**

    

    **TagRegistry:** The buildRegistry() function creates a TagRegistry
    containing all taxonomy definitions. It is THE single source of truth.

    **Usage Example:**

---

## Tag Generation

**Context:** Developers need a reference of all available tags.

    **Decision:** The generate-tag-taxonomy CLI creates a markdown reference:

    

    **Output:** A markdown file documenting all tags with their formats,
    valid values, and examples - generated from the TagRegistry.

---

## Related Documentation - Taxonomy

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| CONFIGURATION-REFERENCE.md | Reference | Preset configuration and factory API |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

---

## Quick Tag Reference

**Context:** Most commonly used tags for quick lookup.

    **Essential Tags (required for most patterns):**

    **Relationship Tags:**

    **Process Tags:**

| Tag | Format | Purpose | Example Value |
| --- | --- | --- | --- |
| pattern | value | Pattern identifier | MyPattern |
| status | enum | FSM state | roadmap, active, completed |
| phase | number | Roadmap phase | 15 |
| core | flag | Mark as essential | (no value) |

| Tag | Format | Source | Purpose |
| --- | --- | --- | --- |
| uses | csv | TypeScript | Runtime dependencies |
| used-by | csv | TypeScript | Reverse dependencies |
| depends-on | csv | Gherkin | Planning dependencies |
| enables | csv | Either | What this unlocks |

| Tag | Format | Purpose | Example Value |
| --- | --- | --- | --- |
| quarter | value | Timeline | Q1-2026 |
| effort | value | Estimate | 2d, 4h, 1w |
| team | value | Assignment | platform-team |
| priority | enum | Urgency | critical, high, medium, low |

---

## File-Level Opt-In

**Context:** Files must explicitly opt-in to be scanned for annotations.

    **Decision:** Add the opt-in marker as the first annotation in a JSDoc comment.

    **Important:** Only files with the opt-in marker are scanned. Files without
    the marker are ignored by the scanner even if they contain other annotations.

| Preset | Opt-In Marker | Example |
| --- | --- | --- |
| libar-generic | at-libar-docs | JSDoc comment with at-libar-docs |
| generic | at-docs | JSDoc comment with at-docs |
| ddd-es-cqrs | at-libar-docs | JSDoc comment with at-libar-docs |

---

## Category Tags

**Context:** Category tags classify patterns by domain area.

    The full category list (21 categories in ddd-es-cqrs preset) is extracted from
    `src/taxonomy/categories.ts`. Each category has: tag, domain, priority, description.

    **Simple Presets (generic, libar-generic):** Only core, api, infra categories.

    **Usage:** Add category tag as a flag (no value needed).

---

## Metadata Tags

**Context:** Metadata tags are extracted from `src/taxonomy/registry-builder.ts`.
    The `METADATA_TAGS_BY_GROUP` constant organizes all 42 tags into functional groups:
    core, relationship, process, prd, adr, hierarchy, traceability, architecture, extraction.

    Each tag definition includes: tag name, format, purpose, and example.

    **Status Values:** roadmap, active, completed, deferred

---

## Format Types

**Context:** Format types define how tag values are parsed.

| Format | Parsing | Example |
| --- | --- | --- |
| flag | Boolean presence (no value) | at-libar-docs-core |
| value | Simple string | at-libar-docs-pattern MyPattern |
| enum | Constrained to predefined list | at-libar-docs-status completed |
| csv | Comma-separated values | at-libar-docs-uses A, B, C |
| number | Numeric value | at-libar-docs-phase 15 |
| quoted-value | Preserves spaces | at-libar-docs-brief:'Multi word' |

---

## Source Ownership

**Context:** Relationship tags have specific ownership rules.

    Relationship tag definitions are extracted from `src/taxonomy/registry-builder.ts`.
    This table defines WHERE each tag type should be used (architectural guidance):

    TypeScript files own runtime dependencies (`uses`).
    Feature files own planning dependencies (`depends-on`).

| Tag | Correct Location | Wrong Location |
| --- | --- | --- |
| uses | TypeScript | Feature files |
| depends-on | Feature files | TypeScript |

---

## Hierarchy Duration

**Context:** Hierarchy tags organize work into epic, phase, task structure.
    Tag definitions (level, parent) are extracted from `src/taxonomy/registry-builder.ts`.
    This table provides planning guidance for duration estimates:

| Level | Duration | Description |
| --- | --- | --- |
| epic | Multi-quarter | Strategic initiatives |
| phase | 2-5 days | Standard work units |
| task | 1-4 hours | Session-level work |

---

## Two-Tier Spec Architecture

**Context:** Traceability tags link roadmap specs to executable specs (PDR-007).
    Tag definitions (executable-specs, roadmap-spec) are in `src/taxonomy/registry-builder.ts`.
    This table explains the two-tier architecture:

| Tier | Location | Purpose |
| --- | --- | --- |
| Tier 1 | delivery-process/specs/ | Roadmap and planning specifications |
| Tier 2 | package/tests/features/ | Executable test specifications |

---

## CLAUDE.md Generation

**Context:** The package generates CLAUDE.md files for AI assistant context.

    **Output Locations:**

    **Section Routing Tag:** Use `claude-md-section` to route patterns to specific
    _claude-md subdirectories. This organizes AI context by domain.

    **Available Sections:**

| Format | Location | Purpose |
| --- | --- | --- |
| Compact | _claude-md/ subdirectories | Minimal AI context (low token cost) |
| Detailed | docs/ directory | Full human-readable documentation |

| Section Value | Output Directory | Content Type |
| --- | --- | --- |
| index | _claude-md/index/ | Navigation and overview |
| reference | _claude-md/reference/ | Tag and CLI reference |
| validation | _claude-md/validation/ | Validation rules and process guard |
| sessions | _claude-md/sessions/ | Session workflow guides |
| architecture | _claude-md/architecture/ | System architecture |
| methodology | _claude-md/methodology/ | Core principles |
| gherkin | _claude-md/gherkin/ | Gherkin writing patterns |
| config | _claude-md/config/ | Configuration reference |
| taxonomy | _claude-md/taxonomy/ | Tag taxonomy |
| publishing | _claude-md/publishing/ | Publishing guides |

---

## AI Context Optimization

**Context:** Guidelines for writing content that works well in AI assistant context.

    **Compact vs Detailed Format:**

    **Content Optimization Guidelines:**

| Aspect | Compact (AI) | Detailed (Human) |
| --- | --- | --- |
| Token budget | Minimize (cost-sensitive) | No limit |
| Examples | 1-2 essential | Many with variations |
| Tables | Dense, reference-style | Expanded with context |
| Prose | Bullet points preferred | Full sentences OK |
| Code | Minimal snippets | Full implementations |

| Guideline | Rationale |
| --- | --- |
| Use tables for reference data | Scannable, low tokens |
| Prefer bullet lists over paragraphs | AI parses structure well |
| Include concrete examples | Reduces ambiguity |
| State constraints explicitly | AI follows rules better |
| Avoid redundant explanations | Every token costs money |

---

## Gherkin Integration

**Context:** Gherkin feature files serve as both executable specs and documentation source.

    **File-Level Tags (at top of .feature file):**

    **Background Deliverables Table:**

    Use a Background section with a DataTable to define deliverables. The table
    must have columns: Deliverable, Status, Location.

    **Rule Block Structure:**

    **Scenario Tags:**

    **Feature Description Patterns:**

| Tag | Purpose | Example |
| --- | --- | --- |
| at-libar-docs | Opt-in marker | First line in tag block |
| at-libar-docs-pattern:Name | Pattern identifier | at-libar-docs-pattern:ProcessGuardLinter |
| at-libar-docs-status:value | FSM status | at-libar-docs-status:roadmap |
| at-libar-docs-phase:N | Phase number | at-libar-docs-phase:99 |

| Component | Purpose |
| --- | --- |
| Rule: Name | Groups related scenarios |
| Invariant header | States the business rule |
| Rationale header | Explains why the rule exists |
| Verified by header | References scenarios that verify the rule |

| Tag | Purpose |
| --- | --- |
| at-happy-path | Primary success scenario |
| at-edge-case | Boundary conditions |
| at-error-handling | Error recovery |
| at-validation | Input validation |
| at-acceptance-criteria | Required for DoD validation |
| at-integration | Cross-component behavior |

| Structure | Headers | Best For |
| --- | --- | --- |
| Problem/Solution | Problem and Solution | Pain point to fix |
| Value-First | Business Value and How It Works | TDD-style specs |
| Context/Approach | Context and Approach | Technical patterns |

---

## DD-1 - Text output with section markers per ADR-008

Both scope-validate and handoff return string from the router, using
    === SECTION === markers. This follows the dual output path established
    by ADR-008. Both commands are AI-consumption focused — JSON wrapping
    adds overhead without benefit.

---

## DD-2 - Git integration is opt-in via --git flag

The handoff command accepts an optional --git flag. When present, the
    CLI handler calls git diff and passes the file list to the pure
    generator function. The generator receives modifiedFiles as an optional
    readonly string array — no shell dependency in the domain logic.

**Rationale:** Pure functions are testable without mocking child_process. The git call stays in the CLI handler (I/O boundary), not the generator.

---

## DD-3 - Session type inferred from FSM status

The handoff command infers session type from the pattern's current
    FSM status. An explicit --session flag overrides inference.

---

## DD-4 - Severity levels match Process Guard model

Scope validation uses three severity levels. BLOCKED prevents session
    start. WARN indicates suboptimal readiness but does not block.

    The --strict flag (consistent with lint-process) promotes WARN to BLOCKED.

---

## DD-5 - Current date only for handoff

The handoff command always uses the current date. No --date flag.
    Handoff is run at session end; backdating is a rare edge case not
    worth the API surface area.

---

## DD-6 - Both positional and flag forms for scope type

scope-validate accepts the scope type as either a positional argument
    or a --type flag: both "scope-validate MyPattern implement" and
    "scope-validate MyPattern --type implement" work.

    This matches how dep-tree accepts --depth as both positional and flag.

---

## DD-7 - Co-located formatter functions

Each new module (scope-validator.ts, handoff-generator.ts) exports
    both the data builder and the text formatter. Unlike the
    context-assembler/context-formatter split (justified by ContextBundle
    complexity), these commands are simpler and benefit from co-location.

**Rationale:** Avoids file proliferation. The formatter for scope validation is ~30 lines; separating it into its own file adds overhead without benefit. If complexity grows, the split can happen later.

---

## Session Decision Tree

**Context:** Developers need to choose the correct session type based on their current situation.

    **Decision Tree (ASCII):**

    

    **Decision:** Session types map to inputs, outputs, and FSM changes:

| Session | Input | Output | FSM Change |
| --- | --- | --- | --- |
| Planning | Pattern brief | Roadmap spec (.feature) | Creates roadmap |
| Design | Complex requirement | Decision specs + code stubs | None |
| Implementation | Roadmap spec | Code + tests | roadmap to active to completed |
| Planning + Design | Pattern brief | Spec + stubs | Creates roadmap |

---

## Planning Session

**Goal:** Create a roadmap spec. Do NOT write implementation code.

    **Checklist:**

    1. Extract metadata from pattern brief
       - Phase number to at-prefix-phase
       - Dependencies to at-prefix-depends-on
       - Status to at-prefix-status:roadmap (always roadmap)

    2. Create spec file at specs/product-area/pattern.feature

    3. Structure the feature with at-prefix tags

    4. Add deliverables table in Background section

    5. Convert tables to Rule blocks (each business constraint becomes a Rule)

    6. Add scenarios per Rule (minimum: 1 happy-path + 1 validation)

    7. Set executable specs location with at-prefix-executable-specs tag

    **Do NOT:**

| Forbidden Action | Rationale |
| --- | --- |
| Create .ts implementation files | Planning only creates specs |
| Transition to active | Active requires implementation readiness |
| Ask Ready to implement? | Planning session ends at roadmap spec |
| Write full implementations | Stubs only if Planning + Design |

---

## Design Session

**Goal:** Make architectural decisions. Create code stubs with interfaces. Do NOT implement.

    **When Required:**

    **Checklist:**

    1. Record architectural decisions as PDR .feature files in delivery-process/decisions/

    2. Document options (at least 2-3 approaches with pros/cons in Rule blocks)

    3. Get approval (user must approve recommended approach)

    4. Create code stubs in delivery-process/stubs/{pattern-name}/ with at-prefix-implements and Target: annotations

    **Code Stub Pattern:**

    

    **Do NOT:**

| Use Design Session | Skip Design Session |
| --- | --- |
| Multiple valid approaches | Single obvious path |
| New patterns/capabilities | Bug fix |
| Cross-context coordination | Clear requirements |

| Forbidden Action | Rationale |
| --- | --- |
| Create markdown design documents | Decision specs provide better traceability with structured tags |
| Create implementation plans | Design focuses on architecture |
| Transition spec to active | Requires implementation session |
| Write full implementations | Stubs only |

---

## Implementation Session

**Goal:** Write code. The roadmap spec is the source of truth.

    **Pre-flight Requirements:**

    **Execution Checklist (CRITICAL - Order Matters):**

    1. Transition to active FIRST (before any code)
       - Change at-prefix-status:roadmap to at-prefix-status:active
       - Protection: active = scope-locked (no new deliverables)

    2. Create executable spec stubs (if at-prefix-executable-specs present)
       - Use at-prefix-implements:PatternName tag

    3. For each deliverable:
       - Read acceptance criteria from spec
       - Implement code (replace throw new Error)
       - Preserve at-prefix-* annotations in JSDoc
       - Write tests
       - Update deliverable status to completed

    4. Transition to completed (only when ALL done)
       - Change at-prefix-status:active to at-prefix-status:completed
       - Protection: completed = hard-locked (requires at-prefix-unlock-reason)

    5. Regenerate docs with: pnpm docs:all

    **Do NOT:**

| Requirement | Why |
| --- | --- |
| Roadmap spec exists with at-prefix-status:roadmap | Cannot implement without spec |
| Decision specs approved (if needed) | Complex decisions need approval |
| Implementation plan exists (for multi-session work) | Prevents scope drift |

| Forbidden Action | Rationale |
| --- | --- |
| Add new deliverables to active spec | Scope-locked state prevents this |
| Mark completed with incomplete work | Hard-locked state cannot be undone |
| Skip FSM transitions | Process Guard will reject |
| Edit generated docs directly | Regenerate from source |

---

## Planning + Design Session

**Goal:** Create spec AND code stubs in one session. For immediate implementation handoff.

    **When to Use:**

    **Checklist:**

    1. Complete Planning checklist (see Planning Session rule)

    2. Add at-prefix-executable-specs tag pointing to Tier 2 location

    3. Create code stubs (see Design Session code stub pattern)

    4. Create Tier 2 directory: package/tests/features/behavior/pattern-name/

    5. Create Tier 2 feature stubs with at-prefix-implements:PatternName

    6. Create step definitions stub at tests/planning-stubs/pattern.steps.ts

    **Handoff Complete When:**

    Tier 1:
    - All at-prefix-* tags present
    - at-prefix-executable-specs points to Tier 2
    - Deliverables table complete
    - Status is roadmap

    Tier 2:
    - Directory created with .feature files
    - Each file has at-prefix-implements
    - Step definitions stub compiles

    Validation:
    - pnpm lint passes
    - pnpm typecheck passes

| Use Planning + Design | Use Planning Only |
| --- | --- |
| Need stubs for implementation | Only enhancing spec |
| Preparing for immediate handoff | Still exploring requirements |
| Want complete two-tier architecture | Do not need Tier 2 yet |

---

## FSM Protection

**Context:** The FSM (Finite State Machine) protects work integrity through state-based restrictions.

    **Decision:** Protection levels and valid transitions are defined in TypeScript source:
    - Protection levels: See `PROTECTION_LEVELS` in `src/validation/fsm/states.ts`
    - Valid transitions: See `VALID_TRANSITIONS` in `src/validation/fsm/transitions.ts`

    **Protection Levels:**

    **Valid FSM Transitions:**

    **Invalid Transitions (will fail validation):**

| State | Protection | Can Add Deliverables | Needs Unlock | Allowed Actions | Blocked Actions |
| --- | --- | --- | --- | --- | --- |
| roadmap | None | Yes | No | Full editing, add deliverables | None |
| deferred | None | Yes | No | Full editing, add deliverables | None |
| active | Scope-locked | No | No | Edit existing deliverables | Adding new deliverables |
| completed | Hard-locked | No | Yes | Nothing | Any change without unlock tag |

| From | To | Trigger | Notes |
| --- | --- | --- | --- |
| roadmap | active | Start work | Locks scope |
| roadmap | deferred | Postpone | For deprioritized work |
| active | completed | Finish | Terminal state |
| active | roadmap | Regress | For blocked work |
| deferred | roadmap | Resume | To restart planning |

| Attempted | Why Invalid | Valid Path |
| --- | --- | --- |
| roadmap to completed | Must go through active | roadmap to active to completed |
| deferred to active | Must return to roadmap first | deferred to roadmap to active |
| deferred to completed | Cannot skip two states | deferred to roadmap to active to completed |
| completed to any | Terminal state | Use unlock-reason tag to modify |

---

## FSM Error Messages and Fixes

**Context:** Process Guard validates FSM rules and provides specific error messages with fixes.

    **Error Reference:**

| Error | Cause | Fix |
| --- | --- | --- |
| completed-protection | File has completed status but no unlock tag | Add unlock-reason tag with hyphenated reason |
| invalid-status-transition | Skipped FSM state (e.g., roadmap to completed) | Follow path: roadmap to active to completed |
| scope-creep | Added deliverable to active spec | Remove deliverable OR revert to roadmap |
| session-scope (warning) | Modified file outside session scope | Add to scope OR use --ignore-session |
| session-excluded | Modified excluded pattern during session | Remove from exclusion OR override |
| deliverable-removed (warning) | Deliverable was removed from spec | Informational only, verify intentional |

---

## Escape Hatches

**Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Available Escape Hatches:**

    **Unlock Reason Constraints:**

    - Values cannot contain spaces (use hyphens)
    - Must describe why modification is needed
    - Is committed with the change for audit trail

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |
| Emergency hotfix | Combine unlock + ignore | @libar-docs-unlock-reason:'Hotfix' plus --ignore-session |

---

## Handoff Documentation

**Context:** Multi-session work requires state capture at session boundaries.

    **Template:**

    

    **Required Elements:**

| Element | Purpose |
| --- | --- |
| Last completed | What finished this session |
| In progress | What is partially done |
| Blockers | What prevents progress |
| Files Modified | Track changes for review |
| Next Session | Clear starting point |

---

## Discovery Tags

**Context:** Learnings discovered during sessions should be captured inline.

    **Decision:** Three discovery tag types are available:

    **Usage:** Add discovery tags as comments in feature files or code:

    

    **Note:** Discovery tags use hyphens instead of spaces (tag values cannot contain spaces).

| Tag | Purpose | Example |
| --- | --- | --- |
| at-prefix-discovered-gap | Missing edge case or feature | Missing-validation-for-empty-input |
| at-prefix-discovered-improvement | Performance or DX enhancement | Cache-parsed-results |
| at-prefix-discovered-learning | Knowledge gained | Gherkin-requires-strict-indentation |

---

## Common Mistakes

**Context:** Developers frequently make these mistakes when following session workflows.

    **Planning Session Mistakes:**

    **Implementation Session Mistakes:**

    **Design Session Mistakes:**

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Creating .ts implementation files | Planning only creates specs | Create spec file only, no code |
| Transitioning to active | Active requires implementation readiness | Keep status as roadmap |
| Asking Ready to implement? | Planning session ends at roadmap spec | End session after spec complete |
| Writing full implementations | Stubs only if Planning + Design | Save implementation for Implementation session |

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Writing code before transition | FSM must be active first | Change status to active FIRST |
| Adding deliverables to active spec | Scope-locked state prevents this | Revert to roadmap to add scope |
| Marking completed with incomplete work | Hard-locked state cannot be undone | Finish ALL deliverables first |
| Skipping FSM transitions | Process Guard will reject | Follow roadmap to active to completed |
| Editing generated docs directly | Will be overwritten | Regenerate from source |

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Creating markdown design documents | Decision specs provide better traceability | Record decisions as PDR .feature files in delivery-process/decisions/ |
| Creating implementation plans | Design focuses on architecture | Document options and decisions only |
| Transitioning spec to active | Requires implementation session | Keep status as roadmap |
| Writing full implementations | Design creates stubs only | Use throw new Error pattern |

---

## Related Documentation - Session Guides

**Context:** Session guides connect to other documentation.

    **Decision:** Related docs by topic:

| Document | Content |
| --- | --- |
| METHODOLOGY.md | Core thesis, FSM states, two-tier architecture |
| GHERKIN-PATTERNS.md | DataTables, DocStrings, Rule blocks |
| CONFIGURATION.md | Tag prefixes, presets |
| INSTRUCTIONS.md | CLI commands, full tag reference |
| PROCESS-GUARD-REFERENCE.md | FSM validation rules and CLI usage |
| VALIDATION-REFERENCE.md | DoD validation and anti-pattern detection |

---

## Text commands return string from router

---

## SubcommandContext replaces narrow router parameters

---

## QueryResult envelope is a CLI presentation concern

---

## ProcessStateAPI returns remain unchanged

---

## API Types

### PROCESS_STATUS_VALUES (const)

/**
 * @libar-docs
 * @libar-docs-pattern StatusValues
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes PROCESS_STATUS_VALUES, ProcessStatusValue, ACCEPTED_STATUS_VALUES, AcceptedStatusValue, DEFAULT_STATUS, VALID_PROCESS_STATUS_SET
 *
 * ## Process Workflow Status Values
 *
 * THE single source of truth for FSM state values in the monorepo (per PDR-005 FSM).
 *
 * FSM transitions:
 * - roadmap to active (start work)
 * - roadmap to deferred (pause before start)
 * - deferred to roadmap (resume planning)
 * - active to completed (finish work)
 * - active to deferred (pause work)
 * - deferred to active (resume work)
 * - active cannot regress to roadmap
 */

```typescript
PROCESS_STATUS_VALUES = [
  'roadmap', // Planned work, fully editable
  'active', // In progress, scope-locked
  'completed', // Done, hard-locked
  'deferred', // On hold, fully editable
] as const
```

### ProcessStatusValue (type)

```typescript
type ProcessStatusValue = (typeof PROCESS_STATUS_VALUES)[number];
```

### ACCEPTED_STATUS_VALUES (const)

/**
 * Extended status values accepted for extraction and validation
 *
 * FSM states that can be used in annotations.
 * Use only these canonical values: roadmap, active, completed, deferred.
 */

```typescript
ACCEPTED_STATUS_VALUES = [...PROCESS_STATUS_VALUES] as const
```

### AcceptedStatusValue (type)

/**
 * Extended status values accepted for extraction and validation
 *
 * FSM states that can be used in annotations.
 * Use only these canonical values: roadmap, active, completed, deferred.
 */

```typescript
type AcceptedStatusValue = (typeof ACCEPTED_STATUS_VALUES)[number];
```

### DEFAULT_STATUS (const)

/**
 * Default status for new items
 */

```typescript
const DEFAULT_STATUS: ProcessStatusValue;
```

### VALID_PROCESS_STATUS_SET (const)

/**
 * Pre-built set of valid process statuses for O(1) membership checks.
 */

```typescript
const VALID_PROCESS_STATUS_SET: ReadonlySet<string>;
```

### RISK_LEVELS (const)

/**
 * @libar-docs
 * @libar-docs-pattern RiskLevels
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes RISK_LEVELS, RiskLevel
 *
 * ## Risk Levels for Planning and Assessment
 *
 * Three-tier risk classification for roadmap planning.
 */

```typescript
RISK_LEVELS = ['low', 'medium', 'high'] as const
```

### RiskLevel (type)

/**
 * @libar-docs
 * @libar-docs-pattern RiskLevels
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes RISK_LEVELS, RiskLevel
 *
 * ## Risk Levels for Planning and Assessment
 *
 * Three-tier risk classification for roadmap planning.
 */

```typescript
type RiskLevel = (typeof RISK_LEVELS)[number];
```

### TagRegistry (interface)

/**
 * TagRegistry interface (matches schema from validation-schemas/tag-registry.ts)
 */

```typescript
interface TagRegistry {
  /** Schema version for forward/backward compatibility checking */
  version: string;
  /** Category definitions for classifying patterns by domain (e.g., core, api, ddd) */
  categories: readonly CategoryDefinitionForRegistry[];
  /** Metadata tag definitions with format, purpose, and validation rules */
  metadataTags: readonly MetadataTagDefinitionForRegistry[];
  /** Aggregation tag definitions for document-level grouping */
  aggregationTags: readonly AggregationTagDefinitionForRegistry[];
  /** Available format options for documentation output */
  formatOptions: readonly string[];
  /** Prefix for all tags (e.g., "@libar-docs-") */
  tagPrefix: string;
  /** File-level opt-in marker tag (e.g., "@libar-docs") */
  fileOptInTag: string;
}
```

| Property | Description |
| --- | --- |
| version | Schema version for forward/backward compatibility checking |
| categories | Category definitions for classifying patterns by domain (e.g., core, api, ddd) |
| metadataTags | Metadata tag definitions with format, purpose, and validation rules |
| aggregationTags | Aggregation tag definitions for document-level grouping |
| formatOptions | Available format options for documentation output |
| tagPrefix | Prefix for all tags (e.g., "@libar-docs-") |
| fileOptInTag | File-level opt-in marker tag (e.g., "@libar-docs") |

### MetadataTagDefinitionForRegistry (interface)

```typescript
interface MetadataTagDefinitionForRegistry {
  /** Tag name without prefix (e.g., "pattern", "status", "phase") */
  tag: string;
  /** Value format type determining parsing rules (flag, value, enum, csv, number, quoted-value) */
  format: FormatType;
  /** Human-readable description of the tag's purpose and usage */
  purpose: string;
  /** Whether this tag must be present for valid patterns */
  required?: boolean;
  /** Whether this tag can appear multiple times on a single pattern */
  repeatable?: boolean;
  /** Valid values for enum-type tags (undefined for non-enum formats) */
  values?: readonly string[];
  /** Default value applied when tag is not specified */
  default?: string;
  /** Example usage showing tag syntax (e.g., "@libar-docs-pattern MyPattern") */
  example?: string;
}
```

| Property | Description |
| --- | --- |
| tag | Tag name without prefix (e.g., "pattern", "status", "phase") |
| format | Value format type determining parsing rules (flag, value, enum, csv, number, quoted-value) |
| purpose | Human-readable description of the tag's purpose and usage |
| required | Whether this tag must be present for valid patterns |
| repeatable | Whether this tag can appear multiple times on a single pattern |
| values | Valid values for enum-type tags (undefined for non-enum formats) |
| default | Default value applied when tag is not specified |
| example | Example usage showing tag syntax (e.g., "@libar-docs-pattern MyPattern") |

### TagDefinition (type)

```typescript
type TagDefinition = MetadataTagDefinitionForRegistry;
```

### buildRegistry (function)

/**
 * Build the complete tag registry from TypeScript constants
 *
 * This is THE single source of truth for the taxonomy.
 * All consumers should use this function instead of loading JSON.
 */

```typescript
function buildRegistry(): TagRegistry;
```

### METADATA_TAGS_BY_GROUP (const)

/**
 * Metadata tags organized by functional group.
 * Used for documentation generation to create organized sections.
 *
 * Groups:
 * - core: Essential pattern identification (pattern, status, core, usecase, brief)
 * - relationship: Pattern dependencies and connections
 * - process: Timeline and assignment tracking
 * - prd: Product requirements documentation
 * - adr: Architecture decision records
 * - hierarchy: Epic/phase/task breakdown
 * - traceability: Two-tier spec architecture links
 * - architecture: Diagram generation tags
 * - extraction: Documentation extraction control
 * - stub: Design session stub metadata
 */

```typescript
METADATA_TAGS_BY_GROUP = {
  core: ['pattern', 'status', 'core', 'usecase', 'brief'] as const,
  relationship: [
    'uses',
    'used-by',
    'implements',
    'extends',
    'depends-on',
    'enables',
    'see-also',
    'api-ref',
  ] as const,
  process: [
    'phase',
    'release',
    'quarter',
    'completed',
    'effort',
    'effort-actual',
    'team',
    'workflow',
    'risk',
    'priority',
  ] as const,
  prd: ['product-area', 'user-role', 'business-value', 'constraint'] as const,
  adr: [
    'adr',
    'adr-status',
    'adr-category',
    'adr-supersedes',
    'adr-superseded-by',
    'adr-theme',
    'adr-layer',
  ] as const,
  hierarchy: ['level', 'parent'] as const,
  traceability: ['executable-specs', 'roadmap-spec'] as const,
  architecture: ['arch-role', 'arch-context', 'arch-layer'] as const,
  extraction: ['extract-shapes'] as const,
  stub: ['target', 'since'] as const,
  convention: ['convention'] as const,
} as const
```

### NORMALIZED_STATUS_VALUES (const)

/**
 * Normalized status values for display
 *
 * Maps raw FSM states to three presentation buckets:
 * - completed: Work is done
 * - active: Work in progress
 * - planned: Future work (includes roadmap and deferred)
 */

```typescript
NORMALIZED_STATUS_VALUES = ['completed', 'active', 'planned'] as const
```

### NormalizedStatus (type)

/**
 * Normalized status values for display
 *
 * Maps raw FSM states to three presentation buckets:
 * - completed: Work is done
 * - active: Work in progress
 * - planned: Future work (includes roadmap and deferred)
 */

```typescript
type NormalizedStatus = (typeof NORMALIZED_STATUS_VALUES)[number];
```

### STATUS_NORMALIZATION_MAP (const)

/**
 * Maps raw status values → normalized display status
 *
 * Includes both:
 * Canonical taxonomy values (per PDR-005 FSM)
 */

```typescript
const STATUS_NORMALIZATION_MAP: Readonly<Record<string, NormalizedStatus>>;
```

### normalizeStatus (function)

/**
 * Normalize any status string to a display bucket
 *
 * Maps status values to three canonical display states:
 * - "completed": completed
 * - "active": active
 * - "planned": roadmap, deferred, planned, or any unknown value
 *
 * Per PDR-005: deferred items are treated as planned (not actively worked on)
 *
 * @param status - Raw status from pattern (case-insensitive)
 * @returns "completed" | "active" | "planned"
 *
 * @example
 * ```typescript
 * normalizeStatus("completed")   // → "completed"
 * normalizeStatus("active")      // → "active"
 * normalizeStatus("roadmap")     // → "planned"
 * normalizeStatus("deferred")    // → "planned"
 * normalizeStatus(undefined)     // → "planned"
 * ```
 */

```typescript
function normalizeStatus(status: string | undefined): NormalizedStatus;
```

### LAYER_TYPES (const)

/**
 * @libar-docs
 * @libar-docs-pattern LayerTypes
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes LAYER_TYPES, LayerType
 *
 * ## Feature Layer Types for Test Organization
 *
 * Inferred from feature file directory paths:
 * - timeline: Process/workflow features (delivery-process)
 * - domain: Business domain features
 * - integration: Cross-system integration tests
 * - e2e: End-to-end user journey tests
 * - component: Unit/component level tests
 * - unknown: Cannot determine layer from path
 */

```typescript
LAYER_TYPES = [
  'timeline',
  'domain',
  'integration',
  'e2e',
  'component',
  'unknown',
] as const
```

### LayerType (type)

```typescript
type LayerType = (typeof LAYER_TYPES)[number];
```

### HIERARCHY_LEVELS (const)

/**
 * @libar-docs
 * @libar-docs-pattern HierarchyLevels
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes HIERARCHY_LEVELS, HierarchyLevel, DEFAULT_HIERARCHY_LEVEL
 *
 * ## Hierarchy Levels for Work Item Breakdown
 *
 * Three-level hierarchy for organizing work:
 * - epic: Multi-quarter strategic initiatives
 * - phase: Standard work units (2-5 days)
 * - task: Fine-grained session-level work (1-4 hours)
 */

```typescript
HIERARCHY_LEVELS = ['epic', 'phase', 'task'] as const
```

### HierarchyLevel (type)

/**
 * @libar-docs
 * @libar-docs-pattern HierarchyLevels
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes HIERARCHY_LEVELS, HierarchyLevel, DEFAULT_HIERARCHY_LEVEL
 *
 * ## Hierarchy Levels for Work Item Breakdown
 *
 * Three-level hierarchy for organizing work:
 * - epic: Multi-quarter strategic initiatives
 * - phase: Standard work units (2-5 days)
 * - task: Fine-grained session-level work (1-4 hours)
 */

```typescript
type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number];
```

### DEFAULT_HIERARCHY_LEVEL (const)

/**
 * Default hierarchy level (for backward compatibility)
 */

```typescript
const DEFAULT_HIERARCHY_LEVEL: HierarchyLevel;
```

### FORMAT_TYPES (const)

/**
 * @libar-docs
 * @libar-docs-pattern FormatTypes
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes FORMAT_TYPES, FormatType
 *
 * ## Tag Value Format Types
 *
 * Defines how tag values are parsed and validated.
 * Each format type determines the parsing strategy for tag values.
 */

```typescript
FORMAT_TYPES = [
  'value', // Simple string value
  'enum', // Constrained to predefined values
  'quoted-value', // String in quotes (preserves spaces)
  'csv', // Comma-separated values
  'number', // Numeric value
  'flag', // Boolean presence (no value needed)
] as const
```

### FormatType (type)

```typescript
type FormatType = (typeof FORMAT_TYPES)[number];
```

### DELIVERABLE_STATUS_VALUES (const)

/**
 * Canonical deliverable status values
 *
 * These are the ONLY accepted values for the Status column in
 * Gherkin Background deliverable tables. Values are lowercased
 * at extraction time before schema validation.
 *
 * - complete: Work is done
 * - in-progress: Work is ongoing
 * - pending: Work hasn't started
 * - deferred: Work postponed
 * - superseded: Replaced by another deliverable
 * - n/a: Not applicable
 */

```typescript
DELIVERABLE_STATUS_VALUES = [
  'complete',
  'in-progress',
  'pending',
  'deferred',
  'superseded',
  'n/a',
] as const
```

### DeliverableStatus (type)

```typescript
type DeliverableStatus = (typeof DELIVERABLE_STATUS_VALUES)[number];
```

### VALID_DELIVERABLE_STATUS_SET (const)

/**
 * Pre-built set of valid deliverable statuses for O(1) membership checks.
 */

```typescript
const VALID_DELIVERABLE_STATUS_SET: ReadonlySet<string>;
```

### DEFAULT_DELIVERABLE_STATUS (const)

/**
 * Default status for new deliverables
 */

```typescript
const DEFAULT_DELIVERABLE_STATUS: DeliverableStatus;
```

### isDeliverableStatusComplete (function)

/**
 * Check if a deliverable status indicates completion.
 *
 * Use this for **deliverable-level** status checks (6 canonical values).
 * For **pattern-level** FSM status checks, use `isPatternComplete()`
 * from `normalized-status.ts` instead.
 */

```typescript
function isDeliverableStatusComplete(status: DeliverableStatus): boolean;
```

### isDeliverableStatusInProgress (function)

/**
 * Check if a deliverable status indicates work in progress.
 *
 * Use this for **deliverable-level** status checks.
 * For **pattern-level** FSM status checks, use `isPatternActive()`
 * from `normalized-status.ts` instead.
 */

```typescript
function isDeliverableStatusInProgress(status: DeliverableStatus): boolean;
```

### isDeliverableStatusPending (function)

/**
 * Check if a deliverable status indicates pending/not-started.
 *
 * Use this for **deliverable-level** status checks.
 * For **pattern-level** FSM status checks, use `isPatternPlanned()`
 * from `normalized-status.ts` instead.
 */

```typescript
function isDeliverableStatusPending(status: DeliverableStatus): boolean;
```

### getDeliverableStatusEmoji (function)

/**
 * Get the appropriate emoji for a deliverable status.
 *
 * Maps the 6 canonical deliverable statuses to display emojis.
 *
 * Note: This is for deliverable statuses (6 canonical values),
 * NOT for FSM pattern statuses (roadmap/active/completed/deferred) —
 * use `getStatusEmoji()` from `renderable/utils.ts` for those.
 */

```typescript
function getDeliverableStatusEmoji(status: DeliverableStatus): string;
```

### CategoryDefinition (interface)

/**
 * @libar-docs
 * @libar-docs-pattern CategoryDefinitions
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-arch-role read-model
 * @libar-docs-arch-context taxonomy
 * @libar-docs-arch-layer domain
 * @libar-docs-extract-shapes CategoryDefinition, CATEGORIES, CategoryTag, CATEGORY_TAGS
 *
 * ## Category Definitions
 *
 * Categories are used to classify patterns and organize documentation.
 * Priority determines display order (lower = higher priority).
 * The ddd-es-cqrs preset includes all 21 categories; simpler presets use subsets.
 */

```typescript
interface CategoryDefinition {
  /** Category tag name without prefix (e.g., "core", "api", "ddd", "saga") */
  readonly tag: string;
  /** Human-readable domain name for display (e.g., "Strategic DDD", "Event Sourcing") */
  readonly domain: string;
  /** Display order priority - lower values appear first in sorted output */
  readonly priority: number;
  /** Brief description of the category's purpose and typical patterns */
  readonly description: string;
  /** Alternative tag names that map to this category (e.g., "es" for "event-sourcing") */
  readonly aliases: readonly string[];
}
```

| Property | Description |
| --- | --- |
| tag | Category tag name without prefix (e.g., "core", "api", "ddd", "saga") |
| domain | Human-readable domain name for display (e.g., "Strategic DDD", "Event Sourcing") |
| priority | Display order priority - lower values appear first in sorted output |
| description | Brief description of the category's purpose and typical patterns |
| aliases | Alternative tag names that map to this category (e.g., "es" for "event-sourcing") |

### CATEGORIES (const)

/**
 * All category definitions for the monorepo
 */

```typescript
const CATEGORIES: readonly CategoryDefinition[];
```

### CategoryTag (type)

/**
 * Category tags as a union type
 */

```typescript
type CategoryTag = (typeof CATEGORIES)[number]['tag'];
```

### CATEGORY_TAGS (const)

/**
 * Extract all category tags as an array
 */

```typescript
CATEGORY_TAGS = CATEGORIES.map((c) => c.tag) as readonly CategoryTag[]
```

### ValidateCLIConfig (interface)

/**
 * CLI configuration
 */

```typescript
interface ValidateCLIConfig {
  /** Glob patterns for TypeScript input files */
  input: string[];
  /** Glob patterns for Gherkin feature files */
  features: string[];
  /** Glob patterns to exclude */
  exclude: string[];
  /** Base directory for path resolution */
  baseDir: string;
  /** Treat warnings as errors */
  strict: boolean;
  /** Output format */
  format: 'pretty' | 'json';
  /** Show help */
  help: boolean;
  /** Enable DoD validation mode */
  dod: boolean;
  /** Specific phases to validate (empty = all completed phases) */
  phases: number[];
  /** Enable anti-pattern detection */
  antiPatterns: boolean;
  /** Override scenario bloat threshold */
  scenarioBloatThreshold: number;
  /** Override mega-feature line threshold */
  megaFeatureLineThreshold: number;
  /** Override magic comment threshold */
  magicCommentThreshold: number;
  /** Show version */
  version: boolean;
}
```

| Property | Description |
| --- | --- |
| input | Glob patterns for TypeScript input files |
| features | Glob patterns for Gherkin feature files |
| exclude | Glob patterns to exclude |
| baseDir | Base directory for path resolution |
| strict | Treat warnings as errors |
| format | Output format |
| help | Show help |
| dod | Enable DoD validation mode |
| phases | Specific phases to validate (empty = all completed phases) |
| antiPatterns | Enable anti-pattern detection |
| scenarioBloatThreshold | Override scenario bloat threshold |
| megaFeatureLineThreshold | Override mega-feature line threshold |
| magicCommentThreshold | Override magic comment threshold |
| version | Show version |

### ValidationIssue (interface)

/**
 * Validation issue
 */

```typescript
interface ValidationIssue {
  severity: IssueSeverity;
  message: string;
  source: 'typescript' | 'gherkin' | 'cross-source';
  pattern?: string;
  file?: string;
}
```

### ValidationSummary (interface)

/**
 * Validation summary
 */

```typescript
interface ValidationSummary {
  issues: ValidationIssue[];
  stats: {
    typescriptPatterns: number;
    gherkinPatterns: number;
    matched: number;
    missingInGherkin: number;
    missingInTypeScript: number;
  };
}
```

### ProcessGuardCLIConfig (interface)

/**
 * CLI configuration
 */

```typescript
interface ProcessGuardCLIConfig {
  /** Validation mode */
  mode: ValidationMode;
  /** Specific files to validate (when mode is 'files') */
  files: string[];
  /** Treat warnings as errors */
  strict: boolean;
  /** Ignore session scope rules */
  ignoreSession: boolean;
  /** Show derived process state (debugging) */
  showState: boolean;
  /** Base directory for relative paths */
  baseDir: string;
  /** Output format */
  format: 'pretty' | 'json';
  /** Show help */
  help: boolean;
  /** Show version */
  version: boolean;
}
```

| Property | Description |
| --- | --- |
| mode | Validation mode |
| files | Specific files to validate (when mode is 'files') |
| strict | Treat warnings as errors |
| ignoreSession | Ignore session scope rules |
| showState | Show derived process state (debugging) |
| baseDir | Base directory for relative paths |
| format | Output format |
| help | Show help |
| version | Show version |

### LintCLIConfig (interface)

/**
 * CLI configuration
 */

```typescript
interface LintCLIConfig {
  /** Glob patterns for input files */
  input: string[];
  /** Glob patterns to exclude */
  exclude: string[];
  /** Base directory for path resolution */
  baseDir: string;
  /** Treat warnings as errors */
  strict: boolean;
  /** Output format */
  format: 'pretty' | 'json';
  /** Only show errors (suppress warnings/info) */
  quiet: boolean;
  /** Minimum severity to report */
  minSeverity: LintSeverity;
  /** Show help */
  help: boolean;
  /** Show version */
  version: boolean;
}
```

| Property | Description |
| --- | --- |
| input | Glob patterns for input files |
| exclude | Glob patterns to exclude |
| baseDir | Base directory for path resolution |
| strict | Treat warnings as errors |
| format | Output format |
| quiet | Only show errors (suppress warnings/info) |
| minSeverity | Minimum severity to report |
| help | Show help |
| version | Show version |

### CLIConfig (interface)

/**
 * CLI configuration
 */

```typescript
interface CLIConfig {
  /** Output path for TAG_TAXONOMY.md (-o, --output). Default: docs/architecture/TAG_TAXONOMY.md */
  output: string;
  /** Base directory for path resolution (-b, --base-dir). Default: cwd */
  baseDir: string;
  /** Overwrite existing file (-f, --overwrite). Default: false */
  overwrite: boolean;
  /** Show help message (-h, --help). */
  help: boolean;
  /** Show version number (-v, --version). */
  version: boolean;
}
```

| Property | Description |
| --- | --- |
| output | Output path for TAG_TAXONOMY.md (-o, --output). Default: docs/architecture/TAG_TAXONOMY.md |
| baseDir | Base directory for path resolution (-b, --base-dir). Default: cwd |
| overwrite | Overwrite existing file (-f, --overwrite). Default: false |
| help | Show help message (-h, --help). |
| version | Show version number (-v, --version). |

---
