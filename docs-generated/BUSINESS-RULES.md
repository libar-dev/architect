# Business Rules

**Purpose:** Domain constraints and invariants extracted from feature files
**Detail Level:** standard

---

**Domain constraints and invariants extracted from feature specifications. 558 rules from 118 features across 15 product areas.**

---

## API / Uncategorized

### ArchQueriesTest

#### Neighborhood and comparison views



#### Taxonomy discovery via tags and sources



#### Coverage analysis reports annotation completeness



*[arch-queries.feature](tests/features/api/architecture-queries/arch-queries.feature)*

### ContextAssemblerTests

*Tests for assembleContext(), buildDepTree(), buildFileReadingList(), and*

#### assembleContext produces session-tailored context bundles



#### buildDepTree walks dependency chains with cycle detection



#### buildOverview provides executive project summary



#### buildFileReadingList returns paths by relevance



*[context-assembler.feature](tests/features/api/context-assembly/context-assembler.feature)*

### ContextFormatterTests

*Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),*

#### formatContextBundle renders section markers



#### formatDepTree renders indented tree



#### formatOverview renders progress summary



#### formatFileReadingList renders categorized file paths



*[context-formatter.feature](tests/features/api/context-assembly/context-formatter.feature)*

### FuzzyMatchTests

*Validates tiered fuzzy matching: exact > prefix > substring > Levenshtein.*

#### Fuzzy matching uses tiered scoring



#### findBestMatch returns single suggestion



#### Levenshtein distance computation



*[fuzzy-match.feature](tests/features/api/output-shaping/fuzzy-match.feature)*

### HandoffGeneratorTests

*Multi-session work loses critical state between sessions when handoff*

#### Handoff generates compact session state summary



#### Formatter produces structured text output



*[handoff-generator.feature](tests/features/api/session-support/handoff-generator.feature)*

### OutputPipelineTests

*Validates the output pipeline transforms: summarization, modifiers,*

#### Output modifiers apply with correct precedence



#### Modifier conflicts are rejected



#### List filters compose via AND logic



#### Empty stripping removes noise



*[output-pipeline.feature](tests/features/api/output-shaping/output-pipeline.feature)*

### PatternSummarizeTests

*Validates that summarizePattern() projects ExtractedPattern (~3.5KB) to*

#### summarizePattern projects to compact summary



#### summarizePatterns batch processes arrays



*[summarize.feature](tests/features/api/output-shaping/summarize.feature)*

### ProcessStateAPITesting

*- Markdown generation is not ideal for programmatic access*

#### Status queries return correct patterns



#### Phase queries return correct phase data



#### FSM queries expose transition validation



#### Pattern queries find and retrieve pattern data



#### Timeline queries group patterns by time



*[process-state-api.feature](tests/features/api/process-state-api.feature)*

### ScopeValidatorTests

*Starting an implementation or design session without checking prerequisites*

#### Implementation scope validation checks all prerequisites



#### Design scope validation checks dependency stubs



#### Formatter produces structured text output



*[scope-validator.feature](tests/features/api/session-support/scope-validator.feature)*

### StubResolverTests

*Design session stubs need structured discovery and resolution*

#### Stubs are identified by path or target metadata



#### Stubs are resolved against the filesystem



#### Decision items are extracted from descriptions



#### PDR references are found across patterns



*[stub-resolver.feature](tests/features/api/stub-integration/stub-resolver.feature)*

### StubTaxonomyTagTests

*Stub metadata (target path, design session) was stored as plain text*

#### Taxonomy tags are registered in the registry



#### Tags are part of the stub metadata group



*[taxonomy-tags.feature](tests/features/api/stub-integration/taxonomy-tags.feature)*

---

## Architecture / Uncategorized

### ArchGeneratorRegistration

*I want an architecture generator registered in the generator registry*

#### Architecture generator is registered in the registry

The architecture generator must be registered like other built-in
    generators so it can be invoked via CLI.



#### Architecture generator produces component diagram by default

Running the architecture generator without options produces
    a component diagram (bounded context view).



#### Architecture generator supports diagram type options

The generator accepts options to specify diagram type
    (component or layered).



#### Architecture generator supports context filtering

The generator can filter to specific bounded contexts
    for focused diagram output.



*[generator-registration.feature](tests/features/behavior/architecture-diagrams/generator-registration.feature)*

### ArchIndexDataset

*As a documentation generator*

#### archIndex groups patterns by arch-role

The archIndex.byRole map groups patterns by their architectural role
    (command-handler, projection, saga, etc.) for efficient lookup.



#### archIndex groups patterns by arch-context

The archIndex.byContext map groups patterns by bounded context
    for subgraph rendering in component diagrams.



#### archIndex groups patterns by arch-layer

The archIndex.byLayer map groups patterns by architectural layer
    (domain, application, infrastructure) for layered diagram rendering.



#### archIndex.all contains all patterns with any arch tag

The archIndex.all array contains all patterns that have at least
    one arch tag (role, context, or layer).



#### Patterns without arch tags are excluded from archIndex

Patterns that have no arch-role, arch-context, or arch-layer are
    not included in the archIndex at all.



*[arch-index.feature](tests/features/behavior/architecture-diagrams/arch-index.feature)*

### ArchTagExtraction

*As a documentation generator*

#### arch-role tag is defined in the registry

Architecture roles classify components for diagram rendering.



#### arch-context tag is defined in the registry

Context tags group components into bounded context subgraphs.



#### arch-layer tag is defined in the registry

Layer tags enable layered architecture diagrams.



#### AST parser extracts arch-role from TypeScript annotations

The AST parser must extract arch-role alongside other pattern metadata.



#### AST parser extracts arch-context from TypeScript annotations

Context values are free-form strings naming the bounded context.



#### AST parser extracts arch-layer from TypeScript annotations

Layer tags classify components by architectural layer.



#### AST parser handles multiple arch tags together

Components often have role + context + layer together.



#### Missing arch tags yield undefined values

Components without arch tags should have undefined (not null or empty).



*[arch-tag-extraction.feature](tests/features/behavior/architecture-diagrams/arch-tag-extraction.feature)*

### ComponentDiagramGeneration

*As a documentation generator*

#### Component diagrams group patterns by bounded context

Patterns with arch-context are grouped into Mermaid subgraphs.



#### Context-less patterns go to Shared Infrastructure

Patterns without arch-context are grouped into a
    "Shared Infrastructure" subgraph.



#### Relationship types render with distinct arrow styles

Arrow styles follow UML conventions:
    - uses: solid arrow (-->)
    - depends-on: dashed arrow (-.->)
    - implements: dotted arrow (..->)
    - extends: open arrow (-->>)



#### Arrows only connect annotated components

Relationships pointing to non-annotated patterns
    are not rendered (target would not exist in diagram).



#### Component diagram includes summary section

The generated document starts with an overview section
    showing component counts and bounded context statistics.



#### Component diagram includes legend when enabled

The legend explains arrow style meanings for readers.



#### Component diagram includes inventory table when enabled

The inventory lists all components with their metadata.



#### Empty architecture data shows guidance message

If no patterns have architecture annotations,
    the document explains how to add them.



*[component-diagram.feature](tests/features/behavior/architecture-diagrams/component-diagram.feature)*

### LayeredDiagramGeneration

*As a documentation generator*

#### Layered diagrams group patterns by arch-layer

Patterns with arch-layer are grouped into Mermaid subgraphs.



#### Layer order is domain to infrastructure (top to bottom)

The layer subgraphs are rendered in Clean Architecture order:
    domain at top, then application, then infrastructure at bottom.



#### Context labels included in layered diagram nodes

Unlike component diagrams which group by context, layered diagrams
    include the context as a label in each node name.



#### Patterns without layer go to Other subgraph

Patterns that have arch-role or arch-context but no arch-layer
    are grouped into an "Other" subgraph.



#### Layered diagram includes summary section

The generated document starts with an overview section
    specific to layered architecture visualization.



*[layered-diagram.feature](tests/features/behavior/architecture-diagrams/layered-diagram.feature)*

---

## Behavior / Phase 44

### KebabCaseSlugs

*As a documentation generator*

#### CamelCase names convert to kebab-case



#### Edge cases are handled correctly



#### Requirements include phase prefix



#### Phase slugs use kebab-case for names



*[kebab-case-slugs.feature](tests/features/behavior/kebab-case-slugs.feature)*

### RichContentHelpersTesting

*As a document codec author*

#### DocString parsing handles edge cases



#### DataTable rendering produces valid markdown



#### Scenario content rendering respects options



#### Business rule rendering handles descriptions



#### DocString content is dedented when parsed



*[rich-content-helpers.feature](tests/features/behavior/rich-content-helpers.feature)*

---

## Behavior / Uncategorized

### DescriptionHeaderNormalization

*Pattern descriptions should not create duplicate headers when rendered.*

#### Leading headers are stripped from pattern descriptions



#### Edge cases are handled correctly



#### stripLeadingHeaders removes only leading headers



*[description-headers.feature](tests/features/behavior/description-headers.feature)*

### ExtractSummary

*The extractSummary function transforms multi-line pattern descriptions into*

#### Single-line descriptions are returned as-is when complete



#### Multi-line descriptions are combined until sentence ending



#### Long descriptions are truncated at sentence or word boundaries



#### Tautological and header lines are skipped



#### Edge cases are handled gracefully



*[extract-summary.feature](tests/features/behavior/extract-summary.feature)*

### ImplementationLinkPathNormalization

*Links to implementation files in generated pattern documents should have*

#### Repository prefixes are stripped from implementation paths



#### All implementation links in a pattern are normalized



#### normalizeImplPath strips known prefixes



*[implementation-links.feature](tests/features/behavior/implementation-links.feature)*

### RemainingWorkSummaryAccuracy

*Summary totals in REMAINING-WORK.md must match the sum of phase table rows.*

#### Summary totals equal sum of phase table rows



#### Patterns without phases appear in Backlog row



#### Patterns without patternName are counted using id



#### All phases with incomplete patterns are shown



*[remaining-work-totals.feature](tests/features/behavior/remaining-work-totals.feature)*

---

## CLI / Uncategorized

### GenerateDocsCli

*Command-line interface for generating documentation from annotated TypeScript.*

#### CLI displays help and version information



#### CLI requires input patterns



#### CLI lists available generators



#### CLI generates documentation from source files



#### CLI rejects unknown options



*[generate-docs.feature](tests/features/cli/generate-docs.feature)*

### GenerateTagTaxonomyCli

*Command-line interface for generating TAG_TAXONOMY.md from tag registry configuration.*

#### CLI displays help and version information



#### CLI generates taxonomy at specified output path



#### CLI respects overwrite flag for existing files



#### Generated taxonomy contains expected sections



#### CLI warns about unknown flags



*[generate-tag-taxonomy.feature](tests/features/cli/generate-tag-taxonomy.feature)*

### LintPatternsCli

*Command-line interface for validating pattern annotation quality.*

#### CLI displays help and version information



#### CLI requires input patterns



#### Lint passes for valid patterns



#### Lint detects violations in incomplete patterns



#### CLI supports multiple output formats



#### Strict mode treats warnings as errors



*[lint-patterns.feature](tests/features/cli/lint-patterns.feature)*

### LintProcessCli

*Command-line interface for validating changes against delivery process rules.*

#### CLI displays help and version information



#### CLI requires git repository for validation



#### CLI validates file mode input



#### CLI handles no changes gracefully



#### CLI supports multiple output formats



#### CLI supports debug options



#### CLI warns about unknown flags



*[lint-process.feature](tests/features/cli/lint-process.feature)*

### ProcessApiCli

*Command-line interface for querying delivery process state via ProcessStateAPI.*

#### CLI displays help and version information



#### CLI requires input flag for subcommands



#### CLI status subcommand shows delivery state



#### CLI query subcommand executes API methods



#### CLI pattern subcommand shows pattern detail



#### CLI arch subcommand queries architecture



#### CLI shows errors for missing subcommand arguments



#### CLI handles argument edge cases



#### CLI list subcommand filters patterns



#### CLI search subcommand finds patterns by fuzzy match



#### CLI context assembly subcommands return text output



#### CLI tags and sources subcommands return JSON



#### CLI extended arch subcommands query architecture relationships



#### CLI unannotated subcommand finds files without annotations



#### Output modifiers work when placed after the subcommand

- **Invariant:** Output modifiers (--count, --names-only, --fields) produce identical results regardless of position relative to the subcommand and its filters.

- **Rationale:** Users should not need to memorize argument ordering rules; the CLI should be forgiving.



#### CLI arch health subcommands detect graph quality issues

- **Invariant:** Health subcommands (dangling, orphans, blocking) operate on the relationship index, not the architecture index, and return results without requiring arch annotations.

- **Rationale:** Graph quality issues (broken references, isolated patterns, blocked dependencies) are relationship-level concerns that should be queryable even when no architecture metadata exists.



*[process-api.feature](tests/features/cli/process-api.feature)*

### ValidatePatternsCli

*Command-line interface for cross-validating TypeScript patterns vs Gherkin feature files.*

#### CLI displays help and version information



#### CLI requires input and feature patterns



#### CLI validates patterns across TypeScript and Gherkin sources



#### CLI supports multiple output formats



#### Strict mode treats warnings as errors



#### CLI warns about unknown flags



*[validate-patterns.feature](tests/features/cli/validate-patterns.feature)*

---

## Codec / Uncategorized

### CompositeCodecTesting

*Assembles reference documents from multiple codec outputs by*

#### CompositeCodec concatenates sections in codec array order

- **Invariant:** Sections from child codecs appear in the composite output in the same order as the codecs array.



#### Separators between codec outputs are configurable

- **Invariant:** By default, a separator block is inserted between each child codec's sections. When separateSections is false, no separators are added.



#### additionalFiles merge with last-wins semantics

- **Invariant:** additionalFiles from all children are merged into a single record. When keys collide, the later codec's value wins.



#### composeDocuments works at document level without codecs

- **Invariant:** composeDocuments accepts RenderableDocument array and produces a composed RenderableDocument without requiring codecs.



#### Empty codec outputs are handled gracefully

- **Invariant:** Codecs producing empty sections arrays contribute nothing to the output. No separator is emitted for empty outputs.



*[composite-codec.feature](tests/features/behavior/codecs/composite-codec.feature)*

### ConventionExtractorTesting

*Extracts convention content from MasterDataset decision records*

#### Empty and missing inputs produce empty results



#### Convention bundles are extracted from matching patterns



#### Structured content is extracted from rule descriptions



#### Code examples in rule descriptions are preserved



#### TypeScript JSDoc conventions are extracted alongside Gherkin



*[convention-extractor.feature](tests/features/behavior/codecs/convention-extractor.feature)*

### DedentHelper

*- DocStrings in Gherkin files have consistent indentation for alignment*

#### Tabs are normalized to spaces before dedent



#### Empty lines are handled correctly



#### Single line input is handled



#### Unicode whitespace is handled



#### Relative indentation is preserved



*[dedent.feature](tests/features/behavior/codecs/dedent.feature)*

### PlanningCodecTesting

*- Need to generate planning checklists, session plans, and findings documents from patterns*

#### PlanningChecklistCodec prepares for implementation sessions



#### SessionPlanCodec generates implementation plans



#### SessionFindingsCodec captures retrospective discoveries



*[planning-codecs.feature](tests/features/behavior/codecs/planning-codecs.feature)*

### PrChangesCodecTesting

*- Need to generate PR-specific documentation from patterns*

#### PrChangesCodec handles empty results gracefully



#### PrChangesCodec generates summary with filter information



#### PrChangesCodec groups changes by phase when sortBy is "phase"



#### PrChangesCodec groups changes by priority when sortBy is "priority"



#### PrChangesCodec shows flat list when sortBy is "workflow"



#### PrChangesCodec renders pattern details with metadata and description



#### PrChangesCodec renders deliverables when includeDeliverables is enabled



#### PrChangesCodec renders acceptance criteria from scenarios



#### PrChangesCodec renders business rules from Gherkin Rule keyword



#### PrChangesCodec generates review checklist when includeReviewChecklist is enabled



#### PrChangesCodec generates dependencies section when includeDependencies is enabled



#### PrChangesCodec filters patterns by changedFiles



#### PrChangesCodec filters patterns by releaseFilter



#### PrChangesCodec uses OR logic for combined filters



#### PrChangesCodec only includes active and completed patterns



*[pr-changes-codec.feature](tests/features/behavior/codecs/pr-changes-codec.feature)*

### ReferenceCodecTesting

*Parameterized codec factory that creates reference document codecs*

#### Empty datasets produce fallback content



#### Convention content is rendered as sections



#### Detail level controls output density



#### Behavior sections are rendered from category-matching patterns



#### Shape sources are extracted from matching patterns



#### Convention and behavior content compose in a single document



#### Composition order follows AD-5: conventions then shapes then behaviors



#### Convention code examples render as mermaid blocks



#### Scoped diagrams are generated from diagramScope config



#### Multiple diagram scopes produce multiple mermaid blocks



#### Standard detail level includes narrative but omits rationale



#### Deep behavior rendering with structured annotations



#### Shape JSDoc prose renders at standard and detailed levels



#### Shape sections render param returns and throws documentation



#### Diagram type controls Mermaid output format

- **Invariant:** The diagramType field on DiagramScope selects the Mermaid output format. Supported types are graph (flowchart, default), sequenceDiagram, and stateDiagram-v2. Each type produces syntactically valid Mermaid output with type-appropriate node and edge rendering.

- **Rationale:** Flowcharts cannot naturally express event flows (sequence), FSM visualization (state), or temporal ordering. Multiple diagram types unlock richer architectural documentation from the same relationship data.



#### Edge labels and custom node shapes enrich diagram readability

- **Invariant:** Relationship edges display labels describing the relationship type (uses, depends on, implements, extends). Edge labels are enabled by default and can be disabled via showEdgeLabels false. Node shapes in flowchart diagrams vary by archRole value using Mermaid shape syntax.

- **Rationale:** Unlabeled edges are ambiguous without consulting a legend. Custom node shapes make archRole visually distinguishable without color reliance, improving accessibility and scanability.



#### Collapsible blocks wrap behavior rules for progressive disclosure

- **Invariant:** When a behavior pattern has 3 or more rules and detail level is not summary, each rule's content is wrapped in a collapsible block with the rule name and scenario count in the summary. Patterns with fewer than 3 rules render rules flat. Summary level never produces collapsible blocks.

- **Rationale:** Behavior sections with many rules produce substantial content at detailed level. Collapsible blocks enable progressive disclosure so readers can expand only the rules they need.



#### Link-out blocks provide source file cross-references

- **Invariant:** At standard and detailed levels, each behavior pattern includes a link-out block referencing its source file path. At summary level, link-out blocks are omitted for compact output.

- **Rationale:** Cross-reference links enable readers to navigate from generated documentation to the annotated source files, closing the loop between generated docs and the single source of truth.



*[reference-codec.feature](tests/features/behavior/codecs/reference-codec.feature)*

### ReportingCodecTesting

*- Need to generate changelog, traceability, and overview documents*

#### ChangelogCodec follows Keep a Changelog format



#### TraceabilityCodec maps timeline patterns to behavior tests



#### OverviewCodec provides project architecture summary



*[reporting-codecs.feature](tests/features/behavior/codecs/reporting-codecs.feature)*

### RequirementsAdrCodecTesting

*- Need to generate product requirements documents with flexible groupings*

#### RequirementsDocumentCodec generates PRD-style documentation from patterns



#### AdrDocumentCodec documents architecture decisions



*[requirements-adr-codecs.feature](tests/features/behavior/codecs/requirements-adr-codecs.feature)*

### SessionCodecTesting

*- Need to generate session context and remaining work documents from patterns*

#### SessionContextCodec provides working context for AI sessions



#### RemainingWorkCodec aggregates incomplete work by phase



*[session-codecs.feature](tests/features/behavior/codecs/session-codecs.feature)*

### ShapeMatcherTesting

*Matches file paths against glob patterns for TypeScript shape extraction.*

#### Exact paths match without wildcards



#### Single-level globs match one directory level



#### Recursive globs match any depth



#### Dataset shape extraction deduplicates by name



*[shape-matcher.feature](tests/features/behavior/codecs/shape-matcher.feature)*

### ShapeSelectorTesting

*Tests the filterShapesBySelectors function that provides fine-grained*

#### Reference doc configs select shapes via shapeSelectors

- **Invariant:** shapeSelectors provides three selection modes: by source path + specific names, by group tag, or by source path alone.



*[shape-selector.feature](tests/features/behavior/codecs/shape-selector.feature)*

### TimelineCodecTesting

*- Need to generate roadmap, milestones, and current work documents from patterns*

#### RoadmapDocumentCodec groups patterns by phase with progress tracking



#### CompletedMilestonesCodec shows only completed patterns grouped by quarter



#### CurrentWorkCodec shows only active patterns with deliverables



*[timeline-codecs.feature](tests/features/behavior/codecs/timeline-codecs.feature)*

---

## Configuration / Uncategorized

### ConfigLoaderTesting

*- Different directories need different taxonomies*

#### Config files are discovered by walking up directories



#### Config discovery stops at repo root



#### Config is loaded and validated



#### Config errors are formatted for display



*[config-loader.feature](tests/features/config/config-loader.feature)*

### ConfigResolution

*- Raw user config is partial with many optional fields*

#### Default config provides sensible fallbacks



#### Preset creates correct taxonomy instance



#### Stubs are merged into typescript sources



#### Output defaults are applied



#### Generator defaults are applied



#### Context inference rules are prepended



#### Config path is carried from options



*[config-resolution.feature](tests/features/config/config-resolution.feature)*

### ConfigurationAPI

*- Different projects need different tag prefixes*

#### Factory creates configured instances with correct defaults



#### Custom prefix configuration works correctly



#### Preset categories replace base categories entirely



#### Regex builders use configured prefix



*[configuration-api.feature](tests/features/config/configuration-api.feature)*

### DefineConfigTesting

*- Users need type-safe config authoring without runtime overhead*

#### defineConfig is an identity function



#### Schema validates correct configurations



#### Schema rejects invalid configurations



#### Type guards distinguish config formats



*[define-config.feature](tests/features/config/define-config.feature)*

### PresetSystem

*- New users need sensible defaults for their project type*

#### Generic preset provides minimal taxonomy



#### Libar generic preset provides minimal taxonomy with libar prefix



#### DDD-ES-CQRS preset provides full taxonomy



#### Presets can be accessed by name



*[preset-system.feature](tests/features/config/preset-system.feature)*

### ProjectConfigLoader

*- Two config formats exist (new-style and legacy) that need unified loading*

#### Missing config returns defaults



#### New-style config is loaded and resolved



#### Legacy config is loaded with backward compatibility



#### Invalid configs produce clear errors



*[project-config-loader.feature](tests/features/config/project-config-loader.feature)*

### SourceMerging

*- Different generators may need different feature or input sources*

#### No override returns base unchanged



#### Feature overrides control feature source selection



#### TypeScript source overrides append additional input



#### Combined overrides apply together



#### Exclude is always inherited from base



*[source-merging.feature](tests/features/config/source-merging.feature)*

---

## Delivery Process / Phase 18

### TraceabilityGenerator

*Provide audit-ready traceability matrices that demonstrate*

#### Parses Verified by annotations to extract scenario references

- **Invariant:** Scenario names in `**Verified by:**` are matched against actual scenarios in feature files. Unmatched references are reported as warnings.

- **Rationale:** Verified by annotations create explicit traceability. Validating references ensures the traceability matrix reflects actual test coverage.



#### Generates Rule-to-Scenario traceability matrix

- **Invariant:** Every Rule appears in the matrix with its verification status. Scenarios are linked by name and file location.

- **Rationale:** A matrix format enables quick scanning of coverage status and supports audit requirements for bidirectional traceability.



#### Detects and reports coverage gaps

- **Invariant:** Orphan scenarios (not referenced by any Rule) and unverified rules are listed in dedicated sections.

- **Rationale:** Coverage gaps indicate either missing traceability annotations or actual missing test coverage. Surfacing them enables remediation.



#### Supports filtering by phase and domain

- **Invariant:** CLI flags allow filtering the matrix by phase number or domain category to generate focused traceability reports.

- **Rationale:** Large codebases have many rules. Filtering enables relevant subset extraction for specific audits or reviews.



*[traceability-generator.feature](delivery-process/specs/traceability-generator.feature)*

---

## Delivery Process / Phase 23

### ArchitectureDiagramGeneration

*Architecture documentation requires manually maintaining mermaid diagrams*

#### Architecture tags exist in the tag registry

- **Invariant:** Three architecture-specific tags (`arch-role`, `arch-context`, `arch-layer`) must exist in the tag registry with correct format and enum values.

- **Rationale:** Architecture diagram generation requires metadata to classify source files into diagram components. Standard tag infrastructure enables consistent extraction via the existing AST parser.



#### AST parser extracts architecture tags from TypeScript

- **Invariant:** The AST parser must extract `arch-role`, `arch-context`, and `arch-layer` tags from TypeScript JSDoc comments into DocDirective objects.

- **Rationale:** Source code annotations are the single source of truth for architectural metadata. Parser must extract them alongside existing pattern metadata.



#### MasterDataset builds archIndex during transformation

- **Invariant:** The `transformToMasterDataset` function must build an `archIndex` that groups patterns by role, context, and layer for efficient diagram generation.

- **Rationale:** Single-pass extraction during dataset transformation avoids expensive re-traversal. Index structure enables O(1) lookup by each dimension.



#### Component diagrams group patterns by bounded context

- **Invariant:** Component diagrams must render patterns as nodes grouped into bounded context subgraphs, with relationship arrows using UML-inspired styles.

- **Rationale:** Component diagrams visualize system architecture showing how bounded contexts isolate components. Subgraphs enforce visual separation.



#### Layered diagrams group patterns by architectural layer

- **Invariant:** Layered diagrams must render patterns grouped by architectural layer (domain, application, infrastructure) with top-to-bottom flow.

- **Rationale:** Layered architecture visualization shows dependency direction - infrastructure at top, domain at bottom - following conventional layer ordering.



#### Architecture generator is registered with generator registry

- **Invariant:** An "architecture" generator must be registered with the generator registry to enable `pnpm docs:architecture` via the existing `generate-docs.js` CLI.

- **Rationale:** The delivery-process uses a generator registry pattern. New generators register with the orchestrator rather than creating separate CLI commands.



#### Sequence diagrams render interaction flows

- **Invariant:** Sequence diagrams must render interaction flows (command flow, saga flow) showing step-by-step message passing between components.

- **Rationale:** Component diagrams show structure but not behavior. Sequence diagrams show runtime flow - essential for understanding command/saga execution.



*[architecture-diagram-generation.feature](delivery-process/specs/architecture-diagram-generation.feature)*

---

## Delivery Process / Phase 24

### ProcessStateAPICLI

*The ProcessStateAPI provides 27 typed query methods for efficient state queries, but*

#### CLI supports status-based pattern queries

- **Invariant:** Every ProcessStateAPI status query method is accessible via CLI.

- **Rationale:** The most common planning question is "what's the current state?" Status queries (active, roadmap, completed) answer this directly without reading docs. Without CLI access, Claude Code must regenerate markdown and parse unstructured text. | Flag | API Method | Use Case | | --status active | getCurrentWork() | "What am I working on?" | | --status roadmap | getRoadmapItems() | "What can I start next?" | | --status completed | getRecentlyCompleted() | "What's done recently?" | | --current-work | getCurrentWork() | Shorthand for active | | --roadmap-items | getRoadmapItems() | Shorthand for roadmap |

| Flag | API Method | Use Case |
| --- | --- | --- |
| --status active | getCurrentWork() | "What am I working on?" |
| --status roadmap | getRoadmapItems() | "What can I start next?" |
| --status completed | getRecentlyCompleted() | "What's done recently?" |
| --current-work | getCurrentWork() | Shorthand for active |
| --roadmap-items | getRoadmapItems() | Shorthand for roadmap |

**Implementation:** `@libar-dev/delivery-process/src/cli/query-state.ts`



#### CLI supports phase-based queries

- **Invariant:** Patterns can be filtered by phase number.

- **Rationale:** Phase 18 (Event Durability) is the current focus per roadmap priorities. Quick phase queries help assess progress and remaining work within a phase. Phase-based planning is the primary organization method for roadmap work. | Flag | API Method | Use Case | | --phase N | getPatternsByPhase(N) | "What's in Phase 18?" | | --phase N --progress | getPhaseProgress(N) | "How complete is Phase 18?" | | --phases | getAllPhases() | "List all phases with counts" |

| Flag | API Method | Use Case |
| --- | --- | --- |
| --phase N | getPatternsByPhase(N) | "What's in Phase 18?" |
| --phase N --progress | getPhaseProgress(N) | "How complete is Phase 18?" |
| --phases | getAllPhases() | "List all phases with counts" |

**Implementation:** `@libar-dev/delivery-process/src/cli/query-state.ts`



#### CLI provides progress summary queries

- **Invariant:** Overall and per-phase progress is queryable in a single command.

- **Rationale:** Planning sessions need quick answers to "where are we?" without reading the full PATTERNS.md generated file. Progress metrics drive prioritization and help identify where to focus effort. | Flag | API Method | Use Case | | --progress | getStatusCounts() + getCompletionPercentage() | Overall progress | | --distribution | getStatusDistribution() | Detailed status breakdown |

| Flag | API Method | Use Case |
| --- | --- | --- |
| --progress | getStatusCounts() + getCompletionPercentage() | Overall progress |
| --distribution | getStatusDistribution() | Detailed status breakdown |

**Implementation:** `@libar-dev/delivery-process/src/cli/query-state.ts`



#### CLI supports multiple output formats

- **Invariant:** JSON output is parseable by AI agents without transformation.

- **Rationale:** Claude Code can parse JSON directly. Text format is for human reading. JSON format enables scripting and integration with other tools. The primary use case is AI agent parsing where structured output reduces context and errors. | Flag | Output | Use Case | | --format text | Human-readable tables | Terminal usage | | --format json | Structured JSON | AI agent parsing, scripting |

| Flag | Output | Use Case |
| --- | --- | --- |
| --format text | Human-readable tables | Terminal usage |
| --format json | Structured JSON | AI agent parsing, scripting |

**Implementation:** `@libar-dev/delivery-process/src/cli/formatters/`



#### CLI supports individual pattern lookup

- **Invariant:** Any pattern can be queried by name with full details.

- **Rationale:** During implementation, Claude Code needs to check specific pattern status, deliverables, and dependencies without reading the full spec file. Pattern lookup is essential for focused implementation work. | Flag | API Method | Use Case | | --pattern NAME | getPattern(name) | "Show DCB pattern details" | | --pattern NAME --deliverables | getPatternDeliverables(name) | "What needs to be built?" | | --pattern NAME --deps | getPatternDependencies(name) | "What does this depend on?" |

| Flag | API Method | Use Case |
| --- | --- | --- |
| --pattern NAME | getPattern(name) | "Show DCB pattern details" |
| --pattern NAME --deliverables | getPatternDeliverables(name) | "What needs to be built?" |
| --pattern NAME --deps | getPatternDependencies(name) | "What does this depend on?" |

**Implementation:** `@libar-dev/delivery-process/src/cli/query-state.ts`



#### CLI provides discoverable help

- **Invariant:** All flags are documented via --help with examples.

- **Rationale:** Claude Code can read --help output to understand available queries without needing external documentation. Self-documenting CLIs reduce the need for Claude Code to read additional context files.

**Implementation:** `@libar-dev/delivery-process/src/cli/query-state.ts`



*[process-state-api-cli.feature](delivery-process/specs/process-state-api-cli.feature)*

### ProcessStateAPIRelationshipQueries

*ProcessStateAPI currently supports dependency queries (`uses`, `usedBy`, `dependsOn`,*

#### API provides implementation relationship queries

- **Invariant:** Every pattern with `implementedBy` entries is discoverable via the API.

- **Rationale:** Claude Code needs to navigate from abstract patterns to concrete code. Without this, exploration requires manual grep + file reading, wasting context tokens. | Query | Returns | Use Case | | getImplementations(pattern) | File paths implementing the pattern | "Show me the code for EventStoreDurability" | | getImplementedPatterns(file) | Patterns the file implements | "What patterns does outbox.ts implement?" | | hasImplementations(pattern) | boolean | Filter patterns with/without implementations |

| Query | Returns | Use Case |
| --- | --- | --- |
| getImplementations(pattern) | File paths implementing the pattern | "Show me the code for EventStoreDurability" |
| getImplementedPatterns(file) | Patterns the file implements | "What patterns does outbox.ts implement?" |
| hasImplementations(pattern) | boolean | Filter patterns with/without implementations |



#### API provides inheritance hierarchy queries

- **Invariant:** Pattern inheritance chains are fully navigable in both directions.

- **Rationale:** Patterns form specialization hierarchies (e.g., ReactiveProjections extends ProjectionCategories). Claude Code needs to understand what specializes a base pattern and what a specialized pattern inherits from. | Query | Returns | Use Case | | getExtensions(pattern) | Patterns extending this one | "What specializes ProjectionCategories?" | | getBasePattern(pattern) | Pattern this extends (or null) | "What does ReactiveProjections inherit from?" | | getInheritanceChain(pattern) | Full chain to root | "Show full hierarchy for CachedProjections" |

| Query | Returns | Use Case |
| --- | --- | --- |
| getExtensions(pattern) | Patterns extending this one | "What specializes ProjectionCategories?" |
| getBasePattern(pattern) | Pattern this extends (or null) | "What does ReactiveProjections inherit from?" |
| getInheritanceChain(pattern) | Full chain to root | "Show full hierarchy for CachedProjections" |



#### API provides combined relationship views

- **Invariant:** All relationship types are accessible through a unified interface.

- **Rationale:** Claude Code often needs the complete picture: dependencies AND implementations AND inheritance. A single call reduces round-trips and context switching.

**Implementation:** `@libar-dev/delivery-process/src/api/process-state.ts`



#### API supports bidirectional traceability queries

- **Invariant:** Navigation from spec to code and code to spec is symmetric.

- **Rationale:** Traceability is bidirectional by definition. If a spec links to code, the code should link back to the spec. The API should surface broken links. | Query | Returns | Use Case | | getTraceabilityStatus(pattern) | {hasSpecs, hasImplementations, isSymmetric} | Audit traceability completeness | | getBrokenLinks() | Patterns with asymmetric traceability | Find missing back-links |

| Query | Returns | Use Case |
| --- | --- | --- |
| getTraceabilityStatus(pattern) | {hasSpecs, hasImplementations, isSymmetric} | Audit traceability completeness |
| getBrokenLinks() | Patterns with asymmetric traceability | Find missing back-links |



*[process-state-api-relationship-queries.feature](delivery-process/specs/process-state-api-relationship-queries.feature)*

---

## Delivery Process / Phase 25

### ClaudeModuleGeneration

*CLAUDE.md modules are hand-written markdown files that drift from source*

#### Claude module tags exist in the tag registry

- **Invariant:** Three claude-specific tags (`claude-module`, `claude-section`, `claude-tags`) must exist in the tag registry with correct format and values.

- **Rationale:** Module generation requires metadata to determine output path, section placement, and variation filtering. Standard tag infrastructure enables consistent extraction via the existing Gherkin parser.



#### Gherkin parser extracts claude module tags from feature files

- **Invariant:** The Gherkin extractor must extract `claude-module`, `claude-section`, and `claude-tags` from feature file tags into ExtractedPattern objects.

- **Rationale:** Behavior specs are the source of truth for CLAUDE.md module content. Parser must extract module metadata alongside existing pattern metadata.



#### Module content is extracted from feature file structure

- **Invariant:** The codec must extract content from standard feature file elements: Feature description (Problem/Solution), Rule blocks, and Scenario Outline Examples.

- **Rationale:** Behavior specs already contain well-structured, prescriptive content. The extraction preserves structure rather than flattening to prose.



#### ClaudeModuleCodec produces compact markdown modules

- **Invariant:** The codec transforms patterns with claude tags into markdown files suitable for the `_claude-md/` directory structure.

- **Rationale:** CLAUDE.md modules must be compact and actionable. The codec produces ready-to-use markdown without truncation (let modular-claude-md handle token budget warnings).



#### Claude module generator writes files to correct locations

- **Invariant:** The generator must write module files to `{outputDir}/{section}/{module}.md` based on the `claude-section` and `claude-module` tags.

- **Rationale:** Output path structure must match modular-claude-md expectations. The `claude-section` determines the subdirectory, `claude-module` determines filename.



#### Claude module generator is registered with generator registry

- **Invariant:** A "claude-modules" generator must be registered with the generator registry to enable `pnpm docs:claude-modules` via the existing CLI.

- **Rationale:** Consistent with architecture-diagram-generation pattern. New generators register with the orchestrator rather than creating separate commands.



#### Same source generates detailed docs with progressive disclosure

- **Invariant:** When running with `detailLevel: "detailed"`, the codec produces expanded documentation including all Rule content, code examples, and scenario details.

- **Rationale:** Single source generates both compact modules (AI context) and detailed docs (human reference). Progressive disclosure is already a codec capability.



*[claude-module-generation.feature](delivery-process/specs/claude-module-generation.feature)*

### DataAPIArchitectureQueries

*The current `arch` subcommand provides basic queries (roles, context, layer, graph)*

#### Arch subcommand provides neighborhood and comparison views

- **Invariant:** Architecture queries resolve pattern names to concrete relationships and file paths, not just abstract names.

- **Rationale:** The current `arch graph <pattern>` returns dependency and relationship names but not the full picture of what surrounds a pattern. Design sessions need to understand: "If I'm working on X, what else is directly connected?" and "How do contexts A and B relate?"

| Section | Content |
| --- | --- |
| Triggered by | Patterns whose `usedBy` includes this pattern |
| Uses | Patterns this calls directly |
| Used by | Patterns that call this directly |
| Same context | Sibling patterns in the same bounded context |



#### Coverage analysis reports annotation completeness with gaps

- **Invariant:** Coverage reports identify unannotated files that should have the libar-docs opt-in marker based on their location and content.

- **Rationale:** Annotation completeness directly impacts the quality of all generated documentation and API queries. Files without the opt-in marker are invisible to the pipeline. Coverage gaps mean missing patterns in the registry, incomplete dependency graphs, and blind spots in architecture views.

| Metric | Source |
| --- | --- |
| Annotated files | Files with libar-docs opt-in |
| Total scannable files | All .ts files in input globs |
| Coverage percentage | annotated / total |
| Missing files | Scannable files without annotations |
| Unused roles/categories | Values defined in taxonomy but not used |



#### Tags and sources commands provide taxonomy and inventory views

- **Invariant:** All tag values in use are discoverable without reading configuration files. Source file inventory shows the full scope of annotated and scanned content.

- **Rationale:** Agents frequently need to know "what categories exist?" or "how many feature files are there?" without reading taxonomy configuration. These are meta-queries about the annotation system itself, essential for writing new annotations correctly and understanding scope.

| Tag | Count | Example Values |
| --- | --- | --- |
| libar-docs-status | 69 | completed(36), roadmap(30), active(3) |
| libar-docs-category | 41 | projection(6), saga(4), handler(5) |

| Source Type | Count | Location Pattern |
| --- | --- | --- |
| TypeScript (annotated) | 47 | src/**/*.ts |
| Gherkin (feature files) | 37 | specs/**/*.feature |
| Stub files | 22 | stubs/**/*.ts |
| Decision files | 13 | decisions/**/*.feature |



*[data-api-architecture-queries.feature](delivery-process/specs/data-api-architecture-queries.feature)*

### DataAPICLIErgonomics

*The process-api CLI runs the full pipeline (scan, extract, transform) on every*

#### MasterDataset is cached between invocations with file-change invalidation

- **Invariant:** Cache is automatically invalidated when any source file (TypeScript or Gherkin) has a modification time newer than the cache.

- **Rationale:** The pipeline (scan -> extract -> transform) runs fresh on every invocation (~2-5 seconds). Most queries during a session don't need fresh data -- the source files haven't changed between queries. Caching the MasterDataset to a temp file with file-modification-time invalidation makes subsequent queries instant while ensuring staleness is impossible.



#### REPL mode keeps pipeline loaded for interactive multi-query sessions

- **Invariant:** REPL mode loads the pipeline once and accepts multiple queries on stdin, with optional tab completion for pattern names and subcommands.

- **Rationale:** Design sessions often involve 10-20 exploratory queries in sequence (check status, look up pattern, check deps, look up another pattern). REPL mode eliminates per-query pipeline overhead entirely.



#### Per-subcommand help and diagnostic modes aid discoverability

- **Invariant:** Every subcommand supports `--help` with usage, flags, and examples. Dry-run shows pipeline scope without executing.

- **Rationale:** AI agents read `--help` output to discover available commands and flags. Without per-subcommand help, agents must read external documentation. Dry-run mode helps diagnose "why no patterns found?" issues by showing what would be scanned.



*[data-api-cli-ergonomics.feature](delivery-process/specs/data-api-cli-ergonomics.feature)*

### DataAPIContextAssembly

*Starting a Claude Code design or implementation session requires assembling*

#### Context command assembles curated context for a single pattern

- **Invariant:** Given a pattern name, `context` returns everything needed to start working on that pattern: metadata, file locations, dependency status, and architecture position -- in ~1.5KB of structured text.

- **Rationale:** This is the core value proposition. The command crosses five gaps simultaneously: it assembles data from multiple MasterDataset indexes, shapes it compactly, resolves file paths from pattern names, discovers stubs by convention, and tailors output by session type.

| Session | Includes | Typical Size |
| --- | --- | --- |
| planning | Brief + deps + status | ~500 bytes |
| design | Spec + stubs + deps + architecture + consumers | ~1.5KB |
| implement | Spec + stubs + deliverables + FSM + tests | ~1KB |



#### Files command returns only file paths organized by relevance

- **Invariant:** `files` returns the most token-efficient output possible -- just file paths that Claude Code can read directly.

- **Rationale:** Most context tokens are spent reading actual files, not metadata. The `files` command tells Claude Code *which* files to read, organized by importance. Claude Code then reads what it needs. This is more efficient than `context` when the agent already knows the pattern and just needs the file list.

| Section | Contents |
| --- | --- |
| Primary | Spec file, stub files |
| Dependencies (completed) | Implementation files of completed deps |
| Dependencies (roadmap) | Spec files of incomplete deps |
| Architecture neighbors | Same-context patterns |



#### Dep-tree command shows recursive dependency chain with status

- **Invariant:** The dependency tree walks both `dependsOn`/`enables` (planning) and `uses`/`usedBy` (implementation) relationships with configurable depth.

- **Rationale:** Before starting work on a pattern, agents need to know the full dependency chain: what must be complete first, what this unblocks, and where the current pattern sits in the sequence. A tree visualization with status markers makes blocking relationships immediately visible.



#### Context command supports multiple patterns with merged output

- **Invariant:** Multi-pattern context deduplicates shared dependencies and highlights overlap between patterns.

- **Rationale:** Design sessions often span multiple related patterns (e.g., reviewing DS-2 through DS-5 together). Separate `context` calls would duplicate shared dependencies. Merged context shows the union of all dependencies with overlap analysis.



#### Overview provides executive project summary

- **Invariant:** `overview` returns project-wide health in one command.

- **Rationale:** Planning sessions start with "where are we?" This command answers that question without needing to run multiple queries and mentally aggregate results. Implementation readiness checks for specific patterns live in DataAPIDesignSessionSupport's `scope-validate` command.

| Section | Content |
| --- | --- |
| Progress | N patterns (X completed, Y active, Z planned) = P% |
| Active phases | Currently in-progress phases with pattern counts |
| Blocking | Patterns that cannot proceed due to incomplete deps |



*[data-api-context-assembly.feature](delivery-process/specs/data-api-context-assembly.feature)*

### DataAPIDesignSessionSupport

*Starting a design or implementation session requires manually compiling*

#### Scope-validate checks implementation prerequisites before session start

- **Invariant:** Scope validation surfaces all blocking conditions before committing to a session, preventing wasted effort on unready patterns.

- **Rationale:** Starting implementation on a pattern with incomplete dependencies wastes an entire session. Starting a design session without prior session deliverables means working with incomplete context. Pre-flight validation catches these issues in seconds rather than discovering them mid-session.

| Check | Required For | Source |
| --- | --- | --- |
| Dependencies completed | implement | dependsOn chain status |
| Stubs from dependency sessions exist | design | implementedBy lookup |
| Deliverables defined | implement | Background table in spec |
| FSM allows transition to active | implement | isValidTransition() |
| Design decisions recorded | implement | PDR references in stubs |
| Executable specs location set | implement | @executable-specs tag |



#### Handoff generates compact session state summary for multi-session work

- **Invariant:** Handoff documentation captures everything the next session needs to continue work without context loss.

- **Rationale:** Multi-session work (common for design phases spanning DS-1 through DS-7) requires state transfer between sessions. Without automated handoff, critical information is lost: what was completed, what's in progress, what blockers were discovered, and what should happen next. Manual handoff documentation is inconsistent and often forgotten.

| Section | Source |
| --- | --- |
| Session summary | Pattern name, session type, date |
| Completed | Deliverables with status "complete" |
| In progress | Deliverables with status not "complete" and not "pending" |
| Files modified | Git diff file list (if available) |
| Discovered items | @discovered-gap, @discovered-improvement tags |
| Blockers | Incomplete dependencies, open questions |
| Next session priorities | Remaining deliverables, suggested order |



*[data-api-session-support.feature](delivery-process/specs/data-api-session-support.feature)*

### DataAPIOutputShaping

*The ProcessStateAPI CLI returns raw `ExtractedPattern` objects via `JSON.stringify`.*

#### List queries return compact pattern summaries by default

- **Invariant:** List-returning API methods produce summaries, not full ExtractedPattern objects, unless `--full` is explicitly requested.

- **Rationale:** The single biggest usability problem. `getCurrentWork` returns 3 active patterns at ~3.5KB each = 10.5KB. Summarized: ~300 bytes total. The `directive` field (raw JSDoc AST) and `code` field (full source) are almost never needed for list queries. AI agents need name, status, category, phase, and file path -- nothing more.

| Field | Source | Size |
| --- | --- | --- |
| patternName | pattern.patternName | ~30 chars |
| status | pattern.status | ~8 chars |
| category | pattern.categories | ~15 chars |
| phase | pattern.phase | ~3 chars |
| file | pattern.filePath | ~40 chars |
| source | pattern.source | ~7 chars |



#### Global output modifier flags apply to any list-returning command

- **Invariant:** Output modifiers are composable and apply uniformly across all list-returning subcommands and query methods.

- **Rationale:** AI agents frequently need just pattern names (for further queries), just counts (for progress checks), or specific fields (for focused analysis). These are post-processing transforms that should work with any data source.

| Flag | Effect | Example Output |
| --- | --- | --- |
| --names-only | Array of pattern name strings | ["OrderSaga", "EventStore"] |
| --count | Single integer | 6 |
| --fields name,status | Selected fields only | [{"name":"X","status":"active"}] |



#### Output format is configurable with typed response envelope

- **Invariant:** All CLI output uses the QueryResult envelope for success/error discrimination. The compact format strips empty and null fields.

- **Rationale:** The existing `QueryResult<T>` types (`QuerySuccess`, `QueryError`) are defined in `src/api/types.ts` but not wired into the CLI output. Agents cannot distinguish success from error without try/catch on JSON parsing. Empty arrays, null values, and empty strings add noise to every response.

| Field | Type | Purpose |
| --- | --- | --- |
| success | boolean | Discriminator for success/error |
| data | T | The query result |
| metadata | object | Pattern count, timestamp, pipeline health |
| error | string | Error message (only on failure) |



#### List subcommand provides composable filters and fuzzy search

- **Invariant:** The `list` subcommand replaces the need to call specific `getPatternsByX` methods. Filters are composable via AND logic. The `query` subcommand remains available for programmatic/raw access.

- **Rationale:** Currently, filtering by status AND category requires calling `getPatternsByCategory` then manually filtering by status. A single `list` command with composable filters eliminates multi-step queries. Fuzzy search reduces agent retry loops when pattern names are approximate.

| Flag | Filters by | Example |
| --- | --- | --- |
| --status | FSM status | --status active |
| --phase | Phase number | --phase 22 |
| --category | Category tag | --category projection |
| --source | Source type | --source gherkin |
| --limit N | Max results | --limit 10 |
| --offset N | Skip results | --offset 5 |



#### CLI provides ergonomic defaults and helpful error messages

- **Invariant:** Common operations require minimal flags. Pattern name typos produce actionable suggestions. Empty results explain why.

- **Rationale:** Every extra flag and every retry loop costs AI agent context tokens. Config file defaults eliminate repetitive path arguments. Fuzzy matching with suggestions prevents the common "Pattern not found" → retry → still not found loop. Empty result hints guide agents toward productive queries.

| Feature | Before | After |
| --- | --- | --- |
| Config defaults | --input 'src/**/*.ts' --features '...' every time | Read from config file |
| -f shorthand | --features 'specs/*.feature' | -f 'specs/*.feature' |
| pnpm banner | Breaks JSON piping | Clean stdout |
| Did-you-mean | "Pattern not found" (dead end) | "Did you mean: AgentCommandInfrastructure?" |
| Empty hints | [] (no context) | "No active patterns. 3 are roadmap. Try: list --status roadmap" |



*[data-api-output-shaping.feature](delivery-process/specs/data-api-output-shaping.feature)*

### DataAPIPlatformIntegration

*The process-api CLI requires subprocess invocation for every query, adding*

#### ProcessStateAPI is accessible as an MCP server for Claude Code

- **Invariant:** The MCP server exposes all ProcessStateAPI methods as MCP tools with typed input/output schemas. The pipeline is loaded once on server start and refreshed on source file changes.

- **Rationale:** MCP is Claude Code's native tool integration protocol. An MCP server eliminates the CLI subprocess overhead (2-5s per query) and enables Claude Code to call process queries as naturally as it calls other tools. Stateful operation means the pipeline loads once and serves many queries.



#### Process state can be auto-generated as CLAUDE.md context sections

- **Invariant:** Generated CLAUDE.md sections are additive layers that provide pattern metadata, relationships, and reading lists for specific scopes.

- **Rationale:** CLAUDE.md is the primary mechanism for providing persistent context to Claude Code sessions. Auto-generating CLAUDE.md sections from process state ensures the context is always fresh and consistent with the source annotations. This applies the "code-first documentation" principle to AI context itself.



#### Cross-package views show dependencies spanning multiple packages

- **Invariant:** Cross-package queries aggregate patterns from multiple input sources and resolve cross-package relationships.

- **Rationale:** In the monorepo, patterns in `platform-core` are used by patterns in `platform-bc`, which are used by the example app. Understanding these cross-package dependencies is essential for release planning and impact analysis. Currently each package must be queried independently with separate input globs.



#### Process validation integrates with git hooks and file watching

- **Invariant:** Pre-commit hooks validate annotation consistency. Watch mode re-generates docs on source changes.

- **Rationale:** Git hooks catch annotation errors at commit time (e.g., new `uses` reference to non-existent pattern, invalid `arch-role` value, stub `@target` to non-existent directory). Watch mode enables live documentation regeneration during implementation sessions.



*[data-api-platform-integration.feature](delivery-process/specs/data-api-platform-integration.feature)*

### DataAPIRelationshipGraph

*The current API provides flat relationship lookups (`getPatternDependencies`,*

#### Graph command traverses relationships recursively with configurable depth

- **Invariant:** Graph traversal walks both planning relationships (`dependsOn`, `enables`) and implementation relationships (`uses`, `usedBy`) with cycle detection to prevent infinite loops.

- **Rationale:** Flat lookups show direct connections. Recursive traversal shows the full picture: transitive dependencies, indirect consumers, and the complete chain from root to leaf. Depth limiting prevents overwhelming output on deeply connected graphs.



#### Impact analysis shows transitive dependents of a pattern

- **Invariant:** Impact analysis answers "if I change X, what else is affected?" by walking `usedBy` + `enables` recursively.

- **Rationale:** Before modifying a completed pattern (which requires unlock), understanding the blast radius prevents unintended breakage. Impact analysis is the reverse of dependency traversal -- it looks forward, not backward.



#### Path finding discovers relationship chains between two patterns

- **Invariant:** Path finding returns the shortest chain of relationships connecting two patterns, or indicates no path exists. Traversal considers all relationship types (uses, usedBy, dependsOn, enables).

- **Rationale:** Understanding how two seemingly unrelated patterns connect helps agents assess indirect dependencies before making changes. When pattern A and pattern D are connected through B and C, modifying A requires understanding that chain.



#### Graph health commands detect broken references and isolated patterns

- **Invariant:** Dangling references (pattern names in `uses`/`dependsOn` that don't match any pattern definition) are detectable. Orphan patterns (no relationships at all) are identifiable.

- **Rationale:** The MasterDataset transformer already computes dangling references during Pass 3 (relationship resolution) but does not expose them via the API. Orphan patterns indicate missing annotations. Both are data quality signals that improve over time with attention.



*[data-api-relationship-graph.feature](delivery-process/specs/data-api-relationship-graph.feature)*

### DataAPIStubIntegration

*Design sessions produce code stubs in `delivery-process/stubs/` with rich*

#### All stubs are visible to the scanner pipeline

- **Invariant:** Every stub file in `delivery-process/stubs/` has `@libar-docs` opt-in and `@libar-docs-implements` linking it to its parent pattern.

- **Rationale:** The scanner requires `@libar-docs` opt-in marker to include a file. Without it, stubs are invisible regardless of other annotations. The `@libar-docs-implements` tag creates the bidirectional link: spec defines the pattern (via `@libar-docs-pattern`), stub implements it. Per PDR-009, stubs must NOT use `@libar-docs-pattern` -- that belongs to the feature file.



#### Stubs subcommand lists design stubs with implementation status

- **Invariant:** `stubs` returns stub files with their target paths, design session origins, and whether the target file already exists.

- **Rationale:** Before implementation, agents need to know: which stubs exist for a pattern, where they should be moved to, and which have already been implemented. The stub-to-implementation resolver compares `@libar-docs-target` paths against actual files to determine status.

| Field | Source |
| --- | --- |
| Stub file | Pattern filePath |
| Target | @libar-docs-target value |
| Implemented? | Target file exists? |
| Since | @libar-docs-since (design session ID) |
| Pattern | @libar-docs-implements value |



#### Decisions and PDR commands surface design rationale

- **Invariant:** Design decisions (AD-N items) and PDR references from stub annotations are queryable by pattern name or PDR number.

- **Rationale:** Design sessions produce numbered decisions (AD-1, AD-2, etc.) and reference PDR decision records (see PDR-012). When reviewing designs or starting implementation, agents need to find these decisions without reading every stub file manually.



*[data-api-stub-integration.feature](delivery-process/specs/data-api-stub-integration.feature)*

### PatternHelpersTests

#### getPatternName uses patternName tag when available



#### findPatternByName performs case-insensitive matching



#### getRelationships looks up with case-insensitive fallback



#### suggestPattern provides fuzzy suggestions



*[pattern-helpers.feature](tests/features/api/output-shaping/pattern-helpers.feature)*

---

## Delivery Process / Phase 26

### ShapeExtraction

*Documentation comments duplicate type definitions that exist in the same file.*

#### extract-shapes tag is defined in registry

- **Invariant:** The `extract-shapes` tag must exist with CSV format to list multiple type names for extraction.



#### Interfaces are extracted from TypeScript AST

- **Invariant:** When `@libar-docs-extract-shapes` lists an interface name, the extractor must find and extract the complete interface definition including JSDoc comments, generics, and extends clauses.



#### Type aliases are extracted from TypeScript AST

- **Invariant:** Type aliases (including union types, intersection types, and mapped types) are extracted when listed in extract-shapes.



#### Enums are extracted from TypeScript AST

- **Invariant:** Both string and numeric enums are extracted with their complete member definitions.



#### Function signatures are extracted (body omitted)

- **Invariant:** When a function name is listed in extract-shapes, only the signature (parameters, return type, generics) is extracted. The function body is replaced with ellipsis for documentation purposes.



#### Multiple shapes are extracted in specified order

- **Invariant:** When multiple shapes are listed, they appear in the documentation in the order specified in the tag, not source order.



#### Extracted shapes render as fenced code blocks

- **Invariant:** Codecs render extracted shapes as TypeScript fenced code blocks, grouped under an "API Types" or similar section.



#### Shapes can reference types from imports

- **Invariant:** Extracted shapes may reference types from imports. The extractor does NOT resolve imports - it extracts the shape as-is. Consumers understand that referenced types are defined elsewhere.



#### Overloaded function signatures are all extracted

- **Invariant:** When a function has multiple overload signatures, all signatures are extracted together as they represent the complete API.



#### Shape rendering supports grouping options

- **Invariant:** Codecs can render shapes grouped in a single code block or as separate code blocks, depending on detail level.



*[shape-extraction.feature](delivery-process/specs/shape-extraction.feature)*

---

## Delivery Process / Phase 27

### CodecDrivenReferenceGeneration

*Each reference document (Process Guard, Taxonomy, Validation, etc.) required a*

#### Config-driven codec replaces per-document recipe features

- **Invariant:** A single `ReferenceDocConfig` object is sufficient to produce a complete reference document. No per-document codec subclass or recipe feature is required.

- **Rationale:** The codec composition logic is identical across all reference documents. Only the content sources differ. Extracting this into a config-driven factory eliminates N duplicated recipe features and makes adding new documents a one-line config addition.



#### Four content sources compose in AD-5 order

- **Invariant:** Reference documents always compose content in this order: conventions, then scoped diagrams, then shapes, then behaviors. Empty sources are omitted without placeholder sections.

- **Rationale:** AD-5 established that conceptual context (conventions and architectural diagrams) should precede implementation details (shapes and behaviors). This reading order helps developers understand the "why" before the "what".



#### Detail level controls output density

- **Invariant:** Three detail levels produce progressively more content from the same config. Summary: type tables only, no diagrams, no narrative. Standard: narrative and code examples, no rationale. Detailed: full rationale, property documentation, and scoped diagrams.

- **Rationale:** AI context windows need compact summaries. Human readers need full documentation. The same config serves both audiences by parameterizing the detail level at generation time.



#### Generator registration produces paired detailed and summary outputs

- **Invariant:** Each ReferenceDocConfig produces exactly two generators (detailed for `docs/`, summary for `_claude-md/`) plus a meta-generator that invokes all pairs. Total: N configs x 2 + 1 = 2N + 1 generators.

- **Rationale:** Every reference document needs both a human-readable detailed version and an AI-optimized compact version. The meta-generator enables `pnpm docs:all` to produce every reference document in one pass.



*[codec-driven-reference-generation.feature](delivery-process/specs/codec-driven-reference-generation.feature)*

### DocGenerationProofOfConcept

*This decision establishes the pattern for generating technical documentation*

#### Context - Manual documentation maintenance does not scale

**The Problem:**

    Common technical documentation is the hardest part to maintain in a repository.

| Document | Lines | Maintenance Burden |
| --- | --- | --- |
| docs/PROCESS-GUARD.md | ~300 | High - duplicates code behavior |
| docs/METHODOLOGY.md | ~400 | Medium - conceptual, changes less |
| _claude-md/validation/*.md | ~50 each | High - must match detailed docs |
| CLAUDE.md | ~800 | Very High - aggregates everything |

| Gap | Impact | Solution |
| --- | --- | --- |
| Shape extraction from TypeScript | High | New @extract-shapes tag |
| Convention-tagged content | Medium | Decision records as convention sources |
| Durable intro/context content | Medium | Decision Rule: Context sections |



#### Decision - Decisions own convention content and durable context, code owns details

**The Pattern:**

    Documentation is generated from three source types with different durability:

    **Why Decisions Own Intro Content:**

    Tier 1 specs (roadmap features) become clutter after implementation - their
    deliverables are done, status is completed, they pile up.

| Source Type | Durability | Content Ownership |
| --- | --- | --- |
| Decision documents (ADR/PDR) | Permanent | Intro, context, rationale, conventions |
| Behavior specs (.feature) | Permanent | Rules, examples, acceptance criteria |
| Implementation code (.ts) | Compiled | API types, error messages, signatures |

| Rule Prefix | ADR Section | Doc Section |
| --- | --- | --- |
| `Context...` | context | ## Background / Introduction |
| `Decision...` | decision | ## How It Works |
| `Consequence...` | consequences | ## Trade-offs |
| Other rules | other (warning logged) | Custom sections |

| Target Document | Sources | Detail Level | Effect |
| --- | --- | --- | --- |
| docs/PROCESS-GUARD.md | This decision + behavior specs + code | detailed | All sections, full JSDoc |
| _claude-md/validation/process-guard.md | This decision + behavior specs + code | summary | Rules table, types only |

| Level | Content Included | Rendering Style |
| --- | --- | --- |
| summary | Essential tables, type names only | Compact - lists vs code blocks |
| standard | Tables, types, key descriptions | Balanced |
| detailed | Everything including JSDoc, examples | Full - code blocks with JSDoc |

| Source | What's Extracted | How |
| --- | --- | --- |
| Decision Rule: Context | Intro/background section | Rule description text |
| Decision Rule: Decision | How it works section | Rule description text |
| Decision Rule: Consequences | Trade-offs section | Rule description text |
| Decision DocStrings | Code examples (Husky, API) | Fenced code blocks |
| Behavior spec Rules | Validation rules, business rules | Rule names + descriptions |
| Behavior spec Scenario Outlines | Decision tables, lookup tables | Examples tables |
| TypeScript @extract-shapes | API types, interfaces | AST extraction |
| TypeScript JSDoc | Implementation notes | Markdown in comments |



#### Proof of Concept - Self-documentation validates the pattern

This POC demonstrates the doc-from-decision pattern by generating docs
    about ITSELF.

| Output | Purpose | Detail Level |
| --- | --- | --- |
| docs/DOC-GENERATION-PROOF-OF-CONCEPT.md | Detailed reference | detailed |
| _claude-md/generated/doc-generation-proof-of-concept.md | AI context | summary |

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Intro & Context | THIS DECISION (Rule: Context above) | Decision rule description |
| How It Works | THIS DECISION (Rule: Decision above) | Decision rule description |
| Validation Rules | tests/features/validation/process-guard.feature | Rule blocks |
| Protection Levels | delivery-process/specs/process-guard-linter.feature | Scenario Outline Examples |
| Valid Transitions | delivery-process/specs/process-guard-linter.feature | Scenario Outline Examples |
| API Types | src/lint/process-guard/types.ts | @extract-shapes tag |
| Decider API | src/lint/process-guard/decider.ts | @extract-shapes tag |
| CLI Options | src/cli/lint-process.ts | JSDoc section |
| Error Messages | src/lint/process-guard/decider.ts | createViolation() patterns |
| Pre-commit Setup | THIS DECISION (DocString) | Fenced code block |
| Programmatic API | THIS DECISION (DocString) | Fenced code block |

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock reason tag | `@libar-docs-unlock-reason:'Fix-typo'` |
| Modify outside session scope | Use ignore flag | `lint-process --staged --ignore-session` |
| CI treats warnings as errors | Use strict flag | `lint-process --all --strict` |
| Skip workflow (legacy import) | Multiple transitions | Set roadmap then completed in same commit |



#### Expected Output - Compact claude module structure

**File:** `_claude-md/validation/process-guard.md`

    The compact module extracts only essential content for AI context.

| Section | Content |
| --- | --- |
| Header + Intro | Pattern name, problem/solution summary |
| API Types | Core interface definitions (DeciderInput, ValidationResult) |
| 7 Validation Rules | Rule table with severity and description |
| Protection Levels | Status-to-protection mapping table |
| CLI | Essential command examples |
| Link | Reference to full documentation |



#### Consequences - Durable sources with clear ownership boundaries

**Benefits:**

    **Trade-offs:**

    **Ownership Boundaries:**

| Benefit | How |
| --- | --- |
| Single source of truth | Each content type owned by one source |
| Always-current docs | Generated from tested/compiled sources |
| Reduced maintenance | Change source once, docs regenerate |
| Progressive disclosure | Same sources → compact + detailed outputs |
| Clear ownership | Decisions own "why", code owns "what" |

| Trade-off | Mitigation |
| --- | --- |
| Decisions must be updated for fundamental changes | Appropriate - fundamentals ARE decisions |
| New @extract-shapes capability required | Spec created (shape-extraction.feature) |
| Initial annotation effort on existing code | One-time migration, then maintained |
| Generated docs in git history | Same as current manual approach |

| Content Type | Owner | Update Trigger |
| --- | --- | --- |
| Intro, rationale, context | Decision document | Fundamental change to approach |
| Rules, examples, edge cases | Behavior specs | Behavior change (tests fail) |
| API types, signatures | Code with @extract-shapes | Interface change (compile fail) |
| Error messages | Code patterns | Message text change |
| Code examples | Decision DocStrings | Example needs update |



#### Consequences - Design stubs live in stubs, not src

**The Problem:**

    Design stubs (pre-implementation API shapes) placed in `src/` cause issues:

    Example of the anti-pattern (from monorepo eslint.config.js):
    

    **The Solution:**

    Design stubs live in `delivery-process/stubs/`:

    **Design Stub Pattern:**

    

    **Benefits:**

    **Workflow:**

    1. **Design session:** Create stub in `delivery-process/stubs/{pattern-name}/`
    2. **Iterate:** Refine API shapes, add JSDoc, test with docs generation
    3. **Implementation session:** Move/copy to `src/`, implement real logic
    4. **Stub becomes example:** Original stub stays as reference (optional)

    **What This Enables:**

    Once proven with Process Guard, the pattern applies to all documentation:

| Issue | Impact |
| --- | --- |
| ESLint exceptions needed | Rules relaxed for "not-yet-real" code |
| Confusion | What's production vs. what's design? |
| Pollution | Stubs mixed with implemented code |
| Import accidents | Other code might import unimplemented stubs |
| Maintenance burden | Must track which files are stubs |

| Location | Content | When Moved to src/ |
| --- | --- | --- |
| delivery-process/stubs/{pattern}/*.ts | API shapes, interfaces, throw-not-implemented | Implementation session |
| src/**/*.ts | Production code only | Already there |

| Benefit | How |
| --- | --- |
| No ESLint exceptions | Stubs aren't in src/, no relaxation needed |
| Clear separation | delivery-process/stubs/ = design, src/ = production |
| Documentation source | Stubs with @extract-shapes generate API docs |
| Safe iteration | Can refine stub APIs without breaking anything |
| Implementation signal | Moving from delivery-process/stubs/ to src/ = implementation started |

| Document | Decision Source |
| --- | --- |
| docs/METHODOLOGY.md | ADR for delivery process methodology |
| docs/TAXONOMY.md | PDR-006 TypeScript Taxonomy (exists) |
| docs/VALIDATION.md | ADR for validation approach |
| docs/SESSION-GUIDES.md | ADR for session workflows |
| _claude-md/**/*.md | Corresponding decisions with compact extraction |



#### Decision - Source mapping table parsing and extraction method dispatch

- **Invariant:** The source mapping table in a decision document defines how documentation sections are assembled from multiple source files.

| Column | Purpose | Example |
| --- | --- | --- |
| Section | Target section heading in generated doc | "Intro & Context", "API Types" |
| Source File | Path to source file or self-reference marker | "src/types.ts", "THIS DECISION" |
| Extraction Method | How to extract content from source | "@extract-shapes", "Rule blocks" |

| Marker | Meaning |
| --- | --- |
| THIS DECISION | Extract from the current decision document |
| THIS DECISION (Rule: X) | Extract specific Rule: block from current document |
| THIS DECISION (DocString) | Extract fenced code blocks from current document |

| Extraction Method | Source Type | Action |
| --- | --- | --- |
| Decision rule description | Decision (.feature) | Extract Rule: block content (Invariant, Rationale) |
| @extract-shapes tag | TypeScript (.ts) | Invoke shape extractor for @libar-docs-extract-shapes |
| Rule blocks | Behavior spec (.feature) | Extract Rule: names and descriptions |
| Scenario Outline Examples | Behavior spec (.feature) | Extract Examples tables as markdown |
| JSDoc section | TypeScript (.ts) | Extract markdown from JSDoc comments |
| createViolation() patterns | TypeScript (.ts) | Extract error message literals |
| Fenced code block | Decision (.feature) | Extract DocString code blocks with language |



*[doc-generation-proof-of-concept.feature](delivery-process/specs/doc-generation-proof-of-concept.feature)*

---

## Delivery Process / Phase 28

### ScopedArchitecturalView

*Full architecture diagrams show every annotated pattern in the project.*

#### Scope filtering selects patterns by context, view, or name

- **Invariant:** A pattern matches a DiagramScope if ANY of three conditions hold: its name is in `scope.patterns`, its `archContext` is in `scope.archContext`, or any of its `archView` entries is in `scope.archView`. These dimensions are OR'd together -- a pattern need only match one.

- **Rationale:** Three filter dimensions cover different authoring workflows. Explicit names for ad-hoc documents, archContext for bounded context views, archView for cross-cutting architectural perspectives.



#### Neighbor discovery finds connected patterns outside scope

- **Invariant:** Patterns connected to scope patterns via relationship edges (uses, dependsOn, implementsPatterns, extendsPattern) but NOT themselves in scope appear in a "Related" subgraph with dashed border styling.

- **Rationale:** Scoped views need context. Showing only in-scope patterns without their dependencies loses critical relationship information. Neighbor patterns provide this context without cluttering the main view.



#### Multiple diagram scopes compose in sequence

- **Invariant:** When `diagramScopes` is an array, each scope produces its own Mermaid diagram section with independent title, direction, and pattern selection. At summary detail level, all diagrams are suppressed.

- **Rationale:** A single reference document may need multiple architectural perspectives. Pipeline Overview shows both a codec transformation view (TB) and a pipeline data flow view (LR) in the same document.



*[scoped-architectural-view.feature](delivery-process/specs/scoped-architectural-view.feature)*

### UniversalDocGeneratorRobustness

*This feature transforms the PoC document generator into a production-ready*

#### Context - PoC limitations prevent monorepo-scale operation

**The Problem:**

    The DecisionDocGenerator PoC (Phase 27) successfully demonstrated code-first
    documentation generation, but has reliability issues that prevent scaling:

    **Why Fix Before Adding Features:**

    The monorepo has 210 manually maintained docs.

| Issue | Impact | Example |
| --- | --- | --- |
| Content duplication | Confusing output | "Protection Levels" appears twice |
| No validation | Silent failures | Missing files produce empty sections |
| Scattered warnings | Hard to debug | console.warn in source-mapper.ts:149,339 |
| No file validation | Runtime errors | Invalid paths crash extraction |

| Metric | Current | Target |
| --- | --- | --- |
| Duplicate sections | Common | Zero (fingerprint dedup) |
| Invalid mapping errors | Silent | Explicit validation errors |
| Warning visibility | console.warn | Structured Result warnings |
| File validation | None | Pre-flight existence check |



#### Decision - Robustness requires four coordinated improvements

**Architecture:**

    

    **Deliverable Ownership:**

| Deliverable | Module | Responsibility |
| --- | --- | --- |
| Content Deduplication | src/generators/content-deduplicator.ts | Remove duplicate sections |
| Validation Layer | src/generators/source-mapping-validator.ts | Pre-flight checks |
| Warning Collector | src/generators/warning-collector.ts | Unified warning handling |
| File Validation | Integrated into validator | Existence + readability |



#### Duplicate content must be detected and merged

Content fingerprinting identifies duplicate sections extracted from multiple
    sources.



#### Invalid source mappings must fail fast with clear errors

Pre-flight validation catches configuration errors before extraction begins.



#### Warnings must be collected and reported consistently

The warning collector replaces scattered console.warn calls with a
    structured system that aggregates warnings and reports them consistently.



#### Consequence - Improved reliability at cost of stricter validation

**Positive:**

    - Duplicate content eliminated from generated docs
    - Configuration errors caught before extraction
    - Debugging simplified with structured warnings
    - Ready for monorepo-scale operation

    **Negative:**

    - Existing source mappings may need updates to pass validation
    - Strict validation may require more upfront configuration
    - Additional processing overhead for deduplication

    **Migration:**

    Existing decision documents using the PoC generator may need updates:
    1.



*[universal-doc-generator-robustness.feature](delivery-process/specs/universal-doc-generator-robustness.feature)*

---

## Delivery Process / Phase 30

### ReferenceDocShowcase

*The Reference Generation Sample document exercises a small fraction of the*

#### Deep behavior rendering replaces shallow truncation

- **Invariant:** At standard and detailed levels, behavior sections render full rule descriptions with parsed invariant, rationale, and verified-by content. At summary level, the 120-character truncation is preserved for compact output. Behavior rendering reuses parseBusinessRuleAnnotations from the convention extractor rather than reimplementing structured content parsing.

- **Rationale:** The current 120-character truncation discards invariants, rationale, and verified-by content that is already extracted and available in BusinessRule.description. Reference documents need the full rule content to serve as authoritative documentation. The convention extractor already parses this structured content via parseBusinessRuleAnnotations -- the behavior builder should delegate to the same function.



#### Shape sections include JSDoc prose and property documentation

- **Invariant:** At standard level, shape code blocks are preceded by JSDoc prose when available. At detailed level, interface shapes additionally render a property documentation table. At summary level, only the type-kind table appears. Shapes without JSDoc render code blocks without preceding paragraph.

- **Rationale:** JSDoc on shapes contains design rationale and usage guidance that is already extracted by the shape extractor. Gating it behind detailed level wastes the data at the most common detail level (standard). The fix is a single condition change: reference.ts line 342 from detailLevel === 'detailed' to detailLevel !== 'summary'.



#### Diagram scope supports archLayer filtering and multiple diagram types

- **Invariant:** DiagramScope gains optional archLayer and diagramType fields. The archLayer filter selects patterns by their architectural layer (domain, application, infrastructure) and composes with archContext and archView via OR logic, consistent with existing filter dimensions. The diagramType field controls Mermaid output format: graph (default), sequenceDiagram, stateDiagram-v2, C4Context, classDiagram. Each diagram type has its own node and edge syntax appropriate to the Mermaid specification.

- **Rationale:** Layer-based views are fundamental to layered architecture documentation -- a developer reviewing the domain layer wants only deciders and value objects, not infrastructure adapters. Multiple diagram types unlock event flow documentation (sequence), FSM visualization (state), architecture overview (C4), and type hierarchy views (class) that flowcharts cannot express naturally.



#### Every renderable block type appears in the showcase document

- **Invariant:** The generated REFERENCE-SAMPLE.md at detailed level must contain at least one instance of each of the 9 block types: heading, paragraph, separator, table, list, code, mermaid, collapsible, link-out. At summary level, progressive disclosure blocks (collapsible, link-out) are omitted for compact output.

- **Rationale:** The sample document is the integration test for the reference codec. If any block type is missing, there is no automated verification that the codec can produce it. Coverage of all 9 types validates the full rendering pipeline from MasterDataset through codec through renderer.



#### Edge labels and custom node shapes enrich diagram readability

- **Invariant:** Relationship edges in scoped diagrams display labels describing the relationship semantics (uses, dependsOn, implements, extends). Edge labels are enabled by default and can be disabled via a showEdgeLabels option for compact diagrams. Node shapes vary by archRole value -- services use rounded rectangles, bounded contexts use subgraphs, projections use cylinders, and sagas use hexagons.

- **Rationale:** Unlabeled edges are ambiguous -- a reader seeing a solid arrow cannot distinguish "uses" from "implements" without consulting an edge style legend. Custom node shapes leverage Mermaid's shape vocabulary to make archRole visually distinguishable without color reliance, improving accessibility.



#### Extraction pipeline surfaces complete API documentation

- **Invariant:** ExportInfo.signature shows full function parameter types and return type instead of the placeholder value. JSDoc param, returns, and throws tags are extracted and stored on ExtractedShape. Property-level JSDoc preserves full multi-line content without first-line truncation. Auto-shape discovery mode extracts all exported types from files matching shapeSources globs without requiring explicit extract-shapes annotations.

- **Rationale:** Function signatures are the most valuable API surface -- they show what a pattern exports without source navigation. The ExportInfo.signature field already exists in the schema but holds a lossy placeholder. The fix is approximately 15 lines in ast-parser.ts: threading sourceCode into extractFromDeclaration and slicing parameter ranges. Auto-shape discovery eliminates manual annotation burden for files that match shapeSources globs.



#### Infrastructure enables flexible document composition and AI-optimized output

- **Invariant:** CompositeCodec assembles reference documents from multiple codec outputs by concatenating RenderableDocument sections. The renderToClaudeContext renderer produces token-efficient output using section markers optimized for LLM consumption. The Gherkin tag extractor uses TagRegistry metadata instead of hardcoded if/else branches, making new tag addition a zero-code-change operation. Convention content can be extracted from TypeScript JSDoc blocks containing structured Invariant/Rationale annotations, not only from Gherkin Rule blocks.

- **Rationale:** CompositeCodec enables referenceDocConfigs to include content from any codec, not just the current 4 sources. The renderToClaudeContext renderer unifies two formatting paths (codec-based markdown vs hand-written markers in context-formatter.ts). Data-driven tag extraction cuts the maintenance burden of the 40-branch if/else in gherkin-ast-parser.ts roughly in half. TypeScript convention extraction enables self-documenting business rules in implementation files alongside their code.



*[reference-doc-showcase.feature](delivery-process/specs/reference-doc-showcase.feature)*

---

## Delivery Process / Phase 31

### DeclarationLevelShapeTagging

*The current shape extraction system operates at file granularity.*

#### Declarations opt in via libar-docs-shape tag

- **Invariant:** Only declarations with the libar-docs-shape tag in their immediately preceding JSDoc are collected as tagged shapes. Declarations without the tag are ignored even if they are exported. The tag value is optional -- bare libar-docs-shape opts in without a group, while libar-docs-shape group-name assigns the declaration to a named group. Tagged non-exported declarations are included (DD-7).

- **Rationale:** Explicit opt-in prevents over-extraction of internal helpers. Unlike auto-discovery mode (extract-shapes *) which grabs all exports, declaration-level tagging gives precise control. This matches how TypeDoc uses public/internal tags -- the annotation lives next to the code it describes, surviving refactors without breaking extraction.



#### Reference doc configs select shapes via shapeSelectors

- **Invariant:** shapeSelectors provides three selection modes: by source path + specific names (DD-6 source+names variant), by group tag (DD-6 group variant), or by source path alone (DD-6 source-only variant). shapeSources remains for backward compatibility. When both are present, shapeSources provides the coarse file-level filter and shapeSelectors adds fine-grained name/group filtering on top.

- **Rationale:** The reference doc system composes focused documents from cherry-picked content. Every other content axis (conventions, behaviors, diagrams) has content-level filtering. shapeSources was the only axis limited to file-level granularity. shapeSelectors closes this gap with the same explicitness as conventionTags.



#### Discovery uses existing estree parser with JSDoc comment scanning

- **Invariant:** The discoverTaggedShapes function uses the existing typescript-estree parse() and extractPrecedingJsDoc() approach. It does not require the TypeScript compiler API, ts-morph, or parseAndGenerateServices. Tag detection is a regex match on the JSDoc comment text already extracted by the existing infrastructure. The tag regex pattern is: /libar-docs-shape(?:\s+(\S+))?/ where capture group 1 is the optional group name.

- **Rationale:** The shape extractor already traverses declarations and extracts their JSDoc. Adding libar-docs-shape detection is a string search on content that is already available -- approximately 15 lines of new logic. Switching parsers would introduce churn with no benefit for the v1 use case of tag detection on top-level declarations.



*[declaration-level-shape-tagging.feature](delivery-process/specs/declaration-level-shape-tagging.feature)*

---

## Delivery Process / Phase 99

### MvpWorkflowImplementation

*PDR-005 defines a 4-state workflow FSM (`roadmap, active, completed, deferred`)*

#### PDR-005 status values are recognized



#### Generators map statuses to documents



*[mvp-workflow-implementation.feature](delivery-process/specs/mvp-workflow-implementation.feature)*

### PatternRelationshipModel

*The delivery process lacks a comprehensive relationship model between artifacts.*

#### Code files declare pattern realization via implements tag

- **Invariant:** Files with `@libar-docs-implements:PatternName,OtherPattern` are linked to the specified patterns without causing conflicts. Pattern definitions remain in roadmap specs; implementation files provide supplementary metadata. Multiple files can implement the same pattern, and one file can implement multiple patterns.

- **Rationale:** This mirrors UML's "realization" relationship where a class implements an interface. Code realizes the specification. Direction is code→spec (backward link). CSV format allows a single implementation file to realize multiple patterns when implementing a pattern family (e.g., durability primitives).

**Implementation:** `src/taxonomy/registry-builder.ts`



#### Pattern inheritance uses extends relationship tag

- **Invariant:** Files with `@libar-docs-extends:BasePattern` declare that they extend another pattern's capabilities. This is a generalization relationship where the extending pattern is a specialization of the base pattern.

- **Rationale:** Pattern families exist where specialized patterns build on base patterns. For example, `ReactiveProjections` extends `ProjectionCategories`. The extends relationship enables inheritance-based documentation and validates pattern hierarchy.

**Implementation:** `src/taxonomy/registry-builder.ts`



#### Technical dependencies use directed relationship tags

- **Invariant:** `@libar-docs-uses` declares outbound dependencies (what this pattern depends on). `@libar-docs-used-by` declares inbound dependencies (what depends on this pattern). Both are CSV format.

- **Rationale:** These represent technical coupling between patterns. The distinction matters for impact analysis: changing a pattern affects its `used-by` consumers but not its `uses` dependencies.



#### Roadmap sequencing uses ordering relationship tags

- **Invariant:** `@libar-docs-depends-on` declares what must be completed first (roadmap sequencing). `@libar-docs-enables` declares what this unlocks when completed. These are planning relationships, not technical dependencies.

- **Rationale:** Sequencing is about order of work, not runtime coupling. A pattern may depend on another being complete without using its code.



#### Cross-tier linking uses traceability tags (PDR-007)

- **Invariant:** `@libar-docs-executable-specs` on roadmap specs points to test locations. `@libar-docs-roadmap-spec` on package specs points back to the pattern. These create bidirectional traceability.

- **Rationale:** Two-tier architecture (PDR-007) separates planning specs from executable tests. Traceability tags maintain the connection for navigation and completeness checking.



#### Epic/Phase/Task hierarchy uses parent-child relationships

- **Invariant:** `@libar-docs-level` declares the hierarchy tier (epic, phase, task). `@libar-docs-parent` links to the containing pattern. This enables rollup progress tracking.

- **Rationale:** Large initiatives decompose into phases and tasks. The hierarchy allows progress aggregation (e.g., "Epic 80% complete based on child phases").



#### All relationships appear in generated documentation

- **Invariant:** The PATTERNS.md dependency graph renders all relationship types with distinct visual styles. Pattern detail pages list all related artifacts grouped by relationship type.

- **Rationale:** Visualization makes the relationship model accessible. Different arrow styles distinguish relationship semantics at a glance. | Relationship | Arrow Style | Direction | Description | | uses | --> (solid) | OUT | Technical dependency | | depends-on | -.-> (dashed) | OUT | Roadmap sequencing | | implements | ..-> (dotted) | CODE→SPEC | Realization | | extends | -->> (solid open) | CHILD→PARENT | Generalization |

| Relationship | Arrow Style | Direction | Description |
| --- | --- | --- | --- |
| uses | --> (solid) | OUT | Technical dependency |
| depends-on | -.-> (dashed) | OUT | Roadmap sequencing |
| implements | ..-> (dotted) | CODE→SPEC | Realization |
| extends | -->> (solid open) | CHILD→PARENT | Generalization |



#### Linter detects relationship violations

- **Invariant:** The pattern linter validates that all relationship targets exist, implements files don't have pattern tags, and bidirectional links are consistent.

- **Rationale:** Broken relationships cause confusion and incorrect generated docs. Early detection during linting prevents propagation of errors.



*[pattern-relationship-model.feature](delivery-process/specs/pattern-relationship-model.feature)*

### PrdImplementationSection

*Implementation files with `@libar-docs-implements:PatternName` contain rich*

#### PRD generator discovers implementations from relationship index

- **Invariant:** When generating PRD for pattern X, the generator queries the relationship index for all files where `implements === X`. No explicit listing in the spec file is required.

- **Rationale:** The `@libar-docs-implements` tag creates a backward link from code to spec. The relationship index aggregates these. PRD generation simply queries the index rather than scanning directories.



#### Implementation metadata appears in dedicated PRD section

- **Invariant:** The PRD output includes a "## Implementations" section listing all files that implement the pattern. Each file shows its `uses`, `usedBy`, and `usecase` metadata in a consistent format.

- **Rationale:** Developers reading PRDs benefit from seeing the implementation landscape alongside requirements, without cross-referencing code files.



#### Patterns without implementations render cleanly

- **Invariant:** If no files have `@libar-docs-implements:X` for pattern X, the "## Implementations" section is omitted (not rendered as empty).

- **Rationale:** Planned patterns may not have implementations yet. Empty sections add noise without value.



*[prd-generator-code-annotations-inclusion.feature](delivery-process/specs/prd-generator-code-annotations-inclusion.feature)*

### ProcessGuardLinter

*During planning and implementation sessions, accidental modifications occur:*

#### Protection levels determine modification restrictions

Files inherit protection from their `@libar-docs-status` tag.



#### Session definition files scope what can be modified

Optional session files (`delivery-process/sessions/*.feature`) explicitly
    declare which specs are in-scope for modification during a work session.



#### Status transitions follow PDR-005 FSM

When a file's status changes, the transition must be valid per PDR-005.



#### Active specs cannot add new deliverables

Once a spec transitions to `active`, its deliverables table is
    considered scope-locked.



#### CLI provides flexible validation modes



#### Integrates with existing lint infrastructure



#### New tags support process guard functionality

The following tags are defined in the TypeScript taxonomy to support process guard:



*[process-guard-linter.feature](delivery-process/specs/process-guard-linter.feature)*

### StatusAwareEslintSuppression

*Design artifacts (code stubs with `@libar-docs-status roadmap`) intentionally have unused*

#### File status determines unused-vars enforcement

- **Invariant:** Files with `@libar-docs-status roadmap` or `deferred` have relaxed unused-vars rules. Files with `active`, `completed`, or no status have strict enforcement.

- **Rationale:** Design artifacts (roadmap stubs) define API shapes that are intentionally unused until implementation. Relaxing rules for these files prevents false positives while ensuring implemented code (active/completed) remains strictly checked. | Status | Protection Level | unused-vars Behavior | | roadmap | none | Relaxed (warn, ignore args) | | deferred | none | Relaxed (warn, ignore args) | | active | scope | Strict (error) | | complete | hard | Strict (error) | | (no status) | N/A | Strict (error) |

| Status | Protection Level | unused-vars Behavior |
| --- | --- | --- |
| roadmap | none | Relaxed (warn, ignore args) |
| deferred | none | Relaxed (warn, ignore args) |
| active | scope | Strict (error) |
| complete | hard | Strict (error) |
| (no status) | N/A | Strict (error) |



#### Reuses deriveProcessState for status extraction

- **Invariant:** Status extraction logic must be shared with Process Guard Linter. No duplicate parsing or status-to-protection mapping.

- **Rationale:** DRY principle - the Process Guard already has battle-tested status extraction from JSDoc comments. Duplicating this logic creates maintenance burden and potential inconsistencies between tools.



#### ESLint Processor filters messages based on status

- **Invariant:** The processor uses ESLint's postprocess hook to filter or downgrade messages. Source code is never modified. No eslint-disable comments are injected.

- **Rationale:** ESLint processors can inspect and filter linting messages after rules run. This approach: - Requires no source code modification - Works with any ESLint rule (not just no-unused-vars) - Can be extended to other status-based behaviors



#### CLI can generate static ESLint ignore list

- **Invariant:** Running `pnpm lint:process --eslint-ignores` outputs a list of files that should have relaxed linting, suitable for inclusion in eslint.config.js.

- **Rationale:** For CI environments or users preferring static configuration, a generated list provides an alternative to runtime processing. The list can be regenerated whenever status annotations change.



#### Replaces directory-based ESLint exclusions

- **Invariant:** After implementation, the directory-based exclusions in eslint.config.js (lines 30-57) are removed. All suppression is driven by @libar-docs-status annotations.

- **Rationale:** Directory-based exclusions are tech debt: - They don't account for file lifecycle (roadmap -> completed) - They require manual updates when new roadmap directories are added - They persist even after files are implemented



#### Rule relaxation is configurable

- **Invariant:** The set of rules relaxed for roadmap/deferred files is configurable, defaulting to `@typescript-eslint/no-unused-vars`.

- **Rationale:** Different projects may want to relax different rules for design artifacts. The default covers the common case (unused exports in API stubs).



*[status-aware-eslint-suppression.feature](delivery-process/specs/status-aware-eslint-suppression.feature)*

### StreamingGitDiff

*The process guard (`lint-process --all`) fails with `ENOBUFS` error on large*

#### Git commands stream output instead of buffering



#### Diff content is parsed as it streams



#### Streaming errors are handled gracefully



*[streaming-git-diff.feature](delivery-process/specs/streaming-git-diff.feature)*

### TestContentBlocks

*This feature demonstrates what content blocks are captured and rendered*

#### Business rules appear as a separate section

Rule descriptions provide context for why this business rule exists.



#### Multiple rules create multiple Business Rule entries

Each Rule keyword creates a separate entry in the Business Rules section.



*[test-content-blocks.feature](tests/features/poc/test-content-blocks.feature)*

---

## Delivery Process / Phase 100

### BusinessRulesGenerator

*Enable stakeholders to understand domain constraints without reading*

#### Extracts Rule blocks with Invariant and Rationale

- **Invariant:** Every `Rule:` block with `**Invariant:**` annotation must be extracted. Rules without annotations are included with rule name only.

- **Rationale:** Business rules are the core domain constraints. Extracting them separately from acceptance criteria creates a focused reference document for domain understanding.



#### Organizes rules by domain category and phase

- **Invariant:** Rules are grouped first by domain category (from `@libar-docs-*` flags), then by phase number for temporal ordering.

- **Rationale:** Domain-organized documentation helps stakeholders find rules relevant to their area of concern without scanning all rules.



#### Preserves code examples and comparison tables

- **Invariant:** DocStrings (`"""typescript`) and tables in Rule descriptions are rendered in the business rules document.

- **Rationale:** Code examples and tables provide concrete understanding of abstract rules. Removing them loses critical context.



#### Generates scenario traceability links

- **Invariant:** Each rule's `**Verified by:**` section generates links to the scenarios that verify the rule.

- **Rationale:** Traceability enables audit compliance and helps developers find relevant tests when modifying rules.



*[business-rules-generator.feature](delivery-process/specs/business-rules-generator.feature)*

### CrossSourceValidation

*The delivery process uses dual sources (TypeScript phase files and Gherkin*

#### Pattern names must be consistent across sources



#### Circular dependencies are detected



#### Dependency references must resolve



*[cross-source-validation.feature](delivery-process/specs/cross-source-validation.feature)*

### GherkinRulesSupport

*Feature files were limited to flat scenario lists.*

#### Rules flow through the entire pipeline without data loss

The @cucumber/gherkin parser extracts Rules natively.



#### Generators can render rules as business documentation

Business stakeholders see rule names and descriptions as "Business Rules"
    sections, not Given/When/Then syntax.



#### Custom content blocks render in acceptance criteria

DataTables and DocStrings in steps should appear in generated documentation,
    providing structured data and code examples alongside step descriptions.



#### vitest-cucumber executes scenarios inside Rules

Test execution must work for scenarios inside Rule blocks.



*[gherkin-rules-support.feature](delivery-process/specs/gherkin-rules-support.feature)*

### PhaseNumberingConventions

*Phase numbers are assigned manually without validation, leading to*

#### Phase numbers must be unique within a release



#### Phase number gaps are detected



#### CLI suggests next available phase number



*[phase-numbering-conventions.feature](delivery-process/specs/phase-numbering-conventions.feature)*

### PhaseStateMachineValidation

*Phase lifecycle state transitions are not enforced programmatically despite being documented in PROCESS_SETUP.md.*

#### Valid status values are enforced



#### Status transitions follow state machine rules



#### Terminal states require completion metadata



*[phase-state-machine.feature](delivery-process/specs/phase-state-machine.feature)*

### ReleaseAssociationRules

*PDR-002 and PDR-003 define conventions for separating specs from release*

#### Spec files must not contain release columns



#### TypeScript phase files must have required annotations



#### Release version follows semantic versioning



*[release-association-rules.feature](delivery-process/specs/release-association-rules.feature)*

### SessionFileCleanup

*Session files (docs-living/sessions/phase-*.md) are ephemeral working*

#### Cleanup triggers during session-context generation



#### Only phase-*.md files are candidates for cleanup



#### Cleanup failures are non-fatal



*[session-file-cleanup.feature](delivery-process/specs/session-file-cleanup.feature)*

---

## Delivery Process / Phase 101

### CliBehaviorTesting

*All 5 CLI commands (generate-docs, lint-patterns, lint-process, validate-patterns,*

#### generate-docs handles all argument combinations correctly

- **Invariant:** Invalid arguments produce clear error messages with usage hints. Valid arguments produce expected output files.

**Implementation:** `src/cli/generate-docs.ts`



#### lint-patterns validates annotation quality with configurable strictness

- **Invariant:** Lint violations are reported with file, line, and severity. Exit codes reflect violation presence based on strictness setting.

**Implementation:** `src/cli/lint-patterns.ts`



#### validate-patterns performs cross-source validation with DoD checks

- **Invariant:** DoD and anti-pattern violations are reported per phase. Exit codes reflect validation state.

**Implementation:** `src/cli/validate-patterns.ts`



#### All CLIs handle errors consistently with DocError pattern

- **Invariant:** Errors include type, file, line (when applicable), and reason. Unknown errors are caught and formatted safely.



*[cli-behavior-testing.feature](delivery-process/specs/cli-behavior-testing.feature)*

---

## Delivery Process / Phase 102

### CodecBehaviorTesting

*Of 17 document codecs in src/renderable/codecs/, only 3 have behavior specs:*

#### Timeline codecs group patterns by phase and status

- **Invariant:** Roadmap shows planned work, Milestones shows completed work, CurrentWork shows active patterns only.

**Implementation:** `src/renderable/codecs/timeline.ts`



#### Session codecs provide working context for AI sessions

- **Invariant:** SessionContext shows active patterns with deliverables. RemainingWork aggregates incomplete work by phase.

**Implementation:** `src/renderable/codecs/session.ts`



#### Requirements codec produces PRD-style documentation

- **Invariant:** Features include problem, solution, business value. Acceptance criteria are formatted with bold keywords.

**Implementation:** `src/renderable/codecs/requirements.ts`



#### Reporting codecs support release management and auditing

- **Invariant:** Changelog follows Keep a Changelog format. Traceability maps rules to scenarios.

**Implementation:** `src/renderable/codecs/reporting.ts`



#### Planning codecs support implementation sessions

- **Invariant:** Planning checklist includes DoD items. Session plan shows implementation steps.

**Implementation:** `src/renderable/codecs/planning.ts`



*[codec-behavior-testing.feature](delivery-process/specs/codec-behavior-testing.feature)*

---

## Delivery Process / Phase 103

### StepDefinitionCompletion

*7 feature files in tests/features/behavior/ have complete Gherkin specs*

#### Generator-related specs need step definitions for output validation

- **Invariant:** Step definitions test actual codec output against expected structure. Factory functions from tests/fixtures/ should be used for test data.



#### Renderable helper specs need step definitions for utility functions

- **Invariant:** Helper functions are pure and easy to unit test. Step definitions should test edge cases identified in specs.



#### Remaining specs in other directories need step definitions

**Existing Specs:**
    - `tests/features/generators/table-extraction.feature`
    - `tests/features/scanner/docstring-mediatype.feature`



#### Step definition implementation follows project patterns

**Pattern:** All step definitions should follow the established patterns in
    existing .steps.ts files for consistency.

    **Template:**
    

    **File Locations:**
    - Behavior steps: tests/steps/behavior/{feature-name}.steps.ts
    - Generator steps: tests/steps/generators/{feature-name}.steps.ts
    - Scanner steps: tests/steps/scanner/{feature-name}.steps.ts



*[step-definition-completion.feature](delivery-process/specs/step-definition-completion.feature)*

---

## Delivery Process / Phase 104

### GeneratorInfrastructureTesting

*Core generator infrastructure lacks behavior specs:*

#### Orchestrator coordinates full documentation generation pipeline

- **Invariant:** Orchestrator merges TypeScript and Gherkin patterns, handles conflicts, and produces requested document types.

**Implementation:** `src/generators/orchestrator.ts`



#### Registry manages generator registration and retrieval

- **Invariant:** Registry prevents duplicate names, returns undefined for unknown generators, and lists available generators alphabetically.

**Implementation:** `src/generators/registry.ts`



#### CodecBasedGenerator adapts codecs to generator interface

- **Invariant:** Generator delegates to underlying codec for transformation. Missing MasterDataset produces descriptive error.

**Implementation:** `src/generators/codec-based.ts`



#### Orchestrator supports PR changes generation options

- **Invariant:** PR changes can filter by git diff, changed files, or release version.

**Implementation:** `src/generators/orchestrator.ts`



*[generator-infrastructure-testing.feature](delivery-process/specs/generator-infrastructure-testing.feature)*

---

## DocGeneration / Uncategorized

### ContentDeduplication

*Multiple sources may extract identical content, leading to*

#### Duplicate detection uses content fingerprinting

- **Invariant:** Content with identical normalized text must produce identical fingerprints.

- **Rationale:** Fingerprinting enables efficient duplicate detection without full text comparison.



#### Duplicates are merged based on source priority

- **Invariant:** Higher-priority sources take precedence when merging duplicate content.

- **Rationale:** TypeScript sources have richer JSDoc; feature files provide behavioral context.



#### Section order is preserved after deduplication

- **Invariant:** Section order matches the source mapping table order after deduplication.

- **Rationale:** Predictable ordering ensures consistent documentation structure.



#### Deduplicator integrates with source mapper pipeline

- **Invariant:** Deduplication runs after extraction and before document assembly.

- **Rationale:** All content must be extracted before duplicates can be identified.



*[content-deduplication.feature](tests/features/doc-generation/content-deduplication.feature)*

### DecisionDocCodecTesting

*Validates the Decision Doc Codec that parses decision documents (ADR/PDR*

#### Rule blocks are partitioned by semantic prefix

Decision documents use Rule: blocks with semantic prefixes to organize
    content into Context, Decision, and Consequences sections (standard ADR
    format).



#### DocStrings are extracted with language tags

Decision documents contain code examples as Gherkin DocStrings.



#### Source mapping tables are parsed from rule descriptions

Decision documents define source mappings in markdown tables.



#### Self-reference markers are correctly detected

Source files can reference the current decision document using special
    markers like "THIS DECISION", "THIS DECISION (Rule: X)", etc.



#### Extraction methods are normalized to known types

The extraction method column can be written in various formats.



#### Complete decision documents are parsed with all content

The parseDecisionDocument function extracts all content from an ADR/PDR.



#### Rules can be found by name with partial matching

Self-references may not have an exact rule name match.



*[decision-doc-codec.feature](tests/features/doc-generation/decision-doc-codec.feature)*

### DecisionDocGeneratorTesting

*The Decision Doc Generator orchestrates the full documentation generation*

#### Output paths are determined from pattern metadata

The generator computes output paths based on pattern name and optional
    section configuration.



#### Compact output includes only essential content

Summary/compact output is limited to ~50 lines and includes only
    essential tables and type definitions for Claude context files.



#### Detailed output includes full content

Detailed output is ~300 lines and includes everything: JSDoc, examples,
    full descriptions, and all extracted content.



#### Multi-level generation produces both outputs

The generator can produce both compact and detailed outputs in a single
    pass for maximum utility.



#### Generator is registered with the registry

The generator is available in the registry under the name "doc-from-decision"
    and can be invoked through the standard generator interface.



#### Source mappings are executed during generation

Decision documents with source mapping tables trigger content aggregation
    from the referenced files during the generation process.



*[decision-doc-generator.feature](tests/features/doc-generation/decision-doc-generator.feature)*

### PocIntegration

*End-to-end integration tests that exercise the full documentation generation*

#### POC decision document is parsed correctly



#### Self-references extract content from POC decision



#### TypeScript shapes are extracted from real files



#### Behavior spec content is extracted correctly



#### JSDoc sections are extracted from CLI files



#### All source mappings execute successfully



#### Compact output generates correctly



#### Detailed output generates correctly



#### Generated output matches quality expectations



*[poc-integration.feature](tests/features/doc-generation/poc-integration.feature)*

### RobustnessIntegration

*Document generation pipeline needs validation, deduplication, and*

#### Validation runs before extraction in the pipeline

- **Invariant:** Validation must complete and pass before extraction begins.

- **Rationale:** Prevents wasted extraction work and provides clear fail-fast behavior.



#### Deduplication runs after extraction before assembly

- **Invariant:** Deduplication processes all extracted content before document assembly.

- **Rationale:** All sources must be extracted to identify cross-source duplicates.



#### Warnings from all stages are collected and reported

- **Invariant:** Warnings from all pipeline stages are aggregated in the result.

- **Rationale:** Users need visibility into non-fatal issues without blocking generation.



#### Pipeline provides actionable error messages

- **Invariant:** Error messages include context and fix suggestions.

- **Rationale:** Users should fix issues in one iteration without guessing.



#### Existing decision documents continue to work

- **Invariant:** Valid existing decision documents generate without new errors.

- **Rationale:** Robustness improvements must be backward compatible.



*[robustness-integration.feature](tests/features/doc-generation/robustness-integration.feature)*

### SourceMapperTesting

*The Source Mapper aggregates content from multiple source files based on*

#### Extraction methods dispatch to correct handlers

The source mapper dispatches to different extraction functions based on
    the extraction method specified in the source mapping table.



#### Self-references extract from current decision document

THIS DECISION markers extract content from the current decision document
    rather than requiring a separate file path.



#### Multiple sources are aggregated in mapping order

Multiple source mappings result in content extraction from each file.



#### Missing files produce warnings without failing

A referenced source file that does not exist produces a warning,
    but generation continues with available sources.



#### Empty extraction results produce info warnings

Extraction that succeeds but produces no content (e.g., no shapes found)
    results in an informational warning being logged.



#### Extraction methods are normalized for dispatch

The extraction method column can be written in various formats
    and is normalized before dispatch.



*[source-mapper.feature](tests/features/doc-generation/source-mapper.feature)*

### SourceMappingValidatorTesting

*Source mappings reference files that may not exist, use invalid*

#### Source files must exist and be readable

- **Invariant:** All source file paths in mappings must resolve to existing, readable files.

- **Rationale:** Prevents extraction failures and provides clear error messages upfront.



#### Extraction methods must be valid and supported

- **Invariant:** Extraction methods must match a known method from the supported set.

- **Rationale:** Invalid methods cannot extract content; suggest valid alternatives.



#### Extraction methods must be compatible with file types

- **Invariant:** Method-file combinations must be compatible (e.g., TypeScript methods for .ts files).

- **Rationale:** Incompatible combinations fail at extraction; catch early with clear guidance.



#### Source mapping tables must have required columns

- **Invariant:** Tables must contain Section, Source File, and Extraction Method columns.

- **Rationale:** Missing columns prevent extraction; alternative column names are mapped.



#### All validation errors are collected and returned together

- **Invariant:** Validation collects all errors before returning, not just the first.

- **Rationale:** Enables users to fix all issues in a single iteration.



*[source-mapping-validator.feature](tests/features/doc-generation/source-mapping-validator.feature)*

### TaxonomyCodecTesting

*Validates the Taxonomy Codec that transforms MasterDataset into a*

#### Document metadata is correctly set

The taxonomy document has standard metadata fields for title, purpose,
    and detail level that describe the generated content.



#### Categories section is generated from TagRegistry

The categories section lists all configured tag categories with their
    domain, priority, and description in a sortable table.



#### Metadata tags can be grouped by domain

The groupByDomain option organizes metadata tags into subsections
    by their semantic domain (Core, Relationship, Timeline, etc.).



#### Tags are classified into domains by hardcoded mapping

The domain classification is intentionally hardcoded for documentation
    stability.



#### Optional sections can be disabled via codec options

The codec supports disabling format types, presets, and architecture
    diagram sections for compact output generation.



#### Detail files are generated for progressive disclosure

The generateDetailFiles option creates additional files for
    categories, metadata tags, and format types with detailed content.



#### Format types are documented with descriptions and examples

The Format Types section documents all supported tag value formats
    with descriptions and examples for each type.



*[taxonomy-codec.feature](tests/features/doc-generation/taxonomy-codec.feature)*

### ValidationRulesCodecTesting

*Validates the Validation Rules Codec that transforms MasterDataset into a*

#### Document metadata is correctly set

The validation rules document has standard metadata fields for title,
    purpose, and detail level.



#### All validation rules are documented in a table

The rules table includes all 6 Process Guard validation rules with
    their severity levels and descriptions.



#### FSM state diagram is generated from transitions

The Mermaid diagram shows all valid state transitions for the
    Process Guard FSM.



#### Protection level matrix shows status protections

The protection matrix documents which statuses have which protection
    levels (none, scope-locked, hard-locked).



#### CLI usage is documented with options and exit codes

The CLI section shows how to invoke the Process Guard linter
    with various options.



#### Escape hatches are documented for special cases

The escape hatches section documents how to override Process Guard
    validation for legitimate use cases.



*[validation-rules-codec.feature](tests/features/doc-generation/validation-rules-codec.feature)*

### WarningCollectorTesting

*The warning collector provides a unified system for capturing, categorizing,*

#### Warnings are captured with source context

Each warning includes the source location, category, and message to
    enable debugging and targeted fixes.



#### Warnings are categorized for filtering and grouping

Warning categories enable filtering by severity, source, or type
    for different reporting needs.



#### Warnings are aggregated across the pipeline

The collector aggregates warnings from all pipeline stages, maintaining
    insertion order and source attribution.



#### Warnings integrate with the Result pattern

The warning collector integrates with Result<T, E> to include warnings
    in successful results, enabling callers to inspect non-fatal issues.



#### Warnings can be formatted for different outputs

The collector provides formatters for console output, JSON, and
    markdown to support different reporting needs.



#### Existing console.warn calls are migrated to collector

All console.warn calls in the source mapper and related modules
    are replaced with warning collector calls.



*[warning-collector.feature](tests/features/doc-generation/warning-collector.feature)*

---

## Extractor / Uncategorized

### DeclarationLevelShapeTaggingTesting

*Tests the discoverTaggedShapes function that scans TypeScript source*

#### Declarations opt in via libar-docs-shape tag

- **Invariant:** Only declarations with the libar-docs-shape tag in their immediately preceding JSDoc are collected as tagged shapes.



#### Discovery uses existing estree parser with JSDoc comment scanning

- **Invariant:** The discoverTaggedShapes function uses the existing typescript-estree parse() and extractPrecedingJsDoc() approach.



*[declaration-level-shape-tagging.feature](tests/features/extractor/declaration-level-shape-tagging.feature)*

### DualSourceExtractorTesting

*- Pattern data split across code stubs and feature files*

#### Process metadata is extracted from feature tags



#### Deliverables are extracted from Background tables



#### Code and feature patterns are combined into dual-source patterns



#### Dual-source results are validated for consistency



*[dual-source-extraction.feature](tests/features/extractor/dual-source-extraction.feature)*

### ExtractionPipelineEnhancementsTesting

*Validates extraction pipeline capabilities for ReferenceDocShowcase:*

#### Function signatures surface full parameter types in ExportInfo

- **Invariant:** ExportInfo.signature shows full parameter types and return type instead of the placeholder value.



#### Property-level JSDoc preserves full multi-line content

- **Invariant:** Property-level JSDoc preserves full multi-line content without first-line truncation.



#### Param returns and throws tags are extracted from function JSDoc

- **Invariant:** JSDoc param, returns, and throws tags are extracted and stored on ExtractedShape for function-kind shapes.



#### Auto-shape discovery extracts all exported types via wildcard

- **Invariant:** When extract-shapes tag value is the wildcard character, all exported declarations are extracted without listing names.



*[extraction-pipeline-enhancements.feature](tests/features/extractor/extraction-pipeline-enhancements.feature)*

### ShapeExtractionTesting

*Validates the shape extraction system that extracts TypeScript type*

#### extract-shapes tag exists in registry with CSV format



#### Interfaces are extracted from TypeScript AST



#### Property-level JSDoc is extracted for interface properties

The extractor uses strict adjacency (gap = 1 line) to prevent
    interface-level JSDoc from being misattributed to the first property.



#### Type aliases are extracted from TypeScript AST



#### Enums are extracted from TypeScript AST



#### Function signatures are extracted with body omitted



#### Multiple shapes are extracted in specified order



#### Extracted shapes render as fenced code blocks



#### Imported and re-exported shapes are tracked separately



#### Const declarations are extracted from TypeScript AST



#### Invalid TypeScript produces error result



#### Non-exported shapes are extractable



#### Shape rendering supports grouping options



#### Large source files are rejected to prevent memory exhaustion



*[shape-extraction.feature](tests/features/extractor/shape-extraction.feature)*

---

## Generator / Uncategorized

### BusinessRulesDocumentCodec

*Tests the BusinessRulesCodec transformation from MasterDataset to RenderableDocument.*

#### Extracts Rule blocks with Invariant and Rationale



#### Organizes rules by product area and phase



#### Summary mode generates compact output



#### Preserves code examples and tables in detailed mode



#### Generates scenario traceability links



*[business-rules-codec.feature](tests/features/generators/business-rules-codec.feature)*

### CodecBasedGeneratorTesting

*Tests the CodecBasedGenerator which adapts the RenderableDocument Model (RDM)*

#### CodecBasedGenerator adapts codecs to generator interface



*[codec-based.feature](tests/features/generators/codec-based.feature)*

### DocumentationOrchestrator

*Tests the orchestrator's pattern merging, conflict detection, and generator*

#### Orchestrator coordinates full documentation generation pipeline



*[orchestrator.feature](tests/features/generators/orchestrator.feature)*

### GeneratorRegistryTesting

*Tests the GeneratorRegistry registration, lookup, and listing capabilities.*

#### Registry manages generator registration and retrieval



*[registry.feature](tests/features/generators/registry.feature)*

### PrChangesOptions

*Tests the PrChangesCodec filtering capabilities for generating PR-scoped*

#### Orchestrator supports PR changes generation options



*[pr-changes-options.feature](tests/features/generators/pr-changes-options.feature)*

### PrdImplementationSection

*Tests the Implementations section rendering in pattern documents.*

#### Implementation files appear in pattern docs via @libar-docs-implements



#### Multiple implementations are listed alphabetically



#### Patterns without implementations omit the section



#### Implementation references use relative file links



*[prd-implementation-section.feature](tests/features/generators/prd-implementation-section.feature)*

### ReferenceGeneratorTesting

*Registers all 13 reference document generators.*

#### Registration produces the correct number of generators



#### Generator naming follows kebab-case convention



#### Generator execution produces markdown output



*[reference-generators.feature](tests/features/behavior/codecs/reference-generators.feature)*

### TableExtraction

*Tables in business rule descriptions should appear exactly once in output.*

#### Tables in rule descriptions render exactly once



#### Multiple tables in description each render exactly once



#### stripMarkdownTables removes table syntax from text



*[table-extraction.feature](tests/features/generators/table-extraction.feature)*

---

## PatternRelationship / Uncategorized

### MermaidRelationshipRendering

*Tests for rendering all relationship types in Mermaid dependency graphs*

#### Each relationship type has a distinct arrow style



#### Pattern names are sanitized for Mermaid node IDs



#### All relationship types appear in single graph



*[mermaid-rendering.feature](tests/features/behavior/pattern-relationships/mermaid-rendering.feature)*

---

## Pipeline / Uncategorized

### ContextInference

*Patterns in standard directories (src/validation/, src/scanner/) should*

#### matchPattern supports recursive wildcard **



#### matchPattern supports single-level wildcard /*



#### matchPattern supports prefix matching



#### inferContext returns undefined when no rules match



#### inferContext applies first matching rule



#### Explicit archContext is not overridden



#### Inference works independently of archLayer



#### Default rules map standard directories



*[context-inference.feature](tests/features/behavior/context-inference.feature)*

---

## POC / Uncategorized

### RuleKeywordPoC

*This feature tests whether vitest-cucumber supports the Rule keyword*

#### Basic arithmetic operations work correctly

The calculator should perform standard math operations
    with correct results.



#### Division has special constraints

Division by zero must be handled gracefully to prevent
    system errors.



*[rule-keyword-poc.feature](tests/features/poc/rule-keyword-poc.feature)*

---

## Scanner / Uncategorized

### DocStringMediaType

*DocString language hints (mediaType) should be preserved through the parsing*

#### Parser preserves DocString mediaType during extraction



#### MediaType is used when rendering code blocks



#### renderDocString handles both string and object formats



*[docstring-mediatype.feature](tests/features/scanner/docstring-mediatype.feature)*

---

## Validation / Uncategorized

### AntiPatternDetectorTesting

*- Dependencies in features (should be code-only) cause drift*

#### Process metadata should not appear in TypeScript code



#### Generator hints should not appear in feature files



#### Feature files should not have excessive scenarios



#### Feature files should not exceed size thresholds



#### All anti-patterns can be detected in one pass



#### Violations can be formatted for console output



*[anti-patterns.feature](tests/features/validation/anti-patterns.feature)*

### DetectChangesTesting

*Tests for the detectDeliverableChanges function that parses git diff output.*

#### Status changes are detected as modifications not additions



#### New deliverables are detected as additions



#### Removed deliverables are detected as removals



#### Mixed changes are correctly categorized



#### Non-deliverable tables are ignored



*[detect-changes.feature](tests/features/validation/detect-changes.feature)*

### DoDValidatorTesting

*- Phases marked "completed" without all deliverables done*

#### Deliverable completion uses canonical status taxonomy



#### Acceptance criteria must be tagged with @acceptance-criteria



#### Acceptance criteria scenarios can be extracted by name



#### DoD requires all deliverables complete and AC present



#### DoD can be validated across multiple completed phases



#### Summary can be formatted for console output



*[dod-validator.feature](tests/features/validation/dod-validator.feature)*

### FSMValidatorTesting

*- Status values must conform to PDR-005 FSM states*

#### Status values must be valid PDR-005 FSM states



#### Status transitions must follow FSM rules



#### Completed patterns should have proper metadata



#### Protection levels match FSM state definitions



#### Combined validation provides complete results



*[fsm-validator.feature](tests/features/validation/fsm-validator.feature)*

### ProcessGuard

*- Completed specs modified without explicit unlock reason*

#### Completed files require unlock-reason to modify



#### Status transitions must follow PDR-005 FSM



#### Active specs cannot add new deliverables



#### Files outside active session scope trigger warnings



#### Explicitly excluded files trigger errors



#### Multiple rules validate independently



*[process-guard.feature](tests/features/validation/process-guard.feature)*

### StatusTransitionDetectionTesting

*Tests for the detectStatusTransitions function that parses git diff output.*

#### Status transitions are detected from file-level tags



#### Status tags inside docstrings are ignored



#### First valid status tag outside docstrings is used



#### Line numbers are tracked from hunk headers



#### Generated documentation directories are excluded



*[status-transition-detection.feature](tests/features/validation/status-transition-detection.feature)*

---
