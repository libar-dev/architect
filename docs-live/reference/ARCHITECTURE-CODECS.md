# Available Codecs Reference

**Purpose:** Reference document: Available Codecs Reference
**Detail Level:** Full reference

---

## ValidationRulesCodec

Transforms MasterDataset into a RenderableDocument for Process Guard validation
rules reference. Generates VALIDATION-RULES.md and detail files (validation/\*.md).

**Purpose:** Process Guard validation rules reference with FSM diagrams and protection level matrix.

**Output Files:** `VALIDATION-RULES.md` (main reference), `validation/<category>.md` (category details)

### When to Use

- When generating validation rules reference documentation
- When creating FSM state transition diagrams
- When building protection level reference files

### Factory Pattern

Use `createValidationRulesCodec(options)` to create a configured codec:

Or use the default export for standard behavior:

| Option                  | Type    | Default | Description                      |
| ----------------------- | ------- | ------- | -------------------------------- |
| includeFSMDiagram       | boolean | true    | Include FSM state diagram        |
| includeCLIUsage         | boolean | true    | Include CLI usage section        |
| includeEscapeHatches    | boolean | true    | Include escape hatches section   |
| includeProtectionMatrix | boolean | true    | Include protection levels matrix |

```typescript
const codec = createValidationRulesCodec({ includeFSMDiagram: false });
const doc = codec.decode(dataset);
```

```typescript
const doc = ValidationRulesCodec.decode(dataset);
```

---

## RoadmapDocumentCodec

**Purpose:** Development roadmap organized by phase with progress tracking.

**Output Files:** `ROADMAP.md` (main roadmap), `phases/phase-<N>-<name>.md` (phase details)

| Option              | Type                     | Default | Description                         |
| ------------------- | ------------------------ | ------- | ----------------------------------- |
| generateDetailFiles | boolean                  | true    | Create phase detail files           |
| filterStatus        | NormalizedStatusFilter[] | []      | Filter by status                    |
| includeProcess      | boolean                  | true    | Show quarter, effort, team metadata |
| includeDeliverables | boolean                  | true    | List deliverables per phase         |
| filterPhases        | number[]                 | []      | Filter to specific phases           |

---

## CompletedMilestonesCodec

**Purpose:** Historical record of completed work organized by quarter.

**Output Files:** `COMPLETED-MILESTONES.md` (summary), `milestones/<quarter>.md` (quarter details)

### When to Use

- When documenting project history and completed phases
- When generating quarterly achievement summaries
- When tracking velocity by quarter

---

## CurrentWorkCodec

**Purpose:** Active development work currently in progress.

**Output Files:** `CURRENT-WORK.md` (summary), `current/phase-<N>-<name>.md` (active phase details)

### When to Use

- When monitoring active development across all in-progress phases
- When generating sprint/session status dashboards
- When checking which patterns are currently being worked on

---

## TaxonomyDocumentCodec

Transforms MasterDataset into a RenderableDocument for taxonomy reference output.
Generates TAXONOMY.md and detail files (taxonomy/\*.md).

**Purpose:** Taxonomy reference documentation with tag definitions, preset comparison, and format type reference.

**Output Files:** `TAXONOMY.md` (main reference), `taxonomy/<domain>.md` (domain details)

### When to Use

- When generating the taxonomy reference documentation (TAXONOMY.md)
- When creating tag reference files for progressive disclosure
- When building taxonomy overview reports

### Factory Pattern

Use `createTaxonomyCodec(options)` to create a configured codec:

Or use the default export for standard behavior:

| Option             | Type    | Default | Description                     |
| ------------------ | ------- | ------- | ------------------------------- |
| includePresets     | boolean | true    | Include preset comparison table |
| includeFormatTypes | boolean | true    | Include format type reference   |
| includeArchDiagram | boolean | true    | Include architecture diagram    |
| groupByDomain      | boolean | true    | Group metadata tags by domain   |

```typescript
const codec = createTaxonomyCodec({ generateDetailFiles: false });
const doc = codec.decode(dataset);
```

```typescript
const doc = TaxonomyDocumentCodec.decode(dataset);
```

---

## SessionContextCodec

**Purpose:** Current session context for AI agents and developers.

**Output Files:** `SESSION-CONTEXT.md` (session status), `sessions/phase-<N>-<name>.md` (incomplete phase details)

### When to Use

- When starting a new implementation session and need to see active work status
- When generating compact context for AI agent consumption (\_claude-md/ output)
- When checking incomplete phases and their deliverable progress

---

## RemainingWorkCodec

**Purpose:** Aggregate view of all incomplete work across phases.

**Output Files:** `REMAINING-WORK.md` (summary), `remaining/phase-<N>-<name>.md` (phase details)

| Option                | Type                                           | Default | Description                   |
| --------------------- | ---------------------------------------------- | ------- | ----------------------------- |
| includeIncomplete     | boolean                                        | true    | Include planned items         |
| includeBlocked        | boolean                                        | true    | Show blocked items analysis   |
| includeNextActionable | boolean                                        | true    | Next actionable items section |
| maxNextActionable     | number                                         | 5       | Max items in next actionable  |
| sortBy                | "phase" \| "priority" \| "effort" \| "quarter" | "phase" | Sort order                    |
| groupPlannedBy        | "quarter" \| "priority" \| "level" \| "none"   | "none"  | Group planned items           |

---

## RequirementsDocumentCodec

Transforms MasterDataset into RenderableDocument for PRD/requirements output.
Generates PRODUCT-REQUIREMENTS.md and detail files (requirements/\*.md).

**Purpose:** Product requirements documentation grouped by product area or user role.

**Output Files:** `PRODUCT-REQUIREMENTS.md` (main index), `requirements/<area-slug>.md` (area details)

### When to Use

- When generating product requirements documentation
- When creating stakeholder-facing PRD documents
- When organizing requirements by user role or product area

### Factory Pattern

Use `createRequirementsCodec(options)` for custom options:

| Option               | Type                                     | Default        | Description                      |
| -------------------- | ---------------------------------------- | -------------- | -------------------------------- |
| generateDetailFiles  | boolean                                  | true           | Create product area detail files |
| groupBy              | "product-area" \| "user-role" \| "phase" | "product-area" | Primary grouping                 |
| filterStatus         | NormalizedStatusFilter[]                 | []             | Filter by status (empty = all)   |
| includeScenarioSteps | boolean                                  | true           | Show Given/When/Then steps       |
| includeBusinessValue | boolean                                  | true           | Display business value metadata  |
| includeBusinessRules | boolean                                  | true           | Show Gherkin Rule: sections      |

```typescript
const codec = createRequirementsCodec({ groupBy: 'user-role' });
const doc = codec.decode(dataset);
```

---

## ChangelogCodec

**Purpose:** Keep a Changelog format changelog grouped by release version.

**Output Files:** `CHANGELOG.md`

| Option            | Type                   | Default | Description                       |
| ----------------- | ---------------------- | ------- | --------------------------------- |
| includeUnreleased | boolean                | true    | Include unreleased section        |
| includeLinks      | boolean                | true    | Include links                     |
| categoryMapping   | Record<string, string> | {}      | Map categories to changelog types |

---

## TraceabilityCodec

**Purpose:** Timeline to behavior file coverage report.

**Output Files:** `TRACEABILITY.md`

### When to Use

- When auditing which timeline patterns have associated behavior specifications
- When checking feature file coverage across roadmap phases
- When identifying patterns missing executable specs

---

## OverviewCodec

**Purpose:** Project architecture and status overview.

**Output Files:** `OVERVIEW.md`

### When to Use

- When generating a high-level project dashboard with architecture summary
- When providing stakeholder-facing status reports
- When combining completion stats with architecture context

---

## ReferenceDocumentCodec

A single codec factory that creates reference document codecs from
configuration objects. Convention content is sourced from
decision records tagged with @libar-docs-convention.

**Purpose:** Scoped reference documentation assembling four content layers (conventions, diagrams, shapes, behaviors) into a single document.

**Output Files:** Configured per-instance (e.g., `docs/REFERENCE-SAMPLE.md`, `_claude-md/architecture/reference-sample.md`)

### 4-Layer Composition (in order)

1. **Convention content** -- Extracted from `@libar-docs-convention`-tagged patterns (rules, invariants, tables)
2. **Scoped diagrams** -- Mermaid diagrams filtered by `archContext`, `archLayer`, `patterns`, or `include` tags
3. **TypeScript shapes** -- API surfaces from `shapeSources` globs or `shapeSelectors` (declaration-level filtering)
4. **Behavior content** -- Gherkin-sourced patterns from `behaviorCategories`

### Key Options (ReferenceDocConfig)

### DiagramScope.diagramType Values

### ShapeSelector Variants

### When to Use

- When generating reference documentation from convention-tagged decisions
- When creating scoped product area documents with live diagrams
- When creating both detailed (docs/) and summary (\_claude-md/) outputs
- When assembling multi-layer documents that combine conventions, diagrams, shapes, and behaviors

### Factory Pattern

| Option             | Type            | Description                                                  |
| ------------------ | --------------- | ------------------------------------------------------------ |
| conventionTags     | string[]        | Convention tag values to extract from decision records       |
| diagramScope       | DiagramScope    | Single diagram configuration                                 |
| diagramScopes      | DiagramScope[]  | Multiple diagrams (takes precedence over diagramScope)       |
| shapeSources       | string[]        | Glob patterns for TypeScript shape extraction                |
| shapeSelectors     | ShapeSelector[] | Fine-grained declaration-level shape filtering               |
| behaviorCategories | string[]        | Category tags for behavior pattern content                   |
| includeTags        | string[]        | Cross-cutting content routing via include tags               |
| preamble           | SectionBlock[]  | Static editorial sections prepended before generated content |
| productArea        | string          | Pre-filter all content sources to matching product area      |
| excludeSourcePaths | string[]        | Exclude patterns by source path prefix                       |

| Type            | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| graph (default) | Flowchart with subgraphs by archContext, custom node shapes    |
| sequenceDiagram | Sequence diagram with typed messages between participants      |
| stateDiagram-v2 | State diagram with transitions from dependsOn relationships    |
| C4Context       | C4 context diagram with boundaries, systems, and relationships |
| classDiagram    | Class diagram with archRole stereotypes and typed arrows       |

| Variant        | Example                                         | Behavior                    |
| -------------- | ----------------------------------------------- | --------------------------- |
| group only     | `{ group: "api-types" }`                        | Match shapes by group tag   |
| source + names | `{ source: "src/types.ts", names: ["Config"] }` | Named shapes from file      |
| source only    | `{ source: "src/path/*.ts" }`                   | All tagged shapes from glob |

```typescript
const codec = createReferenceCodec(config, { detailLevel: 'detailed' });
const doc = codec.decode(dataset);
```

---

## PrChangesCodec

Transforms MasterDataset into RenderableDocument for PR-scoped output.
Filters patterns by changed files and/or release version tags.

**Purpose:** PR-scoped view filtered by changed files or release version.

**Output Files:** `working/PR-CHANGES.md`

### When to Use

- When generating PR summaries filtered by changed files
- When creating release-scoped documentation for PR reviews
- When building CI/CD outputs focused on PR scope

### Factory Pattern

Use `createPrChangesCodec(options)` for custom options:

### Scope Filtering

PR Changes codec filters patterns by:

1. Changed files (matches against pattern.filePath)
2. Release version (matches against deliverable.release tags)

If both are specified, patterns must match at least one criterion.

```typescript
const codec = createPrChangesCodec({
  changedFiles: ['src/commands/order.ts'],
  releaseFilter: 'v1.0.0',
});
const doc = codec.decode(dataset);
```

---

## PlanningChecklistCodec

**Purpose:** Pre-planning questions and Definition of Done validation.

**Output Files:** `PLANNING-CHECKLIST.md`

### When to Use

- When starting a new implementation session and need pre-flight validation
- When generating Definition of Done checklists for active phases
- When checking readiness criteria before transitioning patterns to active

---

## SessionPlanCodec

**Purpose:** Implementation plans for coding sessions.

**Output Files:** `SESSION-PLAN.md`

### When to Use

- When generating a structured implementation plan for an active coding session
- When documenting planned deliverables and their execution order
- When creating session-scoped plans aligned with FSM transitions

---

## SessionFindingsCodec

**Purpose:** Retrospective discoveries for roadmap refinement.

**Output Files:** `SESSION-FINDINGS.md`

### When to Use

- When capturing session retrospective findings across all patterns
- When surfacing discovered gaps, improvements, risks, and learnings
- When refining roadmap priorities based on implementation discoveries

### Finding Sources

- `pattern.discoveredGaps` -- Gap findings
- `pattern.discoveredImprovements` -- Improvement suggestions
- `pattern.discoveredRisks` / `pattern.risk` -- Risk findings
- `pattern.discoveredLearnings` -- Learned insights

---

## PatternsDocumentCodec

Transforms MasterDataset into a RenderableDocument for pattern registry output.
Generates PATTERNS.md and category detail files (patterns/\*.md).

**Purpose:** Pattern registry with category-based organization.

**Output Files:** `PATTERNS.md` (main index), `patterns/<category>.md` (category details)

### When to Use

- When generating the pattern registry documentation (PATTERNS.md)
- When creating category-specific pattern detail files
- When building pattern overview reports with status tracking

### Factory Pattern

Use `createPatternsCodec(options)` to create a configured codec:

Or use the default export for standard behavior:

| Option                 | Type                                  | Default    | Description                                 |
| ---------------------- | ------------------------------------- | ---------- | ------------------------------------------- |
| generateDetailFiles    | boolean                               | true       | Create category detail files                |
| detailLevel            | "summary" \| "standard" \| "detailed" | "standard" | Output verbosity                            |
| includeDependencyGraph | boolean                               | true       | Render Mermaid dependency graph             |
| includeUseCases        | boolean                               | true       | Show use cases section                      |
| filterCategories       | string[]                              | []         | Filter to specific categories (empty = all) |

```typescript
const codec = createPatternsCodec({ generateDetailFiles: false });
const doc = codec.decode(dataset);
```

```typescript
const doc = PatternsDocumentCodec.decode(dataset);
```

---

## CompositeCodec

Assembles reference documents from multiple codec outputs by concatenating
RenderableDocument sections. Enables building documents composed from any
combination of existing codecs.

**Purpose:** Assembles documents from multiple child codecs into a single RenderableDocument.

**Output Files:** Configured per-instance (composes child codec outputs)

### When to Use

- When building reference docs from multiple codec outputs
- When composing session briefs from overview + current work + remaining work
- When referenceDocConfigs need content from arbitrary codecs

### Factory Pattern

Use the factory function with child codecs and options:

Or use `composeDocuments` directly at the document level:

```typescript
const codec = createCompositeCodec([OverviewCodec, CurrentWorkCodec, RemainingWorkCodec], {
  title: 'Session Brief',
});
const doc = codec.decode(dataset);
```

```typescript
const doc = composeDocuments([docA, docB], { title: 'Combined' });
```

---

## ClaudeModuleCodec

Transforms MasterDataset into RenderableDocuments for CLAUDE.md module generation.
Filters patterns with `claudeModule` tags and generates compact markdown modules
suitable for the `_claude-md/` directory structure.

**Purpose:** Generate CLAUDE.md modules from annotated behavior specs.

**Output Files:** One file per claude-module-tagged pattern at `{section}/{module}.md`

### Content Extraction

- Feature description → module introduction (Problem/Solution)
- Rule: blocks → H4 sections with invariant + rationale
- Scenario Outline Examples → decision tables
- Tables in Rule descriptions → preserved as-is

### Factory Pattern

Use `createClaudeModuleCodec(options)` for custom options:

```typescript
const codec = createClaudeModuleCodec({ detailLevel: 'detailed' });
const doc = codec.decode(dataset);
```

---

## BusinessRulesCodec

Transforms MasterDataset into a RenderableDocument for business rules output.
Generates BUSINESS-RULES.md organized by product area, phase, and feature.

**Purpose:** Business rules documentation organized by product area, phase, and feature. Extracts domain constraints from Gherkin Rule: blocks.

**Output Files:** `BUSINESS-RULES.md` (main index), `business-rules/<area-slug>.md` (area details)

### When to Use

- When generating business rules documentation for stakeholders
- When extracting domain constraints without implementation details
- When creating compliance or audit documentation from feature specs

### Information Architecture

### Progressive Disclosure

- **summary**: Statistics only (compact reference)
- **standard**: Above + all features with rules inline
- **detailed**: Full content including code examples and verification links

### Factory Pattern

Use `createBusinessRulesCodec(options)` to create a configured codec:

| Option               | Type                                       | Default             | Description                               |
| -------------------- | ------------------------------------------ | ------------------- | ----------------------------------------- |
| groupBy              | "domain" \| "phase" \| "domain-then-phase" | "domain-then-phase" | Primary grouping strategy                 |
| includeCodeExamples  | boolean                                    | false               | Include code examples from DocStrings     |
| includeTables        | boolean                                    | true                | Include markdown tables from descriptions |
| includeRationale     | boolean                                    | true                | Include rationale section per rule        |
| filterDomains        | string[]                                   | []                  | Filter by domain categories (empty = all) |
| filterPhases         | number[]                                   | []                  | Filter by phases (empty = all)            |
| onlyWithInvariants   | boolean                                    | false               | Show only rules with explicit invariants  |
| includeSource        | boolean                                    | true                | Include source feature file link          |
| includeVerifiedBy    | boolean                                    | true                | Include Verified by scenario links        |
| maxDescriptionLength | number                                     | 150                 | Max description length in standard mode   |
| excludeSourcePaths   | string[]                                   | []                  | Exclude patterns by source path prefix    |

```text
Product Area (Platform, DeliveryProcess)
  └── Phase (21, 15, etc.) or Release (v0.1.0 for DeliveryProcess)
       └── Feature (pattern name with description)
            └── Rules (inline with Invariant + Rationale)
```

```typescript
const codec = createBusinessRulesCodec({ detailLevel: 'summary' });
const doc = codec.decode(dataset);
```

---

## ArchitectureDocumentCodec

Transforms MasterDataset into a RenderableDocument containing
architecture diagrams (Mermaid) generated from source annotations.

**Purpose:** Architecture diagrams (Mermaid) generated from source annotations. Supports component and layered views.

**Output Files:** `ARCHITECTURE.md` (generated architecture diagrams with component inventory)

### When to Use

- When generating architecture diagrams from code annotations
- When visualizing bounded contexts and component relationships
- When creating layered architecture views (domain/application/infrastructure)

### Factory Pattern

Use `createArchitectureCodec(options)` to create a configured codec:

Or use the default export for standard behavior:

### Supported Diagram Types

- **component**: System overview with bounded context subgraphs
- **layered**: Components organized by architectural layer

| Option           | Type                     | Default     | Description                               |
| ---------------- | ------------------------ | ----------- | ----------------------------------------- |
| diagramType      | "component" \| "layered" | "component" | Type of diagram to generate               |
| includeInventory | boolean                  | true        | Include component inventory table         |
| includeLegend    | boolean                  | true        | Include legend for arrow styles           |
| filterContexts   | string[]                 | []          | Filter to specific contexts (empty = all) |

```typescript
const codec = createArchitectureCodec({ diagramType: 'component' });
const doc = codec.decode(dataset);
```

```typescript
const doc = ArchitectureDocumentCodec.decode(dataset);
```

---

## AdrDocumentCodec

Transforms MasterDataset into RenderableDocument for Architecture Decision Records.
Extracts ADRs from patterns with `@libar-docs-adr` tags.

**Purpose:** Architecture Decision Records extracted from patterns with @libar-docs-adr tags.

**Output Files:** `DECISIONS.md` (ADR index), `decisions/<category-slug>.md` (category details)

### When to Use

- When generating Architecture Decision Record documentation
- When extracting ADRs from feature files with structured annotations
- When building custom ADR reports with configurable content sections

### Factory Pattern

Use `createAdrCodec(options)` for custom options:

### ADR Content

ADR content is parsed from feature file descriptions:

- **Context**: Problem background and constraints
- **Decision**: The chosen solution
- **Consequences**: Positive and negative outcomes

```typescript
const codec = createAdrCodec({
  groupBy: 'phase',
  includeContext: true,
  includeDecision: true,
  includeConsequences: false,
});
const doc = codec.decode(dataset);
```

---
