# ✅ Context Inference

**Purpose:** Detailed documentation for the Context Inference pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

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

| pattern | context |
| --- | --- |
| src/validation/** | validation |
| src/** | general |

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

**matchPattern supports recursive wildcard ****

**Invariant:** The `**` wildcard matches files at any nesting depth below the specified directory prefix.
    **Rationale:** Directory hierarchies vary in depth; recursive matching ensures all nested files inherit context.
    **Verified by:** Recursive wildcard matches nested paths

_Verified by: Recursive wildcard matches nested paths_

**matchPattern supports single-level wildcard /***

**Invariant:** The `/*` wildcard matches only direct children of the specified directory, not deeper nested files.
    **Rationale:** Some contexts apply only to a specific directory level, not its entire subtree.
    **Verified by:** Single-level wildcard matches direct children only

_Verified by: Single-level wildcard matches direct children only_

**matchPattern supports prefix matching**

**Invariant:** A trailing slash pattern matches any file whose path starts with that directory prefix.
    **Verified by:** Prefix matching behavior

_Verified by: Prefix matching behavior_

**inferContext returns undefined when no rules match**

**Invariant:** When no inference rule matches a file path, the pattern receives no inferred context and is excluded from the byContext index.
    **Rationale:** Unmatched files must not receive a spurious context assignment; absence of context is a valid state.
    **Verified by:** Empty rules array returns undefined, File path does not match any rule

_Verified by: Empty rules array returns undefined, File path does not match any rule_

**inferContext applies first matching rule**

**Invariant:** When multiple rules could match a file path, only the first matching rule determines the inferred context.
    **Rationale:** Deterministic ordering prevents ambiguous context assignment when rules overlap.
    **Verified by:** Single matching rule infers context, First matching rule wins when multiple could match

_Verified by: Single matching rule infers context, First matching rule wins when multiple could match_

**Explicit archContext is not overridden**

**Invariant:** A pattern with an explicitly annotated archContext retains that value regardless of matching inference rules.
    **Rationale:** Explicit annotations represent intentional developer decisions that must not be silently overwritten by automation.
    **Verified by:** Explicit context takes precedence over inference

_Verified by: Explicit context takes precedence over inference_

**Inference works independently of archLayer**

**Invariant:** Context inference operates on file path alone; the presence or absence of archLayer does not affect context assignment.
    **Verified by:** Pattern without archLayer is still added to byContext if context is inferred

_Verified by: Pattern without archLayer is still added to byContext if context is inferred_

**Default rules map standard directories**

**Invariant:** Each standard source directory (validation, scanner, extractor, etc.) maps to a well-known bounded context name via the default rule set.
    **Rationale:** Convention-based mapping eliminates the need for explicit context annotations on every file in standard directories.
    **Verified by:** Default directory mappings

_Verified by: Default directory mappings_

---

[← Back to Pattern Registry](../PATTERNS.md)
