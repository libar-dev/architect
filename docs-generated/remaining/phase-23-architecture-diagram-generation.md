# ArchitectureDiagramGeneration - Remaining Work

**Purpose:** Detailed remaining work for ArchitectureDiagramGeneration

---

## Summary

**Progress:** [░░░░░░░░░░░░░░░░░░░░] 0/1 (0%)

**Remaining:** 1 patterns (0 active, 1 planned)

---

## ✅ Ready to Start

These patterns can be started immediately:

| Pattern | Effort | Business Value |
| --- | --- | --- |
| 📋 Architecture Diagram Generation | 1w | - |

---

## All Remaining Patterns

### 📋 Architecture Diagram Generation

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 1w |

**Problem:** Architecture documentation requires manually maintaining mermaid diagrams
  that duplicate information already encoded in source code. When code changes,
  diagrams become stale. Manual sync is error-prone and time-consuming.

  **Solution:** Generate architecture diagrams automatically from source code annotations
  using dedicated `arch-*` tags for precise control. Three tags classify components:
  - `@libar-docs-arch-role` - Component type (command-handler, projection, saga, etc.)
  - `@libar-docs-arch-context` - Bounded context for subgraph grouping
  - `@libar-docs-arch-layer` - Architectural layer (domain, application, infrastructure)

  **Why It Matters:**
  | Benefit | How |
  | Always-current diagrams | Generated from source annotations |
  | Bounded context isolation | arch-context groups into subgraphs |
  | Multiple diagram types | Component diagrams + layered diagrams |
  | UML-inspired semantics | Relationship arrows match uses/depends-on/implements/extends |
  | CLI integration | `pnpm docs:architecture` via generator registry |

#### Acceptance Criteria

**Tag registry contains arch-role**

- Given the tag registry is loaded
- When querying for tag "arch-role"
- Then the tag should exist
- And the tag format should be "enum"
- And the tag should have values including "command-handler", "projection", "saga"

**Tag registry contains arch-context**

- Given the tag registry is loaded
- When querying for tag "arch-context"
- Then the tag should exist
- And the tag format should be "value"

**Tag registry contains arch-layer**

- Given the tag registry is loaded
- When querying for tag "arch-layer"
- Then the tag should exist
- And the tag format should be "enum"
- And the tag should have values "domain", "application", "infrastructure"

**Extract arch-role from TypeScript annotation**

- Given TypeScript source with annotation:
- When the AST parser extracts metadata
- Then the directive should have archRole "projection"

```markdown
/**
 * @libar-docs
 * @libar-docs-pattern MyProjection
 * @libar-docs-status completed
 * @libar-docs-arch-role projection
 */
```

**Extract arch-context from TypeScript annotation**

- Given TypeScript source with annotation:
- When the AST parser extracts metadata
- Then the directive should have archContext "orders"

```markdown
/**
 * @libar-docs
 * @libar-docs-pattern OrderHandler
 * @libar-docs-status completed
 * @libar-docs-arch-context orders
 */
```

**Extract arch-layer from TypeScript annotation**

- Given TypeScript source with annotation:
- When the AST parser extracts metadata
- Then the directive should have archLayer "infrastructure"

```markdown
/**
 * @libar-docs
 * @libar-docs-pattern MyInfra
 * @libar-docs-status completed
 * @libar-docs-arch-layer infrastructure
 */
```

**Extract multiple arch tags together**

- Given TypeScript source with annotation:
- When the AST parser extracts metadata
- Then the directive should have archRole "command-handler"
- And the directive should have archContext "orders"
- And the directive should have archLayer "application"

```markdown
/**
 * @libar-docs
 * @libar-docs-pattern OrderCommandHandlers
 * @libar-docs-status completed
 * @libar-docs-arch-role command-handler
 * @libar-docs-arch-context orders
 * @libar-docs-arch-layer application
 */
```

**Missing arch tags yield undefined**

- Given TypeScript source with annotation:
- When the AST parser extracts metadata
- Then the directive should have archRole undefined
- And the directive should have archContext undefined
- And the directive should have archLayer undefined

```markdown
/**
 * @libar-docs
 * @libar-docs-pattern NoArchTags
 * @libar-docs-status completed
 */
```

**archIndex groups patterns by arch-role**

- Given patterns with arch-role annotations:
- When transformToMasterDataset runs
- Then archIndex.byRole["command-handler"] contains 2 patterns
- And archIndex.byRole["projection"] contains 1 pattern

| Pattern | arch-role |
| --- | --- |
| Handler1 | command-handler |
| Handler2 | command-handler |
| Projection1 | projection |

**archIndex groups patterns by arch-context**

- Given patterns with arch-context annotations:
- When transformToMasterDataset runs
- Then archIndex.byContext["orders"] contains 2 patterns
- And archIndex.byContext["inventory"] contains 1 pattern

| Pattern | arch-context |
| --- | --- |
| OrderHandler | orders |
| OrderProjection | orders |
| InventoryHandler | inventory |

**archIndex groups patterns by arch-layer**

- Given patterns with arch-layer annotations:
- When transformToMasterDataset runs
- Then archIndex.byLayer["domain"] contains 1 pattern
- And archIndex.byLayer["application"] contains 1 pattern
- And archIndex.byLayer["infrastructure"] contains 1 pattern

| Pattern | arch-layer |
| --- | --- |
| Decider1 | domain |
| Handler1 | application |
| Infra1 | infrastructure |

**archIndex.all contains all patterns with any arch tag**

- Given patterns:
- When transformToMasterDataset runs
- Then archIndex.all contains 3 patterns
- And archIndex.all does not contain "NoArchTags"

| Pattern | arch-role | arch-context | arch-layer |
| --- | --- | --- | --- |
| WithAll | projection | orders | application |
| WithRole | saga | - | - |
| WithContext | - | inventory | - |
| NoArchTags | - | - | - |

**Generate subgraphs per bounded context**

- Given patterns with arch-context:
- When the component diagram codec runs
- Then output contains subgraph "Orders BC"
- And output contains subgraph "Inventory BC"
- And OrderHandler is inside Orders BC subgraph
- And InventoryHandler is inside Inventory BC subgraph

| Pattern | arch-context | arch-role |
| --- | --- | --- |
| OrderHandler | orders | command-handler |
| OrderProjection | orders | projection |
| InventoryHandler | inventory | command-handler |

**Patterns without arch-context go to Shared Infrastructure**

- Given patterns:
- When the component diagram codec runs
- Then output contains subgraph "Shared Infrastructure"
- And GlobalSaga is inside Shared Infrastructure subgraph
- And CrossContextProjection is inside Shared Infrastructure subgraph

| Pattern | arch-context | arch-role |
| --- | --- | --- |
| OrderHandler | orders | command-handler |
| GlobalSaga | - | saga |
| CrossContextProjection | - | projection |

**Render uses relationship as solid arrow**

- Given patterns with uses relationship:
- When the component diagram codec runs
- Then output contains "SagaA --> HandlerB"

| Pattern | arch-role | uses |
| --- | --- | --- |
| SagaA | saga | HandlerB |
| HandlerB | command-handler | - |

**Render depends-on relationship as dashed arrow**

- Given patterns with depends-on relationship:
- When the component diagram codec runs
- Then output contains "FeatureA -.-> FeatureB"

| Pattern | arch-role | depends-on |
| --- | --- | --- |
| FeatureA | projection | FeatureB |
| FeatureB | projection | - |

**Render implements relationship as dotted arrow**

- Given patterns with implements relationship:
- When the component diagram codec runs
- Then output contains "ConcreteImpl ..-> AbstractSpec"

| Pattern | arch-role | implements |
| --- | --- | --- |
| ConcreteImpl | command-handler | AbstractSpec |
| AbstractSpec | - | - |

**Render extends relationship as open arrow**

- Given patterns with extends relationship:
- When the component diagram codec runs
- Then output contains "SpecializedHandler -->> BaseHandler"

| Pattern | arch-role | extends |
| --- | --- | --- |
| SpecializedHandler | command-handler | BaseHandler |
| BaseHandler | command-handler | - |

**Arrows only render between annotated components**

- Given patterns:
- And UnannotatedB has no arch tags
- When the component diagram codec runs
- Then output does not contain arrow to UnannotatedB

| Pattern | arch-role | uses |
| --- | --- | --- |
| AnnotatedA | saga | UnannotatedB |

**Generate subgraphs per layer**

- Given patterns with arch-layer:
- When the layered diagram codec runs
- Then output contains subgraph "Domain Layer"
- And output contains subgraph "Application Layer"
- And output contains subgraph "Infrastructure Layer"

| Pattern | arch-layer | arch-context |
| --- | --- | --- |
| Decider | domain | orders |
| Handler | application | orders |
| Infra | infrastructure | - |

**Layer order is infrastructure-application-domain**

- Given patterns with all three layers
- When the layered diagram codec runs
- Then Infrastructure Layer appears before Application Layer in output
- And Application Layer appears before Domain Layer in output

**Include context label in node names**

- Given patterns:
- When the layered diagram codec runs
- Then OrderHandler node label includes "(orders)"
- And InventoryHandler node label includes "(inventory)"

| Pattern | arch-layer | arch-context |
| --- | --- | --- |
| OrderHandler | application | orders |
| InventoryHandler | application | inventory |

**Patterns without layer go to Other subgraph**

- Given patterns:
- When the layered diagram codec runs
- Then output contains subgraph "Other"
- And Unlayered is inside Other subgraph

| Pattern | arch-layer | arch-role |
| --- | --- | --- |
| Layered | application | handler |
| Unlayered | - | saga |

**Architecture generator is registered**

- Given the generator registry
- When listing available generators
- Then "architecture" should be in the list

**Generator produces component diagram by default**

- When running generate-docs with --generators architecture
- Then output contains valid mermaid graph TB
- And output contains bounded context subgraphs

**Generator option for layered diagram**

- When running generate-docs with --generators architecture --diagram-type layered
- Then output contains layer subgraphs
- And output follows infrastructure-application-domain order

**Generator option for context filtering**

- When running generate-docs with --generators architecture --contexts orders
- Then output only contains patterns from orders context
- And output does not contain inventory context subgraph

**npm script pnpm docs:architecture works**

- When running `pnpm docs:architecture`
- Then command exits successfully
- And architecture diagram is written to output directory

**Generate command flow sequence diagram**

- Given a command handler pattern with uses relationships
- When the sequence diagram codec runs with command flow template
- Then output contains mermaid sequenceDiagram
- And participants are derived from uses relationships
- And 7-step CommandOrchestrator flow is rendered

**Generate saga flow sequence diagram**

- Given a saga pattern with uses relationships to multiple BCs
- When the sequence diagram codec runs with saga flow template
- Then output contains mermaid sequenceDiagram
- And participants include each bounded context
- And compensation steps are shown

**Participant ordering follows architectural layers**

- Given patterns spanning multiple layers
- When the sequence diagram codec runs
- Then participants are ordered by layer
- And infrastructure layer appears first

#### Business Rules

**Architecture tags exist in the tag registry**

**Invariant:** Three architecture-specific tags (`arch-role`, `arch-context`,
    `arch-layer`) must exist in the tag registry with correct format and enum values.

    **Rationale:** Architecture diagram generation requires metadata to classify
    source files into diagram components. Standard tag infrastructure enables
    consistent extraction via the existing AST parser.

    **Verified by:** Tag registry contains arch-role, Tag registry contains arch-context,
    Tag registry contains arch-layer, arch-role has enum values, arch-layer has enum values

_Verified by: Tag registry contains arch-role, Tag registry contains arch-context, Tag registry contains arch-layer_

**AST parser extracts architecture tags from TypeScript**

**Invariant:** The AST parser must extract `arch-role`, `arch-context`, and
    `arch-layer` tags from TypeScript JSDoc comments into DocDirective objects.

    **Rationale:** Source code annotations are the single source of truth for
    architectural metadata. Parser must extract them alongside existing pattern metadata.

    **Verified by:** Extract arch-role from TypeScript, Extract arch-context from TypeScript,
    Extract arch-layer from TypeScript, Extract all three together

_Verified by: Extract arch-role from TypeScript annotation, Extract arch-context from TypeScript annotation, Extract arch-layer from TypeScript annotation, Extract multiple arch tags together, Missing arch tags yield undefined_

**MasterDataset builds archIndex during transformation**

**Invariant:** The `transformToMasterDataset` function must build an `archIndex`
    that groups patterns by role, context, and layer for efficient diagram generation.

    **Rationale:** Single-pass extraction during dataset transformation avoids
    expensive re-traversal. Index structure enables O(1) lookup by each dimension.

    **Verified by:** archIndex groups by role, archIndex groups by context,
    archIndex groups by layer, archIndex.all contains all arch-annotated patterns

_Verified by: archIndex groups patterns by arch-role, archIndex groups patterns by arch-context, archIndex groups patterns by arch-layer, archIndex.all contains all patterns with any arch tag_

**Component diagrams group patterns by bounded context**

**Invariant:** Component diagrams must render patterns as nodes grouped into
    bounded context subgraphs, with relationship arrows using UML-inspired styles.

    **Rationale:** Component diagrams visualize system architecture showing how
    bounded contexts isolate components. Subgraphs enforce visual separation.

    **Verified by:** Generate subgraphs per bounded context, Group context-less patterns
    in Shared Infrastructure, Render uses as solid arrow, Render depends-on as dashed arrow

_Verified by: Generate subgraphs per bounded context, Patterns without arch-context go to Shared Infrastructure, Render uses relationship as solid arrow, Render depends-on relationship as dashed arrow, Render implements relationship as dotted arrow, Render extends relationship as open arrow, Arrows only render between annotated components_

**Layered diagrams group patterns by architectural layer**

**Invariant:** Layered diagrams must render patterns grouped by architectural
    layer (domain, application, infrastructure) with top-to-bottom flow.

    **Rationale:** Layered architecture visualization shows dependency direction -
    infrastructure at top, domain at bottom - following conventional layer ordering.

    **Verified by:** Generate subgraphs per layer, Layer order is infrastructure-application-domain,
    Include context label in node names

_Verified by: Generate subgraphs per layer, Layer order is infrastructure-application-domain, Include context label in node names, Patterns without layer go to Other subgraph_

**Architecture generator is registered with generator registry**

**Invariant:** An "architecture" generator must be registered with the generator
    registry to enable `pnpm docs:architecture` via the existing `generate-docs.js` CLI.

    **Rationale:** The delivery-process uses a generator registry pattern. New
    generators register with the orchestrator rather than creating separate CLI commands.

    **Verified by:** Generator is registered, Generator produces component diagram,
    Generator produces layered diagram, npm script works

_Verified by: Architecture generator is registered, Generator produces component diagram by default, Generator option for layered diagram, Generator option for context filtering, npm script pnpm docs:architecture works_

**Sequence diagrams render interaction flows**

**Invariant:** Sequence diagrams must render interaction flows (command flow,
    saga flow) showing step-by-step message passing between components.

    **Rationale:** Component diagrams show structure but not behavior. Sequence
    diagrams show runtime flow - essential for understanding command/saga execution.

    **Verified by:** Generate command flow sequence, Generate saga flow sequence

_Verified by: Generate command flow sequence diagram, Generate saga flow sequence diagram, Participant ordering follows architectural layers_

---

[← Back to Remaining Work](../REMAINING-WORK.md)
