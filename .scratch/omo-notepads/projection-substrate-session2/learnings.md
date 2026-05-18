## 2026-05-17

- `PatternDetailSchema` can safely reuse `PatternSummarySchema.extend(...)` for the shared summary fields while keeping the `PatternDetail` discriminant local.
- The canonical `execution-context/deliverable.ts` schema should stay discriminated; the pattern-relations view can derive its legacy untagged shape with `.omit({ kind: true })` to avoid rippling consumer changes.
- `traceability-matrix.steps.ts` expected stale child keys; the projection already emits slugified keys like `behavior-phase-one`, so the deterministic-key assertion needed to match the current `slugForFilename` behavior.

## 2026-05-17T06:58:00Z Verification correction
- Main-thread verification reran `pnpm typecheck` and `pnpm --filter @libar-dev/architect-projection test`; both passed, so the earlier note about a blocking traceability-matrix failure was stale/incorrect.

## 2026-05-17T07:05:00Z Wave 2 verification
- W5.1 renderer JSDoc can be verified by reading the five header blocks directly plus a grep for the old boilerplate phrase in `src/renderers/`; no runtime tests were needed because the change stayed comment-only.
- W5.1b is satisfied by a short warning block directly above `DOCUMENTATION_PROJECTION_FACTORIES`; grep for `W-DOCS-1`, `DocDefinition.build(graph)`, and `Do NOT add new entries here` is a reliable check.

## 2026-05-17 Renderer JSDoc lift
- MIGRATION.md maps cleanly to renderer-specific usage prose: Markdown for docs-live/package-readme generation, JSON for structured MCP/CLI payloads, CompactText for AI-facing marker-delimited output, Ui for Studio `UiDocument` trees, and `_shared/dispatch` for the typed kind-dispatch bridge.
- `render-ui.ts` needs an explicit hardening note because child link targets are rewritten but not sanitized at this layer.

## 2026-05-17T07:xx:xxZ W5.1b documentation-projection warning
- Added a high-signal warning block above `DOCUMENTATION_PROJECTION_FACTORIES` in `documentation-bundle.internal.ts` that marks the table as a W-DOCS-1 deletion target, points contributors to `DocDefinition.build(graph)`, and says `Do NOT add new entries here`.

## 2026-05-17T07:xx:xxZ W5.2 pattern-relations prose sweep
- Pattern-relations prose targets in `packages/architect-projection/src/fragments/pattern-relations/*.ts` and `packages/architect-projection/src/projections/pattern-relations/*.ts` are mapped file-by-file below; the boilerplate-style `When to Use` / top-level purpose copy still lives in these line ranges.

### Fragments
- `fragments/pattern-relations/architecture-comparison.ts` (1-11): replace with “Defines the `ArchitectureComparison` fragment shape for side-by-side bounded-context comparisons, including shared/unique dependencies and integration points.”
- `fragments/pattern-relations/architecture-context.ts` (1-10): replace with “Defines the `BoundedContext` fragment shape for bounded-context catalogs, with per-context pattern counts, pattern lists, layers, and roles.”
- `fragments/pattern-relations/architecture-neighborhood.ts` (1-11): replace with “Defines the `ArchitectureNeighborhood` fragment shape for a focal pattern’s relationships, same-context peers, and implementation references.”
- `fragments/pattern-relations/dependency-edge-set.ts` (1-11): replace with “Defines the `DependencyEdgeSet` fragment shape for a pattern’s outgoing dependency edges.”
- `fragments/pattern-relations/dependency-edge.ts` (1-11): replace with “Defines the normalized `DependencyEdge` fragment shape for one typed relation between two patterns.”
- `fragments/pattern-relations/dependency-tree.ts` (1-11): replace with “Defines the `DependencyTree` fragment shape for a rooted dependency tree plus traversal options.”
- `fragments/pattern-relations/index.ts` (1-10): replace with “Re-exports the pattern-relations fragment contracts for catalog, detail, bundle, dependency, neighborhood, and context projections.”
- `fragments/pattern-relations/orphan-pattern-list.ts` (1-11): replace with “Defines the `OrphanPatternList` fragment shape for patterns with no incoming or outgoing relationships.”
- `fragments/pattern-relations/pattern-catalog.ts` (1-11): replace with “Defines the `PatternCatalog` fragment shape for filtered pattern-summary catalogs, including counts, name-only mode, and filter state.”
- `fragments/pattern-relations/pattern-detail.ts` (1-11): replace with “Defines the `PatternDetail` fragment shape for the expanded per-pattern bundle, including summary, deliverables, relationships, rules, stubs, and manifest.”
- `fragments/pattern-relations/pattern-summary.ts` (1-11): replace with “Defines the `PatternSummary` fragment shape for the canonical short pattern summary reused by catalog and detail projections.”
- `fragments/pattern-relations/supporting.ts` (1-10): replace with “Houses the shared pattern-relations helper schemas for sources, relationships, hierarchy, deliverables, stubs, dependency kinds, and tree nodes.”

### Projections
- `projections/pattern-relations/architecture-comparison.ts` (1-32): replace with “Projects a side-by-side bounded-context comparison bundle from the pattern-relations fragment helpers.”
- `projections/pattern-relations/architecture-context.ts` (1-30): replace with “Projects the bounded-context catalog bundle that powers context lists and summaries.”
- `projections/pattern-relations/architecture-neighborhood.ts` (1-35): replace with “Projects a single pattern’s architectural neighborhood bundle, including relationship directions, same-context peers, and implementation refs.”
- `projections/pattern-relations/bundle.ts` (1-11): replace with “Projects a pattern bundle entry and exposes parse-and-project option handling for bundle mode and include selection.”
- `projections/pattern-relations/dependency-edges.ts` (1-32): replace with “Projects the outgoing dependency edge set for one pattern as stable `DependencyEdge` rows.”
- `projections/pattern-relations/dependency-tree.ts` (1-33): replace with “Projects a rooted dependency tree with bounded depth, cycle protection, and optional implementation dependencies.”
- `projections/pattern-relations/open-question-list.ts` (1-11): replace with “Projects the open-question list for patterns, optionally filtered to a parent scope.”
- `projections/pattern-relations/orphan-pattern-list.ts` (1-28): replace with “Projects the list of disconnected patterns with no incoming or outgoing relationships.”
- `projections/pattern-relations/pattern-catalog.ts` (1-33): replace with “Projects the filtered pattern catalog used by list/search surfaces, including name-only and count-only modes.”
- `projections/pattern-relations/pattern-detail.ts` (1-36): replace with “Projects the expanded detail bundle for one pattern, normalizing summary, deliverables, relationships, rules, stubs, and manifest.”
- `projections/pattern-relations/pattern-summary.ts` (1-31): replace with “Projects the canonical short pattern summary reused by catalog and detail views.”
- `projections/pattern-relations/index.ts` (1-28): replace with “Re-exports the pattern-relations projection entrypoints and option schemas for bundle, catalog, detail, dependency, neighborhood, and context surfaces.”

## 2026-05-17 W5.2 governance-slice boilerplate map
- Targeted fragment prose updates: `fragments/governance/business-rule.ts:8-10`, `business-rule-reference.ts:8-10`, `business-rule-set.ts:8-10`, `decision-catalog.ts:8-10`, `decision-record.ts:8-10`, `taxonomy-digest.ts:8-10`, `validation-rule-digest.ts:8-10`.
- Targeted projection-helper prose updates: `projections/governance/business-rules.internal.ts:4-8`, `decision-records.internal.ts:4-8`, `taxonomy-digest.internal.ts:4-8`, `validation-rule-digest.internal.ts:4-8`.
- Replacement angle: each fragment sentence should name the normalized artifact it returns; each internal helper sentence should say it builds that artifact from extracted patterns / tags / FSM data rather than using the generic `Private helpers used exclusively...` wording.
- Checked `projections/governance/governance-shared.internal.ts`; kept it off the target list because its value/invariant/behavior prose is already specific enough.

## 2026-05-17 W5.2 pattern-relations tail
- The remaining W5.2 tail was the seven `projections/pattern-relations/*.internal.ts` helpers: `architecture-comparison`, `architecture-context`, `architecture-neighborhood`, `dependency-edges`, `dependency-tree`, `orphan-pattern-list`, and `pattern-catalog`.
- Each header now uses a single purpose sentence that names the actual helper job instead of the generic `Private helpers used exclusively...` boilerplate.

## 2026-05-17 W5.3 operational-insights + execution-context prose sweep
- Final W5.3 target set covered the ten operational-insights fragment files, the ten execution-context fragment files, the seven execution-context projection/helper files, and the operational-insights projection entrypoints in `src/projections/operational-insights/index.ts`.
- Omission-risk lesson: `src/projections/operational-insights/index.ts` contains several independent `When to Use` blocks, so grep the whole file for boilerplate phrases before assuming the first hit set is complete.

## 2026-05-17 W5.4 boilerplate sweep
- Final W5.4 target set covered delivery-reporting and documentation-composition fragment/projection files plus `fragments/index.ts`, `fragment-schema.internal.ts`, and the shared `pattern-helpers.internal.ts` helper surface.
- The new `jsdoc-boilerplate-audit.mjs` follows the existing pure-Node ESM pattern from `options-schema-barrel-audit.mjs`: directory walk, exported audit function, JSON summary on success, and a CLI guard that throws on the known boilerplate family strings.

## 2026-05-17 W6.1 invariant wording
- The projection-security comments landed best when they named the boundary, the invariant, and the threat model in one short block, plus a single `@invariant: module-private ...` marker for the trusted-markdown symbol.

## 2026-05-17 W6.2 adversarial test placement
- When feature files are out of scope, W6.2 adversarial coverage fits as direct Vitest cases inside the existing step files: markdown renderer link/fence attacks in `render-markdown.feature.steps.ts`, JSON non-plain runtime rejection in `render-json.steps.ts`, schema mirror checks in `fragment-schemas.feature.steps.ts`, strict option-boundary checks in `context-session.steps.ts`, and public-barrel/privacy plus bundle-discrimination checks in `contract.feature.steps.ts`.

## 2026-05-17 W6.2 verification correction
- The W6.2 privacy test should assert actual namespace exports from `src/index.js` and `src/renderers/index.js`, not source text. Keep bundle-discrimination tests out of W6.2; the tenth case belongs in `render-json.steps.ts` as a separate polluted-prototype runtime rejection.

## 2026-05-17 W6.3 boundary rules
- The renderer boundary works best as one renderer-scoped block: exact `no-restricted-imports` paths for documentation-composition entrypoints/registry, plus a renderer-only `../**/*.internal.js` ban for cross-layer leakage.
- `no-restricted-syntax` is the reliable way to stop `TRUSTED_MARKDOWN` from leaking via import specifiers, export specifiers, and exported declarations.
- The doc-type-string ban stayed out because I could not make a selector precise enough to avoid false positives.

## 2026-05-17 W6.3 route-construction refinement
- The dropped fourth rule can be made precise after all: renderers should ban named `createIndexRouteId` / `createEntityRouteId` imports from `../routing/route-id.js` while still allowing type-only `LogicalRouteId` imports in `markdown-paths.ts` and `types.ts`.
