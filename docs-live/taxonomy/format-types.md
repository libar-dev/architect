# Format Type Reference

**Purpose:** Detailed format type parsing behavior and examples

---

## Format Type Reference

Detailed parsing behavior for each format type.

### `value`

| Property         | Value                                               |
| ---------------- | --------------------------------------------------- |
| Description      | Simple string value                                 |
| Parsing Behavior | Captures everything after the tag name as the value |
| Example          | `@libar-docs-pattern CommandOrchestrator`           |
| Notes            | Most common format for single-value tags            |

### `enum`

| Property         | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| Description      | Constrained to predefined values                             |
| Parsing Behavior | Validates value against allowed list; rejects invalid values |
| Example          | `@libar-docs-status roadmap`                                 |
| Notes            | Used for FSM states, priority levels, risk levels            |

### `quoted-value`

| Property         | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| Description      | String in quotes (preserves spaces)                            |
| Parsing Behavior | Extracts content between quotes; preserves internal whitespace |
| Example          | `@libar-docs-usecase "When a user submits a form"`             |
| Notes            | Use for human-readable text with spaces                        |

### `csv`

| Property         | Value                                                 |
| ---------------- | ----------------------------------------------------- |
| Description      | Comma-separated values                                |
| Parsing Behavior | Splits on commas; trims whitespace from each value    |
| Example          | `@libar-docs-uses CommandBus, EventStore, Projection` |
| Notes            | Used for relationship tags and multi-value references |

### `number`

| Property         | Value                               |
| ---------------- | ----------------------------------- |
| Description      | Numeric value                       |
| Parsing Behavior | Parses as integer; NaN if invalid   |
| Example          | `@libar-docs-phase 14`              |
| Notes            | Used for phase numbers and ordering |

### `flag`

| Property         | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| Description      | Boolean presence (no value needed)                      |
| Parsing Behavior | Presence of tag indicates true; absence indicates false |
| Example          | `@libar-docs-core`                                      |
| Notes            | Used for boolean markers like core, overview, decision  |

---

[Back to Taxonomy Reference](../TAXONOMY.md)
