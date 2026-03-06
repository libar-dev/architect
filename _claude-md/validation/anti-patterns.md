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

- All deliverables have terminal status (`complete`, `n/a`, or `superseded`) per `isDeliverableStatusTerminal()` — `deferred` is NOT terminal
- At least one `@acceptance-criteria` scenario exists in the spec

Run: `pnpm validate:all` for full validation including anti-patterns and DoD.
