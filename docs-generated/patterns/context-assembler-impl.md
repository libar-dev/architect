# 🚧 Context Assembler Impl

**Purpose:** Detailed documentation for the Context Assembler Impl pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Pattern |

## Description

Pure function composition over MasterDataset. Reads from 5 pre-computed
views (patterns, relationshipIndex, archIndex, deliverables, FSM) and
assembles them into a ContextBundle tailored to the session type.

The assembler does NOT format output. It produces structured data that
the ContextFormatter renders as plain text (see ADR-008).

---

[← Back to Pattern Registry](../PATTERNS.md)
