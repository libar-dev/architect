# Documentation Index

**Navigate the full documentation set for `@libar-dev/delivery-process`.** Use section links below for targeted reading.

## Package Metadata

| Field            | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| **Package**      | @libar-dev/delivery-process                                        |
| **Version**      | 0.1.0-pre.0                                                        |
| **Purpose**      | Source-first delivery process — code is the single source of truth |
| **Key Features** | Living docs, FSM enforcement, AI-native Data API CLI               |
| **Node.js**      | >= 18.0.0                                                          |
| **License**      | MIT                                                                |

---

## Quick Navigation

| If you want to...              | Read this                                    | Lines  |
| ------------------------------ | -------------------------------------------- | ------ |
| Get started quickly            | [README.md](../README.md)                    | 1-377  |
| Configure presets and tags     | [CONFIGURATION.md](./CONFIGURATION.md)       | 1-357  |
| Understand the "why"           | [METHODOLOGY.md](./METHODOLOGY.md)           | 1-210  |
| Learn the architecture         | [ARCHITECTURE.md](./ARCHITECTURE.md)         | 1-1312 |
| Run AI coding sessions         | [SESSION-GUIDES.md](./SESSION-GUIDES.md)     | 1-338  |
| Write Gherkin specs            | [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | 1-343  |
| Enforce delivery process rules | [PROCESS-GUARD.md](./PROCESS-GUARD.md)       | 1-335  |
| Validate annotation quality    | [VALIDATION.md](./VALIDATION.md)             | 1-199  |
| Query process state via CLI    | [PROCESS-API.md](./PROCESS-API.md)           | 1-225  |
| Look up tag definitions        | [INSTRUCTIONS.md](../INSTRUCTIONS.md)        | 1-344  |
| Understand the taxonomy        | [TAXONOMY.md](./TAXONOMY.md)                 | 1-95   |
| Publish to npm                 | [PUBLISHING.md](./PUBLISHING.md)             | 1-149  |

---

## Reading Order

### For New Users

1. **[README.md](../README.md)** — Installation, quick start, Data API CLI overview
2. **[CONFIGURATION.md](./CONFIGURATION.md)** — Presets, tag prefixes, config files
3. **[METHODOLOGY.md](./METHODOLOGY.md)** — Core thesis, dual-source architecture

### For Developers / AI

4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Four-stage pipeline, codecs, MasterDataset
5. **[PROCESS-API.md](./PROCESS-API.md)** — Data API CLI query interface
6. **[SESSION-GUIDES.md](./SESSION-GUIDES.md)** — Planning/Design/Implementation workflows
7. **[GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md)** — Writing effective Gherkin specs
8. **[INSTRUCTIONS.md](../INSTRUCTIONS.md)** — Complete tag and CLI reference

### For Team Leads / CI

9. **[PROCESS-GUARD.md](./PROCESS-GUARD.md)** — FSM enforcement, pre-commit hooks
10. **[VALIDATION.md](./VALIDATION.md)** — Lint rules, DoD checks, anti-patterns

---

## Detailed Table of Contents

### README.md (Lines 1-377)

| Section                    | Lines   | Key Topics                                    |
| -------------------------- | ------- | --------------------------------------------- |
| The Problem / The Solution | 16-33   | Documentation drift, code as source of truth  |
| Built for AI-Assisted Dev  | 36-57   | Data API CLI typed queries                    |
| How It Works               | 60-111  | Annotation examples, dual-source              |
| Quick Start                | 114-170 | Install, annotate, generate, lint             |
| CLI Commands               | 173-183 | Command summary table                         |
| FSM-Enforced Workflow      | 187-217 | State diagram, protection levels              |
| Data API CLI               | 221-246 | CLI example, context cost comparison          |
| Rich Relationship Model    | 269-291 | Dependency tags, Mermaid graph                |
| How It Compares            | 294-309 | Comparison with Backstage, Confluence, etc.   |
| Use Cases                  | 312-322 | Multi-phase roadmaps, AI sessions, validation |
| Configuration              | 325-346 | Presets table, custom config                  |
| Documentation              | 350-359 | Doc links table                               |

---

### CONFIGURATION.md (Lines 1-357)

| Section                | Lines   | Key Topics                                      |
| ---------------------- | ------- | ----------------------------------------------- |
| Quick Reference        | 10-56   | Preset comparison, defineConfig() examples      |
| Presets                | 84-151  | Generic vs DDD-ES-CQRS preset details           |
| Unified Config File    | 154-244 | defineConfig(), sources, output, gen overrides  |
| Custom Configuration   | 248-295 | Custom tag prefix, custom categories            |
| Programmatic Config    | 299-331 | loadProjectConfig(), mergeSourcesForGenerator() |
| Backward Compatibility | 335-345 | Legacy createDeliveryProcess() support          |

---

### METHODOLOGY.md (Lines 1-210)

| Section                     | Lines   | Key Topics                               |
| --------------------------- | ------- | ---------------------------------------- |
| Core Thesis                 | 9-30    | USDP inversion, event sourcing analogy   |
| Dogfooding                  | 34-64   | Real annotation examples from codebase   |
| Four-Stage Workflow         | 68-84   | Ideation → Design → Planning → Coding    |
| Annotation Ownership        | 87-137  | Split-ownership principle, example split |
| Two-Tier Spec Architecture  | 140-153 | Roadmap tier vs Package tier             |
| Code Stubs                  | 156-177 | Minimal, Interface, Partial levels       |
| Planning Stubs Architecture | 180-198 | tests/planning-stubs/ exclusion pattern  |

---

### ARCHITECTURE.md (Lines 1-1312)

| Section                    | Lines     | Key Topics                                 |
| -------------------------- | --------- | ------------------------------------------ |
| Executive Summary          | 28-66     | What it does, key principles, overview     |
| Configuration Architecture | 69-137    | Entry point, pipeline effects, resolution  |
| Four-Stage Pipeline        | 140-245   | Scanner → Extractor → Transformer → Codec  |
| Unified Transformation     | 248-362   | MasterDataset schema, single-pass          |
| Codec Architecture         | 366-407   | Concepts, block vocabulary, factory        |
| Available Codecs           | 410-607   | All 16 codecs with options tables          |
| Progressive Disclosure     | 610-654   | Split logic, detail levels                 |
| Source Systems             | 656-740   | TypeScript scanner, Gherkin scanner        |
| Key Design Patterns        | 742-820   | Result monad, schema-first, tag registry   |
| Data Flow Diagrams         | 823-980   | Pipeline flow, MasterDataset views, codecs |
| Workflow Integration       | 983-1093  | Planning, implementing, release workflows  |
| Programmatic Usage         | 1096-1149 | Direct codec usage, generateDocument       |
| Extending the System       | 1152-1217 | Custom codec, custom generator             |
| Quick Reference            | 1220-1289 | Codec-to-generator mapping, CLI, filters   |

#### Available Codecs Reference

| Codec                     | Lines   | Output Files                |
| ------------------------- | ------- | --------------------------- |
| PatternsDocumentCodec     | 417-437 | PATTERNS.md, patterns/\*.md |
| RequirementsDocumentCodec | 440-457 | PRODUCT-REQUIREMENTS.md     |
| RoadmapDocumentCodec      | 463-480 | ROADMAP.md, phases/\*.md    |
| CompletedMilestonesCodec  | 483-489 | COMPLETED-MILESTONES.md     |
| CurrentWorkCodec          | 492-498 | CURRENT-WORK.md             |
| ChangelogCodec            | 500-515 | CHANGELOG.md                |
| SessionContextCodec       | 520-528 | SESSION-CONTEXT.md          |
| RemainingWorkCodec        | 530-547 | REMAINING-WORK.md           |
| PlanningChecklistCodec    | 553-556 | PLANNING-CHECKLIST.md       |
| SessionPlanCodec          | 558-561 | SESSION-PLAN.md             |
| SessionFindingsCodec      | 563-576 | SESSION-FINDINGS.md         |
| AdrDocumentCodec          | 582-590 | DECISIONS.md                |
| PrChangesCodec            | 593-596 | working/PR-CHANGES.md       |
| TraceabilityCodec         | 599-602 | TRACEABILITY.md             |
| OverviewCodec             | 605-607 | OVERVIEW.md                 |

---

### SESSION-GUIDES.md (Lines 1-338)

| Section                  | Lines   | Key Topics                               |
| ------------------------ | ------- | ---------------------------------------- |
| Session Decision Tree    | 7-24    | Which session type to use                |
| Planning Session         | 27-83   | Create roadmap spec, checklist, do NOT   |
| Design Session           | 86-132  | When required, checklist, code stubs     |
| Implementation Session   | 135-192 | Pre-flight, execution, FSM transitions   |
| Planning + Design        | 195-274 | Combined workflow, handoff complete when |
| Handoff Documentation    | 277-313 | Template, discovery tags                 |
| FSM Protection Quick Ref | 316-326 | State protection levels table            |

---

### GHERKIN-PATTERNS.md (Lines 1-343)

| Section                     | Lines   | Key Topics                                  |
| --------------------------- | ------- | ------------------------------------------- |
| Essential Patterns          | 9-152   | Roadmap spec, Rule blocks, Scenario Outline |
| — Roadmap Spec Structure    | 11-45   | Tags, Problem/Solution, Background table    |
| — Rule Blocks               | 46-79   | Business constraints, ScenarioOutline       |
| — Scenario Outline          | 81-98   | Examples table for variations               |
| — Executable Test Feature   | 100-150 | Section dividers, behavior verification     |
| DataTable & DocString Usage | 155-202 | Background vs Scenario tables, code blocks  |
| Tag Conventions             | 205-223 | @happy-path, @edge-case, @validation, etc.  |
| Feature File Rich Content   | 226-323 | Code-first, Rule annotations, syntax notes  |
| Quick Reference             | 326-335 | Element-to-use-case mapping table           |

---

### PROCESS-GUARD.md (Lines 1-335)

| Section                          | Lines   | Key Topics                              |
| -------------------------------- | ------- | --------------------------------------- |
| Quick Reference                  | 9-37    | Protection levels, transitions, escapes |
| Error: completed-protection      | 40-65   | Fix with unlock reason                  |
| Error: invalid-status-transition | 68-98   | Follow FSM path, common invalid table   |
| Error: scope-creep               | 101-124 | Remove deliverable or revert status     |
| Warning: session-scope           | 127-146 | Add to scope or --ignore-session        |
| Error: session-excluded          | 149-168 | Remove from exclusion or override       |
| Warning: deliverable-removed     | 171-184 | Informational, document if intentional  |
| CLI Usage                        | 187-235 | Modes, options, exit codes, examples    |
| Pre-commit Setup                 | 238-260 | Husky, package.json scripts             |
| Programmatic API                 | 263-311 | Full code example, API functions table  |
| Architecture                     | 314-326 | Decider pattern diagram                 |

---

### VALIDATION.md (Lines 1-199)

| Section           | Lines   | Key Topics                            |
| ----------------- | ------- | ------------------------------------- |
| Which Command?    | 7-20    | Decision tree for validation commands |
| Command Summary   | 22-30   | lint-patterns, lint-process, validate |
| lint-patterns     | 33-56   | Rules table, CLI reference            |
| lint-process      | 59-81   | What it validates, reference links    |
| validate-patterns | 84-124  | Checks available, anti-pattern, DoD   |
| CI/CD Integration | 127-158 | package.json scripts, GitHub Actions  |
| Exit Codes        | 161-170 | 0 = no errors, 1 = errors             |
| Programmatic API  | 173-188 | Import paths for all validators       |

---

### INSTRUCTIONS.md (Lines 1-344)

| Section                    | Lines   | Key Topics                            |
| -------------------------- | ------- | ------------------------------------- |
| File-Level Opt-In          | 23-43   | Preset markers, basic usage           |
| Category Tags              | 46-81   | All 21 DDD-ES-CQRS categories table   |
| Metadata Tags              | 84-159  | Core, relationship, process, PRD, ADR |
| Aggregation Tags           | 162-171 | overview, decision, intro routing     |
| CLI: generate-docs         | 176-204 | All flags, basic usage                |
| CLI: lint-patterns         | 207-226 | Flags, exit codes                     |
| CLI: lint-process          | 229-250 | Flags, exit codes                     |
| CLI: validate-patterns     | 253-277 | Flags, exit codes                     |
| CLI: generate-tag-taxonomy | 280-292 | Flags for taxonomy generation         |
| Gherkin Integration        | 295-331 | @pattern:\* tags, process metadata    |

---

### TAXONOMY.md (Lines 1-95)

| Section              | Lines | Key Topics                             |
| -------------------- | ----- | -------------------------------------- |
| Concept              | 7-19  | What taxonomy defines                  |
| Architecture         | 22-57 | File structure, TagRegistry, presets   |
| Format Types         | 60-73 | flag, value, enum, csv, number, quoted |
| Generating Reference | 76-84 | generate-tag-taxonomy command          |

---

### PUBLISHING.md (Lines 1-149)

| Section              | Lines   | Key Topics                           |
| -------------------- | ------- | ------------------------------------ |
| Prerequisites        | 5-9     | npm account, login, tests            |
| Version Strategy     | 11-19   | Semantic versioning, pre/latest tags |
| Pre-releases         | 23-45   | First pre-release, subsequent        |
| Stable Releases      | 48-61   | patch, minor, major                  |
| Automated Publishing | 63-78   | GitHub Actions workflow              |
| Pre-commit/Pre-push  | 80-96   | Husky hooks, dist sync verification  |
| Dry Run              | 98-105  | Test before publishing               |
| Verifying Published  | 107-119 | npm view, test install               |
| Troubleshooting      | 121-149 | dist sync, auth errors, not found    |

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

### Data API CLI

```bash
pnpm process:query -- query getCurrentWork       # What's active
pnpm process:query -- query getRoadmapItems      # What can be started
pnpm process:query -- query isValidTransition roadmap active
pnpm process:query -- pattern TransformDataset
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
| INSTRUCTIONS.md     | Reference   | Lookup — tag and CLI reference    |
| TAXONOMY.md         | Reference   | Lookup — tag format definitions   |
| PUBLISHING.md       | Maintainers | Release — npm publishing          |
