## 2026-05-17T04:40:45.857Z Session bootstrap

## 2026-05-17T04:46:30Z External review triage
- Accept concern #1 as valid: W6.2 should verify `TRUSTED_MARKDOWN` via package/barrel export-surface checks, not by pretending Vitest can prove true module privacy from inside the package.
- Accept concern #2 as valid: W6.3 rule #4 must be narrowed to a precise renderer/path-resolution selector or dropped if precision is not defensible.
- Accept concern #3 as valid process risk: W7 lint success criteria must distinguish new violations from pre-existing lint debt so final-wave failure is not confusing.
- Accept concern #4 as useful but secondary: record perf-flake handling only if the projection perf gate proves noisy during W7.
- Pre-decide concern #5: prefer keeping `kind` on existing fragment/discriminated-union shapes unless a consumer audit proves omission is safe; this is the lower-risk path.
- Accept concern #6 as wording cleanup: W5.4 should say "wire into `pnpm test` chain" rather than contrasting local test chain with CI.

## 2026-05-17T05:00:00Z Repo-verified notes
- W4.1 hotspot confirmed at `packages/architect-projection/src/fragments/fragment-schema.internal.ts`; any DeliverableSchema change must keep tagged/untagged shapes aligned.
- W6.3 has no current ESLint rule for doc-type strings, so any new rule would need to land in the projection ESLint config and/or `packages/architect-guard/src/lint/rules.ts`.
