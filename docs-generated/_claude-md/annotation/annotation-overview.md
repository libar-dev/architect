=== ANNOTATION OVERVIEW ===

Purpose: Annotation product area overview
Detail Level: Compact summary

**How do I annotate code?** Scanning, extraction, tag parsing, dual-source.


=== API TYPES ===

| Type | Kind |
| --- | --- |
| TagRegistry | interface |
| MetadataTagDefinitionForRegistry | interface |
| TagDefinition | type |
| buildRegistry | function |
| METADATA_TAGS_BY_GROUP | const |
| CategoryDefinition | interface |
| CATEGORIES | const |
| CategoryTag | type |
| CATEGORY_TAGS | const |


=== BEHAVIOR SPECIFICATIONS ===

--- TypeScriptTaxonomyImplementation ---

--- ShapeExtraction ---

| Rule | Description |
| --- | --- |
| extract-shapes tag is defined in registry | **Invariant:** The `extract-shapes` tag must exist with CSV format to list<br>    multiple type names for extraction. |
| Interfaces are extracted from TypeScript AST | **Invariant:** When `@libar-docs-extract-shapes` lists an interface name,<br>    the extractor must find and extract the... |
| Type aliases are extracted from TypeScript AST | **Invariant:** Type aliases (including union types, intersection types,<br>    and mapped types) are extracted when... |
| Enums are extracted from TypeScript AST | **Invariant:** Both string and numeric enums are extracted with their<br>    complete member definitions. |
| Function signatures are extracted (body omitted) | **Invariant:** When a function name is listed in extract-shapes, only the<br>    signature (parameters, return type,... |
| Multiple shapes are extracted in specified order | **Invariant:** When multiple shapes are listed, they appear in the<br>    documentation in the order specified in the... |
| Extracted shapes render as fenced code blocks | **Invariant:** Codecs render extracted shapes as TypeScript fenced code<br>    blocks, grouped under an "API Types" or... |
| Shapes can reference types from imports | **Invariant:** Extracted shapes may reference types from imports. The<br>    extractor does NOT resolve imports - it... |
| Overloaded function signatures are all extracted | **Invariant:** When a function has multiple overload signatures, all<br>    signatures are extracted together as they... |
| Shape rendering supports grouping options | **Invariant:** Codecs can render shapes grouped in a single code block<br>    or as separate code blocks, depending on... |

--- PatternRelationshipModel ---

| Rule | Description |
| --- | --- |
| Code files declare pattern realization via implements tag | **Invariant:** Files with `@libar-docs-implements:PatternName,OtherPattern` are linked<br>    to the specified patterns... |
| Pattern inheritance uses extends relationship tag | **Invariant:** Files with `@libar-docs-extends:BasePattern` declare that they extend<br>    another pattern's... |
| Technical dependencies use directed relationship tags | **Invariant:** `@libar-docs-uses` declares outbound dependencies (what this<br>    pattern depends on).... |
| Roadmap sequencing uses ordering relationship tags | **Invariant:** `@libar-docs-depends-on` declares what must be completed first<br>    (roadmap sequencing).... |
| Cross-tier linking uses traceability tags (PDR-007) | **Invariant:** `@libar-docs-executable-specs` on roadmap specs points to test<br>    locations.... |
| Epic/Phase/Task hierarchy uses parent-child relationships | **Invariant:** `@libar-docs-level` declares the hierarchy tier (epic, phase, task).<br>    `@libar-docs-parent` links to... |
| All relationships appear in generated documentation | **Invariant:** The PATTERNS.md dependency graph renders all relationship types<br>    with distinct visual styles.... |
| Linter detects relationship violations | **Invariant:** The pattern linter validates that all relationship targets exist,<br>    implements files don't have... |

--- GherkinRulesSupport ---

| Rule | Description |
| --- | --- |
| Rules flow through the entire pipeline without data loss | The @cucumber/gherkin parser extracts Rules natively. Our pipeline must<br>    preserve this data through scanner,... |
| Generators can render rules as business documentation | Business stakeholders see rule names and descriptions as "Business Rules"<br>    sections, not Given/When/Then syntax.... |
| Custom content blocks render in acceptance criteria | DataTables and DocStrings in steps should appear in generated documentation,<br>    providing structured data and code... |
| vitest-cucumber executes scenarios inside Rules | Test execution must work for scenarios inside Rule blocks.<br>    Use Rule() function with RuleScenario() instead of... |

--- DeclarationLevelShapeTagging ---

| Rule | Description |
| --- | --- |
| Declarations opt in via libar-docs-shape tag | **Invariant:** Only declarations with the libar-docs-shape tag in their<br>    immediately preceding JSDoc are collected... |
| Reference doc configs select shapes via shapeSelectors | **Invariant:** shapeSelectors provides three selection modes: by<br>    source path + specific names (DD-6 source+names... |
| Discovery uses existing estree parser with JSDoc comment scanning | **Invariant:** The discoverTaggedShapes function uses the existing<br>    typescript-estree parse() and... |

--- CrossSourceValidation ---

| Rule | Description |
| --- | --- |
| Pattern names must be consistent across sources |  |
| Circular dependencies are detected |  |
| Dependency references must resolve |  |

--- GherkinAstParser ---

--- FileDiscovery ---

--- DocStringMediaType ---

| Rule | Description |
| --- | --- |
| Parser preserves DocString mediaType during extraction |  |
| MediaType is used when rendering code blocks |  |
| renderDocString handles both string and object formats |  |

--- AstParser ---

--- ShapeExtractionTesting ---

| Rule | Description |
| --- | --- |
| extract-shapes tag exists in registry with CSV format |  |
| Interfaces are extracted from TypeScript AST |  |
| Property-level JSDoc is extracted for interface properties | The extractor uses strict adjacency (gap = 1 line) to prevent<br>    interface-level JSDoc from being misattributed to... |
| Type aliases are extracted from TypeScript AST |  |
| Enums are extracted from TypeScript AST |  |
| Function signatures are extracted with body omitted |  |
| Multiple shapes are extracted in specified order |  |
| Extracted shapes render as fenced code blocks |  |
| Imported and re-exported shapes are tracked separately |  |
| Const declarations are extracted from TypeScript AST |  |
| Invalid TypeScript produces error result |  |
| Non-exported shapes are extractable |  |
| Shape rendering supports grouping options |  |
| Annotation tags are stripped from extracted JSDoc while preserving standard tags | **Invariant:** Extracted shapes never contain @libar-docs-* annotation lines in their jsDoc field.... |
| Large source files are rejected to prevent memory exhaustion |  |

--- ExtractionPipelineEnhancementsTesting ---

| Rule | Description |
| --- | --- |
| Function signatures surface full parameter types in ExportInfo | **Invariant:** ExportInfo.signature shows full parameter types and<br>    return type instead of the placeholder... |
| Property-level JSDoc preserves full multi-line content | **Invariant:** Property-level JSDoc preserves full multi-line content<br>    without first-line truncation.... |
| Param returns and throws tags are extracted from function JSDoc | **Invariant:** JSDoc param, returns, and throws tags are extracted<br>    and stored on ExtractedShape for function-kind... |
| Auto-shape discovery extracts all exported types via wildcard | **Invariant:** When extract-shapes tag value is the wildcard character,<br>    all exported declarations are extracted... |

--- DualSourceExtractorTesting ---

| Rule | Description |
| --- | --- |
| Process metadata is extracted from feature tags |  |
| Deliverables are extracted from Background tables |  |
| Code and feature patterns are combined into dual-source patterns |  |
| Dual-source results are validated for consistency |  |
| Include tags are extracted from Gherkin feature tags |  |

--- DeclarationLevelShapeTaggingTesting ---

| Rule | Description |
| --- | --- |
| Declarations opt in via libar-docs-shape tag | **Invariant:** Only declarations with the libar-docs-shape tag in their<br>    immediately preceding JSDoc are collected... |
| Discovery uses existing estree parser with JSDoc comment scanning | **Invariant:** The discoverTaggedShapes function uses the existing<br>    typescript-estree parse() and... |

--- ScannerCore ---

--- PatternTagExtraction ---

--- LayerInferenceTesting ---

--- DirectiveDetection ---

--- ContextInference ---

| Rule | Description |
| --- | --- |
| matchPattern supports recursive wildcard ** |  |
| matchPattern supports single-level wildcard /* |  |
| matchPattern supports prefix matching |  |
| inferContext returns undefined when no rules match |  |
| inferContext applies first matching rule |  |
| Explicit archContext is not overridden |  |
| Inference works independently of archLayer |  |
| Default rules map standard directories |  |

--- UsesTagTesting ---

| Rule | Description |
| --- | --- |
| Uses tag is defined in taxonomy registry |  |
| Uses tag is extracted from TypeScript files |  |
| Used-by tag is extracted from TypeScript files |  |
| Uses relationships are stored in relationship index | The relationship index stores uses and usedBy relationships directly<br>    from pattern metadata. Unlike implements,... |
| Schemas validate uses field correctly |  |

--- ImplementsTagProcessing ---

| Rule | Description |
| --- | --- |
| Implements tag is defined in taxonomy registry | The tag registry defines `implements` with CSV format, enabling the<br>    data-driven AST parser to automatically... |
| Files can implement a single pattern |  |
| Files can implement multiple patterns using CSV format |  |
| Transform builds implementedBy reverse lookup |  |
| Schemas validate implements field correctly |  |

--- ExtendsTagTesting ---

| Rule | Description |
| --- | --- |
| Extends tag is defined in taxonomy registry |  |
| Patterns can extend exactly one base pattern | Extends uses single-value format because pattern inheritance should be<br>    single-inheritance to avoid diamond problems. |
| Transform builds extendedBy reverse lookup |  |
| Linter detects circular inheritance chains |  |

--- DependsOnTagTesting ---

| Rule | Description |
| --- | --- |
| Depends-on tag is defined in taxonomy registry |  |
| Depends-on tag is extracted from Gherkin files |  |
| Depends-on in TypeScript triggers anti-pattern warning | The depends-on tag is for planning dependencies and belongs in feature<br>    files, not TypeScript code. TypeScript... |
| Enables tag is extracted from Gherkin files |  |
| Planning dependencies are stored in relationship index | The relationship index stores dependsOn and enables relationships<br>    directly from pattern metadata. These are... |
