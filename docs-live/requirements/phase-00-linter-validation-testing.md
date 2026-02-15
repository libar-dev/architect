# ✅ Linter Validation Testing

**Purpose:** Detailed requirements for the Linter Validation Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Validation |

## Description

Tests for lint rules that validate relationship integrity, detect conflicts,
and ensure bidirectional traceability consistency.

## Acceptance Criteria

**Pattern tag with implements tag causes error**

- Given a TypeScript file with:
- When the linter runs
- Then rule "pattern-conflict-in-implements" should trigger
- And the severity should be "error"
- And the message should mention "cannot implement itself"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern:EventStoreDurability
 * @libar-docs-implements:EventStoreDurability
 */
```

**Implements without pattern tag is valid**

- Given a TypeScript file with:
- When the linter runs
- Then rule "pattern-conflict-in-implements" should not trigger

```typescript
/**
 * @libar-docs
 * @libar-docs-implements:EventStoreDurability
 * @libar-docs-status:roadmap
 */
```

**Uses referencing non-existent pattern warns**

- Given a pattern with uses "NonExistentPattern"
- And no pattern named "NonExistentPattern" exists
- When the linter runs in strict mode
- Then rule "missing-relationship-target" should trigger
- And the severity should be "warning"
- And the message should mention "NonExistentPattern"

**Implements referencing non-existent pattern warns**

- Given a file implementing "NonExistentPattern"
- And no pattern named "NonExistentPattern" exists
- When the linter runs in strict mode
- Then rule "missing-relationship-target" should trigger

**Valid relationship target passes**

- Given a pattern with uses "CommandBus"
- And a pattern named "CommandBus" exists
- When the linter runs in strict mode
- Then rule "missing-relationship-target" should not trigger

**Missing back-link detected**

- Given a roadmap spec with executable-specs "path/to/tests"
- And no file at "path/to/tests" with roadmap-spec back-link
- When the linter runs in strict mode
- Then rule "asymmetric-traceability" should trigger
- And the message should mention "missing back-link"

**Orphan executable spec detected**

- Given a package spec with roadmap-spec "NonExistentPattern"
- And no pattern named "NonExistentPattern" exists
- When the linter runs
- Then rule "orphan-executable-spec" should trigger

**Invalid parent reference detected**

- Given a pattern with parent "NonExistentEpic"
- And no pattern named "NonExistentEpic" exists
- When the linter runs
- Then rule "invalid-parent-reference" should trigger
- And the severity should be "error"

**Valid parent reference passes**

- Given a pattern with parent "ProcessEnhancements"
- And an epic pattern named "ProcessEnhancements" exists
- When the linter runs
- Then rule "invalid-parent-reference" should not trigger

## Business Rules

**Pattern cannot implement itself (circular reference)**

**Invariant:** A pattern's implements tag must reference a different pattern than its own pattern tag.
**Rationale:** Self-implementing patterns create circular references that break the sub-pattern hierarchy.
**Verified by:** Pattern tag with implements tag causes error, Implements without pattern tag is valid

    A file cannot define a pattern that implements itself. This creates a
    circular reference. Different patterns are allowed (sub-pattern hierarchy).

_Verified by: Pattern tag with implements tag causes error, Implements without pattern tag is valid_

**Relationship targets should exist (strict mode)**

**Invariant:** Every relationship target must reference a pattern that exists in the known pattern registry when strict mode is enabled.
**Rationale:** Dangling references to non-existent patterns produce broken dependency graphs and misleading documentation.
**Verified by:** Uses referencing non-existent pattern warns, Implements referencing non-existent pattern warns, Valid relationship target passes

    In strict mode, all relationship targets are validated against known patterns.

_Verified by: Uses referencing non-existent pattern warns, Implements referencing non-existent pattern warns, Valid relationship target passes_

**Bidirectional traceability links should be consistent**

_Verified by: Missing back-link detected, Orphan executable spec detected_

**Parent references must be valid**

_Verified by: Invalid parent reference detected, Valid parent reference passes_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
