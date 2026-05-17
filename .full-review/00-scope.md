# Review Scope

## Target

`packages/architect-projection/` — the fragment-based projection pipeline that emits Zod-validated Named Domain Fragments and renders them (compact-text, JSON, markdown, UI) for `architect-generate` and downstream consumers.

## Why this review now

The user is preparing a **doc-generation consolidation campaign** (drafted in `.pr-coordination/DEEP-DIVE.md`, `INVENTORY.md`, `PROPOSED-DESIGN.md`). Wave 4 of that campaign will:

1. Restore the dropped reference-codec capability (13 codec files + 4 generator wrappers lost in W1 lift).
2. Introduce a new `DocDefinition.build(graph)` TS-as-config API to replace the dead `referenceDocConfigs:` field in `architect.config.ts`.
3. Add a **ContentFragment** layer (input-side progressive disclosure) so the same conceptual unit can render at multiple depths in multiple docs.
4. Extend the documentation-composition area to support multi-target output (`docs-live/` + `_claude-md/` + JSON) and a generated-insert directive for hand-authored files.

This review is therefore scoped to surface issues that would **block, complicate, or invalidate** that incoming work. Generic best-practice nits in unrelated areas are out of scope.

## Files

Full package: `packages/architect-projection/src/**` (135 TS files), with extra weight on the areas the campaign touches:

**Hot zones (campaign will modify these):**
- `src/projections/documentation-composition/` — 14 files, 1,692 LOC; especially `documentation-bundle.internal.ts` (the hardcoded 12-entry dispatch table at line 64 that is the current ceiling on `architect-generate` output), `documentation-types.ts` (517 LOC type definitions), `progressive-disclosure.ts`, `disclosure-spec.ts`.
- `src/blocks/schema.ts` — the 9-block-type catalog + `RenderableDocument` envelope; ContentFragment proposal layers on top of this.
- `src/fragments/**` — 43 projection functions across pattern-relations, governance, operational-insights, delivery-reporting, execution-context, documentation-composition; only 8 reachable through `docs:all` today.
- `src/renderers/**` — `render-markdown.ts`, `render-compact-text.ts`, `render-json.ts`, `render-ui.ts`, plus `markdown-paths.ts` and `_shared/dispatch.ts`; progressive-disclosure output mechanism lives here.

**Architectural perimeters:**
- `src/index.ts` + sub-entry barrels (`./blocks`, `./fragments`, `./projections`, `./renderers`) — public API surface (`exports` map in `package.json`).
- `src/context/projection-context.ts` — the context type passed to every projection.
- `src/_internal/` — slug + format-utils; trust boundary helpers.

## Flags

- Security Focus: **no** (advisory — projection pipeline reads PatternGraph data and renders to text; the only relevant security surface is the markdown trust boundary in `render-markdown.ts`)
- Performance Critical: **yes** (a CI perf gate already enforces `baseline × 1.5` against a 36-pattern / 108-rule fixture; the doc-gen campaign will fan out projection calls 5–10×, so performance headroom is a first-class concern)
- Strict Mode: **no** (review-only; no auto-blocking on Critical findings)
- Framework: TypeScript 5.8 (strict + `verbatimModuleSyntax` + `noUncheckedIndexedAccess` + `noPropertyAccessFromIndexSignature` + `exactOptionalPropertyTypes`) + Zod 4.1 + `@amiceli/vitest-cucumber` + ESM-only (`"type": "module"`, `sideEffects: false`).

## Repo doctrine reviewers must respect

These are project-defining constraints — do **not** flag deviations from them as issues, and do flag any code that violates them:

1. **No-BC.** No `eslint-disable*`, no `@ts-ignore`/`@ts-expect-error`, no `@deprecated` shims, no backward-compatibility aliases. The repo is pre-1.0; shims become permanent cost.
2. **Zod-first boundaries.** Cross-package contracts and CLI/MCP boundaries use `z.strictObject(...)` (never `z.object()`). Types flow from schemas via `z.infer`. Parse once at the boundary, then cheap shape-check internally.
3. **ESM-only, `sideEffects: false`.** Every type-only import uses `import type`.
4. **No circular imports** across packages or within a package's `src/`.
5. **`docs-live/` is regenerated, not committed.** Don't flag missing generated artifacts.
6. **Architect State IS code.** Annotations live with implementation. Generated docs are projections.
7. **Two parsers, don't conflate:** `@cucumber/gherkin` parses `architect/specs/` at doc-gen time; `@amiceli/vitest-cucumber` parses `tests/features/` at test time.

## Review Phases

1. Code Quality & Architecture (parallel: code-reviewer + architect-review)
2. Security & Performance (parallel: security-auditor + general-purpose performance analysis)
3. Testing & Documentation (parallel: general-purpose test analysis + general-purpose docs review)
4. Best Practices & Standards (parallel: general-purpose framework review + general-purpose CI/CD review)
5. Consolidated final report

## Specialized review priorities (per user request)

Given the campaign context, reviewers should give extra weight to:

- **Extensibility of `documentation-bundle.internal.ts`** — the 12-entry dispatch table is the bottleneck the campaign explicitly targets. How clean is the replacement path?
- **`DocumentationTypes` (517 LOC)** — will the proposed `DocDefinition` types layer cleanly, or does the current shape force the new API into awkward shapes?
- **Trust boundary in markdown rendering** — `escapeText`, `link-out` schema, `parseMarkdownToBlocks` consumption. The ContentFragment proposal will route MORE markdown through these paths.
- **Progressive-disclosure substrate (output side)** — `RenderMarkdownOptions.disclosureLevel`, `disclosureSpec`, `splitOversizedDocument`. The campaign adds an INPUT side; the OUTPUT side must remain solid.
- **Public API surface (the `exports` map)** — what's currently exported from `./projections`, `./fragments`, `./blocks`, `./renderers` and how disruptive will adding `DocDefinition` / `ContentFragment` be?
- **Perf regression gate** — known to exist with a `baseline × 1.5` ceiling. Confirm it covers the documentation-composition pipeline (not just isolated fragment projection).
- **Test-feature coverage of the documentation-composition area** — vitest-cucumber features that pin the current contract; high-value because the campaign must preserve them.

## What's out of scope

- Generic TypeScript/Zod nits in code untouched by the campaign.
- `@libar-dev/architect-core`, `architect-guard`, `architect-cli`, `architect-mcp` — only flag if a finding inside `architect-projection` is symptomatic of a deeper cross-package issue.
- Suggesting to add `// removed for X` comments, parallel implementations, or feature-flag shims (no-BC doctrine).
- The W9 skills consolidation (separate campaign).
- The W7 publish/cutover.
