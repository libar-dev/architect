# 🚧 Process State API

**Purpose:** Detailed documentation for the Process State API pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

TypeScript interface for querying delivery process state.
Designed for Claude Code integration and programmatic access.

### When to Use

- When querying patterns by status, phase, or relationships
- When validating FSM transitions before making changes
- When building dashboards or reports on delivery progress
- When Claude Code needs real-time delivery state (prefer over reading Markdown)

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
