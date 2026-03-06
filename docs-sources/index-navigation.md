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

4. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** -- Four-stage pipeline, codecs, MasterDataset
5. **[PROCESS-API.md](docs/PROCESS-API.md)** -- Data API CLI query interface
6. **[SESSION-GUIDES.md](docs/SESSION-GUIDES.md)** -- Planning/Design/Implementation workflows
7. **[GHERKIN-PATTERNS.md](docs/GHERKIN-PATTERNS.md)** -- Writing effective Gherkin specs
8. **[ANNOTATION-GUIDE.md](docs/ANNOTATION-GUIDE.md)** -- Annotation mechanics, shape extraction

### For Team Leads / CI

9. **[PROCESS-GUARD.md](docs/PROCESS-GUARD.md)** -- FSM enforcement, pre-commit hooks
10. **[VALIDATION.md](docs/VALIDATION.md)** -- Lint rules, DoD checks, anti-patterns

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
