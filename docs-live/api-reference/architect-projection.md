# architect-projection API Reference

**Purpose:** Type and API surface for a single workspace package

---

## Overview

113 shapes across 48 patterns in architect-projection.

## AnnotationCoverage

### AnnotationCoverageSchema

Fragment shape summarizing annotation coverage across source files — total and annotated file counts, the list of unannotated files, the coverage percentage, and the per-tag gap breakdown.

```ts
AnnotationCoverageSchema = z.strictObject({
  kind: z.literal('AnnotationCoverage'),
  totalSourceFiles: z.number().int().nonnegative(),
  annotatedFiles: z.number().int().nonnegative(),
  unannotatedFiles: z.array(z.string()),
  coveragePercentage: z.number().min(0).max(100),
  gapsByTag: GapsByTagSchema,
})
```

## ArchitectureComparison

### ArchitectureComparisonSchema

A side-by-side comparison of two bounded contexts — their summaries, the dependencies they share or hold uniquely, and the integration points between them.

```ts
ArchitectureComparisonSchema = z.strictObject({
  kind: z.literal('ArchitectureComparison'),
  context1: BoundedContextSummarySchema,
  context2: BoundedContextSummarySchema,
  sharedDependencies: z.array(z.string()),
  uniqueToContext1: z.array(z.string()),
  uniqueToContext2: z.array(z.string()),
  integrationPoints: z.array(ArchitectureIntegrationPointSchema),
})
```

### ArchitectureIntegrationPointSchema

One cross-context integration point — the source and target patterns, their respective contexts, and the relationship that connects them.

```ts
ArchitectureIntegrationPointSchema = z.strictObject({
  from: z.string(),
  fromContext: z.string(),
  to: z.string(),
  toContext: z.string(),
  relationship: IntegrationRelationshipSchema,
})
```

### BoundedContextSummarySchema

A compact summary of one bounded context — its name, pattern count, member patterns, and the full set of dependencies it draws on.

```ts
BoundedContextSummarySchema = z.strictObject({
  name: z.string(),
  patternCount: z.number().int().nonnegative(),
  patterns: z.array(z.string()),
  allDependencies: z.array(z.string()),
})
```

### IntegrationRelationshipSchema

The kind of relationship that links two patterns across bounded contexts.

```ts
IntegrationRelationshipSchema = z.enum(['uses', 'dependsOn'])
```

## ArchitectureDiagram

### ArchitectureDiagramPresentationSchema

Optional document-presentation override for a diagram fragment. When absent the renderer derives the H1 title / purpose / detail-level from the fragment kind (\`Architecture\`). The \`design-review\` view sets it so the same fragment shape renders under its own heading without a second fragment kind or normalizer.

```ts
ArchitectureDiagramPresentationSchema = z.strictObject({
  title: z.string(),
  purpose: z.string(),
  detailLevel: z.string().optional(),
})
```

### ArchitectureDiagramSchema

The architecture-diagram fragment — its scope, the ordered diagram sections, an optional legend, optional fan-in and cross-package-context rankings, and the overall pattern list.

```ts
ArchitectureDiagramSchema = z.strictObject({
  kind: z.literal('ArchitectureDiagram'),
  scope: ArchitectureDiagramScopeSchema,
  scopeValue: z.string().optional(),
  presentation: ArchitectureDiagramPresentationSchema.optional(),
  sections: z.array(ArchitectureDiagramSectionSchema),
  legend: z.array(BlockSchema).optional(),
  fanIn: z.array(FanInEntrySchema).optional(),
  crossPackageContexts: z.array(CrossPackageContextEntrySchema).optional(),
  patterns: z.array(z.string()),
})
```

### ArchitectureDiagramSectionSchema

One labeled diagram within an architecture document — the context map or a single group's detail diagram. Splitting the architecture view into many bounded sections keeps every Mermaid block renderable (no single block holds all patterns) and far more readable than one mega-graph.

```ts
ArchitectureDiagramSectionSchema = z.strictObject({
  title: z.string(),
  description: z.string().optional(),
  diagram: MermaidBlockSchema,
  patterns: z.array(z.string()),
})
```

### CrossPackageContextEntrySchema

One bounded context whose member patterns resolve to more than one workspace package — a seam where a single context is implemented across package boundaries.

```ts
CrossPackageContextEntrySchema = z.strictObject({
  context: z.string(),
  packages: z.array(z.string()),
  patternCount: z.number().int().nonnegative(),
})
```

### FanInEntrySchema

One row of the fan-in / hub view — a pattern ranked by how many in-view peers depend on it. Surfaces hub patterns that otherwise render as edgeless leaves in the per-group detail diagrams (their consumers live in other groups).

```ts
FanInEntrySchema = z.strictObject({
  pattern: z.string(),
  usedByCount: z.number().int().nonnegative(),
  topConsumers: z.array(z.string()),
})
```

## ArchitectureNeighborhood

### ArchitectureNeighborhoodSchema

The relationship neighborhood around a focal pattern — its context, role, and layer, every typed relation edge (uses, usedBy, dependsOn, enables, implements), its see-also cross-links, the rules that enforce it (\`enforcedBy\`, the inverse of \`@architect-enforces-decision\`), its same-context peers, and the artifacts that implement it.

```ts
ArchitectureNeighborhoodSchema = z.strictObject({
  kind: z.literal('ArchitectureNeighborhood'),
  pattern: z.string(),
  context: z.string().optional(),
  role: z.string().optional(),
  layer: z.string().optional(),
  uses: z.array(z.string()),
  usedBy: z.array(z.string()),
  dependsOn: z.array(z.string()),
  enables: z.array(z.string()),
  seeAlso: z.array(z.string()),
  enforcedBy: z.array(z.string()),
  sameContext: z.array(z.string()),
  implements: z.array(z.string()),
  implementedBy: z.array(ImplementationRefSchema),
})
```

## BoundedContextFragmentContract

### BoundedContextEntrySchema

One entry in a bounded-context catalog — the context name with its pattern count, member patterns, architecture layers, and roles.

```ts
BoundedContextEntrySchema = z.strictObject({
  name: z.string(),
  patternCount: z.number().int().nonnegative(),
  patterns: z.array(z.string()),
  layers: z.array(z.string()),
  roles: z.array(z.string()),
})
```

### BoundedContextSchema

A catalog of bounded contexts, optionally narrowed by \`scope\`, with one entry per context.

```ts
BoundedContextSchema = z.strictObject({
  kind: z.literal('BoundedContext'),
  scope: z.string().optional(),
  entries: z.array(BoundedContextEntrySchema),
})
```

## BusinessRule

### BusinessRuleSchema

A single governance business rule — its owning feature and package, the invariant it enforces, the scenarios that verify it, and optional pattern and product-area scope metadata.

```ts
BusinessRuleSchema = z.strictObject({
  kind: z.literal('BusinessRule'),
  id: z.string().optional(),
  feature: z.string(),
  ruleName: z.string(),
  package: z.string(),
  invariant: z.string().optional(),
  rationale: z.string().optional(),
  verifiedBy: z.array(z.string()),
  scenarioCount: z.number().int().nonnegative(),
  pattern: z.string().optional(),
  productArea: z.string().optional(),
})
```

## BusinessRuleReference

### BusinessRuleReferenceSchema

Minimal back-reference from a business rule to the route that owns it — carries the feature, rule name, and owning route id.

```ts
BusinessRuleReferenceSchema = z.strictObject({
  kind: z.literal('BusinessRuleReference'),
  feature: z.string(),
  ruleName: z.string(),
  ownerRouteId: z.string().min(1),
})
```

## BusinessRuleSet

### BusinessRuleSetSchema

A scoped collection of business rules — discriminated on \`scope\` (all, product-area, feature, package, or decision) with optional grouping metadata describing how the rules are bucketed.

```ts
BusinessRuleSetSchema = z.discriminatedUnion('scope', [
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('all'),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('product-area'),
    scopeValue: z.string(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('feature'),
    scopeValue: z.string(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('package'),
    scopeValue: z.string(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('decision'),
    scopeValue: z.string(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
])
```

## CompactTextRenderer

### renderCompactText

Renders a projection fragment or bundle into compact, marker-delimited plain text for AI-facing CLI/MCP output. Bundles render their root followed by each child section; unknown fragment kinds fall back to a generic key-value view.

```ts
renderCompactText = (
  input: ProjectionInput,
  options?: RenderCompactOptions,
): string => {
  if (isBundle(input)) {
    return renderBundle(input, options);
  }

  return renderFragment(input, options);
}
```

## DecisionCatalog

### DecisionCatalogSchema

A collection of normalized decision records for a governance surface.

```ts
DecisionCatalogSchema = z.strictObject({
  kind: z.literal('DecisionCatalog'),
  decisions: z.array(DecisionRecordSchema),
})
```

## DecisionRecord

### DecisionRecordSchema

One decision record (ADR/PDR/DDR/TDR) — its id, type, status, and title plus structured context, decision, consequences, optional alternatives, and links to related decisions and affected patterns.

```ts
DecisionRecordSchema = z.strictObject({
  kind: z.literal('DecisionRecord'),
  id: z.string(),
  type: DecisionTypeSchema,
  status: DecisionStatusSchema,
  title: z.string(),
  context: z.array(BlockSchema),
  decision: z.array(BlockSchema),
  consequences: z.array(BlockSchema),
  alternatives: z.array(BlockSchema).optional(),
  relatedDecisions: z.array(z.string()),
  affectedPatterns: z.array(z.string()),
})
```

## Deliverable

### DeliverableSchema

Fragment shape for one execution-context deliverable record — its name, status, the tests that cover it, its source location, and optional finding.

```ts
DeliverableSchema = z.strictObject({
  kind: z.literal('Deliverable'),
  name: z.string(),
  status: z.string(),
  tests: z.array(z.string()),
  location: z.string(),
  finding: z.string().optional(),
})
```

## DeliverableManifest

### DeliverableManifestSchema

Fragment shape for one pattern's ordered list of deliverables. Carries the fragment \`kind\` discriminator, the owning pattern name, and the deliverable items in declaration order.

```ts
DeliverableManifestSchema = z.strictObject({
  kind: z.literal('DeliverableManifest'),
  pattern: z.string(),
  items: z.array(DeliverableSchema),
})
```

## DeliveryReportingSupporting

### StatusCountsSchema

Absolute pattern counts per delivery status, plus their total.

```ts
StatusCountsSchema = z.strictObject({
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})
```

### StatusPercentagesSchema

Pattern share per delivery status, each a 0-100 percentage.

```ts
StatusPercentagesSchema = z.strictObject({
  completed: z.number().min(0).max(100),
  active: z.number().min(0).max(100),
  planned: z.number().min(0).max(100),
  candidate: z.number().min(0).max(100),
})
```

### TraceRowSchema

One row of a traceability matrix — a pattern with its optional status and the tests, specs, and deliverables that trace to it.

```ts
TraceRowSchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  tests: z.array(z.string()),
  specs: z.array(z.string()),
  deliverables: z.array(z.string()),
})
```

## DependencyContext

### DependencyContextSchema

Focal-rooted, bidirectional transitive dependency context for one pattern. \`upstream\` is the cycle-safe closure over the focal's prerequisites (what it needs); \`downstream\` is the closure over its dependents (what needs it, the blast radius). The focal pattern is the root of both forests, named by \`focal\`, and never appears as a node. \`summary\` precomputes the direct and transitive counts in each direction so a consumer can size impact without re-walking. \`options.maxDepth\` records the depth cap that produced the view.

```ts
DependencyContextSchema = z.strictObject({
  kind: z.literal('DependencyContext'),
  focal: z.string(),
  upstream: z.array(DependencyContextNodeSchema),
  downstream: z.array(DependencyContextNodeSchema),
  summary: z.strictObject({
    upstreamDirect: z.number().int().nonnegative(),
    upstreamTransitive: z.number().int().nonnegative(),
    downstreamDirect: z.number().int().nonnegative(),
    downstreamTransitive: z.number().int().nonnegative(),
  }),
  options: z.strictObject({
    maxDepth: z.number().int().nonnegative(),
  }),
})
```

## DependencyEdge

### DependencyEdgeSchema

One normalized directed edge between two patterns, tagged with the kind of relation it represents.

```ts
DependencyEdgeSchema = z.strictObject({
  kind: z.literal('DependencyEdge'),
  from: z.string(),
  to: z.string(),
  relationKind: DependencyRelationKindSchema,
})
```

## DependencyEdgeSet

### DependencyEdgeSetSchema

The set of outgoing dependency edges from a single source pattern.

```ts
DependencyEdgeSetSchema = z.strictObject({
  kind: z.literal('DependencyEdgeSet'),
  from: z.string(),
  items: z.array(DependencyEdgeSchema),
})
```

## DocumentationCompositionSupporting

### ArchitectureDiagramScopeSchema

The scope an architecture diagram is drawn at — by component, layer, theme, bounded context, product area, or package. \`layered\` and \`theme\` are the decision-record lenses: both group the patterns carrying the corresponding ADR classification (\`@architect-adr-layer\` / \`@architect-adr-theme\`) — the evolutionary layer vs the synthesis theme of a decision — and are structural twins driven by the same grouping engine.

```ts
ArchitectureDiagramScopeSchema = z.enum([
  'component',
  'layered',
  'theme',
  'bounded-context',
  'product-area',
  'package',
])
```

### DocumentationSectionSchema

One documentation section — its id, title, and the blocks it contains.

```ts
DocumentationSectionSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  blocks: z.array(BlockSchema),
})
```

## ExecutionContextSupporting

### CheckSeveritySchema

Severity level attached to a readiness check — informational, a warning, or a blocking error.

```ts
CheckSeveritySchema = z.enum(['info', 'warning', 'error'])
```

### DepEntrySchema

One dependency entry in a session bundle — the depended-on pattern's name, status, source file, and whether the edge is a planning or implementation dependency.

```ts
DepEntrySchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  file: z.string(),
  kind: DepKindSchema,
})
```

### DepKindSchema

Classifies a dependency edge as a planning-time or implementation-time dependency.

```ts
DepKindSchema = z.enum(['planning', 'implementation'])
```

### FsmContextSchema

FSM context for a pattern — its current lifecycle status, the transitions currently legal from that status, and its protection level.

```ts
FsmContextSchema = z.strictObject({
  currentStatus: z.string(),
  validTransitions: z.array(z.string()),
  protectionLevel: ProtectionLevelSchema,
})
```

### NeighborEntrySchema

Architecture-neighbor entry in a session bundle — a nearby pattern's name, status, role, bounded context, and source file.

```ts
NeighborEntrySchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  role: z.string().optional(),
  archContext: z.string().optional(),
  file: z.string().optional(),
})
```

### PatternContextMetaSchema

Per-pattern metadata carried in a session context bundle — the pattern's name, status, role, source file, and a short summary.

```ts
PatternContextMetaSchema = z.strictObject({
  name: z.string(),
  status: z.string().optional(),
  role: z.string(),
  file: z.string(),
  summary: z.string(),
})
```

### PatternFsmEntrySchema

Pairs a pattern name with its FSM context, for the per-pattern FSM map in a session bundle.

```ts
PatternFsmEntrySchema = z.strictObject({
  pattern: z.string(),
  fsm: FsmContextSchema,
})
```

### ProtectionLevelSchema

Protection level governing how strongly a pattern's scope is guarded — unprotected, scope-protected, or hard-protected.

```ts
ProtectionLevelSchema = z.enum(['none', 'scope', 'hard'])
```

### ScopeVerdictSchema

Overall verdict for a scope-readiness report — passing, blocked, or passing with warnings.

```ts
ScopeVerdictSchema = z.enum(['PASS', 'BLOCKED', 'WARN'])
```

### StubRefSchema

Reference to a code stub awaiting implementation — the stub file, its intended target path, and the pattern name it backs.

```ts
StubRefSchema = z.strictObject({
  stubFile: z.string(),
  targetPath: z.string(),
  name: z.string(),
})
```

## FileReadingList

### FileReadingListSchema

Fragment shape for the files an agent should read to understand a pattern — the pattern's own primary files plus its completed dependencies, roadmap dependencies, and architecture neighbors.

```ts
FileReadingListSchema = z.strictObject({
  kind: z.literal('FileReadingList'),
  pattern: z.string(),
  primary: z.array(z.string()),
  completedDeps: z.array(z.string()),
  roadmapDeps: z.array(z.string()),
  architectureNeighbors: z.array(z.string()),
})
```

## FragmentRendererDispatch

### dispatchByKind

Dispatches a fragment to its kind-specific handler in \`table\`, or to \`fallback\` when no entry matches. Bridges the runtime \`fragment.kind\` discriminator back to the compile-time \`FragmentByKind&lt;K&gt;\` handler signature.

```ts
function dispatchByKind<Out, Options>(
  fragment: Fragment,
  table: KindTable<Out, Options>,
  fallback: (fragment: Fragment, options: Options) => Out,
  options: Options,
): Out;
```

#### Parameters

| Parameter | Type | Description                                                |
| --------- | ---- | ---------------------------------------------------------- |
| fragment  |      | The fragment to dispatch on its \`kind\`.                  |
| table     |      | The kind-keyed handler table to look the fragment up in.   |
| fallback  |      | Handler invoked when no table entry matches the kind.      |
| options   |      | Renderer options threaded through to the selected handler. |

#### Returns

The output produced by the matched handler or the fallback.

### KindTable

A partial handler table keyed by FragmentKind; each entry receives the exact \`FragmentByKind&lt;K&gt;\` for its key and returns the renderer output. Kinds without an entry fall through to the dispatcher's fallback.

```ts
type KindTable<Out, Options> = {
  readonly [K in FragmentKind]?: (fragment: FragmentByKind<K>, options: Options) => Out;
};
```

### StrictKindTable

A handler table that requires an entry for every kind in \`Kinds\`, giving compile-time exhaustiveness over the chosen subset of FragmentKind.

```ts
type StrictKindTable<Out, Options, Kinds extends FragmentKind> = {
  readonly [K in Kinds]: (fragment: FragmentByKind<K>, options: Options) => Out;
};
```

## GovernanceSupporting

### BusinessRuleGroupingSchema

The dimension a business-rule set is grouped by.

```ts
BusinessRuleGroupingSchema = z.enum(['package', 'product-area', 'feature'])
```

### BusinessRuleScopeSchema

The scope a business-rule set is gathered over.

```ts
BusinessRuleScopeSchema = z.enum(['all', 'package', 'product-area', 'feature'])
```

### DecisionStatusSchema

Lifecycle status of a decision record.

```ts
DecisionStatusSchema = z.enum([
  'proposed',
  'accepted',
  'rejected',
  'superseded',
  'deprecated',
])
```

### DecisionTypeSchema

The kind of decision record: architecture, product, domain, or technical.

```ts
DecisionTypeSchema = z.enum(['ADR', 'PDR', 'DDR', 'TDR'])
```

### FormatTypeEntrySchema

Documents one tag value format with a description and an example.

```ts
FormatTypeEntrySchema = z.strictObject({
  format: FormatTypeSchema,
  description: z.string(),
  example: z.string(),
})
```

### FormatTypeSchema

The value format a tag accepts — bare value, enum, quoted value, csv, number, or boolean flag.

```ts
FormatTypeSchema = z.enum(['value', 'enum', 'quoted-value', 'csv', 'number', 'flag'])
```

### FsmGraphSchema

A finite-state-machine graph — its initial state, terminal states, full state list, and the set of legal transitions between them.

```ts
FsmGraphSchema = z.strictObject({
  initialState: z.string(),
  terminalStates: z.array(z.string()),
  states: z.array(z.string()),
  transitions: z.array(FsmTransitionSchema),
})
```

### FsmTransitionSchema

One legal transition in an FSM graph — its \`from\`/\`to\` states and an optional human-readable description.

```ts
FsmTransitionSchema = z.strictObject({
  from: z.string(),
  to: z.string(),
  description: z.string().optional(),
})
```

### ProtectionLevelEntrySchema

Maps a protection level to the statuses it covers and what it permits — whether deliverables may be added and whether the level emits an advisory, unlock-suppressible warning on the commit path (PDR-006).

```ts
ProtectionLevelEntrySchema = z.strictObject({
  level: ProtectionLevelSchema,
  statuses: z.array(z.string()),
  meaning: z.string().optional(),
  canAddDeliverables: z.boolean(),
  unlockSuppressesWarning: z.boolean(),
})
```

### ProtectionLevelSchema

How strongly a pattern is protected against change at a given lifecycle stage.

```ts
ProtectionLevelSchema = z.enum(['none', 'scope', 'hard'])
```

### TagEntryKindSchema

The category a taxonomy tag belongs to.

```ts
TagEntryKindSchema = z.enum(['role', 'metadata', 'aggregation'])
```

### TagEntrySchema

One taxonomy tag entry — its kind, tag name, purpose, and the full set of optional documentation metadata (format, allowed values, default, example, aliases, and more).

```ts
TagEntrySchema = z.strictObject({
  kind: TagEntryKindSchema,
  tag: z.string(),
  purpose: z.string(),
  format: z.string().optional(),
  required: z.boolean().optional(),
  repeatable: z.boolean().optional(),
  values: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
  example: z.string().optional(),
  domain: z.string().optional(),
  priority: z.number().int().optional(),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  targetDoc: z.string().optional(),
})
```

### TagGroupEntrySchema

A named group of taxonomy tag entries.

```ts
TagGroupEntrySchema = z.strictObject({
  groupName: z.string(),
  entries: z.array(TagEntrySchema),
})
```

### ValidationRuleEntrySchema

One validation-rule entry — its id, description, severity, and the optional roles it applies to.

```ts
ValidationRuleEntrySchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  severity: ValidationRuleSeveritySchema,
  appliesToRoles: z.array(z.string()).optional(),
})
```

### ValidationRuleSeveritySchema

Severity assigned to a validation rule.

```ts
ValidationRuleSeveritySchema = z.enum(['error', 'warning'])
```

## HandoffRecord

### HandoffRecordSchema

Fragment shape for one pattern's session handoff summary — what was completed and in progress, the files modified, discoveries, blockers, and the recommended next session.

```ts
HandoffRecordSchema = z.strictObject({
  kind: z.literal('HandoffRecord'),
  pattern: z.string(),
  status: z.string().optional(),
  sessionType: HandoffSessionTypeSchema,
  completed: z.array(z.string()),
  inProgress: z.array(z.string()),
  filesModified: z.array(z.string()),
  discovered: z.array(z.string()),
  blockers: z.array(z.string()),
  nextSession: z.string(),
})
```

## OperationalInsightsSupporting

### BlockingEntrySchema

One blocking entry in the overview — a blocked pattern, its status, and the patterns blocking it.

```ts
BlockingEntrySchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  blockedBy: z.array(z.string()),
})
```

### GapsByTagSchema

Per-tag annotation gaps — maps each tag to the list of source files missing that tag.

```ts
GapsByTagSchema = z.record(z.string(), z.array(z.string()))
```

### GeneratedViewEntrySchema

One entry in the generated-views index — the doc type it produces, a typed \`architect_documentation\` MCP call hint, and a short summary.

```ts
GeneratedViewEntrySchema = z.strictObject({
  docType: z.string(),
  verb: z.string(),
  summary: z.string(),
})
```

### OrientationReferenceSchema

One orientation reference in the overview's "start here" tier — a generated doc the agent should read first (decisions, taxonomy, validation rules, business rules, API reference), a typed \`architect_documentation\` MCP call hint that emits it, and its display title. Derived from the documentation-type registry so the list never drifts from the supported set.

```ts
OrientationReferenceSchema = z.strictObject({
  docType: z.string(),
  verb: z.string(),
  title: z.string(),
})
```

### OverviewArchitectureSchema

The high-level architecture glimpse rendered in \`overview\`. \`packageChart\` is a coarse package-level context map shown at every non-\`name-only\` disclosure; \`contextMap\` is the richer bounded-context map (identical grouping to \`docs-live/ARCHITECTURE.md\`) shown only at \`full\`. Both are pre-rendered Mermaid (built at projection time, per ADR-005 codec/renderer separation — the renderer cannot reach the grouping machinery behind the renderer boundary). \`pointer\` is a one-line "explore via the API, not grep" hint.

```ts
OverviewArchitectureSchema = z.strictObject({
  packageChart: MermaidBlockSchema,
  packageCount: z.number().int().nonnegative(),
  contextMap: MermaidBlockSchema.optional(),
  contextNodeCount: z.number().int().nonnegative().optional(),
  pointer: z.string(),
})
```

### OverviewOrientationSchema

The overview's "start here" orientation block — the high-signal generated docs to read first, a one-line note on the typed \`disclosure\` input field, and the count + sample of roadmap patterns whose dependencies are all satisfied (the "safe to start" actionable set, the complement of BLOCKING). Rendered at \`summary-with-references\` and \`full\` richness so a cold-start agent is steered toward orientation + workable items rather than only the BLOCKING wall.

```ts
OverviewOrientationSchema = z.strictObject({
  references: z.array(OrientationReferenceSchema),
  disclosureHint: z.string(),
  startableCount: z.number().int().nonnegative(),
  startableSample: z.array(z.string()),
})
```

### OverviewProgressSchema

Delivery progress totals for the overview — overall pattern count broken down by lifecycle bucket (completed, active, planned, candidate) plus the completed percentage.

```ts
OverviewProgressSchema = z.strictObject({
  total: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
})
```

### RequirementEntrySchema

One requirement entry in a requirement digest — the owning pattern and route id, its status, a rich-text description (block list), and the resolved test files.

```ts
RequirementEntrySchema = z.strictObject({
  pattern: z.string(),
  ownerRouteId: z.string().min(1),
  status: z.string().optional(),
  description: z.array(BlockSchema),
  testFiles: z.array(z.string()),
})
```

### RoleCountSchema

One role-distribution entry — a canonical \`@architect-role\` value and how many patterns carry it. Sourced from the precomputed graph, not re-derived.

```ts
RoleCountSchema = z.strictObject({
  role: z.string(),
  count: z.number().int().nonnegative(),
})
```

### TagValueCountSchema

A single tag value paired with the number of patterns that carry it.

```ts
TagValueCountSchema = z.strictObject({
  value: z.string(),
  count: z.number().int().nonnegative(),
})
```

## OrphanPatternList

### OrphanPatternEntrySchema

One orphan pattern entry — its name, optional status, and source file.

```ts
OrphanPatternEntrySchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  file: z.string(),
})
```

### OrphanPatternListSchema

A list of patterns that have no incoming or outgoing relationships.

```ts
OrphanPatternListSchema = z.strictObject({
  kind: z.literal('OrphanPatternList'),
  items: z.array(OrphanPatternEntrySchema),
})
```

## OverviewDigest

### OverviewDigestSchema

Fragment shape for the delivery overview — progress totals, blocking patterns, an optional "start here" orientation block (orientation doc references + the safe-to-start roadmap set), an optional role distribution, an optional high-level architecture glimpse, an optional generated-views index, and optional CLI hints.

```ts
OverviewDigestSchema = z.strictObject({
  kind: z.literal('OverviewDigest'),
  progress: OverviewProgressSchema,
  blocking: z.array(BlockingEntrySchema),
  orientation: OverviewOrientationSchema.optional(),
  roleDistribution: z.array(RoleCountSchema).optional(),
  architecture: OverviewArchitectureSchema.optional(),
  generatedViews: z.array(GeneratedViewEntrySchema).optional(),
  cliHints: z.array(z.string()).optional(),
})
```

## PatternCatalog

### PatternCatalogFilterSchema

The filter criteria applied to a pattern catalog — status, role, parent, and package narrowing plus the names-only and count-only output modes.

```ts
PatternCatalogFilterSchema = z.strictObject({
  status: z.string().optional(),
  role: z.string().optional(),
  parent: z.string().optional(),
  package: z.string().optional(),
  namesOnly: z.boolean(),
  count: z.boolean(),
})
```

### PatternCatalogSchema

A filtered catalog of pattern summaries — the applied filters, the total count, the names-only list, and the full summary items.

```ts
PatternCatalogSchema = z.strictObject({
  kind: z.literal('PatternCatalog'),
  filters: PatternCatalogFilterSchema,
  count: z.number().int().nonnegative(),
  names: z.array(z.string()),
  items: z.array(PatternSummarySchema),
})
```

## PatternDetail

### PatternDetailSchema

The expanded per-pattern bundle — the pattern identity plus description, open questions, deliverables, relationships, hierarchy, embedded rules, stubs, and the deliverable manifest.

```ts
PatternDetailSchema = PatternIdentitySchema.extend({
  kind: z.literal('PatternDetail'),
  // Classification axes beyond role (which PatternIdentity already carries):
  // bounded-context, product-area, and the hierarchy level. The source
  // ExtractedPattern carries all three; surfacing them here lets `g.pattern('<Name>')`
  // / `architect_pattern` answer the full role · bounded-context · layer ·
  // product-area classification in one call.
  boundedContext: z.string().optional(),
  productArea: z.string().optional(),
  level: z.string().optional(),
  description: z.string().optional(),
  // True when `description` is a head (first-sentence / Problem+Solution summary) and the
  // source directive carries more design prose that was not projected — a signaled boundary
  // (mirrors the dep-tree `truncated` precedent) so consumers know to read the source for full
  // context rather than silently treating the head as the whole directive.
  descriptionTruncated: z.boolean().optional(),
  openQuestions: z.array(z.string()).optional(),
  deliverables: z.array(EmbeddedDeliverableSchema),
  relationships: PatternRelationshipsSchema,
  hierarchy: PatternHierarchySchema.optional(),
  rules: z.array(EmbeddedRuleRefSchema),
  stubs: z.array(StubRefSchema),
  deliverableManifest: EmbeddedDeliverableManifestSchema.optional(),
})
```

## PatternRelationsSupporting

### DependencyContextNode

One node in a recursive dependency-context forest. Defined as an interface so the Zod schema can reference it for its self-referential \`children\` type. The focal pattern is the root of both forests (named by the fragment's \`focal\` field) and is never represented as a node, so there is no per-node focal flag.

```ts
interface DependencyContextNode {
  /** The pattern name this node represents. */
  name: string;
  /** The pattern's lifecycle status, when known. */
  status?: string | undefined;
  /** Whether traversal stopped here because the depth limit was reached and
   * unexpanded edges remain in this direction. */
  truncated: boolean;
  /** This node's direct children in the same direction. */
  children: DependencyContextNode[];
}
```

#### Properties

| Property  | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| name      | The pattern name this node represents.                                                                            |
| status    | The pattern's lifecycle status, when known.                                                                       |
| truncated | Whether traversal stopped here because the depth limit was reached and unexpanded edges remain in this direction. |
| children  | This node's direct children in the same direction.                                                                |

### DependencyContextNodeSchema

The recursive Zod schema for a dependency-context node, validating the shape described by DependencyContextNode with lazily-evaluated children.

```ts
const DependencyContextNodeSchema: z.ZodType<DependencyContextNode>;
```

### DependencyRelationKindSchema

The kind of relation a dependency edge represents.

```ts
DependencyRelationKindSchema = z.enum([
  'depends-on',
  'uses',
  'enables',
  'implements',
  'extends',
  'see-also',
  'api-ref',
])
```

### EmbeddedDeliverableManifestSchema

A deliverable manifest embedded in a pattern detail — the manifest without its \`kind\` discriminator, with its items replaced by embedded deliverables.

```ts
EmbeddedDeliverableManifestSchema = DeliverableManifestSchema.omit({
  kind: true,
}).extend({
  items: z.array(EmbeddedDeliverableSchema),
})
```

### EmbeddedDeliverableSchema

A deliverable embedded in a pattern detail — the deliverable shape without its standalone \`kind\` discriminator.

```ts
EmbeddedDeliverableSchema = DeliverableSchema.omit({ kind: true })
```

### EmbeddedRuleRefSchema

A business rule embedded in a pattern detail — its name, invariant, rationale, the scenarios that verify it, and their count.

```ts
EmbeddedRuleRefSchema = z.strictObject({
  name: z.string(),
  invariant: z.string().optional(),
  rationale: z.string().optional(),
  verifiedBy: z.array(z.string()),
  scenarioCount: z.number().int().nonnegative(),
})
```

### ImplementationRefSchema

A reference to an artifact that implements a pattern — its name, file, and an optional description.

```ts
ImplementationRefSchema = z.strictObject({
  name: z.string(),
  file: z.string(),
  description: z.string().optional(),
})
```

### PatternHierarchySchema

A pattern's place in the hierarchy — its level, optional parent, and member patterns.

```ts
PatternHierarchySchema = z.strictObject({
  level: z.string().optional(),
  parent: z.string().optional(),
  members: z.array(z.string()),
})
```

### PatternRelationshipsSchema

The full set of relationship edges for a pattern — forward and reverse dependency, usage, enablement, and implementation links, plus extension, see-also, and API references.

```ts
PatternRelationshipsSchema = z.strictObject({
  dependsOn: z.array(z.string()),
  enables: z.array(z.string()),
  uses: z.array(z.string()),
  usedBy: z.array(z.string()),
  implementsPatterns: z.array(z.string()),
  implementedBy: z.array(ImplementationRefSchema),
  extendsPattern: z.string().optional(),
  extendedBy: z.array(z.string()),
  seeAlso: z.array(z.string()),
  apiRef: z.array(z.string()),
})
```

### PatternSourceSchema

Whether a pattern originates from TypeScript source or a Gherkin feature.

```ts
PatternSourceSchema = z.enum(['typescript', 'gherkin'])
```

### StubRefSchema

A reference to a generated stub — its stub file, its intended target path, and the declaration name.

```ts
StubRefSchema = z.strictObject({
  stubFile: z.string(),
  targetPath: z.string(),
  name: z.string(),
})
```

## PatternSummary

### PatternIdentitySchema

The pattern summary without its \`kind\` discriminator — the identity fields a detail projection extends.

```ts
PatternIdentitySchema = PatternSummarySchema.omit({ kind: true })
```

### PatternSummary

The pattern summary without its \`kind\` discriminator — the identity fields a detail projection extends.

```ts
type PatternSummary = z.infer<typeof PatternSummarySchema>;
```

### PatternSummarySchema

The canonical short summary of a pattern — its name, status, maturity, role, source file and origin, and owning package. Reused by catalog and detail projections.

```ts
PatternSummarySchema = z.strictObject({
  kind: z.literal('PatternSummary'),
  patternName: z.string(),
  status: z.string().optional(),
  maturity: MaturitySchema.optional(),
  role: z.string(),
  file: z.string(),
  source: PatternSourceSchema,
  package: z.string().optional(),
})
```

## PrChangeReview

### PrChangeReviewSchema

A PR change-review fragment — the branch, its changed files, the patterns those changes affect, and reviewer recommendation blocks.

```ts
PrChangeReviewSchema = z.strictObject({
  kind: z.literal('PrChangeReview'),
  branch: z.string(),
  changedFiles: z.array(z.string()),
  affectedPatterns: z.array(z.string()),
  recommendations: z.array(BlockSchema),
})
```

## ProjectConfigSnapshot

### ProjectConfigSnapshotSchema

A snapshot of project configuration and graph metrics — base directory, config path, source globs, build time, and pattern/role counts.

```ts
ProjectConfigSnapshotSchema = z.strictObject({
  kind: z.literal('ProjectConfigSnapshot'),
  baseDir: z.string(),
  configPath: z.string(),
  sourceGlobs: z.array(z.string()),
  buildTimeMs: z.number().int().nonnegative(),
  patternCount: z.number().int().nonnegative(),
  roleCount: z.number().int().nonnegative(),
  projectName: z.string().optional(),
})
```

## RequirementDigest

### RequirementDigestSchema

Fragment shape grouping product requirements for one product area — the area label, its requirement entries, and the business-rule references that govern them.

```ts
RequirementDigestSchema = z.strictObject({
  kind: z.literal('RequirementDigest'),
  productArea: z.string(),
  requirements: z.array(RequirementEntrySchema),
  businessRuleReferences: z.array(BusinessRuleReferenceSchema),
})
```

### REQUIREMENTS_ALL_AREAS_LABEL

Display label for the aggregate area covering every product area.

```ts
REQUIREMENTS_ALL_AREAS_LABEL = 'All Product Areas'
```

### REQUIREMENTS_EXECUTABLE_AREA_LABEL

Display label for requirements whose value transfer is complete (backed by executable specs).

```ts
REQUIREMENTS_EXECUTABLE_AREA_LABEL = 'Implemented (Value Transfer Complete)'
```

### REQUIREMENTS_SPECS_AREA_LABEL

Display label for requirements still pending implementation (spec-only).

```ts
REQUIREMENTS_SPECS_AREA_LABEL = 'Specs (Pending Implementation)'
```

## RoadmapTimeline

### RoadmapTimelineSchema

A roadmap view — one of \`roadmap\`, \`milestones\`, or \`current\` — over a flat, deterministically ordered set of pattern summaries plus their status counts.

```ts
RoadmapTimelineSchema = z.strictObject({
  kind: z.literal('RoadmapTimeline'),
  view: z.enum(['roadmap', 'milestones', 'current']),
  patterns: z.array(PatternSummarySchema),
  counts: StatusCountsSchema,
})
```

## RoleProfile

### RoleProfileSchema

Fragment shape for one configured role — its tag, domain, optional sort priority, the count of patterns carrying it, an optional description, and example pattern names.

```ts
RoleProfileSchema = z.strictObject({
  kind: z.literal('RoleProfile'),
  tag: z.string(),
  domain: z.string(),
  priority: z.number().int().optional(),
  count: z.number().int().nonnegative(),
  description: z.string().optional(),
  examples: z.array(z.string()),
})
```

## RoleProfileCollection

### RoleProfileCollectionSchema

Fragment shape wrapping the ordered catalog of role profiles.

```ts
RoleProfileCollectionSchema = z.strictObject({
  kind: z.literal('RoleProfileCollection'),
  items: z.array(RoleProfileSchema),
})
```

## ScopeReadinessCheck

### ScopeReadinessCheckSchema

Fragment shape for a single readiness criterion and its outcome — the check identifier and label, its severity, whether it passed, and optional detail text.

```ts
ScopeReadinessCheckSchema = z.strictObject({
  kind: z.literal('ScopeReadinessCheck'),
  checkId: z.string(),
  label: z.string(),
  severity: CheckSeveritySchema,
  passed: z.boolean(),
  details: z.string().optional(),
})
```

## ScopeReadinessReport

### ScopeReadinessReportSchema

Fragment shape for a pattern's scope-readiness report — the session type being checked, the individual readiness checks, and the overall verdict.

```ts
ScopeReadinessReportSchema = z.strictObject({
  kind: z.literal('ScopeReadinessReport'),
  pattern: z.string(),
  sessionType: ScopeTypeSchema,
  checks: z.array(ScopeReadinessCheckSchema),
  verdict: ScopeVerdictSchema,
})
```

## SessionContextBundle

### SessionContextBundleSchema

Fragment shape bundling everything needed to open a session — the in-scope patterns and session type, per-pattern metadata, spec files, stubs, dependencies (own, shared, and consumers), architecture neighbors, deliverables, test files, and FSM context.

```ts
SessionContextBundleSchema = z.strictObject({
  kind: z.literal('SessionContextBundle'),
  patterns: z.array(z.string()),
  sessionType: SessionTypeSchema,
  metadata: z.array(PatternContextMetaSchema),
  specFiles: z.array(z.string()),
  stubs: z.array(StubRefSchema),
  dependencies: z.array(DepEntrySchema),
  sharedDependencies: z.array(DepEntrySchema),
  consumers: z.array(DepEntrySchema),
  architectureNeighbors: z.array(NeighborEntrySchema),
  deliverables: z.array(DeliverableSchema),
  fsm: FsmContextSchema.optional(),
  fsmByPattern: z.array(PatternFsmEntrySchema),
  testFiles: z.array(z.string()),
})
```

## SourceInventoryDigest

### SourceInventoryDigestSchema

Fragment shape grouping source-file inventory summaries into one digest.

```ts
SourceInventoryDigestSchema = z.strictObject({
  kind: z.literal('SourceInventoryDigest'),
  items: z.array(SourceInventoryEntrySchema),
})
```

## SourceInventoryEntry

### SourceInventoryEntrySchema

Fragment shape for one source-file category in the inventory — its type, the file count, an optional location pattern, and the matching files.

```ts
SourceInventoryEntrySchema = z.strictObject({
  kind: z.literal('SourceInventoryEntry'),
  type: z.string(),
  count: z.number().int().nonnegative(),
  locationPattern: z.string().optional(),
  files: z.array(z.string()),
})
```

## StatusDistribution

### StatusDistributionSchema

Pattern status breakdown — absolute counts paired with their percentages.

```ts
StatusDistributionSchema = z.strictObject({
  kind: z.literal('StatusDistribution'),
  counts: StatusCountsSchema,
  percentages: StatusPercentagesSchema,
})
```

## TagUsageEntry

### TagUsageEntrySchema

Fragment shape for one metadata tag's usage — the tag name, the count of patterns carrying it, and the counted distinct values (null when values are not enumerated).

```ts
TagUsageEntrySchema = z.strictObject({
  kind: z.literal('TagUsageEntry'),
  tag: z.string(),
  count: z.number().int().nonnegative(),
  values: z.array(TagValueCountSchema).nullable(),
})
```

## TagUsageMatrix

### TagUsageMatrixSchema

Fragment shape for tag usage across the pattern graph — the per-tag usage entries and the total pattern count they were computed over.

```ts
TagUsageMatrixSchema = z.strictObject({
  kind: z.literal('TagUsageMatrix'),
  tags: z.array(TagUsageEntrySchema),
  patternCount: z.number().int().nonnegative(),
})
```

## TaxonomyDigest

### TaxonomyDigestCountSummarySchema

Summarized tag counts by category (roles, metadata, aggregation) plus a total.

```ts
TaxonomyDigestCountSummarySchema = z.strictObject({
  roles: z.number().int().nonnegative(),
  metadata: z.number().int().nonnegative(),
  aggregation: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})
```

### TaxonomyDigestSchema

A digest of the tag taxonomy — grouped tag entries, the supported format types, and optional per-tag example overrides.

```ts
TaxonomyDigestSchema = z.strictObject({
  kind: z.literal('TaxonomyDigest'),
  tags: z.array(TagGroupEntrySchema),
  formatTypes: z.array(FormatTypeEntrySchema),
  exampleOverrides: z.record(z.string(), z.string()).optional(),
})
```

## TraceabilityMatrix

### TraceabilityMatrixSchema

A pattern-to-test traceability matrix carrying one trace row per pattern.

```ts
TraceabilityMatrixSchema = z.strictObject({
  kind: z.literal('TraceabilityMatrix'),
  rows: z.array(TraceRowSchema),
})
```

## UiRenderer

### renderUi

Renders a projection fragment or bundle into a UiDocument tree for the Studio desktop UI. Bundles render their root and merge in routed children; child links are rewritten to bundle anchors unless disabled via options.

```ts
renderUi = (input: ProjectionInput, options?: RenderUiOptions): object => {
  const resolvedOptions = resolveOptions(options);

  if (isBundle(input)) {
    return renderBundle(input, resolvedOptions);
  }

  return renderFragment(input, resolvedOptions);
}
```

### UiDocument

A renderable document tree consumed by the Studio desktop UI's BlockRenderer — the fragment kind, a heading, ordered sections, and optional routed children keyed by bundle child path.

```ts
interface UiDocument {
  /** The originating fragment's kind discriminant. */
  kind: Fragment['kind'];
  /** The document's top-level heading. */
  heading: string;
  /** The ordered sections that make up the document body. */
  sections: UiSection[];
  /** Optional routed child documents, keyed by bundle child path. */
  children?: Record<string, UiDocument>;
}
```

#### Properties

| Property | Description                                                  |
| -------- | ------------------------------------------------------------ |
| kind     | The originating fragment's kind discriminant.                |
| heading  | The document's top-level heading.                            |
| sections | The ordered sections that make up the document body.         |
| children | Optional routed child documents, keyed by bundle child path. |

### UiSection

One titled section of a UiDocument — a stable id, a display title, and the Blocks the section renders.

```ts
interface UiSection {
  /** Stable slug identifying the section (used for anchors and ordering). */
  id: string;
  /** Human-readable section title. */
  title: string;
  /** The blocks rendered within the section. */
  blocks: Block[];
}
```

#### Properties

| Property | Description                                                          |
| -------- | -------------------------------------------------------------------- |
| id       | Stable slug identifying the section (used for anchors and ordering). |
| title    | Human-readable section title.                                        |
| blocks   | The blocks rendered within the section.                              |

## ValidationRuleDigest

### ValidationRuleDigestSchema

A digest of validation governance — the rule entries, the lifecycle FSM graph, and the protection levels that gate pattern changes.

```ts
ValidationRuleDigestSchema = z.strictObject({
  kind: z.literal('ValidationRuleDigest'),
  rules: z.array(ValidationRuleEntrySchema),
  fsm: FsmGraphSchema,
  protectionLevels: z.array(ProtectionLevelEntrySchema),
})
```

---

[← Back to API Reference](../API-REFERENCE.md)
