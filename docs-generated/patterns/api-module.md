# 🚧 API Module

**Purpose:** Detailed documentation for the API Module pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

## API Module - Programmatic Process State Interface

Central export for the Process State API, providing a TypeScript
interface for querying delivery process state.

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
