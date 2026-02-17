# ✅ Pattern Relationship Model

**Purpose:** Detailed documentation for the Pattern Relationship Model pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |
| Phase | 99 |

## Description

**Problem:** The delivery process lacks a comprehensive relationship model between artifacts.
  Code files, roadmap specs, executable specs, and patterns exist but their relationships
  are implicit or limited to basic dependency tracking (`uses`, `depends-on`).

  **Solution:** Implement a relationship taxonomy inspired by UML/TML modeling practices:
  - **Realization** (`implements`) - Code realizes a pattern specification
  - **Generalization** (`extends`) - Pattern extends another pattern's capabilities
  - **Dependency** (`uses`, `used-by`) - Technical dependencies between patterns
  - **Composition** (`parent`, `level`) - Hierarchical pattern organization
  - **Traceability** (`roadmap-spec`, `executable-specs`) - Cross-tier linking

  **Business Value:**
  | Benefit | How |
  | Complete dependency graphs | All relationships rendered in Mermaid with distinct arrow styles |
  | Implementation tracking | `implements` links code stubs to roadmap specs |
  | Code-sourced documentation | Generated docs pull from both .feature files AND code stubs |
  | Impact analysis | Know what code breaks when pattern spec changes |
  | Agentic workflows | Claude can navigate from pattern to implementations and back |
  | UML-grade modeling | Professional relationship semantics enable rich tooling |

## Implementations

Files that implement this pattern:

- [`transform-dataset.ts`](../../src/generators/pipeline/transform-dataset.ts) - ## TransformDataset - Single-Pass Pattern Transformation
- [`rules.ts`](../../src/lint/rules.ts) - ## LintRules - Annotation Quality Rules
- [`patterns.ts`](../../src/renderable/codecs/patterns.ts) - ## Patterns Document Codec
- [`depends-on-tag.feature`](../../tests/features/behavior/pattern-relationships/depends-on-tag.feature) - Tests extraction of @libar-docs-depends-on and @libar-docs-enables
- [`extends-tag.feature`](../../tests/features/behavior/pattern-relationships/extends-tag.feature) - Tests for the @libar-docs-extends tag which establishes generalization
- [`implements-tag.feature`](../../tests/features/behavior/pattern-relationships/implements-tag.feature) - Tests for the @libar-docs-implements tag which links implementation files
- [`linter-validation.feature`](../../tests/features/behavior/pattern-relationships/linter-validation.feature) - Tests for lint rules that validate relationship integrity, detect conflicts,
- [`mermaid-rendering.feature`](../../tests/features/behavior/pattern-relationships/mermaid-rendering.feature) - Tests for rendering all relationship types in Mermaid dependency graphs
- [`uses-tag.feature`](../../tests/features/behavior/pattern-relationships/uses-tag.feature) - Tests extraction and processing of @libar-docs-uses and @libar-docs-used-by

## Acceptance Criteria

**Implements tag parsed from TypeScript**

- Given a TypeScript file with annotations:
- When the scanner processes the file
- Then the file is linked to pattern "EventStoreDurability"
- And the relationship type is "implements"
- And the file's `uses` metadata is preserved

```typescript
/**
 * @libar-docs
 * @libar-docs-implements EventStoreDurability
 * @libar-docs-status roadmap
 * @libar-docs-uses idempotentAppend, Workpool
 */
```

**Multiple patterns implemented by one file**

- Given a TypeScript file with annotations:
- When the scanner processes the file
- Then the file is linked to both "EventStoreDurability" and "IdempotentAppend"
- And both patterns list this file as an implementation

```typescript
/**
 * @libar-docs
 * @libar-docs-implements EventStoreDurability, IdempotentAppend
 */
```

**No conflict with pattern definition**

- Given a roadmap spec with `@libar-docs-pattern:EventStoreDurability`
- And a TypeScript file with `@libar-docs-implements:EventStoreDurability`
- When the generator processes both
- Then no conflict error is raised
- And the implementation file is associated with the pattern

**Multiple files implement same pattern**

- Given three TypeScript files each with `@libar-docs-implements:EventStoreDurability`
- When the generator processes all files
- Then all three are listed as implementations of "EventStoreDurability"
- And each file's metadata is preserved separately

**Extends tag parsed from feature file**

- Given a roadmap spec with:
- When the scanner processes the file
- Then the pattern "ReactiveProjections" is linked to base "ProjectionCategories"
- And the relationship type is "extends"

```gherkin
@libar-docs
@libar-docs-pattern:ReactiveProjections
@libar-docs-extends:ProjectionCategories
```

**Extended-by reverse lookup computed**

- Given pattern A with `@libar-docs-extends:B`
- When the relationship index is built
- Then pattern B's `extendedBy` includes "A"

**Circular inheritance detected**

- Given pattern A with `@libar-docs-extends:B`
- And pattern B with `@libar-docs-extends:A`
- When the linter runs
- Then an error is emitted about circular inheritance

**Uses rendered as solid arrows in graph**

- Given a pattern with `@libar-docs-uses:CommandBus,EventStore`
- When the Mermaid graph is generated
- Then solid arrows point from pattern to "CommandBus" and "EventStore"

**Used-by aggregated in pattern detail**

- Given pattern A with `@libar-docs-used-by:B,C`
- When the pattern detail page is generated
- Then the "Used By" section lists "B" and "C"

**Depends-on rendered as dashed arrows**

- When the Mermaid graph is generated
- Then a dashed arrow points from pattern to "EventStoreFoundation"

**Enables is inverse of depends-on**

- When the relationship index is built
- Then pattern B's `enables` includes "A"

**Bidirectional links established**

- Given a roadmap spec with `@libar-docs-executable-specs:platform-core/tests/features/durability`
- And a package spec with `@libar-docs-roadmap-spec:EventStoreDurability`
- When the traceability index is built
- Then the roadmap spec links forward to the package location
- And the package spec links back to the pattern

**Orphan executable spec detected**

- Given a package spec with `@libar-docs-roadmap-spec:NonExistentPattern`
- When the linter runs
- Then a warning is emitted about orphan executable spec

**Parent link validated**

- Given a phase spec with `@libar-docs-parent:ProcessEnhancements`
- And an epic spec with `@libar-docs-pattern:ProcessEnhancements`
- When the hierarchy is validated
- Then the parent link is confirmed valid

**Invalid parent detected**

- Given a task spec with `@libar-docs-parent:NonExistentEpic`
- When the linter runs
- Then an error is emitted about invalid parent reference

**Graph uses distinct arrow styles**

- Given patterns with `uses`, `depends-on`, `implements`, and `extends` relationships
- When the Mermaid graph is generated
- Then `uses` renders as solid arrows (`-->`)
- And `depends-on` renders as dashed arrows (`-.->`)
- And `implements` renders as dotted arrows (`..->`)
- And `extends` renders as solid open arrows (`-->>`)

**Pattern detail page shows all relationships**

- Given a pattern with implementations, dependencies, and tests
- When the pattern detail page is generated
- Then sections appear for "Implementations", "Dependencies", "Used By", "Tests"

**Missing relationship target detected**

- Given a file with `@libar-docs-uses:NonExistentPattern`
- When the linter runs with strict mode
- Then a warning is emitted about unresolved relationship target

**Pattern tag in implements file causes error**

- Given a file with both `@libar-docs-implements:X` and `@libar-docs-pattern:X`
- When the linter runs
- Then an error is emitted about conflicting tags
- And the message explains that implements files must not define patterns

**Asymmetric traceability detected**

- Given a roadmap spec with `@libar-docs-executable-specs:path/to/tests`
- And no package spec at that path with `@libar-docs-roadmap-spec` back-link
- When the linter runs with strict mode
- Then a warning is emitted about missing back-link

## Business Rules

**Code files declare pattern realization via implements tag**

**Invariant:** Files with `@libar-docs-implements:PatternName,OtherPattern` are linked
    to the specified patterns without causing conflicts. Pattern definitions remain in
    roadmap specs; implementation files provide supplementary metadata. Multiple files can
    implement the same pattern, and one file can implement multiple patterns.

    **Rationale:** This mirrors UML's "realization" relationship where a class implements
    an interface. Code realizes the specification. Direction is code→spec (backward link).
    CSV format allows a single implementation file to realize multiple patterns when
    implementing a pattern family (e.g., durability primitives).

    **API:** See `src/taxonomy/registry-builder.ts`

    **Verified by:** Implements tag parsed, Multiple patterns supported, No conflict with pattern definition, Multiple implementations of same pattern

_Verified by: Implements tag parsed from TypeScript, Multiple patterns implemented by one file, No conflict with pattern definition, Multiple files implement same pattern_

**Pattern inheritance uses extends relationship tag**

**Invariant:** Files with `@libar-docs-extends:BasePattern` declare that they extend
    another pattern's capabilities. This is a generalization relationship where the
    extending pattern is a specialization of the base pattern.

    **Rationale:** Pattern families exist where specialized patterns build on base patterns.
    For example, `ReactiveProjections` extends `ProjectionCategories`. The extends
    relationship enables inheritance-based documentation and validates pattern hierarchy.

    **API:** See `src/taxonomy/registry-builder.ts`

    **Verified by:** Extends tag parsed, Extended-by computed, Inheritance chain validated

_Verified by: Extends tag parsed from feature file, Extended-by reverse lookup computed, Circular inheritance detected_

**Technical dependencies use directed relationship tags**

**Invariant:** `@libar-docs-uses` declares outbound dependencies (what this
    pattern depends on). `@libar-docs-used-by` declares inbound dependencies
    (what depends on this pattern). Both are CSV format.

    **Rationale:** These represent technical coupling between patterns. The
    distinction matters for impact analysis: changing a pattern affects its
    `used-by` consumers but not its `uses` dependencies.

    **Verified by:** Uses rendered as solid arrows, Used-by aggregated correctly

_Verified by: Uses rendered as solid arrows in graph, Used-by aggregated in pattern detail_

**Roadmap sequencing uses ordering relationship tags**

**Invariant:** `@libar-docs-depends-on` declares what must be completed first
    (roadmap sequencing). `@libar-docs-enables` declares what this unlocks when
    completed. These are planning relationships, not technical dependencies.

    **Rationale:** Sequencing is about order of work, not runtime coupling.
    A pattern may depend on another being complete without using its code.

    **Verified by:** Depends-on rendered as dashed arrows, Enables is inverse

_Verified by: Depends-on rendered as dashed arrows, Enables is inverse of depends-on_

**Cross-tier linking uses traceability tags (PDR-007)**

**Invariant:** `@libar-docs-executable-specs` on roadmap specs points to test
    locations. `@libar-docs-roadmap-spec` on package specs points back to the
    pattern. These create bidirectional traceability.

    **Rationale:** Two-tier architecture (PDR-007) separates planning specs from
    executable tests. Traceability tags maintain the connection for navigation
    and completeness checking.

    **Verified by:** Bidirectional links established, Orphan detection

_Verified by: Bidirectional links established, Orphan executable spec detected_

**Epic/Phase/Task hierarchy uses parent-child relationships**

**Invariant:** `@libar-docs-level` declares the hierarchy tier (epic, phase, task).
    `@libar-docs-parent` links to the containing pattern. This enables rollup
    progress tracking.

    **Rationale:** Large initiatives decompose into phases and tasks. The hierarchy
    allows progress aggregation (e.g., "Epic 80% complete based on child phases").

    **Verified by:** Parent link validated, Progress rollup calculated

_Verified by: Parent link validated, Invalid parent detected_

**All relationships appear in generated documentation**

**Invariant:** The PATTERNS.md dependency graph renders all relationship types
    with distinct visual styles. Pattern detail pages list all related artifacts
    grouped by relationship type.

    **Rationale:** Visualization makes the relationship model accessible. Different
    arrow styles distinguish relationship semantics at a glance.

    | Relationship | Arrow Style | Direction | Description |
    | uses | --> (solid) | OUT | Technical dependency |
    | depends-on | -.-> (dashed) | OUT | Roadmap sequencing |
    | implements | ..-> (dotted) | CODE→SPEC | Realization |
    | extends | -->> (solid open) | CHILD→PARENT | Generalization |

    **Verified by:** Graph uses distinct styles, Detail page sections

_Verified by: Graph uses distinct arrow styles, Pattern detail page shows all relationships_

**Linter detects relationship violations**

**Invariant:** The pattern linter validates that all relationship targets exist,
    implements files don't have pattern tags, and bidirectional links are consistent.

    **Rationale:** Broken relationships cause confusion and incorrect generated docs.
    Early detection during linting prevents propagation of errors.

    **Verified by:** Missing target detected, Pattern conflict detected, Asymmetric link detected

_Verified by: Missing relationship target detected, Pattern tag in implements file causes error, Asymmetric traceability detected_

---

[← Back to Pattern Registry](../PATTERNS.md)
