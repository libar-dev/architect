# Protection Levels

**Purpose:** Detailed protection level reference per PDR-005

---

## Protection Levels

Detailed explanation of protection levels per PDR-005 MVP Workflow.

| Level   | Applies To            | Meaning                                         |
| ------- | --------------------- | ----------------------------------------------- |
| `none`  | `roadmap`, `deferred` | Fully editable, no restrictions                 |
| `scope` | `active`              | Scope-locked, prevents adding new deliverables  |
| `hard`  | `completed`           | Hard-locked, requires explicit unlock to modify |

## Level Details

### `none` Protection

**Applies to:** `roadmap`, `deferred`

| Aspect  | Description                                         |
| ------- | --------------------------------------------------- |
| Meaning | Fully editable, no restrictions                     |
| Allowed | All modifications including adding new deliverables |
| Blocked | Nothing                                             |

### `scope` Protection

**Applies to:** `active`

| Aspect  | Description                                    |
| ------- | ---------------------------------------------- |
| Meaning | Scope-locked, prevents adding new deliverables |
| Allowed | Edit existing deliverables, change status      |
| Blocked | Adding new deliverables (scope creep)          |

### `hard` Protection

**Applies to:** `completed`

| Aspect  | Description                                     |
| ------- | ----------------------------------------------- |
| Meaning | Hard-locked, requires explicit unlock to modify |
| Allowed | Nothing (without unlock-reason tag)             |
| Blocked | All modifications                               |

---

[Back to Validation Rules](../VALIDATION-RULES.md)
