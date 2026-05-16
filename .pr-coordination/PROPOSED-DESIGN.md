# Proposed design — the new doc-generation surface

> Code sketches and execution plan. Not normative; the design session refines.

## 1. Core types

```ts
// packages/architect-projection/src/doc-definition/types.ts

import type { PatternGraph } from '@libar-dev/architect-core';
import type { RenderableDocument, SectionBlock } from '../blocks/schema.js';

export interface DocBuildContext {
  readonly graph: PatternGraph;
  // Future: extractors injected here for test-time replacement
}

export interface DocTarget {
  readonly kind: 'website' | 'agent-context' | 'package-readme' | 'json';
  readonly path: string;   // relative to repo root
}

export interface DocDefinition {
  readonly id: string;
  readonly title: string;
  readonly targets: readonly DocTarget[];
  build(ctx: DocBuildContext): RenderableDocument | Promise<RenderableDocument>;
}
```

## 2. Extractor catalog

```ts
// packages/architect-projection/src/extractors/index.ts

// === SHAPE EXTRACTORS (TypeScript + Zod) ===

extractTypeShapes(ctx, opts: { group?: string; package?: string; pattern?: string }): TypeShape[]
// Existing — built on shape-extractor.ts (`extractShapes` + `discoverTaggedShapes`)

extractZodSchemaFields(ctx, schemaName: string): ZodFieldRow[]
// NEW — parses z.strictObject({...}).describe(...) into structured rows.
// Unlocks: formal-spec/11, CONFIGURATION docs, ProgressiveDisclosurePolicy table

extractFunctionSignature(ctx, symbolName: string): FunctionShape
// NEW — returns { name, params: [{name, type, jsdoc}], returns, examples }
// instead of raw source text. Unlocks: package README usage tables.

extractEnumValues(ctx, enumName: string): EnumValueRow[]
// NEW — returns one row per value with associated JSDoc.

extractImportMap(ctx, package: string): ImportRow[]
// NEW — public-surface table for package READMEs.


// === CONTENT EXTRACTORS (JSDoc + Gherkin) ===

extractJSDocProse(ctx, symbolName: string): SectionBlock[]
// Existing — wraps parseMarkdownToBlocks() against a symbol's JSDoc body.

extractBehaviors(ctx, opts: { tag?: string; productArea?: string; package?: string; onlyInvariants?: boolean }): BehaviorShape[]
// Existing — wraps projectBusinessRuleSet.

extractDecisions(ctx, opts: { tag?: string; category?: string; layer?: string }): DecisionRecord[]
// Existing — wraps projectDecisionCatalog.

extractAggregations(ctx, aggregationTag: string): TaggedSource[]
// NEW (light) — projects existing `kind: 'aggregation'` tag matches.
// Push-model routing surface.


// === REGISTRY EXTRACTORS ===

extractTagRegistry(ctx, opts: { groupName?: string; kind?: 'role' | 'metadata' | 'aggregation' }): TagDefinition[]
// NEW (light) — surfaces tagRegistry field of PatternGraph.

extractCliCommands(ctx, opts?: { filter?: RegExp }): CommandShape[]
// NEW — reads packages/architect-cli/src/cli/cli-schema.ts's COMMAND_NAMES + helpSignature.

extractMcpTools(ctx, opts?: { filter?: RegExp }): McpToolShape[]
// NEW — reads ARCHITECT_MCP_TOOLS from packages/architect-mcp/src/tool-metadata.ts.

extractLintRules(ctx, opts?: { filter?: RegExp }): LintRuleShape[]
// NEW + needs new carrier (@architect-lint-rule:<id> JSDoc on each rule in architect-guard/src/lint/rules/).


// === RELATIONSHIP EXTRACTORS ===

extractDependencyEdges(ctx, opts: { patterns?: string[]; kinds?: EdgeKind[] }): Edge[]
// Existing — wraps projectDependencyEdges.

extractTraceability(ctx, opts: { feature?: string }): TraceLink[]
// Existing — wraps projectTraceabilityMatrix.


// === DIAGRAM EXTRACTORS (5 types) ===

extractGraphDiagram(ctx, opts: { archContext?: string[]; archLayer?: string[]; direction?: 'TB' | 'LR' }): MermaidBlock
// Existing for graph TD; needs direction support for graph LR.

extractSequenceDiagram(ctx, source: 'generation-pipeline' | string): MermaidBlock  // NEW
extractClassDiagram(ctx, opts: { archContext?: string[] }): MermaidBlock           // NEW
extractStateDiagram(ctx, source: 'fsm-lifecycle' | string): MermaidBlock           // existing for FSM only
extractC4ContextDiagram(ctx, opts: { archContext?: string[] }): MermaidBlock       // NEW
```

## 3. Composition helpers

```ts
// packages/architect-projection/src/doc-definition/compose.ts

composeDoc(title: string, sections: SectionBlock[]): RenderableDocument

preamble(path: string): SectionBlock[]
// Loads markdown file and runs parseMarkdownToBlocks. Replaces dropped loadPreambleFromMarkdown.

heading(text: string, depth: 1 | 2 | 3 | 4 | 5 | 6): HeadingBlock
paragraph(text: string): ParagraphBlock
asTable(rows: T[], columns: ColumnDef<T>[]): TableBlock
asCollapsibleList(items: { summary: string; body: SectionBlock[] }[]): CollapsibleBlock[]
asShapeList(shapes: TypeShape[]): SectionBlock[]
asDiagram(block: MermaidBlock): SectionBlock
asLinkOut(text: string, path: string): LinkOutBlock

generatedInsert(source: string, scope?: string): SectionBlock[]
// NEW — emits `<!-- generated:source[:scope]:start -->...<!-- generated:source[:scope]:end -->`
// fences that the doc-gen pipeline rewrites on docs:all.
```

## 4. Worked example — `packages/architect-projection/README.md`

```ts
// docs-config/packages/architect-projection-readme.doc.ts

import type { DocDefinition } from '@libar-dev/architect-projection';
import {
  extractFunctionSignature, extractBehaviors, extractZodSchemaFields,
  extractSequenceDiagram, extractJSDocProse,
} from '@libar-dev/architect-projection/extractors';
import {
  composeDoc, preamble, heading, paragraph, asTable, asDiagram,
} from '@libar-dev/architect-projection/compose';

export const projectionReadme: DocDefinition = {
  id: 'architect-projection-readme',
  title: '@libar-dev/architect-projection',
  targets: [
    { kind: 'package-readme', path: 'packages/architect-projection/README.md' },
  ],
  async build(ctx) {
    const usageExample = extractFunctionSignature(ctx, 'parseAndProjectSessionContext');
    const adr006Rules = extractBehaviors(ctx, { tag: 'adr-006', onlyInvariants: true });
    const trustBoundary = extractBehaviors(ctx, { tag: 'markdown-trust-boundary' });
    const disclosureTable = extractZodSchemaFields(ctx, 'ProgressiveDisclosurePolicySchema');
    const pipelineDiagram = extractSequenceDiagram(ctx, 'generation-pipeline');

    return composeDoc('@libar-dev/architect-projection', [
      ...preamble('docs-sources/packages/architect-projection-intro.md'),

      heading('Pipeline', 2),
      asDiagram(pipelineDiagram),

      heading('Usage', 2),
      ...renderUsageExamples(usageExample),

      heading('Architecture invariants', 2),
      ...renderInvariants(adr006Rules),

      heading('Markdown/content trust boundary', 2),
      ...renderTrustBoundary(trustBoundary),

      heading('Documentation Composition Contract', 2),
      paragraph('Disclosure vocabulary:'),
      asTable(disclosureTable, [
        { header: 'Level', field: 'name' },
        { header: 'Meaning', field: 'description' },
      ]),

      ...preamble('docs-sources/packages/architect-projection-testing.md'),
    ]);
  },
};
```

The preamble files (`docs-sources/packages/architect-projection-intro.md`, `...-testing.md`) hold the editorial framing that doesn't belong in code. Total: ~30 lines of preamble + ~30 lines of doc definition replace the 137-line hand-maintained README, with hard guarantees against drift.

## 5. The `architect.config.ts` shape

```ts
// architect.config.ts
import { defineConfig } from '@libar-dev/architect-core/config';

import { projectionReadme } from './docs-config/packages/architect-projection-readme.doc.js';
import { corepReadme } from './docs-config/packages/architect-core-readme.doc.js';
// ... per-doc imports

import { docsLiveArchitecture } from './docs-config/docs-live/architecture.doc.js';
import { docsLiveCodecs } from './docs-config/docs-live/architecture-codecs.doc.js';
// ... per-generated-doc imports

import { agentContextFsm } from './docs-config/agent-context/fsm.doc.js';
// ... per-agent-context-module imports

export default defineConfig({
  // Source globs (unchanged from W1.5)
  sources: { ... },
  output: { directory: 'docs-live', overwrite: true },

  // The new surface — explicit list of DocDefinitions
  docs: [
    projectionReadme,
    corepReadme,
    // ...
    docsLiveArchitecture,
    docsLiveCodecs,
    // ...
    agentContextFsm,
  ],

  // Old DEFAULT_GENERATORS bin entry-points stay (they're the fragment-based pipeline) —
  // these are the per-pattern projections for `architect-generate`, not reference docs.
  generators: [...DEFAULT_GENERATORS],
});
```

The `docs: [...]` array is the new explicit surface. Each entry is a typed `DocDefinition`. No more "schema field on config object" — the doc IS code that you import.

For the simple case (e.g., the 11 pre-refactor reference docs), a `referenceDoc(opts: ReferenceDocConfig): DocDefinition` sugar function can ease migration:

```ts
// Backward-shim style — for simple cases only
export const codecsDoc = referenceDoc({
  title: 'Available Codecs Reference',
  conventionTags: ['codec-registry'],
  docsFilename: 'ARCHITECTURE-CODECS.md',
});
```

This is the simplest port path from `architect.config.ts` pre-refactor. But the recommended pattern for non-trivial docs is hand-authored `build()`.

## 6. Generated-insert directive (for spec/manual files)

The third routing primitive — for docs that should remain hand-authored except for embedded data tables.

```md
<!-- File: formal-spec/04-tag-registry.md -->

## Tag Registry

The tag registry below is the reference implementation's current state.
The conformance shape itself is defined in [section 3](./03-tag-system.md).

<!-- generated:tag-registry:start -->
... (rewritten by `pnpm docs:all`) ...
<!-- generated:tag-registry:end -->

## Adding a new tag

Hand-authored guidance...
```

```ts
// docs-config/inserts/tag-registry.insert.ts
export const tagRegistryInsert: InsertDefinition = {
  source: 'tag-registry',
  consumers: [
    'formal-spec/04-tag-registry.md',
    '.agents/skills/_shared/annotation-ownership.md',
    'docs/ANNOTATION-GUIDE.md',
  ],
  build(ctx) {
    const tags = extractTagRegistry(ctx, {});
    return composeInsert([
      asTable(tags, [
        { header: 'Tag', field: 'tag' },
        { header: 'Kind', field: 'kind' },
        { header: 'Format', field: 'format' },
        { header: 'Purpose', field: 'purpose' },
      ]),
    ]);
  },
};
```

This pattern closes the formal-spec/impl drift surfaces (`04` ↔ tag registry, `09` ↔ FSM, `11` ↔ Zod schema) without forcing spec text into JSDoc.

## 7. Wave breakdown for execution

Sequenced; each wave delivers an end-to-end slice.

### W-DOCS-1: Foundation infrastructure (~1 session)
- Create `DocDefinition` type + `DocBuildContext`.
- Port `loadPreambleFromMarkdown` → `architect-core/src/utils/load-preamble.ts`.
- Add `composeDoc` + foundational helpers in `architect-projection/src/doc-definition/compose.ts`.
- Add `docs: DocDefinition[]` field to `ProjectConfigSchema`.
- Add the runner in `architect-generate` that iterates `config.docs` and writes to each target.
- **Verification:** ship one trivial `DocDefinition` (e.g., a regenerated `CLI-REFERENCE.md` from `extractCliCommands` — the 63-line pre-refactor doc is the simplest target).

### W-DOCS-2: Extractor catalog (~2-3 sessions, parallel-friendly)
- Build the missing extractors. Sub-divide:
  - W-DOCS-2a: shape extractors — `extractZodSchemaFields`, `extractFunctionSignature`, `extractEnumValues`, `extractImportMap`. Most leverage existing AST plumbing.
  - W-DOCS-2b: registry extractors — `extractCliCommands`, `extractMcpTools`, `extractLintRules`. The first two are mechanical; lint-rules needs the `@architect-lint-rule` carrier added.
  - W-DOCS-2c: diagram extractors — `extractSequenceDiagram`, `extractClassDiagram`, `extractC4ContextDiagram`, `extractGraphDiagram` (LR direction). Lift from pre-refactor `reference-diagrams.ts`.
- **Verification:** rebuild `REFERENCE-SAMPLE.md` from a new `DocDefinition`. Diff against the pre-refactor 1,135-line output. Any structural divergence is a bug in the extractor.

### W-DOCS-3: Multi-target output (~1 session)
- `DocTarget.kind: 'website' | 'agent-context' | 'package-readme' | 'json'`.
- Per-target path conventions and write logic.
- **Verification:** a `DocDefinition` with two targets writes both files from one `build()` call.

### W-DOCS-4: Generated-insert directive (~1 session)
- New module: `architect-projection/src/inserts/`.
- `InsertDefinition` type + runner that scans `consumers[]` for fence pairs and rewrites between them.
- Three initial inserts: `tag-registry`, `fsm-table`, `config-schema`.
- **Verification:** running `pnpm docs:all` rewrites the inserts in `formal-spec/04`, `formal-spec/09`, `formal-spec/11`. Idempotent — second run is a no-op.

### W-DOCS-5: Port the 11 reference docs (~2 sessions, parallel-friendly)
- Author one `DocDefinition` per pre-refactor reference doc.
- Some are trivial (CLI-REFERENCE — pure mechanical). Some have heavy preamble (CLI-RECIPES, SESSION-WORKFLOW-GUIDE).
- Each port deletes the corresponding manual doc.
- **Verification:** `pnpm docs:all` produces all 11 reference docs in `docs-live/reference/`. Spot-check against pre-refactor outputs.

### W-DOCS-6: Doctrine carriers (~3 small sessions, one per carrier)
- Add `@architect-tier-rule` + `taxonomy/tier-registry.ts`. Author `DocDefinition` for `_shared/four-tier-ladder.md`. Delete manual version.
- Add `ownership` field to `MetadataTagDefinition`. Author `DocDefinition` for `_shared/annotation-ownership.md`. Delete manual version.
- Add `@architect-lint-rule` carrier. Author `DocDefinition` for `_shared/fsm-transitions.md` (via existing FSM module). Author `DocDefinition` (or generated-insert) for `docs/VALIDATION.md`.

### W-DOCS-7: Cleanup pass (~1 session)
- Delete dead docs: `DOCS-GAP-ANALYSIS.md`, `CROSS-INSTANCE-CONVENTIONS.md`, `PR-NOTE-TAXONOMY-CAMPAIGN.md`, deprecated `INDEX.md`, deprecated `TAXONOMY.md`.
- Rewrite `docs/ARCHITECTURE.md` (1,627 lines) as a `DocDefinition` with rich shape extraction + 4 diagram types + ~150-line preamble.
- Author `docs/CLI.md`, `docs/MCP-SETUP.md`, `docs/VALIDATION.md` as `DocDefinition`s.

### W-DOCS-8: Query surface gaps (~1 session)
- Add the 9 missing query endpoints from INVENTORY § 5.
- 5-line CLI / MCP wrappers over existing projections.

### Independence and sequencing
- W-DOCS-1 blocks everything.
- W-DOCS-2 ⊥ W-DOCS-3, W-DOCS-4 (parallel after W-DOCS-1).
- W-DOCS-5 needs W-DOCS-1, W-DOCS-2.
- W-DOCS-6 needs W-DOCS-1, W-DOCS-2. Individual carriers ship independently.
- W-DOCS-7 needs everything before.
- W-DOCS-8 is fully independent of the rest.

Total: ~10-13 sessions. Most under 4 hours each. W-DOCS-1 + W-DOCS-2 + W-DOCS-5 is the MVP (~6 sessions) — produces parity with pre-refactor + the architecture improvements.

## 8. Migration & risk

- **No-BC doctrine compliance:** `referenceDocConfigs:` field gets removed from `ProjectConfigSchema` in W-DOCS-1. Zero current consumers (the field is dead). MIGRATION.md update covers the change.
- **Test corpus:** the 11 pre-refactor docs at `delivery-process/docs-live/reference/*.md` are the golden output. Any divergence after porting is investigated.
- **Codec subsystem boundary:** the new `doc-definition/` directory lives in `architect-projection`. Imports `architect-core` for graph + extractors that reach into AST. Existing fragment-based projections (the 43 codecs) are orthogonal — they continue to serve `architect-generate`'s per-pattern outputs and the query API.
- **Schema-driven content vs human content:** the design preserves preamble support so editorial framing stays under human control. The risk of "everything must be annotated" overreach is mitigated by `preamble()` being a first-class composition primitive.

## 9. Open questions for the design session

Pending decisions noted in DEEP-DIVE § "Pending decisions for the design session":

1. Multi-target output strategy (website + agent-context + JSON?)
2. `DocDefinition` location (root `docs-config/`, `docs-config/`, or per-package `.docs/`?)
3. Generated-insert syntax (`<!-- generated:source:start -->` vs `<!-- @architect-insert -->`?)
4. `referenceDocConfigs` backward-compat (drop entirely vs ship as sugar?)
5. Aggregation-tag multi-doc routing (`targetDoc: string[]` vs move routing to call site?)
