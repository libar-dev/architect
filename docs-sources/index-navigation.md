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
| Query process state via CLI    | [CLI Reference](reference/CLI-REFERENCE.md)                     |
| Find CLI workflow recipes      | [CLI Recipes](reference/CLI-RECIPES.md)                         |
| Run AI coding sessions         | [Session Workflow Guide](reference/SESSION-WORKFLOW-GUIDE.md)   |
| Enforce delivery process rules | [Process Guard Reference](reference/PROCESS-GUARD-REFERENCE.md) |
| Learn annotation mechanics     | [Annotation Reference](reference/ANNOTATION-REFERENCE.md)       |
| See codec patterns and options | [Architecture Codecs](reference/ARCHITECTURE-CODECS.md)         |
| Understand PatternGraph types  | [Architecture Types](reference/ARCHITECTURE-TYPES.md)           |

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

7. **[Annotation Reference](reference/ANNOTATION-REFERENCE.md)** -- Annotation mechanics and tag reference
8. **[Session Workflow Guide](reference/SESSION-WORKFLOW-GUIDE.md)** -- Planning, Design, Implementation workflows
9. **[CLI Reference](reference/CLI-REFERENCE.md)** -- Pattern Graph CLI command reference with flags and examples
10. **[Process Guard Reference](reference/PROCESS-GUARD-REFERENCE.md)** -- Pre-commit hooks, error codes, programmatic API

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
| CLI Reference           | AI/Devs    | CLI command reference with flags and examples    |
| CLI Recipes             | AI/Devs    | CLI workflow recipes and session guides          |
| Process Guard Reference | Team Leads | Pre-commit hooks, error codes, programmatic API  |
| Architecture Codecs     | Developers | All codecs with factory patterns and options     |
| Architecture Types      | Developers | PatternGraph interface and type shapes           |

---

## Key Concepts

**Delivery Process** -- A code-first documentation and workflow toolkit. Extracts patterns from annotated TypeScript and Gherkin sources, generates markdown documentation, and validates delivery workflow via pre-commit hooks.

**Pattern** -- An annotated unit of work tracked by the delivery process. Each pattern has a status (roadmap, active, completed, deferred), belongs to a product area, and has deliverables. Patterns are the atomic unit of the PatternGraph.

**PatternGraph** -- The single read model (ADR-006) containing all extracted patterns with pre-computed views (byProductArea, byPhase, byStatus, byCategory). All codecs and the Data API consume this dataset.

**Codec** -- A Zod-based transformer that decodes PatternGraph into a RenderableDocument. Each codec produces a specific document type. Codecs are pure functions with no I/O.

**Dual-Source Architecture** -- Feature files own planning metadata (status, phase, dependencies). TypeScript files own implementation metadata (uses, used-by, category). This split prevents ownership conflicts.

**Delivery Workflow FSM** -- A finite state machine enforcing pattern lifecycle: roadmap -> active -> completed. Transitions are validated by Process Guard at commit time.
