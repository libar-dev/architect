# ✅ Documentation Orchestrator

**Purpose:** Detailed requirements for the Documentation Orchestrator feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Tests the orchestrator's pattern merging, conflict detection, and generator
coordination capabilities. The orchestrator coordinates the full documentation
generation pipeline: Scanner -> Extractor -> Generators -> File Writer.

## Acceptance Criteria

**Non-overlapping patterns merge successfully**

- Given TypeScript files with patterns:
- And feature files with non-overlapping patterns:
- When patterns are merged
- Then the merge should succeed
- And the merged dataset should contain 5 unique patterns
- And the merged dataset should include patterns:

| name          | status    |
| ------------- | --------- |
| CoreTypes     | completed |
| ApiHandler    | active    |
| DataValidator | roadmap   |

| name           | status    |
| -------------- | --------- |
| LoginBehavior  | completed |
| SearchBehavior | active    |

| name           |
| -------------- |
| CoreTypes      |
| ApiHandler     |
| DataValidator  |
| LoginBehavior  |
| SearchBehavior |

**Orchestrator detects pattern name conflicts**

- Given TypeScript files with patterns:
- And feature files with overlapping patterns:
- When patterns are merged
- Then the merge should fail with error
- And the error message should contain "Pattern conflicts detected"
- And the error message should mention "MyFeature"

| name      | status    |
| --------- | --------- |
| MyFeature | completed |
| CoreTypes | active    |

| name      | status  |
| --------- | ------- |
| MyFeature | roadmap |
| OtherSpec | active  |

**Orchestrator detects pattern name conflicts with status mismatch**

- Given a TypeScript pattern "UserAuth" with status "completed"
- And a Gherkin pattern "UserAuth" with status "roadmap"
- When patterns are merged
- Then the merge should fail with error
- And the error message should mention "UserAuth"

**Unknown generator name fails gracefully**

- Given a valid pattern dataset
- When requesting generation with generator name "invalid-generator"
- Then the generator lookup should fail
- And the error message should mention "invalid-generator"
- And the error message should list available generators

**Partial success when some generators are invalid**

- Given a valid pattern dataset
- And generator requests for:
- When checking which generators are available
- Then generator availability should match expectations

| name            | expectedAvailable |
| --------------- | ----------------- |
| patterns        | true              |
| invalid-gen     | false             |
| another-invalid | false             |

## Business Rules

**Orchestrator coordinates full documentation generation pipeline**

**Invariant:** Non-overlapping patterns from TypeScript and Gherkin sources must merge into a unified dataset; overlapping pattern names must fail with conflict error.
**Rationale:** Silent merging of conflicting patterns would produce incorrect documentation — fail-fast ensures data integrity across the pipeline.
**Verified by:** Non-overlapping patterns merge successfully, Orchestrator detects pattern name conflicts, Orchestrator detects pattern name conflicts with status mismatch, Unknown generator name fails gracefully, Partial success when some generators are invalid

_Verified by: Non-overlapping patterns merge successfully, Orchestrator detects pattern name conflicts, Orchestrator detects pattern name conflicts with status mismatch, Unknown generator name fails gracefully, Partial success when some generators are invalid_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
