@architect
@architect-pattern:ReleaseAssociationRules
@architect-status:roadmap
@architect-phase:100
@architect-effort:3h
@architect-product-area:Validation
@architect-business-value:enforce-separation-of-specs-from-release-metadata
@architect-priority:medium
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
      | Spec compliance validator | pending | Yes | @libar-dev/architect/src/lint/rules/ |
      | TypeScript phase file validator | pending | Yes | @libar-dev/architect/src/lint/rules/ |
      | Release version format validator | pending | Yes | @libar-dev/architect/src/validation/ |

  Rule: Spec files must not contain release columns

    **Invariant:** Spec file DataTables must never include a Release column; release metadata belongs exclusively in phase files.
    **Rationale:** Mixing release metadata into specs couples planning artifacts to release timing, violating the separation defined by PDR-003.
    **Verified by:** Spec with release column is rejected; Spec without release column passes

    @acceptance-criteria
    Scenario: Spec with release column is rejected
      Given a feature file in architect/specs/
      And the deliverables DataTable has a "Release" column
      When validating spec compliance
      Then error indicates "Spec files must not contain Release column (per PDR-003)"

    @acceptance-criteria
    Scenario: Spec without release column passes
      Given a feature file in architect/specs/
      And the deliverables DataTable has only Deliverable, Status, Tests, Location
      When validating spec compliance
      Then validation passes

  Rule: TypeScript phase files must have required annotations

    **Invariant:** Every TypeScript phase file must include @architect-pattern, @architect-phase, and @architect-status annotations.
    **Rationale:** Missing required annotations cause phase files to be invisible to the scanner, producing incomplete roadmap projections and broken cross-references.
    **Verified by:** Phase file with missing required annotations; Scenario Outline: Phase file required annotations

    @acceptance-criteria
    Scenario: Phase file with missing required annotations
      Given a TypeScript file in architect/src/phases/
      When @architect-pattern is missing
      Then validation fails with "Required: @architect-pattern"

    @acceptance-criteria
    Scenario Outline: Phase file required annotations
      Given a TypeScript phase file
      When annotation "<annotation>" is missing
      Then validation <result>

      Examples:
        | annotation          | result                           |
        | @architect-pattern | fails with "Required annotation" |
        | @architect-phase   | fails with "Required annotation" |
        | @architect-status  | fails with "Required annotation" |
        | @architect-quarter | warns "Recommended annotation"   |

  Rule: Release version follows semantic versioning

    **Invariant:** All release version identifiers must conform to the `vX.Y.Z` semantic versioning format.
    **Rationale:** Non-semver version strings break downstream tooling that relies on version ordering and comparison for release planning.
    **Verified by:** Scenario Outline: Valid release version formats

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
