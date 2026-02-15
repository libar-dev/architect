# CoreTypes Business Rules

**Purpose:** Business rules for the CoreTypes product area

---

**11 rules** from 3 features. 7 rules have explicit invariants.

---

## Phase 44

### Kebab Case Slugs

*As a documentation generator*

---

#### CamelCase names convert to kebab-case

**Verified by:**
- Convert pattern names to readable slugs

---

#### Edge cases are handled correctly

**Verified by:**
- Handle edge cases in slug generation

---

#### Requirements include phase prefix

**Verified by:**
- Requirement slugs include phase number
- Requirement without phase uses phase 00

---

#### Phase slugs use kebab-case for names

**Verified by:**
- Phase slugs combine number and kebab-case name
- Phase without name uses "unnamed"

*kebab-case-slugs.feature*

---

## Uncategorized

### Error Factories

*Error factories create structured, discriminated error types with consistent*

---

#### createFileSystemError produces discriminated FILE_SYSTEM_ERROR types

> **Invariant:** Every FileSystemError must have type "FILE_SYSTEM_ERROR", the source file path, a reason enum value, and a human-readable message derived from the reason.
>
> **Rationale:** File system errors are the most common failure mode in the scanner; discriminated types enable exhaustive switch/case handling in error recovery paths.

**Verified by:**
- createFileSystemError generates correct message for each reason
- createFileSystemError includes optional originalError
- createFileSystemError omits originalError when not provided

---

#### createDirectiveValidationError formats file location with line number

> **Invariant:** Every DirectiveValidationError must include the source file path, line number, and reason, with the message formatted as "file:line" for IDE-clickable error output.

**Verified by:**
- createDirectiveValidationError includes line number in message
- createDirectiveValidationError includes optional directive snippet
- createDirectiveValidationError omits directive when not provided

---

#### createPatternValidationError captures pattern identity and validation details

> **Invariant:** Every PatternValidationError must include the pattern name, source file path, and reason, with an optional array of specific validation errors for detailed diagnostics.

**Verified by:**
- createPatternValidationError formats pattern name and file
- createPatternValidationError includes validation errors array
- createPatternValidationError omits validationErrors when not provided

---

#### createProcessMetadataValidationError validates Gherkin process metadata

> **Invariant:** Every ProcessMetadataValidationError must include the feature file path and a reason describing which metadata field failed validation.

**Verified by:**
- createProcessMetadataValidationError formats file and reason
- createProcessMetadataValidationError includes readonly validation errors

---

#### createDeliverableValidationError tracks deliverable-specific failures

> **Invariant:** Every DeliverableValidationError must include the feature file path and reason, with optional deliverableName for pinpointing which deliverable failed validation.

**Verified by:**
- createDeliverableValidationError formats file and reason
- createDeliverableValidationError includes optional deliverableName
- createDeliverableValidationError omits deliverableName when not provided
- createDeliverableValidationError includes validation errors

*error-factories.feature*

### String Utils

*String utilities provide consistent text transformations across the codebase.*

---

#### slugify generates URL-safe slugs

> **Invariant:** slugify must produce lowercase, alphanumeric, hyphen-only strings with no leading/trailing hyphens.
>
> **Rationale:** URL slugs appear in file paths and links across all generated documentation; inconsistent slugification would break cross-references.

**Verified by:**
- slugify converts text to URL-safe format
- slugify handles empty-ish input
- slugify handles single word

---

#### camelCaseToTitleCase generates readable titles

> **Invariant:** camelCaseToTitleCase must insert spaces at camelCase boundaries and preserve known acronyms (HTTP, XML, API, DoD, AST, GraphQL).
>
> **Rationale:** Pattern names stored as PascalCase identifiers appear as human-readable titles in generated documentation; incorrect splitting would produce unreadable headings.

**Verified by:**
- camelCaseToTitleCase converts to title case
- camelCaseToTitleCase handles all-uppercase acronym
- camelCaseToTitleCase handles lowercase word

*string-utils.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
