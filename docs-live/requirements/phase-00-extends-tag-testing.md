# ✅ Extends Tag Testing

**Purpose:** Detailed requirements for the Extends Tag Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Annotation |

## Description

Tests for the @libar-docs-extends tag which establishes generalization
  relationships between patterns (pattern inheritance).

## Acceptance Criteria

**Extends tag exists in registry**

- Given the tag registry is loaded
- When querying for tag "extends"
- Then the tag should exist
- And the tag format should be "value"
- And the tag purpose should mention "generalization"

**Parse extends from feature file**

- Given a Gherkin file with tags:
- When the Gherkin parser extracts metadata
- Then the pattern should have extends "ProjectionCategories"

```gherkin
@libar-docs
@libar-docs-pattern:ReactiveProjections
@libar-docs-extends:ProjectionCategories
Feature: Reactive Projections
```

**Extends preserved through extraction pipeline**

- Given a scanned file with extends "ProjectionCategories"
- When the extractor builds ExtractedPattern
- Then the pattern should have extendsPattern "ProjectionCategories"

**Extended pattern knows its extensions**

- Given patterns:
- And a pattern "ProjectionCategories" exists
- When the relationship index is built
- Then "ProjectionCategories" should have extendedBy ["ReactiveProjections", "CachedProjections"]

| name | extendsPattern |
| --- | --- |
| ReactiveProjections | ProjectionCategories |
| CachedProjections | ProjectionCategories |

**Direct circular inheritance detected**

- Given pattern A with extends "B"
- And pattern B with extends "A"
- When the linter validates relationships
- Then an error should be emitted for circular inheritance
- And the error should mention both "A" and "B"

**Transitive circular inheritance detected**

- Given pattern A with extends "B"
- And pattern B with extends "C"
- And pattern C with extends "A"
- When the linter validates relationships
- Then an error should be emitted for circular inheritance

## Business Rules

**Extends tag is defined in taxonomy registry**

_Verified by: Extends tag exists in registry_

**Patterns can extend exactly one base pattern**

Extends uses single-value format because pattern inheritance should be
    single-inheritance to avoid diamond problems.

_Verified by: Parse extends from feature file, Extends preserved through extraction pipeline_

**Transform builds extendedBy reverse lookup**

_Verified by: Extended pattern knows its extensions_

**Linter detects circular inheritance chains**

_Verified by: Direct circular inheritance detected, Transitive circular inheritance detected_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
