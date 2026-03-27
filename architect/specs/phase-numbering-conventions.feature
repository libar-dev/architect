@architect
@architect-pattern:PhaseNumberingConventions
@architect-status:roadmap
@architect-phase:100
@architect-effort:2h
@architect-product-area:Validation
@architect-business-value:prevent-phase-number-conflicts-and-ensure-consistent-ordering
@architect-priority:medium
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
      | Phase number validator | pending | Yes | @libar-dev/architect/src/validation/ |
      | Duplicate detection | pending | Yes | @libar-dev/architect/src/lint/rules/ |
      | Next phase suggester | pending | Yes | @libar-dev/architect/src/cli/ |

  Rule: Phase numbers must be unique within a release

    **Invariant:** No two specs within the same release version may share the same phase number.
    **Rationale:** Duplicate phase numbers create ambiguous ordering, causing unpredictable generation output and incorrect roadmap sequencing.
    **Verified by:** Duplicate phase numbers are detected; Same phase number in different releases is allowed

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

    **Invariant:** Large gaps in the phase number sequence must produce warnings during validation.
    **Rationale:** Undetected gaps signal accidentally skipped or orphaned specs, leading to misleading roadmap progress and hidden incomplete work.
    **Verified by:** Large gaps trigger warnings; Small gaps are acceptable

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

    **Invariant:** The suggested phase number must not conflict with any existing phase in the target release.
    **Rationale:** Without automated suggestion, authors manually guess the next number, frequently picking duplicates that are only caught later at validation time.
    **Verified by:** Suggest next phase number

    @acceptance-criteria
    Scenario: Suggest next phase number
      Given existing phases 47, 48, 50
      When running "suggest-phase" command
      Then output suggests 49 (fills gap) or 51 (continues sequence)
      And output shows context of existing phases
