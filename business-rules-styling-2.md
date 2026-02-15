# Annotation Business Rules

**Purpose:** Business rules for the Annotation product area

---

**67 rules** from 14 features. 18 rules have explicit invariants.

---

## Uncategorized

### Context Inference

_Patterns in standard directories (src/validation/, src/scanner/) should_

#### matchPattern supports recursive wildcard \*\*

_Verified by: Recursive wildcard matches nested paths_

#### matchPattern supports single-level wildcard /\*

_Verified by: Single-level wildcard matches direct children only_

#### matchPattern supports prefix matching

_Verified by: Prefix matching behavior_

#### inferContext returns undefined when no rules match

_Verified by: Empty rules array returns undefined, File path does not match any rule_

#### inferContext applies first matching rule

_Verified by: Single matching rule infers context, First matching rule wins when multiple could match_

#### Explicit archContext is not overridden

_Verified by: Explicit context takes precedence over inference_

#### Inference works independently of archLayer

_Verified by: Pattern without archLayer is still added to byContext if context is inferred_

#### Default rules map standard directories

_Verified by: Default directory mappings_

_context-inference.feature_

### Declaration Level Shape Tagging

_Tests the discoverTaggedShapes function that scans TypeScript source_

#### Declarations opt in via libar-docs-shape tag

**Invariant:** Only declarations with the libar-docs-shape tag in their immediately preceding JSDoc are collected as tagged shapes.

_Verified by: Tagged declaration is extracted as shape, Untagged exported declaration is not extracted, Group name is captured from tag value, Bare tag works without group name, Non-exported tagged declaration is extracted, Tagged declaration is extracted, Untagged export is ignored, Bare tag works without group_

#### Discovery uses existing estree parser with JSDoc comment scanning

**Invariant:** The discoverTaggedShapes function uses the existing typescript-estree parse() and extractPrecedingJsDoc() approach.

_Verified by: All five declaration kinds are discoverable, JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched, Tag as last line before closing JSDoc delimiter, Hypothetical libar-docs-shape-extended tag is not matched, Tag coexists with other JSDoc content, All 5 declaration kinds supported, JSDoc gap enforcement, Tag with other JSDoc content_

_declaration-level-shape-tagging.feature_

### Depends On Tag

_Tests extraction of @libar-docs-depends-on and @libar-docs-enables_

#### Depends-on tag is defined in taxonomy registry

_Verified by: Depends-on tag exists in registry, Enables tag exists in registry_

#### Depends-on tag is extracted from Gherkin files

_Verified by: Depends-on extracted from feature file, Multiple depends-on values extracted as CSV_

#### Depends-on in TypeScript triggers anti-pattern warning

The depends-on tag is for planning dependencies and belongs in feature
files, not TypeScript code.

_Verified by: Depends-on in TypeScript is detected by lint rule_

#### Enables tag is extracted from Gherkin files

_Verified by: Enables extracted from feature file, Multiple enables values extracted as CSV_

#### Planning dependencies are stored in relationship index

The relationship index stores dependsOn and enables relationships
directly from pattern metadata.

_Verified by: DependsOn relationships stored in relationship index, Enables relationships stored explicitly_

_depends-on-tag.feature_

### Directive Detection

_- Full AST parsing of every TypeScript file is expensive and slow_

#### hasDocDirectives detects @libar-docs-\* section directives

**Invariant:** hasDocDirectives must return true if and only if the source contains at least one @libar-docs-{suffix} directive (case-sensitive, @ required, suffix required).

**Rationale:** This is the first-pass filter in the scanner pipeline; false negatives cause patterns to be silently missed, while false positives only waste AST parsing time.

_Verified by: Detect @libar-docs-core directive in JSDoc block, Detect various @libar-docs-\* directives, Detect directive anywhere in file content, Detect multiple directives on same line, Detect directive in inline comment, Return false for content without directives, Return false for empty content in hasDocDirectives, Reject similar but non-matching patterns_

#### hasFileOptIn detects file-level @libar-docs marker

**Invariant:** hasFileOptIn must return true if and only if the source contains a bare @libar-docs tag (not followed by a hyphen) inside a JSDoc block comment; line comments and @libar-docs-\* suffixed tags must not match.

**Rationale:** File-level opt-in is the gate for including a file in the scanner pipeline; confusing @libar-docs-core (a section tag) with @libar-docs (file opt-in) would either miss files or over-include them.

_Verified by: Detect @libar-docs in JSDoc block comment, Detect @libar-docs with description on same line, Detect @libar-docs in multi-line JSDoc, Detect @libar-docs anywhere in file, Detect @libar-docs combined with section tags, Return false when only section tags present, Return false for multiple section tags without opt-in, Return false for empty content in hasFileOptIn, Return false for @libar-docs in line comment, Not confuse @libar-docs-\* with @libar-docs opt-in_

_directive-detection.feature_

### Doc String Media Type

_DocString language hints (mediaType) should be preserved through the parsing_

#### Parser preserves DocString mediaType during extraction

_Verified by: Parse DocString with typescript mediaType, Parse DocString with json mediaType, Parse DocString with jsdoc mediaType, DocString without mediaType has undefined mediaType_

#### MediaType is used when rendering code blocks

_Verified by: TypeScript mediaType renders as typescript code block, JSDoc mediaType prevents asterisk escaping, Missing mediaType falls back to default language_

#### renderDocString handles both string and object formats

_Verified by: String docString renders correctly (legacy format), Object docString with mediaType takes precedence_

_docstring-mediatype.feature_

### Dual Source Extractor

_- Pattern data split across code stubs and feature files_

#### Process metadata is extracted from feature tags

_Verified by: Complete process metadata extraction, Minimal required tags extraction, Missing pattern tag returns null, Missing phase tag returns null_

#### Deliverables are extracted from Background tables

_Verified by: Standard deliverables table extraction, Extended deliverables with Finding and Release, Feature without background returns empty, Tests column handles various formats_

#### Code and feature patterns are combined into dual-source patterns

_Verified by: Matching code and feature are combined, Code-only pattern has no matching feature, Feature-only pattern has no matching code, Phase mismatch creates validation error, Pattern name collision merges sources_

#### Dual-source results are validated for consistency

_Verified by: Clean results have no errors, Cross-validation errors are reported, Orphaned roadmap code stubs produce warnings, Feature-only roadmap patterns produce warnings_

#### Include tags are extracted from Gherkin feature tags

_Verified by: Single include tag is extracted, CSV include tag produces multiple values, Feature without include tag has no include field_

_dual-source-extraction.feature_

### Extends Tag

_Tests for the @libar-docs-extends tag which establishes generalization_

#### Extends tag is defined in taxonomy registry

_Verified by: Extends tag exists in registry_

#### Patterns can extend exactly one base pattern

Extends uses single-value format because pattern inheritance should be
single-inheritance to avoid diamond problems.

_Verified by: Parse extends from feature file, Extends preserved through extraction pipeline_

#### Transform builds extendedBy reverse lookup

_Verified by: Extended pattern knows its extensions_

#### Linter detects circular inheritance chains

_Verified by: Direct circular inheritance detected, Transitive circular inheritance detected_

_extends-tag.feature_

### Extraction Pipeline Enhancements

_Validates extraction pipeline capabilities for ReferenceDocShowcase:_

#### Function signatures surface full parameter types in ExportInfo

**Invariant:** ExportInfo.signature shows full parameter types and return type instead of the placeholder value.

_Verified by: Simple function signature is extracted with full types, Async function keeps async prefix in signature, Multi-parameter function has all types in signature, Function with object parameter type preserves braces, Simple function signature, Async function keeps async prefix, Multi-parameter function, Function with object parameter type_

#### Property-level JSDoc preserves full multi-line content

**Invariant:** Property-level JSDoc preserves full multi-line content without first-line truncation.

_Verified by: Multi-line property JSDoc is fully preserved, Single-line property JSDoc still works, Multi-line property JSDoc preserved, Single-line property JSDoc unchanged_

#### Param returns and throws tags are extracted from function JSDoc

**Invariant:** JSDoc param, returns, and throws tags are extracted and stored on ExtractedShape for function-kind shapes.

_Verified by: Param tags are extracted from function JSDoc, Returns tag is extracted from function JSDoc, Throws tags are extracted from function JSDoc, JSDoc params with braces type syntax are parsed, Param tags extracted, Returns tag extracted, Throws tags extracted, TypeScript-style params without braces_

#### Auto-shape discovery extracts all exported types via wildcard

**Invariant:** When extract-shapes tag value is the wildcard character, all exported declarations are extracted without listing names.

_Verified by: Wildcard extracts all exported declarations, Mixed wildcard and names produces warning, Wildcard extracts all exports, Non-exported declarations excluded, Mixed wildcard and names rejected_

_extraction-pipeline-enhancements.feature_

### File Discovery

_The file discovery system uses glob patterns to find TypeScript files_

#### Glob patterns match TypeScript source files

**Invariant:** findFilesToScan must return absolute paths for all files matching the configured glob patterns.

**Rationale:** Downstream pipeline stages (AST parser, extractor) require absolute paths to read file contents; relative paths would break when baseDir differs from cwd.

_Verified by: Find TypeScript files matching glob patterns, Return absolute paths, Support multiple glob patterns_

#### Default exclusions filter non-source files

**Invariant:** node_modules, dist, .test.ts, .spec.ts, and .d.ts files must be excluded by default without explicit configuration.

**Rationale:** Scanning generated output (dist), third-party code (node_modules), or test files would produce false positives in the pattern registry and waste processing time.

_Verified by: Exclude node_modules by default, Exclude dist directory by default, Exclude test files by default, Exclude .d.ts declaration files_

#### Custom configuration extends discovery behavior

**Invariant:** User-provided exclude patterns must be applied in addition to (not replacing) the default exclusions.

_Verified by: Respect custom exclude patterns, Return empty array when no files match, Handle nested directory structures_

_file-discovery.feature_

### Gherkin Ast Parser

_The Gherkin AST parser extracts feature metadata, scenarios, and steps_

#### Successful feature file parsing extracts complete metadata

**Invariant:** A valid feature file must produce a ParsedFeature with name, description, language, tags, and all nested scenarios with their steps.

**Rationale:** Downstream generators (timeline, business rules) depend on complete AST extraction; missing fields cause silent gaps in generated documentation.

_Verified by: Parse valid feature file with pattern metadata, Parse multiple scenarios, Handle feature without tags_

#### Invalid Gherkin produces structured errors

**Invariant:** Malformed or incomplete Gherkin input must return a Result.err with the source file path and a descriptive error message.

**Rationale:** The scanner processes many feature files in batch; structured errors allow graceful degradation and per-file error reporting rather than aborting the entire scan.

_Verified by: Return error for malformed Gherkin, Return error for file without feature_

_gherkin-parser.feature_

### Implements Tag Processing

_Tests for the @libar-docs-implements tag which links implementation files_

#### Implements tag is defined in taxonomy registry

The tag registry defines `implements` with CSV format, enabling the
data-driven AST parser to automatically extract it.

_Verified by: Implements tag exists in registry_

#### Files can implement a single pattern

_Verified by: Parse implements with single pattern, Implements preserved through extraction pipeline_

#### Files can implement multiple patterns using CSV format

_Verified by: Parse implements with multiple patterns, CSV values are trimmed_

#### Transform builds implementedBy reverse lookup

_Verified by: Single implementation creates reverse lookup, Multiple implementations aggregate_

#### Schemas validate implements field correctly

_Verified by: DocDirective schema accepts implements, RelationshipEntry schema accepts implementedBy_

_implements-tag.feature_

### Scanner Core

_- Need to scan entire codebases for documentation directives efficiently_

#### scanPatterns extracts directives from TypeScript files

**Invariant:** Every file with a valid opt-in marker and JSDoc directives produces a complete ScannedFile with tags, description, examples, and exports.

**Rationale:** Downstream generators depend on complete directive data; partial extraction causes silent documentation gaps across the monorepo.

_Verified by: Scan files and extract directives, Skip files without directives, Extract complete directive information_

#### scanPatterns collects errors without aborting

**Invariant:** A parse failure in one file never prevents other files from being scanned; the result is always Ok with errors collected separately.

**Rationale:** In a monorepo with hundreds of files, a single syntax error must not block the entire documentation pipeline.

_Verified by: Collect errors for files that fail to parse, Always return Ok result even with broken files_

#### Pattern matching and exclusion filtering

**Invariant:** Glob patterns control file discovery and exclusion patterns remove matched files before scanning.

_Verified by: Return empty results when no patterns match, Respect exclusion patterns, Handle multiple files with multiple directives each_

#### File opt-in requirement gates scanning

**Invariant:** Only files containing a standalone @libar-docs marker (not @libar-docs-\*) are eligible for directive extraction.

**Rationale:** Without opt-in gating, every TypeScript file in the monorepo would be parsed, wasting processing time on files that have no documentation directives.

_Verified by: Handle files with quick directive check optimization, Skip files without @libar-docs file-level opt-in, Not confuse @libar-docs-\* with @libar-docs opt-in, Detect @libar-docs opt-in combined with section tags_

_scanner-core.feature_

### Shape Extraction

_Validates the shape extraction system that extracts TypeScript type_

#### extract-shapes tag exists in registry with CSV format

_Verified by: Tag registry contains extract-shapes with correct format_

#### Interfaces are extracted from TypeScript AST

_Verified by: Extract simple interface, Extract interface with JSDoc, Extract interface with generics, Extract interface with extends, Non-existent shape produces not-found entry_

#### Property-level JSDoc is extracted for interface properties

The extractor uses strict adjacency (gap = 1 line) to prevent
interface-level JSDoc from being misattributed to the first property.

_Verified by: Extract properties with adjacent JSDoc, Interface JSDoc not attributed to first property, Mixed documented and undocumented properties_

#### Type aliases are extracted from TypeScript AST

_Verified by: Extract union type alias, Extract mapped type, Extract conditional type_

#### Enums are extracted from TypeScript AST

_Verified by: Extract string enum, Extract const enum_

#### Function signatures are extracted with body omitted

_Verified by: Extract function signature, Extract async function signature_

#### Multiple shapes are extracted in specified order

_Verified by: Shapes appear in tag order not source order, Mixed shape types in specified order_

#### Extracted shapes render as fenced code blocks

_Verified by: Render shapes as markdown_

#### Imported and re-exported shapes are tracked separately

_Verified by: Imported shape produces warning, Re-exported shape produces re-export entry_

#### Const declarations are extracted from TypeScript AST

_Verified by: Extract const with type annotation, Extract const without type annotation_

#### Invalid TypeScript produces error result

_Verified by: Malformed TypeScript returns error_

#### Non-exported shapes are extractable

_Verified by: Extract non-exported interface, Re-export marks internal shape as exported_

#### Shape rendering supports grouping options

_Verified by: Grouped rendering in single code block, Separate rendering with multiple code blocks_

#### Annotation tags are stripped from extracted JSDoc while preserving standard tags

**Invariant:** Extracted shapes never contain @libar-docs-\* annotation lines in their jsDoc field.

**Rationale:** Shape JSDoc is rendered in documentation output. Annotation tags are metadata for the extraction pipeline, not user-visible documentation content.

_Verified by: JSDoc with only annotation tags produces no jsDoc, Mixed JSDoc preserves standard tags and strips annotation tags, Single-line annotation-only JSDoc produces no jsDoc, Consecutive empty lines after tag removal are collapsed_

#### Large source files are rejected to prevent memory exhaustion

_Verified by: Source code exceeding 5MB limit returns error_

_shape-extraction.feature_

### Uses Tag

_Tests extraction and processing of @libar-docs-uses and @libar-docs-used-by_

#### Uses tag is defined in taxonomy registry

_Verified by: Uses tag exists in registry, Used-by tag exists in registry_

#### Uses tag is extracted from TypeScript files

_Verified by: Single uses value extracted, Multiple uses values extracted as CSV_

#### Used-by tag is extracted from TypeScript files

_Verified by: Single used-by value extracted, Multiple used-by values extracted as CSV_

#### Uses relationships are stored in relationship index

The relationship index stores uses and usedBy relationships directly
from pattern metadata.

_Verified by: Uses relationships stored in relationship index, UsedBy relationships stored explicitly_

#### Schemas validate uses field correctly

_Verified by: DocDirective schema accepts uses, RelationshipEntry schema accepts usedBy_

_uses-tag.feature_

---

[← Back to Business Rules](../BUSINESS-RULES.md)
