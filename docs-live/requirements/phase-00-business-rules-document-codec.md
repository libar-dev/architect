# ✅ Business Rules Document Codec

**Purpose:** Detailed requirements for the Business Rules Document Codec feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | Generator |

## Description

Tests the BusinessRulesCodec transformation from MasterDataset to RenderableDocument.
Verifies rule extraction, organization by domain/phase, and progressive disclosure.

## Acceptance Criteria

**Extracts annotated Rule with Invariant and Rationale**

- Given a pattern with a rule containing:
- When decoding with BusinessRulesCodec in detailed mode
- Then the document contains rule "Reservations prevent race conditions"
- And the document contains invariant text "Only one reservation can exist"
- And the document contains rationale text "Check-then-create patterns"
- And the document contains verified by link to "Concurrent reservations scenario"

| Field      | Value                                                    |
| ---------- | -------------------------------------------------------- |
| name       | Reservations prevent race conditions                     |
| invariant  | Only one reservation can exist for a given key at a time |
| rationale  | Check-then-create patterns have TOCTOU vulnerabilities   |
| verifiedBy | Concurrent reservations scenario                         |

**Extracts unannotated Rule without showing not specified**

- Given a pattern with a rule containing:
- When decoding with BusinessRulesCodec in detailed mode
- Then the document contains rule "Events are immutable"
- And the document contains description "Events cannot be modified"
- And the document does not contain "not specified"

| Field       | Value                                    |
| ----------- | ---------------------------------------- |
| name        | Events are immutable                     |
| description | Events cannot be modified after creation |

**Groups rules by product area and phase**

- Given patterns with rules in these categories:
- When decoding with BusinessRulesCodec in standard mode
- Then the document has product area sections with phases

| Category       | Rule Name                            |
| -------------- | ------------------------------------ |
| ddd            | Reservations prevent race conditions |
| event-sourcing | Events are immutable                 |
| cqrs           | Projections must declare category    |

**Orders rules by phase within domain**

- Given patterns with rules in these phases:
- When decoding with BusinessRulesCodec in standard mode
- Then phase 16 content appears before phase 20 content

| Phase | Rule Name                            |
| ----- | ------------------------------------ |
| 16    | DCB enables cross-entity validation  |
| 20    | Events contain full context          |
| 20    | Reservations prevent race conditions |

**Summary mode includes statistics line**

- Given multiple patterns with a total of 5 rules
- When decoding with BusinessRulesCodec in summary mode
- Then the document has a summary line with rule count 5

**Summary mode excludes detailed sections**

- Given multiple patterns with a total of 5 rules
- When decoding with BusinessRulesCodec in summary mode
- Then the document does not have detailed rule headings

**Code examples included in detailed mode**

- Given a pattern with a rule containing code examples
- When decoding with BusinessRulesCodec in detailed mode with code examples enabled
- Then the document contains code blocks

**Code examples excluded in standard mode**

- Given a pattern with a rule containing code examples
- When decoding with BusinessRulesCodec in standard mode
- Then the document does not contain code blocks with language hints

**Verification links include file path**

- Given a pattern with scenarios in "reservation-pattern.feature" at line 42
- When decoding with BusinessRulesCodec in detailed mode with verification enabled
- Then the verification links include "reservation-pattern.feature"

## Business Rules

**Extracts Rule blocks with Invariant and Rationale**

_Verified by: Extracts annotated Rule with Invariant and Rationale, Extracts unannotated Rule without showing not specified_

**Organizes rules by product area and phase**

_Verified by: Groups rules by product area and phase, Orders rules by phase within domain_

**Summary mode generates compact output**

_Verified by: Summary mode includes statistics line, Summary mode excludes detailed sections_

**Preserves code examples and tables in detailed mode**

_Verified by: Code examples included in detailed mode, Code examples excluded in standard mode_

**Generates scenario traceability links**

_Verified by: Verification links include file path_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
