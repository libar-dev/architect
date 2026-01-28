@libar-docs
@libar-docs-pattern:PhaseNumberingConventions
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:2h
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:prevent-phase-number-conflicts-and-ensure-consistent-ordering
@libar-docs-priority:medium
Feature: Phase Numbering Conventions and Validation

  **Problem:**
  Phase numbers are assigned manually without validation, leading to
  potential conflicts (duplicate numbers), gaps that confuse ordering,
  and inconsistent conventions across sources.

  **Solution:**
  Define and validate phase numbering conventions:
  - Unique phase numbers per release version
  - Gap detection and warnings
  - Cross-source consistency validation
  - Suggested next phase number

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Phase number validator | Pending | Yes | @libar-dev/delivery-process/src/validation/ |
      | Duplicate detection | Pending | Yes | @libar-dev/delivery-process/src/lint/rules/ |
      | Next phase suggester | Pending | Yes | @libar-dev/delivery-process/src/cli/ |

  Rule: Phase numbers must be unique within a release

    @acceptance-criteria
    Scenario: Duplicate phase numbers are detected
      Given two phases both numbered 47
      When validating phase numbers
      Then error indicates "Duplicate phase number 47 found in files: ..."
      And both file paths are listed

    @acceptance-criteria
    Scenario: Same phase number in different releases is allowed
      Given phase 14 in v0.2.0
      And phase 14 in v0.3.0
      When validating phase numbers
      Then validation passes (different releases)

  Rule: Phase number gaps are detected

    @acceptance-criteria
    Scenario: Large gaps trigger warnings
      Given phases numbered 1, 2, 3, 10
      When validating phase numbers
      Then warning indicates "Gap detected: phases 4-9 missing"

    @acceptance-criteria
    Scenario: Small gaps are acceptable
      Given phases numbered 1, 2, 4, 5
      When validating phase numbers
      Then validation passes (single gap acceptable)

  Rule: CLI suggests next available phase number

    @acceptance-criteria
    Scenario: Suggest next phase number
      Given existing phases 47, 48, 50
      When running "suggest-phase" command
      Then output suggests 49 (fills gap) or 51 (continues sequence)
      And output shows context of existing phases
