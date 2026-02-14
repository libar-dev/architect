# 📋 Business Rules Generator

**Purpose:** Detailed requirements for the Business Rules Generator feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | planned    |
| Product Area | Generation |
| Phase        | 100        |

## Description

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

## Acceptance Criteria

**Extracts annotated Rule with Invariant and Rationale**

- Given a feature file with a Rule block:
- When the business rules generator runs
- Then output should include rule "Reservations prevent race conditions"
- And output should include invariant "Only one reservation can exist..."
- And output should include rationale "Check-then-create patterns..."
- And output should include verification link to "Concurrent reservations scenario"

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can exist for a given key at a time.

  **Rationale:** Check-then-create patterns have TOCTOU vulnerabilities.

  **Verified by:** Concurrent reservations scenario
```

**Extracts unannotated Rule with name only**

- Given a feature file with a Rule block without annotations:
- When the business rules generator runs
- Then output should include rule "Events are immutable"
- And output should include description "Events cannot be modified..."
- And invariant should be marked as "not specified"

```gherkin
Rule: Events are immutable
  Events cannot be modified after creation.
```

**Groups rules by domain category**

- Given feature files with these domain tags:
- When the business rules generator runs
- Then output should have section "## DDD Patterns"
- And output should have section "## Event Sourcing Patterns"
- And output should have section "## CQRS Patterns"

| Feature                       | Domain Tag                 | Rule                                 |
| ----------------------------- | -------------------------- | ------------------------------------ |
| reservation-pattern.feature   | @libar-docs-ddd            | Reservations prevent race conditions |
| event-store.feature           | @libar-docs-event-sourcing | Events are immutable                 |
| projection-categories.feature | @libar-docs-cqrs           | Projections must declare category    |

**Orders rules by phase within domain**

- Given feature files with these phases:
- When the business rules generator runs
- Then Phase 16 rules should appear before Phase 20 rules

| Feature                     | Phase | Rule                                 |
| --------------------------- | ----- | ------------------------------------ |
| ecst-fat-events.feature     | 20    | Events contain full context          |
| reservation-pattern.feature | 20    | Reservations prevent race conditions |
| dynamic-consistency.feature | 16    | DCB enables cross-entity validation  |

**Includes code examples from DocStrings**

- Given a Rule containing DocStrings with "Current State" and "Target State" code examples
- When the business rules generator runs
- Then output should include fenced TypeScript code block for current state
- And output should include fenced TypeScript code block for target state
- And code blocks should preserve syntax highlighting hints

**Includes comparison tables**

- Given a Rule containing a markdown table with columns "Category", "Query Pattern", "Client Exposed"
- And the table has rows for "Logic" and "View" categories
- When the business rules generator runs
- Then output should include the table with all columns
- And output should include all rows from the original table

**Generates scenario verification links**

- Given a Rule with Verified by annotation:
- When the business rules generator runs
- Then output should include "Verified by:" section
- And output should link to "Concurrent reservations" scenario
- And output should link to "Expired reservation cleanup" scenario

```gherkin
Rule: Reservations prevent race conditions
  **Verified by:** Concurrent reservations, Expired reservation cleanup
```

**Links include feature file locations**

- Given scenarios are in "reservation-pattern.feature"
- When the business rules generator generates links
- Then links should include file path "reservation-pattern.feature"
- And links should include line numbers if available

## Business Rules

**Extracts Rule blocks with Invariant and Rationale**

**Invariant:** Every `Rule:` block with `**Invariant:**` annotation must be extracted.
Rules without annotations are included with rule name only.

    **Rationale:** Business rules are the core domain constraints. Extracting them separately
    from acceptance criteria creates a focused reference document for domain understanding.

    **Verified by:** Extracts annotated Rule, Extracts unannotated Rule

_Verified by: Extracts annotated Rule with Invariant and Rationale, Extracts unannotated Rule with name only_

**Organizes rules by domain category and phase**

**Invariant:** Rules are grouped first by domain category (from `@libar-docs-*` flags),
then by phase number for temporal ordering.

    **Rationale:** Domain-organized documentation helps stakeholders find rules relevant
    to their area of concern without scanning all rules.

    **Verified by:** Groups rules by domain, Orders by phase within domain

_Verified by: Groups rules by domain category, Orders rules by phase within domain_

**Preserves code examples and comparison tables**

**Invariant:** DocStrings (`"""typescript`) and tables in Rule descriptions are
rendered in the business rules document.

    **Rationale:** Code examples and tables provide concrete understanding of abstract
    rules. Removing them loses critical context.

    **Verified by:** Includes code examples, Includes tables

_Verified by: Includes code examples from DocStrings, Includes comparison tables_

**Generates scenario traceability links**

**Invariant:** Each rule's `**Verified by:**` section generates links to the
scenarios that verify the rule.

    **Rationale:** Traceability enables audit compliance and helps developers find
    relevant tests when modifying rules.

    **Verified by:** Generates scenario links, Links include file locations

_Verified by: Generates scenario verification links, Links include feature file locations_

## Deliverables

- Business rules extractor (pending)
- Business rules renderer (pending)
- CLI integration (pending)
- docs:business-rules script (pending)

## Implementations

Files that implement this pattern:

- [`business-rules-codec.feature`](../../tests/features/generators/business-rules-codec.feature) - Tests the BusinessRulesCodec transformation from MasterDataset to RenderableDocument.

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
