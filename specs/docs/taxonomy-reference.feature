@libar-docs
@libar-docs-pattern:TaxonomyReference
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-core
@libar-docs-taxonomy
@libar-docs-claude-md-section:taxonomy
Feature: Taxonomy Reference - Auto-Generated Documentation

  **Problem:**
  The taxonomy defines the vocabulary for pattern annotations: what tags exist,
  their valid values, and how they are parsed. Developers need quick access to
  format types, categories, status values, and presets. Maintaining this
  documentation manually leads to drift from actual implementation.

  **Solution:**
  Auto-generate the Taxonomy reference documentation from annotated source code.
  The TypeScript source files in src/taxonomy/ define all taxonomy components.
  Documentation becomes a projection of the implementation, always in sync.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/TAXONOMYREFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/taxonomy/taxonomyreference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Concept | THIS DECISION (Rule: Concept) | Rule block content |
| Format Types | src/taxonomy/format-types.ts | @extract-shapes tag |
| Categories | src/taxonomy/categories.ts | @extract-shapes tag |
| Status Values | src/taxonomy/status-values.ts | @extract-shapes tag |
| Status FSM | THIS DECISION (Rule: Status Values) | Mermaid diagram |
| Normalized Status | src/taxonomy/normalized-status.ts | @extract-shapes tag |
| Hierarchy Levels | src/taxonomy/hierarchy-levels.ts | @extract-shapes tag |
| Risk Levels | src/taxonomy/risk-levels.ts | @extract-shapes tag |
| Layer Types | src/taxonomy/layer-types.ts | @extract-shapes tag |
| TagRegistry | src/taxonomy/registry-builder.ts | @extract-shapes tag |
| Presets | THIS DECISION (Rule: Presets) | Rule block table |
| Architecture | THIS DECISION (Rule: Architecture) | Fenced code block |
| Tag Generation | THIS DECISION (Rule: Tag Generation) | Rule block content |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Taxonomy reference feature file | Complete | specs/docs/taxonomy-reference.feature |
      | Source annotations added | Complete | src/taxonomy/*.ts |
      | Generated detailed docs | Pending | docs-generated/docs/TAXONOMYREFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/taxonomy/taxonomyreference.md |

  Rule: Concept

    **Context:** A taxonomy is a classification system for organizing knowledge.

    **Definition:** In delivery-process, the taxonomy defines the vocabulary for
    pattern annotations. It determines what tags exist, their valid values, and
    how they are parsed from source code.

    **Components:**

| Component | Purpose | Source File |
| --- | --- | --- |
| Categories | Domain classifications (e.g., core, api, ddd) | categories.ts |
| Status Values | FSM states (roadmap, active, completed, deferred) | status-values.ts |
| Format Types | How tag values are parsed (flag, csv, enum) | format-types.ts |
| Hierarchy Levels | Work item levels (epic, phase, task) | hierarchy-levels.ts |
| Risk Levels | Risk assessment (low, medium, high) | risk-levels.ts |
| Layer Types | Feature layer (timeline, domain, integration) | layer-types.ts |

    **Key Principle:** The taxonomy is NOT a fixed schema. Presets select
    different subsets, and you can define custom categories.

  Rule: Format Types

    **Context:** Tags have different value formats that determine parsing.

    **Decision:** Six format types are supported. See `src/taxonomy/format-types.ts`
    for the canonical `FORMAT_TYPES` array with inline documentation.

    **Implementation:** The format type is specified in the tag definition
    within the TagRegistry. The extractor uses the format to parse values.

  Rule: Status Values

    **Context:** Status values control the FSM workflow for pattern lifecycle.

    **Decision:** Four canonical status values are defined (per PDR-005).
    See `src/taxonomy/status-values.ts` for the `PROCESS_STATUS_VALUES` array
    with inline documentation on FSM transitions and protection levels.

    **FSM Diagram:**

    """mermaid
    stateDiagram-v2
        [*] --> roadmap
        roadmap --> active : Start work
        roadmap --> deferred : Postpone
        active --> completed : Finish
        active --> roadmap : Regress
        deferred --> roadmap : Resume
        completed --> [*]

        note right of completed : Hard-locked
        note right of active : Scope-locked
    """

  Rule: Normalized Status

    **Context:** Display requires mapping 4 FSM states to 3 presentation buckets.

    **Decision:** Raw status values normalize to display status.
    See `src/taxonomy/normalized-status.ts` for the `STATUS_NORMALIZATION_MAP`
    and `normalizeStatus()` function with complete mapping logic.

    **Rationale:** This separation follows DDD principles - the domain model
    (raw FSM states) is distinct from the view model (normalized display).

  Rule: Presets

    **Context:** Different projects need different taxonomy subsets.

    **Decision:** Three presets are available:

| Preset | Categories | Tag Prefix | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | 3 | @libar-docs- | Simple projects (this package) |
| ddd-es-cqrs | 21 | @libar-docs- | DDD/Event Sourcing architectures |
| generic | 3 | @docs- | Simple projects with @docs- prefix |

    **Behavior:** The preset determines which categories are available.
    All presets share the same status values and format types.

  Rule: Hierarchy Levels

    **Context:** Work items need hierarchical breakdown for planning.

    **Decision:** Three hierarchy levels are defined (epic, phase, task).
    See `src/taxonomy/hierarchy-levels.ts` for the `HIERARCHY_LEVELS` array
    with JSDoc documentation on duration guidelines and usage.

    **Usage:** The level tag organizes work for roadmap generation.
    Phases can have a parent epic; tasks can have a parent phase.

  Rule: Architecture

    **Context:** The taxonomy module structure supports the type-safe annotation system.

    **File Structure:**

    """
    src/taxonomy/
      registry-builder.ts   -- buildRegistry() - creates TagRegistry
      categories.ts         -- Category definitions
      status-values.ts      -- FSM state values (PDR-005)
      normalized-status.ts  -- Display normalization (3 buckets)
      format-types.ts       -- Tag value parsing rules
      hierarchy-levels.ts   -- epic/phase/task
      risk-levels.ts        -- low/medium/high
      layer-types.ts        -- timeline/domain/integration/e2e
    """

    **TagRegistry:** The buildRegistry() function creates a TagRegistry
    containing all taxonomy definitions. It is THE single source of truth.

    **Usage Example:**

    """typescript
    import { buildRegistry } from '@libar-dev/delivery-process/taxonomy';

    const registry = buildRegistry();
    // registry.tagPrefix       -> "@libar-docs-"
    // registry.fileOptInTag    -> "@libar-docs"
    // registry.categories      -> CategoryDefinition[]
    // registry.metadataTags    -> MetadataTagDefinitionForRegistry[]
    """

  Rule: Tag Generation

    **Context:** Developers need a reference of all available tags.

    **Decision:** The generate-tag-taxonomy CLI creates a markdown reference:

    """bash
    npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f
    """

    **Output:** A markdown file documenting all tags with their formats,
    valid values, and examples - generated from the TagRegistry.

  @acceptance-criteria
  Scenario: Reference generates Taxonomy documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with all taxonomy components
    And compact docs are generated with essential reference
    And TypeScript types are extracted from source files
    And format types table is included
    And presets table is included
    And status values table is included
