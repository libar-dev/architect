@libar-docs
@libar-docs-pattern:ArchitectureDiagramCore
@libar-docs-status:roadmap
@libar-docs-phase:23
@libar-docs-effort:1w
@libar-docs-product-area:Generation
@libar-docs-executable-specs:tests/features/behavior/architecture-diagrams
Feature: Architecture Diagram Generation - Core

  **Problem:** Architecture documentation requires manually maintaining mermaid diagrams
  that duplicate information already encoded in source code. When code changes,
  diagrams become stale. Manual sync is error-prone and time-consuming.

  **Solution:** Generate architecture diagrams automatically from source code annotations
  using dedicated `arch-*` tags for precise control. Three tags classify components:
  - `@libar-docs-arch-role` - Component type (preset-configurable: service, handler, repository, etc.)
  - `@libar-docs-arch-context` - Bounded context for subgraph grouping
  - `@libar-docs-arch-layer` - Architectural layer (domain, application, infrastructure)

  **Why It Matters:**
  | Benefit | How |
  | Always-current diagrams | Generated from source annotations |
  | Bounded context isolation | arch-context groups into subgraphs |
  | Multiple diagram types | Component diagrams + layered diagrams |
  | UML-inspired semantics | Relationship arrows match uses/depends-on/implements/extends |
  | CLI integration | `pnpm docs:architecture` via generator registry |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | arch-role tag definition | complete | taxonomy/registry-builder.ts | Yes | unit |
      | arch-context tag definition | complete | taxonomy/registry-builder.ts | Yes | unit |
      | arch-layer tag definition | complete | taxonomy/registry-builder.ts | Yes | unit |
      | DocDirective schema fields | complete | validation-schemas/doc-directive.ts | Yes | unit |
      | ExtractedPattern schema fields | complete | validation-schemas/extracted-pattern.ts | Yes | unit |
      | AST parser tag extraction | complete | scanner/ast-parser.ts | Yes | unit |
      | MasterDataset archIndex | complete | generators/pipeline/transform-dataset.ts | Yes | unit |
      | ArchitectureCodec (component) | complete | renderable/codecs/architecture.ts | Yes | unit |

  # ============================================================================
  # RULE 1: Architecture Tags in Registry
  # ============================================================================

  Rule: Architecture tags exist in the tag registry

    **Invariant:** Three architecture-specific tags (`arch-role`, `arch-context`,
    `arch-layer`) must exist in the tag registry with correct format and enum values.

    **Rationale:** Architecture diagram generation requires metadata to classify
    source files into diagram components. Standard tag infrastructure enables
    consistent extraction via the existing AST parser.

    **Note:** The `arch-role` enum values are configurable via presets:
    - `libar-generic` preset: generic roles (`service`, `repository`, `handler`, `infrastructure`)
    - `ddd-es-cqrs` preset: DDD-specific roles (`command-handler`, `projection`, `saga`, etc.)

    **Verified by:** Tag registry contains arch-role, Tag registry contains arch-context,
    Tag registry contains arch-layer, arch-role has enum values, arch-layer has enum values

    @acceptance-criteria @happy-path
    Scenario: Tag registry contains arch-role
      Given the tag registry is loaded
      When querying for tag "arch-role"
      Then the tag should exist
      And the tag format should be "enum"
      And the tag should have values including "service", "repository", "infrastructure"

    @acceptance-criteria @happy-path
    Scenario: Tag registry contains arch-context
      Given the tag registry is loaded
      When querying for tag "arch-context"
      Then the tag should exist
      And the tag format should be "value"

    @acceptance-criteria @happy-path
    Scenario: Tag registry contains arch-layer
      Given the tag registry is loaded
      When querying for tag "arch-layer"
      Then the tag should exist
      And the tag format should be "enum"
      And the tag should have values "domain", "application", "infrastructure"

  # ============================================================================
  # RULE 2: AST Parser Extraction
  # ============================================================================

  Rule: AST parser extracts architecture tags from TypeScript

    **Invariant:** The AST parser must extract `arch-role`, `arch-context`, and
    `arch-layer` tags from TypeScript JSDoc comments into DocDirective objects.

    **Rationale:** Source code annotations are the single source of truth for
    architectural metadata. Parser must extract them alongside existing pattern metadata.

    **Verified by:** Extract arch-role from TypeScript, Extract arch-context from TypeScript,
    Extract arch-layer from TypeScript, Extract all three together

    @acceptance-criteria @happy-path
    Scenario: Extract arch-role from TypeScript annotation
      Given TypeScript source with annotation:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern MyProjection
         * @libar-docs-status completed
         * @libar-docs-arch-role projection
         */
        """
      When the AST parser extracts metadata
      Then the directive should have archRole "projection"

    @acceptance-criteria @happy-path
    Scenario: Extract arch-context from TypeScript annotation
      Given TypeScript source with annotation:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern OrderHandler
         * @libar-docs-status completed
         * @libar-docs-arch-context orders
         */
        """
      When the AST parser extracts metadata
      Then the directive should have archContext "orders"

    @acceptance-criteria @happy-path
    Scenario: Extract arch-layer from TypeScript annotation
      Given TypeScript source with annotation:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern MyInfra
         * @libar-docs-status completed
         * @libar-docs-arch-layer infrastructure
         */
        """
      When the AST parser extracts metadata
      Then the directive should have archLayer "infrastructure"

    @acceptance-criteria @happy-path
    Scenario: Extract multiple arch tags together
      Given TypeScript source with annotation:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern OrderCommandHandlers
         * @libar-docs-status completed
         * @libar-docs-arch-role command-handler
         * @libar-docs-arch-context orders
         * @libar-docs-arch-layer application
         */
        """
      When the AST parser extracts metadata
      Then the directive should have archRole "command-handler"
      And the directive should have archContext "orders"
      And the directive should have archLayer "application"

    @acceptance-criteria @validation
    Scenario: Missing arch tags yield undefined
      Given TypeScript source with annotation:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern NoArchTags
         * @libar-docs-status completed
         */
        """
      When the AST parser extracts metadata
      Then the directive should have archRole undefined
      And the directive should have archContext undefined
      And the directive should have archLayer undefined

  # ============================================================================
  # RULE 3: MasterDataset ArchIndex
  # ============================================================================

  Rule: MasterDataset builds archIndex during transformation

    **Invariant:** The `transformToMasterDataset` function must build an `archIndex`
    that groups patterns by role, context, and layer for efficient diagram generation.

    **Rationale:** Single-pass extraction during dataset transformation avoids
    expensive re-traversal. Index structure enables O(1) lookup by each dimension.

    **Verified by:** archIndex groups by role, archIndex groups by context,
    archIndex groups by layer, archIndex.all contains all arch-annotated patterns

    @acceptance-criteria @happy-path
    Scenario: archIndex groups patterns by arch-role
      Given patterns with arch-role annotations:
        | Pattern | arch-role |
        | Handler1 | command-handler |
        | Handler2 | command-handler |
        | Projection1 | projection |
      When transformToMasterDataset runs
      Then archIndex.byRole["command-handler"] contains 2 patterns
      And archIndex.byRole["projection"] contains 1 pattern

    @acceptance-criteria @happy-path
    Scenario: archIndex groups patterns by arch-context
      Given patterns with arch-context annotations:
        | Pattern | arch-context |
        | OrderHandler | orders |
        | OrderProjection | orders |
        | InventoryHandler | inventory |
      When transformToMasterDataset runs
      Then archIndex.byContext["orders"] contains 2 patterns
      And archIndex.byContext["inventory"] contains 1 pattern

    @acceptance-criteria @happy-path
    Scenario: archIndex groups patterns by arch-layer
      Given patterns with arch-layer annotations:
        | Pattern | arch-layer |
        | Decider1 | domain |
        | Handler1 | application |
        | Infra1 | infrastructure |
      When transformToMasterDataset runs
      Then archIndex.byLayer["domain"] contains 1 pattern
      And archIndex.byLayer["application"] contains 1 pattern
      And archIndex.byLayer["infrastructure"] contains 1 pattern

    @acceptance-criteria @happy-path
    Scenario: archIndex.all contains all patterns with any arch tag
      Given patterns:
        | Pattern | arch-role | arch-context | arch-layer |
        | WithAll | projection | orders | application |
        | WithRole | saga | - | - |
        | WithContext | - | inventory | - |
        | NoArchTags | - | - | - |
      When transformToMasterDataset runs
      Then archIndex.all contains 3 patterns
      And archIndex.all does not contain "NoArchTags"

  # ============================================================================
  # RULE 4: Component Diagram Generation
  # ============================================================================

  Rule: Component diagrams group patterns by bounded context

    **Invariant:** Component diagrams must render patterns as nodes grouped into
    bounded context subgraphs, with relationship arrows using UML-inspired styles.

    **Rationale:** Component diagrams visualize system architecture showing how
    bounded contexts isolate components. Subgraphs enforce visual separation.

    **Verified by:** Generate subgraphs per bounded context, Group context-less patterns
    in Shared Infrastructure, Render uses as solid arrow, Render depends-on as dashed arrow

    @acceptance-criteria @happy-path
    Scenario: Generate subgraphs per bounded context
      Given patterns with arch-context:
        | Pattern | arch-context | arch-role |
        | OrderHandler | orders | command-handler |
        | OrderProjection | orders | projection |
        | InventoryHandler | inventory | command-handler |
      When the component diagram codec runs
      Then output contains subgraph "Orders BC"
      And output contains subgraph "Inventory BC"
      And OrderHandler is inside Orders BC subgraph
      And InventoryHandler is inside Inventory BC subgraph

    @acceptance-criteria @happy-path
    Scenario: Patterns without arch-context go to Shared Infrastructure
      Given patterns:
        | Pattern | arch-context | arch-role |
        | OrderHandler | orders | command-handler |
        | GlobalSaga | - | saga |
        | CrossContextProjection | - | projection |
      When the component diagram codec runs
      Then output contains subgraph "Shared Infrastructure"
      And GlobalSaga is inside Shared Infrastructure subgraph
      And CrossContextProjection is inside Shared Infrastructure subgraph

    @acceptance-criteria @happy-path
    Scenario: Render uses relationship as solid arrow
      Given patterns with uses relationship:
        | Pattern | arch-role | uses |
        | SagaA | saga | HandlerB |
        | HandlerB | command-handler | - |
      When the component diagram codec runs
      Then output contains "SagaA --> HandlerB"

    @acceptance-criteria @happy-path
    Scenario: Render depends-on relationship as dashed arrow
      Given patterns with depends-on relationship:
        | Pattern | arch-role | depends-on |
        | FeatureA | projection | FeatureB |
        | FeatureB | projection | - |
      When the component diagram codec runs
      Then output contains "FeatureA -.-> FeatureB"

    @acceptance-criteria @happy-path
    Scenario: Render implements relationship as dotted arrow
      Given patterns with implements relationship:
        | Pattern | arch-role | implements |
        | ConcreteImpl | command-handler | AbstractSpec |
        | AbstractSpec | - | - |
      When the component diagram codec runs
      Then output contains "ConcreteImpl ..-> AbstractSpec"

    @acceptance-criteria @happy-path
    Scenario: Render extends relationship as open arrow
      Given patterns with extends relationship:
        | Pattern | arch-role | extends |
        | SpecializedHandler | command-handler | BaseHandler |
        | BaseHandler | command-handler | - |
      When the component diagram codec runs
      Then output contains "SpecializedHandler -->> BaseHandler"

    @acceptance-criteria @validation
    Scenario: Arrows only render between annotated components
      Given patterns:
        | Pattern | arch-role | uses |
        | AnnotatedA | saga | UnannotatedB |
      And UnannotatedB has no arch tags
      When the component diagram codec runs
      Then output does not contain arrow to UnannotatedB
