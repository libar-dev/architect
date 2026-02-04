# 🚧 API Module

**Purpose:** Detailed documentation for the API Module pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Central export for the Process State API, providing a TypeScript
interface for querying delivery process state.

### When to Use

- When building tools that need programmatic access to delivery process state
- When integrating with Claude Code for real-time process queries
- When building CI/CD pipelines that validate delivery workflow

### Usage

```typescript
import {
  createProcessStateAPI,
  type ProcessStateAPI,
  type QueryResult,
} from "@libar-dev/delivery-process/api";

const api = createProcessStateAPI(masterDataset);

// Query current work
const activeWork = api.getCurrentWork();

// Check FSM transition
const check = api.checkTransition("roadmap", "active");
if (check.valid) {
  console.log("Transition is valid");
}
```

---

[← Back to Pattern Registry](../PATTERNS.md)
