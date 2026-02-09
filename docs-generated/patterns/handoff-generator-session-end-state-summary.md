# 📋 HandoffGenerator — Session-End State Summary

**Purpose:** Detailed documentation for the HandoffGenerator — Session-End State Summary pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Status |

## Description

Pure function that assembles a handoff document from ProcessStateAPI
and MasterDataset. Captures everything the next session needs to
continue work without context loss.

### Algorithm

1. Resolve focal pattern via api.getPattern(name) — error if not found
2. Infer session type from FSM status (PDR-002 DD-3):
   active → implement, roadmap → design, completed → review, deferred → design
   Explicit sessionType option overrides inference.
3. Build sections in order:
   a. Session summary (name, type, date, status)
   b. Completed deliverables (status matches complete indicators)
   c. In-progress deliverables (not complete, not planned/Pending)
   d. Files modified (from modifiedFiles param, omitted if empty)
   e. Discovered items (discoveredGaps/Improvements/Learnings)
   f. Blockers (incomplete dependencies)
   g. Next session priorities (remaining deliverables, ordered)
4. Return HandoffDocument with all populated sections

### Reused Building Blocks

- api.getPattern(name) — pattern metadata + discovery tags
- api.getPatternDeliverables(name) — deliverable status split
- api.getPatternDependencies(name) — blocker identification
- isDeliverableComplete() logic from context-formatter.ts
  (reuse the COMPLETE_STATUSES set: done, complete, completed, check, x)

### Date Handling (PDR-002 DD-5)

Always uses current date: new Date().toISOString().slice(0, 10).
No --date flag. Handoff is run at session end.

### Git Integration (PDR-002 DD-2)

This module has NO shell dependency. The modifiedFiles parameter is
populated by the CLI handler when --git flag is present. The CLI calls:
  execSync('git diff --name-only HEAD', { encoding: 'utf-8' })
and passes the resulting file list. Without --git, the section is omitted.

See: PDR-002 (DD-1 through DD-7), DataAPIDesignSessionSupport spec Rule 2

---

[← Back to Pattern Registry](../PATTERNS.md)
