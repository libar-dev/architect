@libar-docs
@libar-docs-adr:003
@libar-docs-adr-status:proposed
@libar-docs-adr-category:process
@libar-docs-pattern:PDR003SourceFirstPatternArchitecture
@libar-docs-status:roadmap
@libar-docs-product-area:DeliveryProcess
@libar-docs-convention:annotation-system
Feature: PDR-003 - Source-First Pattern Architecture

  **Context:**
  The current annotation architecture (PDR-001) assumes pattern definitions live
  in tier 1 feature specs, with TypeScript code limited to `@libar-docs-implements`.
  At scale this creates three problems: tier 1 specs become stale after implementation
  (only 39% of 44 specs have traceability to executable specs), retroactive annotation
  of existing code triggers merge conflicts, and duplicated Rules/Scenarios in tier 1
  specs average 200-400 lines that exist in better form in executable specs.

  **Decision:**
  Invert the ownership model: TypeScript source code is the canonical pattern
  definition. Tier 1 specs become ephemeral planning documents. The three durable
  artifacts are annotated source code, executable specs, and decision specs.

  **Consequences:**
  - (+) Pattern identity travels with code from stub through production
  - (+) Eliminates stale tier 1 spec maintenance burden
  - (+) Executable specs become the living specification (richer, verified)
  - (+) Retroactive annotation works without merge conflicts
  - (-) Migration effort for existing tier 1 specs
  - (-) Requires updating CLAUDE.md annotation ownership guidance

  **Supersedes:** PDR-001 rules "Annotation Ownership", "Example Annotation Split",
  and "Two-Tier Spec Architecture". PDR-001 broader methodology content remains valid.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Decision spec | in-progress | delivery-process/decisions/pdr-003 |
      | Update CLAUDE.md annotation ownership | pending | CLAUDE.md |
      | Update monorepo source-annotations.md | pending | monorepo _claude-md/ |
      | Reframe tag-duplication anti-pattern | pending | src/validation/anti-patterns.ts |

  Rule: TypeScript source owns pattern identity

    **Invariant:** A pattern is defined by `@libar-docs-pattern` in a TypeScript
    file — either a stub (pre-implementation) or source code (post-implementation).

    **Supersedes:** PDR-001 "Code stubs must NOT use @libar-docs-pattern."

    **Prior Art:** `delivery-process/src/phases/_archive/v0.1.0/phase-01-foundation.ts`
    demonstrates all metadata in TypeScript: phase, status, effort, enables, and
    rich markdown descriptions with component tables.

    **Pattern Definition Lifecycle:**

    | Phase | Location | Status |
    | Design | `delivery-process/stubs/pattern-name/` | roadmap |
    | Implementation | `src/path/to/module.ts` | active |
    | Completed | `src/path/to/module.ts` | completed |

    **Exception:** Patterns with no TypeScript implementation (pure process or
    workflow concerns) may be defined in decision specs. The constraint is:
    one definition per pattern, regardless of source type.

  Rule: Tier 1 specs are ephemeral working documents

    **Invariant:** Tier 1 roadmap specs serve planning and delivery tracking.
    They are not the source of truth for pattern identity, invariants, or
    acceptance criteria. After completion, they may be archived.

    **Evidence from delivery-process package:**

    | Metric | Value |
    | Total tier 1 specs | 44 |
    | With any traceability | 17 (39%) |
    | Completed with zero traceability | 10 |
    | Avg tier 1 spec size | 390 lines |
    | Executable specs for same feature | 1,408 lines (richer, maintained) |

    **Value by lifecycle phase:**

    | Phase | Planning Value | Documentation Value |
    | roadmap | High | None (not yet built) |
    | active | Medium (deliverable tracking) | Low (stale snapshot) |
    | completed | None | None (executable specs are better) |

  Rule: Three durable artifact types

    **Invariant:** The delivery process produces three artifact types with
    long-term value. All other artifacts are projections or ephemeral.

    | Artifact | Purpose | Owns |
    | Annotated TypeScript | Pattern identity, architecture graph | Name, status, uses, categories |
    | Executable specs | Behavior verification, invariants | Rules, rationale, acceptance criteria |
    | Decision specs (ADR/PDR) | Architectural choices, rationale | Why decisions were made |

  Rule: Implements is UML Realization (many-to-one)

    **Invariant:** `@libar-docs-implements` declares a realization relationship.
    Multiple files can implement the same pattern. One file can implement
    multiple patterns (CSV format).

    | Relationship | Tag | Cardinality |
    | Definition | `@libar-docs-pattern` | Exactly one per pattern |
    | Realization | `@libar-docs-implements` | Many-to-one |

    **Examples:**

    | Pattern (definition in .ts) | Implementations |
    | DeciderPattern | OrderDecider, PaymentDecider, InventoryDecider |
    | ProcessGuardLinter | fsm-validator.feature, lint-rules.feature |

  Rule: Single-definition constraint

    **Invariant:** `@libar-docs-pattern:X` may appear in exactly one file
    across the entire codebase. The `mergePatterns()` conflict check in
    `orchestrator.ts` correctly enforces this.

    **Reframes:** The documented-but-unimplemented `tag-duplication` anti-pattern.
    The real constraint is single-definition, not tag duplication.

    **Migration path for existing conflicts:**

    | Current State | Resolution |
    | Pattern in both TS and feature | Keep TS definition, feature uses `@implements` |
    | Pattern only in tier 1 spec | Move definition to TS stub, archive tier 1 spec |
    | Pattern only in TS | Already correct |
    | Pattern only in executable spec | Valid if no TS implementation exists |

  Rule: Reverse links preferred over forward links

    **Invariant:** `@libar-docs-implements` (reverse: "I verify this pattern")
    is the primary traceability mechanism. `@libar-docs-executable-specs`
    (forward: "my tests live here") is retained but not required.

    **Evidence:**

    | Mechanism | Usage | Reliability |
    | `@implements` (reverse) | 14 patterns (32%) | Self-maintaining, lives in test |
    | `@executable-specs` (forward) | 9 patterns (20%) | Requires tier 1 spec maintenance |
