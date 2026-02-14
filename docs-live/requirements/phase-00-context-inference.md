# ✅ Context Inference

**Purpose:** Detailed requirements for the Context Inference feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Annotation |

## Description

**Problem:**
Patterns in standard directories (src/validation/, src/scanner/) should
automatically receive architecture context without explicit annotation.

**Solution:**
Implement configurable inference rules that map file path patterns to
bounded contexts using wildcard matching.

## Acceptance Criteria

**Recursive wildcard matches nested paths**

- Given a pattern rule "<pattern>" for context "test-context"
- And a pattern at file path "<filePath>" with archLayer "application"
- When transforming to master dataset with rules
- Then the pattern archContext should be "<expectedContext>"

**Single-level wildcard matches direct children only**

- Given a pattern rule "<pattern>" for context "test-context"
- And a pattern at file path "<filePath>" with archLayer "application"
- When transforming to master dataset with rules
- Then the pattern archContext should be "<expectedContext>"

**Prefix matching behavior**

- Given a pattern rule "<pattern>" for context "test-context"
- And a pattern at file path "<filePath>" with archLayer "application"
- When transforming to master dataset with rules
- Then the pattern archContext should be "<expectedContext>"

**Empty rules array returns undefined**

- Given no context inference rules
- And a pattern at file path "src/unknown/file.ts" with archLayer "application"
- When transforming to master dataset with rules
- Then the pattern has no inferred archContext
- And the pattern is not in archIndex byContext

**File path does not match any rule**

- Given default context inference rules
- And a pattern at file path "unknown/path/file.ts" with archLayer "application"
- When transforming to master dataset with rules
- Then the pattern has no inferred archContext
- And the pattern is not in archIndex byContext

**Single matching rule infers context**

- Given default context inference rules
- And a pattern at file path "src/validation/rules.ts" with archLayer "application"
- When transforming to master dataset with rules
- Then the pattern archContext should be "validation"
- And the pattern appears in archIndex byContext under "validation"

**First matching rule wins when multiple could match**

- Given context inference rules:
- And a pattern at file path "src/validation/rules.ts" with archLayer "application"
- When transforming to master dataset with rules
- Then the pattern archContext should be "validation"

| pattern             | context    |
| ------------------- | ---------- |
| src/validation/\*\* | validation |
| src/\*\*            | general    |

**Explicit context takes precedence over inference**

- Given default context inference rules
- And a pattern at file path "src/validation/rules.ts" with archLayer "application" and archContext "custom"
- When transforming to master dataset with rules
- Then the pattern archContext should be "custom"
- And the pattern appears in archIndex byContext under "custom"

**Pattern without archLayer is still added to byContext if context is inferred**

- Given default context inference rules
- And a pattern at file path "src/validation/rules.ts" without archLayer
- When transforming to master dataset with rules
- Then the pattern is in archIndex all
- And the pattern appears in archIndex byContext under "validation"

**Default directory mappings**

- Given default context inference rules
- And a pattern at file path "<filePath>" with archLayer "application"
- When transforming to master dataset with rules
- Then the pattern archContext should be "<expectedContext>"

## Business Rules

**matchPattern supports recursive wildcard \*\***

_Verified by: Recursive wildcard matches nested paths_

**matchPattern supports single-level wildcard /\***

_Verified by: Single-level wildcard matches direct children only_

**matchPattern supports prefix matching**

_Verified by: Prefix matching behavior_

**inferContext returns undefined when no rules match**

_Verified by: Empty rules array returns undefined, File path does not match any rule_

**inferContext applies first matching rule**

_Verified by: Single matching rule infers context, First matching rule wins when multiple could match_

**Explicit archContext is not overridden**

_Verified by: Explicit context takes precedence over inference_

**Inference works independently of archLayer**

_Verified by: Pattern without archLayer is still added to byContext if context is inferred_

**Default rules map standard directories**

_Verified by: Default directory mappings_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
