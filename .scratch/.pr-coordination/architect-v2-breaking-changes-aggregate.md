# `@libar-dev/architect` v1 → v2 — Breaking-Change Digest for Downstream Consumers

Source: merged PRs in `libar-ai/architect-studio` (private). Aggregated across PRs #15, #17, #19, #22, #24, #26, #28, #31, #32, #35. Perspective: a downstream consumer (e.g. `new-convex-es`) moving from `@libar-dev/architect@1.0.0-pre.3` (monolith) to `@2.0.0-pre.1` (meta-package over 6 runtime packages).

---

## 1. Package structure changes

- **Monolith split into 6 runtime packages** (#15): `@libar-dev/architect-core`, `architect-query`, `architect-presentation`, `architect-guard`, `architect-cli`, `architect-mcp` plus a private `architect-dev` self-host. The dependency graph is strictly acyclic: `core` ← all others; `cli`/`mcp` sit on top.
- **`architect-presentation` was deleted** in PR #17. After codecs were removed, only ~1,000 lines of config types remained, all of which **folded into `architect-core`**:
  - `contracts.ts` → `architect-core/src/config/presentation-contracts.ts`
  - `defaults.ts` → inlined into `architect-core/src/config/defaults.ts`
  - `product-area-configs.ts` → `architect-core/src/config/product-area-configs.ts`
  - `cli/cli-schema.ts` → `architect-core/src/config/cli-schema.ts`
  - `load-preamble.ts` → `architect-core/src/utils/markdown-parser.ts`
- **New package `@libar-dev/architect-projection`** added in PR #17 (this is the "architect-projection" the user noticed). Replaces codecs + API-formatters with a unified `PatternGraph → projection → Fragment → renderer` pipeline. Depends only on `architect-core` and `zod`.
- **`architect-query` was gutted** in PR #17. The whole `api/` subtree (`context-assembler`, `scope-validator`, `handoff-generator`, `rules-query`, `coverage-analyzer`) was **deleted** as dead code once consumers moved to projections. What remains: `pattern-graph-api.ts`, `summarize.ts`, `arch-queries.ts`, `fuzzy-match.ts`, `stub-resolver.ts` — i.e. the read API and primitive helpers only.
- **What happened to `architect-query`?** It still exists but is dramatically smaller. PR #35 promoted parts of cross-package edge resolution into `architect-core/read-api`; the assembly/formatting role was absorbed by `architect-projection`. There is no rename to "no `architect-query` package"; it's still shipped but consumers should call **projections** instead of the old API formatters.
- **`architect-projection` depends on `architect-core` as `dependencies`** (not `peerDependencies`) — flipped in PR #22.
- The **meta-package `@libar-dev/architect@2.0.0-pre.1` exposes no programmatic API** — only re-exposes 7 CLI bins. Programmatic consumers must depend on the leaf packages directly.

## 2. API surface removals & renames

- **5 projection functions renamed** (internal; rename ripples through anyone wrapping projections directly) (#19):
  - `projectOverview` → `projectOverviewDigest`
  - `projectSessionContext` → `projectSessionContextBundle`
  - `projectReleaseNotes` → `projectReleaseNotesDigest`
  - `projectRoadmap` → `projectRoadmapTimeline`
  - `projectScopeReadiness` → `projectScopeReadinessReport`
- The single entry-point helper is now `parseAndProject` (located at `architect-projection/src/projections/_shared/parse-and-project.internal.ts`) (#19).
- **Public-CLI subcommand names and MCP tool names did NOT change** for these renames — only the JS surface (#19).
- All `format*()` text-concatenation functions in `architect-query` are gone — use `renderCompactText` / `renderJson` / `renderMarkdown` / `renderUi` instead (#17).
- **Removed CLI subcommands** (#31): `arch layer`, `list --phase N`, `list --maturity` _(wait — `--maturity` was added in #24 then removed-or-narrowed depending on tag-status; verify against current source)_.
- **Renamed CLI subcommand** (#31): `arch context` → `arch bounded-context`.
- **`scope-check` removed**; replaced with `scope-validate` (#15).
- **No-BC posture is policy** (#19): no `@deprecated` shims, no `eslint-disable`, no compatibility re-export barrels. Removed exports are simply gone. Any consumer pinning to the old names will break.

## 3. Taxonomy & annotation tag changes (PR #31 — "cut 26 tags")

**22 tag cuts (Part A.1):** `@architect-used-by`, `@architect-enables`, `@architect-depends-on`, `@architect-depends-on-external`, `@architect-api-ref`, `@architect-extract-shapes`, `@architect-phase`, `@architect-level`\*, `@architect-parent`\*, `@architect-parent-external`, `@architect-quarter`, `@architect-release`, `@architect-team`, `@architect-workflow`, `@architect-risk`, `@architect-since`, `@architect-discovered-gap`, `@architect-discovered-improvement`, `@architect-discovered-learning`, `@architect-discovered-risk`, `@architect-business-value`, `@architect-convention`.
_\* `@architect-level` and `@architect-parent` were retained-and-narrowed to the hierarchy axis (Wave 2.5)._

**4 sequence-diagram tags cut:** `@architect-sequence-error`, `@architect-sequence-module`, `@architect-sequence-orchestrator`, `@architect-sequence-step`.

**4 additional cuts (Q2/Q3/Q4):** `@architect-effort`, `@architect-priority`, `@architect-include`, `@architect-shape`.

**3 consolidations:**

- C1: `arch-context` + `arch-layer` + `bounded-context` → single `@architect-bounded-context`.
- C2: `@architect-context` (alias) deprecated → migrate to `@architect-bounded-context`.
- C3: `@architect-maturity` derived from `@architect-status` at projection time (still emitted, but not authored).

**4 redefinitions:**

- `@architect-uses <Pattern>` argument **must** resolve to a declared `@architect-pattern` (was loose before).
- `@architect-pattern <Name>` regex now strictly `^[A-Z][A-Za-z0-9]+$` — PascalCase only.
- `@architect-implements <Pattern>` is required on production source for feature-originated patterns.
- `@architect-role` enum closed: `projection | service | decider | read-model | codec | contract | barrel | utility`. The `core` value was removed (default-bucket antipattern); `codec` and `contract` added.

**Tag inventory:** ~50 → 28 entries (44% reduction). 0 dangling references. CI enforces this.

**Newly important consumer-facing tags (PR #24):**

- `@architect-level:slice` added to hierarchy enum.
- `@architect-depends-on-external` and `@architect-parent-external` for cross-process tags (must be declared in registry to be parsed).
- `@architect-maturity` exposed end-to-end (filter via `list --maturity`, surfaced on `PatternSummary`/`PatternDetail`).

## 4. CLI bin changes

**7 bins shipped by the meta-package** (#15, #35):

- `architect` (main multi-command CLI)
- `architect-generate` (regenerates `docs-live/*.md` via projection pipeline)
- `architect-guard` (process-guard linter, staged or all-files)
- `architect-lint-patterns`
- `architect-lint-steps`
- `architect-validate` (anti-patterns + DoD validation)
- `architect-mcp` (MCP server, owned by `architect-mcp` package)

**New `architect` subcommands** (#15, #35):

- `architect files <pattern>`
- `architect scope-validate <pattern> <session>` (replaces removed `scope-check`)
- `architect open-questions [--parent <Pattern>] [--format compact|json]` (#35)
- `architect bundle <Pattern> [--mode plan|design|implement|review] [--include rules,scenarios,deps,open-questions,docstring] [--estimate-tokens]` (#35)
- `architect arch dangling --baseline <path> [--write-baseline] [--strict]` (#35)
- `architect taxonomy --count` (#35)

**New filter flags on existing read commands** (#35):

- `list --parent <Pattern>`, `list --maturity <value>`
- `rules --package <name>`, `rules --feature <glob>`

**Removed CLI surfaces** (#31): `arch layer`; `list --phase N`; `query <method>` cases for cut tags (e.g. `getPhaseDistribution`, `getQuarterRollup`); `arch context` → renamed `arch bounded-context`. ~20% CLI surface-area reduction overall.

**`architect-validate --anti-patterns` now resolves baseline from a packaged location** (#32 follow-up): works from any cwd; previously broke when invoked from outside repo.

## 5. Configuration schema changes

- **`architect.config.ts` is still consumer-authored** but the resolved-config type went through `ArchitectProjectConfigSchema` cleanup (#22). New fields: `productAreas` (config-driven, replaces hard-coded constant); `DEFAULT_GENERATORS` extracted to `architect-core/src/config/default-generators.ts` so consumers can import it.
- **Generator registration is side-effect-import** in `architect-presentation` (now `architect-core`); documented as intentional (#15).
- New `tsconfig.architect-base.json` is provided at the root for downstream tsconfig extension (#15).
- **`PACKAGE_SELF_HOSTING_SOURCES.features`** glob was extended in #22 to cover all 6 split packages — downstream configs that hand-roll feature globs should follow suit.
- **`source-ownership.ts`** (#22) introduced "canonical-minimum + per-instance-extension" pattern: each consumer's config can extend the source-ownership map without forking the constant.

## 6. Zod / validation schema changes (PR #19 — "Zod-first boundaries")

- **All cross-package contracts are Zod-validated.** Hand-written TS mirrors removed; types now flow via `z.infer` / `z.output`.
- `.strict()` → `z.strictObject()` migration applied to all 78 files / 186 call sites.
- `z.infer` switched to `z.output` only on the 3 schemas that use `.transform()` (the rest stay on `z.infer`).
- Legacy `Branded<>` helper removed.
- All CLI flag schemas now use `z.strictObject` (`OpenQuestionsFlagsSchema`, `BundleFlagsSchema`, `ArchFlagsSchema`, `TaxonomyFlagsSchema` etc.) (#35).
- **Single parse boundary**: MCP `parseToolInput` delegates to `parseOrThrow` and rejects non-object input. CLI argv goes through a unified registry (`architect-core/argv-hygiene` — exports `hasNullByte`, `assertNoNullBytes`, `assertHasValue`, `SafeStringSchema`, `NonEmptySafeStringSchema`).
- **`BlockSchema`** promoted to `z.discriminatedUnion`; `FragmentCompatibilitySchema` removed (was a `z.custom(...safeParse)` wrapper).
- **All compat schemas were dropped** in the no-BC sweep: `FileRoutingSchema`, `FragmentCompatibilitySchema`, `ProjectionBundleSchema`, `ProjectionInputSchema` aliases — gone. Consumers must use canonical names.

## 7. Projection / Fragment pipeline changes (PRs #17, #28)

The single non-negotiable change shape for downstream consumers:

```
PatternGraph → project*(context) → Fragment (Zod-validated) → renderer*() → output
```

- **`ProjectionContext`** is the standard input to every projection. Carries `graph: PatternGraph`, project metadata, tag-example overrides, perspective hint, injectable `now()`. **Deliberately no filesystem adapter** — that would re-introduce the ADR-006 parallel-pipeline anti-pattern.
- One carve-out: `LifecycleProjectionContext` for idea/brief projections that need a `FileSystemAdapter` (passed explicitly, not via context).
- **4 renderers, all behind `Renderer<TOptions, TResult>`**: `renderCompactText` (preserves `=== MARKER ===` format AI agents depend on), `renderJson` (Zod-round-trip-validated), `renderMarkdown` (replaces the old codec pipeline), `renderUi` (produces `UiDocument` of `UiSection`).
- **51 Named Domain Fragments** organized by Software-Delivery subdomain: `delivery-reporting`, `documentation-composition`, `execution-context`, `governance`, `lifecycle-management`, `operational-insights`, `pattern-relations`. Promoted to `@architect-pattern` with `@architect-role:contract` in PR #31.
- After PR #31 the fragment count is **~42** (retirements: `RoadmapTimelineProjection`, `PhaseDistributionProjection`, `TeamOwnershipProjection`, `RiskRegisterProjection`, `DiscoveryJournalProjection`, `SequenceDiagramProjection`; 3 `RequirementDigest*` variants consolidated to 1).
- **`projectDocumentationBundle`** is the single registry-driven documentation entry point (#28). Disclosure (`essential | important | useful | advanced`), grouping (package / feature / phase / product-area), and filtering are now **policy** owned by registry metadata, not per-renderer decisions.
- **Logical route IDs** are now projection identity; markdown file paths are pushed to the renderer edge (#28). JSON/UI consumers see route info without file-path leaks.
- **`PackageResolver`** (`architect-core/src/package/package-resolver.ts`) replaces edge-regex package-grouping. Unmapped files now **fail loudly** instead of falling into `_other` (#28).

## 8. Doctrine kernel changes (PR #31)

The "doctrine kernel" is the set of shared decision documents under `architect-claude-plugin/_shared/` that tag-author/skill prompts read. PR #31 rewrote:

- `_shared/annotation-ownership.md` — **Mandatory Floor**, **Code-originated patterns**, "`uses` is for patterns only". G5 carve-out: `@architect-pattern` is **sanctioned on `.ts` source** for `codec`/`contract`/`utility` roles (other roles continue to identify on `.feature`).
- `_shared/four-tier-ladder.md` — added `executable` rung; orthogonality vs `@architect-level` made explicit. (Tiers: `idea | plan | design | executable`.)
- `_shared/value-transfer.md` — operationalized the "half-transferred value" anti-pattern.
- `_shared/spec-pattern-relationships.md` — pattern-naming convention; hierarchy-axis section.
- `_shared/fsm-transitions.md` — code-originated patterns get FSM status ownership too.

**12 strategic decisions (D1–D12) codified.** Most impactful for consumers:

- **D1**: `ProjectionContext` is forbidden from `@architect-uses`.
- **D5**: `@architect-pattern` allowed on `.ts` for codec/contract/utility.
- **D9**: `@architect-pattern` annotation (not heading text) is canonical for identity.
- **D11**: Barrels are file-organization only — never patterns.

## 9. Other notable breaks / behavior changes

- **`ProcessGuardLinter`** is now a single pattern declared on `process-guard/index.ts` (D6, #31). Sub-patterns collapsed.
- **`getRelationshipsForPattern()`** is the strict relationship helper in `architect-core/read-api` (#35); silent name-based fallback in `architecture-inspection` / `graph-inventory` was removed. Missing reverse-index lookups now report rather than return empty.
- **Cross-package edge resolution** moved into `architect-core/read-api` (#31 Wave 2). Consumers that previously imported a projection-side resolver must switch.
- **Parse-attributed pattern lookup** (#35): Gherkin parse failures recover the raw `@architect-pattern` tag and surface a `PatternParseFailure` on the read model. `architect pattern <Name>` now reports parser `(line:col)` instead of flat "not found".
- **Dangling-references workflow**: file-backed baseline at `packages/architect-guard/src/lint/dangling-baseline.json`. Use `arch dangling --baseline … [--write-baseline] [--strict]`. The packed `architect-guard` artifact must contain this JSON; CI validates packed-artifact presence (#32, #35).
- **No-BC enforcement**: `scripts/guard-no-suppressions.mjs` + baseline pin a fixed count of allowed `eslint-disable` / `@ts-ignore` / `@ts-expect-error` / `@deprecated` tokens. Downstream consumers should expect the same posture if upgrading.
- **Per-package vitest configs** — each package owns its own `vitest.config.ts`, `tsconfig.json`, `tsconfig.test.json` (#15). Cross-package test wiring no longer exists.
- **`architect-projection` features were wired into self-hosting** in #19/#22, fixing a glob asymmetry where 17 patterns had been silently invisible to the dual-source validator.
