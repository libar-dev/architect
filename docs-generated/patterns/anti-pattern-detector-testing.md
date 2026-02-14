# ✅ Anti Pattern Detector Testing

**Purpose:** Detailed documentation for the Anti Pattern Detector Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

Detects violations of the dual-source documentation architecture and
  process hygiene issues that lead to documentation drift.

  **Problem:**
  - Dependencies in features (should be code-only) cause drift
  - Process metadata in code (should be features-only) violates separation
  - Generator hints in features create tight coupling
  - Large feature files are hard to maintain

  **Solution:**
  - detectProcessInCode() finds feature-only tags in code
  - detectMagicComments() finds generator hints in features
  - detectScenarioBloat() warns about too many scenarios
  - detectMegaFeature() warns about large feature files

## Acceptance Criteria

**Code without process tags passes**

- Given a TypeScript file with directive tags:
- When detecting process-in-code anti-patterns
- Then no violations are found

| tag |
| --- |
| @libar-docs |
| @libar-docs-pattern |
| @libar-docs-status |
| @libar-docs-depends-on |

**Feature-only process tags in code are flagged**

- Given a TypeScript file with process tag "<process_tag>"
- When detecting process-in-code anti-patterns
- Then a "process-in-code" violation is found
- And the violation severity is "error"
- And the fix suggests moving to feature file

**Feature without magic comments passes**

- Given a feature file content:
- When detecting magic comments with threshold 5
- Then no violations are found

```markdown
Feature: Normal Feature
  A normal feature without generator hints.

Scenario: Normal scenario
  Given some precondition
  Then some result
```

**Features with excessive magic comments are flagged**

- Given a feature file with 6 magic comments
- When detecting magic comments with threshold 5
- Then a "magic-comments" violation is found
- And the violation severity is "warning"
- And the violation message mentions "6 magic comments"

**Magic comments within threshold pass**

- Given a feature file content:
- When detecting magic comments with threshold 5
- Then no violations are found

```markdown
# GENERATOR: header
Feature: Acceptable Feature
  Some generator hint is OK.
```

**Feature with few scenarios passes**

- Given a feature with 5 scenarios
- When detecting scenario bloat with threshold 20
- Then no violations are found

**Feature exceeding scenario threshold is flagged**

- Given a feature with 25 scenarios
- When detecting scenario bloat with threshold 20
- Then a "scenario-bloat" violation is found
- And the violation severity is "warning"
- And the fix suggests splitting the feature

**Normal-sized feature passes**

- Given a feature file with 100 lines
- When detecting mega-feature with threshold 500
- Then no violations are found

**Oversized feature is flagged**

- Given a feature file with 600 lines
- When detecting mega-feature with threshold 500
- Then a "mega-feature" violation is found
- And the violation severity is "warning"
- And the violation message mentions "lines"

**Combined detection finds process-in-code issues**

- Given a TypeScript file with directive tags:
- And a feature file with tags:
- When detecting all anti-patterns
- Then 1 violation is found
- And violations include "process-in-code"

| tag |
| --- |
| @libar-docs |
| @libar-docs-quarter |

| tag |
| --- |
| libar-docs-pattern:MyTest |

**Empty violations produce clean report**

- Given no violations
- When formatting the anti-pattern report
- Then the report contains "No anti-patterns detected"

**Violations are grouped by severity**

- Given violations:
- When formatting the anti-pattern report
- Then the report contains "Errors (architectural violations)"
- And the report contains "Warnings (hygiene issues)"
- And the report shows "2 errors, 1 warning"

| id | severity |
| --- | --- |
| tag-duplication | error |
| magic-comments | warning |
| process-in-code | error |

## Business Rules

**Process metadata should not appear in TypeScript code**

_Verified by: Code without process tags passes, Feature-only process tags in code are flagged_

**Generator hints should not appear in feature files**

_Verified by: Feature without magic comments passes, Features with excessive magic comments are flagged, Magic comments within threshold pass_

**Feature files should not have excessive scenarios**

_Verified by: Feature with few scenarios passes, Feature exceeding scenario threshold is flagged_

**Feature files should not exceed size thresholds**

_Verified by: Normal-sized feature passes, Oversized feature is flagged_

**All anti-patterns can be detected in one pass**

_Verified by: Combined detection finds process-in-code issues_

**Violations can be formatted for console output**

_Verified by: Empty violations produce clean report, Violations are grouped by severity_

---

[← Back to Pattern Registry](../PATTERNS.md)
