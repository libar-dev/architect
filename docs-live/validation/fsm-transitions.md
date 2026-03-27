# FSM Transitions

**Purpose:** Complete state transition reference for Process Guard FSM

---

## FSM Transition Matrix

Complete transition matrix showing all valid state changes per PDR-005.

| From        | To          | Description                            |
| ----------- | ----------- | -------------------------------------- |
| `roadmap`   | `active`    | Start implementation work              |
| `roadmap`   | `deferred`  | Park work for later                    |
| `roadmap`   | `roadmap`   | Stay in planning (self-transition)     |
| `active`    | `completed` | Finish implementation                  |
| `active`    | `roadmap`   | Regress due to blocker or scope change |
| `completed` | (none)      | Terminal state - no valid transitions  |
| `deferred`  | `roadmap`   | Reactivate deferred work               |

## Transitions by State

### From `roadmap`

| Target     | Description                        |
| ---------- | ---------------------------------- |
| `active`   | Start implementation work          |
| `deferred` | Park work for later                |
| `roadmap`  | Stay in planning (self-transition) |

### From `active`

| Target      | Description                            |
| ----------- | -------------------------------------- |
| `completed` | Finish implementation                  |
| `roadmap`   | Regress due to blocker or scope change |

### From `completed`

**Terminal state** - no valid transitions. Use `@architect-unlock-reason` to modify.

### From `deferred`

| Target    | Description              |
| --------- | ------------------------ |
| `roadmap` | Reactivate deferred work |

---

[Back to Validation Rules](../VALIDATION-RULES.md)
