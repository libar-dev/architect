# ✅ ADR-003: ADR 003 Source First Pattern Architecture

**Purpose:** Architecture decision record for ADR 003 Source First Pattern Architecture

---

## Overview

| Property | Value    |
| -------- | -------- |
| Status   | accepted |
| Category | process  |

## Rules

### TypeScript source owns pattern identity

**Invariant:** A pattern is defined by `@libar-docs-pattern` in a TypeScript
file — either a stub (pre-implementation) or source code (post-implementation).

    **Pattern Definition Lifecycle:**

    | Phase | Location | Status |
    | Design | `delivery-process/stubs/pattern-name/` | roadmap |
    | Implementation | `src/path/to/module.ts` | active |
    | Completed | `src/path/to/module.ts` | completed |

    **Exception:** Patterns with no TypeScript implementation (pure process or
    workflow concerns) may be defined in decision specs. The constraint is:
    one definition per pattern, regardless of source type.

### Tier 1 specs are ephemeral working documents

**Invariant:** Tier 1 roadmap specs serve planning and delivery tracking.
They are not the source of truth for pattern identity, invariants, or
acceptance criteria. After completion, they may be archived.

    **Value by lifecycle phase:**

    | Phase | Planning Value | Documentation Value |
    | roadmap | High | None (not yet built) |
    | active | Medium (deliverable tracking) | Low (stale snapshot) |
    | completed | None | None (executable specs are better) |

### Three durable artifact types

**Invariant:** The delivery process produces three artifact types with
long-term value. All other artifacts are projections or ephemeral.

    | Artifact | Purpose | Owns |
    | Annotated TypeScript | Pattern identity, architecture graph | Name, status, uses, categories |
    | Executable specs | Behavior verification, invariants | Rules, rationale, acceptance criteria |
    | Decision specs (ADR/PDR) | Architectural choices, rationale | Why decisions were made |

### Implements is UML Realization (many-to-one)

**Invariant:** `@libar-docs-implements` declares a realization relationship.
Multiple files can implement the same pattern. One file can implement
multiple patterns (CSV format).

    | Relationship | Tag | Cardinality |
    | Definition | `@libar-docs-pattern` | Exactly one per pattern |
    | Realization | `@libar-docs-implements` | Many-to-one |

### Single-definition constraint

**Invariant:** `@libar-docs-pattern:X` may appear in exactly one file
across the entire codebase. The `mergePatterns()` conflict check in
`orchestrator.ts` correctly enforces this.

    **Migration path for existing conflicts:**

    | Current State | Resolution |
    | Pattern in both TS and feature | Keep TS definition, feature uses `@implements` |
    | Pattern only in tier 1 spec | Move definition to TS stub, archive tier 1 spec |
    | Pattern only in TS | Already correct |
    | Pattern only in executable spec | Valid if no TS implementation exists |

### Reverse links preferred over forward links

**Invariant:** `@libar-docs-implements` (reverse: "I verify this pattern")
is the primary traceability mechanism. `@libar-docs-executable-specs`
(forward: "my tests live here") is retained but not required.

    | Mechanism | Usage | Reliability |
    | `@implements` (reverse) | 14 patterns (32%) | Self-maintaining, lives in test |
    | `@executable-specs` (forward) | 9 patterns (20%) | Requires tier 1 spec maintenance |

---

[← Back to All Decisions](../DECISIONS.md)
