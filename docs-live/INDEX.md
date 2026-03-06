# Documentation Index

**Purpose:** Navigate the full documentation set for @libar-dev/delivery-process. Use section links for targeted reading.

---

## Package Metadata

| Field             | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| **Package**       | @libar-dev/delivery-process                           |
| **Purpose**       | Code-first documentation and delivery process toolkit |
| **Patterns**      | 355 tracked (246 completed, 47 active, 62 planned)    |
| **Product Areas** | 7                                                     |
| **License**       | MIT                                                   |

---

## Quick Navigation

| If you want to...              | Read this                                        |
| ------------------------------ | ------------------------------------------------ |
| Get started quickly            | [README.md](../README.md)                        |
| Configure presets and tags     | [CONFIGURATION.md](docs/CONFIGURATION.md)        |
| Understand the "why"           | [METHODOLOGY.md](docs/METHODOLOGY.md)            |
| Learn the architecture         | [ARCHITECTURE.md](docs/ARCHITECTURE.md)          |
| Run AI coding sessions         | [SESSION-GUIDES.md](docs/SESSION-GUIDES.md)      |
| Write Gherkin specs            | [GHERKIN-PATTERNS.md](docs/GHERKIN-PATTERNS.md)  |
| Enforce delivery process rules | [PROCESS-GUARD.md](docs/PROCESS-GUARD.md)        |
| Validate annotation quality    | [VALIDATION.md](docs/VALIDATION.md)              |
| Query process state via CLI    | [PROCESS-API.md](docs/PROCESS-API.md)            |
| Browse product area overviews  | [PRODUCT-AREAS.md](docs-live/PRODUCT-AREAS.md)   |
| Review architecture decisions  | [DECISIONS.md](docs-live/DECISIONS.md)           |
| Check business rules           | [BUSINESS-RULES.md](docs-live/BUSINESS-RULES.md) |

---

## Reading Order

### For New Users

1. **[README.md](../README.md)** -- Installation, quick start, Data API CLI overview
2. **[CONFIGURATION.md](docs/CONFIGURATION.md)** -- Presets, tag prefixes, config files
3. **[METHODOLOGY.md](docs/METHODOLOGY.md)** -- Core thesis, dual-source architecture

### For Developers / AI

1. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** -- Four-stage pipeline, codecs, MasterDataset
2. **[PROCESS-API.md](docs/PROCESS-API.md)** -- Data API CLI query interface
3. **[SESSION-GUIDES.md](docs/SESSION-GUIDES.md)** -- Planning/Design/Implementation workflows
4. **[GHERKIN-PATTERNS.md](docs/GHERKIN-PATTERNS.md)** -- Writing effective Gherkin specs
5. **[ANNOTATION-GUIDE.md](docs/ANNOTATION-GUIDE.md)** -- Annotation mechanics, shape extraction

### For Team Leads / CI

1. **[PROCESS-GUARD.md](docs/PROCESS-GUARD.md)** -- FSM enforcement, pre-commit hooks
2. **[VALIDATION.md](docs/VALIDATION.md)** -- Lint rules, DoD checks, anti-patterns

---

## Document Roles

| Document            | Audience   | Focus                                      |
| ------------------- | ---------- | ------------------------------------------ |
| README.md           | Everyone   | Quick start, value proposition             |
| METHODOLOGY.md      | Everyone   | Why -- core thesis, principles             |
| CONFIGURATION.md    | Users      | Setup -- presets, tags, config             |
| ARCHITECTURE.md     | Developers | How -- pipeline, codecs, schemas           |
| PROCESS-API.md      | AI/Devs    | Data API CLI query interface               |
| SESSION-GUIDES.md   | AI/Devs    | Workflow -- day-to-day usage               |
| GHERKIN-PATTERNS.md | Writers    | Specs -- writing effective Gherkin         |
| PROCESS-GUARD.md    | Team Leads | Governance -- enforcement rules            |
| VALIDATION.md       | CI/CD      | Quality -- automated checks                |
| TAXONOMY.md         | Reference  | Lookup -- tag taxonomy and API             |
| ANNOTATION-GUIDE.md | Developers | Reference -- annotation mechanics          |
| PRODUCT-AREAS.md    | Everyone   | Generated -- product area overviews        |
| DECISIONS.md        | Developers | Generated -- architecture decisions        |
| BUSINESS-RULES.md   | Developers | Generated -- business rules and invariants |

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

### Getting Started

| Document                               | Description                                      | Audience |
| -------------------------------------- | ------------------------------------------------ | -------- |
| [README](README.md)                    | Installation, quick start, value proposition     | Everyone |
| [Configuration](docs/CONFIGURATION.md) | Presets, tag prefixes, config files              | Users    |
| [Methodology](docs/METHODOLOGY.md)     | Core thesis, dual-source architecture principles | Everyone |

### Architecture

| Document                                         | Description                                              | Audience   |
| ------------------------------------------------ | -------------------------------------------------------- | ---------- |
| [Architecture](docs/ARCHITECTURE.md)             | Four-stage pipeline, codecs, MasterDataset, schemas      | Developers |
| [Product Areas](docs-live/PRODUCT-AREAS.md)      | Product area overviews with live statistics and diagrams | Everyone   |
| [Architecture Decisions](docs-live/DECISIONS.md) | ADRs extracted from decision specs                       | Developers |

### Development Workflow

| Document                                 | Description                                        | Audience |
| ---------------------------------------- | -------------------------------------------------- | -------- |
| [Session Guides](docs/SESSION-GUIDES.md) | Planning, Design, Implementation session workflows | AI/Devs  |
| [Process API](docs/PROCESS-API.md)       | Data API CLI query interface for session context   | AI/Devs  |

### Authoring

| Document                                     | Description                                              | Audience   |
| -------------------------------------------- | -------------------------------------------------------- | ---------- |
| [Gherkin Patterns](docs/GHERKIN-PATTERNS.md) | Writing effective Gherkin specs, Rule blocks, DataTables | Writers    |
| [Annotation Guide](docs/ANNOTATION-GUIDE.md) | Annotation mechanics, shape extraction, tag reference    | Developers |
| [Taxonomy](docs/TAXONOMY.md)                 | Tag taxonomy structure and format types                  | Reference  |

### Governance

| Document                                      | Description                                        | Audience   |
| --------------------------------------------- | -------------------------------------------------- | ---------- |
| [Process Guard](docs/PROCESS-GUARD.md)        | FSM enforcement, pre-commit hooks, error codes     | Team Leads |
| [Validation](docs/VALIDATION.md)              | Lint rules, DoD checks, anti-pattern detection     | CI/CD      |
| [Business Rules](docs-live/BUSINESS-RULES.md) | Business rules and invariants extracted from specs | Developers |

### Reference

| Document                                                              | Description                                   | Audience   |
| --------------------------------------------------------------------- | --------------------------------------------- | ---------- |
| [Architecture Codecs](docs-live/reference/ARCHITECTURE-CODECS.md)     | All codecs with factory patterns and options  | Developers |
| [Architecture Types](docs-live/reference/ARCHITECTURE-TYPES.md)       | MasterDataset interface and type shapes       | Developers |
| [Process API Reference](docs-live/reference/PROCESS-API-REFERENCE.md) | CLI command reference with flags and examples | AI/Devs    |
| [Process API Recipes](docs-live/reference/PROCESS-API-RECIPES.md)     | CLI workflow recipes and session guides       | AI/Devs    |

---

## Product Area Statistics

| Area          | Patterns | Completed | Active | Planned | Progress                   |
| ------------- | -------- | --------- | ------ | ------- | -------------------------- |
| Annotation    | 26       | 23        | 2      | 1       | [███████░] 23/26 88%       |
| Configuration | 9        | 8         | 0      | 1       | [███████░] 8/9 89%         |
| CoreTypes     | 7        | 6         | 0      | 1       | [███████░] 6/7 86%         |
| DataAPI       | 35       | 22        | 9      | 4       | [█████░░░] 22/35 63%       |
| Generation    | 91       | 77        | 2      | 12      | [███████░] 77/91 85%       |
| Process       | 11       | 4         | 0      | 7       | [███░░░░░] 4/11 36%        |
| Validation    | 22       | 15        | 0      | 7       | [█████░░░] 15/22 68%       |
| **Total**     | **201**  | **155**   | **13** | **33**  | **[██████░░] 155/201 77%** |

---

## Phase Progress

**355** patterns total: **246** completed (69%), **47** active, **62** planned. [██████████████░░░░░░] 246/355

| Status    | Count | Percentage |
| --------- | ----- | ---------- |
| Completed | 246   | 69%        |
| Active    | 47    | 13%        |
| Planned   | 62    | 17%        |

### By Phase

| Phase     | Patterns | Completed | Progress |
| --------- | -------- | --------- | -------- |
| Phase 18  | 1        | 0         | 0%       |
| Phase 23  | 2        | 0         | 0%       |
| Phase 24  | 2        | 2         | 100%     |
| Phase 25  | 10       | 6         | 60%      |
| Phase 26  | 2        | 2         | 100%     |
| Phase 27  | 3        | 3         | 100%     |
| Phase 28  | 2        | 2         | 100%     |
| Phase 30  | 1        | 1         | 100%     |
| Phase 31  | 1        | 1         | 100%     |
| Phase 32  | 1        | 1         | 100%     |
| Phase 35  | 5        | 4         | 80%      |
| Phase 36  | 1        | 1         | 100%     |
| Phase 37  | 1        | 1         | 100%     |
| Phase 38  | 1        | 1         | 100%     |
| Phase 39  | 1        | 1         | 100%     |
| Phase 40  | 1        | 1         | 100%     |
| Phase 41  | 1        | 1         | 100%     |
| Phase 42  | 1        | 1         | 100%     |
| Phase 43  | 1        | 1         | 100%     |
| Phase 44  | 2        | 0         | 0%       |
| Phase 50  | 1        | 1         | 100%     |
| Phase 51  | 1        | 0         | 0%       |
| Phase 99  | 9        | 5         | 56%      |
| Phase 100 | 15       | 4         | 27%      |
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
