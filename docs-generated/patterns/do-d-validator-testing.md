# ✅ DoD Validator Testing

**Purpose:** Detailed documentation for the DoD Validator Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

Validates that completed phases meet Definition of Done criteria:
  1. All deliverables must have "complete" status
  2. At least one @acceptance-criteria scenario must exist

  **Problem:**
  - Phases marked "completed" without all deliverables done
  - Missing acceptance criteria means no BDD tests
  - Manual review burden without automated validation

  **Solution:**
  - isDeliverableComplete() detects completion via status patterns
  - hasAcceptanceCriteria() checks for AC scenarios
  - validateDoDForPhase() validates single phase
  - validateDoD() validates across multiple phases
  - formatDoDSummary() renders console-friendly output

## Acceptance Criteria

**Complete status is detected as complete**

- Given a deliverable with status "complete"
- When checking if deliverable is complete
- Then the deliverable is considered complete

**Non-complete canonical statuses are correctly identified**

- Given a deliverable with status "<status>"
- When checking if deliverable is complete
- Then the deliverable is NOT considered complete

**Feature with @acceptance-criteria scenario passes**

- Given a feature with scenarios:
- When checking for acceptance criteria
- Then acceptance criteria is found

| name | tags |
| --- | --- |
| Basic functionality test | happy-path |
| Validates edge cases | acceptance-criteria |

**Feature without @acceptance-criteria fails**

- Given a feature with scenarios:
- When checking for acceptance criteria
- Then acceptance criteria is NOT found

| name | tags |
| --- | --- |
| Basic functionality test | happy-path |
| Edge case test | edge-case |

**Tag matching is case-insensitive**

- Given a feature with scenarios:
- When checking for acceptance criteria
- Then acceptance criteria is found

| name | tags |
| --- | --- |
| AC scenario | ACCEPTANCE-CRITERIA |

**Extract multiple AC scenario names**

- Given a feature with scenarios:
- When extracting acceptance criteria scenarios
- Then the extracted scenarios are:

| name | tags |
| --- | --- |
| Setup test | setup |
| User can log in | acceptance-criteria |
| User can view dashboard | acceptance-criteria |
| Edge case test | edge-case |

| name |
| --- |
| User can log in |
| User can view dashboard |

**No AC scenarios returns empty list**

- Given a feature with scenarios:
- When extracting acceptance criteria scenarios
- Then no scenarios are extracted

| name | tags |
| --- | --- |
| Some test | happy-path |

**Phase with all deliverables complete and AC passes**

- Given a feature for phase 15 pattern "FeatureX"
- And deliverables with statuses:
- And a scenario with tags:
- When validating DoD for the phase
- Then DoD is met
- And the result message contains "DoD met"

| name | status |
| --- | --- |
| Implement API | complete |
| Write tests | complete |
| Documentation | complete |

| tag |
| --- |
| acceptance-criteria |

**Phase with incomplete deliverables fails**

- Given a feature for phase 15 pattern "FeatureX"
- And deliverables with statuses:
- And a scenario with tags:
- When validating DoD for the phase
- Then DoD is NOT met
- And the result has 2 incomplete deliverables
- And the result message contains "2/3 deliverables incomplete"

| name | status |
| --- | --- |
| Implement API | complete |
| Write tests | in-progress |
| Documentation | pending |

| tag |
| --- |
| acceptance-criteria |

**Phase without acceptance criteria fails**

- Given a feature for phase 15 pattern "FeatureX"
- And deliverables with statuses:
- And a scenario with tags:
- When validating DoD for the phase
- Then DoD is NOT met
- And the result message contains "No @acceptance-criteria scenarios found"

| name | status |
| --- | --- |
| Implement API | complete |

| tag |
| --- |
| happy-path |

**Phase without deliverables fails**

- Given a feature for phase 15 pattern "FeatureX" with no deliverables
- And a scenario with tags:
- When validating DoD for the phase
- Then DoD is NOT met
- And the result message contains "No deliverables defined"

| tag |
| --- |
| acceptance-criteria |

**All completed phases passing DoD**

- Given features:
- When validating DoD across all features
- Then the summary shows 2 total phases
- And the summary shows 2 passed phases
- And the summary shows 0 failed phases

| pattern | phase | status | deliverables_complete | has_ac |
| --- | --- | --- | --- | --- |
| PatternA | 10 | completed | true | true |
| PatternB | 11 | completed | true | true |
| PatternC | 12 | roadmap | false | false |

**Mixed pass/fail results**

- Given features:
- When validating DoD across all features
- Then the summary shows 3 total phases
- And the summary shows 1 passed phases
- And the summary shows 2 failed phases

| pattern | phase | status | deliverables_complete | has_ac |
| --- | --- | --- | --- | --- |
| PatternA | 10 | completed | true | true |
| PatternB | 11 | completed | false | true |
| PatternC | 12 | completed | true | false |

**Only completed phases are validated by default**

- Given features:
- When validating DoD across all features
- Then the summary shows 1 total phases
- And the summary shows 1 passed phases

| pattern | phase | status | deliverables_complete | has_ac |
| --- | --- | --- | --- | --- |
| PatternA | 10 | completed | true | true |
| PatternB | 11 | active | false | false |
| PatternC | 12 | roadmap | false | false |

**Filter to specific phases**

- Given features:
- When validating DoD for phases 11, 12
- Then the summary shows 2 total phases
- And the summary shows 2 passed phases

| pattern | phase | status | deliverables_complete | has_ac |
| --- | --- | --- | --- | --- |
| PatternA | 10 | completed | true | true |
| PatternB | 11 | active | true | true |
| PatternC | 12 | roadmap | true | true |

**Empty summary shows no completed phases message**

- Given an empty DoD validation summary
- When formatting the DoD summary
- Then the output shows the summary header
- And the output shows zero phases validated
- And the output shows no completed phases message

**Summary with passed phases shows details**

- Given a DoD validation summary with:
- When formatting the DoD summary
- Then the output shows 2 passed and 0 failed
- And the output shows passed phase details

| pattern | phase | passed | deliverable_count |
| --- | --- | --- | --- |
| PatternA | 10 | true | 3 |
| PatternB | 11 | true | 2 |

**Summary with failed phases shows details**

- Given a DoD validation summary with failures:
- When formatting the DoD summary
- Then the output shows 2 failed phases
- And the output shows failed phase details with messages

| pattern | phase | message |
| --- | --- | --- |
| PatternA | 10 | 1/2 deliverables incomplete |
| PatternB | 11 | No @acceptance-criteria scenarios found |

## Business Rules

**Deliverable completion uses canonical status taxonomy**

**Invariant:** Deliverable completion status must be determined exclusively using the 6 canonical values from the deliverable status taxonomy.
    **Rationale:** Freeform status strings bypass schema validation and produce inconsistent completion tracking across the monorepo.
    **Verified by:** Complete status is detected as complete, Non-complete canonical statuses are correctly identified

_Verified by: Complete status is detected as complete, Non-complete canonical statuses are correctly identified_

**Acceptance criteria must be tagged with @acceptance-criteria**

**Invariant:** Every completed pattern must have at least one scenario tagged with @acceptance-criteria in its feature file.
    **Rationale:** Without explicit acceptance criteria tags, there is no machine-verifiable proof that the delivered work meets its requirements.
    **Verified by:** Feature with @acceptance-criteria scenario passes, Feature without @acceptance-criteria fails, Tag matching is case-insensitive

_Verified by: Feature with @acceptance-criteria scenario passes, Feature without @acceptance-criteria fails, Tag matching is case-insensitive_

**Acceptance criteria scenarios can be extracted by name**

**Invariant:** The validator must be able to extract scenario names from @acceptance-criteria-tagged scenarios for reporting.
    **Rationale:** Extracted names appear in traceability reports and DoD summaries, providing an audit trail from requirement to verification.
    **Verified by:** Extract multiple AC scenario names, No AC scenarios returns empty list

_Verified by: Extract multiple AC scenario names, No AC scenarios returns empty list_

**DoD requires all deliverables complete and AC present**

**Invariant:** A pattern passes Definition of Done only when ALL deliverables have complete status AND at least one @acceptance-criteria scenario exists.
    **Rationale:** Partial completion or missing acceptance criteria means the pattern is not verified — marking it complete would bypass quality gates.
    **Verified by:** Phase with all deliverables complete and AC passes, Phase with incomplete deliverables fails, Phase without acceptance criteria fails, Phase without deliverables fails

_Verified by: Phase with all deliverables complete and AC passes, Phase with incomplete deliverables fails, Phase without acceptance criteria fails, Phase without deliverables fails_

**DoD can be validated across multiple completed phases**

**Invariant:** DoD validation must evaluate all completed phases independently and report per-phase pass/fail results.
    **Rationale:** Multi-phase patterns need granular validation — a single aggregate result would hide which specific phase failed its Definition of Done.
    **Verified by:** All completed phases passing DoD, Mixed pass/fail results, Only completed phases are validated by default, Filter to specific phases

_Verified by: All completed phases passing DoD, Mixed pass/fail results, Only completed phases are validated by default, Filter to specific phases_

**Summary can be formatted for console output**

**Invariant:** DoD validation results must be renderable as structured console output showing phase-level pass/fail details.
    **Rationale:** Developers need immediate, actionable feedback during pre-commit validation — raw data structures are not human-readable.
    **Verified by:** Empty summary shows no completed phases message, Summary with passed phases shows details, Summary with failed phases shows details

_Verified by: Empty summary shows no completed phases message, Summary with passed phases shows details, Summary with failed phases shows details_

---

[← Back to Pattern Registry](../PATTERNS.md)
