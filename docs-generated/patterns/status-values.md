# ✅ Status Values

**Purpose:** Detailed documentation for the Status Values pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

THE single source of truth for FSM state values in the monorepo (per PDR-005 FSM).

FSM transitions:
- roadmap to active (start work)
- roadmap to deferred (pause before start)
- deferred to roadmap (resume planning)
- active to completed (finish work)
- active to deferred (pause work)
- deferred to active (resume work)
- active cannot regress to roadmap

---

[← Back to Pattern Registry](../PATTERNS.md)
