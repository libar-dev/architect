# 🚧 File Cache

**Purpose:** Detailed documentation for the File Cache pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Pattern |

## Description

Simple Map-based cache for file contents during a single generation run.
Avoids repeated disk reads for files accessed multiple times during
extraction and deduplication phases.

### Design Rationale

- **Request-scoped**: Created fresh per orchestrator run, naturally cleared when done
- **No eviction needed**: Generation runs are bounded in duration and file count
- **Thread-safe**: Single-threaded Node.js, no locking required
- **Stats tracking**: Optional hit/miss tracking for performance analysis

---

[← Back to Pattern Registry](../PATTERNS.md)
