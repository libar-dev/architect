@libar-docs
@libar-docs-pattern:ReleaseAssociationRules
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:3h
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:enforce-separation-of-specs-from-release-metadata
@libar-docs-priority:medium
Feature: Release Association Rules Validation

  **Problem:**
  PDR-002 and PDR-003 define conventions for separating specs from release
  metadata, but there's no automated enforcement. Spec files may
  inadvertently include release columns, and TypeScript phase files may
  have incorrect structure.

  **Solution:**
  Implement validation rules for:
  - Spec file compliance (no release columns in DataTables)
  - TypeScript phase file structure
  - Cross-reference validation (spec references exist)
  - Release version format (semver pattern)

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Spec compliance validator | pending | Yes | @libar-dev/delivery-process/src/lint/rules/ |
      | TypeScript phase file validator | pending | Yes | @libar-dev/delivery-process/src/lint/rules/ |
      | Release version format validator | pending | Yes | @libar-dev/delivery-process/src/validation/ |

  Rule: Spec files must not contain release columns

    @acceptance-criteria
    Scenario: Spec with release column is rejected
      Given a feature file in delivery-process/specs/
      And the deliverables DataTable has a "Release" column
      When validating spec compliance
      Then error indicates "Spec files must not contain Release column (per PDR-003)"

    @acceptance-criteria
    Scenario: Spec without release column passes
      Given a feature file in delivery-process/specs/
      And the deliverables DataTable has only Deliverable, Status, Tests, Location
      When validating spec compliance
      Then validation passes

  Rule: TypeScript phase files must have required annotations

    @acceptance-criteria
    Scenario: Phase file with missing required annotations
      Given a TypeScript file in delivery-process/src/phases/
      When @libar-docs-pattern is missing
      Then validation fails with "Required: @libar-docs-pattern"

    @acceptance-criteria
    Scenario Outline: Phase file required annotations
      Given a TypeScript phase file
      When annotation "<annotation>" is missing
      Then validation <result>

      Examples:
        | annotation          | result                           |
        | @libar-docs-pattern | fails with "Required annotation" |
        | @libar-docs-phase   | fails with "Required annotation" |
        | @libar-docs-status  | fails with "Required annotation" |
        | @libar-docs-quarter | warns "Recommended annotation"   |

  Rule: Release version follows semantic versioning

    @acceptance-criteria
    Scenario Outline: Valid release version formats
      Given a release version "<version>"
      When validating release format
      Then validation <result>

      Examples:
        | version  | result                              |
        | v0.1.0   | passes                              |
        | v1.0.0   | passes                              |
        | v2.3.4   | passes                              |
        | 1.0.0    | warns "Prefix 'v' recommended"      |
        | v1.0     | fails "Must be semver: vX.Y.Z"      |
        | latest   | fails "Must be semver: vX.Y.Z"      |
