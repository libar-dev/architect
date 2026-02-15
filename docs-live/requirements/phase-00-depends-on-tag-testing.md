# 🚧 Depends On Tag Testing

**Purpose:** Detailed requirements for the Depends On Tag Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | active     |
| Product Area | Annotation |

## Description

Tests extraction of @libar-docs-depends-on and @libar-docs-enables
relationship tags from Gherkin files.

## Acceptance Criteria

**Depends-on tag exists in registry**

- Given the tag registry is loaded
- When querying for tag "depends-on"
- Then the tag should exist
- And the tag format should be "csv"
- And the tag purpose should mention "dependencies"

**Enables tag exists in registry**

- Given the tag registry is loaded
- When querying for tag "enables"
- Then the tag should exist
- And the tag format should be "csv"
- And the tag purpose should mention "enables"

**Depends-on extracted from feature file**

- Given a Gherkin file with tags:
- When the Gherkin parser extracts metadata
- Then the pattern should have dependsOn "FeatureA"

```gherkin
@libar-docs
@libar-docs-pattern:FeatureB
@libar-docs-status:roadmap
@libar-docs-depends-on:FeatureA
Feature: Feature B
```

**Multiple depends-on values extracted as CSV**

- Given a Gherkin file with tags:
- When the Gherkin parser extracts metadata
- Then the pattern should have dependsOn "FeatureA, FeatureB"

```gherkin
@libar-docs
@libar-docs-pattern:FeatureC
@libar-docs-status:roadmap
@libar-docs-depends-on:FeatureA,FeatureB
Feature: Feature C
```

**Depends-on in TypeScript is detected by lint rule**

- Given a TypeScript file with depends-on "ServiceY"
- When the missing-relationship-target rule runs with known patterns
- Then the uses relationship is checked not depends-on

**Enables extracted from feature file**

- Given a Gherkin file with tags:
- When the Gherkin parser extracts metadata
- Then the pattern should have enables "FeatureB"

```gherkin
@libar-docs
@libar-docs-pattern:FeatureA
@libar-docs-status:active
@libar-docs-enables:FeatureB
Feature: Feature A
```

**Multiple enables values extracted as CSV**

- Given a Gherkin file with tags:
- When the Gherkin parser extracts metadata
- Then the pattern should have enables "ServiceA, ServiceB"

```gherkin
@libar-docs
@libar-docs-pattern:Foundation
@libar-docs-status:active
@libar-docs-enables:ServiceA,ServiceB
Feature: Foundation
```

**DependsOn relationships stored in relationship index**

- Given patterns with planning dependencies:
- And a pattern "FeatureA" exists
- When the relationship index is built
- Then "FeatureB" should have dependsOn containing "FeatureA"
- And "FeatureC" should have dependsOn containing "FeatureA"

| name     | dependsOn |
| -------- | --------- |
| FeatureB | FeatureA  |
| FeatureC | FeatureA  |

**Enables relationships stored explicitly**

- Given a pattern "FeatureA" with enables "FeatureB, FeatureC"
- When the relationship index is built
- Then "FeatureA" should have enables containing "FeatureB"
- And "FeatureA" should have enables containing "FeatureC"

## Business Rules

**Depends-on tag is defined in taxonomy registry**

**Invariant:** The depends-on and enables tags must exist in the taxonomy registry with CSV format.
**Verified by:** Depends-on tag exists in registry, Enables tag exists in registry

_Verified by: Depends-on tag exists in registry, Enables tag exists in registry_

**Depends-on tag is extracted from Gherkin files**

**Invariant:** The Gherkin parser must extract depends-on values from feature file tags, including CSV multi-value lists.
**Verified by:** Depends-on extracted from feature file, Multiple depends-on values extracted as CSV

_Verified by: Depends-on extracted from feature file, Multiple depends-on values extracted as CSV_

**Depends-on in TypeScript triggers anti-pattern warning**

**Invariant:** The depends-on tag must only appear in Gherkin files; its presence in TypeScript is an anti-pattern.
**Rationale:** Depends-on represents planning dependencies owned by Gherkin specs, not runtime dependencies owned by TypeScript.
**Verified by:** Depends-on in TypeScript is detected by lint rule

    The depends-on tag is for planning dependencies and belongs in feature
    files, not TypeScript code. TypeScript files should use "uses" for
    runtime dependencies.

_Verified by: Depends-on in TypeScript is detected by lint rule_

**Enables tag is extracted from Gherkin files**

**Invariant:** The Gherkin parser must extract enables values from feature file tags, including CSV multi-value lists.
**Verified by:** Enables extracted from feature file, Multiple enables values extracted as CSV

_Verified by: Enables extracted from feature file, Multiple enables values extracted as CSV_

**Planning dependencies are stored in relationship index**

**Invariant:** The relationship index must store dependsOn and enables relationships extracted from pattern metadata.
**Verified by:** DependsOn relationships stored in relationship index, Enables relationships stored explicitly

    The relationship index stores dependsOn and enables relationships
    directly from pattern metadata. These are explicit declarations.

_Verified by: DependsOn relationships stored in relationship index, Enables relationships stored explicitly_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
