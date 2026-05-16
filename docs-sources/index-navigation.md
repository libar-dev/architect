## Quick Navigation

| If you want to...                            | Read this                                                  |
| -------------------------------------------- | ---------------------------------------------------------- |
| Learn the architecture                       | [ARCHITECTURE.md](ARCHITECTURE.md)                         |
| Browse product area overviews                | [PRODUCT-AREAS.md](PRODUCT-AREAS.md)                       |
| Review architecture decisions                | [DECISIONS.md](DECISIONS.md)                               |
| Check business rules                         | [BUSINESS-RULES.md](BUSINESS-RULES.md)                     |
| Understand the tag taxonomy                  | [TAXONOMY.md](TAXONOMY.md)                                 |
| Check validation rules                       | [VALIDATION-RULES.md](VALIDATION-RULES.md)                 |
| Browse the changelog                         | [CHANGELOG.md](CHANGELOG.md)                               |
| Query process state via CLI                  | [PatternGraphAPICLI](patterns/pattern-graph-apicli.md)     |
| Find CLI workflow recipes                    | [DataAPICLIErgonomics](patterns/data-apicli-ergonomics.md) |
| Run AI coding sessions                       | [SESSION-GUIDES.md](../docs/SESSION-GUIDES.md)             |
| Enforce delivery process rules               | [PROCESS-GUARD.md](../docs/PROCESS-GUARD.md)               |
| Learn annotation mechanics                   | [ANNOTATION-GUIDE.md](../docs/ANNOTATION-GUIDE.md)         |
| See projection pipeline patterns and options | [ARCHITECTURE.md](ARCHITECTURE.md)                         |
| Understand PatternGraph types                | [ARCHITECTURE.md](ARCHITECTURE.md)                         |

---

## Reading Order

### Overview

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** -- Architecture diagram from source annotations
2. **[PRODUCT-AREAS.md](PRODUCT-AREAS.md)** -- Product area overviews with live statistics and diagrams
3. **[TAXONOMY.md](TAXONOMY.md)** -- Tag taxonomy configuration and format types

### Deep Dive

4. **[DECISIONS.md](DECISIONS.md)** -- Architecture Decision Records extracted from specs
5. **[BUSINESS-RULES.md](BUSINESS-RULES.md)** -- Domain constraints and invariants from feature files
6. **[VALIDATION-RULES.md](VALIDATION-RULES.md)** -- Process Guard validation rules and FSM reference

### Reference Guides

7. **[ANNOTATION-GUIDE.md](../docs/ANNOTATION-GUIDE.md)** -- Annotation mechanics and tag reference
8. **[SESSION-GUIDES.md](../docs/SESSION-GUIDES.md)** -- Planning, Design, Implementation workflows
9. **[PatternGraphAPICLI](patterns/pattern-graph-apicli.md)** -- Pattern Graph CLI runtime and generated behavior coverage
10. **[PROCESS-GUARD.md](../docs/PROCESS-GUARD.md)** -- Pre-commit hooks, error codes, and workflow protection

---

## Document Roles

| Document             | Audience   | Focus                                            |
| -------------------- | ---------- | ------------------------------------------------ |
| ARCHITECTURE.md      | Developers | Architecture diagram from source annotations     |
| PRODUCT-AREAS.md     | Everyone   | Product area overviews with live statistics      |
| DECISIONS.md         | Developers | Architecture Decision Records                    |
| BUSINESS-RULES.md    | Developers | Domain constraints and invariants                |
| TAXONOMY.md          | Reference  | Tag taxonomy structure and format types          |
| VALIDATION-RULES.md  | CI/CD      | Process Guard validation rules and FSM reference |
| CHANGELOG.md         | Everyone   | Project changelog from release specs             |
| ANNOTATION-GUIDE.md  | Developers | Annotation mechanics and shape extraction        |
| SESSION-GUIDES.md    | AI/Devs    | Session decision trees and workflow checklists   |
| PatternGraphAPICLI   | AI/Devs    | CLI runtime and generated behavior coverage      |
| DataAPICLIErgonomics | AI/Devs    | CLI workflow recipes and session guidance        |
| PROCESS-GUARD.md     | Team Leads | Pre-commit hooks, error codes, and protections   |
| ARCHITECTURE.md      | Developers | Projection and PatternGraph architecture details |

---

## Key Concepts

**Delivery Process** -- A code-first documentation and workflow toolkit. Extracts patterns from annotated TypeScript and Gherkin sources, generates markdown documentation, and validates delivery workflow via pre-commit hooks.

**Pattern** -- An annotated unit of work tracked by the delivery process. Each pattern has a status (roadmap, active, completed, deferred), belongs to a product area, and has deliverables. Patterns are the atomic unit of the PatternGraph.

**PatternGraph** -- The single read model (ADR-006) containing all extracted patterns with pre-computed views (byProductArea, byPhase, byStatus, byRole). All codecs and the Data API consume this dataset.

**Projection pipeline** -- A projection reads PatternGraph into a typed fragment, then a renderer turns that fragment into the target output. The pipeline stays pure and has no I/O.

**Dual-Source Architecture** -- Feature files own planning metadata (status, phase, dependencies). TypeScript files own implementation metadata (uses, used-by, role). This split prevents ownership conflicts.

**Delivery Workflow FSM** -- A finite state machine enforcing pattern lifecycle: roadmap -> active -> completed. Transitions are validated by Process Guard at commit time.
