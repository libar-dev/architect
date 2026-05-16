# Docs generation — deep dive synthesis

> **Captured:** 2026-05-17. **Trigger:** post-W1.5 audit of generation capabilities vs manual doc content across `.agents/skills/_shared/`, `docs/`, `formal-spec/`.

## Headline

**This is a regression, not a missing feature.** The pre-refactor delivery-process repo had a working reference-codec subsystem (`createReferenceCodec` + 13 supporting files) that produced 11 reference docs totalling 4,430 lines from a 9-entry `referenceDocConfigs` array in `architect.config.ts`. The W1 monolith split kept the Zod schemas describing the configuration surface (`ReferenceDocConfig`, `DiagramScope`, the diagram-type and shape-group enums in `presentation-contracts.ts`) but dropped every consumer. The post-W1.5 `architect.config.ts` ships with `referenceDocConfigs: []` because there is nothing to read it.

Proof: `delivery-process/docs-live/reference/REFERENCE-SAMPLE.md` is 1,135 lines of high-density generated content with all 5 Mermaid diagram types (graph TB/LR, sequenceDiagram, classDiagram, stateDiagram-v2, C4Context), TypeScript shape extraction with JSDoc preservation, behavior-spec collapsibles, and ADR-decomposed rendering.

What got dropped (zero grep hits in post-W1.5 packages):
- `loadPreambleFromMarkdown()` utility.
- `createReferenceCodec()` factory and `createProductAreaConfigs()` helper.
- 13 codec files: `reference.ts`, `reference-builders.ts`, `reference-diagrams.ts`, `reference-types.ts`, `composite.ts`, `convention-extractor.ts`, `shape-matcher.ts`, `claude-module.ts`, `index-codec.ts`, `session.ts`, `pr-changes.ts`, `product-area-metadata.ts`, plus generator wrappers (`cli-recipe`, `cli-reference`, `decision-doc`, `design-review`).
- `claudeMdSection` / `claudeMdFilename` dual-target output (same source → both `docs-live/` AND `_claude-md/` modules).
- `codecOptions.index.documentEntries` (the 26-entry curated INDEX navigation).
- `generatorOverrides:` (per-generator output-dir routing).

## The reframe — don't restore, evolve

The user's instinct was right: **don't blindly restore the old `ReferenceDocConfig` shape.** The pre-refactor design was a single big config object per doc; we can do better. Three architectural shifts make the restored capability strictly more powerful than what was lost:

### 1. Three orthogonal layers, not one config

The old reference codec collapsed extraction, routing, and composition into one config object. Separate them:

| Layer | Concern | Today's status |
|---|---|---|
| **Extractors** | "What can we pull from PatternGraph + AST?" | Most exist; a few key ones missing (Zod-fields, structured function-signatures, CLI/MCP/lint catalogs) |
| **Routing** | "Which content belongs in which doc?" | Pull model (config-driven) and push model (aggregation tags with `targetDoc`) both exist in the data model; only pull is exercised |
| **Composition** | "How is a doc assembled?" | Was a static config template; should be TypeScript doc-builder functions for conditional logic, joins, reuse |

Plus a fourth concern that pre-refactor handled via `claudeMdFilename`:

| Layer | Concern | Today's status |
|---|---|---|
| **Output routing** | "Where does the output go — website, agent context, JSON?" | Dropped; needs restoration with multi-target support |

### 2. Doc definitions become code, not config

Replace `referenceDocConfigs:` (an array of object configs) with `DocDefinition` (a TypeScript module that exports a `build(graph)` function). This buys:
- Conditional sections (`if (decisions.length > 0)`)
- Computed joins (e.g., for each codec shape, find the ADR that decided it, inline as a footnote)
- Reusable helpers (`packageReadmeSection(pkg)` shared across 6 package READMEs)
- Type safety — the doc definition IS code; IDE catches typos against the extractor signatures
- Trivial unit testing — call `await doc.build(testGraph)`, assert on the `RenderableDocument` structure

The `ReferenceDocConfig` shape can survive as sugar — a thin wrapper that compiles to a `DocDefinition` for the simple-case authoring experience. But it's not the substrate.

### 3. The push model already exists — use it

The TAXONOMY JSON output already includes an `Aggregation Tags` group with entries like:
```json
{ "kind": "aggregation", "tag": "decision", "targetDoc": "DECISIONS.md" }
```

`kind: 'aggregation'` with `targetDoc` IS the push-model routing primitive. Any source annotated with `@architect-decision X` aggregates into `DECISIONS.md`. The registry already supports this — almost no consumer uses it.

The smart extension is **not** to invent a parallel `@architect-doc` annotation, but to:
- Use aggregation tags for content with a clear shared destination (decisions, intros, overviews — the existing pattern).
- Use pull-model extractors for sections whose content is identified structurally (types from a package, behaviors from a tag, diagrams from a scope).
- Add a third routing mode only when both fail — e.g., `@architect-doc-section <id>` as a SECTION-membership marker (not destination), used in conjunction with a doc that calls `extractBySection('codec-catalog').sortBy('doc-order')`.

## Answers to the two direct questions

### Q1 — Can PatternGraph extract all the shapes we need?

Mostly yes. Concrete answer per extractor:

| Shape | Extracted today | Quality |
|---|---|---|
| `interface` / `type` / `enum` / `const` declarations | ✅ | Source text + JSDoc preserved via `extractShapes()` |
| `function` declarations | ✅ | Source text + JSDoc — **but as raw text, not structured `{ name, params: [...], returns, ... }`** |
| JSDoc prose (`# Heading`, paragraphs, tables, code, lists) | ✅ | `parseMarkdownToBlocks()` — 6 of 9 block types (heading, paragraph, separator, table, code, list); collapsible/link-out flattened |
| `@architect-*` JSDoc tags | ✅ | Parsed to `tagRegistry` |
| Gherkin `Rule:` blocks (invariant/rationale/verified-by) | ✅ | `BusinessRule` fragment |
| Decision records (Context/Decision/Consequences) | ✅ | `DecisionRecord` fragment |
| Pattern edges (depends-on/uses/implements/extends/see-also/api-ref) | ✅ | Full graph |
| Aggregation tags with `targetDoc` | ✅ | Registry-level, see Q2 |
| `@architect-extract-shapes` discovery | ✅ | `discoverTaggedShapes()` already walks JSDoc looking for this — **wired but unused** |

What's **structurally missing** but reachable with modest extractor work:

| Missing extractor | Source available? | Unlocks |
|---|---|---|
| **Zod-schema → field table** (parse `z.strictObject({...}).describe(...)` calls into rows) | Yes — every contract is Zod by doctrine | `formal-spec/11-project-configuration.md`, `CONFIGURATION-GUIDE.md`, README "Documentation Composition Contract" table, the `ProgressiveDisclosurePolicySchema` table |
| **Function-signature → structured fragment** (`{ name, params: [{name, type, jsdoc}], returns: {type, jsdoc}, examples: [...] }`) | Yes — AST + JSDoc | "Usage" code blocks in package READMEs; CLI command param tables |
| **CLI-command catalog from `cli-schema.ts`** | Yes — `COMMAND_NAMES` + `helpSignature` + `helpDetail` | `CLI-REFERENCE.md` (63 lines pre-refactor — pure mechanical generation) |
| **MCP-tool catalog from `ARCHITECT_MCP_TOOLS`** | Yes — `tool-metadata.ts` | `MCP-SETUP.md` tool table |
| **Lint-rule catalog from `architect-guard/src/lint/rules/`** | Needs `@architect-lint-rule:<id>` annotation per rule (new carrier) | `VALIDATION.md` rule tables |
| **Test-extracted code examples** (find `// @example:foo` in test files, lift the test body as a code block) | Yes — vitest-cucumber steps are typed | Real usage examples that can't drift |
| **Imports/re-exports map** | Yes — TS AST | "Public surface" tables in package READMEs |
| **Generated-insert directive** (`<!-- generated:<source>:start -->...<!-- generated:<source>:end -->` fences in any manual file) | Source-agnostic — just write a rewrite pass | Spec/manual files keep prose hand-authored, tables come from one source. Solves the `formal-spec/04` ↔ tag registry ↔ `_shared/annotation-ownership.md` drift |

**The cheaper end of the problem is extraction. Routing and composition are the harder design choices.**

### Q2 — Annotation-driven config OR rethink to something more flexible?

The cleanest answer is "both, with code at the top." Three modes, all supported, picked per-doc:

| Mode | When right | Example |
|---|---|---|
| **Pull** (doc config lists tags / shape groups / diagrams) | Doc structure changes more often than content placement; central control desired | `extractBehaviors({ tag: 'codec-registry' })` |
| **Push** (annotation declares destination via aggregation tag) | Content scattered across many files; want to add content without touching central config | `@architect-decision codec-registry` on a feature → aggregates into the doc that calls `extractAggregations('decision').where(tag === 'codec-registry')` |
| **Hybrid (registry-mediated)** | Want a name in the registry that names the destination but lets content opt in via the annotation | Today's `{ kind: 'aggregation', tag: 'decision', targetDoc: 'DECISIONS.md' }` |

These are configuration MODES, not separate APIs. The user-facing surface is `DocDefinition.build(graph)` which calls extractors. Each extractor internally chooses pull / push / hybrid as appropriate.

## Worked examples — what would it take to generate these?

### `packages/architect-projection/README.md` (137 lines)

Generatable shape breakdown:
- **Package title + one-paragraph description**: `package.json` + `@architect-package-summary` JSDoc on a `package.ts` symbol
- **Pipeline diagram (ASCII art)**: a `documentation-pipeline` shape group with a `sequenceDiagram` scope
- **Usage examples**: `@architect-usage` JSDoc on `parseAndProjectSessionContext` (auto-extracted import path + signature + example body)
- **"Architecture invariants" bullets**: `extractBehaviors({ tag: 'adr-006', onlyInvariants: true })` — these ARE rules with rationale already
- **"Markdown/content trust boundary" section**: `@architect-trust-boundary markdown` JSDoc on `renderMarkdown`, `escapeText`, `link-out` schema — coherent feature with rules
- **"Documentation Composition Contract" disclosure table**: `extractZodSchemaFields('ProgressiveDisclosurePolicySchema')` — that table IS the schema with one row per enum value
- **"Testing" section**: `package.json` scripts + `@architect-test-strategy` JSDoc

**Stays manual:** the opening paragraph (positioning), the "Replaces the deleted `@libar-dev/architect-presentation`..." historical narrative.

**Net:** a 30-line preamble + a 10-line doc definition that calls 6 extractors generates the 137-line README. And it CAN'T drift from the actual `ProgressiveDisclosurePolicySchema`, the real ADR-006 invariants, or the trust-boundary tests.

### `packages/architect-projection/docs/MIGRATION.md` (230 lines)

Fundamentally different shape that exposes a sharp tradeoff:

- **Tables A/B/C (66 rows total)**: historical mapping from deleted codecs → surviving projections. The source side (deleted codecs) is *gone*. You can't extract a mapping where one side doesn't exist anymore. **This is a doc that captures a one-time event — it must stay frozen.**
- **"Renderer Overview" section**: fully extractable via `@architect-renderer` JSDoc on the 4 renderer entry points (`renderCompactText`, `renderJson`, `renderMarkdown`, `renderUi`).
- **"Residual ADR-006 leaks" section**: chronological narrative — stays manual.

**Template for all migration docs:** history freezes, surrounding context generates, banner says "Historical reference, frozen at <commit>." The existing MIGRATION.md does the first half of this correctly already.

### `docs/TAXONOMY.md` (74 lines, today manual but trivially generatable)

The `pnpm architect:query taxonomy --format json` output is the data. Two questions left:
1. Should the `TAXONOMY.md` doc be generated FROM the query output, or should it CALL `extractTagRegistry()` directly? (Doc definitions calling extractors is the cleaner answer — no shell-out, no JSON parsing.)
2. Should the manual `docs/TAXONOMY.md` be deleted entirely (the docs-live equivalent already exists and is generated)? **Yes** — the deprecation banner already points there. Delete on next pass.

## Pending decisions for the design session

These are the choices that need a person, not more analysis:

1. **Single output target (`docs-live/`) or multi-target (`docs-live/` + `_claude-md/` + JSON)?** Pre-refactor supported multi-target via `claudeMdFilename`. The architect-skills consolidation (W9) wants agent-context modules — should those be a generator target, or live as hand-curated overrides in `.agents/skills/_shared/`?
2. **`DocDefinition` location.** Where do the per-doc `*.doc.ts` files live? Options: (a) `architect.config/` directory at repo root (parallel to `architect.config.ts`); (b) `docs-config/` directory; (c) inside each package that owns the doc (e.g., `packages/architect-projection/.docs/README.doc.ts`). Recommended: (a) for cross-package docs, (c) for per-package READMEs.
3. **Generated-insert directive syntax.** Proposed: `<!-- generated:<source>[:<scope>]:start --><!-- generated:<source>[:<scope>]:end -->`. Alternative: `<!-- @architect-insert <source> <scope> -->...<!-- @architect-insert-end -->`. The first is more readable; the second is more discoverable via existing tag-grep tooling.
4. **Backward compat with `ReferenceDocConfig`.** Should `referenceDocConfigs:` in `architect.config.ts` still work as sugar after the new `DocDefinition` API lands, or is the migration mandatory? (Repo doctrine is no-BC; recommend: delete the field, port any consumers — none exist today.)
5. **Aggregation-tag extension.** Today the aggregation kind has `targetDoc`. To support multi-doc aggregation (a tag that flows into N docs), we need to either (a) allow `targetDoc: string[]`, or (b) move routing out of the registry into the extractor call site (`extractAggregations('decision').forDoc('DECISIONS')`). Recommend (b) — registry is for taxonomy, not transport.

See `PROPOSED-DESIGN.md` for concrete type sketches that bias these decisions toward a coherent endpoint.
