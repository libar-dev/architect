# ✅ Dual Source Extractor Testing

**Purpose:** Detailed requirements for the Dual Source Extractor Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Annotation |

## Description

Extracts and combines pattern metadata from both TypeScript code stubs
(@libar-docs-_) and Gherkin feature files (@libar-process-_), validates
consistency, and composes unified pattern data for documentation.

**Problem:**

- Pattern data split across code stubs and feature files
- Need to validate consistency between sources
- Deliverables defined in Background tables need extraction
- Pattern name collisions need handling

**Solution:**

- extractProcessMetadata() extracts tags from features
- extractDeliverables() parses Background tables
- combineSources() merges code + features into dual-source patterns
- validateDualSource() checks cross-source consistency

## Acceptance Criteria

**Complete process metadata extraction**

- Given a feature with process tags:
- When extracting process metadata
- Then metadata is extracted successfully
- And the pattern name is "MyPattern"
- And the phase is 15
- And the status is "active"

| tag               |
| ----------------- |
| pattern:MyPattern |
| phase:15          |
| status:active     |
| quarter:Q1-2024   |
| effort:medium     |

**Minimal required tags extraction**

- Given a feature with process tags:
- When extracting process metadata
- Then metadata is extracted successfully
- And the status defaults to "roadmap"

| tag                |
| ------------------ |
| pattern:MinPattern |
| phase:01           |

**Missing pattern tag returns null**

- Given a feature with process tags:
- When extracting process metadata
- Then no metadata is extracted

| tag      |
| -------- |
| phase:10 |

**Missing phase tag returns null**

- Given a feature with process tags:
- When extracting process metadata
- Then no metadata is extracted

| tag             |
| --------------- |
| pattern:NoPhase |

**Standard deliverables table extraction**

- Given a feature with background deliverables:
- When extracting deliverables
- Then 2 deliverables are extracted
- And deliverable "Implement API" has status "complete"
- And deliverable "Implement API" has 5 tests

| Deliverable   | Status   | Tests | Location           |
| ------------- | -------- | ----- | ------------------ |
| Implement API | complete | 5     | src/api/handler.ts |
| Write docs    | complete | Yes   | docs/README.md     |

**Extended deliverables with Finding and Release**

- Given a feature with background deliverables:
- When extracting deliverables
- Then deliverable "Fix bug" has finding "CODE-001"
- And deliverable "Fix bug" has release "v0.2.0"

| Deliverable | Status   | Tests | Location | Finding  | Release |
| ----------- | -------- | ----- | -------- | -------- | ------- |
| Fix bug     | complete | 3     | src/fix  | CODE-001 | v0.2.0  |

**Feature without background returns empty**

- Given a feature without background
- When extracting deliverables
- Then no deliverables are extracted

**Tests column handles various formats**

- Given a feature with background deliverables:
- When extracting deliverables
- Then the test counts are correctly parsed

| Deliverable | Status   | Tests | Location |
| ----------- | -------- | ----- | -------- |
| Test Yes    | complete | Yes   | src/     |
| Test No     | complete | No    | src/     |
| Test Number | complete | 10    | src/     |
| Test Empty  | complete |       | src/     |

**Matching code and feature are combined**

- Given a code pattern "MyPattern" with phase 15
- And a feature file for pattern "MyPattern" with phase 15
- When combining sources
- Then 1 combined pattern is produced
- And combined pattern "MyPattern" has process metadata
- And 0 code-only patterns exist
- And 0 feature-only patterns exist

**Code-only pattern has no matching feature**

- Given a code pattern "CodeOnly" with phase 10
- And no feature files
- When combining sources
- Then 0 combined patterns are produced
- And 1 code-only patterns exist

**Feature-only pattern has no matching code**

- Given no code patterns
- And a feature file for pattern "FeatureOnly" with phase 20
- When combining sources
- Then 0 combined patterns are produced
- And 1 feature-only patterns exist

**Phase mismatch creates validation error**

- Given a code pattern "Mismatch" with phase 10
- And a feature file for pattern "Mismatch" with phase 20
- When combining sources
- Then 1 combined pattern is produced
- And 1 validation error exists
- And the error mentions phase mismatch

**Pattern name collision merges sources**

- Given code patterns:
- And a feature file for pattern "ServiceX" with phase 15
- When combining sources
- Then 1 combined pattern is produced
- And 1 warning about collision exists
- And combined pattern "ServiceX" has merged dependencies

| patternName | phase | category | dependsOn |
| ----------- | ----- | -------- | --------- |
| ServiceX    | 15    | core     | PatternA  |
| ServiceX    | 15    | ddd      | PatternB  |

**Clean results have no errors**

- Given dual-source results with no issues
- When validating dual-source
- Then validation passes
- And there are no errors
- And there are no warnings

**Cross-validation errors are reported**

- Given dual-source results with validation errors:
- When validating dual-source
- Then validation fails
- And 1 error is reported

| codeName | featureName | message                          |
| -------- | ----------- | -------------------------------- |
| PatternA | PatternA    | Phase mismatch: code 10, feat 20 |

**Orphaned roadmap code stubs produce warnings**

- Given dual-source results with code-only patterns:
- When validating dual-source
- Then validation passes
- And 1 warning about missing feature file exists

| patternName | status    |
| ----------- | --------- |
| OrphanA     | roadmap   |
| OrphanB     | completed |

**Feature-only roadmap patterns produce warnings**

- Given dual-source results with feature-only patterns:
- When validating dual-source
- Then validation passes
- And 1 warning about missing code stub exists

| pattern      | phase | status  |
| ------------ | ----- | ------- |
| FeatureOnlyA | 10    | roadmap |
| FeatureOnlyB | 20    | active  |

**Single include tag is extracted**

- Given a feature with process tags:
- When extracting Gherkin patterns
- Then the extracted pattern has include "reference-sample"

| tag                      |
| ------------------------ |
| libar-docs               |
| pattern:IncludeTest      |
| status:roadmap           |
| phase:01                 |
| include:reference-sample |

**CSV include tag produces multiple values**

- Given a feature with process tags:
- When extracting Gherkin patterns
- Then the extracted pattern has include "doc-a"
- And the extracted pattern has include "doc-b"

| tag                  |
| -------------------- |
| libar-docs           |
| pattern:MultiInclude |
| status:roadmap       |
| phase:01             |
| include:doc-a,doc-b  |

**Feature without include tag has no include field**

- Given a feature with process tags:
- When extracting Gherkin patterns
- Then the extracted pattern has no include field

| tag               |
| ----------------- |
| libar-docs        |
| pattern:NoInclude |
| status:roadmap    |
| phase:01          |

## Business Rules

**Process metadata is extracted from feature tags**

_Verified by: Complete process metadata extraction, Minimal required tags extraction, Missing pattern tag returns null, Missing phase tag returns null_

**Deliverables are extracted from Background tables**

_Verified by: Standard deliverables table extraction, Extended deliverables with Finding and Release, Feature without background returns empty, Tests column handles various formats_

**Code and feature patterns are combined into dual-source patterns**

_Verified by: Matching code and feature are combined, Code-only pattern has no matching feature, Feature-only pattern has no matching code, Phase mismatch creates validation error, Pattern name collision merges sources_

**Dual-source results are validated for consistency**

_Verified by: Clean results have no errors, Cross-validation errors are reported, Orphaned roadmap code stubs produce warnings, Feature-only roadmap patterns produce warnings_

**Include tags are extracted from Gherkin feature tags**

_Verified by: Single include tag is extracted, CSV include tag produces multiple values, Feature without include tag has no include field_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
