### Anti-Pattern Detection

Enforces dual-source architecture ownership between TypeScript and Gherkin files.

#### Tag Location Constraints

| Tag                      | Correct Location | Wrong Location | Why                                |
| ------------------------ | ---------------- | -------------- | ---------------------------------- |
| `@libar-docs-uses`       | TypeScript       | Feature files  | TS owns runtime dependencies       |
| `@libar-docs-depends-on` | Feature files    | TypeScript     | Gherkin owns planning dependencies |
| `@libar-docs-quarter`    | Feature files    | TypeScript     | Gherkin owns timeline metadata     |
| `@libar-docs-team`       | Feature files    | TypeScript     | Gherkin owns ownership metadata    |

#### Single Read Model Anti-Patterns (ADR-006)

| Anti-Pattern            | Signal                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Parallel Pipeline       | Consumer imports from `scanner/` or `extractor/` instead of consuming MasterDataset |
| Lossy Local Type        | Local interface with subset of `ExtractedPattern` fields                            |
| Re-derived Relationship | Building `Map`/`Set` from raw `implements`/`uses` arrays in consumer code           |

**Exception:** `lint-patterns.ts` is a stage-1 consumer (validates annotation syntax, no cross-source resolution).

#### DoD Validation

For patterns with `completed` status, validates:

- All deliverables have terminal status (`complete`, `n/a`, or `superseded`) per `isDeliverableStatusTerminal()` — `deferred` is NOT terminal
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
