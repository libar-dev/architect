@libar-docs
@libar-docs-pattern:PatternRelationshipModel
@libar-docs-status:completed
@libar-docs-phase:99
@libar-docs-release:v1.0.0
@libar-docs-effort:2w
@libar-docs-product-area:DeliveryProcess
@libar-docs-level:epic
@libar-docs-executable-specs:tests/features/behavior/pattern-relationships
Feature: Pattern Relationship Model

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

  # ===========================================================================
  # DELIVERABLES
  # ===========================================================================

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Implements tag in taxonomy registry | completed | src/taxonomy/registry-builder.ts | Yes | unit |
      | Extends tag in taxonomy registry | completed | src/taxonomy/registry-builder.ts | Yes | unit |
      | DocDirective schema update | completed | src/validation-schemas/doc-directive.ts | Yes | unit |
      | ExtractedPattern schema update | completed | src/validation-schemas/extracted-pattern.ts | Yes | unit |
      | RelationshipEntry schema update | completed | src/validation-schemas/master-dataset.ts | Yes | unit |
      | Relationship index enhancement | completed | src/generators/pipeline/transform-dataset.ts | Yes | unit |
      | Mermaid graph enhancement | completed | src/renderable/codecs/patterns.ts | Yes | unit |
      | Pattern detail implementations section | completed | src/renderable/codecs/patterns.ts | Yes | unit |
      | Linter rules for relationship validation | completed | src/lint/rules.ts | Yes | unit |

  # ============================================================================
  # RULE 1: Realization Relationship (implements)
  # ============================================================================

  Rule: Code files declare pattern realization via implements tag

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

    @acceptance-criteria @happy-path
    Scenario: Implements tag parsed from TypeScript
      Given a TypeScript file with annotations:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-implements EventStoreDurability
         * @libar-docs-status roadmap
         * @libar-docs-uses idempotentAppend, Workpool
         */
        """
      When the scanner processes the file
      Then the file is linked to pattern "EventStoreDurability"
      And the relationship type is "implements"
      And the file's `uses` metadata is preserved

    @acceptance-criteria @happy-path
    Scenario: Multiple patterns implemented by one file
      Given a TypeScript file with annotations:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-implements EventStoreDurability, IdempotentAppend
         */
        """
      When the scanner processes the file
      Then the file is linked to both "EventStoreDurability" and "IdempotentAppend"
      And both patterns list this file as an implementation

    @acceptance-criteria @happy-path
    Scenario: No conflict with pattern definition
      Given a roadmap spec with `@libar-docs-pattern:EventStoreDurability`
      And a TypeScript file with `@libar-docs-implements:EventStoreDurability`
      When the generator processes both
      Then no conflict error is raised
      And the implementation file is associated with the pattern

    @acceptance-criteria @happy-path
    Scenario: Multiple files implement same pattern
      Given three TypeScript files each with `@libar-docs-implements:EventStoreDurability`
      When the generator processes all files
      Then all three are listed as implementations of "EventStoreDurability"
      And each file's metadata is preserved separately

  # ============================================================================
  # RULE 2: Generalization Relationship (extends)
  # ============================================================================

  Rule: Pattern inheritance uses extends relationship tag

    **Invariant:** Files with `@libar-docs-extends:BasePattern` declare that they extend
    another pattern's capabilities. This is a generalization relationship where the
    extending pattern is a specialization of the base pattern.

    **Rationale:** Pattern families exist where specialized patterns build on base patterns.
    For example, `ReactiveProjections` extends `ProjectionCategories`. The extends
    relationship enables inheritance-based documentation and validates pattern hierarchy.

    **API:** See `src/taxonomy/registry-builder.ts`

    **Verified by:** Extends tag parsed, Extended-by computed, Inheritance chain validated

    @acceptance-criteria @happy-path
    Scenario: Extends tag parsed from feature file
      Given a roadmap spec with:
        """gherkin
        @libar-docs
        @libar-docs-pattern:ReactiveProjections
        @libar-docs-extends:ProjectionCategories
        """
      When the scanner processes the file
      Then the pattern "ReactiveProjections" is linked to base "ProjectionCategories"
      And the relationship type is "extends"

    @acceptance-criteria @happy-path
    Scenario: Extended-by reverse lookup computed
      Given pattern A with `@libar-docs-extends:B`
      When the relationship index is built
      Then pattern B's `extendedBy` includes "A"

    @acceptance-criteria @validation
    Scenario: Circular inheritance detected
      Given pattern A with `@libar-docs-extends:B`
      And pattern B with `@libar-docs-extends:A`
      When the linter runs
      Then an error is emitted about circular inheritance

  # ============================================================================
  # RULE 3: Dependency Relationships (uses, used-by)
  # ============================================================================

  Rule: Technical dependencies use directed relationship tags

    **Invariant:** `@libar-docs-uses` declares outbound dependencies (what this
    pattern depends on). `@libar-docs-used-by` declares inbound dependencies
    (what depends on this pattern). Both are CSV format.

    **Rationale:** These represent technical coupling between patterns. The
    distinction matters for impact analysis: changing a pattern affects its
    `used-by` consumers but not its `uses` dependencies.

    **Verified by:** Uses rendered as solid arrows, Used-by aggregated correctly

    @acceptance-criteria @happy-path
    Scenario: Uses rendered as solid arrows in graph
      Given a pattern with `@libar-docs-uses:CommandBus,EventStore`
      When the Mermaid graph is generated
      Then solid arrows point from pattern to "CommandBus" and "EventStore"

    @acceptance-criteria @happy-path
    Scenario: Used-by aggregated in pattern detail
      Given pattern A with `@libar-docs-used-by:B,C`
      When the pattern detail page is generated
      Then the "Used By" section lists "B" and "C"

  # ============================================================================
  # RULE 4: Sequencing Relationships (depends-on, enables)
  # ============================================================================

  Rule: Roadmap sequencing uses ordering relationship tags

    **Invariant:** `@libar-docs-depends-on` declares what must be completed first
    (roadmap sequencing). `@libar-docs-enables` declares what this unlocks when
    completed. These are planning relationships, not technical dependencies.

    **Rationale:** Sequencing is about order of work, not runtime coupling.
    A pattern may depend on another being complete without using its code.

    **Verified by:** Depends-on rendered as dashed arrows, Enables is inverse

    @acceptance-criteria @happy-path
    Scenario: Depends-on rendered as dashed arrows
      When the Mermaid graph is generated
      Then a dashed arrow points from pattern to "EventStoreFoundation"

    @acceptance-criteria @happy-path
    Scenario: Enables is inverse of depends-on
      When the relationship index is built
      Then pattern B's `enables` includes "A"

  # ============================================================================
  # RULE 5: Traceability Relationships (roadmap-spec, executable-specs)
  # ============================================================================

  Rule: Cross-tier linking uses traceability tags (PDR-007)

    **Invariant:** `@libar-docs-executable-specs` on roadmap specs points to test
    locations. `@libar-docs-roadmap-spec` on package specs points back to the
    pattern. These create bidirectional traceability.

    **Rationale:** Two-tier architecture (PDR-007) separates planning specs from
    executable tests. Traceability tags maintain the connection for navigation
    and completeness checking.

    **Verified by:** Bidirectional links established, Orphan detection

    @acceptance-criteria @happy-path
    Scenario: Bidirectional links established
      Given a roadmap spec with `@libar-docs-executable-specs:platform-core/tests/features/durability`
      And a package spec with `@libar-docs-roadmap-spec:EventStoreDurability`
      When the traceability index is built
      Then the roadmap spec links forward to the package location
      And the package spec links back to the pattern

    @acceptance-criteria @validation
    Scenario: Orphan executable spec detected
      Given a package spec with `@libar-docs-roadmap-spec:NonExistentPattern`
      When the linter runs
      Then a warning is emitted about orphan executable spec

  # ============================================================================
  # RULE 6: Hierarchy Relationships (parent, level)
  # ============================================================================

  Rule: Epic/Phase/Task hierarchy uses parent-child relationships

    **Invariant:** `@libar-docs-level` declares the hierarchy tier (epic, phase, task).
    `@libar-docs-parent` links to the containing pattern. This enables rollup
    progress tracking.

    **Rationale:** Large initiatives decompose into phases and tasks. The hierarchy
    allows progress aggregation (e.g., "Epic 80% complete based on child phases").

    **Verified by:** Parent link validated, Progress rollup calculated

    @acceptance-criteria @happy-path
    Scenario: Parent link validated
      Given a phase spec with `@libar-docs-parent:ProcessEnhancements`
      And an epic spec with `@libar-docs-pattern:ProcessEnhancements`
      When the hierarchy is validated
      Then the parent link is confirmed valid

    @acceptance-criteria @validation
    Scenario: Invalid parent detected
      Given a task spec with `@libar-docs-parent:NonExistentEpic`
      When the linter runs
      Then an error is emitted about invalid parent reference

  # ============================================================================
  # RULE 7: Relationship Rendering in Generated Docs
  # ============================================================================

  Rule: All relationships appear in generated documentation

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

    @acceptance-criteria @happy-path
    Scenario: Graph uses distinct arrow styles
      Given patterns with `uses`, `depends-on`, `implements`, and `extends` relationships
      When the Mermaid graph is generated
      Then `uses` renders as solid arrows (`-->`)
      And `depends-on` renders as dashed arrows (`-.->`)
      And `implements` renders as dotted arrows (`..->`)
      And `extends` renders as solid open arrows (`-->>`)

    @acceptance-criteria @happy-path
    Scenario: Pattern detail page shows all relationships
      Given a pattern with implementations, dependencies, and tests
      When the pattern detail page is generated
      Then sections appear for "Implementations", "Dependencies", "Used By", "Tests"

  # ============================================================================
  # RULE 8: Linter Validates Relationship Integrity
  # ============================================================================

  Rule: Linter detects relationship violations

    **Invariant:** The pattern linter validates that all relationship targets exist,
    implements files don't have pattern tags, and bidirectional links are consistent.

    **Rationale:** Broken relationships cause confusion and incorrect generated docs.
    Early detection during linting prevents propagation of errors.

    **Verified by:** Missing target detected, Pattern conflict detected, Asymmetric link detected

    @acceptance-criteria @validation
    Scenario: Missing relationship target detected
      Given a file with `@libar-docs-uses:NonExistentPattern`
      When the linter runs with strict mode
      Then a warning is emitted about unresolved relationship target

    @acceptance-criteria @validation
    Scenario: Pattern tag in implements file causes error
      Given a file with both `@libar-docs-implements:X` and `@libar-docs-pattern:X`
      When the linter runs
      Then an error is emitted about conflicting tags
      And the message explains that implements files must not define patterns

    @acceptance-criteria @validation
    Scenario: Asymmetric traceability detected
      Given a roadmap spec with `@libar-docs-executable-specs:path/to/tests`
      And no package spec at that path with `@libar-docs-roadmap-spec` back-link
      When the linter runs with strict mode
      Then a warning is emitted about missing back-link

  # ============================================================================
  # RELATIONSHIP TAXONOMY REFERENCE
  # ============================================================================

  # The following table summarizes all relationship types:
  #
  # | Tag | UML Analog | Direction | Format | Source | Target | Arrow |
  # |-----|------------|-----------|--------|--------|--------|-------|
  # | pattern | Identity | DEFINES | value | Spec | (self) | - |
  # | implements | Realization | CODE→SPEC | csv | TypeScript | Pattern | ..-> |
  # | extends | Generalization | CHILD→PARENT | value | Any | Pattern | -->> |
  # | uses | Dependency | OUT | csv | Any | Pattern | --> |
  # | used-by | Dependency | IN | csv | Any | Pattern | --> |
  # | depends-on | Ordering | SEQUENCE | csv | Spec | Spec | -.-> |
  # | enables | Ordering | SEQUENCE | csv | Spec | Spec | -.-> |
  # | roadmap-spec | Traceability | TEST→SPEC | value | Package | Pattern | - |
  # | executable-specs | Traceability | SPEC→TEST | csv | Roadmap | Package | - |
  # | parent | Composition | CHILD→PARENT | value | Any | Pattern | - |
  # | level | Hierarchy | TIER | enum | Any | (self) | - |
