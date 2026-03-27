# Documentation Index

**Purpose:** Navigate the full documentation set for @libar-dev/architect. Use section links for targeted reading.

---

## Package Metadata

| Field             | Value                                                  |
| ----------------- | ------------------------------------------------------ |
| **Package**       | @libar-dev/architect                                   |
| **Purpose**       | Context engineering platform for AI-assisted codebases |
| **Patterns**      | 395 tracked (262 completed, 81 active, 52 planned)     |
| **Product Areas** | 7                                                      |
| **License**       | MIT                                                    |

---

## Quick Navigation

| If you want to...              | Read this                                                       |
| ------------------------------ | --------------------------------------------------------------- |
| Learn the architecture         | [ARCHITECTURE.md](ARCHITECTURE.md)                              |
| Browse product area overviews  | [PRODUCT-AREAS.md](PRODUCT-AREAS.md)                            |
| Review architecture decisions  | [DECISIONS.md](DECISIONS.md)                                    |
| Check business rules           | [BUSINESS-RULES.md](BUSINESS-RULES.md)                          |
| Understand the tag taxonomy    | [TAXONOMY.md](TAXONOMY.md)                                      |
| Check validation rules         | [VALIDATION-RULES.md](VALIDATION-RULES.md)                      |
| Browse the changelog           | [CHANGELOG-GENERATED.md](CHANGELOG-GENERATED.md)                |
| Query process state via CLI    | [Process API Reference](reference/PROCESS-API-REFERENCE.md)     |
| Find CLI workflow recipes      | [Process API Recipes](reference/PROCESS-API-RECIPES.md)         |
| Run AI coding sessions         | [Session Workflow Guide](reference/SESSION-WORKFLOW-GUIDE.md)   |
| Enforce delivery process rules | [Process Guard Reference](reference/PROCESS-GUARD-REFERENCE.md) |
| Learn annotation mechanics     | [Annotation Reference](reference/ANNOTATION-REFERENCE.md)       |
| See codec patterns and options | [Architecture Codecs](reference/ARCHITECTURE-CODECS.md)         |
| Understand MasterDataset types | [Architecture Types](reference/ARCHITECTURE-TYPES.md)           |

---

## Reading Order

### Overview

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** -- Architecture diagram from source annotations
2. **[PRODUCT-AREAS.md](PRODUCT-AREAS.md)** -- Product area overviews with live statistics and diagrams
3. **[TAXONOMY.md](TAXONOMY.md)** -- Tag taxonomy configuration and format types

### Deep Dive

1. **[DECISIONS.md](DECISIONS.md)** -- Architecture Decision Records extracted from specs
2. **[BUSINESS-RULES.md](BUSINESS-RULES.md)** -- Domain constraints and invariants from feature files
3. **[VALIDATION-RULES.md](VALIDATION-RULES.md)** -- Process Guard validation rules and FSM reference

### Reference Guides

1. **[Annotation Reference](reference/ANNOTATION-REFERENCE.md)** -- Annotation mechanics and tag reference
2. **[Session Workflow Guide](reference/SESSION-WORKFLOW-GUIDE.md)** -- Planning, Design, Implementation workflows
3. **[Process API Reference](reference/PROCESS-API-REFERENCE.md)** -- CLI command reference with flags and examples
4. **[Process Guard Reference](reference/PROCESS-GUARD-REFERENCE.md)** -- Pre-commit hooks, error codes, programmatic API

---

## Document Roles

| Document                | Audience   | Focus                                            |
| ----------------------- | ---------- | ------------------------------------------------ |
| ARCHITECTURE.md         | Developers | Architecture diagram from source annotations     |
| PRODUCT-AREAS.md        | Everyone   | Product area overviews with live statistics      |
| DECISIONS.md            | Developers | Architecture Decision Records                    |
| BUSINESS-RULES.md       | Developers | Domain constraints and invariants                |
| TAXONOMY.md             | Reference  | Tag taxonomy structure and format types          |
| VALIDATION-RULES.md     | CI/CD      | Process Guard validation rules and FSM reference |
| CHANGELOG-GENERATED.md  | Everyone   | Project changelog from release specs             |
| Annotation Reference    | Developers | Annotation mechanics, shape extraction           |
| Session Workflow Guide  | AI/Devs    | Session decision trees and workflow checklists   |
| Process API Reference   | AI/Devs    | CLI command reference with flags and examples    |
| Process API Recipes     | AI/Devs    | CLI workflow recipes and session guides          |
| Process Guard Reference | Team Leads | Pre-commit hooks, error codes, programmatic API  |
| Architecture Codecs     | Developers | All codecs with factory patterns and options     |
| Architecture Types      | Developers | MasterDataset interface and type shapes          |

---

## Key Concepts

**Delivery Process** -- A code-first documentation and workflow toolkit. Extracts patterns from annotated TypeScript and Gherkin sources, generates markdown documentation, and validates delivery workflow via pre-commit hooks.

**Pattern** -- An annotated unit of work tracked by the delivery process. Each pattern has a status (roadmap, active, completed, deferred), belongs to a product area, and has deliverables. Patterns are the atomic unit of the MasterDataset.

**MasterDataset** -- The single read model (ADR-006) containing all extracted patterns with pre-computed views (byProductArea, byPhase, byStatus, byCategory). All codecs and the Data API consume this dataset.

**Codec** -- A Zod-based transformer that decodes MasterDataset into a RenderableDocument. Each codec produces a specific document type. Codecs are pure functions with no I/O.

**Dual-Source Architecture** -- Feature files own planning metadata (status, phase, dependencies). TypeScript files own implementation metadata (uses, used-by, category). This split prevents ownership conflicts.

**Delivery Workflow FSM** -- A finite state machine enforcing pattern lifecycle: roadmap -> active -> completed. Transitions are validated by Process Guard at commit time.

---

## Document Inventory

### Overview

| Document                            | Description                                              | Audience   |
| ----------------------------------- | -------------------------------------------------------- | ---------- |
| [Architecture](ARCHITECTURE.md)     | Architecture diagram from source annotations             | Developers |
| [Product Areas](PRODUCT-AREAS.md)   | Product area overviews with live statistics and diagrams | Everyone   |
| [Taxonomy](TAXONOMY.md)             | Tag taxonomy configuration and format types              | Reference  |
| [Changelog](CHANGELOG-GENERATED.md) | Project changelog from release specs                     | Everyone   |

### Governance

| Document                                | Description                                          | Audience   |
| --------------------------------------- | ---------------------------------------------------- | ---------- |
| [Decisions](DECISIONS.md)               | Architecture Decision Records extracted from specs   | Developers |
| [Business Rules](BUSINESS-RULES.md)     | Domain constraints and invariants from feature files | Developers |
| [Validation Rules](VALIDATION-RULES.md) | Process Guard validation rules and FSM reference     | CI/CD      |

### Reference Guides

| Document                                                        | Description                                                          | Audience   |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- |
| [Annotation Reference](reference/ANNOTATION-REFERENCE.md)       | Annotation mechanics, shape extraction, tag reference                | Developers |
| [Session Workflow Guide](reference/SESSION-WORKFLOW-GUIDE.md)   | Planning, Design, Implementation session workflows                   | AI/Devs    |
| [Process API Reference](reference/PROCESS-API-REFERENCE.md)     | CLI command reference with flags and examples                        | AI/Devs    |
| [Process API Recipes](reference/PROCESS-API-RECIPES.md)         | CLI workflow recipes and session guides                              | AI/Devs    |
| [Process Guard Reference](reference/PROCESS-GUARD-REFERENCE.md) | Pre-commit hooks, error codes, programmatic API                      | Team Leads |
| [Architecture Codecs](reference/ARCHITECTURE-CODECS.md)         | All codecs with factory patterns and options                         | Developers |
| [Architecture Types](reference/ARCHITECTURE-TYPES.md)           | MasterDataset interface and type shapes                              | Developers |
| [Configuration Guide](reference/CONFIGURATION-GUIDE.md)         | Presets, config files, sources, output, and monorepo setup           | Users      |
| [Validation Tools Guide](reference/VALIDATION-TOOLS-GUIDE.md)   | lint-patterns, lint-steps, lint-process, validate-patterns reference | CI/CD      |
| [Gherkin Authoring Guide](reference/GHERKIN-AUTHORING-GUIDE.md) | Roadmap specs, Rule blocks, DataTables, tag conventions              | Developers |

### Product Area Details

| Document                                        | Description                                        | Audience   |
| ----------------------------------------------- | -------------------------------------------------- | ---------- |
| [Annotation](product-areas/ANNOTATION.md)       | Annotation product area patterns and statistics    | Developers |
| [Configuration](product-areas/CONFIGURATION.md) | Configuration product area patterns and statistics | Users      |
| [Core Types](product-areas/CORE-TYPES.md)       | Core types product area patterns and statistics    | Developers |
| [Data API](product-areas/DATA-API.md)           | Data API product area patterns and statistics      | AI/Devs    |
| [Generation](product-areas/GENERATION.md)       | Generation product area patterns and statistics    | Developers |
| [Process](product-areas/PROCESS.md)             | Process product area patterns and statistics       | Team Leads |
| [Validation](product-areas/VALIDATION.md)       | Validation product area patterns and statistics    | CI/CD      |

---

## Product Area Statistics

| Area          | Patterns | Completed | Active | Planned | Progress                   |
| ------------- | -------- | --------- | ------ | ------- | -------------------------- |
| Annotation    | 27       | 24        | 2      | 1       | [███████░] 24/27 89%       |
| Configuration | 11       | 8         | 0      | 3       | [██████░░] 8/11 73%        |
| CoreTypes     | 11       | 7         | 4      | 0       | [█████░░░] 7/11 64%        |
| DataAPI       | 40       | 23        | 15     | 2       | [█████░░░] 23/40 57%       |
| Generation    | 95       | 81        | 6      | 8       | [███████░] 81/95 85%       |
| Process       | 11       | 4         | 0      | 7       | [███░░░░░] 4/11 36%        |
| Validation    | 25       | 16        | 3      | 6       | [█████░░░] 16/25 64%       |
| **Total**     | **220**  | **163**   | **30** | **27**  | **[██████░░] 163/220 74%** |

---

## Phase Progress

**395** patterns total: **262** completed (66%), **81** active, **52** planned. [█████████████░░░░░░░] 262/395

| Status    | Count | Percentage |
| --------- | ----- | ---------- |
| Completed | 262   | 66%        |
| Active    | 81    | 21%        |
| Planned   | 52    | 13%        |

### By Phase

| Phase     | Patterns | Completed | Progress |
| --------- | -------- | --------- | -------- |
| Phase 18  | 1        | 0         | 0%       |
| Phase 23  | 2        | 2         | 100%     |
| Phase 24  | 2        | 2         | 100%     |
| Phase 25  | 10       | 8         | 80%      |
| Phase 26  | 2        | 2         | 100%     |
| Phase 27  | 3        | 3         | 100%     |
| Phase 28  | 2        | 2         | 100%     |
| Phase 30  | 1        | 1         | 100%     |
| Phase 31  | 1        | 1         | 100%     |
| Phase 32  | 1        | 1         | 100%     |
| Phase 35  | 5        | 5         | 100%     |
| Phase 36  | 1        | 1         | 100%     |
| Phase 37  | 1        | 1         | 100%     |
| Phase 38  | 1        | 1         | 100%     |
| Phase 39  | 1        | 1         | 100%     |
| Phase 40  | 1        | 1         | 100%     |
| Phase 41  | 1        | 1         | 100%     |
| Phase 42  | 1        | 1         | 100%     |
| Phase 43  | 1        | 1         | 100%     |
| Phase 44  | 2        | 2         | 100%     |
| Phase 45  | 1        | 0         | 0%       |
| Phase 46  | 2        | 0         | 0%       |
| Phase 50  | 1        | 1         | 100%     |
| Phase 51  | 1        | 1         | 100%     |
| Phase 99  | 9        | 5         | 56%      |
| Phase 100 | 16       | 4         | 25%      |
| Phase 101 | 2        | 1         | 50%      |
| Phase 102 | 1        | 0         | 0%       |
| Phase 103 | 1        | 0         | 0%       |
| Phase 104 | 1        | 0         | 0%       |

---

## Regeneration

Regenerate all documentation from annotated sources:

```bash
pnpm docs:all          # Regenerate all generated docs
pnpm docs:all-preview  # Also generate ephemeral workflow docs
```

Individual generators:

```bash
pnpm docs:product-areas         # Product area docs
pnpm docs:decisions             # Architecture decisions
pnpm docs:reference             # Reference documents
pnpm docs:business-rules        # Business rules
pnpm docs:taxonomy              # Taxonomy reference
pnpm docs:validation            # Validation rules
pnpm docs:claude-modules        # Claude context modules
pnpm docs:process-api-reference # Process API CLI reference
pnpm docs:cli-recipe            # CLI recipes & workflow guide
```
