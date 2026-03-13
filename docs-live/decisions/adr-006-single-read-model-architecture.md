# ADR-006: ADR 006 Single Read Model Architecture

**Purpose:** Architecture decision record for ADR 006 Single Read Model Architecture

---

## Overview

| Property | Value |
| --- | --- |
| Status | proposed |
| Category | architecture |

**Context:**
The delivery-process package applies event sourcing to itself: git is
the event store, annotated source files are authoritative state, generated
documentation is a projection. The MasterDataset is the read model —
produced by a single-pass O(n) transformer with pre-computed views
and a relationship index.

ADR-005 established that codecs consume MasterDataset as their sole input.
The ProcessStateAPI consumes it. But the validation layer bypasses it,
wiring its own mini-pipeline from raw scanner/extractor output. It creates
a lossy local type that discards relationship data, then discovers it
lacks the information needed — requiring ad-hoc re-derivation of what
the MasterDataset already computes.

This is the same class of problem the MasterDataset was created to solve.
Before the single-pass transformer, each generator called `.filter()`
independently. The MasterDataset eliminated that duplication for codecs.
This ADR extends the same principle to all consumers.

**Decision:**
The MasterDataset is the single read model for all consumers. No consumer
re-derives pattern data from raw scanner/extractor output when that data
is available in the MasterDataset. Validators, codecs, and query APIs
consume the same pre-computed read model.

**Consequences:**

| Type | Impact |
| --- | --- |
| Positive | Relationship resolution happens once — no consumer re-derives implements, uses, or dependsOn |
| Positive | Eliminates lossy local types that discard fields from canonical ExtractedPattern |
| Positive | Validation rules automatically benefit from new MasterDataset views and indices |
| Positive | Aligns with the monorepo's own ADR-006: projections for all reads, never query aggregate state |
| Negative | Validators that today only need stage 1-2 data will import the transformer |
| Negative | MasterDataset schema changes affect more consumers |

## Rules

### All feature consumers query the read model, not raw state

**Invariant:** Code that needs pattern relationships, status groupings, cross-source resolution, or dependency information consumes the MasterDataset. Direct scanner/extractor imports are permitted only in pipeline orchestration code that builds the MasterDataset.

**Rationale:** Bypassing the read model forces consumers to re-derive data that the MasterDataset already computes, creating duplicate logic and divergent behavior when the pipeline evolves.

| Layer | May Import | Examples |
| --- | --- | --- |
| Pipeline Orchestration | scanner/, extractor/, pipeline/ | orchestrator.ts, process-api.ts pipeline setup |
| Feature Consumption | MasterDataset, relationshipIndex | codecs, ProcessStateAPI, validators, query handlers |

**Verified by:**

- Feature consumers import from MasterDataset not from raw pipeline stages


    Exception: `lint-patterns.ts` is a pure stage-1 consumer. It validates
    annotation syntax on scanned files. No relationships
- no cross-source
    resolution. Direct scanner consumption is correct for that use case.

### No lossy local types

**Invariant:** Consumers do not define local DTOs that duplicate and discard fields from ExtractedPattern. If a consumer needs a subset, the type system provides the projection — not a hand-written extraction function that becomes a barrier between the consumer and canonical data.

**Rationale:** Lossy local types silently drop fields that later become needed, causing bugs that only surface when new MasterDataset capabilities are added and the local type lacks them.

**Verified by:**

- Feature consumers import from MasterDataset not from raw pipeline stages

### Relationship resolution is computed once

**Invariant:** Forward relationships (uses, dependsOn, implementsPatterns) and reverse lookups (usedBy, implementedBy, extendedBy) are computed in `transformToMasterDataset()`. No consumer re-derives these from raw pattern arrays or scanned file tags.

**Rationale:** Re-deriving relationships in consumers duplicates the resolution logic and risks inconsistency when different consumers implement subtly different traversal or filtering rules.

**Verified by:**

- Feature consumers import from MasterDataset not from raw pipeline stages

### Three named anti-patterns

**Invariant:** These are recognized violations, serving as review criteria for new code and refactoring targets for existing code.

**Rationale:** Without named anti-patterns, violations appear as one-off style issues rather than systematic architectural drift, making them harder to detect and communicate in code review.

| Anti-Pattern | Detection Signal |
| --- | --- |
| Parallel Pipeline | Feature consumer imports from scanner/ or extractor/ |
| Lossy Local Type | Local interface with subset of ExtractedPattern fields + dedicated extraction function |
| Re-derived Relationship | Building Map or Set from pattern.implementsPatterns, uses, or dependsOn in consumer code |

**Good vs Bad**

```typescript
// Good: consume the read model
    function validateCrossSource(dataset: RuntimeMasterDataset): ValidationSummary {
      const rel = dataset.relationshipIndex[patternName];
      const isImplemented = rel.implementedBy.length > 0;
    }

    // Bad: re-derive from raw state (Parallel Pipeline + Re-derived Relationship)
    function buildImplementsLookup(
      gherkinFiles: readonly ScannedGherkinFile[],
      tsPatterns: readonly ExtractedPattern[]
    ): ReadonlySet<string> { ... }
```

**References**

    - Monorepo ADR-006: Projections for All Reads (same principle, application domain)
    - ADR-005: Codec-Based Markdown Rendering (established MasterDataset as codec input)
    - Order-management ARCHITECTURE.md: CommandOrchestrator + Read Model separation

**Verified by:**

- Feature consumers import from MasterDataset not from raw pipeline stages


    Naming them makes them visible in code review — including AI-assisted
    sessions where the default proposal is often "add a helper function."

---

[← Back to All Decisions](../DECISIONS.md)
