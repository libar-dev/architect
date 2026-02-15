# Annotation Business Rules

**Purpose:** Business rules for the Annotation product area

---

**56 rules** from 10 features. 7 rules have explicit invariants.

---

## Uncategorized

### Context Inference

*Patterns in standard directories (src/validation/, src/scanner/) should*

#### matchPattern supports recursive wildcard **

_Verified by: Recursive wildcard matches nested paths_

#### matchPattern supports single-level wildcard /*

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

*context-inference.feature*

### Declaration Level Shape Tagging

*Tests the discoverTaggedShapes function that scans TypeScript source*

#### Declarations opt in via libar-docs-shape tag

**Invariant:** Only declarations with the libar-docs-shape tag in their immediately preceding JSDoc are collected as tagged shapes.

_Verified by: Tagged declaration is extracted as shape, Untagged exported declaration is not extracted, Group name is captured from tag value, Bare tag works without group name, Non-exported tagged declaration is extracted, Tagged declaration is extracted, Untagged export is ignored, Bare tag works without group_

#### Discovery uses existing estree parser with JSDoc comment scanning

**Invariant:** The discoverTaggedShapes function uses the existing typescript-estree parse() and extractPrecedingJsDoc() approach.

_Verified by: All five declaration kinds are discoverable, JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched, Tag as last line before closing JSDoc delimiter, Hypothetical libar-docs-shape-extended tag is not matched, Tag coexists with other JSDoc content, All 5 declaration kinds supported, JSDoc gap enforcement, Tag with other JSDoc content_

*declaration-level-shape-tagging.feature*

### Depends On Tag

*Tests extraction of @libar-docs-depends-on and @libar-docs-enables*

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

*depends-on-tag.feature*

### Doc String Media Type

*DocString language hints (mediaType) should be preserved through the parsing*

#### Parser preserves DocString mediaType during extraction

_Verified by: Parse DocString with typescript mediaType, Parse DocString with json mediaType, Parse DocString with jsdoc mediaType, DocString without mediaType has undefined mediaType_

#### MediaType is used when rendering code blocks

_Verified by: TypeScript mediaType renders as typescript code block, JSDoc mediaType prevents asterisk escaping, Missing mediaType falls back to default language_

#### renderDocString handles both string and object formats

_Verified by: String docString renders correctly (legacy format), Object docString with mediaType takes precedence_

*docstring-mediatype.feature*

### Dual Source Extractor

*- Pattern data split across code stubs and feature files*

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

*dual-source-extraction.feature*

### Extends Tag

*Tests for the @libar-docs-extends tag which establishes generalization*

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

*extends-tag.feature*

### Extraction Pipeline Enhancements

*Validates extraction pipeline capabilities for ReferenceDocShowcase:*

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

*extraction-pipeline-enhancements.feature*

### Implements Tag Processing

*Tests for the @libar-docs-implements tag which links implementation files*

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

*implements-tag.feature*

### Shape Extraction

*Validates the shape extraction system that extracts TypeScript type*

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

**Invariant:** Extracted shapes never contain @libar-docs-* annotation lines in their jsDoc field.

**Rationale:** Shape JSDoc is rendered in documentation output. Annotation tags are metadata for the extraction pipeline, not user-visible documentation content.

_Verified by: JSDoc with only annotation tags produces no jsDoc, Mixed JSDoc preserves standard tags and strips annotation tags, Single-line annotation-only JSDoc produces no jsDoc, Consecutive empty lines after tag removal are collapsed_

#### Large source files are rejected to prevent memory exhaustion

_Verified by: Source code exceeding 5MB limit returns error_

*shape-extraction.feature*

### Uses Tag

*Tests extraction and processing of @libar-docs-uses and @libar-docs-used-by*

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

*uses-tag.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
