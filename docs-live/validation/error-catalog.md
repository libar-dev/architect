# Error Catalog

**Purpose:** Complete error message reference with fix instructions

---

## Error Catalog

Complete error messages and fix instructions for all 6 validation rules.

| Rule ID                     | Severity | Description                                         |
| --------------------------- | -------- | --------------------------------------------------- |
| `completed-protection`      | error    | Completed specs require unlock-reason tag to modify |
| `invalid-status-transition` | error    | Status transitions must follow FSM path             |
| `scope-creep`               | error    | Active specs cannot add new deliverables            |
| `session-scope`             | warning  | File outside session scope                          |
| `session-excluded`          | error    | File explicitly excluded from session               |
| `deliverable-removed`       | warning  | Deliverable was removed from spec                   |

## Rule Details

### `completed-protection`

| Property    | Value                                                             |
| ----------- | ----------------------------------------------------------------- |
| Severity    | error                                                             |
| Description | Completed specs require unlock-reason tag to modify               |
| Cause       | File has `completed` status but no `@architect-unlock-reason` tag |
| Fix         | Add `@architect-unlock-reason:'your reason'` to proceed           |

### `invalid-status-transition`

| Property    | Value                                                |
| ----------- | ---------------------------------------------------- |
| Severity    | error                                                |
| Description | Status transitions must follow FSM path              |
| Cause       | Attempted transition not in VALID_TRANSITIONS matrix |
| Fix         | Follow path: roadmap -> active -> completed          |

### `scope-creep`

| Property    | Value                                               |
| ----------- | --------------------------------------------------- |
| Severity    | error                                               |
| Description | Active specs cannot add new deliverables            |
| Cause       | Added deliverable to spec with `active` status      |
| Fix         | Create new spec OR revert to `roadmap` status first |

### `session-scope`

| Property    | Value                                               |
| ----------- | --------------------------------------------------- |
| Severity    | warning                                             |
| Description | File outside session scope                          |
| Cause       | Modified file not in session's scopedSpecs list     |
| Fix         | Add to session scope OR use `--ignore-session` flag |

### `session-excluded`

| Property    | Value                                          |
| ----------- | ---------------------------------------------- |
| Severity    | error                                          |
| Description | File explicitly excluded from session          |
| Cause       | File in session's excludedSpecs list           |
| Fix         | Remove from exclusion OR use different session |

### `deliverable-removed`

| Property    | Value                                               |
| ----------- | --------------------------------------------------- |
| Severity    | warning                                             |
| Description | Deliverable was removed from spec                   |
| Cause       | Deliverable removed from Background table           |
| Fix         | Document reason for removal (completed or descoped) |

---

[Back to Validation Rules](../VALIDATION-RULES.md)
