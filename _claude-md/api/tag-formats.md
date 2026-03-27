### Tag Format Types

Tags have different value formats for parsing:

| Format         | Example                         | Description                    |
| -------------- | ------------------------------- | ------------------------------ |
| `flag`         | `@architect-core`               | Boolean presence (no value)    |
| `value`        | `@architect-pattern MyPattern`  | Simple string value            |
| `enum`         | `@architect-status completed`   | Constrained to predefined list |
| `csv`          | `@architect-uses A, B, C`       | Comma-separated values         |
| `number`       | `@architect-phase 15`           | Numeric value                  |
| `quoted-value` | `@architect-brief:'Multi word'` | Preserves spaces in value      |

#### Status Normalization

All codecs normalize pattern status into three canonical reporting buckets:

| Input Status                        | Reporting Bucket |
| ----------------------------------- | ---------------- |
| `completed`                         | `completed`      |
| `active`                            | `active`         |
| `roadmap`, `deferred`, or undefined | `planned`        |

#### Tag Value Constraints

**Tag values cannot contain spaces.** Use hyphens instead:

| Invalid                        | Valid                          |
| ------------------------------ | ------------------------------ |
| `@unlock-reason:Fix for issue` | `@unlock-reason:Fix-for-issue` |
| `@pattern:My Pattern`          | `@pattern:MyPattern`           |
