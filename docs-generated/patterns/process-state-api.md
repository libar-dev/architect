# 🚧 Process State API

**Purpose:** Detailed documentation for the Process State API pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

:FSMValidator


## Process State API - Programmatic Query Interface

TypeScript interface for querying delivery process state.
Designed for Claude Code integration and programmatic access.

### Key Features

- **Status Queries**: Get patterns by status, counts, distributions
- **Phase Queries**: Get phase progress, active phases, patterns
- **FSM Queries**: Validate transitions, check protection levels
- **Pattern Queries**: Find patterns, get dependencies, deliverables
- **Timeline Queries**: Group by quarter, get current work, roadmap

### Usage

```typescript
import { createProcessStateAPI } from "@libar-dev/delivery-process";

const api = createProcessStateAPI(masterDataset);

// Get current work
const active = api.getCurrentWork();

// Check transition
if (api.isValidTransition("roadmap", "active")) {
  console.log("Can start work");
}
```

---

[← Back to Pattern Registry](../PATTERNS.md)
