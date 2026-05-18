## 2026-05-17

- Full `pnpm --filter @libar-dev/architect-projection test` is currently blocked by an unrelated failure in `tests/features/projections/delivery-reporting/traceability-matrix.steps.ts` (`behavior-phase-one` / `behavior-phase-two` received where the test expects unhyphenated keys). `pnpm typecheck` passes.

## 2026-05-17T06:58:00Z Verification correction
- The previous blocking-test note was stale. Main-thread reruns showed `pnpm typecheck` ✅ and `pnpm --filter @libar-dev/architect-projection test` ✅ (1534 tests).

## 2026-05-17T07:05:00Z Scope note
- The renderer-doc task reused a dirty working tree that already included verified W4 changes, so use file-by-file diff review rather than raw modified-file counts when verifying subsequent doc-only waves.

## 2026-05-17 W5.3 verification caveat
- `lsp_diagnostics` kept reporting a stale duplicate-identifier error on `packages/architect-projection/src/fragments/operational-insights/annotation-coverage.ts` even though the file on disk has one `AnnotationCoverage` export and `pnpm typecheck` passes; treat that as an editor-cache quirk, not a source issue.

## 2026-05-17 W6.3 lint blocker
- `pnpm --filter @libar-dev/architect-projection lint` still fails on pre-existing unrelated files: `src/projections/governance/taxonomy-digest.internal.ts`, `src/projections/governance/validation-rule-digest.internal.ts`, `src/renderers/render-json.ts`, and `src/renderers/render-ui.ts`.
