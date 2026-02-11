# Index Reference

**Purpose:** Reference document: Index Reference
**Detail Level:** Compact summary

---

## Context - Package needs its own delivery process configuration

---

## Decision - Dog-food the delivery process for self-documentation

| Artifact | Location | Generator |
| --- | --- | --- |
| Roadmap specs | `delivery-process/specs/` | roadmap |
| Releases | `delivery-process/releases/` | changelog |
| Decisions | `delivery-process/decisions/` | doc-from-decision |
| Reference docs | convention-tagged decisions | reference codec |
| Generated docs | `docs-generated/` | all |

---

## Decision - Relationship tags in use (libar-generic preset)

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

| Workflow | Required | Recommended | Optional |
| --- | --- | --- | --- |
| **Planning** | `status`, `phase` | `depends-on`, `enables` | `priority`, `effort`, `quarter` |
| **Design** | `status`, `uses` | `arch-*` tags, `extends` | `see-also` |
| **Implementation** | `implements` (behavior tests) | `uses`, `used-by` | `api-ref` |

---

## Decision - Executable specs linkage patterns

| Pattern | When to Use | Tag Required | Example |
| --- | --- | --- | --- |
| **Linked** | Tests validate a tier 1 spec | `@libar-docs-implements:PatternName` | `fsm-validator.feature` → `PhaseStateMachineValidation` |
| **Standalone** | Utility/infrastructure tests | None | `result-monad.feature`, `string-utils.feature` |

---

## Decision - Architecture tags for diagram generation

| Tag | Purpose | Values | Example |
| --- | --- | --- | --- |
| `arch-role` | Component type | `infrastructure`, `service`, `repository`, `handler` | `@libar-docs-arch-role infrastructure` |
| `arch-context` | Bounded context grouping | Free text | `@libar-docs-arch-context scanner` |
| `arch-layer` | Layer for layered diagrams | `domain`, `application`, `infrastructure` | `@libar-docs-arch-layer application` |

---

## Consequences - Benefits and trade-offs

---

## Core Thesis

| Traditional Approach | USDP Approach |
| --- | --- |
| Docs are written | Docs are generated |
| Status is tracked manually | Status is FSM-enforced |
| Requirements live in Jira | Requirements are Gherkin scenarios |
| AI agents parse stale Markdown | AI agents query typed APIs |

---

## Why Generated Documentation

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

| Event Sourcing Concept | Documentation Equivalent |
| --- | --- |
| Events | Git commits (changes to annotated code) |
| Projections | Generated docs (PATTERNS.md, ROADMAP.md) |
| Read Model | ProcessStateAPI (typed queries) |

---

## Dogfooding

---

## Four-Stage Workflow

| Stage | Input | Output | FSM State |
| --- | --- | --- | --- |
| Ideation | Pattern brief | Roadmap spec (.feature) | roadmap |
| Design | Complex requirement | Decision specs + code stubs | roadmap |
| Planning | Roadmap spec | Implementation plan | roadmap |
| Coding | Implementation plan | Code + tests | roadmap to active to completed |

---

## Skip Conditions

**Invariant:** Stages may only be skipped when conditions below are met.

| Skip | When |
| --- | --- |
| Design | Single valid approach, straightforward implementation |
| Planning | Single-session work, clear scope |
| Neither | Multi-session work, architectural decisions |

---

## Annotation Ownership

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

---

## Two-Tier Spec Architecture

| Tier | Location | Purpose | Executable |
| --- | --- | --- | --- |
| Roadmap | specs/area/ | Planning, deliverables, acceptance criteria | No |
| Package | pkg/tests/features/ | Implementation proof, regression testing | Yes |

---

## Code Stub Levels

| Level | Contains | When |
| --- | --- | --- |
| Minimal | JSDoc annotations only | Quick exploration |
| Interface | Types + stub functions | API contracts |
| Partial | Working code + some stubs | Progressive implementation |

---

## Planning Stubs Architecture

| Phase | Location | Status |
| --- | --- | --- |
| Planning | planning-stubs/ | throw new Error("Not implemented") |
| Implementation | Move to steps/ | Replace with real logic |
| Completed | steps/ | Fully executable |

---

## Pattern Extraction Workflow

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

| Field | Value |
| --- | --- |
| Package | @libar-dev/delivery-process |
| Version | 0.1.0-pre.0 |
| Purpose | Turn TypeScript annotations and Gherkin specs into living docs, architecture graphs, and AI-queryable delivery state |
| Node.js | >=18.0.0 |
| License | MIT |

---

## Quick Start Paths

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

| Order | Document | Focus |
| --- | --- | --- |
| 1 | README.md | Installation, quick start, ProcessStateAPI overview |
| 2 | CONFIGURATION.md | Presets, tag prefixes, config files |
| 3 | METHODOLOGY.md | Core thesis, dual-source architecture |

---

## Reading Order for Developers

| Order | Document | Focus |
| --- | --- | --- |
| 4 | ARCHITECTURE.md | Four-stage pipeline, codecs, MasterDataset |
| 5 | SESSION-GUIDES.md | Planning/Design/Implementation workflows |
| 6 | GHERKIN-PATTERNS.md | Writing effective Gherkin specs |
| 7 | INSTRUCTIONS.md | Complete tag and CLI reference |

---

## Reading Order for Team Leads

| Order | Document | Focus |
| --- | --- | --- |
| 8 | PROCESS-GUARD.md | FSM enforcement, pre-commit hooks |
| 9 | VALIDATION.md | Lint rules, DoD checks, anti-patterns |

---

## Document Contents Summary

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

| Source | Owns | Example Tags |
| --- | --- | --- |
| Feature files | Planning: status, phase, quarter, effort | status, phase, depends-on |
| TypeScript | Implementation: uses, used-by, category | uses, used-by, core |

---

## Delivery Workflow FSM

| From | To | When |
| --- | --- | --- |
| roadmap | active | Starting implementation work |
| active | completed | All deliverables done |
| active | roadmap | Blocked or regressed |
| deferred | roadmap | Ready to resume |

---

## ProcessStateAPI

| Method | Returns |
| --- | --- |
| getCurrentWork() | Patterns with active status |
| getRoadmapItems() | Patterns with roadmap status |
| isValidTransition(from, to) | Boolean for FSM validation |
| getPattern(id) | Single pattern by ID |
| getPatternsByCategory(cat) | Patterns in a category |

---

## Document Roles

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
