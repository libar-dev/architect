# Proposed design — the new doc-generation surface

> Code sketches and execution plan. Not normative; the design session refines.

## 1. Core types

```ts
// packages/architect-projection/src/doc-definition/types.ts

import type { PatternGraph } from '@libar-dev/architect-core';
import type { RenderableDocument, SectionBlock } from '../blocks/schema.js';
import type { DisclosureSpec } from '../projections/documentation-composition/disclosure-spec.js';

export interface DocBuildContext {
  readonly graph: PatternGraph;
  readonly emittingDocId: string; // current doc — used for "am I canonical?" checks
}

export interface DocTarget {
  readonly kind: 'website' | 'agent-context' | 'package-readme' | 'json';
  readonly path: string; // relative to repo root
}

export interface DocDefinition {
  readonly id: string;
  readonly title: string;
  readonly targets: readonly DocTarget[];
  build(ctx: DocBuildContext): RenderableDocument | Promise<RenderableDocument>;
}

// ContentFragment — reusable content unit included by multiple DocDefinitions
// at potentially different disclosure depths. See DEEP-DIVE § Q3.

export type DisclosureLevel = 'essential' | 'important' | 'useful' | 'advanced';

export interface ContentFragmentOpts {
  readonly disclosure: DisclosureLevel; // required — no default
  readonly mode?: 'inline' | 'link-only'; // default: 'inline'
  readonly linkToCanonical?: boolean; // default: false; auto-link to canonicalDoc if non-canonical inclusion
}

export interface ContentFragment {
  readonly id: string;
  readonly canonicalDoc: string; // DocDefinition.id where 'advanced' depth lives
  build(ctx: DocBuildContext, opts: ContentFragmentOpts): SectionBlock[];
}

export function defineContentFragment(spec: ContentFragment): ContentFragment {
  return spec; // identity helper for type-safe authoring
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

## 3b. ContentFragment example — stub-format reused across 3 docs

```ts
// docs-config/content-fragments/stub-format.fragment.ts
import { defineContentFragment } from '@libar-dev/architect-projection';
import {
  composeSections,
  heading,
  paragraph,
  asTable,
  linkToCanonical,
  gte,
} from '@libar-dev/architect-projection/compose';

export const stubFormatFragment = defineContentFragment({
  id: 'stub-format',
  canonicalDoc: 'formal-spec-07',

  build(ctx, opts) {
    const { disclosure, mode = 'inline', linkToCanonical: addLink = false } = opts;

    if (mode === 'link-only') {
      return [linkToCanonical(this, { text: 'Stub Format spec' })];
    }

    return composeSections([
      // ESSENTIAL — always emitted
      paragraph(
        'Design stubs are TypeScript files defining interfaces, types, and ' +
          'API shapes as design artifacts. They are ephemeral — deleted at ' +
          'implementation time.',
      ),

      // IMPORTANT — operational reference
      ...(gte(disclosure, 'important')
        ? [
            heading('Directory convention', 3),
            ...directoryConventionSection(),
            heading('Lifecycle', 3),
            ...lifecycleSection(),
          ]
        : []),

      // USEFUL — authoring detail
      ...(gte(disclosure, 'useful')
        ? [
            heading('Required JSDoc tags', 3),
            ...requiredTagsTable(),
            heading('Code conventions', 3),
            ...codeConventionsSection(),
          ]
        : []),

      // ADVANCED — full normative content
      ...(gte(disclosure, 'advanced')
        ? [
            heading('Tag syntax rules', 3),
            ...tagSyntaxRules(),
            heading('Exported type surface', 3),
            ...exportedTypeSurfaceSection(),
          ]
        : []),

      // Cross-reference if this is a non-canonical inclusion
      ...(addLink && ctx.emittingDocId !== this.canonicalDoc
        ? [linkToCanonical(this, { text: 'Full reference: Stub Format spec' })]
        : []),
    ]);
  },
});
```

Three consumers, each at a different depth:

```ts
// docs-config/formal-spec/07-stub-format.doc.ts
export const formalSpec07: DocDefinition = {
  id: 'formal-spec-07',
  title: '07 — Stub Format',
  targets: [{ kind: 'website', path: 'formal-spec/07-stub-format.md' }],
  build(ctx) {
    return composeDoc('07 — Stub Format', [
      ...preamble('docs-sources/formal-spec/07-intro.md'),
      ...stubFormatFragment.build(ctx, { disclosure: 'advanced' }),
    ]);
  },
};

// docs-config/skills/architect-design-session.doc.ts
export const designSessionSkill: DocDefinition = {
  id: 'skill-design-session',
  title: 'Architect Design-Tier Session',
  targets: [{ kind: 'agent-context', path: '.agents/skills/architect-design-session/SKILL.md' }],
  build(ctx) {
    return composeDoc('Architect Design-Tier Session', [
      ...preamble('docs-sources/skills/design-session-frontmatter.md'),
      ...doctrineReferencesSection(),
      ...preflightSection(),
      heading('Stubs (ephemeral scaffolds)', 2),
      ...stubFormatFragment.build(ctx, {
        disclosure: 'important',
        linkToCanonical: true,   // appends "Full reference: Stub Format spec" link
      }),
      ...antiDriftTripwiresSection(),
      ...acceptanceCriteriaSection(),
    ]);
  },
};

// docs-config/packages/architect-cli-readme.doc.ts (brief drive-by mention)
build(ctx) {
  return composeDoc('@libar-dev/architect-cli', [
    ...packageHeader(ctx),
    heading('Stubs (out of scope)', 3),
    ...stubFormatFragment.build(ctx, { mode: 'link-only' }),
    ...cliCommandsSection(ctx),
  ]);
}
```

The same content unit ships at three depths from one source. The canonical doc owns the full normative content; consumers pick what depth they need; cross-references resolve automatically.

### Integration with existing progressive-disclosure substrate

Two orthogonal disclosure axes:

| Axis                                                       | Controls                                                    | Mechanism                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| **INPUT disclosure** (new)                                 | Which sub-sections a ContentFragment emits                  | `ContentFragment.build(ctx, { disclosure })`        |
| **OUTPUT disclosure** (existing — `RenderMarkdownOptions`) | Whether bundle children inline or split into separate files | `disclosureLevel` / `disclosureSpec` on render call |

Composition: a `DocDefinition.build()` may emit ContentFragments at chosen input depths, returning a `RenderableDocument`. That document may be a `ProjectionBundle` with `children`, which the renderer fans out per its own output disclosure level. Same vocabulary across both axes; independent concerns.

### Build-time invariants for ContentFragments

The doc runner can enforce:

1. **Canonical doc uniqueness:** at most one DocDefinition references each ContentFragment at `disclosure: 'advanced'`. Warning if violated.
2. **Canonical depth consistency:** the DocDefinition declared as `canonicalDoc` MUST include the fragment at `disclosure: 'advanced'`. Error if mismatched.
3. **Link resolvability:** `linkToCanonical: true` only valid if `canonicalDoc` resolves to a real DocDefinition with a website target. Error otherwise.
4. **Fragment ID uniqueness:** all `ContentFragment.id` values globally unique. Error if duplicated.

### Spec/impl traceability (future extension)

A ContentFragment can declare a code reflection:

```ts
defineContentFragment({
  id: 'block-type-catalog',
  canonicalDoc: 'formal-spec-12',
  reflects: { module: 'architect-projection/blocks/schema', symbol: 'SectionBlock' },
  build(ctx, opts) {
    const blockTypes = extractEnumValues(ctx, 'SectionBlockKind');
    // ...
  },
});
```

If `SectionBlock` moves or its variants change, the build fails — closing the formal-spec drift problem at the fragment level. The fragment's CONTENT comes from the extractor; the CODE LINK is enforced by the build runner.

## 4. Worked example — `packages/architect-projection/README.md`

```ts
// docs-config/packages/architect-projection-readme.doc.ts

import type { DocDefinition } from '@libar-dev/architect-projection';
import {
  extractFunctionSignature,
  extractBehaviors,
  extractZodSchemaFields,
  extractSequenceDiagram,
  extractJSDocProse,
} from '@libar-dev/architect-projection/extractors';
import {
  composeDoc,
  preamble,
  heading,
  paragraph,
  asTable,
  asDiagram,
} from '@libar-dev/architect-projection/compose';

export const projectionReadme: DocDefinition = {
  id: 'architect-projection-readme',
  title: '@libar-dev/architect-projection',
  targets: [{ kind: 'package-readme', path: 'packages/architect-projection/README.md' }],
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

### W-DOCS-2d: ContentFragments + disclosure integration (~1 session)

- `defineContentFragment` helper + types.
- `gte(level, threshold)` disclosure comparator.
- `linkToCanonical(fragment, opts)` link-out builder.
- Build-runner enforcement of the four ContentFragment invariants (canonical uniqueness, canonical depth, link resolvability, ID uniqueness).
- Integration with existing `RenderMarkdownOptions.disclosureLevel` — the output-side machinery stays as-is; the new build-time mechanism feeds into it cleanly.
- **Verification:** ship a `stubFormatFragment` referenced by 3 test DocDefinitions at 3 disclosure levels. Assert each consumer renders the expected section set; assert non-canonical inclusions emit the cross-reference link; assert the build-runner rejects duplicate canonical declarations.

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
- W-DOCS-2a/2b/2c ⊥ W-DOCS-3, W-DOCS-4 (parallel after W-DOCS-1).
- W-DOCS-2d (ContentFragments) needs W-DOCS-1 and W-DOCS-2a (shape extractors). The compose helpers come from W-DOCS-1; the fragment runner is the new code.
- W-DOCS-5 needs W-DOCS-1, W-DOCS-2, AND W-DOCS-2d (the 11 reference docs benefit from ContentFragments for cross-doc reuse — `ARCHITECTURE-CODECS`, `ARCHITECTURE-TYPES`, and `REFERENCE-SAMPLE` overlap on type-catalog content).
- W-DOCS-6 needs W-DOCS-1, W-DOCS-2, AND W-DOCS-2d (doctrine reuse across `_shared/`, `docs/`, and `formal-spec/` is the core use case for ContentFragments).
- W-DOCS-7 needs everything before.
- W-DOCS-8 is fully independent of the rest.

Total: ~11-14 sessions. Most under 4 hours each. W-DOCS-1 + W-DOCS-2 + W-DOCS-2d + W-DOCS-5 is the MVP (~7 sessions) — produces parity with pre-refactor PLUS the cross-doc reuse capability the pre-refactor design lacked.

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

> **Status as of 2026-05-17:** all five questions ratified in
> [`DECISIONS.md`](./DECISIONS.md) (D1–D9). § 10 below extends this proposal
> with the wiki-tree-with-index design that emerged in the same session.

## 10. Wiki-tree-with-index extension

The fourth reuse boundary (alongside multi-target output, ContentFragment,
and generated-insert directives) is the DeepWiki-style **wiki tree with a
generated index**. One logical "topic" renders as a directory of small
focused pages plus a rich navigation index; the index is itself a projection
of the children.

See [`DECISIONS.md`](./DECISIONS.md) D1–D9 for ratified design choices.

### 10.1 Core types (additive to § 1)

```ts
// packages/architect-projection/src/doc-definition/wiki-index.ts

import type { DocDefinition, DocBuildContext } from './types.js';
import type { ProjectionBundle, Fragment } from '../fragments/index.js';

export interface ReadingPathStep {
  readonly routeId: string;       // LogicalRouteId of a child page
  readonly rationale: string;     // why this step at this position
}

export interface ReadingPath {
  readonly id: string;            // 'first-annotate'
  readonly intent: string;        // 'I want to annotate a TypeScript service file for the first time'
  readonly steps: readonly ReadingPathStep[];
}

export interface WikiIndexDefinition {
  readonly id: string;            // 'annotation-guide'
  readonly title: string;         // 'Annotation Guide'
  readonly root: DocDefinition;   // produces the ProjectionBundle whose children become pages
  readonly readingPaths?: readonly ReadingPath[];
  readonly preambles?: Readonly<Record<string, string>>; // routeId → preamble markdown path
}

export function defineWikiIndex(spec: WikiIndexDefinition): WikiIndexDefinition {
  return spec;
}

export function projectWikiIndex(
  def: WikiIndexDefinition,
  ctx: DocBuildContext,
): ProjectionBundle<Fragment> {
  // 1. Build the children: const bundle = await def.root.build(ctx)
  // 2. Walk bundle.children (LogicalRouteId-keyed, entityPathLayout-routed)
  // 3. For each child, derive: title, "Answers" (first paragraph), key entities, diagrams, tables
  // 4. Build the five navigation sections (see § 10.3)
  // 5. Return a new bundle with the INDEX as root + bundle.children as children
}
```

### 10.2 Navigation surfaces — derivation rules (D8)

Every section in the generated `INDEX.md` is derived. No hand-authored
navigation. See [`DECISIONS.md`](./DECISIONS.md) D8 for the canonical table.

The Concept Index is a **graph join over PatternGraph** (D3''), not a
string-clustering pass. For each pattern contributing to any child page,
collect its Gherkin `Scenario:` titles + `Rule:` titles + `Feature:`
description; invert by intent string; emit one row per intent pointing at
the matching pages.

**UML mapping** used by the wiki index (canonical, not extensible per
session) — see [`DECISIONS.md`](./DECISIONS.md) D3''.

### 10.3 Worked example — `docs/ANNOTATION-GUIDE.md` as the W-DOCS-1 case

```ts
// docs-config/wikis/annotation-guide.wiki.ts
import { defineWikiIndex } from '@libar-dev/architect-projection';
import { gettingStartedFragment } from '../fragments/annotation-getting-started.fragment.js';
import { ownershipModelFragment } from '../fragments/annotation-ownership-model.fragment.js';
import { tagReferenceFragment } from '../fragments/tag-reference.fragment.js';
// …other fragments

export const annotationGuide = defineWikiIndex({
  id: 'annotation-guide',
  title: 'Annotation Guide',
  root: {
    id: 'annotation-guide-root',
    title: 'Annotation Guide',
    targets: [{ kind: 'website', path: 'docs-live/annotation-guide/' }],
    build(ctx) {
      return composeBundle('Annotation Guide', [
        gettingStartedFragment.build(ctx, { disclosure: 'important' }),
        ownershipModelFragment.build(ctx, { disclosure: 'advanced' }),
        // …
        tagReferenceFragment.build(ctx, { disclosure: 'advanced' }), // emits per-groupName subtree
        // …
      ]);
    },
  },
  readingPaths: [
    {
      id: 'first-annotate',
      intent: 'I want to annotate a TypeScript service file for the first time',
      steps: [
        { routeId: '1-getting-started',         rationale: 'add @architect opt-in' },
        { routeId: '6-patterns-by-file-type',   rationale: 'find service-or-module pattern' },
        { routeId: '4-tag-reference/4-1-core',  rationale: 'look up required core tags' },
        { routeId: '7-verification/7-1-cli',     rationale: 'verify with pnpm architect:query' },
      ],
    },
    {
      id: 'add-new-tag',
      intent: 'I want to add a new tag to the taxonomy',
      steps: [
        { routeId: '2-ownership-model',          rationale: 'understand TS vs Gherkin boundary' },
        { routeId: '4-tag-reference',            rationale: 'pick the right group' },
        { routeId: '5-format-types',             rationale: 'choose a format type' },
        { routeId: '7-verification',             rationale: 'verify with diagnostics' },
      ],
    },
    {
      id: 'debug-missing-pattern',
      intent: "My pattern isn't appearing in scanner output — what now?",
      steps: [
        { routeId: '1-getting-started',         rationale: 'confirm file-level opt-in is present' },
        { routeId: '7-verification/7-2-common-issues', rationale: 'check the known-failure table' },
        { routeId: '7-verification/7-1-cli',     rationale: 'run architect:query unannotated --path' },
      ],
    },
  ],
});
```

The resulting on-disk tree:

```
docs-live/annotation-guide/
  INDEX.md                          ← projectWikiIndex output
  1-getting-started.md              ← preamble + JSDoc lifted from a canonical example
  2-ownership-model.md              ← projectTaxonomyDigest grouped by source-of-truth (TS vs Gherkin)
  3-shape-extraction.md             ← extractJSDocProse on shape-extractor module
  4-tag-reference/                  ← bundle child directory; one page per groupName
    4-1-core-tags.md
    4-2-relationship-tags.md
    4-3-architecture-tags.md
    4-4-timeline-tags.md
    4-5-prd-tags.md
    4-6-adr-tags.md
    4-7-other-tags.md
  5-format-types.md                 ← formatTypes[] from taxonomy JSON
  6-patterns-by-file-type.md        ← preamble (editorial)
  7-verification/
    7-1-cli-commands.md             ← extractCliCommands (W-DOCS-2)
    7-2-common-issues.md            ← preamble
```

`INDEX.md` is then generated mechanically per § 10.2; the manual
`docs/ANNOTATION-GUIDE.md` is deleted in the same PR (D5).

### 10.4 Three orthogonal disclosure axes (D2)

| Axis                  | Question                                              | Mechanism                                              |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| **INPUT disclosure**  | "Which sub-sections does this fragment emit?"         | `ContentFragment.build(ctx, { disclosure })` (§ 3b)    |
| **OUTPUT disclosure** | "Does this doc render inline or split into files?"   | `bundle.routing.disclosureSpec` + `splitOversizedDocument` |
| **INDEX disclosure**  | "How deep does navigation expose the tree?"          | `WikiIndexDefinition` — the index page itself is the disclosure slice; readers descend by clicking |

Same `essential | important | useful | advanced` vocabulary; three
independent concerns. A package README is one-file with INPUT-side
disclosure (no fan-out, no index); ANNOTATION-GUIDE is a tree with
INDEX-side disclosure (index summarizes, pages hold full content); a
formal-spec section is one-file at `advanced` everywhere (no disclosure
logic at all). Same primitives, three different shapes.

### 10.5 Agent-context skills as wiki trees (D7)

Each `.agents/skills/architect-*-session/SKILL.md` becomes a
`WikiIndexDefinition` with `targets: [{ kind: 'agent-context', path:
'.agents/skills/<skill>/' }]`. Shared `_shared/` modules become
ContentFragments embedded at chosen INPUT disclosure depths, with
`linkToCanonical: true` pointing back at the canonical wiki under
`docs-live/`.

### 10.6 What this campaign explicitly does NOT do

- Add annotation carriers (D3'').
- Add `MetadataTagDefinition` schema fields (D3b).
- Rely on `@architect-usecase` for any new wiring (D9).
- Touch the W1.5 `referenceDocConfigs: []` field — it gets deleted in
  W-DOCS-1 per § 8 ("Migration & risk").
- Re-introduce the dropped `createReferenceCodec` / `composite.ts` shapes
  verbatim — those become `DocDefinition.build()` composition (INVENTORY.md
  § 2).

### 10.7 Net taxonomy delta from the campaign

| Change                                                      | Count  |
| ----------------------------------------------------------- | ------ |
| Tags added                                                  | **0**  |
| Tags removed (under D9 follow-up; non-blocking)             | 0 or 1 |
| Tag-registry schema fields added                            | **0**  |
| New annotation carriers                                     | **0**  |

The campaign shrinks or holds the taxonomy.
