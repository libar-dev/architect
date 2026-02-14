# ✅ Requirements Adr Codec Testing

**Purpose:** Detailed requirements for the Requirements Adr Codec Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

The RequirementsDocumentCodec and AdrDocumentCodec transform MasterDataset
into RenderableDocuments for PRD-style and architecture decision documentation.

**Problem:**

- Need to generate product requirements documents with flexible groupings
- Need to document architecture decisions with status tracking and supersession

**Solution:**

- RequirementsDocumentCodec generates PRD-style docs grouped by product area, user role, or phase
- AdrDocumentCodec generates ADR documentation with category, phase, or date groupings

## Acceptance Criteria

**No patterns with PRD metadata produces empty message**

- Given an empty MasterDataset
- When decoding with RequirementsDocumentCodec
- Then the document title is "Product Requirements"
- And the document contains "No Product Requirements"

**Summary shows counts and groupings**

- Given a MasterDataset with PRD patterns
- When decoding with RequirementsDocumentCodec
- Then the document title is "Product Requirements"
- And the document contains a "Summary" section
- And the summary table shows:

| metric         | value |
| -------------- | ----- |
| Total Features | 4     |
| Product Areas  | 2     |
| User Roles     | 2     |

**By product area section groups patterns correctly**

- Given a MasterDataset with PRD patterns
- When decoding with RequirementsDocumentCodec
- Then the document contains a "By Product Area" section
- And the product areas show their features

**By user role section uses collapsible groups**

- Given a MasterDataset with PRD patterns
- When decoding with RequirementsDocumentCodec
- Then the document contains a "By User Role" section
- And user role sections are collapsible

**Group by phase option changes primary grouping**

- Given a MasterDataset with PRD patterns
- When decoding with RequirementsDocumentCodec using groupBy phase
- Then the document contains a "By Phase" section
- And phase 1 shows its features

**Filter by status option limits patterns**

- Given a MasterDataset with PRD patterns
- When decoding with RequirementsDocumentCodec filtering to completed status
- Then the document shows only completed patterns

**All features table shows complete list**

- Given a MasterDataset with PRD patterns
- When decoding with RequirementsDocumentCodec
- Then the document contains an "All Features" section
- And the all features table has columns:

| column       |
| ------------ |
| Feature      |
| Product Area |
| User Role    |
| Status       |

**Business value rendering when enabled**

- Given a MasterDataset with PRD patterns with business value
- When decoding with RequirementsDocumentCodec
- Then the feature list shows business value descriptions

**Generate individual requirement detail files when enabled**

- Given a MasterDataset with PRD patterns
- When decoding with generateDetailFiles enabled for requirements
- Then the document has requirement detail files:

| path                                         |
| -------------------------------------------- |
| requirements/phase-01-user-authentication.md |
| requirements/phase-01-user-registration.md   |
| requirements/phase-02-metrics-dashboard.md   |
| requirements/phase-02-admin-dashboard.md     |

**Requirement detail file contains acceptance criteria from scenarios**

- Given a MasterDataset with PRD patterns with scenarios
- When decoding with generateDetailFiles enabled for requirements
- Then the requirement detail files contain acceptance criteria sections
- And the acceptance criteria shows scenario steps

**Requirement detail file contains business rules section**

- Given a MasterDataset with PRD patterns with rules
- When decoding with generateDetailFiles enabled for requirements
- Then the requirement detail files contain business rules sections

**Implementation links from relationshipIndex**

- Given a MasterDataset with PRD patterns with implementations
- When decoding with generateDetailFiles enabled for requirements
- Then the requirement detail files contain implementations sections

**No ADR patterns produces empty message**

- Given a MasterDataset with no ADR patterns
- When decoding with AdrDocumentCodec
- Then the document title is "Architecture Decision Records"
- And the document contains "No Architecture Decisions"

**Summary shows status counts and categories**

- Given a MasterDataset with ADR patterns
- When decoding with AdrDocumentCodec
- Then the document title is "Architecture Decision Records"
- And the document contains a "Summary" section
- And the ADR summary table shows:

| metric     | value |
| ---------- | ----- |
| Total ADRs | 4     |
| Accepted   | 2     |
| Proposed   | 1     |
| Superseded | 1     |
| Categories | 2     |

**ADRs grouped by category**

- Given a MasterDataset with ADR patterns
- When decoding with AdrDocumentCodec
- Then the document contains a "By Category" section
- And the ADR categories show their decisions

**ADRs grouped by phase option**

- Given a MasterDataset with ADR patterns
- When decoding with AdrDocumentCodec using groupBy phase
- Then the document contains a "By Phase" section
- And ADR phase sections are collapsible

**ADRs grouped by date (quarter) option**

- Given a MasterDataset with ADR patterns with quarters
- When decoding with AdrDocumentCodec using groupBy date
- Then the document contains a "By Date" section
- And ADR date sections show quarters

**ADR index table with all decisions**

- Given a MasterDataset with ADR patterns
- When decoding with AdrDocumentCodec
- Then the document contains an "ADR Index" section
- And the ADR index table has columns:

| column   |
| -------- |
| ADR      |
| Title    |
| Status   |
| Category |

**Status emoji mapping in ADR entries**

- Given a MasterDataset with ADR patterns
- When decoding with AdrDocumentCodec
- Then ADR entries show correct status emojis:

| status     | emoji |
| ---------- | ----- |
| accepted   | true  |
| proposed   | true  |
| superseded | true  |
| deprecated | true  |

**Context, Decision, Consequences sections from Rule keywords**

- Given a MasterDataset with ADR patterns with semantic rules
- When decoding with AdrDocumentCodec
- Then ADR entries contain semantic sections

**ADR supersedes rendering**

- Given a MasterDataset with ADR patterns with supersession
- When decoding with AdrDocumentCodec
- Then ADR entries show supersedes relationships
- And ADR entries show supersededBy relationships

**Generate individual ADR detail files when enabled**

- Given a MasterDataset with ADR patterns
- When decoding with generateDetailFiles enabled for ADR
- Then the document has ADR detail files:

| path                                     |
| ---------------------------------------- |
| decisions/adr-001-event-sourcing.md      |
| decisions/adr-002-cqrs-pattern.md        |
| decisions/adr-003-workflow-automation.md |
| decisions/adr-004-use-temporal.md        |

**ADR detail file contains full content**

- Given a MasterDataset with ADR patterns with semantic rules
- When decoding with generateDetailFiles enabled for ADR
- Then the ADR detail files contain overview sections
- And the ADR detail files contain back links

## Business Rules

**RequirementsDocumentCodec generates PRD-style documentation from patterns**

_Verified by: No patterns with PRD metadata produces empty message, Summary shows counts and groupings, By product area section groups patterns correctly, By user role section uses collapsible groups, Group by phase option changes primary grouping, Filter by status option limits patterns, All features table shows complete list, Business value rendering when enabled, Generate individual requirement detail files when enabled, Requirement detail file contains acceptance criteria from scenarios, Requirement detail file contains business rules section, Implementation links from relationshipIndex_

**AdrDocumentCodec documents architecture decisions**

_Verified by: No ADR patterns produces empty message, Summary shows status counts and categories, ADRs grouped by category, ADRs grouped by phase option, ADRs grouped by date (quarter) option, ADR index table with all decisions, Status emoji mapping in ADR entries, Context, Decision, Consequences sections from Rule keywords, ADR supersedes rendering, Generate individual ADR detail files when enabled, ADR detail file contains full content_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
