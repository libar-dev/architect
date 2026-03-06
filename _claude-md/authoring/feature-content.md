### Feature File Rich Content Guidelines

Feature files serve dual purposes: **executable specs** and **documentation source**. Content in the Feature description section appears in generated docs.

#### Code-First Principle

**Prefer code stubs over DocStrings for complex examples.** Feature files should reference code, not duplicate it.

| Approach                     | When to Use                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| DocStrings (`"""typescript`) | Brief examples (5-10 lines), current/target state comparison |
| Code stub reference          | Complex APIs, interfaces, full implementations               |

**Instead of large DocStrings:**

```gherkin
Rule: Reservations use atomic claim
  See `src/reservations/reserve.ts` for API.
```

Code stubs live in `delivery-process/stubs/{pattern-name}/` — annotated TypeScript with `throw new Error("not yet implemented")`.

#### Forbidden in Feature Descriptions

| Forbidden           | Why                             | Alternative                      |
| ------------------- | ------------------------------- | -------------------------------- |
| Code fences ` ``` ` | Not Gherkin syntax              | Use DocStrings with lang hint    |
| `@prefix` in text   | Interpreted as Gherkin tag      | Remove `@` or use `libar-dev`    |
| Nested DocStrings   | Gherkin parser error            | Reference code stub file         |
| `#` at line start   | Gherkin comment — kills parsing | Remove, use `//`, or step DocStr |

#### Tag Value Constraints

**Tag values cannot contain spaces.** Use hyphens instead:

| Invalid                          | Valid                           |
| -------------------------------- | ------------------------------- |
| `@unlock-reason:Fix for issue`   | `@unlock-reason:Fix-for-issue`  |
| `@libar-docs-pattern:My Pattern` | `@libar-docs-pattern:MyPattern` |
