@libar-docs
@libar-docs-pattern:TraceabilityGenerator
@libar-docs-status:roadmap
@libar-docs-phase:18
@libar-docs-effort:2d
@libar-docs-product-area:DeliveryProcess
Feature: Traceability Generator - Map Rules to Scenarios

  **Business Value:** Provide audit-ready traceability matrices that demonstrate
  test coverage for business rules without manual documentation.

  **How It Works:**
  - Parse `**Verified by:**` annotations in Rule descriptions
  - Match scenario names to actual scenarios in feature files
  - Generate traceability matrix showing Rule → Scenario mappings
  - Report coverage gaps (rules without scenarios, orphan scenarios)

  **Why It Matters:**
  | Benefit | How |
  | Audit compliance | Demonstrates which tests verify which business rules |
  | Coverage visibility | Identifies rules without verification scenarios |
  | Orphan detection | Finds scenarios not linked to any rule |
  | Impact analysis | Shows which scenarios to run when a rule changes |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Traceability extractor | pending | @libar-dev/delivery-process/src/generators/traceability/ | Yes | unit |
      | Traceability matrix renderer | pending | @libar-dev/delivery-process/src/generators/traceability/ | Yes | unit |
      | CLI integration | pending | @libar-dev/delivery-process/src/cli/generate-docs.ts | Yes | unit |
      | docs:traceability script | pending | package.json | No | - |

  # ===========================================================================
  # RULE 1: Parse Verified by annotations
  # ===========================================================================

  Rule: Parses Verified by annotations to extract scenario references

    **Invariant:** Scenario names in `**Verified by:**` are matched against actual
    scenarios in feature files. Unmatched references are reported as warnings.

    **Rationale:** Verified by annotations create explicit traceability. Validating
    references ensures the traceability matrix reflects actual test coverage.

    **Verified by:** Parses comma-separated scenarios, Reports unmatched references

    @acceptance-criteria @happy-path
    Scenario: Parses comma-separated scenario list
      Given a Rule with Verified by annotation:
        """gherkin
        Rule: Reservations prevent race conditions
          **Verified by:** Concurrent reservations, Expired reservation cleanup, User cancels
        """
      When the traceability generator parses the Rule
      Then it should extract 3 scenario references:
        | Scenario Reference |
        | Concurrent reservations |
        | Expired reservation cleanup |
        | User cancels |

    @acceptance-criteria @validation
    Scenario: Reports unmatched scenario references
      Given a Rule references scenario "Non-existent test"
      And no scenario with that name exists in any feature file
      When the traceability generator runs
      Then a warning should be generated for "Non-existent test"
      And the matrix should mark it as "unverified"

  # ===========================================================================
  # RULE 2: Generate traceability matrix
  # ===========================================================================

  Rule: Generates Rule-to-Scenario traceability matrix

    **Invariant:** Every Rule appears in the matrix with its verification status.
    Scenarios are linked by name and file location.

    **Rationale:** A matrix format enables quick scanning of coverage status and
    supports audit requirements for bidirectional traceability.

    **Verified by:** Matrix includes all rules, Matrix shows verification status

    @acceptance-criteria @happy-path
    Scenario: Matrix includes all rules from feature files
      Given feature files with Rules:
        | Feature | Rule |
        | reservation-pattern.feature | Reservations prevent race conditions |
        | reservation-pattern.feature | TTL enables auto-cleanup |
        | event-store.feature | Events are immutable |
      When the traceability generator runs
      Then the matrix should include 3 rows for each Rule

    @acceptance-criteria @happy-path
    Scenario: Matrix shows verification status with scenario count
      Given a Rule "Reservations prevent race conditions" with Verified by:
        | Scenario |
        | Concurrent reservations |
        | Expired reservation cleanup |
      When the traceability generator generates the matrix
      Then the Rule row should show "2 scenarios"
      And the Rule row should show status "verified"

    @acceptance-criteria @validation
    Scenario: Matrix marks unverified rules
      Given a Rule without Verified by annotation
      When the traceability generator generates the matrix
      Then the Rule row should show "0 scenarios"
      And the Rule row should show status "unverified"

  # ===========================================================================
  # RULE 3: Detect coverage gaps
  # ===========================================================================

  Rule: Detects and reports coverage gaps

    **Invariant:** Orphan scenarios (not referenced by any Rule) and unverified
    rules are listed in dedicated sections.

    **Rationale:** Coverage gaps indicate either missing traceability annotations
    or actual missing test coverage. Surfacing them enables remediation.

    **Verified by:** Reports orphan scenarios, Reports unverified rules

    @acceptance-criteria @happy-path
    Scenario: Reports orphan scenarios not linked to any rule
      Given scenarios exist:
        | Scenario | Referenced by Rule |
        | Concurrent reservations | Yes |
        | Random utility test | No |
        | Internal helper scenario | No |
      When the traceability generator runs
      Then output should include "Orphan Scenarios" section
      And section should list "Random utility test"
      And section should list "Internal helper scenario"
      And section should NOT list "Concurrent reservations"

    @acceptance-criteria @happy-path
    Scenario: Reports unverified rules
      Given Rules exist:
        | Rule | Has Verified by |
        | Reservations prevent race conditions | Yes |
        | Legacy rule without annotation | No |
      When the traceability generator runs
      Then output should include "Unverified Rules" section
      And section should list "Legacy rule without annotation"

  # ===========================================================================
  # RULE 4: Support filtering and output formats
  # ===========================================================================

  Rule: Supports filtering by phase and domain

    **Invariant:** CLI flags allow filtering the matrix by phase number or domain
    category to generate focused traceability reports.

    **Rationale:** Large codebases have many rules. Filtering enables relevant
    subset extraction for specific audits or reviews.

    **Verified by:** Filters by phase, Filters by domain

    @acceptance-criteria @happy-path
    Scenario: Filters matrix by phase
      Given Rules from phases 15, 16, and 20
      When running `pnpm docs:traceability --phase 16`
      Then matrix should only include Phase 16 rules

    @acceptance-criteria @happy-path
    Scenario: Filters matrix by domain category
      Given Rules with domain tags @libar-docs-ddd and @libar-docs-cqrs
      When running `pnpm docs:traceability --domain ddd`
      Then matrix should only include rules from DDD-tagged features
