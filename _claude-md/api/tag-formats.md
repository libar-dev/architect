### Tag Format Types

Tags have different value formats for parsing:

| Format         | Example                    | Description                    |
| -------------- | -------------------------- | ------------------------------ |
| `flag`         | `@docs-core`               | Boolean presence (no value)    |
| `value`        | `@docs-pattern MyPattern`  | Simple string value            |
| `enum`         | `@docs-status completed`   | Constrained to predefined list |
| `csv`          | `@docs-uses A, B, C`       | Comma-separated values         |
| `number`       | `@docs-phase 15`           | Numeric value                  |
| `quoted-value` | `@docs-brief:'Multi word'` | Preserves spaces in value      |

#### Status Normalization

All codecs normalize status to three canonical display values:

| Input Status                        | Normalized To |
| ----------------------------------- | ------------- |
| `completed`                         | `completed`   |
| `active`                            | `active`      |
| `roadmap`, `deferred`, or undefined | `planned`     |

#### Tag Value Constraints

**Tag values cannot contain spaces.** Use hyphens instead:

| Invalid                        | Valid                          |
| ------------------------------ | ------------------------------ |
| `@unlock-reason:Fix for issue` | `@unlock-reason:Fix-for-issue` |
| `@pattern:My Pattern`          | `@pattern:MyPattern`           |
