@libar-docs
@libar-docs-pdr:001
@libar-docs-adr-status:accepted
@libar-docs-adr-category:process
@libar-docs-pattern:PDR001SelfDocumentation
@libar-docs-status:completed
@libar-docs-product-area:DeliveryProcess
Feature: PDR-001 - Self-Documentation Process

  Rule: Context - Package needs its own delivery process configuration

    The `@libar-dev/delivery-process` package generates documentation for other
    projects but also needs to document its own development. Without a defined
    process, the package's roadmap and releases would be undocumented.

  Rule: Decision - Dog-food the delivery process for self-documentation

    The package uses its own tooling for documentation:

    | Artifact | Location | Generator |
    |----------|----------|-----------|
    | Roadmap specs | `delivery-process/specs/` | roadmap |
    | Releases | `delivery-process/releases/` | changelog |
    | Decisions | `delivery-process/decisions/` | adrs |
    | Generated docs | `docs-generated/` | all |

    **Key Commands:**
    - `pnpm docs:all` - Generate all documentation
    - `pnpm validate:all` - Validate patterns, DoD, and anti-patterns

  Rule: Consequences - Benefits and trade-offs

    **Benefits:**
    - (+) Validates the tooling works by using it
    - (+) Provides real-world examples for consumers
    - (+) Keeps package roadmap visible and tracked

    **Trade-offs:**
    - (-) Requires maintaining process discipline for a tooling package
    - (-) Generated docs add to package size

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Roadmap specs directory | Complete | delivery-process/specs/ |
      | Releases directory | Complete | delivery-process/releases/ |
      | Decisions directory | Complete | delivery-process/decisions/ |
      | docs:* scripts | Complete | package.json |
      | docs-generated output | Complete | docs-generated/ |

  @acceptance-criteria
  Scenario: Package can generate its own documentation
    Given the delivery-process package source code
    When running pnpm docs:all
    Then PATTERNS.md is generated in docs-generated/
    And ROADMAP.md is generated in docs-generated/
    And REMAINING-WORK.md is generated in docs-generated/
