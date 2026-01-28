@libar-docs
@libar-docs-adr:005
@libar-docs-adr-status:accepted
@libar-docs-adr-category:architecture
@libar-docs-pattern:ADR005ConfigurableTagPrefix
@libar-docs-phase:44
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-libar-docs-opt-in-marker
@libar-docs-product-area:DeliveryProcess
Feature: ADR-005 - Configurable Tag Prefix

  **Context:**
  The delivery process uses `@libar-docs-*` as the default tag prefix for all metadata annotations.
  - Consumers may want to use their own prefix (e.g., `@myorg-docs-*`)
  - Hardcoding the prefix limits package reusability
  - Different projects have different naming conventions
  - The opt-in marker `@libar-docs` may conflict with existing tags

  **Decision:**
  Make the tag prefix configurable through the preset system:
  - Default prefix remains `@libar-docs-` for backward compatibility
  - Consumers can override via `createDeliveryProcess({ tagPrefix: '@myorg-' })`
  - File opt-in tag follows the prefix pattern (`@myorg-docs` if prefix is `@myorg-`)
  - All scanners, extractors, and validators respect the configured prefix
  - Presets define sensible defaults for common use cases

  **Consequences:**
  - (+) Package can be used by any organization without tag conflicts
  - (+) Backward compatible - existing consumers continue to work
  - (+) Presets provide quick configuration for common patterns
  - (-) Slightly more complex configuration API
  - (-) Documentation must clarify which prefix is active

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | tagPrefix option in factory | Complete | Yes | src/config/factory.ts |
      | fileOptInTag option in factory | Complete | Yes | src/config/factory.ts |
      | Generic preset | Complete | Yes | src/config/presets.ts |
      | DDD-ES-CQRS preset | Complete | Yes | src/config/presets.ts |

  @acceptance-criteria
  Scenario: Custom tag prefix is respected by scanner
    Given a delivery process configured with tagPrefix "@myorg-"
    When scanning a file with @myorg-docs-pattern:MyPattern
    Then the pattern is extracted with name "MyPattern"

  @acceptance-criteria
  Scenario: Default prefix remains libar-docs for backward compatibility
    Given a delivery process created with default options
    When scanning a file with @libar-docs-pattern:MyPattern
    Then the pattern is extracted with name "MyPattern"
