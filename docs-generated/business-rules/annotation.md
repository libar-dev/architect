# Annotation Business Rules

**Purpose:** Business rules for the Annotation product area

---

**88 rules** from 20 features. 88 rules have explicit invariants.

---

## Uncategorized

### Ast Parser Exports

*The AST Parser extracts @libar-docs-* directives from TypeScript source files*

---

#### Export types are correctly identified from TypeScript declarations

> **Invariant:** Every exported TypeScript declaration type (function, type, interface, const, class, enum, abstract class, arrow function, async function, generic function, default export, re-export) is correctly classified.
>
> **Rationale:** Export type classification drives how codecs render API documentation — misclassifying a function as a const (or vice versa) produces incorrect signatures and misleading docs.

**Verified by:**
- Parse function export with directive
- Parse type export with directive
- Parse interface export with directive
- Parse const export with directive
- Parse class export with directive
- Parse enum export with directive
- Parse const enum export with directive
- Parse abstract class export with directive
- Parse arrow function export with directive
- Parse async function export with directive
- Parse generic function export with directive
- Parse default export with directive
- Parse re-exports with directive
- Parse multiple exports in single statement
- Parse multiple directives in same file

*ast-parser-exports.feature*

### Ast Parser Metadata

*The AST Parser extracts @libar-docs-* directives from TypeScript source files*

---

#### Metadata is correctly extracted from JSDoc comments

> **Invariant:** Examples, multi-line descriptions, line numbers, function signatures, and standard JSDoc tags are all correctly parsed and separated.
>
> **Rationale:** Downstream codecs render each metadata field independently — incorrect parsing causes examples to leak into descriptions or signatures to be lost in generated documentation.

**Verified by:**
- Extract examples from directive
- Extract multi-line description
- Track line numbers correctly
- Extract function signature information
- Ignore @param and @returns in description

---

#### Tags are extracted only from the directive section, not from description or examples

> **Invariant:** Only tags appearing in the directive section (before the description) are extracted. Tags mentioned in description prose or example code blocks are ignored.
>
> **Rationale:** Tags control taxonomy classification and pattern routing — extracting them from prose or examples would create phantom patterns and corrupt the registry.

**Verified by:**
- Extract multiple tags from directive section
- Extract tag with description on same line
- NOT extract tags mentioned in description
- NOT extract tags mentioned in @example sections

---

#### When to Use sections are extracted in all supported formats

> **Invariant:** When to Use content is extracted from heading format with bullet points, inline bold format, and asterisk bullet format. When no When to Use section exists, the field is undefined.
>
> **Rationale:** Generated pattern documentation includes a When to Use section — failing to recognize any supported format means valid guidance silently disappears from output.

**Verified by:**
- Extract When to Use heading format with bullet points
- Extract When to use inline format
- Extract asterisk bullets in When to Use section
- Not set whenToUse when section is missing

*ast-parser-metadata.feature*

### Ast Parser Relationships Edges

*The AST Parser extracts @libar-docs-* directives from TypeScript source files*

---

#### Relationship tags extract uses and usedBy dependencies

> **Invariant:** The uses and usedBy relationship arrays are populated from directive tags, not from description content. When no relationship tags exist, the fields are undefined.
>
> **Rationale:** Relationship data drives dependency diagrams and impact analysis — extracting from prose would produce false edges from incidental mentions.

**Verified by:**
- Extract @libar-docs-uses with single value
- Extract @libar-docs-uses with comma-separated values
- Extract @libar-docs-used-by with single value
- Extract @libar-docs-used-by with comma-separated values
- Extract both uses and usedBy from same directive
- NOT capture uses/usedBy values in description
- Not set uses/usedBy when no relationship tags exist

---

#### Edge cases and malformed input are handled gracefully

> **Invariant:** The parser never crashes on invalid input. Files without directives return empty results. Malformed TypeScript returns a structured error with the file path.
>
> **Rationale:** The scanner processes hundreds of files in bulk — a single malformed file must not abort the entire pipeline or produce an undiagnosable crash.

**Verified by:**
- Skip comments without @libar-docs-* tags
- Skip invalid directive with incomplete tag
- Handle malformed TypeScript gracefully
- Handle empty file gracefully
- Handle whitespace-only file
- Handle file with only comments and no exports
- Skip inline comments (non-block)
- Handle unicode characters in descriptions

*ast-parser-relationships-edges.feature*

### Context Inference

*Patterns in standard directories (src/validation/, src/scanner/) should*

---

#### matchPattern supports recursive wildcard **

> **Invariant:** The `**` wildcard matches files at any nesting depth below the specified directory prefix.
>
> **Rationale:** Directory hierarchies vary in depth; recursive matching ensures all nested files inherit context.

**Verified by:**
- Recursive wildcard matches nested paths

---

#### matchPattern supports single-level wildcard /*

> **Invariant:** The `/*` wildcard matches only direct children of the specified directory, not deeper nested files.
>
> **Rationale:** Some contexts apply only to a specific directory level, not its entire subtree.

**Verified by:**
- Single-level wildcard matches direct children only

---

#### matchPattern supports prefix matching

> **Invariant:** A trailing slash pattern matches any file whose path starts with that directory prefix.
>
> **Rationale:** Without prefix matching, users would need separate wildcard patterns for each nesting depth, making rule configuration verbose and error-prone.

**Verified by:**
- Prefix matching behavior

---

#### inferContext returns undefined when no rules match

> **Invariant:** When no inference rule matches a file path, the pattern receives no inferred context and is excluded from the byContext index.
>
> **Rationale:** Unmatched files must not receive a spurious context assignment; absence of context is a valid state.

**Verified by:**
- Empty rules array returns undefined
- File path does not match any rule

---

#### inferContext applies first matching rule

> **Invariant:** When multiple rules could match a file path, only the first matching rule determines the inferred context.
>
> **Rationale:** Deterministic ordering prevents ambiguous context assignment when rules overlap.

**Verified by:**
- Single matching rule infers context
- First matching rule wins when multiple could match

---

#### Explicit archContext is not overridden

> **Invariant:** A pattern with an explicitly annotated archContext retains that value regardless of matching inference rules.
>
> **Rationale:** Explicit annotations represent intentional developer decisions that must not be silently overwritten by automation.

**Verified by:**
- Explicit context takes precedence over inference

---

#### Inference works independently of archLayer

> **Invariant:** Context inference operates on file path alone; the presence or absence of archLayer does not affect context assignment.
>
> **Rationale:** Coupling context inference to archLayer would prevent context-based queries from finding patterns that lack explicit layer annotations.

**Verified by:**
- Pattern without archLayer is still added to byContext if context is inferred

---

#### Default rules map standard directories

> **Invariant:** Each standard source directory (validation, scanner, extractor, etc.) maps to a well-known bounded context name via the default rule set.
>
> **Rationale:** Convention-based mapping eliminates the need for explicit context annotations on every file in standard directories.

**Verified by:**
- Default directory mappings

*context-inference.feature*

### Declaration Level Shape Tagging

*Tests the discoverTaggedShapes function that scans TypeScript source*

---

#### Declarations opt in via libar-docs-shape tag

> **Invariant:** Only declarations with the libar-docs-shape tag in their immediately preceding JSDoc are collected as tagged shapes.
>
> **Rationale:** Extracting shapes without an explicit opt-in tag would surface internal implementation details in generated API documentation, violating information hiding.

**Verified by:**
- Tagged declaration is extracted as shape
- Untagged exported declaration is not extracted
- Group name is captured from tag value
- Bare tag works without group name
- Non-exported tagged declaration is extracted
- Tagged type is found despite same-name const declaration
- Both same-name declarations tagged produces shapes for each
- Tagged declaration is extracted
- Untagged export is ignored
- Bare tag works without group

---

#### Discovery uses existing estree parser with JSDoc comment scanning

> **Invariant:** The discoverTaggedShapes function uses the existing typescript-estree parse() and extractPrecedingJsDoc() approach.
>
> **Rationale:** Introducing a second parser would create divergent AST behavior — reusing the established parser ensures consistent JSDoc handling and avoids subtle extraction differences.

**Verified by:**
- All five declaration kinds are discoverable
- JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched
- Tag as last line before closing JSDoc delimiter
- Hypothetical libar-docs-shape-extended tag is not matched
- Tag coexists with other JSDoc content
- Generic arrow function in non-JSX context parses correctly
- All 5 declaration kinds supported
- JSDoc gap enforcement
- Tag with other JSDoc content

*declaration-level-shape-tagging.feature*

### Depends On Tag

*Tests extraction of @libar-docs-depends-on and @libar-docs-enables*

---

#### Depends-on tag is defined in taxonomy registry

> **Invariant:** The depends-on and enables tags must exist in the taxonomy registry with CSV format.
>
> **Rationale:** Without registry definitions, the data-driven AST parser cannot discover or extract these planning dependency tags from source files.

**Verified by:**
- Depends-on tag exists in registry
- Enables tag exists in registry

---

#### Depends-on tag is extracted from Gherkin files

> **Invariant:** The Gherkin parser must extract depends-on values from feature file tags, including CSV multi-value lists.
>
> **Rationale:** Missing dependency extraction causes the dependency tree and blocking-pattern queries to return incomplete results.

**Verified by:**
- Depends-on extracted from feature file
- Multiple depends-on values extracted as CSV

---

#### Depends-on in TypeScript triggers anti-pattern warning

> **Invariant:** The depends-on tag must only appear in Gherkin files; its presence in TypeScript is an anti-pattern.
>
> **Rationale:** Depends-on represents planning dependencies owned by Gherkin specs, not runtime dependencies owned by TypeScript.

**Verified by:**
- Depends-on in TypeScript is detected by lint rule
- Depends-on in TypeScript is detected by lint rule

    The depends-on tag is for planning dependencies and belongs in feature
    files
- not TypeScript code. TypeScript files should use "uses" for
    runtime dependencies.

---

#### Enables tag is extracted from Gherkin files

> **Invariant:** The Gherkin parser must extract enables values from feature file tags, including CSV multi-value lists.
>
> **Rationale:** Missing enables extraction breaks forward-looking dependency queries, hiding which patterns are unblocked when a prerequisite completes.

**Verified by:**
- Enables extracted from feature file
- Multiple enables values extracted as CSV

---

#### Planning dependencies are stored in relationship index

> **Invariant:** The relationship index must store dependsOn and enables relationships extracted from pattern metadata.
>
> **Rationale:** Omitting planning dependencies from the index causes blocking-pattern and critical-path queries to return incomplete results.

**Verified by:**
- DependsOn relationships stored in relationship index
- Enables relationships stored explicitly
- Enables relationships stored explicitly

    The relationship index stores dependsOn and enables relationships
    directly from pattern metadata. These are explicit declarations.

*depends-on-tag.feature*

### Directive Detection

*- Full AST parsing of every TypeScript file is expensive and slow*

---

#### hasDocDirectives detects @libar-docs-* section directives

> **Invariant:** hasDocDirectives must return true if and only if the source contains at least one @libar-docs-{suffix} directive (case-sensitive, @ required, suffix required).
>
> **Rationale:** This is the first-pass filter in the scanner pipeline; false negatives cause patterns to be silently missed, while false positives only waste AST parsing time.

**Verified by:**
- Detect @libar-docs-core directive in JSDoc block
- Detect various @libar-docs-* directives
- Detect directive anywhere in file content
- Detect multiple directives on same line
- Detect directive in inline comment
- Return false for content without directives
- Return false for empty content in hasDocDirectives
- Reject similar but non-matching patterns

---

#### hasFileOptIn detects file-level @libar-docs marker

> **Invariant:** hasFileOptIn must return true if and only if the source contains a bare @libar-docs tag (not followed by a hyphen) inside a JSDoc block comment; line comments and @libar-docs-* suffixed tags must not match.
>
> **Rationale:** File-level opt-in is the gate for including a file in the scanner pipeline; confusing @libar-docs-core (a section tag) with @libar-docs (file opt-in) would either miss files or over-include them.

**Verified by:**
- Detect @libar-docs in JSDoc block comment
- Detect @libar-docs with description on same line
- Detect @libar-docs in multi-line JSDoc
- Detect @libar-docs anywhere in file
- Detect @libar-docs combined with section tags
- Return false when only section tags present
- Return false for multiple section tags without opt-in
- Return false for empty content in hasFileOptIn
- Return false for @libar-docs in line comment
- Not confuse @libar-docs-* with @libar-docs opt-in

*directive-detection.feature*

### Doc String Media Type

*DocString language hints (mediaType) should be preserved through the parsing*

---

#### Parser preserves DocString mediaType during extraction

> **Invariant:** The Gherkin parser must retain the mediaType annotation from DocString delimiters through to the parsed AST; DocStrings without a mediaType have undefined mediaType.
>
> **Rationale:** Losing the mediaType causes downstream renderers to apply incorrect escaping or default language hints, corrupting code block output.

**Verified by:**
- Parse DocString with typescript mediaType
- Parse DocString with json mediaType
- Parse DocString with jsdoc mediaType
- DocString without mediaType has undefined mediaType

---

#### MediaType is used when rendering code blocks

> **Invariant:** The rendered code block language must match the DocString mediaType; when mediaType is absent, the renderer falls back to a caller-specified default language.
>
> **Rationale:** Using the wrong language hint causes syntax highlighters to misrender code blocks, and losing mediaType entirely can trigger incorrect escaping (e.g., asterisks in JSDoc).

**Verified by:**
- TypeScript mediaType renders as typescript code block
- JSDoc mediaType prevents asterisk escaping
- Missing mediaType falls back to default language

---

#### renderDocString handles both string and object formats

> **Invariant:** renderDocString accepts both plain string and object DocString formats; when an object has a mediaType, it takes precedence over the caller-supplied language parameter.
>
> **Rationale:** Legacy callers pass raw strings while newer code passes structured objects — the renderer must handle both without breaking existing usage.

**Verified by:**
- String docString renders correctly (legacy format)
- Object docString with mediaType takes precedence

*docstring-mediatype.feature*

### Dual Source Extractor

*- Pattern data split across code stubs and feature files*

---

#### Process metadata is extracted from feature tags

> **Invariant:** A feature file must have both @pattern and @phase tags to produce valid process metadata; missing either yields null.
>
> **Rationale:** Pattern name and phase are the minimum identifiers for placing a pattern in the roadmap — without both, the pattern cannot be tracked.

**Verified by:**
- Complete process metadata extraction
- Minimal required tags extraction
- Missing pattern tag returns null
- Missing phase tag returns null

---

#### Deliverables are extracted from Background tables

> **Invariant:** Deliverables are sourced exclusively from Background tables; features without a Background produce an empty deliverable list.
>
> **Rationale:** The Background table is the single source of truth for deliverable tracking — extracting from other locations would create ambiguity.

**Verified by:**
- Standard deliverables table extraction
- Extended deliverables with Finding and Release
- Feature without background returns empty
- Tests column handles various formats

---

#### Code and feature patterns are combined into dual-source patterns

> **Invariant:** A combined pattern is produced only when both a code stub and a feature file exist for the same pattern name; unmatched sources are tracked separately as code-only or feature-only.
>
> **Rationale:** Dual-source combination ensures documentation reflects both implementation intent (code) and specification (Gherkin) — mismatches signal inconsistency.

**Verified by:**
- Matching code and feature are combined
- Code-only pattern has no matching feature
- Feature-only pattern has no matching code
- Phase mismatch creates validation error
- Pattern name collision merges sources

---

#### Dual-source results are validated for consistency

> **Invariant:** Cross-source validation reports errors for metadata mismatches and warnings for orphaned patterns that are still in roadmap status.
>
> **Rationale:** Inconsistencies between code stubs and feature files indicate drift — errors catch conflicts while warnings surface missing counterparts that may be intentional.

**Verified by:**
- Clean results have no errors
- Cross-validation errors are reported
- Orphaned roadmap code stubs produce warnings
- Feature-only roadmap patterns produce warnings

---

#### Include tags are extracted from Gherkin feature tags

> **Invariant:** Include tags are parsed as comma-separated values; absence of the tag means the pattern has no includes.
>
> **Rationale:** Include tags control which patterns appear in scoped diagrams — incorrect parsing drops patterns from diagrams or includes unrelated ones.

**Verified by:**
- Single include tag is extracted
- CSV include tag produces multiple values
- Feature without include tag has no include field

*dual-source-extraction.feature*

### Extends Tag

*Tests for the @libar-docs-extends tag which establishes generalization*

---

#### Extends tag is defined in taxonomy registry

> **Invariant:** The extends tag must exist in the taxonomy registry with single-value format.
>
> **Rationale:** Without a registry definition, the data-driven AST parser cannot discover or extract the extends tag from source files.

**Verified by:**
- Extends tag exists in registry

---

#### Patterns can extend exactly one base pattern

> **Invariant:** A pattern may extend at most one base pattern, enforced by single-value tag format.
>
> **Rationale:** Single inheritance avoids diamond-problem ambiguity in pattern generalization hierarchies.

**Verified by:**
- Parse extends from feature file
- Extends preserved through extraction pipeline
- Extends preserved through extraction pipeline

    Extends uses single-value format because pattern inheritance should be
    single-inheritance to avoid diamond problems.

---

#### Transform builds extendedBy reverse lookup

> **Invariant:** The transform must compute an extendedBy reverse index so base patterns know which patterns extend them.
>
> **Rationale:** Without the reverse index, base patterns cannot discover their extensions, breaking generalization hierarchy navigation in generated docs.

**Verified by:**
- Extended pattern knows its extensions

---

#### Linter detects circular inheritance chains

> **Invariant:** Circular inheritance chains (direct or transitive) must be detected and reported as errors.
>
> **Rationale:** Circular extends relationships create infinite resolution loops and undefined behavior.

**Verified by:**
- Direct circular inheritance detected
- Transitive circular inheritance detected

*extends-tag.feature*

### Extraction Pipeline Enhancements

*Validates extraction pipeline capabilities for ReferenceDocShowcase:*

---

#### Function signatures surface full parameter types in ExportInfo

> **Invariant:** ExportInfo.signature shows full parameter types and return type instead of the placeholder value.
>
> **Rationale:** Reference documentation renders signatures verbatim — placeholder values instead of real types make the API docs unusable for consumers.

**Verified by:**
- Simple function signature is extracted with full types
- Async function keeps async prefix in signature
- Multi-parameter function has all types in signature
- Function with object parameter type preserves braces
- Simple function signature
- Async function keeps async prefix
- Multi-parameter function
- Function with object parameter type

---

#### Property-level JSDoc preserves full multi-line content

> **Invariant:** Property-level JSDoc preserves full multi-line content without first-line truncation.
>
> **Rationale:** Truncated property descriptions lose important behavioral details (defaults, units, constraints) that consumers rely on when integrating with the API.

**Verified by:**
- Multi-line property JSDoc is fully preserved
- Single-line property JSDoc still works
- Multi-line property JSDoc preserved
- Single-line property JSDoc unchanged

---

#### Param returns and throws tags are extracted from function JSDoc

> **Invariant:** JSDoc param, returns, and throws tags are extracted and stored on ExtractedShape for function-kind shapes.
>
> **Rationale:** Function reference docs require parameter, return, and exception documentation — missing extraction means consumers must read source code instead of generated docs.

**Verified by:**
- Param tags are extracted from function JSDoc
- Returns tag is extracted from function JSDoc
- Throws tags are extracted from function JSDoc
- JSDoc params with braces type syntax are parsed
- Param tags extracted
- Returns tag extracted
- Throws tags extracted
- TypeScript-style params without braces

---

#### Auto-shape discovery extracts all exported types via wildcard

> **Invariant:** When extract-shapes tag value is the wildcard character, all exported declarations are extracted without listing names.
>
> **Rationale:** Requiring explicit names for every export creates maintenance burden and stale annotations — wildcard discovery keeps shape docs in sync as exports are added or removed.

**Verified by:**
- Wildcard extracts all exported declarations
- Mixed wildcard and names produces warning
- Same-name type and const exports produce one shape
- Wildcard extracts all exports
- Non-exported declarations excluded
- Mixed wildcard and names rejected

*extraction-pipeline-enhancements.feature*

### File Discovery

*The file discovery system uses glob patterns to find TypeScript files*

---

#### Glob patterns match TypeScript source files

> **Invariant:** findFilesToScan must return absolute paths for all files matching the configured glob patterns.
>
> **Rationale:** Downstream pipeline stages (AST parser, extractor) require absolute paths to read file contents; relative paths would break when baseDir differs from cwd.

**Verified by:**
- Find TypeScript files matching glob patterns
- Return absolute paths
- Support multiple glob patterns

---

#### Default exclusions filter non-source files

> **Invariant:** node_modules, dist, .test.ts, .spec.ts, and .d.ts files must be excluded by default without explicit configuration.
>
> **Rationale:** Scanning generated output (dist), third-party code (node_modules), or test files would produce false positives in the pattern registry and waste processing time.

**Verified by:**
- Exclude node_modules by default
- Exclude dist directory by default
- Exclude test files by default
- Exclude .d.ts declaration files

---

#### Custom configuration extends discovery behavior

> **Invariant:** User-provided exclude patterns must be applied in addition to (not replacing) the default exclusions.
>
> **Rationale:** Replacing defaults with custom patterns would silently re-include node_modules and dist, causing false positives in the pattern registry.

**Verified by:**
- Respect custom exclude patterns
- Return empty array when no files match
- Handle nested directory structures

*file-discovery.feature*

### Gherkin Ast Parser

*The Gherkin AST parser extracts feature metadata, scenarios, and steps*

---

#### Successful feature file parsing extracts complete metadata

> **Invariant:** A valid feature file must produce a ParsedFeature with name, description, language, tags, and all nested scenarios with their steps.
>
> **Rationale:** Downstream generators (timeline, business rules) depend on complete AST extraction; missing fields cause silent gaps in generated documentation.

**Verified by:**
- Parse valid feature file with pattern metadata
- Parse multiple scenarios
- Handle feature without tags

---

#### Invalid Gherkin produces structured errors

> **Invariant:** Malformed or incomplete Gherkin input must return a Result.err with the source file path and a descriptive error message.
>
> **Rationale:** The scanner processes many feature files in batch; structured errors allow graceful degradation and per-file error reporting rather than aborting the entire scan.

**Verified by:**
- Return error for malformed Gherkin
- Return error for file without feature

*gherkin-parser.feature*

### Implements Tag Processing

*Tests for the @libar-docs-implements tag which links implementation files*

---

#### Implements tag is defined in taxonomy registry

> **Invariant:** The implements tag must exist in the taxonomy registry with CSV format.
>
> **Rationale:** Without a registry definition, the data-driven AST parser cannot discover or extract the implements tag from source files.

**Verified by:**
- Implements tag exists in registry
- Implements tag exists in registry

    The tag registry defines `implements` with CSV format
- enabling the
    data-driven AST parser to automatically extract it.

---

#### Files can implement a single pattern

> **Invariant:** The AST parser must extract a single implements value and preserve it through the extraction pipeline.
>
> **Rationale:** Lost implements values sever the link between implementation files and their roadmap specs, breaking traceability.

**Verified by:**
- Parse implements with single pattern
- Implements preserved through extraction pipeline

---

#### Files can implement multiple patterns using CSV format

> **Invariant:** The AST parser must split CSV implements values into individual pattern references with whitespace trimming.
>
> **Rationale:** Unsplit or untrimmed CSV values produce invalid pattern references that fail relationship index lookups.

**Verified by:**
- Parse implements with multiple patterns
- CSV values are trimmed

---

#### Transform builds implementedBy reverse lookup

> **Invariant:** The transform must compute an implementedBy reverse index so spec patterns know which files implement them.
>
> **Rationale:** Without the reverse index, roadmap specs cannot discover their implementation files, breaking traceability and DoD validation.

**Verified by:**
- Single implementation creates reverse lookup
- Multiple implementations aggregate

---

#### Schemas validate implements field correctly

> **Invariant:** The Zod schemas must accept implements and implementedBy fields with correct array-of-string types.
>
> **Rationale:** Schema rejection of valid implements/implementedBy values causes runtime parse failures that silently drop traceability links.

**Verified by:**
- DocDirective schema accepts implements
- RelationshipEntry schema accepts implementedBy

*implements-tag.feature*

### Layer Inference

*- Manual layer annotation in every feature file is tedious and error-prone*

---

#### Timeline layer is detected from /timeline/ directory segments

> **Invariant:** Any feature file path containing a /timeline/ directory segment is classified as timeline layer.
>
> **Rationale:** Timeline features track phased delivery progress and must be grouped separately for roadmap generation and phase filtering.

**Verified by:**
- Detect timeline features from /timeline/ path
- Detect timeline features regardless of parent directories
- Detect timeline features in delivery-process package

---

#### Domain layer is detected from business context directory segments

> **Invariant:** Feature files in /deciders/, /orders/, or /inventory/ directories are classified as domain layer.
>
> **Rationale:** Domain features define core business rules and must be distinguished from infrastructure tests for accurate coverage reporting.

**Verified by:**
- Detect decider features as domain
- Detect orders features as domain
- Detect inventory features as domain

---

#### Integration layer is detected and takes priority over domain directories

> **Invariant:** Paths containing /integration-features/ or /integration/ are classified as integration, even when they also contain domain directory names.
>
> **Rationale:** Integration tests nested under domain directories (e.g., /integration/orders/) would be misclassified as domain without explicit priority, skewing layer coverage metrics.

**Verified by:**
- Detect integration-features directory as integration
- Detect /integration/ directory as integration
- Integration takes priority over orders subdirectory
- Integration takes priority over inventory subdirectory

---

#### E2E layer is detected from /e2e/ directory segments

> **Invariant:** Any feature file path containing an /e2e/ directory segment is classified as e2e layer.
>
> **Rationale:** E2E tests require separate execution infrastructure and longer timeouts; misclassification would mix them into faster test suites.

**Verified by:**
- Detect e2e features from /e2e/ path
- Detect e2e features in frontend app
- Detect e2e-journeys as e2e

---

#### Component layer is detected from tool-specific directory segments

> **Invariant:** Feature files in /scanner/ or /lint/ directories are classified as component layer.
>
> **Rationale:** Tool-specific features test internal pipeline stages and must be isolated from business domain and integration layers in documentation grouping.

**Verified by:**
- Detect scanner features as component
- Detect lint features as component

---

#### Unknown layer is the fallback for unclassified paths

> **Invariant:** Any feature file path that does not match a known layer pattern is classified as unknown.
>
> **Rationale:** Silently dropping unclassified features would create invisible gaps in test coverage; the unknown fallback ensures every feature is accounted for.

**Verified by:**
- Return unknown for unclassified paths
- Return unknown for root-level features
- Return unknown for generic test paths

---

#### Path normalization handles cross-platform and case differences

> **Invariant:** Layer inference produces correct results regardless of path separators, case, or absolute vs relative paths.
>
> **Rationale:** The consumer monorepo runs on multiple platforms; platform-dependent classification would produce inconsistent documentation across developer machines and CI.

**Verified by:**
- Handle Windows-style paths with backslashes
- Be case-insensitive
- Handle mixed path separators
- Handle absolute Unix paths
- Handle Windows absolute paths
- Timeline in filename only should not match
- Timeline detected even with deep nesting

---

#### FEATURE_LAYERS constant provides validated layer enumeration

> **Invariant:** FEATURE_LAYERS is a readonly array containing exactly all 6 valid layer values.
>
> **Rationale:** Consumers iterate over FEATURE_LAYERS for exhaustive layer handling; a mutable or incomplete array would cause missed layers at runtime.

**Verified by:**
- FEATURE_LAYERS contains all valid layer values
- FEATURE_LAYERS has exactly 6 layers
- FEATURE_LAYERS is a readonly array

*layer-inference.feature*

### Pattern Tag Extraction

*- Gherkin tags are flat strings needing semantic interpretation*

---

#### Single value tags produce scalar metadata fields

> **Invariant:** Each single-value tag (pattern, phase, status, brief) maps to exactly one metadata field with the correct type.
>
> **Rationale:** Incorrect type coercion (e.g., phase as string instead of number) causes downstream pipeline failures in filtering and sorting.

**Verified by:**
- Extract pattern name tag
- Extract phase number tag
- Extract status roadmap tag
- Extract status deferred tag
- Extract status completed tag
- Extract status active tag
- Extract brief path tag

---

#### Array value tags accumulate into list metadata fields

> **Invariant:** Tags for depends-on and enables split comma-separated values and accumulate across multiple tag occurrences.
>
> **Rationale:** Missing a dependency value silently breaks the dependency graph, causing incorrect build ordering and orphaned pattern references.

**Verified by:**
- Extract single dependency
- Extract comma-separated dependencies
- Extract comma-separated enables

---

#### Category tags are colon-free tags filtered against known non-categories

> **Invariant:** Tags without colons become categories, except known non-category tags (acceptance-criteria, happy-path) and the libar-docs opt-in marker.
>
> **Rationale:** Including test-control tags (acceptance-criteria, happy-path) as categories pollutes the pattern taxonomy with non-semantic values.

**Verified by:**
- Extract category tags (no colon)
- libar-docs opt-in marker is NOT a category

---

#### Complex tag lists produce fully populated metadata

> **Invariant:** All tag types (scalar, array, category) are correctly extracted from a single mixed tag list.
>
> **Rationale:** Real feature files combine many tag types; extraction must handle all types simultaneously without interference between parsers.

**Verified by:**
- Extract all metadata from complex tag list

---

#### Edge cases produce safe defaults

> **Invariant:** Empty or invalid inputs produce empty metadata or omit invalid fields rather than throwing errors.
>
> **Rationale:** Throwing on malformed tags would abort extraction for the entire file, losing valid metadata from well-formed tags.

**Verified by:**
- Empty tag list returns empty metadata
- Invalid phase number is ignored

---

#### Convention tags support CSV values with whitespace trimming

> **Invariant:** Convention tags split comma-separated values and trim whitespace from each value.
>
> **Rationale:** Untrimmed whitespace creates distinct values for the same convention, causing false negatives in convention-based filtering and validation.

**Verified by:**
- Extract single convention tag
- Extract CSV convention tags
- Convention tag trims whitespace in CSV values

---

#### Registry-driven extraction handles enums, transforms, and value constraints

> **Invariant:** Tags defined in the registry use data-driven extraction with enum validation, CSV accumulation, value transforms, and constraint checking.
>
> **Rationale:** Hard-coded if/else branches for each tag type cannot scale; registry-driven extraction ensures new tags are supported by configuration, not code changes.

**Verified by:**
- Registry-driven enum tag without prior if/else branch
- Registry-driven enum rejects invalid value
- Registry-driven CSV tag accumulates values
- Transform applies hyphen-to-space on business value
- Transform applies ADR number padding
- Transform strips quotes from title tag
- Repeatable value tag accumulates multiple occurrences
- CSV with values constraint rejects invalid values

*pattern-tag-extraction.feature*

### Scanner Core

*- Need to scan entire codebases for documentation directives efficiently*

---

#### scanPatterns extracts directives from TypeScript files

> **Invariant:** Every file with a valid opt-in marker and JSDoc directives produces a complete ScannedFile with tags, description, examples, and exports.
>
> **Rationale:** Downstream generators depend on complete directive data; partial extraction causes silent documentation gaps across the monorepo.

**Verified by:**
- Scan files and extract directives
- Skip files without directives
- Extract complete directive information

---

#### scanPatterns collects errors without aborting

> **Invariant:** A parse failure in one file never prevents other files from being scanned; the result is always Ok with errors collected separately.
>
> **Rationale:** In a monorepo with hundreds of files, a single syntax error must not block the entire documentation pipeline.

**Verified by:**
- Collect errors for files that fail to parse
- Always return Ok result even with broken files

---

#### Pattern matching and exclusion filtering

> **Invariant:** Glob patterns control file discovery and exclusion patterns remove matched files before scanning.
>
> **Rationale:** Without exclusion filtering, internal directories and generated files would pollute the pattern registry with false positives and slow down scanning.

**Verified by:**
- Return empty results when no patterns match
- Respect exclusion patterns
- Handle multiple files with multiple directives each

---

#### File opt-in requirement gates scanning

> **Invariant:** Only files containing a standalone @libar-docs marker (not @libar-docs-*) are eligible for directive extraction.
>
> **Rationale:** Without opt-in gating, every TypeScript file in the monorepo would be parsed, wasting processing time on files that have no documentation directives.

**Verified by:**
- Handle files with quick directive check optimization
- Skip files without @libar-docs file-level opt-in
- Not confuse @libar-docs-* with @libar-docs opt-in
- Detect @libar-docs opt-in combined with section tags

*scanner-core.feature*

### Shape Extraction Rendering

*Validates the shape extraction system that extracts TypeScript type*

---

#### Multiple shapes are extracted in specified order

> **Invariant:** Extracted shapes appear in the order specified by the tag list, not in source file declaration order.
>
> **Rationale:** Documentation consumers rely on tag-specified ordering for consistent, predictable layout regardless of how source files are organized.

**Verified by:**
- Shapes appear in tag order not source order
- Mixed shape types in specified order

---

#### Extracted shapes render as fenced code blocks

> **Invariant:** Every extracted shape renders as a fenced TypeScript code block in the markdown output.
>
> **Rationale:** Fenced code blocks provide syntax highlighting and preserve type definition formatting, which is essential for readable API documentation.

**Verified by:**
- Render shapes as markdown

---

#### Imported and re-exported shapes are tracked separately

> **Invariant:** Shapes resolved via import or re-export statements are classified distinctly from locally declared shapes.
>
> **Rationale:** Silently extracting imported types as if they were local declarations would produce duplicate or misleading documentation, since the canonical definition lives in another file.

**Verified by:**
- Imported shape produces warning
- Re-exported shape produces re-export entry

---

#### Invalid TypeScript produces error result

> **Invariant:** Malformed TypeScript source returns an error Result instead of throwing or producing partial shapes.
>
> **Rationale:** Unhandled parse exceptions would crash the pipeline mid-run, preventing all subsequent files from being processed.

**Verified by:**
- Malformed TypeScript returns error

---

#### Shape rendering supports grouping options

> **Invariant:** The `groupInSingleBlock` option controls whether shapes render in one combined code fence or in separate per-shape code fences.
>
> **Rationale:** Different documentation layouts require different grouping strategies; a single block provides compact overviews while separate blocks allow per-type commentary.

**Verified by:**
- Grouped rendering in single code block
- Separate rendering with multiple code blocks

---

#### Annotation tags are stripped from extracted JSDoc while preserving standard tags

> **Invariant:** Extracted shapes never contain @libar-docs-* annotation lines in their jsDoc field.
>
> **Rationale:** Shape JSDoc is rendered in documentation output. Annotation tags are metadata for the extraction pipeline, not user-visible documentation content.

**Verified by:**
- JSDoc with only annotation tags produces no jsDoc
- Mixed JSDoc preserves standard tags and strips annotation tags
- Single-line annotation-only JSDoc produces no jsDoc
- Consecutive empty lines after tag removal are collapsed

---

#### Large source files are rejected to prevent memory exhaustion

> **Invariant:** Source files exceeding 5MB are rejected before parsing begins.
>
> **Rationale:** Feeding unbounded input to the TypeScript parser risks out-of-memory crashes that would halt the entire extraction pipeline.

**Verified by:**
- Source code exceeding 5MB limit returns error

*shape-extraction-rendering.feature*

### Shape Extraction Types

*Validates the shape extraction system that extracts TypeScript type*

---

#### extract-shapes tag exists in registry with CSV format

> **Invariant:** The `extract-shapes` tag must be registered with CSV format so multiple shape names can be specified in a single annotation.
>
> **Rationale:** Without CSV format registration, the tag parser cannot split comma-separated shape lists, causing only the first shape to be extracted.

**Verified by:**
- Tag registry contains extract-shapes with correct format

---

#### Interfaces are extracted from TypeScript AST

> **Invariant:** Every named interface declaration in a TypeScript source file must be extractable as a shape with kind `interface`, including generics, extends clauses, and JSDoc.
>
> **Rationale:** Interfaces are the primary API surface for TypeScript libraries; failing to extract them leaves the most important type contracts undocumented.

**Verified by:**
- Extract simple interface
- Extract interface with JSDoc
- Extract interface with generics
- Extract interface with extends
- Non-existent shape produces not-found entry

---

#### Property-level JSDoc is extracted for interface properties

> **Invariant:** Property-level JSDoc must be attributed only to the immediately adjacent property, never inherited from the parent interface declaration.
>
> **Rationale:** Misattributing interface-level JSDoc to the first property produces incorrect per-field documentation and misleads consumers about individual property semantics. The extractor uses strict adjacency (gap = 1 line) to prevent interface-level JSDoc from being misattributed to the first property.

**Verified by:**
- Extract properties with adjacent JSDoc
- Interface JSDoc not attributed to first property
- Mixed documented and undocumented properties

---

#### Type aliases are extracted from TypeScript AST

> **Invariant:** Union types, mapped types, and conditional types must all be extractable as shapes with kind `type`, preserving their full type expression.
>
> **Rationale:** Type aliases encode domain constraints (e.g., discriminated unions, mapped utilities) that are essential for API documentation; omitting them hides the type-level design.

**Verified by:**
- Extract union type alias
- Extract mapped type
- Extract conditional type

---

#### Enums are extracted from TypeScript AST

> **Invariant:** Both regular and const enums must be extractable as shapes with kind `enum`, including their member values.
>
> **Rationale:** Enums define finite value sets used in validation and serialization; missing them from documentation forces consumers to read source code to discover valid values.

**Verified by:**
- Extract string enum
- Extract const enum

---

#### Function signatures are extracted with body omitted

> **Invariant:** Extracted function shapes must include the full signature (name, parameters, return type, async modifier) but never the implementation body.
>
> **Rationale:** Including function bodies in documentation exposes implementation details, inflates output size, and creates a maintenance burden when internals change without signature changes.

**Verified by:**
- Extract function signature
- Extract async function signature

---

#### Const declarations are extracted from TypeScript AST

> **Invariant:** Const declarations must be extractable as shapes with kind `const`, whether or not they carry an explicit type annotation.
>
> **Rationale:** Constants define configuration defaults, version strings, and sentinel values that consumers depend on; excluding them creates documentation gaps for public API surface.

**Verified by:**
- Extract const with type annotation
- Extract const without type annotation

---

#### Non-exported shapes are extractable

> **Invariant:** Shape extraction must succeed for declarations regardless of export status, with the `exported` flag accurately reflecting visibility.
>
> **Rationale:** Internal types often define the core domain model; restricting extraction to exports only would omit types that are essential for understanding module internals.

**Verified by:**
- Extract non-exported interface
- Re-export marks internal shape as exported

*shape-extraction-types.feature*

### Uses Tag

*Tests extraction and processing of @libar-docs-uses and @libar-docs-used-by*

---

#### Uses tag is defined in taxonomy registry

> **Invariant:** The uses and used-by tags must be registered in the taxonomy with CSV format and dependency-related purpose descriptions.
>
> **Rationale:** Without registry definitions, the data-driven AST parser cannot discover or extract these tags from source files.

**Verified by:**
- Uses tag exists in registry
- Used-by tag exists in registry

---

#### Uses tag is extracted from TypeScript files

> **Invariant:** The AST parser must extract single and comma-separated uses values from TypeScript JSDoc annotations.
>
> **Rationale:** Missing or malformed uses extraction breaks runtime dependency tracking and produces incomplete relationship diagrams.

**Verified by:**
- Single uses value extracted
- Multiple uses values extracted as CSV

---

#### Used-by tag is extracted from TypeScript files

> **Invariant:** The AST parser must extract single and comma-separated used-by values from TypeScript JSDoc annotations.
>
> **Rationale:** Missing used-by extraction prevents reverse dependency lookups, leaving consumers unable to discover which patterns depend on them.

**Verified by:**
- Single used-by value extracted
- Multiple used-by values extracted as CSV

---

#### Uses relationships are stored in relationship index

> **Invariant:** All declared uses and usedBy relationships must be stored in the relationship index as explicitly declared entries.
>
> **Rationale:** Omitting relationships from the index causes dependency diagrams and impact-analysis queries to silently miss connections.

**Verified by:**
- Uses relationships stored in relationship index
- UsedBy relationships stored explicitly
- UsedBy relationships stored explicitly

    The relationship index stores uses and usedBy relationships directly
    from pattern metadata. Unlike implements
- these are explicit declarations.

---

#### Schemas validate uses field correctly

> **Invariant:** DocDirective and RelationshipEntry schemas must accept uses and usedBy fields as valid CSV string values.
>
> **Rationale:** Schema rejection of valid uses/usedBy values causes runtime parse failures that silently drop relationship data.

**Verified by:**
- DocDirective schema accepts uses
- RelationshipEntry schema accepts usedBy

*uses-tag.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
