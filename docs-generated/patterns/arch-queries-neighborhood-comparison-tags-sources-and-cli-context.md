# 📋 ArchQueries — Neighborhood, Comparison, Tags, Sources, and CLI Context

**Purpose:** Detailed documentation for the ArchQueries — Neighborhood, Comparison, Tags, Sources, and CLI Context pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Status |

## Description

Extends the existing `arch` subcommand with deeper analysis and adds
new top-level discovery commands (tags, sources). Also defines the
SubcommandContext type used by all new CLI handlers (ADR-008).

### Design Decisions

- DS-D-2: Neighborhood is fixed 1-hop (spec says "1-hop relationships")
- DS-D-3: Source categorization uses path heuristics (no re-scan)
- DS-D-4: Tag aggregation is single-pass over patterns

### CLI Integration

New cases in handleArch(): neighborhood, compare, coverage
New top-level subcommands: tags, sources, unannotated
All use SubcommandContext for access to CLI config and registry.

Target: src/api/arch-queries.ts (neighborhood, compare, tags, sources)
See: DataAPIArchitectureQueries spec, Rules 1-3
Since: DS-D

---

[← Back to Pattern Registry](../PATTERNS.md)
