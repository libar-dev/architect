@libar-docs
@libar-docs-adr:003
@libar-docs-adr-status:accepted
@libar-docs-adr-category:process
@libar-docs-pattern:ADR003SourceFirstPatternArchitecture
@libar-docs-status:roadmap
@libar-docs-product-area:Process
@libar-docs-include:process-workflow
@libar-docs-depends-on:ADR001TaxonomyCanonicalValues
Feature: ADR-003 - Source-First Pattern Architecture

  **Context:**
  The original annotation architecture assumed pattern definitions live
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
  | Type | Impact |
  | Positive | Pattern identity travels with code from stub through production |
  | Positive | Eliminates stale tier 1 spec maintenance burden |
  | Positive | Executable specs become the living specification (richer, verified) |
  | Positive | Retroactive annotation works without merge conflicts |
  | Negative | Migration effort for existing tier 1 specs |
  | Negative | Requires updating CLAUDE.md annotation ownership guidance |

  # ===========================================================================
  # DELIVERABLES
  # ===========================================================================

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Decision spec | in-progress | delivery-process/decisions/adr-003 |
      | Update CLAUDE.md annotation ownership | pending | CLAUDE.md |
      | Update monorepo source-annotations.md | pending | monorepo _claude-md/ |
      | Reframe tag-duplication anti-pattern | pending | src/validation/anti-patterns.ts |

  # ===========================================================================
  # RULE 1: TypeScript Source Owns Pattern Identity
  # ===========================================================================

  Rule: TypeScript source owns pattern identity

    **Invariant:** A pattern is defined by `@libar-docs-pattern` in a TypeScript
    file — either a stub (pre-implementation) or source code (post-implementation).
    **Rationale:** If pattern identity lives in tier 1 specs, it becomes stale after implementation and diverges from the code that actually realizes the pattern.

    **Pattern Definition Lifecycle:**

    | Phase | Location | Status |
    | Design | `delivery-process/stubs/pattern-name/` | roadmap |
    | Implementation | `src/path/to/module.ts` | active |
    | Completed | `src/path/to/module.ts` | completed |

    Exception: Patterns with no TypeScript implementation (pure process or
    workflow concerns) may be defined in decision specs. The constraint is:
    one definition per pattern, regardless of source type.

  # ===========================================================================
  # RULE 2: Tier 1 Specs Are Ephemeral
  # ===========================================================================

  Rule: Tier 1 specs are ephemeral working documents

    **Invariant:** Tier 1 roadmap specs serve planning and delivery tracking.
    They are not the source of truth for pattern identity, invariants, or
    acceptance criteria. After completion, they may be archived.
    **Rationale:** Treating tier 1 specs as durable creates a maintenance burden — at scale only 39% maintain traceability, and duplicated Rules/Scenarios average 200-400 stale lines.

    **Value by lifecycle phase:**

    | Phase | Planning Value | Documentation Value |
    | roadmap | High | None (not yet built) |
    | active | Medium (deliverable tracking) | Low (stale snapshot) |
    | completed | None | None (executable specs are better) |

  # ===========================================================================
  # RULE 3: Three Durable Artifact Types
  # ===========================================================================

  Rule: Three durable artifact types

    **Invariant:** The delivery process produces three artifact types with
    long-term value. All other artifacts are projections or ephemeral.
    **Rationale:** Without a clear boundary between durable and ephemeral artifacts, teams maintain redundant documents that inevitably drift from the source of truth.

    | Artifact | Purpose | Owns |
    | Annotated TypeScript | Pattern identity, architecture graph | Name, status, uses, categories |
    | Executable specs | Behavior verification, invariants | Rules, rationale, acceptance criteria |
    | Decision specs (ADR/PDR) | Architectural choices, rationale | Why decisions were made |

  # ===========================================================================
  # RULE 4: Implements Is UML Realization
  # ===========================================================================

  Rule: Implements is UML Realization (many-to-one)

    **Invariant:** `@libar-docs-implements` declares a realization relationship.
    Multiple files can implement the same pattern. One file can implement
    multiple patterns (CSV format).
    **Rationale:** Without many-to-one realization, cross-cutting patterns that span multiple files cannot be traced back to a single canonical definition.

    | Relationship | Tag | Cardinality |
    | Definition | `@libar-docs-pattern` | Exactly one per pattern |
    | Realization | `@libar-docs-implements` | Many-to-one |

  # ===========================================================================
  # RULE 5: Single-Definition Constraint
  # ===========================================================================

  Rule: Single-definition constraint

    **Invariant:** `@libar-docs-pattern:X` may appear in exactly one file
    across the entire codebase. The `mergePatterns()` conflict check in
    `orchestrator.ts` correctly enforces this.
    **Rationale:** Duplicate pattern definitions cause merge conflicts in the MasterDataset and produce ambiguous ownership in generated documentation.

    **Migration path for existing conflicts:**

    | Current State | Resolution |
    | Pattern in both TS and feature | Keep TS definition, feature uses `@implements` |
    | Pattern only in tier 1 spec | Move definition to TS stub, archive tier 1 spec |
    | Pattern only in TS | Already correct |
    | Pattern only in executable spec | Valid if no TS implementation exists |

  # ===========================================================================
  # RULE 6: Reverse Links Preferred
  # ===========================================================================

  Rule: Reverse links preferred over forward links

    **Invariant:** `@libar-docs-implements` (reverse: "I verify this pattern")
    is the primary traceability mechanism. `@libar-docs-executable-specs`
    (forward: "my tests live here") is retained but not required.
    **Rationale:** Forward links in tier 1 specs go stale when specs are archived, while reverse links in test files are self-maintaining because the test cannot run without the implementation.

    | Mechanism | Usage | Reliability |
    | `@implements` (reverse) | 14 patterns (32%) | Self-maintaining, lives in test |
    | `@executable-specs` (forward) | 9 patterns (20%) | Requires tier 1 spec maintenance |

  # ===========================================================================
  # ACCEPTANCE CRITERIA
  # ===========================================================================

  @acceptance-criteria
  Scenario: TypeScript source is canonical pattern definition
    Given a pattern defined in a TypeScript file with @libar-docs-pattern
    When an executable spec references it with @libar-docs-implements
    Then the TypeScript file owns the pattern identity
    And the executable spec owns behavior verification
