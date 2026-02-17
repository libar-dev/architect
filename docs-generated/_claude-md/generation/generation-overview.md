=== GENERATION OVERVIEW ===

Purpose: Generation product area overview
Detail Level: Compact summary

**How does code become docs?** Codecs, generators, rendering, diagrams.


=== API TYPES ===

| Type | Kind |
| --- | --- |
| RenderableDocument | type |
| SectionBlock | type |
| HeadingBlock | type |
| TableBlock | type |
| ListBlock | type |
| CodeBlock | type |
| MermaidBlock | type |
| CollapsibleBlock | type |
| RuntimeMasterDataset | interface |
| RawDataset | interface |
| transformToMasterDataset | function |


=== BEHAVIOR SPECIFICATIONS ===

--- ADR005CodecBasedMarkdownRendering ---

| Rule | Description |
| --- | --- |
| Codecs implement a decode-only contract | **Invariant:** Every codec is a pure function that accepts a MasterDataset<br>    and returns a RenderableDocument.... |
| RenderableDocument is a typed intermediate representation | **Invariant:** RenderableDocument contains a title, an ordered array of<br>    SectionBlock elements, and an optional... |
| CompositeCodec assembles documents from child codecs | **Invariant:** CompositeCodec accepts an array of child codecs and<br>    produces a single RenderableDocument by... |
| ADR content comes from both Feature description and Rule prefixes | **Invariant:** ADR structured content (Context, Decision, Consequences)<br>    can appear in two locations within a... |
| The markdown renderer is codec-agnostic | **Invariant:** The renderer accepts any RenderableDocument regardless of<br>    which codec produced it. Rendering... |

--- UniversalDocGeneratorRobustness ---

| Rule | Description |
| --- | --- |
| Context - PoC limitations prevent monorepo-scale operation | **The Problem:**<br><br>    The DecisionDocGenerator PoC (Phase 27) successfully demonstrated code-first<br>    documentation... |
| Decision - Robustness requires four coordinated improvements | **Architecture:**<br><br>    ```<br>    Source Mapping Table<br>           │<br>           ▼<br>    ┌─────────────────────────────┐... |
| Duplicate content must be detected and merged | Content fingerprinting identifies duplicate sections extracted from multiple<br>    sources. When duplicates are found,... |
| Invalid source mappings must fail fast with clear errors | Pre-flight validation catches configuration errors before extraction begins.<br>    This prevents silent failures and... |
| Warnings must be collected and reported consistently | The warning collector replaces scattered console.warn calls with a<br>    structured system that aggregates warnings and... |
| Consequence - Improved reliability at cost of stricter validation | **Positive:**<br><br>    - Duplicate content eliminated from generated docs<br>    - Configuration errors caught before... |

--- TraceabilityGenerator ---

| Rule | Description |
| --- | --- |
| Parses Verified by annotations to extract scenario references | **Invariant:** Scenario names in `**Verified by:**` are matched against actual<br>    scenarios in feature files.... |
| Generates Rule-to-Scenario traceability matrix | **Invariant:** Every Rule appears in the matrix with its verification status.<br>    Scenarios are linked by name and... |
| Detects and reports coverage gaps | **Invariant:** Orphan scenarios (not referenced by any Rule) and unverified<br>    rules are listed in dedicated... |
| Supports filtering by phase and domain | **Invariant:** CLI flags allow filtering the matrix by phase number or domain<br>    category to generate focused... |

--- TraceabilityEnhancements ---

--- ScopedArchitecturalView ---

| Rule | Description |
| --- | --- |
| Scope filtering selects patterns by context, view, or name | **Invariant:** A pattern matches a DiagramScope if ANY of three conditions hold:<br>    its name is in `scope.patterns`,... |
| Neighbor discovery finds connected patterns outside scope | **Invariant:** Patterns connected to scope patterns via relationship edges<br>    (uses, dependsOn, implementsPatterns,... |
| Multiple diagram scopes compose in sequence | **Invariant:** When `diagramScopes` is an array, each scope produces its own<br>    Mermaid diagram section with... |

--- ReferenceDocShowcase ---

| Rule | Description |
| --- | --- |
| Deep behavior rendering replaces shallow truncation | **Invariant:** At standard and detailed levels, behavior sections render full<br>    rule descriptions with parsed... |
| Shape sections include JSDoc prose and property documentation | **Invariant:** At standard level, shape code blocks are preceded by JSDoc<br>    prose when available. At detailed... |
| Diagram scope supports archLayer filtering and multiple diagram types | **Invariant:** DiagramScope gains optional archLayer and diagramType fields.<br>    The archLayer filter selects... |
| Every renderable block type appears in the showcase document | **Invariant:** The generated REFERENCE-SAMPLE.md at detailed level must<br>    contain at least one instance of each of... |
| Edge labels and custom node shapes enrich diagram readability | **Invariant:** Relationship edges in scoped diagrams display labels<br>    describing the relationship semantics (uses,... |
| Extraction pipeline surfaces complete API documentation | **Invariant:** ExportInfo.signature shows full function parameter types and<br>    return type instead of the... |
| Infrastructure enables flexible document composition and AI-optimized output | **Invariant:** CompositeCodec assembles reference documents from multiple<br>    codec outputs by concatenating... |

--- PrdImplementationSection ---

| Rule | Description |
| --- | --- |
| PRD generator discovers implementations from relationship index | **Invariant:** When generating PRD for pattern X, the generator queries the<br>    relationship index for all files... |
| Implementation metadata appears in dedicated PRD section | **Invariant:** The PRD output includes a "## Implementations" section listing<br>    all files that implement the... |
| Patterns without implementations render cleanly | **Invariant:** If no files have `@libar-docs-implements:X` for pattern X,<br>    the "## Implementations" section is... |

--- GeneratorInfrastructureTesting ---

| Rule | Description |
| --- | --- |
| Orchestrator coordinates full documentation generation pipeline | **Invariant:** Orchestrator merges TypeScript and Gherkin patterns,<br>    handles conflicts, and produces requested... |
| Registry manages generator registration and retrieval | **Invariant:** Registry prevents duplicate names, returns undefined for<br>    unknown generators, and lists available... |
| CodecBasedGenerator adapts codecs to generator interface | **Invariant:** Generator delegates to underlying codec for transformation.<br>    Missing MasterDataset produces... |
| Orchestrator supports PR changes generation options | **Invariant:** PR changes can filter by git diff, changed files, or release version.<br><br>    **API:** See... |

--- DocGenerationProofOfConcept ---

| Rule | Description |
| --- | --- |
| Context - Manual documentation maintenance does not scale | **The Problem:**<br><br>    Common technical documentation is the hardest part to maintain in a repository.<br>    The volume... |
| Decision - Decisions own convention content and durable context, code owns details | **The Pattern:**<br><br>    Documentation is generated from three source types with different durability:<br><br>    \| Source... |
| Proof of Concept - Self-documentation validates the pattern | This POC demonstrates the doc-from-decision pattern by generating docs<br>    about ITSELF. The... |
| Expected Output - Compact claude module structure | **File:** `_claude-md/validation/process-guard.md`<br><br>    The compact module extracts only essential content for AI... |
| Consequences - Durable sources with clear ownership boundaries | **Benefits:**<br><br>    \| Benefit \| How \|<br>    \| Single source of truth \| Each content type owned by one source \|<br>    \|... |
| Consequences - Design stubs live in stubs, not src | **The Problem:**<br><br>    Design stubs (pre-implementation API shapes) placed in `src/` cause issues:<br><br>    \| Issue \|... |
| Decision - Source mapping table parsing and extraction method dispatch | **Invariant:** The source mapping table in a decision document defines how<br>    documentation sections are assembled... |

--- CrossCuttingDocumentInclusion ---

| Rule | Description |
| --- | --- |
| Include tag routes content to named documents | **Invariant:** A pattern or shape with libar-docs-include:X appears in<br>    any reference document whose includeTags... |
| Include tag scopes diagrams (replaces arch-view) | **Invariant:** DiagramScope.include matches patterns whose<br>    libar-docs-include values contain the specified scope... |
| Shapes use include tag for document routing | **Invariant:** A declaration tagged with both libar-docs-shape and<br>    libar-docs-include has its include values... |
| Conventions use include tag for selective inclusion | **Invariant:** A decision record or convention pattern with<br>    libar-docs-include:X appears in a reference document... |

--- CodecDrivenReferenceGeneration ---

| Rule | Description |
| --- | --- |
| Config-driven codec replaces per-document recipe features | **Invariant:** A single `ReferenceDocConfig` object is sufficient to produce<br>    a complete reference document. No... |
| Four content sources compose in AD-5 order | **Invariant:** Reference documents always compose content in this order:<br>    conventions, then scoped diagrams, then... |
| Detail level controls output density | **Invariant:** Three detail levels produce progressively more content from the<br>    same config. Summary: type tables... |
| Generator registration produces paired detailed and summary outputs | **Invariant:** Each ReferenceDocConfig produces exactly two generators<br>    (detailed for `docs/`, summary for... |

--- CodecBehaviorTesting ---

| Rule | Description |
| --- | --- |
| Timeline codecs group patterns by phase and status | **Invariant:** Roadmap shows planned work, Milestones shows completed work,<br>    CurrentWork shows active patterns... |
| Session codecs provide working context for AI sessions | **Invariant:** SessionContext shows active patterns with deliverables.<br>    RemainingWork aggregates incomplete work... |
| Requirements codec produces PRD-style documentation | **Invariant:** Features include problem, solution, business value.<br>    Acceptance criteria are formatted with bold... |
| Reporting codecs support release management and auditing | **Invariant:** Changelog follows Keep a Changelog format.<br>    Traceability maps rules to scenarios.<br><br>    **API:** See... |
| Planning codecs support implementation sessions | **Invariant:** Planning checklist includes DoD items.<br>    Session plan shows implementation steps.<br><br>    **API:** See... |

--- ClaudeModuleGeneration ---

| Rule | Description |
| --- | --- |
| Claude module tags exist in the tag registry | **Invariant:** Three claude-specific tags (`claude-module`, `claude-section`,<br>    `claude-tags`) must exist in the... |
| Gherkin parser extracts claude module tags from feature files | **Invariant:** The Gherkin extractor must extract `claude-module`, `claude-section`,<br>    and `claude-tags` from... |
| Module content is extracted from feature file structure | **Invariant:** The codec must extract content from standard feature file elements:<br>    Feature description... |
| ClaudeModuleCodec produces compact markdown modules | **Invariant:** The codec transforms patterns with claude tags into markdown files<br>    suitable for the `_claude-md/`... |
| Claude module generator writes files to correct locations | **Invariant:** The generator must write module files to `{outputDir}/{section}/{module}.md`<br>    based on the... |
| Claude module generator is registered with generator registry | **Invariant:** A "claude-modules" generator must be registered with the generator<br>    registry to enable `pnpm... |
| Same source generates detailed docs with progressive disclosure | **Invariant:** When running with `detailLevel: "detailed"`, the codec produces<br>    expanded documentation including... |

--- BusinessRulesGenerator ---

| Rule | Description |
| --- | --- |
| Extracts Rule blocks with Invariant and Rationale | **Invariant:** Every `Rule:` block with `**Invariant:**` annotation must be extracted.<br>    Rules without annotations... |
| Organizes rules by domain category and phase | **Invariant:** Rules are grouped first by domain category (from `@libar-docs-*` flags),<br>    then by phase number for... |
| Preserves code examples and comparison tables | **Invariant:** DocStrings (`"""typescript`) and tables in Rule descriptions are<br>    rendered in the business rules... |
| Generates scenario traceability links | **Invariant:** Each rule's `**Verified by:**` section generates links to the<br>    scenarios that verify the rule.... |

--- ArchitectureDiagramGeneration ---

| Rule | Description |
| --- | --- |
| Architecture tags exist in the tag registry | **Invariant:** Three architecture-specific tags (`arch-role`, `arch-context`,<br>    `arch-layer`) must exist in the tag... |
| AST parser extracts architecture tags from TypeScript | **Invariant:** The AST parser must extract `arch-role`, `arch-context`, and<br>    `arch-layer` tags from TypeScript... |
| MasterDataset builds archIndex during transformation | **Invariant:** The `transformToMasterDataset` function must build an `archIndex`<br>    that groups patterns by role,... |
| Component diagrams group patterns by bounded context | **Invariant:** Component diagrams must render patterns as nodes grouped into<br>    bounded context subgraphs, with... |
| Layered diagrams group patterns by architectural layer | **Invariant:** Layered diagrams must render patterns grouped by architectural<br>    layer (domain, application,... |
| Architecture generator is registered with generator registry | **Invariant:** An "architecture" generator must be registered with the generator<br>    registry to enable `pnpm... |
| Sequence diagrams render interaction flows | **Invariant:** Sequence diagrams must render interaction flows (command flow,<br>    saga flow) showing step-by-step... |

--- ArchitectureDelta ---

--- TestContentBlocks ---

| Rule | Description |
| --- | --- |
| Business rules appear as a separate section | Rule descriptions provide context for why this business rule exists.<br>    You can include multiple paragraphs here.... |
| Multiple rules create multiple Business Rule entries | Each Rule keyword creates a separate entry in the Business Rules section.<br>    This helps organize complex features... |

--- RuleKeywordPoC ---

| Rule | Description |
| --- | --- |
| Basic arithmetic operations work correctly | The calculator should perform standard math operations<br>    with correct results. |
| Division has special constraints | Division by zero must be handled gracefully to prevent<br>    system errors. |

--- TableExtraction ---

| Rule | Description |
| --- | --- |
| Tables in rule descriptions render exactly once |  |
| Multiple tables in description each render exactly once |  |
| stripMarkdownTables removes table syntax from text |  |

--- GeneratorRegistryTesting ---

| Rule | Description |
| --- | --- |
| Registry manages generator registration and retrieval |  |

--- PrdImplementationSectionTesting ---

| Rule | Description |
| --- | --- |
| Implementation files appear in pattern docs via @libar-docs-implements |  |
| Multiple implementations are listed alphabetically |  |
| Patterns without implementations omit the section |  |
| Implementation references use relative file links |  |

--- PrChangesOptions ---

| Rule | Description |
| --- | --- |
| Orchestrator supports PR changes generation options |  |

--- DocumentationOrchestrator ---

| Rule | Description |
| --- | --- |
| Orchestrator coordinates full documentation generation pipeline |  |

--- CodecBasedGeneratorTesting ---

| Rule | Description |
| --- | --- |
| CodecBasedGenerator adapts codecs to generator interface |  |

--- BusinessRulesDocumentCodec ---

| Rule | Description |
| --- | --- |
| Extracts Rule blocks with Invariant and Rationale |  |
| Organizes rules by product area and phase |  |
| Summary mode generates compact output |  |
| Preserves code examples and tables in detailed mode |  |
| Generates scenario traceability links |  |

--- WarningCollectorTesting ---

| Rule | Description |
| --- | --- |
| Warnings are captured with source context | Each warning includes the source location, category, and message to<br>    enable debugging and targeted fixes. |
| Warnings are categorized for filtering and grouping | Warning categories enable filtering by severity, source, or type<br>    for different reporting needs. |
| Warnings are aggregated across the pipeline | The collector aggregates warnings from all pipeline stages, maintaining<br>    insertion order and source attribution. |
| Warnings integrate with the Result pattern | The warning collector integrates with Result<T, E> to include warnings<br>    in successful results, enabling callers to... |
| Warnings can be formatted for different outputs | The collector provides formatters for console output, JSON, and<br>    markdown to support different reporting needs. |
| Existing console.warn calls are migrated to collector | All console.warn calls in the source mapper and related modules<br>    are replaced with warning collector calls. |

--- ValidationRulesCodecTesting ---

| Rule | Description |
| --- | --- |
| Document metadata is correctly set | The validation rules document has standard metadata fields for title,<br>    purpose, and detail level. |
| All validation rules are documented in a table | The rules table includes all 6 Process Guard validation rules with<br>    their severity levels and descriptions. |
| FSM state diagram is generated from transitions | The Mermaid diagram shows all valid state transitions for the<br>    Process Guard FSM. |
| Protection level matrix shows status protections | The protection matrix documents which statuses have which protection<br>    levels (none, scope-locked, hard-locked). |
| CLI usage is documented with options and exit codes | The CLI section shows how to invoke the Process Guard linter<br>    with various options. |
| Escape hatches are documented for special cases | The escape hatches section documents how to override Process Guard<br>    validation for legitimate use cases. |

--- TaxonomyCodecTesting ---

| Rule | Description |
| --- | --- |
| Document metadata is correctly set | The taxonomy document has standard metadata fields for title, purpose,<br>    and detail level that describe the... |
| Categories section is generated from TagRegistry | The categories section lists all configured tag categories with their<br>    domain, priority, and description in a... |
| Metadata tags can be grouped by domain | The groupByDomain option organizes metadata tags into subsections<br>    by their semantic domain (Core, Relationship,... |
| Tags are classified into domains by hardcoded mapping | The domain classification is intentionally hardcoded for documentation<br>    stability. Core, Relationship, Timeline,... |
| Optional sections can be disabled via codec options | The codec supports disabling format types, presets, and architecture<br>    diagram sections for compact output generation. |
| Detail files are generated for progressive disclosure | The generateDetailFiles option creates additional files for<br>    categories, metadata tags, and format types with... |
| Format types are documented with descriptions and examples | The Format Types section documents all supported tag value formats<br>    with descriptions and examples for each type. |

--- SourceMappingValidatorTesting ---

| Rule | Description |
| --- | --- |
| Source files must exist and be readable | **Invariant:** All source file paths in mappings must resolve to existing, readable files.<br>    **Rationale:**... |
| Extraction methods must be valid and supported | **Invariant:** Extraction methods must match a known method from the supported set.<br>    **Rationale:** Invalid... |
| Extraction methods must be compatible with file types | **Invariant:** Method-file combinations must be compatible (e.g., TypeScript methods for .ts files).... |
| Source mapping tables must have required columns | **Invariant:** Tables must contain Section, Source File, and Extraction Method columns.<br>    **Rationale:** Missing... |
| All validation errors are collected and returned together | **Invariant:** Validation collects all errors before returning, not just the first.<br>    **Rationale:** Enables users... |

--- SourceMapperTesting ---

| Rule | Description |
| --- | --- |
| Extraction methods dispatch to correct handlers | The source mapper dispatches to different extraction functions based on<br>    the extraction method specified in the... |
| Self-references extract from current decision document | THIS DECISION markers extract content from the current decision document<br>    rather than requiring a separate file path. |
| Multiple sources are aggregated in mapping order | Multiple source mappings result in content extraction from each file.<br>    The aggregated content preserves the order... |
| Missing files produce warnings without failing | A referenced source file that does not exist produces a warning,<br>    but generation continues with available sources. |
| Empty extraction results produce info warnings | Extraction that succeeds but produces no content (e.g., no shapes found)<br>    results in an informational warning... |
| Extraction methods are normalized for dispatch | The extraction method column can be written in various formats<br>    and is normalized before dispatch. |

--- RobustnessIntegration ---

| Rule | Description |
| --- | --- |
| Validation runs before extraction in the pipeline | **Invariant:** Validation must complete and pass before extraction begins.<br>    **Rationale:** Prevents wasted... |
| Deduplication runs after extraction before assembly | **Invariant:** Deduplication processes all extracted content before document assembly.<br>    **Rationale:** All sources... |
| Warnings from all stages are collected and reported | **Invariant:** Warnings from all pipeline stages are aggregated in the result.<br>    **Rationale:** Users need... |
| Pipeline provides actionable error messages | **Invariant:** Error messages include context and fix suggestions.<br>    **Rationale:** Users should fix issues in one... |
| Existing decision documents continue to work | **Invariant:** Valid existing decision documents generate without new errors.<br>    **Rationale:** Robustness... |

--- PocIntegration ---

| Rule | Description |
| --- | --- |
| POC decision document is parsed correctly |  |
| Self-references extract content from POC decision |  |
| TypeScript shapes are extracted from real files |  |
| Behavior spec content is extracted correctly |  |
| JSDoc sections are extracted from CLI files |  |
| All source mappings execute successfully |  |
| Compact output generates correctly |  |
| Detailed output generates correctly |  |
| Generated output matches quality expectations |  |

--- DecisionDocGeneratorTesting ---

| Rule | Description |
| --- | --- |
| Output paths are determined from pattern metadata | The generator computes output paths based on pattern name and optional<br>    section configuration. Compact output goes... |
| Compact output includes only essential content | Summary/compact output is limited to ~50 lines and includes only<br>    essential tables and type definitions for Claude... |
| Detailed output includes full content | Detailed output is ~300 lines and includes everything: JSDoc, examples,<br>    full descriptions, and all extracted... |
| Multi-level generation produces both outputs | The generator can produce both compact and detailed outputs in a single<br>    pass for maximum utility. |
| Generator is registered with the registry | The generator is available in the registry under the name "doc-from-decision"<br>    and can be invoked through the... |
| Source mappings are executed during generation | Decision documents with source mapping tables trigger content aggregation<br>    from the referenced files during the... |

--- DecisionDocCodecTesting ---

| Rule | Description |
| --- | --- |
| Rule blocks are partitioned by semantic prefix | Decision documents use Rule: blocks with semantic prefixes to organize<br>    content into Context, Decision, and... |
| DocStrings are extracted with language tags | Decision documents contain code examples as Gherkin DocStrings. |
| Source mapping tables are parsed from rule descriptions | Decision documents define source mappings in markdown tables. |
| Self-reference markers are correctly detected | Source files can reference the current decision document using special<br>    markers like "THIS DECISION", "THIS... |
| Extraction methods are normalized to known types | The extraction method column can be written in various formats. |
| Complete decision documents are parsed with all content | The parseDecisionDocument function extracts all content from an ADR/PDR. |
| Rules can be found by name with partial matching | Self-references may not have an exact rule name match. |

--- ContentDeduplication ---

| Rule | Description |
| --- | --- |
| Duplicate detection uses content fingerprinting | **Invariant:** Content with identical normalized text must produce identical fingerprints.<br>    **Rationale:**... |
| Duplicates are merged based on source priority | **Invariant:** Higher-priority sources take precedence when merging duplicate content.<br>    **Rationale:** TypeScript... |
| Section order is preserved after deduplication | **Invariant:** Section order matches the source mapping table order after deduplication.<br>    **Rationale:**... |
| Deduplicator integrates with source mapper pipeline | **Invariant:** Deduplication runs after extraction and before document assembly.<br>    **Rationale:** All content must... |

--- TransformDatasetTesting ---

--- RichContentHelpersTesting ---

| Rule | Description |
| --- | --- |
| DocString parsing handles edge cases |  |
| DataTable rendering produces valid markdown |  |
| Scenario content rendering respects options |  |
| Business rule rendering handles descriptions |  |
| DocString content is dedented when parsed |  |

--- UniversalMarkdownRenderer ---

--- RemainingWorkSummaryAccuracy ---

| Rule | Description |
| --- | --- |
| Summary totals equal sum of phase table rows |  |
| Patterns without phases appear in Backlog row |  |
| Patterns without patternName are counted using id |  |
| All phases with incomplete patterns are shown |  |

--- RemainingWorkEnhancement ---

--- PrChangesGeneration ---

--- PatternsCodecTesting ---

--- ImplementationLinkPathNormalization ---

| Rule | Description |
| --- | --- |
| Repository prefixes are stripped from implementation paths |  |
| All implementation links in a pattern are normalized |  |
| normalizeImplPath strips known prefixes |  |

--- ExtractSummary ---

| Rule | Description |
| --- | --- |
| Single-line descriptions are returned as-is when complete |  |
| Multi-line descriptions are combined until sentence ending |  |
| Long descriptions are truncated at sentence or word boundaries |  |
| Tautological and header lines are skipped |  |
| Edge cases are handled gracefully |  |

--- DescriptionQualityFoundation ---

--- DescriptionHeaderNormalization ---

| Rule | Description |
| --- | --- |
| Leading headers are stripped from pattern descriptions |  |
| Edge cases are handled correctly |  |
| stripLeadingHeaders removes only leading headers |  |

--- ZodCodecMigration ---

--- LayeredDiagramGeneration ---

| Rule | Description |
| --- | --- |
| Layered diagrams group patterns by arch-layer | Patterns with arch-layer are grouped into Mermaid subgraphs.<br>    Each layer becomes a visual container. |
| Layer order is domain to infrastructure (top to bottom) | The layer subgraphs are rendered in Clean Architecture order:<br>    domain at top, then application, then... |
| Context labels included in layered diagram nodes | Unlike component diagrams which group by context, layered diagrams<br>    include the context as a label in each node name. |
| Patterns without layer go to Other subgraph | Patterns that have arch-role or arch-context but no arch-layer<br>    are grouped into an "Other" subgraph. |
| Layered diagram includes summary section | The generated document starts with an overview section<br>    specific to layered architecture visualization. |

--- ArchGeneratorRegistration ---

| Rule | Description |
| --- | --- |
| Architecture generator is registered in the registry | The architecture generator must be registered like other built-in<br>    generators so it can be invoked via CLI. |
| Architecture generator produces component diagram by default | Running the architecture generator without options produces<br>    a component diagram (bounded context view). |
| Architecture generator supports diagram type options | The generator accepts options to specify diagram type<br>    (component or layered). |
| Architecture generator supports context filtering | The generator can filter to specific bounded contexts<br>    for focused diagram output. |

--- ComponentDiagramGeneration ---

| Rule | Description |
| --- | --- |
| Component diagrams group patterns by bounded context | Patterns with arch-context are grouped into Mermaid subgraphs.<br>    Each bounded context becomes a visual container. |
| Context-less patterns go to Shared Infrastructure | Patterns without arch-context are grouped into a<br>    "Shared Infrastructure" subgraph. |
| Relationship types render with distinct arrow styles | Arrow styles follow UML conventions:<br>    - uses: solid arrow (-->)<br>    - depends-on: dashed arrow (-.->)<br>    -... |
| Arrows only connect annotated components | Relationships pointing to non-annotated patterns<br>    are not rendered (target would not exist in diagram). |
| Component diagram includes summary section | The generated document starts with an overview section<br>    showing component counts and bounded context statistics. |
| Component diagram includes legend when enabled | The legend explains arrow style meanings for readers. |
| Component diagram includes inventory table when enabled | The inventory lists all components with their metadata. |
| Empty architecture data shows guidance message | If no patterns have architecture annotations,<br>    the document explains how to add them. |

--- ArchTagExtraction ---

| Rule | Description |
| --- | --- |
| arch-role tag is defined in the registry | Architecture roles classify components for diagram rendering.<br>    Valid roles: command-handler, projection, saga,... |
| arch-context tag is defined in the registry | Context tags group components into bounded context subgraphs.<br>    Format is "value" (free-form string like "orders",... |
| arch-layer tag is defined in the registry | Layer tags enable layered architecture diagrams.<br>    Valid layers: domain, application, infrastructure. |
| AST parser extracts arch-role from TypeScript annotations | The AST parser must extract arch-role alongside other pattern metadata. |
| AST parser extracts arch-context from TypeScript annotations | Context values are free-form strings naming the bounded context. |
| AST parser extracts arch-layer from TypeScript annotations | Layer tags classify components by architectural layer. |
| AST parser handles multiple arch tags together | Components often have role + context + layer together. |
| Missing arch tags yield undefined values | Components without arch tags should have undefined (not null or empty). |

--- ArchIndexDataset ---

| Rule | Description |
| --- | --- |
| archIndex groups patterns by arch-role | The archIndex.byRole map groups patterns by their architectural role<br>    (command-handler, projection, saga, etc.)... |
| archIndex groups patterns by arch-context | The archIndex.byContext map groups patterns by bounded context<br>    for subgraph rendering in component diagrams. |
| archIndex groups patterns by arch-layer | The archIndex.byLayer map groups patterns by architectural layer<br>    (domain, application, infrastructure) for... |
| archIndex.all contains all patterns with any arch tag | The archIndex.all array contains all patterns that have at least<br>    one arch tag (role, context, or layer). Patterns... |
| Patterns without arch tags are excluded from archIndex | Patterns that have no arch-role, arch-context, or arch-layer are<br>    not included in the archIndex at all. |

--- MermaidRelationshipRendering ---

| Rule | Description |
| --- | --- |
| Each relationship type has a distinct arrow style |  |
| Pattern names are sanitized for Mermaid node IDs |  |
| All relationship types appear in single graph |  |

--- TimelineCodecTesting ---

| Rule | Description |
| --- | --- |
| RoadmapDocumentCodec groups patterns by phase with progress tracking |  |
| CompletedMilestonesCodec shows only completed patterns grouped by quarter |  |
| CurrentWorkCodec shows only active patterns with deliverables |  |

--- ShapeSelectorTesting ---

| Rule | Description |
| --- | --- |
| Reference doc configs select shapes via shapeSelectors | **Invariant:** shapeSelectors provides three selection modes: by<br>    source path + specific names, by group tag, or... |

--- ShapeMatcherTesting ---

| Rule | Description |
| --- | --- |
| Exact paths match without wildcards |  |
| Single-level globs match one directory level |  |
| Recursive globs match any depth |  |
| Dataset shape extraction deduplicates by name |  |

--- SessionCodecTesting ---

| Rule | Description |
| --- | --- |
| SessionContextCodec provides working context for AI sessions |  |
| RemainingWorkCodec aggregates incomplete work by phase |  |

--- RequirementsAdrCodecTesting ---

| Rule | Description |
| --- | --- |
| RequirementsDocumentCodec generates PRD-style documentation from patterns |  |
| AdrDocumentCodec documents architecture decisions |  |

--- ReportingCodecTesting ---

| Rule | Description |
| --- | --- |
| ChangelogCodec follows Keep a Changelog format |  |
| TraceabilityCodec maps timeline patterns to behavior tests |  |
| OverviewCodec provides project architecture summary |  |

--- ReferenceGeneratorTesting ---

| Rule | Description |
| --- | --- |
| Registration produces the correct number of generators |  |
| Generator naming follows kebab-case convention |  |
| Generator execution produces markdown output |  |

--- ReferenceCodecTesting ---

| Rule | Description |
| --- | --- |
| Empty datasets produce fallback content |  |
| Convention content is rendered as sections |  |
| Detail level controls output density |  |
| Behavior sections are rendered from category-matching patterns |  |
| Shape sources are extracted from matching patterns |  |
| Convention and behavior content compose in a single document |  |
| Composition order follows AD-5: conventions then shapes then behaviors |  |
| Convention code examples render as mermaid blocks |  |
| Scoped diagrams are generated from diagramScope config |  |
| Multiple diagram scopes produce multiple mermaid blocks |  |
| Standard detail level includes narrative but omits rationale |  |
| Deep behavior rendering with structured annotations |  |
| Shape JSDoc prose renders at standard and detailed levels |  |
| Shape sections render param returns and throws documentation |  |
| Diagram type controls Mermaid output format | **Invariant:** The diagramType field on DiagramScope selects the Mermaid<br>    output format. Supported types are graph... |
| Edge labels and custom node shapes enrich diagram readability | **Invariant:** Relationship edges display labels describing the relationship<br>    type (uses, depends on, implements,... |
| Collapsible blocks wrap behavior rules for progressive disclosure | **Invariant:** When a behavior pattern has 3 or more rules and detail level<br>    is not summary, each rule's content... |
| Link-out blocks provide source file cross-references | **Invariant:** At standard and detailed levels, each behavior pattern includes<br>    a link-out block referencing its... |
| Include tags route cross-cutting content into reference documents | **Invariant:** Patterns with matching include tags appear alongside<br>    category-selected patterns in the behavior... |

--- PrChangesCodecTesting ---

| Rule | Description |
| --- | --- |
| PrChangesCodec handles empty results gracefully |  |
| PrChangesCodec generates summary with filter information |  |
| PrChangesCodec groups changes by phase when sortBy is "phase" |  |
| PrChangesCodec groups changes by priority when sortBy is "priority" |  |
| PrChangesCodec shows flat list when sortBy is "workflow" |  |
| PrChangesCodec renders pattern details with metadata and description |  |
| PrChangesCodec renders deliverables when includeDeliverables is enabled |  |
| PrChangesCodec renders acceptance criteria from scenarios |  |
| PrChangesCodec renders business rules from Gherkin Rule keyword |  |
| PrChangesCodec generates review checklist when includeReviewChecklist is enabled |  |
| PrChangesCodec generates dependencies section when includeDependencies is enabled |  |
| PrChangesCodec filters patterns by changedFiles |  |
| PrChangesCodec filters patterns by releaseFilter |  |
| PrChangesCodec uses OR logic for combined filters |  |
| PrChangesCodec only includes active and completed patterns |  |

--- PlanningCodecTesting ---

| Rule | Description |
| --- | --- |
| PlanningChecklistCodec prepares for implementation sessions |  |
| SessionPlanCodec generates implementation plans |  |
| SessionFindingsCodec captures retrospective discoveries |  |

--- DedentHelper ---

| Rule | Description |
| --- | --- |
| Tabs are normalized to spaces before dedent |  |
| Empty lines are handled correctly |  |
| Single line input is handled |  |
| Unicode whitespace is handled |  |
| Relative indentation is preserved |  |

--- ConventionExtractorTesting ---

| Rule | Description |
| --- | --- |
| Empty and missing inputs produce empty results |  |
| Convention bundles are extracted from matching patterns |  |
| Structured content is extracted from rule descriptions |  |
| Code examples in rule descriptions are preserved |  |
| TypeScript JSDoc conventions are extracted alongside Gherkin |  |

--- CompositeCodecTesting ---

| Rule | Description |
| --- | --- |
| CompositeCodec concatenates sections in codec array order | **Invariant:** Sections from child codecs appear in the composite<br>    output in the same order as the codecs array.... |
| Separators between codec outputs are configurable | **Invariant:** By default, a separator block is inserted between<br>    each child codec's sections. When... |
| additionalFiles merge with last-wins semantics | **Invariant:** additionalFiles from all children are merged into<br>    a single record. When keys collide, the later... |
| composeDocuments works at document level without codecs | **Invariant:** composeDocuments accepts RenderableDocument array and<br>    produces a composed RenderableDocument... |
| Empty codec outputs are handled gracefully | **Invariant:** Codecs producing empty sections arrays contribute<br>    nothing to the output. No separator is emitted... |
