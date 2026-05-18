# What the PatternGraph extracts (implemented today)

## 1. Sources of truth — the two extractors

| Source           | What it reads                                                           | Extractor                                                                 | Output                                                                      |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| TypeScript JSDoc | `@architect-*` directives on `.ts/.tsx` files                           | `DocExtractor` (`packages/architect-core/src/extractor/doc-extractor.ts`) | `ExtractedPattern` with `source.kind = typescript`                          |
| Gherkin specs    | Feature/rule/scenario tags + Background data tables on `.feature` files | `GherkinExtractor` (`gherkin-extractor.ts`)                               | `ExtractedPattern` with `source.kind = gherkin`                             |
| TS tagged shapes | `@architect-shape` blocks within a TS pattern's file                    | `ShapeExtractor` (`shape-extractor.ts`, AST-walked)                       | `extractedShapes[]` attached to the pattern                                 |
| Pattern join     | Both above merged by `patternName`                                      | `DualSourceExtractor.combineSources`                                      | `DualSourcePattern` (`ExtractedPattern + process + deliverables + sources`) |

## 2. The 27 `@architect-*` JSDoc directives (TS side)

From `DocDirectiveSchema` + observed grep:

**Identity / classification (8)**
- `@architect-pattern <Name>` — pattern identifier (REQUIRED)
- `@architect-status <roadmap|active|completed|candidate|...>`
- `@architect-role:<role>` — canonical role tag (lookup against `TagRegistry.roles`)
- `@architect-bounded-context:<name>`
- `@architect-product-area <name>`
- `@architect-level <epic|feature|component|…>`
- `@architect-parent <PatternName>`
- `@architect-phase <int>`

**Relationships (6)**
- `@architect-uses <Pattern[,…]>`
- `@architect-depends-on <Pattern[,…]>`
- `@architect-implements <Pattern[,…]>`
- `@architect-extends <Pattern>`
- `@architect-see-also <Pattern[,…]>`
- `@architect-target <path>` — target deliverable path (stubs)

**Lifecycle/governance (4)**
- `@architect-completed <date>`
- `@architect-since <version>`
- `@architect-unlock-reason <≥10-char rationale>` — bypass for FSM gate
- `@architect-title <human title>`

**ADR-specific (7)**
- `@architect-adr <id>`
- `@architect-adr-status`
- `@architect-adr-category`
- `@architect-adr-theme`
- `@architect-adr-layer`
- `@architect-adr-supersedes <ADR-id>`
- `@architect-adr-superseded-by <ADR-id>`

**Other (2)**
- `@architect-decision` — aggregation tag (flags this block as a decision)
- `@architect-validation` — validation marker
- `@architect-cli` — CLI bin marker
- `@architect` — opt-in marker prefix (without it the directive is ignored)

Aggregation tags (no value): `@architect-overview`, `@architect-decision`, `@architect-intro` (`getAggregationTags`, doc-extractor.ts:347).

## 3. Free-form JSDoc prose & shape detail

`DocDirective.description` (everything after the tag block) is captured verbatim. Within it, three sub-shapes are parsed structurally:

- **Heading-style docstring** (lines like `## DocExtractor - JSDoc Directive Extraction`)
- **`### When to Use`** bullet lists → `whenToUse: string[]`
- **`@example` blocks** → `directive.examples: string[]`

When `@architect-shape` blocks exist in the file, `ShapeExtractor` produces an `ExtractedShape` per tagged interface/type/enum/function/const with:

```
ExtractedShape {
  name, kind: 'interface' | 'type' | 'enum' | 'function' | 'const',
  sourceText, jsDoc?, lineNumber,
  typeParameters?, extends?, overloads?,
  exported, group?, includes?,
  propertyDocs[]: { name, jsDoc },     // per-property JSDoc
  params[]: { name, type?, description }, // @param parsed
  returns?: { type?, description },    // @returns
  throws[]: { type?, description }     // @throws
}
```

This is the JSDoc-prose-to-structured-data path. It captures **per-property JSDoc**, `@param`/`@returns`/`@throws` tables, type parameters, and `extends` chains.

## 4. Gherkin extraction — what comes off `.feature` files

From `feature.ts` + `gherkin-extractor.ts` + `dual-source-extractor.ts`:

**Feature-level tags** parsed into structured fields:
- `@pattern:<Name>` → `process.pattern`
- `@phase:<n>`, `@status:<v>`, `@quarter:<v>`, `@effort:<v>`, `@team:<v>`, `@workflow:<v>`, `@completed:<v>`, `@effort-actual:<v>`, `@risk:<v>`, `@product-area:<v>`, `@user-role:<v>`, `@business-value:"<v>"`

**Background data tables** → `Deliverable[]` (one row per deliverable):
- Headers recognised: `Deliverable`, `Status`, `Tests`, `Location`, `Finding`, `Release`
- Status validates against `DELIVERABLE_STATUS_VALUES`

**Rules + Scenarios** → `BusinessRule[]` on the pattern, plus full `GherkinScenario` records:
- `Rule:` header + tags + scenarios + docstring → projection `BusinessRule { invariant, rationale, verifiedBy[], scenarioCount, package, productArea }`
- Scenario semantic tags (whitelisted in `SEMANTIC_SCENARIO_TAGS`): `happy-path`, `validation`, `business-failure`, `business-rule`, `compensation`, `idempotency`, `expiration`, `workflow-state`
- Every step keeps its `keyword`, `text`, optional `dataTable`, optional `docString` (with `mediaType`)
- `Examples:` tables on Scenario Outlines preserved with `headers` + `rows`

**Open Questions block** in feature description → `OpenQuestionList.items[].questions[]`

## 5. Per-pattern read model (`ExtractedPattern` — 60+ fields)

The Zod schema in `validation-schemas/extracted-pattern.ts` is the canonical shape. Categorised:

| Group                      | Fields                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identity                   | `id`, `name`, `patternName`, `title`, `role`, `boundedContext`                                                                                         |
| Source                     | `source.file`, `source.lines`, `directive` (full DocDirective), `code`, `exports[]`, `extractedAt`                                                     |
| Status/lifecycle           | `status`, `adr`, `adrStatus`, `adrCategory`, `adrTheme`, `adrLayer`, `adrSupersedes`, `adrSupersededBy`, `since`, `completed`, `unlockReason`          |
| Hierarchy                  | `level`, `parent`, `children[]`, `phase`, `release`, `quarter`                                                                                         |
| Relationships              | `uses[]`, `implementsPatterns[]`, `extendsPattern`, `seeAlso[]`, `apiRef[]`, `targetPath`                                                              |
| Delivery                   | `effort`, `effortActual`, `team`, `workflow`, `risk`, `priority`, `productArea`, `userRole`, `businessValue`                                           |
| Specs                      | `scenarios[]` (ScenarioRef), `behaviorFile`, `behaviorFileVerified`, `executableSpecs[]`, `rules[]` (thin BusinessRule), `whenToUse[]`, `convention[]` |
| Body                       | `description` (prose), `examples[]`, `include[]`, `extractedShapes[]`, `constraints[]`                                                                 |
| Discovery (review surface) | `discoveredGaps[]`, `discoveredImprovements[]`, `discoveredRisks[]`, `discoveredLearnings[]`                                                           |
| Deliverables (joined)      | `deliverables[]: { name, status, tests, location, finding?, release? }`                                                                                |

## 6. Projection Fragments — 42 discriminated-union kinds

These are the *typed shapes you actually get out of the CLI/MCP*. From `FragmentSchema`:

**Pattern-relations (12)**
`PatternCatalog`, `PatternSummary`, `PatternDetail`, `PatternBundleEntry`, `BoundedContext`, `ArchitectureNeighborhood`, `ArchitectureComparison`, `DependencyEdge`, `DependencyEdgeSet`, `DependencyTree`, `OpenQuestionList`, `OrphanPatternList`

**Governance (7)**
`BusinessRule`, `BusinessRuleReference`, `BusinessRuleSet`, `DecisionRecord` (ADR/PDR/DDR/TDR with `context[] / decision[] / consequences[] / alternatives[]` typed-block arrays), `DecisionCatalog`, `TaxonomyDigest`, `ValidationRuleDigest`

**Delivery reporting (5)**
`PhaseProgress`, `StatusDistribution`, `RoadmapTimeline`, `ReleaseNotesDigest`, `TraceabilityMatrix`

**Execution context (7)**
`Deliverable`, `DeliverableManifest`, `FileReadingList`, `HandoffRecord`, `ScopeReadinessCheck`, `ScopeReadinessReport`, `SessionContextBundle`

**Operational insights (8)**
`OverviewDigest`, `AnnotationCoverage`, `TagUsageEntry`, `TagUsageMatrix`, `SourceInventoryEntry`, `SourceInventoryDigest`, `RoleProfile`, `RoleProfileCollection`, `RequirementDigest`

**Documentation composition (3)**
`ProjectConfigSnapshot`, `ArchitectureDiagram`, `PrChangeReview`

## 7. Typed block primitives (inside Fragment bodies)

`packages/architect-projection/src/blocks/schema.ts` defines the inline content primitives used wherever a Fragment carries prose-ish content (notably `DecisionRecord.context/decision/consequences/alternatives`):

`heading` (levels 1–6), `paragraph`, `separator`, `table`, `list`, `code`, `mermaid`, `link-out`, `collapsible`. These are how ADR prose becomes structured — `decision: BlockSchema[]` rather than a raw string.

## 8. What's NOT extracted (worth knowing)

- Inline `// architect:` style comments — only JSDoc blocks are scanned.
- Arbitrary test assertions — only `Rule:` + scenario shape, not the step-definition code.
- Cross-file shape merging — `extractedShapes` are file-local; re-exports get a separate `ReExportedShape` record but no body.
- Git/blame/owner metadata — not surfaced; nothing reads VCS.
- Comments inside `architect/` design specs are read for graph build but **not** compiled or linted (per CLAUDE.md doctrine).

## 9. How to actually pull each shape

| You want                                                | Canonical verb                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Everything for a pattern (composite)                    | `bundle <Pattern> --mode <session> --format json`                                                   |
| Full record (deliverables, rules, relationships, stubs) | `pattern <Name>` or `--format json` via `bundle`                                                    |
| Just relationships                                      | `dep-tree <Pattern>` / `arch neighborhood <Pattern>`                                                |
| Just business rules                                     | `rules --pattern <Pattern>` / `rules --package <ws>` / `rules --feature <glob>`                     |
| Just open questions                                     | `open-questions [--parent <X>] --format json`                                                       |
| Decisions catalog                                       | `documentation decisions`                                                                           |
| Extracted shapes (JSDoc bodies, params, returns)        | Live inside `pattern <Name>` / not surfaced by a dedicated verb — projection consumes them for docs |
| Tag/role/taxonomy inventory                             | `taxonomy --count` / `tags` / `arch roles`                                                          |
| Graph integrity                                         | `arch dangling --strict` / `arch orphans` / `arch coverage`                                         |
| FSM transition gate                                     | `query isValidTransition <from> <to>`                                                               |

## 10. Headline counts (live, this repo, 2026-05-17)

- 262 delivery patterns (116 completed / 120 active / 26 planned), 14 candidate
- 344 extracted business rules (`rules --count`)
- 30 taxonomy entries — 8 roles, 19 metadata tags, 3 aggregation tags
- 42 projection Fragment kinds in the discriminated union
- 21 MCP tools (CLI parity for 18, MCP-only for 3: `architect_rebuild`, `architect_config`, `architect_help`)

The Data API is the canonical surface for all of the above — the `bundle <Pattern> --mode <session>` verb is the single composite that returns everything implementation work actually needs (docstring + rules + scenarios + deps + open-questions in one shot).