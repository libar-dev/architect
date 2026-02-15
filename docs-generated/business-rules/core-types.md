# CoreTypes Business Rules

**Purpose:** Business rules for the CoreTypes product area

---

**11 rules** from 3 features. 7 rules have explicit invariants.

---

## Phase 44

### Kebab Case Slugs

*As a documentation generator*

#### CamelCase names convert to kebab-case

_Verified by: Convert pattern names to readable slugs_

#### Edge cases are handled correctly

_Verified by: Handle edge cases in slug generation_

#### Requirements include phase prefix

_Verified by: Requirement slugs include phase number, Requirement without phase uses phase 00_

#### Phase slugs use kebab-case for names

_Verified by: Phase slugs combine number and kebab-case name, Phase without name uses "unnamed"_

*kebab-case-slugs.feature*

---

## Uncategorized

### Error Factories

*Error factories create structured, discriminated error types with consistent*

#### createFileSystemError produces discriminated FILE_SYSTEM_ERROR types

**Invariant:** Every FileSystemError must have type "FILE_SYSTEM_ERROR", the source file path, a reason enum value, and a human-readable message derived from the reason.

**Rationale:** File system errors are the most common failure mode in the scanner; discriminated types enable exhaustive switch/case handling in error recovery paths.

_Verified by: createFileSystemError generates correct message for each reason, createFileSystemError includes optional originalError, createFileSystemError omits originalError when not provided_

#### createDirectiveValidationError formats file location with line number

**Invariant:** Every DirectiveValidationError must include the source file path, line number, and reason, with the message formatted as "file:line" for IDE-clickable error output.

_Verified by: createDirectiveValidationError includes line number in message, createDirectiveValidationError includes optional directive snippet, createDirectiveValidationError omits directive when not provided_

#### createPatternValidationError captures pattern identity and validation details

**Invariant:** Every PatternValidationError must include the pattern name, source file path, and reason, with an optional array of specific validation errors for detailed diagnostics.

_Verified by: createPatternValidationError formats pattern name and file, createPatternValidationError includes validation errors array, createPatternValidationError omits validationErrors when not provided_

#### createProcessMetadataValidationError validates Gherkin process metadata

**Invariant:** Every ProcessMetadataValidationError must include the feature file path and a reason describing which metadata field failed validation.

_Verified by: createProcessMetadataValidationError formats file and reason, createProcessMetadataValidationError includes readonly validation errors_

#### createDeliverableValidationError tracks deliverable-specific failures

**Invariant:** Every DeliverableValidationError must include the feature file path and reason, with optional deliverableName for pinpointing which deliverable failed validation.

_Verified by: createDeliverableValidationError formats file and reason, createDeliverableValidationError includes optional deliverableName, createDeliverableValidationError omits deliverableName when not provided, createDeliverableValidationError includes validation errors_

*error-factories.feature*

### String Utils

*String utilities provide consistent text transformations across the codebase.*

#### slugify generates URL-safe slugs

**Invariant:** slugify must produce lowercase, alphanumeric, hyphen-only strings with no leading/trailing hyphens.

**Rationale:** URL slugs appear in file paths and links across all generated documentation; inconsistent slugification would break cross-references.

_Verified by: slugify converts text to URL-safe format, slugify handles empty-ish input, slugify handles single word_

#### camelCaseToTitleCase generates readable titles

**Invariant:** camelCaseToTitleCase must insert spaces at camelCase boundaries and preserve known acronyms (HTTP, XML, API, DoD, AST, GraphQL).

**Rationale:** Pattern names stored as PascalCase identifiers appear as human-readable titles in generated documentation; incorrect splitting would produce unreadable headings.

_Verified by: camelCaseToTitleCase converts to title case, camelCaseToTitleCase handles all-uppercase acronym, camelCaseToTitleCase handles lowercase word_

*string-utils.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
