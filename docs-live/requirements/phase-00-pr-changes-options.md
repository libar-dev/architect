# ✅ Pr Changes Options

**Purpose:** Detailed requirements for the Pr Changes Options feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | Generator |

## Description

Tests the PrChangesCodec filtering capabilities for generating PR-scoped
documentation. The codec filters patterns by changed files and/or release
version, supporting combined OR logic when both filters are provided.

## Acceptance Criteria

**PR changes filters to explicit file list**

- Given patterns from multiple files:
- And changedFiles lists specific files:
- When generating pr-changes document
- Then only patterns from the changed files are included:

| name          | status    | filePath            |
| ------------- | --------- | ------------------- |
| Core Types    | completed | src/core/types.ts   |
| Core Utils    | active    | src/core/utils.ts   |
| Api Endpoint  | completed | src/api/endpoint.ts |
| Other Pattern | completed | src/other/file.ts   |

| file                |
| ------------------- |
| src/core/types.ts   |
| src/api/endpoint.ts |

| name         |
| ------------ |
| Core Types   |
| Api Endpoint |

**PR changes filters by release version**

- Given patterns with deliverables tagged with different releases:
- And releaseFilter is "v0.2.0"
- When generating pr-changes document
- Then only release filtered patterns are included:

| name      | status    | release |
| --------- | --------- | ------- |
| Feature A | completed | v0.1.0  |
| Feature B | completed | v0.2.0  |
| Feature C | active    | v0.2.0  |
| Feature D | completed | v0.3.0  |

| name      |
| --------- |
| Feature B |
| Feature C |

**Combined filters use OR logic**

- Given patterns with various files and releases:
- And changedFiles includes some files:
- And releaseFilter is set to "v0.2.0"
- When generating pr-changes document
- Then patterns matching EITHER file OR release are included:

| name      | status    | filePath            | release |
| --------- | --------- | ------------------- | ------- |
| Pattern A | completed | src/core/types.ts   | v0.1.0  |
| Pattern B | completed | src/api/endpoint.ts | v0.2.0  |
| Pattern C | active    | src/other/file.ts   | v0.2.0  |
| Pattern D | completed | src/util/helper.ts  | v0.3.0  |

| file              |
| ----------------- |
| src/core/types.ts |

| name      |
| --------- |
| Pattern A |
| Pattern B |
| Pattern C |

## Business Rules

**Orchestrator supports PR changes generation options**

_Verified by: PR changes filters to explicit file list, PR changes filters by release version, Combined filters use OR logic_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
