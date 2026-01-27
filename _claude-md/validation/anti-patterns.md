### Anti-Pattern Detection

Enforces dual-source architecture ownership between TypeScript and Gherkin files.

#### Tag Location Constraints

| Tag                      | Correct Location | Wrong Location | Why                                |
| ------------------------ | ---------------- | -------------- | ---------------------------------- |
| `@libar-docs-uses`       | TypeScript       | Feature files  | TS owns runtime dependencies       |
| `@libar-docs-depends-on` | Feature files    | TypeScript     | Gherkin owns planning dependencies |
| `@libar-docs-quarter`    | Feature files    | TypeScript     | Gherkin owns timeline metadata     |
| `@libar-docs-team`       | Feature files    | TypeScript     | Gherkin owns ownership metadata    |

#### DoD Validation

For patterns with `completed` status, validates:

- All deliverables marked complete (checkmark, "Done", "Complete")
- At least one `@acceptance-criteria` scenario exists in the spec

#### Running Validation

```bash
# Anti-pattern check only
npx validate-patterns \
  -i "src/**/*.ts" \
  -F "specs/**/*.feature" \
  --anti-patterns

# Full validation with DoD
npx validate-patterns \
  -i "src/**/*.ts" \
  -F "specs/**/*.feature" \
  --anti-patterns \
  --dod
```
