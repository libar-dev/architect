@libar-docs
@libar-docs-pattern:TypeScriptTaxonomyImplementation
@libar-docs-status:completed
@libar-docs-phase:99
@libar-docs-effort:4h
@libar-docs-business-value:compile-time-taxonomy-protection
@libar-docs-product-area:Taxonomy
@libar-docs-user-role:Developer
Feature: TypeScript Taxonomy Implementation

  As a delivery-process developer
  I want taxonomy defined in TypeScript with Zod integration
  So that I get compile-time safety and runtime validation

  **Note (D12):** Implementation uses TypeScript as the single source of truth,
  with consumers importing directly rather than generating intermediate JSON files.

  Background: Definition of Done
    Given the following deliverables are complete:
      | Deliverable               | Status | Location                               |
      | Status values constants   | done   | src/taxonomy/status-values.ts          |
      | Format types constants    | done   | src/taxonomy/format-types.ts           |
      | Category definitions      | done   | src/taxonomy/categories.ts             |
      | Metadata tag definitions  | done   | src/taxonomy/registry-builder.ts       |
      | Registry builder          | done   | src/taxonomy/registry-builder.ts       |
      | Updated Zod schemas       | done   | src/validation-schemas/tag-registry.ts |
    And the following acceptance criteria are verified:
      | Scenario                              | Status |
      | Constants provide compile-time safety | done   |
      | Zod schemas use TypeScript constants  | done   |
      | Existing consumers work unchanged     | done   |

  # ─────────────────────────────────────────────────────────────────────────────
  # Status Values
  # ─────────────────────────────────────────────────────────────────────────────

  @happy-path
  Scenario: Define status values as TypeScript constant
    Given a file "src/taxonomy/status-values.ts"
    When I define the status values
    Then it exports PROCESS_STATUS_VALUES as const array
    And it exports ProcessStatusValue type inferred from the array
    And Zod schemas use z.enum() with the constant

  Scenario: Invalid status value caught at compile time
    Given code that uses ProcessStatusValue type
    When I assign an invalid value like "draft"
    Then TypeScript compilation fails
    And the error message shows valid options

  Scenario: Status values match registry purpose
    Given the package-level taxonomy
    Then PROCESS_STATUS_VALUES contains ["roadmap", "active", "completed", "deferred"]
    And ACCEPTED_STATUS_VALUES includes legacy values for backward compatibility
    And the repo-level taxonomy follows PDR-005 FSM

  # ─────────────────────────────────────────────────────────────────────────────
  # Format Types
  # ─────────────────────────────────────────────────────────────────────────────

  Scenario: Define format types as TypeScript constant
    Given a file "src/taxonomy/format-types.ts"
    When I define the format types
    Then it exports FORMAT_TYPES as const array
    """
    ["value", "enum", "quoted-value", "csv", "number", "flag"]
    """
    And it exports FormatType type

  # ─────────────────────────────────────────────────────────────────────────────
  # Category Definitions
  # ─────────────────────────────────────────────────────────────────────────────

  Scenario: Define categories as typed array
    Given a file "src/taxonomy/categories.ts"
    When I define the default categories
    Then each category has tag, domain, priority, description, aliases
    And categories are typed as CategoryDefinition[]
    And category tags can be extracted as a union type (CategoryTag)

  Scenario: Category satisfies CategoryDefinitionSchema
    Given a category definition in TypeScript
    When validated against CategoryDefinitionSchema
    Then it passes runtime validation
    And the TypeScript type matches the Zod inference

  # ─────────────────────────────────────────────────────────────────────────────
  # Metadata Tag Definitions
  # ─────────────────────────────────────────────────────────────────────────────

  Scenario: Define metadata tags with typed format
    Given the registry-builder.ts file
    When I define a metadata tag with format "enum"
    Then the values property is provided
    And the values reference TypeScript constants
    And TypeScript enforces type consistency

  Scenario: Metadata tag with invalid format rejected
    Given a metadata tag definition
    When format is "enum" but values is missing
    Then Zod runtime validation fails
    And TypeScript provides partial compile-time checking

  # ─────────────────────────────────────────────────────────────────────────────
  # Registry Builder
  # ─────────────────────────────────────────────────────────────────────────────

  Scenario: Build registry from TypeScript constants
    Given all taxonomy constants are defined
    When buildRegistry() is called
    Then it returns a valid TagRegistry
    And it uses imported constants for all values
    And the result passes TagRegistrySchema validation

  Scenario: Registry builder is the single source
    Given the registry builder function
    When createDefaultTagRegistry() is called
    Then it delegates to buildRegistry()
    And no hardcoded values exist outside taxonomy/

  # ─────────────────────────────────────────────────────────────────────────────
  # Zod Schema Updates
  # ─────────────────────────────────────────────────────────────────────────────

  Scenario: MetadataTagDefinitionSchema uses FORMAT_TYPES
    Given the updated validation schema
    When defining the format field
    Then it uses z.enum(FORMAT_TYPES) not hardcoded strings
    And changes to FORMAT_TYPES propagate automatically

  Scenario: Status field validation uses constant
    Given a pattern with status field
    When validated against schema
    Then the schema references ACCEPTED_STATUS_VALUES
    And invalid status values are rejected

  # ─────────────────────────────────────────────────────────────────────────────
  # Developer Experience
  # ─────────────────────────────────────────────────────────────────────────────

  Scenario: IDE autocomplete for status values
    Given code that accepts ProcessStatusValue parameter
    When typing the argument
    Then IDE shows autocomplete with all valid values
    And TypeScript inference provides the options

  Scenario: Refactoring propagates changes
    Given a status value "roadmap" in constants
    When I rename it to "planned" using IDE refactor
    Then all TypeScript usages are updated automatically

  # ─────────────────────────────────────────────────────────────────────────────
  # Migration Compatibility
  # ─────────────────────────────────────────────────────────────────────────────

  Scenario: Existing loadTagRegistry works unchanged
    Given the updated taxonomy module
    When createDefaultTagRegistry() is called
    Then it returns the same structure as before
    And all existing generators work without modification

  Scenario: External JSON overrides still work
    Given a user-provided tag-registry.json
    When merged with TypeScript defaults via mergeTagRegistries()
    Then user values override defaults as before
    And the merge logic is unchanged
