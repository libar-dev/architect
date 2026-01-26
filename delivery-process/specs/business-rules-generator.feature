@libar-docs
@libar-docs-pattern:BusinessRulesGenerator
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:3d
@libar-docs-product-area:DeliveryProcess
Feature: Business Rules Generator - Extract Invariants and Rationale from Feature Files

  **Business Value:** Enable stakeholders to understand domain constraints without reading
  implementation details or full feature files.

  **How It Works:**
  - Extract `Rule:` blocks from feature files
  - Parse `**Invariant:**` and `**Rationale:**` annotations
  - Generate organized Business Rules document by domain/phase
  - Include traceability via `**Verified by:**` links to scenarios

  **Why It Matters:**
  | Benefit | How |
  | Domain knowledge capture | Invariants document what must always be true |
  | Onboarding acceleration | New developers understand constraints quickly |
  | Business alignment | Rationale explains why constraints exist |
  | Audit readiness | Traceability shows which tests verify each rule |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Business rules extractor | planned | @libar-dev/delivery-process/src/generators/business-rules/ | Yes | unit |
      | Business rules renderer | planned | @libar-dev/delivery-process/src/generators/business-rules/ | Yes | unit |
      | CLI integration | planned | @libar-dev/delivery-process/src/cli/generate-docs.ts | Yes | unit |
      | docs:business-rules script | planned | package.json | No | - |

  # ===========================================================================
  # RULE 1: Extract Rule blocks with structured content
  # ===========================================================================

  Rule: Extracts Rule blocks with Invariant and Rationale

    **Invariant:** Every `Rule:` block with `**Invariant:**` annotation must be extracted.
    Rules without annotations are included with rule name only.

    **Rationale:** Business rules are the core domain constraints. Extracting them separately
    from acceptance criteria creates a focused reference document for domain understanding.

    **Verified by:** Extracts annotated Rule, Extracts unannotated Rule

    @acceptance-criteria @happy-path
    Scenario: Extracts annotated Rule with Invariant and Rationale
      Given a feature file with a Rule block:
        """gherkin
        Rule: Reservations prevent race conditions

          **Invariant:** Only one reservation can exist for a given key at a time.

          **Rationale:** Check-then-create patterns have TOCTOU vulnerabilities.

          **Verified by:** Concurrent reservations scenario
        """
      When the business rules generator runs
      Then output should include rule "Reservations prevent race conditions"
      And output should include invariant "Only one reservation can exist..."
      And output should include rationale "Check-then-create patterns..."
      And output should include verification link to "Concurrent reservations scenario"

    @acceptance-criteria @happy-path
    Scenario: Extracts unannotated Rule with name only
      Given a feature file with a Rule block without annotations:
        """gherkin
        Rule: Events are immutable
          Events cannot be modified after creation.
        """
      When the business rules generator runs
      Then output should include rule "Events are immutable"
      And output should include description "Events cannot be modified..."
      And invariant should be marked as "not specified"

  # ===========================================================================
  # RULE 2: Organize by domain and phase
  # ===========================================================================

  Rule: Organizes rules by domain category and phase

    **Invariant:** Rules are grouped first by domain category (from `@libar-docs-*` flags),
    then by phase number for temporal ordering.

    **Rationale:** Domain-organized documentation helps stakeholders find rules relevant
    to their area of concern without scanning all rules.

    **Verified by:** Groups rules by domain, Orders by phase within domain

    @acceptance-criteria @happy-path
    Scenario: Groups rules by domain category
      Given feature files with these domain tags:
        | Feature | Domain Tag | Rule |
        | reservation-pattern.feature | @libar-docs-ddd | Reservations prevent race conditions |
        | event-store.feature | @libar-docs-event-sourcing | Events are immutable |
        | projection-categories.feature | @libar-docs-cqrs | Projections must declare category |
      When the business rules generator runs
      Then output should have section "## DDD Patterns"
      And output should have section "## Event Sourcing Patterns"
      And output should have section "## CQRS Patterns"

    @acceptance-criteria @happy-path
    Scenario: Orders rules by phase within domain
      Given feature files with these phases:
        | Feature | Phase | Rule |
        | ecst-fat-events.feature | 20 | Events contain full context |
        | reservation-pattern.feature | 20 | Reservations prevent race conditions |
        | dynamic-consistency.feature | 16 | DCB enables cross-entity validation |
      When the business rules generator runs
      Then Phase 16 rules should appear before Phase 20 rules

  # ===========================================================================
  # RULE 3: Include code examples and tables
  # ===========================================================================

  Rule: Preserves code examples and comparison tables

    **Invariant:** DocStrings (`"""typescript`) and tables in Rule descriptions are
    rendered in the business rules document.

    **Rationale:** Code examples and tables provide concrete understanding of abstract
    rules. Removing them loses critical context.

    **Verified by:** Includes code examples, Includes tables

    @acceptance-criteria @happy-path
    Scenario: Includes code examples from DocStrings
      Given a Rule containing DocStrings with "Current State" and "Target State" code examples
      When the business rules generator runs
      Then output should include fenced TypeScript code block for current state
      And output should include fenced TypeScript code block for target state
      And code blocks should preserve syntax highlighting hints

    @acceptance-criteria @happy-path
    Scenario: Includes comparison tables
      Given a Rule containing a markdown table with columns "Category", "Query Pattern", "Client Exposed"
      And the table has rows for "Logic" and "View" categories
      When the business rules generator runs
      Then output should include the table with all columns
      And output should include all rows from the original table

  # ===========================================================================
  # RULE 4: Generate traceability links
  # ===========================================================================

  Rule: Generates scenario traceability links

    **Invariant:** Each rule's `**Verified by:**` section generates links to the
    scenarios that verify the rule.

    **Rationale:** Traceability enables audit compliance and helps developers find
    relevant tests when modifying rules.

    **Verified by:** Generates scenario links, Links include file locations

    @acceptance-criteria @happy-path
    Scenario: Generates scenario verification links
      Given a Rule with Verified by annotation:
        """gherkin
        Rule: Reservations prevent race conditions
          **Verified by:** Concurrent reservations, Expired reservation cleanup
        """
      When the business rules generator runs
      Then output should include "Verified by:" section
      And output should link to "Concurrent reservations" scenario
      And output should link to "Expired reservation cleanup" scenario

    @acceptance-criteria @happy-path
    Scenario: Links include feature file locations
      Given scenarios are in "reservation-pattern.feature"
      When the business rules generator generates links
      Then links should include file path "reservation-pattern.feature"
      And links should include line numbers if available
