# ✅ ADR 003 Ephemeral Persistent Separation

**Purpose:** Detailed documentation for the ADR 003 Ephemeral Persistent Separation pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |
| Phase | 43 |

## Description

**Context:**
  Generated documentation mixed session-specific content with persistent docs.
  - PR-CHANGES.md regenerated frequently but lived alongside persistent files
  - Confusing which files should be committed vs ephemeral
  - CURRENT-WORK.md and SESSION-CONTEXT.md are session-specific
  - No clear organization for working documents
  - Risk of committing ephemeral content to version control

  **Decision:**
  Separate ephemeral (session/PR) content into working/ subdirectory:
  - working/PR-CHANGES.md for PR-specific content
  - Clear visual distinction between persistent and ephemeral
  - INDEX.md explains the distinction
  - Ephemeral files regenerated per session
  - Persistent files regenerated on demand

  **Consequences:**
  - (+) Clear separation of ephemeral and persistent documentation
  - (+) Reduces confusion about what to commit
  - (+) Working directory can be gitignored if desired
  - (+) INDEX.md provides clear documentation map
  - (-) Additional directory to maintain
  - (-) Slightly more complex file organization

## Acceptance Criteria

**PR-CHANGES generated to working/ subfolder**

- Given the docs-living/working/ directory exists
- When running pnpm docs:self-pr-changes
- Then working/PR-CHANGES.md is created
- And root-level PR-CHANGES.md is not created

---

[← Back to Pattern Registry](../PATTERNS.md)
