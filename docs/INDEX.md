# Documentation Index

> **Deprecated:** This document is superseded by the auto-generated [Documentation Index](../docs-live/INDEX.md) which includes live statistics, audience-based navigation, and document roles. This file is preserved for reference only.

**Navigate the full documentation set for `@libar-dev/architect`.** Use section links below for targeted reading.

## Package Metadata

| Field            | Value                                                |
| ---------------- | ---------------------------------------------------- |
| **Package**      | @libar-dev/architect                                 |
| **Version**      | 1.0.0-pre.0                                          |
| **Purpose**      | Context engineering for AI-assisted codebases        |
| **Key Features** | Living docs, FSM enforcement, AI-native Data API CLI |
| **Node.js**      | >= 18.0.0                                            |
| **License**      | MIT                                                  |

---

## Quick Navigation

| If you want to...           | Read this                                    | Lines  |
| --------------------------- | -------------------------------------------- | ------ |
| Get started quickly         | [README.md](../README.md)                    | 1-504  |
| Configure presets and tags  | [CONFIGURATION.md](./CONFIGURATION.md)       | 1-357  |
| Understand the "why"        | [METHODOLOGY.md](./METHODOLOGY.md)           | 1-238  |
| Learn the architecture      | [ARCHITECTURE.md](./ARCHITECTURE.md)         | 1-1638 |
| Run AI coding sessions      | [SESSION-GUIDES.md](./SESSION-GUIDES.md)     | 1-389  |
| Write Gherkin specs         | [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | 1-515  |
| Enforce process rules       | [PROCESS-GUARD.md](./PROCESS-GUARD.md)       | 1-341  |
| Validate annotation quality | [VALIDATION.md](./VALIDATION.md)             | 1-281  |
| Query process state via CLI | [PROCESS-API.md](./PROCESS-API.md)           | 1-507  |
| Understand the taxonomy     | [TAXONOMY.md](./TAXONOMY.md)                 | 1-105  |
| Publish to npm              | [MAINTAINERS.md](../MAINTAINERS.md)          | —      |
| Learn annotation patterns   | [ANNOTATION-GUIDE.md](./ANNOTATION-GUIDE.md) | 1-268  |
| Review the changelog        | [CHANGELOG.md](../CHANGELOG.md)              | 1-26   |
| Security policy             | [SECURITY.md](../SECURITY.md)                | 1-21   |

---

## Reading Order

### For New Users

1. **[README.md](../README.md)** — Installation, quick start, Data API CLI overview
2. **[CONFIGURATION.md](./CONFIGURATION.md)** — Presets, tag prefixes, config files
3. **[METHODOLOGY.md](./METHODOLOGY.md)** — Core thesis, dual-source architecture

### For Developers / AI

4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Four-stage pipeline, codecs, PatternGraph
5. **[PROCESS-API.md](./PROCESS-API.md)** — Data API CLI query interface
6. **[SESSION-GUIDES.md](./SESSION-GUIDES.md)** — Planning/Design/Implementation workflows
7. **[GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md)** — Writing effective Gherkin specs
8. **[ANNOTATION-GUIDE.md](./ANNOTATION-GUIDE.md)** — Annotation mechanics, shape extraction, tag quick reference

### For Team Leads / CI

9. **[PROCESS-GUARD.md](./PROCESS-GUARD.md)** — FSM enforcement, pre-commit hooks
10. **[VALIDATION.md](./VALIDATION.md)** — Lint rules, DoD checks, anti-patterns

---

## Detailed Table of Contents

### README.md (Lines 1-504)

| Section                   | Lines   | Key Topics                                    |
| ------------------------- | ------- | --------------------------------------------- |
| Why This Exists           | 17-31   | AI context failure, code as source of truth   |
| Built for AI-Assisted Dev | 33-50   | Data API CLI typed queries                    |
| Quick Start               | 52-109  | Install, annotate, generate, lint             |
| How It Works              | 111-165 | Annotation examples, pipeline one-liner       |
| What Gets Generated       | 167-184 | Content block types, config-driven generation |
| CLI Commands              | 186-254 | architect-generate, architect:query           |
| Proven at Scale           | 256-303 | Discovery, real results, 3-session MVP        |
| FSM-Enforced Workflow     | 305-337 | State diagram, protection levels              |
| Data API CLI              | 339-365 | CLI example, context cost comparison          |
| Rich Relationship Model   | 367-390 | Dependency tags, Mermaid graph                |
| How It Compares           | 392-414 | Comparison with Backstage, Mintlify, etc.     |
| Design-First Development  | 416-420 | Stub pattern summary + link                   |
| Document Durability Model | 422-426 | Durability hierarchy summary + link           |
| Use Cases                 | 428-439 | Multi-phase roadmaps, AI sessions, validation |
| Configuration             | 441-475 | Presets table, custom config                  |
| Documentation             | 477-500 | Doc links table                               |
| License                   | 502-504 | MIT license                                   |

---

### CONFIGURATION.md (Lines 1-357)

| Section               | Lines   | Key Topics                                      |
| --------------------- | ------- | ----------------------------------------------- |
| Quick Reference       | 10-56   | Preset comparison, defineConfig() examples      |
| Presets               | 84-151  | Generic vs DDD-ES-CQRS preset details           |
| Unified Config File   | 154-244 | defineConfig(), sources, output, gen overrides  |
| Custom Configuration  | 248-295 | Custom tag prefix, custom categories            |
| Programmatic Config   | 299-331 | loadProjectConfig(), mergeSourcesForGenerator() |
| Related Documentation | 350-357 | Links to README, TAXONOMY, ARCHITECTURE         |

---

### METHODOLOGY.md (Lines 1-238)

| Section                    | Lines   | Key Topics                               |
| -------------------------- | ------- | ---------------------------------------- |
| Core Thesis                | 9-30    | USDP inversion, event sourcing analogy   |
| Dogfooding                 | 34-68   | Real annotation examples from codebase   |
| Session Workflow           | 72-87   | Planning → Design → Implementation       |
| Annotation Ownership       | 91-140  | Split-ownership principle, example split |
| Two-Tier Spec Architecture | 144-156 | Roadmap tier vs Package tier             |
| Code Stubs                 | 160-180 | Minimal, Interface, Partial levels       |
| Stubs Architecture         | 184-226 | Design stubs + planning stubs locations  |
| Related Documentation      | 230-238 | Links to PROCESS-GUARD, CONFIG, GHERKIN  |

---

### ARCHITECTURE.md (Lines 1-1638)

| Section                    | Lines     | Key Topics                                                       |
| -------------------------- | --------- | ---------------------------------------------------------------- |
| Executive Summary          | 28-69     | What it does, key principles (incl. Single Read Model), overview |
| Configuration Architecture | 70-139    | Entry point, pipeline effects, resolution                        |
| Four-Stage Pipeline        | 140-343   | Scanner → Extractor → Pipeline Factory → Transformer → Codec     |
| Unified Transformation     | 345-478   | PatternGraph schema (relationshipIndex + archIndex), single-pass |
| Codec Architecture         | 481-527   | Concepts, block vocabulary, factory, 3 renderers                 |
| Available Codecs           | 529-870   | All 20 codecs with options tables                                |
| Progressive Disclosure     | 871-917   | Split logic, detail levels                                       |
| Source Systems             | 919-1024  | TypeScript scanner, Gherkin scanner                              |
| Key Design Patterns        | 1026-1105 | Result monad, schema-first, tag registry                         |
| Data Flow Diagrams         | 1107-1290 | Pipeline flow, factory entry point, PatternGraph views, codecs   |
| Workflow Integration       | 1292-1401 | Planning, implementing, release workflows                        |
| Programmatic Usage         | 1403-1458 | Direct codec usage, generateDocument                             |
| Extending the System       | 1460-1527 | Custom codec, custom generator                                   |
| Quick Reference            | 1529-1604 | Codec-to-generator mapping, CLI, filters                         |

#### Available Codecs Reference

| Codec                     | Lines   | Output Files                          |
| ------------------------- | ------- | ------------------------------------- |
| PatternsDocumentCodec     | 536-556 | PATTERNS.md, patterns/\*.md           |
| RequirementsDocumentCodec | 557-578 | PRODUCT-REQUIREMENTS.md               |
| RoadmapDocumentCodec      | 581-598 | ROADMAP.md, phases/\*.md              |
| CompletedMilestonesCodec  | 600-607 | COMPLETED-MILESTONES.md               |
| CurrentWorkCodec          | 609-616 | CURRENT-WORK.md                       |
| ChangelogCodec            | 618-634 | CHANGELOG.md                          |
| SessionContextCodec       | 638-645 | SESSION-CONTEXT.md                    |
| RemainingWorkCodec        | 647-667 | REMAINING-WORK.md                     |
| PlanningChecklistCodec    | 671-675 | PLANNING-CHECKLIST.md                 |
| SessionPlanCodec          | 677-681 | SESSION-PLAN.md                       |
| SessionFindingsCodec      | 683-696 | SESSION-FINDINGS.md                   |
| AdrDocumentCodec          | 700-707 | DECISIONS.md                          |
| PrChangesCodec            | 709-713 | working/PR-CHANGES.md                 |
| TraceabilityCodec         | 715-719 | TRACEABILITY.md                       |
| OverviewCodec             | 721-725 | OVERVIEW.md                           |
| BusinessRulesCodec        | 727-749 | BUSINESS-RULES.md                     |
| ArchitectureDocumentCodec | 751-766 | ARCHITECTURE.md (generated)           |
| TaxonomyDocumentCodec     | 768-784 | TAXONOMY.md, taxonomy/\*.md           |
| ValidationRulesCodec      | 786-804 | VALIDATION-RULES.md, validation/\*.md |
| ReferenceCodec            | 808-850 | Configured per-instance               |

---

### SESSION-GUIDES.md (Lines 1-389)

| Section                  | Lines   | Key Topics                                 |
| ------------------------ | ------- | ------------------------------------------ |
| Session Decision Tree    | 7-25    | Which session type to use                  |
| Planning Session         | 27-91   | Context gathering, checklist, do NOT       |
| Design Session           | 93-161  | Context gathering, when required, stubs    |
| Implementation Session   | 163-235 | scope-validate, execution, FSM transitions |
| Planning + Design        | 237-317 | Combined workflow, handoff complete when   |
| Handoff Documentation    | 319-365 | CLI handoff, template, discovery tags      |
| FSM Protection Quick Ref | 367-376 | State protection levels table              |
| Related Documentation    | 380-389 | Links to Methodology, Gherkin, Config, etc |

---

### GHERKIN-PATTERNS.md (Lines 1-515)

| Section                     | Lines   | Key Topics                                              |
| --------------------------- | ------- | ------------------------------------------------------- |
| Essential Patterns          | 9-152   | Roadmap spec, Rule blocks, Scenario Outline             |
| — Roadmap Spec Structure    | 11-45   | Tags, Problem/Solution, Background table                |
| — Rule Blocks               | 47-79   | Business constraints, ScenarioOutline                   |
| — Scenario Outline          | 82-98   | Examples table for variations                           |
| — Executable Test Feature   | 101-150 | Section dividers, behavior verification                 |
| DataTable & DocString Usage | 155-202 | Background vs Scenario tables, code blocks              |
| Tag Conventions             | 205-243 | Semantic tags, convention tags, combining               |
| Feature File Rich Content   | 246-344 | Code-first, Rule annotations, syntax notes              |
| Step Linting                | 346-493 | lint-steps rules, CLI, feature/step/cross-file checks   |
| Quick Reference             | 495-506 | Element-to-use-case mapping table                       |
| Related Documentation       | 508-515 | Links to ANNOTATION-GUIDE, TAXONOMY, CONFIG, VALIDATION |

---

### PROCESS-API.md (Lines 1-507)

| Section                   | Lines   | Key Topics                                                  |
| ------------------------- | ------- | ----------------------------------------------------------- |
| Why Use This              | 12-28   | Context cost comparison, AI agent tiers, two output modes   |
| Quick Start               | 30-63   | Session recipe (overview → scope-validate → context)        |
| Session Types             | 65-77   | planning/design/implement decision tree                     |
| Session Workflow Commands | 79-204  | overview, scope-validate, context, dep-tree, files, handoff |
| Pattern Discovery         | 206-302 | status, list, search, pattern, stubs, decisions, pdr, rules |
| Architecture Queries      | 304-333 | 11 arch subcommands table, examples                         |
| Metadata & Inventory      | 335-375 | tags, sources, unannotated, query escape hatch              |
| Output Reference          | 377-465 | Options, modifiers, filters, JSON envelope, exit codes      |
| Common Recipes            | 467-507 | Starting, finding work, investigating, design, ending       |

---

### PROCESS-GUARD.md (Lines 1-341)

| Section                          | Lines   | Key Topics                                      |
| -------------------------------- | ------- | ----------------------------------------------- |
| Quick Reference                  | 9-37    | Protection levels, transitions, escapes         |
| Error: completed-protection      | 40-72   | Fix with unlock reason, validation requirements |
| Error: invalid-status-transition | 74-105  | Follow FSM path, common invalid table           |
| Error: scope-creep               | 107-131 | Remove deliverable or revert status             |
| Warning: session-scope           | 133-153 | Add to scope or --ignore-session                |
| Error: session-excluded          | 155-175 | Remove from exclusion or override               |
| Warning: deliverable-removed     | 177-191 | Informational, document if intentional          |
| CLI Usage                        | 193-243 | Modes, options (incl. --base-dir), exit codes   |
| Pre-commit Setup                 | 246-269 | Husky, package.json scripts                     |
| Programmatic API                 | 271-318 | Full code example, API functions table          |
| Architecture                     | 321-333 | Decider pattern diagram                         |
| Related Documentation            | 335-341 | Links to METHODOLOGY, TAXONOMY, VALIDATION      |

---

### VALIDATION.md (Lines 1-281)

| Section               | Lines   | Key Topics                                           |
| --------------------- | ------- | ---------------------------------------------------- |
| Which Command?        | 7-24    | Decision tree for validation commands                |
| Command Summary       | 26-35   | lint-patterns, lint-steps, architect-guard, validate |
| lint-patterns         | 37-74   | 8 rules table, CLI flags                             |
| lint-steps            | 76-98   | 12 rules, 3 categories, vitest-cucumber traps        |
| architect-guard       | 100-121 | What it validates, reference links                   |
| validate-patterns     | 123-197 | CLI flags, checks, anti-patterns, DoD                |
| CI/CD Integration     | 199-238 | Consumer scripts, hooks, GitHub Actions              |
| Exit Codes            | 240-248 | Per-command exit code table                          |
| Programmatic API      | 250-272 | Import paths for all validators                      |
| Related Documentation | 274-281 | Links to GHERKIN-PATTERNS, PROCESS-GUARD, CONFIG     |

---

### TAXONOMY.md (Lines 1-105)

| Section               | Lines   | Key Topics                                   |
| --------------------- | ------- | -------------------------------------------- |
| Concept               | 7-18    | What taxonomy defines, FSM states            |
| Architecture          | 22-65   | File structure, TagRegistry, presets         |
| Format Types          | 69-80   | flag, value, enum, csv, number, quoted-value |
| Generating Reference  | 84-96   | docs:taxonomy, architect-generate            |
| Related Documentation | 100-105 | Links to CONFIGURATION, METHODOLOGY          |

---

### MAINTAINERS.md (repo root)

Publishing and maintainer workflows have moved to [MAINTAINERS.md](../MAINTAINERS.md) at the repository root.

---

### ANNOTATION-GUIDE.md (Lines 1-268)

| Section                          | Lines   | Key Topics                                             |
| -------------------------------- | ------- | ------------------------------------------------------ |
| Getting Started                  | 9-67    | Opt-in marker, TS/Gherkin examples, presets, ownership |
| Shape Extraction                 | 69-125  | 3 modes: explicit, wildcard, declaration-level         |
| Annotation Patterns by File Type | 127-191 | Zod, interface, function, Gherkin examples             |
| Tag Groups Quick Reference       | 193-223 | 12 groups with representative tags and format types    |
| Verification                     | 225-257 | CLI commands, common issues table                      |
| Related Documentation            | 259-268 | Links to TAXONOMY, CONFIGURATION, ARCHITECTURE         |

---

## Key Concepts Quick Reference

### Dual-Source Architecture

| Source            | Owns                                     | Tags                                     |
| ----------------- | ---------------------------------------- | ---------------------------------------- |
| **Feature files** | Planning: status, phase, quarter, effort | `@*-status`, `@*-phase`, `@*-depends-on` |
| **TypeScript**    | Implementation: uses, used-by, category  | `@*-uses`, `@*-used-by`, `@*-core`       |

### Delivery Workflow FSM

```
roadmap ──→ active ──→ completed
    │          │
    │          ↓
    │       roadmap (blocked)
    ↓
deferred ──→ roadmap
```

### Data API CLI — Primary Context Source

The CLI is the **recommended way** to gather context in any session type.
It queries annotated sources in real time — not generated snapshots.
See [PROCESS-API.md](./PROCESS-API.md).

```bash
pnpm architect:query -- scope-validate MyPattern implement      # ALWAYS run first
pnpm architect:query -- context MyPattern --session implement    # Curated context bundle
pnpm architect:query -- files MyPattern --related                # Implementation paths
pnpm architect:query -- handoff --pattern MyPattern              # Capture session end state
```

---

## Document Roles Summary

| Document            | Audience    | Focus                             |
| ------------------- | ----------- | --------------------------------- |
| README.md           | Everyone    | Quick start, value proposition    |
| METHODOLOGY.md      | Everyone    | Why — core thesis, principles     |
| CONFIGURATION.md    | Users       | Setup — presets, tags, config     |
| ARCHITECTURE.md     | Developers  | How — pipeline, codecs, schemas   |
| PROCESS-API.md      | AI/Devs     | Data API CLI query interface      |
| SESSION-GUIDES.md   | AI/Devs     | Workflow — day-to-day usage       |
| GHERKIN-PATTERNS.md | Writers     | Specs — writing effective Gherkin |
| PROCESS-GUARD.md    | Team Leads  | Governance — enforcement rules    |
| VALIDATION.md       | CI/CD       | Quality — automated checks        |
| TAXONOMY.md         | Reference   | Lookup — tag taxonomy and API     |
| ANNOTATION-GUIDE.md | Developers  | Reference — annotation mechanics  |
| MAINTAINERS.md      | Maintainers | Release — npm publishing          |
| CHANGELOG.md        | Everyone    | Version history and changes       |
| SECURITY.md         | Everyone    | Security policy and reporting     |

---

## Auto-Generated Documentation

The `docs-live/` directory contains documentation **generated from annotated sources** using the codec pipeline. These files should not be edited manually — regenerate with `pnpm docs:all` or `pnpm docs:product-areas`.

| Directory                  | Contents                                             | Generated By         |
| -------------------------- | ---------------------------------------------------- | -------------------- |
| `docs-live/product-areas/` | 7 product area docs with diagrams and shapes         | `docs:product-areas` |
| `docs-live/decisions/`     | Architecture Decision Records (ADR-001–006, ADR-021) | `docs:all`           |
| `docs-live/_claude-md/`    | Compact AI context modules per product area          | `docs:product-areas` |
| `docs-live/`               | DECISIONS.md, PRODUCT-AREAS.md (indexes)             | `docs:all`           |
