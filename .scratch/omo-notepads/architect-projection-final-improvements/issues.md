# Issues


## 2026-05-17 Task: T7 direct consumer registry alignment
- Full `pnpm test:dogfood` is currently blocked by unrelated package-host path resolution in dogfood CLI helpers/imports: tests try to resolve `../../../../architect-cli` / `../../../../architect-mcp` as siblings of the repo root (for example `/Users/darkomijic/dev-projects/architect-cli/src/...`) instead of under `packages/`. This also appears in LSP diagnostics for `tests/steps/**` module resolution.

## 2026-05-17 Task: T14 commit assembly
- Blocked by session policy: git commits require explicit user request. The plan calls for four wave-level commits, but execution cannot create them unless the user explicitly asks for commits. Proceeding with non-git validation work first.

## 2026-05-17 Task: F3 full dogfood command
- `pnpm test:dogfood` currently exits 1 outside the projection-import consumer surface: `tests/steps/cli/lint-patterns.steps.ts` still resolves `/Users/darkomijic/dev-projects/architect-guard/src/cli/lint-patterns.ts` instead of `packages/architect-guard/...`, and `tests/steps/cli/data-api-help.steps.ts` expects a frozen global help section without the two architect-data-api guidance lines now present. Targeted projection-import dogfood steps pass.
