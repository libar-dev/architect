@libar-docs
@libar-docs-pattern:ArchTagExtraction
@libar-docs-status:completed
@libar-docs-implements:ArchitectureDiagramGeneration
@libar-docs-product-area:Generation
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

    Context tags group components into bounded context subgraphs.
    Format is "value" (free-form string like "orders", "inventory").

    @acceptance-criteria @happy-path
    Scenario: arch-context tag exists with value format
      When querying for tag "arch-context"
      Then the tag should exist
      And the tag format should be "value"
      And the tag purpose should mention "bounded context"

  Rule: arch-layer tag is defined in the registry

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

    The AST parser must extract arch-role alongside other pattern metadata.

    @acceptance-criteria @happy-path
    Scenario: Extract arch-role projection
      Given TypeScript source:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern MyProjection
         * @libar-docs-status completed
         * @libar-docs-arch-role projection
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
         * @libar-docs
         * @libar-docs-pattern MyHandler
         * @libar-docs-status completed
         * @libar-docs-arch-role command-handler
         */
        export const myHandler = {};
        """
      When the AST parser extracts the directive
      Then the directive archRole should be "command-handler"

  Rule: AST parser extracts arch-context from TypeScript annotations

    Context values are free-form strings naming the bounded context.

    @acceptance-criteria @happy-path
    Scenario: Extract arch-context orders
      Given TypeScript source:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern OrderHandler
         * @libar-docs-status completed
         * @libar-docs-arch-context orders
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
         * @libar-docs
         * @libar-docs-pattern InventoryHandler
         * @libar-docs-status completed
         * @libar-docs-arch-context inventory
         */
        export const inventoryHandler = {};
        """
      When the AST parser extracts the directive
      Then the directive archContext should be "inventory"

  Rule: AST parser extracts arch-layer from TypeScript annotations

    Layer tags classify components by architectural layer.

    @acceptance-criteria @happy-path
    Scenario: Extract arch-layer application
      Given TypeScript source:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern MyService
         * @libar-docs-status completed
         * @libar-docs-arch-layer application
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
         * @libar-docs
         * @libar-docs-pattern MyInfra
         * @libar-docs-status completed
         * @libar-docs-arch-layer infrastructure
         */
        export const myInfra = {};
        """
      When the AST parser extracts the directive
      Then the directive archLayer should be "infrastructure"

  Rule: AST parser handles multiple arch tags together

    Components often have role + context + layer together.

    @acceptance-criteria @happy-path
    Scenario: Extract all three arch tags
      Given TypeScript source:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern OrderCommandHandlers
         * @libar-docs-status completed
         * @libar-docs-arch-role command-handler
         * @libar-docs-arch-context orders
         * @libar-docs-arch-layer application
         */
        export const orderCommandHandlers = {};
        """
      When the AST parser extracts the directive
      Then the directive archRole should be "command-handler"
      And the directive archContext should be "orders"
      And the directive archLayer should be "application"

  Rule: Missing arch tags yield undefined values

    Components without arch tags should have undefined (not null or empty).

    @acceptance-criteria @validation
    Scenario: Missing arch tags are undefined
      Given TypeScript source:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern NoArchTags
         * @libar-docs-status completed
         */
        export const noArchTags = {};
        """
      When the AST parser extracts the directive
      Then the directive archRole should be undefined
      And the directive archContext should be undefined
      And the directive archLayer should be undefined
