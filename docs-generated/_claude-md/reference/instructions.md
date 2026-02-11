# Instructions Reference

**Purpose:** Reference document: Instructions Reference
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

## Quick Tag Reference

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

| Preset | Opt-In Marker | Example |
| --- | --- | --- |
| libar-generic | at-libar-docs | JSDoc comment with at-libar-docs |
| generic | at-docs | JSDoc comment with at-docs |
| ddd-es-cqrs | at-libar-docs | JSDoc comment with at-libar-docs |

---

## Category Tags

---

## Metadata Tags

---

## Format Types

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

| Tag | Correct Location | Wrong Location |
| --- | --- | --- |
| uses | TypeScript | Feature files |
| depends-on | Feature files | TypeScript |

---

## Hierarchy Duration

| Level | Duration | Description |
| --- | --- | --- |
| epic | Multi-quarter | Strategic initiatives |
| phase | 2-5 days | Standard work units |
| task | 1-4 hours | Session-level work |

---

## Two-Tier Spec Architecture

| Tier | Location | Purpose |
| --- | --- | --- |
| Tier 1 | delivery-process/specs/ | Roadmap and planning specifications |
| Tier 2 | package/tests/features/ | Executable test specifications |

---

## CLAUDE.md Generation

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

| Preset | Tag Prefix | File Opt-In | Categories | Use Case |
| --- | --- | --- | --- | --- |
| libar-generic (default) | libar-docs- | libar-docs | 3 | Simple projects (this package) |
| generic | docs- | docs | 3 | Simple projects with shorter prefix |
| ddd-es-cqrs | libar-docs- | libar-docs | 21 | DDD/Event Sourcing architectures |

---

## Preset Category Behavior

| Preset | Category Count | Example Categories |
| --- | --- | --- |
| libar-generic | 3 | core, api, infra |
| generic | 3 | core, api, infra |
| ddd-es-cqrs | 21 | domain, ddd, bounded-context, event-sourcing, decider, cqrs, saga, projection |

---

## Default Preset Selection

| Entry Point | Default Preset | Categories | Context |
| --- | --- | --- | --- |
| createDeliveryProcess() | libar-generic | 3 | Programmatic API |
| loadConfig() fallback | libar-generic | 3 | CLI tools (no config file) |
| This package config file | libar-generic | 3 | Standalone package usage |

---

## Libar Generic Preset

| Property | Value |
| --- | --- |
| Tag Prefix | libar-docs- |
| File Opt-In | libar-docs |
| Categories | 3 (core, api, infra) |

---

## Generic Preset

| Property | Value |
| --- | --- |
| Tag Prefix | docs- |
| File Opt-In | docs |
| Categories | 3 (core, api, infra) |

---

## DDD ES CQRS Preset

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

---

## Custom Configuration

| Option | Type | Description |
| --- | --- | --- |
| preset | string | Base preset to use (libar-generic, generic, ddd-es-cqrs) |
| tagPrefix | string | Custom tag prefix (replaces preset default) |
| fileOptInTag | string | Custom file opt-in marker |
| categories | array | Custom category definitions (replaces preset categories) |

---

## RegexBuilders API

| Method | Return Type | Description |
| --- | --- | --- |
| hasFileOptIn(content) | boolean | Check if file contains opt-in marker |
| hasDocDirectives(content) | boolean | Check for any documentation directives |
| normalizeTag(tag) | string | Normalize tag for lookup (strip prefix) |
| directivePattern | RegExp | Pattern to match documentation directives |

---

## Programmatic Config Loading

| Field | Type | Description |
| --- | --- | --- |
| instance | DeliveryProcessInstance | The loaded configuration instance |
| isDefault | boolean | True if no config file was found |
| path | string or undefined | Path to config file (if found) |

---

## Common Configuration Patterns

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

| Document | Relationship | Focus |
| --- | --- | --- |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| TAXONOMY-REFERENCE.md | Reference | Tag definitions, categories, status values |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

---

## Concept

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

---

## Presets

| Preset | Categories | Tag Prefix | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | 3 | @libar-docs- | Simple projects (this package) |
| ddd-es-cqrs | 21 | @libar-docs- | DDD/Event Sourcing architectures |
| generic | 3 | @docs- | Simple projects with @docs- prefix |

---

## Hierarchy Levels

---

## Architecture

---

## Tag Generation

---

## Related Documentation - Taxonomy

| Document | Relationship | Focus |
| --- | --- | --- |
| CONFIGURATION-REFERENCE.md | Reference | Preset configuration and factory API |
| ARCHITECTURE-REFERENCE.md | Reference | Pipeline and codec architecture |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation guide |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation |

---

## Quick Tag Reference

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

| Preset | Opt-In Marker | Example |
| --- | --- | --- |
| libar-generic | at-libar-docs | JSDoc comment with at-libar-docs |
| generic | at-docs | JSDoc comment with at-docs |
| ddd-es-cqrs | at-libar-docs | JSDoc comment with at-libar-docs |

---

## Category Tags

---

## Metadata Tags

---

## Format Types

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

| Tag | Correct Location | Wrong Location |
| --- | --- | --- |
| uses | TypeScript | Feature files |
| depends-on | Feature files | TypeScript |

---

## Hierarchy Duration

| Level | Duration | Description |
| --- | --- | --- |
| epic | Multi-quarter | Strategic initiatives |
| phase | 2-5 days | Standard work units |
| task | 1-4 hours | Session-level work |

---

## Two-Tier Spec Architecture

| Tier | Location | Purpose |
| --- | --- | --- |
| Tier 1 | delivery-process/specs/ | Roadmap and planning specifications |
| Tier 2 | package/tests/features/ | Executable test specifications |

---

## CLAUDE.md Generation

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

---

## DD-2 - Git integration is opt-in via --git flag

---

## DD-3 - Session type inferred from FSM status

---

## DD-4 - Severity levels match Process Guard model

---

## DD-5 - Current date only for handoff

---

## DD-6 - Both positional and flag forms for scope type

---

## DD-7 - Co-located formatter functions

---

## Session Decision Tree

| Session | Input | Output | FSM Change |
| --- | --- | --- | --- |
| Planning | Pattern brief | Roadmap spec (.feature) | Creates roadmap |
| Design | Complex requirement | Decision specs + code stubs | None |
| Implementation | Roadmap spec | Code + tests | roadmap to active to completed |
| Planning + Design | Pattern brief | Spec + stubs | Creates roadmap |

---

## Planning Session

| Forbidden Action | Rationale |
| --- | --- |
| Create .ts implementation files | Planning only creates specs |
| Transition to active | Active requires implementation readiness |
| Ask Ready to implement? | Planning session ends at roadmap spec |
| Write full implementations | Stubs only if Planning + Design |

---

## Design Session

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

| Use Planning + Design | Use Planning Only |
| --- | --- |
| Need stubs for implementation | Only enhancing spec |
| Preparing for immediate handoff | Still exploring requirements |
| Want complete two-tier architecture | Do not need Tier 2 yet |

---

## FSM Protection

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

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |
| Emergency hotfix | Combine unlock + ignore | @libar-docs-unlock-reason:'Hotfix' plus --ignore-session |

---

## Handoff Documentation

| Element | Purpose |
| --- | --- |
| Last completed | What finished this session |
| In progress | What is partially done |
| Blockers | What prevents progress |
| Files Modified | Track changes for review |
| Next Session | Clear starting point |

---

## Discovery Tags

| Tag | Purpose | Example |
| --- | --- | --- |
| at-prefix-discovered-gap | Missing edge case or feature | Missing-validation-for-empty-input |
| at-prefix-discovered-improvement | Performance or DX enhancement | Cache-parsed-results |
| at-prefix-discovered-learning | Knowledge gained | Gherkin-requires-strict-indentation |

---

## Common Mistakes

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

| Type | Kind |
| --- | --- |
| PROCESS_STATUS_VALUES | const |
| ProcessStatusValue | type |
| ACCEPTED_STATUS_VALUES | const |
| AcceptedStatusValue | type |
| DEFAULT_STATUS | const |
| VALID_PROCESS_STATUS_SET | const |
| RISK_LEVELS | const |
| RiskLevel | type |
| TagRegistry | interface |
| MetadataTagDefinitionForRegistry | interface |
| TagDefinition | type |
| buildRegistry | function |
| METADATA_TAGS_BY_GROUP | const |
| NORMALIZED_STATUS_VALUES | const |
| NormalizedStatus | type |
| STATUS_NORMALIZATION_MAP | const |
| normalizeStatus | function |
| LAYER_TYPES | const |
| LayerType | type |
| HIERARCHY_LEVELS | const |
| HierarchyLevel | type |
| DEFAULT_HIERARCHY_LEVEL | const |
| FORMAT_TYPES | const |
| FormatType | type |
| DELIVERABLE_STATUS_VALUES | const |
| DeliverableStatus | type |
| VALID_DELIVERABLE_STATUS_SET | const |
| DEFAULT_DELIVERABLE_STATUS | const |
| isDeliverableStatusComplete | function |
| isDeliverableStatusInProgress | function |
| isDeliverableStatusPending | function |
| getDeliverableStatusEmoji | function |
| CategoryDefinition | interface |
| CATEGORIES | const |
| CategoryTag | type |
| CATEGORY_TAGS | const |
| ValidateCLIConfig | interface |
| ValidationIssue | interface |
| ValidationSummary | interface |
| ProcessGuardCLIConfig | interface |
| LintCLIConfig | interface |
| CLIConfig | interface |

---
