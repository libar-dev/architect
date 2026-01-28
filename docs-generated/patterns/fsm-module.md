# 🚧 FSM Module

**Purpose:** Detailed documentation for the FSM Module pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Validation |

## Description

:PDR005MvpWorkflow


## FSM Module - Phase State Machine Implementation

Central export for the 4-state FSM defined in PDR-005:

```
roadmap ──→ active ──→ completed
   │          │
   │          ↓
   │       roadmap (blocked/regressed)
   │
   ↓
deferred ──→ roadmap
```

### When to Use

- When validating status transitions in pre-commit hooks
- When checking protection levels for completed patterns
- When implementing workflow enforcement in CI/CD

### Module Contents

- **states.ts** - Status states and protection levels
- **transitions.ts** - Valid transition matrix
- **validator.ts** - Pure validation functions (Decider pattern)

### Usage Example

```typescript
import {
  validateStatus,
  validateTransition,
  getProtectionLevel,
  isValidTransition
} from "@libar-dev/delivery-process/validation/fsm";

// Validate a status value
const result = validateStatus("roadmap");
if (result.valid) {
  console.log("Valid status");
}

// Check transition validity
if (isValidTransition("roadmap", "active")) {
  console.log("Can start work");
}
```

---

[← Back to Pattern Registry](../PATTERNS.md)
