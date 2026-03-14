@architect
@architect-pattern:ArchTagExtraction
@architect-status:completed
@architect-implements:ArchitectureDiagramGeneration
@architect-product-area:Generation
@architecture
Feature: Architecture Tag Extraction

  As a documentation generator
  I want architecture tags extracted from source code
  So that I can generate accurate architecture diagrams

  Background: Tag registry setup
    Given the tag registry is loaded with architecture tags

  # ============================================================================
  # Tag Registry Rules
  # ============================================================================

  Rule: arch-role tag is defined in the registry

    **Invariant:** The tag registry must contain an arch-role tag with enum format and all valid architectural role values.
    **Rationale:** Without a registry-defined arch-role tag, the extractor cannot validate role values and diagrams may render invalid roles.
    **Verified by:** arch-role tag exists with enum format, arch-role has required enum values

    Architecture roles classify components for diagram rendering.
    Valid roles: command-handler, projection, saga, process-manager,
    infrastructure, repository, decider, read-model, bounded-context.

    @acceptance-criteria @happy-path
    Scenario: arch-role tag exists with enum format
      When querying for tag "arch-role"
      Then the tag should exist
      And the tag format should be "enum"
      And the tag purpose should mention "diagram"

    @acceptance-criteria @happy-path
    Scenario: arch-role has required enum values
      When querying for tag "arch-role"
      Then the tag values should include "command-handler"
      And the tag values should include "projection"
      And the tag values should include "saga"
      And the tag values should include "infrastructure"

  Rule: arch-context tag is defined in the registry

    **Invariant:** The tag registry must contain an arch-context tag with value format for free-form bounded context names.
    **Rationale:** Without a registry-defined arch-context tag, bounded context groupings cannot be validated and diagrams may contain arbitrary context names.
    **Verified by:** arch-context tag exists with value format

    Context tags group components into bounded context subgraphs.
    Format is "value" (free-form string like "orders", "inventory").

    @acceptance-criteria @happy-path
    Scenario: arch-context tag exists with value format
      When querying for tag "arch-context"
      Then the tag should exist
      And the tag format should be "value"
      And the tag purpose should mention "bounded context"

  Rule: arch-layer tag is defined in the registry

    **Invariant:** The tag registry must contain an arch-layer tag with enum format and exactly three values: domain, application, infrastructure.
    **Rationale:** Allowing arbitrary layer values would break the fixed Clean Architecture ordering that layered diagrams depend on.
    **Verified by:** arch-layer tag exists with enum format, arch-layer has exactly three values

    Layer tags enable layered architecture diagrams.
    Valid layers: domain, application, infrastructure.

    @acceptance-criteria @happy-path
    Scenario: arch-layer tag exists with enum format
      When querying for tag "arch-layer"
      Then the tag should exist
      And the tag format should be "enum"

    @acceptance-criteria @happy-path
    Scenario: arch-layer has exactly three values
      When querying for tag "arch-layer"
      Then the tag values should include "domain"
      And the tag values should include "application"
      And the tag values should include "infrastructure"
      And the tag values count should be 3

  # ============================================================================
  # AST Parser Extraction Rules
  # ============================================================================

  Rule: AST parser extracts arch-role from TypeScript annotations

    **Invariant:** The AST parser must extract the arch-role value from JSDoc annotations and populate the directive's archRole field.
    **Rationale:** If arch-role is not extracted, patterns cannot be classified by architectural role and diagram node styling is lost.
    **Verified by:** Extract arch-role projection, Extract arch-role command-handler

    The AST parser must extract arch-role alongside other pattern metadata.

    @acceptance-criteria @happy-path
    Scenario: Extract arch-role projection
      Given TypeScript source:
        """typescript
        /**
         * @architect
         * @architect-pattern MyProjection
         * @architect-status completed
         * @architect-arch-role projection
         */
        export const myProjection = {};
        """
      When the AST parser extracts the directive
      Then the directive archRole should be "projection"

    @acceptance-criteria @happy-path
    Scenario: Extract arch-role command-handler
      Given TypeScript source:
        """typescript
        /**
         * @architect
         * @architect-pattern MyHandler
         * @architect-status completed
         * @architect-arch-role command-handler
         */
        export const myHandler = {};
        """
      When the AST parser extracts the directive
      Then the directive archRole should be "command-handler"

  Rule: AST parser extracts arch-context from TypeScript annotations

    **Invariant:** The AST parser must extract the arch-context value from JSDoc annotations and populate the directive's archContext field.
    **Rationale:** If arch-context is not extracted, component diagrams cannot group patterns into bounded context subgraphs.
    **Verified by:** Extract arch-context orders, Extract arch-context inventory

    Context values are free-form strings naming the bounded context.

    @acceptance-criteria @happy-path
    Scenario: Extract arch-context orders
      Given TypeScript source:
        """typescript
        /**
         * @architect
         * @architect-pattern OrderHandler
         * @architect-status completed
         * @architect-arch-context orders
         */
        export const orderHandler = {};
        """
      When the AST parser extracts the directive
      Then the directive archContext should be "orders"

    @acceptance-criteria @happy-path
    Scenario: Extract arch-context inventory
      Given TypeScript source:
        """typescript
        /**
         * @architect
         * @architect-pattern InventoryHandler
         * @architect-status completed
         * @architect-arch-context inventory
         */
        export const inventoryHandler = {};
        """
      When the AST parser extracts the directive
      Then the directive archContext should be "inventory"

  Rule: AST parser extracts arch-layer from TypeScript annotations

    **Invariant:** The AST parser must extract the arch-layer value from JSDoc annotations and populate the directive's archLayer field.
    **Rationale:** If arch-layer is not extracted, layered diagrams cannot group patterns into domain/application/infrastructure subgraphs.
    **Verified by:** Extract arch-layer application, Extract arch-layer infrastructure

    Layer tags classify components by architectural layer.

    @acceptance-criteria @happy-path
    Scenario: Extract arch-layer application
      Given TypeScript source:
        """typescript
        /**
         * @architect
         * @architect-pattern MyService
         * @architect-status completed
         * @architect-arch-layer application
         */
        export const myService = {};
        """
      When the AST parser extracts the directive
      Then the directive archLayer should be "application"

    @acceptance-criteria @happy-path
    Scenario: Extract arch-layer infrastructure
      Given TypeScript source:
        """typescript
        /**
         * @architect
         * @architect-pattern MyInfra
         * @architect-status completed
         * @architect-arch-layer infrastructure
         */
        export const myInfra = {};
        """
      When the AST parser extracts the directive
      Then the directive archLayer should be "infrastructure"

  Rule: AST parser handles multiple arch tags together

    **Invariant:** When a JSDoc block contains arch-role, arch-context, and arch-layer tags, all three must be extracted into the directive.
    **Rationale:** Partial extraction would cause components to be missing from role, context, or layer groupings depending on which tag was dropped.
    **Verified by:** Extract all three arch tags

    Components often have role + context + layer together.

    @acceptance-criteria @happy-path
    Scenario: Extract all three arch tags
      Given TypeScript source:
        """typescript
        /**
         * @architect
         * @architect-pattern OrderCommandHandlers
         * @architect-status completed
         * @architect-arch-role command-handler
         * @architect-arch-context orders
         * @architect-arch-layer application
         */
        export const orderCommandHandlers = {};
        """
      When the AST parser extracts the directive
      Then the directive archRole should be "command-handler"
      And the directive archContext should be "orders"
      And the directive archLayer should be "application"

  Rule: Missing arch tags yield undefined values

    **Invariant:** Arch tag fields absent from a JSDoc block must be undefined in the extracted directive, not null or empty string.
    **Rationale:** Downstream consumers distinguish between "not annotated" (undefined) and "annotated with empty value" to avoid rendering ghost nodes.
    **Verified by:** Missing arch tags are undefined

    Components without arch tags should have undefined (not null or empty).

    @acceptance-criteria @validation
    Scenario: Missing arch tags are undefined
      Given TypeScript source:
        """typescript
        /**
         * @architect
         * @architect-pattern NoArchTags
         * @architect-status completed
         */
        export const noArchTags = {};
        """
      When the AST parser extracts the directive
      Then the directive archRole should be undefined
      And the directive archContext should be undefined
      And the directive archLayer should be undefined
