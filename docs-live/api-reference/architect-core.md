# architect-core API Reference

**Purpose:** Type and API surface for a single workspace package

---

## Overview

74 shapes across 8 patterns in architect-core.

## CodecUtils

### CodecError

Failure value returned by codec parse/serialize operations.

```ts
interface CodecError {
  /** Discriminator literal identifying a codec error. */
  type: 'codec-error';
  /** Which operation failed. */
  operation: 'parse' | 'serialize';
  /** Originating source label (e.g. file path), if known. */
  source?: string | undefined;
  /** Human-readable error message. */
  message: string;
  /** Formatted schema validation errors, if the failure was a validation failure. */
  validationErrors?: string[] | undefined;
}
```

#### Properties

| Property         | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| type             | Discriminator literal identifying a codec error.                             |
| operation        | Which operation failed.                                                      |
| source           | Originating source label (e.g. file path), if known.                         |
| message          | Human-readable error message.                                                |
| validationErrors | Formatted schema validation errors, if the failure was a validation failure. |

### createFileLoader

Build a file loader that reads a file and parses it through the given codec, mapping filesystem failures to a CodecError.

```ts
function createFileLoader<T>(
  codec: JsonInputCodec<T>,
  readFile?: (filePath: string) => Promise<string>,
): { load(filePath: string): Promise<Result<T, CodecError>> };
```

#### Parameters

| Parameter | Type | Description                                                                |
| --------- | ---- | -------------------------------------------------------------------------- |
| codec     |      | Input codec used to parse the file contents.                               |
| readFile  |      | Optional reader override; defaults to \`fs/promises.readFile\` with UTF-8. |

#### Returns

An object whose \`load\` resolves to a \`Result\` with the typed value or a {@link CodecError}.

### createJsonInputCodec

Build a JsonInputCodec that parses JSON against the given schema, stripping a leading \`$schema\` key before validation.

```ts
function createJsonInputCodec<T>(schema: ZodType<T>): JsonInputCodec<T>;
```

#### Parameters

| Parameter | Type | Description                              |
| --------- | ---- | ---------------------------------------- |
| schema    |      | Zod schema the parsed JSON must satisfy. |

#### Returns

A codec exposing \`parse\` (Result-returning) and \`safeParse\`.

### createJsonOutputCodec

Build a JsonOutputCodec that validates a value against the schema before serializing it to JSON.

```ts
function createJsonOutputCodec<T>(
  schema: ZodType<T>,
  defaultIndent = 2,
): JsonOutputCodec<T>;
```

#### Parameters

| Parameter     | Type | Description                                                                     |
| ------------- | ---- | ------------------------------------------------------------------------------- |
| schema        |      | Zod schema the value must satisfy before serialization.                         |
| defaultIndent |      | Indent width used when \`serialize\` is called without options (defaults to 2). |

#### Returns

A codec exposing \`serialize\` and \`serializeWithOptions\`.

### formatCodecError

Render a CodecError into a multi-line human-readable string, including the source and any validation errors.

```ts
function formatCodecError(error: CodecError): string;
```

#### Parameters

| Parameter | Type | Description                |
| --------- | ---- | -------------------------- |
| error     |      | The codec error to format. |

#### Returns

A formatted, newline-joined error report.

### JsonInputCodec

Codec that parses JSON strings into validated typed values.

```ts
interface JsonInputCodec<T> {
  /** Parse and validate `content`, returning a `Result` with the typed value or a {@link CodecError}. */
  parse(content: string, source?: string): Result<T, CodecError>;
  /** Parse and validate `content`, returning the typed value or `undefined` on any failure. */
  safeParse(content: string): T | undefined;
}
```

### JsonOutputCodec

Codec that serializes typed values into validated JSON strings.

```ts
interface JsonOutputCodec<T> {
  /** Validate and serialize `data`, returning a `Result` with the JSON string or a {@link CodecError}. */
  serialize(data: T, source?: string): Result<string, CodecError>;
  /** Validate and serialize `data` with explicit indent/source options. */
  serializeWithOptions(
    data: T,
    options: { indent?: number | undefined; source?: string | undefined },
  ): Result<string, CodecError>;
}
```

## ErrorFactoryTypes

### BaseDocError

Base error interface all documentation errors extend — carries the discriminator and message common to every error variant.

```ts
interface BaseDocError {
  /** Error type discriminator for pattern matching */
  readonly type: string;
  /** Human-readable error message */
  readonly message: string;
}
```

#### Properties

| Property | Description                                   |
| -------- | --------------------------------------------- |
| type     | Error type discriminator for pattern matching |
| message  | Human-readable error message                  |

### BatchError

Error with collected failures from batch operations. Used when processing multiple files or patterns where some succeed and others fail. Preserves all failure information for reporting.

```ts
interface BatchError<E extends DocError> extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'BATCH_ERROR';
  /** The individual errors collected during the batch. */
  readonly errors: readonly E[];
  /** Count of items that succeeded. */
  readonly successCount: number;
  /** Count of items that failed. */
  readonly failureCount: number;
}
```

#### Properties

| Property     | Description                                       |
| ------------ | ------------------------------------------------- |
| type         | Discriminator literal for this error variant.     |
| errors       | The individual errors collected during the batch. |
| successCount | Count of items that succeeded.                    |
| failureCount | Count of items that failed.                       |

### ConfigError

Configuration error - invalid scanner or generator config.

```ts
interface ConfigError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'CONFIG_ERROR';
  /** The offending configuration field. */
  readonly field: string;
  /** Why the field is invalid. */
  readonly reason: string;
  /** The invalid value, if available. */
  readonly value?: unknown;
}
```

#### Properties

| Property | Description                                   |
| -------- | --------------------------------------------- |
| type     | Discriminator literal for this error variant. |
| field    | The offending configuration field.            |
| reason   | Why the field is invalid.                     |
| value    | The invalid value, if available.              |

### createDeliverableValidationError

Create a DeliverableValidationError

```ts
function createDeliverableValidationError(
  file: string,
  reason: string,
  deliverableName?: string,
  validationErrors?: readonly string[],
): DeliverableValidationError;
```

#### Parameters

| Parameter        | Type | Description                                      |
| ---------------- | ---- | ------------------------------------------------ |
| file             |      | Feature file path containing invalid deliverable |
| reason           |      | Description of validation failure                |
| deliverableName  |      | Optional name of the invalid deliverable         |
| validationErrors |      | Specific Zod validation errors                   |

#### Returns

Structured DeliverableValidationError

### createDirectiveValidationError

Create a DirectiveValidationError

```ts
function createDirectiveValidationError(
  file: string,
  line: number,
  reason: string,
  directive?: string,
): DirectiveValidationError;
```

#### Parameters

| Parameter | Type | Description                              |
| --------- | ---- | ---------------------------------------- |
| file      |      | Source file containing invalid directive |
| line      |      | Line number where directive was found    |
| reason    |      | Why validation failed                    |
| directive |      | Optional directive text snippet          |

#### Returns

Structured DirectiveValidationError

### createFeatureParseError

Create a FeatureParseError

```ts
function createFeatureParseError(
  file: string,
  reason: string,
  originalError?: unknown,
): FeatureParseError;
```

#### Parameters

| Parameter     | Type | Description                            |
| ------------- | ---- | -------------------------------------- |
| file          |      | Feature file path that failed to parse |
| reason        |      | Description of parsing failure         |
| originalError |      | Optional underlying error              |

#### Returns

Structured FeatureParseError

### createFileParseError

Create a FileParseError

```ts
function createFileParseError(
  file: string,
  reason: string,
  location?: { line: number; column: number },
  originalError?: unknown,
): FileParseError;
```

#### Parameters

| Parameter     | Type | Description                      |
| ------------- | ---- | -------------------------------- |
| file          |      | File path that failed to parse   |
| reason        |      | Description of parsing failure   |
| location      |      | Optional line/column information |
| originalError |      | Optional underlying error        |

#### Returns

Structured FileParseError

### createFileSystemError

Create a FileSystemError

```ts
function createFileSystemError(
  file: string,
  reason: FileSystemError['reason'],
  originalError?: unknown,
): FileSystemError;
```

#### Parameters

| Parameter     | Type | Description                     |
| ------------- | ---- | ------------------------------- |
| file          |      | File path that caused the error |
| reason        |      | Specific reason for the failure |
| originalError |      | Optional underlying error       |

#### Returns

Structured FileSystemError

### createGherkinPatternValidationError

Create a GherkinPatternValidationError

```ts
function createGherkinPatternValidationError(
  file: string,
  patternName: string,
  reason: string,
  validationErrors?: readonly string[],
): GherkinPatternValidationError;
```

#### Parameters

| Parameter        | Type | Description                                  |
| ---------------- | ---- | -------------------------------------------- |
| file             |      | Feature file path containing invalid pattern |
| patternName      |      | Name of the pattern that failed validation   |
| reason           |      | Description of validation failure            |
| validationErrors |      | Specific Zod validation errors               |

#### Returns

Structured GherkinPatternValidationError

### createPatternValidationError

Create a PatternValidationError

```ts
function createPatternValidationError(
  file: SourceFilePath,
  patternName: string,
  reason: string,
  validationErrors?: string[],
): PatternValidationError;
```

#### Parameters

| Parameter        | Type | Description                            |
| ---------------- | ---- | -------------------------------------- |
| file             |      | Source file containing invalid pattern |
| patternName      |      | Name of the invalid pattern            |
| reason           |      | Why validation failed                  |
| validationErrors |      | Specific validation errors from schema |

#### Returns

Structured PatternValidationError

### createProcessMetadataValidationError

Create a ProcessMetadataValidationError

```ts
function createProcessMetadataValidationError(
  file: string,
  reason: string,
  validationErrors?: readonly string[],
): ProcessMetadataValidationError;
```

#### Parameters

| Parameter        | Type | Description                                           |
| ---------------- | ---- | ----------------------------------------------------- |
| file             |      | Feature file path containing invalid process metadata |
| reason           |      | Description of validation failure                     |
| validationErrors |      | Specific Zod validation errors                        |

#### Returns

Structured ProcessMetadataValidationError

### DeliverableValidationError

Deliverable validation error - invalid deliverable table data. Raised when extracting deliverables from Gherkin Background tables and the data doesn't conform to DeliverableSchema.

```ts
interface DeliverableValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'DELIVERABLE_VALIDATION_ERROR';
  /** Feature file containing the invalid deliverable. */
  readonly file: string;
  /** Name of the offending deliverable, if known. */
  readonly deliverableName?: string;
  /** Why validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: readonly string[];
}
```

#### Properties

| Property         | Description                                      |
| ---------------- | ------------------------------------------------ |
| type             | Discriminator literal for this error variant.    |
| file             | Feature file containing the invalid deliverable. |
| deliverableName  | Name of the offending deliverable, if known.     |
| reason           | Why validation failed.                           |
| validationErrors | Specific schema validation errors, if any.       |

### DirectiveValidationError

Directive validation error - invalid \`@architect-\*\` format.

```ts
interface DirectiveValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'DIRECTIVE_VALIDATION_ERROR';
  /** Source file containing the invalid directive. */
  readonly file: string;
  /** Line number where the directive was found. */
  readonly line: number;
  /** Why directive validation failed. */
  readonly reason: string;
  /** The offending directive text, if captured. */
  readonly directive?: string;
}
```

#### Properties

| Property  | Description                                   |
| --------- | --------------------------------------------- |
| type      | Discriminator literal for this error variant. |
| file      | Source file containing the invalid directive. |
| line      | Line number where the directive was found.    |
| reason    | Why directive validation failed.              |
| directive | The offending directive text, if captured.    |

### DocError

Discriminated union of all possible documentation errors. \*\*Benefits\*\*: - Exhaustive pattern matching in switch statements - Type narrowing based on \`type\` field - Compile-time verification of error handling

```ts
type DocError =
  | FileSystemError
  | FileParseError
  | DirectiveValidationError
  | PatternValidationError
  | RegistryValidationError
  | MarkdownGenerationError
  | FileWriteError
  | FeatureParseError
  | ConfigError
  | ProcessMetadataValidationError
  | DeliverableValidationError
  | GherkinPatternValidationError;
```

### ExtractionError

Subset of DocError that can occur during extraction.

```ts
type ExtractionError =
  | PatternValidationError
  | DirectiveValidationError
  | ProcessMetadataValidationError
  | DeliverableValidationError
  | GherkinPatternValidationError;
```

### FeatureParseError

Feature file parse error - failed to parse a \`.feature\` file.

```ts
interface FeatureParseError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'FEATURE_PARSE_ERROR';
  /** Path of the feature file that failed to parse. */
  readonly file: string;
  /** Description of the parse failure. */
  readonly reason: string;
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}
```

#### Properties

| Property      | Description                                    |
| ------------- | ---------------------------------------------- |
| type          | Discriminator literal for this error variant.  |
| file          | Path of the feature file that failed to parse. |
| reason        | Description of the parse failure.              |
| originalError | Underlying error, if any.                      |

### FileParseError

File parsing error - invalid TypeScript, malformed syntax.

```ts
interface FileParseError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'FILE_PARSE_ERROR';
  /** Path of the file that failed to parse. */
  readonly file: string;
  /** Description of the parse failure. */
  readonly reason: string;
  /** Line number of the failure, if known. */
  readonly line?: number;
  /** Column number of the failure, if known. */
  readonly column?: number;
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}
```

#### Properties

| Property      | Description                                   |
| ------------- | --------------------------------------------- |
| type          | Discriminator literal for this error variant. |
| file          | Path of the file that failed to parse.        |
| reason        | Description of the parse failure.             |
| line          | Line number of the failure, if known.         |
| column        | Column number of the failure, if known.       |
| originalError | Underlying error, if any.                     |

### FileSystemError

File system error - file not found, permission denied, etc.

```ts
interface FileSystemError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'FILE_SYSTEM_ERROR';
  /** Path of the file the operation failed on. */
  readonly file: string;
  /** Specific failure category. */
  readonly reason: 'NOT_FOUND' | 'NO_PERMISSION' | 'NOT_A_FILE' | 'OTHER';
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}
```

#### Properties

| Property      | Description                                   |
| ------------- | --------------------------------------------- |
| type          | Discriminator literal for this error variant. |
| file          | Path of the file the operation failed on.     |
| reason        | Specific failure category.                    |
| originalError | Underlying error, if any.                     |

### FileWriteError

File write error - failed to write markdown or registry.

```ts
interface FileWriteError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'FILE_WRITE_ERROR';
  /** Path of the file that failed to write. */
  readonly file: string;
  /** Why the write failed. */
  readonly reason: string;
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}
```

#### Properties

| Property      | Description                                   |
| ------------- | --------------------------------------------- |
| type          | Discriminator literal for this error variant. |
| file          | Path of the file that failed to write.        |
| reason        | Why the write failed.                         |
| originalError | Underlying error, if any.                     |

### GenerationError

Subset of DocError that can occur during generation.

```ts
type GenerationError = MarkdownGenerationError | FileWriteError | RegistryValidationError;
```

### GherkinPatternValidationError

Gherkin pattern extraction error - pattern failed schema validation. Raised when building ExtractedPattern from Gherkin features and the result doesn't conform to ExtractedPatternSchema.

```ts
interface GherkinPatternValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'GHERKIN_PATTERN_VALIDATION_ERROR';
  /** Feature file the pattern was built from. */
  readonly file: string;
  /** Name of the pattern that failed validation. */
  readonly patternName: string;
  /** Why validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: readonly string[];
}
```

#### Properties

| Property         | Description                                   |
| ---------------- | --------------------------------------------- |
| type             | Discriminator literal for this error variant. |
| file             | Feature file the pattern was built from.      |
| patternName      | Name of the pattern that failed validation.   |
| reason           | Why validation failed.                        |
| validationErrors | Specific schema validation errors, if any.    |

### MarkdownGenerationError

Markdown generation error - failed to generate output.

```ts
interface MarkdownGenerationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'MARKDOWN_GENERATION_ERROR';
  /** Identifier of the pattern being rendered. */
  readonly patternId: string;
  /** Why generation failed. */
  readonly reason: string;
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}
```

#### Properties

| Property      | Description                                   |
| ------------- | --------------------------------------------- |
| type          | Discriminator literal for this error variant. |
| patternId     | Identifier of the pattern being rendered.     |
| reason        | Why generation failed.                        |
| originalError | Underlying error, if any.                     |

### PatternValidationError

Pattern validation error - pattern doesn't conform to schema.

```ts
interface PatternValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'PATTERN_VALIDATION_ERROR';
  /** Source file containing the invalid pattern. */
  readonly file: SourceFilePath;
  /** Name of the pattern that failed validation. */
  readonly patternName: string;
  /** Why pattern validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: string[];
}
```

#### Properties

| Property         | Description                                   |
| ---------------- | --------------------------------------------- |
| type             | Discriminator literal for this error variant. |
| file             | Source file containing the invalid pattern.   |
| patternName      | Name of the pattern that failed validation.   |
| reason           | Why pattern validation failed.                |
| validationErrors | Specific schema validation errors, if any.    |

### ProcessMetadataValidationError

Process metadata validation error - invalid \`@architect-\*\` tag values. Raised when extracting process metadata from Gherkin feature tags and the values don't conform to ProcessMetadataSchema.

```ts
interface ProcessMetadataValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'PROCESS_METADATA_VALIDATION_ERROR';
  /** Feature file containing the invalid metadata. */
  readonly file: string;
  /** Why validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: readonly string[];
}
```

#### Properties

| Property         | Description                                   |
| ---------------- | --------------------------------------------- |
| type             | Discriminator literal for this error variant. |
| file             | Feature file containing the invalid metadata. |
| reason           | Why validation failed.                        |
| validationErrors | Specific schema validation errors, if any.    |

### RegistryValidationError

Registry validation error - invalid registry format or data.

```ts
interface RegistryValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'REGISTRY_VALIDATION_ERROR';
  /** Path of the registry that failed validation. */
  readonly registryPath: string;
  /** Why registry validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: string[];
}
```

#### Properties

| Property         | Description                                   |
| ---------------- | --------------------------------------------- |
| type             | Discriminator literal for this error variant. |
| registryPath     | Path of the registry that failed validation.  |
| reason           | Why registry validation failed.               |
| validationErrors | Specific schema validation errors, if any.    |

### ScanError

Subset of DocError that can occur during scanning.

```ts
type ScanError = FileSystemError | FileParseError | DirectiveValidationError;
```

## ExtractedPattern

### BusinessRuleSchema

A business rule extracted from a pattern's scenarios — its name, description, the count and names of scenarios that exercise it, and any tags.

```ts
BusinessRuleSchema = z.strictObject({
  name: z.string(),
  description: z.string(),
  scenarioCount: z.number().int().nonnegative(),
  scenarioNames: z.array(z.string()).readonly(),
  tags: z.array(z.string()).readonly().optional(),
})
```

### ExtractedPatternDraftSchema

Draft variant of ExtractedPatternSchema that additionally permits a \`\_diagnostics\` array, carrying extraction warnings before the record is finalized.

```ts
ExtractedPatternDraftSchema = z.strictObject({
  ...ExtractedPatternBaseSchema.shape,
  _diagnostics: z.array(z.string().min(1)).readonly().optional(),
})
```

### ExtractedPatternSchema

The canonical per-pattern record contract — the ~60-field strict-object schema every extracted pattern must satisfy.

```ts
ExtractedPatternSchema = ExtractedPatternBaseSchema
```

### isExtractedPattern

Type guard narrowing an unknown value to ExtractedPattern by parsing it against ExtractedPatternSchema.

```ts
function isExtractedPattern(value: unknown): value is ExtractedPattern;
```

#### Parameters

| Parameter | Type | Description                                                      |
| --------- | ---- | ---------------------------------------------------------------- |
| value     |      | The unknown value to test against the ExtractedPattern contract. |

#### Returns

\`true\` when \`value\` is a valid ExtractedPattern (narrowing its type), else \`false\`.

### SourceInfoSchema

Source provenance for a pattern — the file it was extracted from and the 1-based inclusive \`\[start, end\]\` line span of its declaration.

```ts
SourceInfoSchema = z.strictObject({
  file: SourceFilePathSchema,
  lines: z
    .tuple([
      z.number().int().positive('Start line must be positive'),
      z.number().int().positive('End line must be positive'),
    ])
    .refine(([start, end]) => end >= start, {
      message: 'End line must be >= start line',
    })
    .readonly(),
})
```

## ExtractionDiagnostics

### createDeprecatedTagDiagnostic

Build a \`deprecated-tag\` diagnostic that points the author at a replacement tag for a legacy annotation.

```ts
function createDeprecatedTagDiagnostic(
  filePath: string,
  deprecatedTag: string,
  replacementTag: string,
): ExtractionDiagnostic;
```

#### Parameters

| Parameter      | Type | Description                                           |
| -------------- | ---- | ----------------------------------------------------- |
| filePath       |      | Source file containing the deprecated tag.            |
| deprecatedTag  |      | The legacy tag found (with or without leading \`@\`). |
| replacementTag |      | The currently supported tag to use instead.           |

#### Returns

A diagnostic naming the deprecated tag and its replacement.

### createDiagnostic

Build an ExtractionDiagnostic, deriving its severity from the code.

```ts
function createDiagnostic(
  filePath: string,
  code: ExtractionDiagnosticCode,
  message: string,
  suggestion?: string,
): ExtractionDiagnostic;
```

#### Parameters

| Parameter  | Type | Description                                      |
| ---------- | ---- | ------------------------------------------------ |
| filePath   |      | Source file the diagnostic applies to.           |
| code       |      | Diagnostic code identifying the kind of problem. |
| message    |      | Human-readable description of the problem.       |
| suggestion |      | Optional remediation guidance.                   |

#### Returns

A fully populated diagnostic with the code's default severity.

### createPatternContractDiagnostics

Translate raw pattern-contract validation errors into de-duplicated extraction diagnostics for invalid pattern names and \`@architect-uses\` targets.

```ts
function createPatternContractDiagnostics(
  filePath: string,
  validationErrors: readonly string[],
): ExtractionDiagnostic[];
```

#### Parameters

| Parameter        | Type | Description                                    |
| ---------------- | ---- | ---------------------------------------------- |
| filePath         |      | Source file the validation errors came from.   |
| validationErrors |      | Raw error strings from the contract validator. |

#### Returns

Diagnostics for the recognized name/uses errors (empty if none match).

### createRemovedLayerTagDiagnostic

Build a \`deprecated-tag\` diagnostic for a removed layer tag that has no direct replacement, advising the author to remove it.

```ts
function createRemovedLayerTagDiagnostic(
  filePath: string,
  deprecatedTag: string,
): ExtractionDiagnostic;
```

#### Parameters

| Parameter     | Type | Description                                            |
| ------------- | ---- | ------------------------------------------------------ |
| filePath      |      | Source file containing the removed tag.                |
| deprecatedTag |      | The removed tag found (with or without leading \`@\`). |

#### Returns

A diagnostic advising removal of the legacy tag.

### EXTRACTION_DIAGNOSTIC_CODES

\## ExtractionDiagnostics - Pattern Extraction Diagnostic Codes Closed enum of diagnostic codes the extractor pipeline raises for malformed JSDoc / Gherkin directives. Consumers map codes to human-readable messages; never extend without coordinating with the extractor's emitting sites. ### When to Use - Extractor: emit a diagnostic with one of these codes - Lint/UI: format diagnostics with code-specific guidance

```ts
EXTRACTION_DIAGNOSTIC_CODES = [
  'unrecognized-status',
  'missing-status',
  'missing-pattern-name',
  'invalid-pattern-name',
  'invalid-uses-target',
  'invalid-enum-value',
  'invalid-unlock-reason',
  'deprecated-tag',
  'invalid-maturity-combination',
  'parse-failure',
] as const
```

### EXTRACTION_DIAGNOSTIC_SEVERITIES

The severity levels a diagnostic may carry, ordered most to least severe.

```ts
EXTRACTION_DIAGNOSTIC_SEVERITIES = ['error', 'warning', 'info'] as const
```

### EXTRACTION_DIAGNOSTIC_SEVERITY_BY_CODE

Lookup mapping every diagnostic code to its default severity level.

```ts
const EXTRACTION_DIAGNOSTIC_SEVERITY_BY_CODE: Readonly<
  Record<ExtractionDiagnosticCode, ExtractionDiagnosticSeverity>
>;
```

### ExtractionDiagnostic

A single diagnostic raised by the extractor — its source file, severity, code, message, and an optional remediation suggestion.

```ts
interface ExtractionDiagnostic {
  /** Path of the source file the diagnostic was raised against. */
  readonly filePath: string;
  /** Severity level of the diagnostic. */
  readonly severity: ExtractionDiagnosticSeverity;
  /** The diagnostic code identifying the kind of problem. */
  readonly code: ExtractionDiagnosticCode;
  /** Human-readable description of the problem. */
  readonly message: string;
  /** Optional guidance on how to fix the problem. */
  readonly suggestion?: string;
}
```

#### Properties

| Property   | Description                                                |
| ---------- | ---------------------------------------------------------- |
| filePath   | Path of the source file the diagnostic was raised against. |
| severity   | Severity level of the diagnostic.                          |
| code       | The diagnostic code identifying the kind of problem.       |
| message    | Human-readable description of the problem.                 |
| suggestion | Optional guidance on how to fix the problem.               |

### ExtractionDiagnosticCode

Union of the recognized extraction diagnostic code literals, derived from EXTRACTION_DIAGNOSTIC_CODES.

```ts
type ExtractionDiagnosticCode = (typeof EXTRACTION_DIAGNOSTIC_CODES)[number];
```

### ExtractionDiagnosticSeverity

Union of the diagnostic severity literals, derived from EXTRACTION_DIAGNOSTIC_SEVERITIES.

```ts
type ExtractionDiagnosticSeverity = (typeof EXTRACTION_DIAGNOSTIC_SEVERITIES)[number];
```

## MarkdownBlockParser

### parseMarkdownToBlocks

Parse markdown text into an ordered list of typed \`SectionBlock\` values. Runs a line-driven state machine that recognizes headings, code fences (including mermaid), pipe tables, ordered/unordered lists, separators, and paragraphs for the rendering pipeline.

```ts
function parseMarkdownToBlocks(content: string): readonly SectionBlock[];
```

#### Parameters

| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| content   |      | Raw markdown text to parse. |

#### Returns

The recognized blocks in document order.

## PatternGraph

### ArchIndexSchema

Schema for the architecture index — patterns indexed by role, context, layer, view, and package, plus the full set.

```ts
ArchIndexSchema = z.strictObject({
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byContext: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byLayer: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byView: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byPackage: z.record(z.string(), z.array(ExtractedPatternSchema)),
  all: z.array(ExtractedPatternSchema),
})
```

### ExactStatusGroupsSchema

Schema for patterns grouped by exact (un-normalized) status, including \`roadmap\` and \`deferred\`.

```ts
ExactStatusGroupsSchema = z.strictObject({
  candidate: z.array(ExtractedPatternSchema),
  roadmap: z.array(ExtractedPatternSchema),
  active: z.array(ExtractedPatternSchema),
  completed: z.array(ExtractedPatternSchema),
  deferred: z.array(ExtractedPatternSchema),
})
```

### FeatureParseErrorSchema

Schema for a feature-file parse failure record embedded in the graph.

```ts
FeatureParseErrorSchema = z.strictObject({
  type: z.literal('FEATURE_PARSE_ERROR'),
  message: z.string(),
  file: z.string(),
  reason: z.string(),
  originalError: z.unknown().optional(),
})
```

### ImplementationRefSchema

Schema for a reference to an implementing artifact — its name, file, and an optional description.

```ts
ImplementationRefSchema = z.strictObject({
  name: z.string(),
  file: z.string(),
  description: z.string().optional(),
})
```

### PatternGraphSchema

Schema for the canonical read model (the PatternGraph) — every pattern, the tag registry, the status/maturity/phase/role groupings, counts, the relationship index, and the optional architecture index.

```ts
PatternGraphSchema = z.strictObject({
  patterns: z.array(ExtractedPatternSchema),
  tagRegistry: TagRegistrySchema,
  byStatus: ExactStatusGroupsSchema,
  byNormalizedStatus: StatusGroupsSchema,
  byMaturity: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byPhase: z.array(PhaseGroupSchema),
  byQuarter: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),
  bySourceType: SourceViewsSchema,
  byProductArea: z.record(z.string(), z.array(ExtractedPatternSchema)),
  counts: StatusCountsSchema,
  phaseCount: z.number().int().nonnegative(),
  roleCount: z.number().int().nonnegative(),
  relationshipIndex: z.record(z.string(), RelationshipEntrySchema),
  archIndex: ArchIndexSchema.optional(),
  featureParseFailures: z.array(PatternParseFailureSchema).readonly().optional(),
})
```

### PatternParseFailureSchema

Schema for a spec that failed to parse — names the pattern, its path, and the underlying FeatureParseErrorSchema.

```ts
PatternParseFailureSchema = z.strictObject({
  kind: z.literal('spec-parse-failed'),
  patternName: z.string(),
  path: z.string(),
  message: z.string(),
  parseError: FeatureParseErrorSchema,
})
```

### PhaseGroupSchema

Schema for a single phase grouping — its number, optional name, member patterns, and status counts.

```ts
PhaseGroupSchema = z.strictObject({
  phaseNumber: z.number().int(),
  phaseName: z.string().optional(),
  patterns: z.array(ExtractedPatternSchema),
  counts: StatusCountsSchema,
})
```

### RelationshipEntrySchema

Schema for one pattern's entry in the relationship index — its forward and derived reverse edges.

```ts
RelationshipEntrySchema = z.strictObject({
  uses: z.array(z.string()),
  usedBy: z.array(z.string()),
  dependsOn: z.array(z.string()),
  enables: z.array(z.string()),
  implementsPatterns: z.array(z.string()),
  implementedBy: z.array(ImplementationRefSchema),
  extendsPattern: z.string().optional(),
  extendedBy: z.array(z.string()),
  seeAlso: z.array(z.string()),
  apiRef: z.array(z.string()),
})
```

### SourceViewsSchema

Schema for patterns grouped by source type (TypeScript / Gherkin / roadmap / PRD).

```ts
SourceViewsSchema = z.strictObject({
  typescript: z.array(ExtractedPatternSchema),
  gherkin: z.array(ExtractedPatternSchema),
  roadmap: z.array(ExtractedPatternSchema),
  prd: z.array(ExtractedPatternSchema),
})
```

### StatusCountsSchema

Schema for per-status pattern counts plus a total.

```ts
StatusCountsSchema = z.strictObject({
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})
```

### StatusGroupsSchema

Schema for patterns grouped by normalized status (completed / active / planned / candidate).

```ts
StatusGroupsSchema = z.strictObject({
  completed: z.array(ExtractedPatternSchema),
  active: z.array(ExtractedPatternSchema),
  planned: z.array(ExtractedPatternSchema),
  candidate: z.array(ExtractedPatternSchema),
})
```

## ResultMonadTypes

### Err

Error branch of a Result — carries the failure.

```ts
interface Err<E> {
  /** Discriminant marking this as the error branch. */
  ok: false;
  /** The error describing the failure. */
  error: E;
}
```

#### Properties

| Property | Description                                    |
| -------- | ---------------------------------------------- |
| ok       | Discriminant marking this as the error branch. |
| error    | The error describing the failure.              |

### Ok

Success branch of a Result — carries the produced value.

```ts
interface Ok<T> {
  /** Discriminant marking this as the success branch. */
  ok: true;
  /** The successfully produced value. */
  value: T;
}
```

#### Properties

| Property | Description                                      |
| -------- | ------------------------------------------------ |
| ok       | Discriminant marking this as the success branch. |
| value    | The successfully produced value.                 |

### Result

Result type representing either success (Ok) or failure (Err).

```ts
type Result<T, E = Error> = Ok<T> | Err<E>;
```

### Result

Result utilities for creating and inspecting Result values.

```ts
Result = {
  /**
   * Create a success result
   */
  ok: <T>(value: T): Result<T, never> => ({ ok: true, value }),

  /**
   * Create an error result
   */
  err: <E = Error>(error: E): Result<never, E> => ({ ok: false, error }),

  /**
   * Type guard for success results
   */
  isOk: <T, E>(result: Result<T, E>): result is Ok<T> => result.ok,

  /**
   * Type guard for error results
   */
  isErr: <T, E>(result: Result<T, E>): result is Err<E> => !result.ok,

  /**
   * Extract value or throw error.
   * If the error is not an Error instance, it will be wrapped in one
   * to ensure proper stack traces and error handling.
   */
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.ok) {
      return result.value;
    }
    if (result.error instanceof Error) {
      throw result.error;
    }
    const errorMessage =
      typeof result.error === 'object' && result.error !== null
        ? JSON.stringify(result.error)
        : String(result.error);
    throw new Error(errorMessage);
  },

  /**
   * Extract value or return default
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T =>
    result.ok ? result.value : defaultValue,

  /**
   * Transform success value
   */
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    if (result.ok) {
      return { ok: true, value: fn(result.value) };
    }
    return result;
  },

  /**
   * Transform error value
   */
  mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    if (result.ok) {
      return result;
    }
    return { ok: false, error: fn(result.error) };
  },
}
```

## TagRegistrySchemas

### AggregationTagDefinitionSchema

Schema for an aggregation tag definition — its tag, target document (or \`null\`), and purpose.

```ts
AggregationTagDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Aggregation tag cannot be empty').max(100),
  targetDoc: z.string().max(200).nullable(),
  purpose: z.string().max(1000),
})
```

### buildRoleLookup

Build (and memoize per registry) the RoleLookup tables for resolving role tags and aliases.

```ts
function buildRoleLookup(registry: TagRegistry): RoleLookup;
```

#### Parameters

| Parameter | Type | Description                              |
| --------- | ---- | ---------------------------------------- |
| registry  |      | The tag registry to derive lookups from. |

#### Returns

The cached or freshly built role lookup tables.

### createDefaultTagRegistry

Build the default tag registry from the compiled-in taxonomy, materializing its role, metadata, and aggregation tag definitions.

```ts
function createDefaultTagRegistry(): TagRegistry;
```

#### Returns

A fresh, fully populated default tag registry.

### isKnownRoleTag

Report whether a raw value is a recognized role tag or alias in the registry.

```ts
function isKnownRoleTag(registry: TagRegistry, rawValue: string): boolean;
```

#### Parameters

| Parameter | Type | Description                        |
| --------- | ---- | ---------------------------------- |
| registry  |      | The tag registry to check against. |
| rawValue  |      | The candidate role tag or alias.   |

#### Returns

\`true\` if the value is a known canonical tag or alias.

### mergeTagRegistries

Merge an override registry onto a base registry, combining tag arrays by \`tag\` (override wins) and replacing scalar fields when present.

```ts
function mergeTagRegistries(base: TagRegistry, override: Partial<TagRegistry>): TagRegistry;
```

#### Parameters

| Parameter | Type | Description                                        |
| --------- | ---- | -------------------------------------------------- |
| base      |      | The base registry to start from.                   |
| override  |      | Partial registry whose set fields take precedence. |

#### Returns

The merged registry.

### MetadataTagDefinitionSchema

Schema for a metadata tag definition — its tag, value format, purpose, and the flags/values/transform governing how it is parsed.

```ts
MetadataTagDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Metadata tag cannot be empty').max(100),
  format: z.enum(FORMAT_TYPES),
  purpose: z.string().max(1000),
  required: z.boolean().optional(),
  repeatable: z.boolean().optional(),
  values: z.array(z.string().max(200)).max(50).optional(),
  default: z.string().max(200).optional(),
  example: z.string().max(500).optional(),
  metadataKey: z.string().max(100).optional(),
  transform: z.enum(KNOWN_TRANSFORM_NAMES).optional(),
})
```

### resolveCanonicalRole

Resolve a raw role value to its canonical role tag, following aliases.

```ts
function resolveCanonicalRole(
  registry: TagRegistry,
  rawValue: string | undefined,
): string | undefined;
```

#### Parameters

| Parameter | Type | Description                                                    |
| --------- | ---- | -------------------------------------------------------------- |
| registry  |      | The tag registry to resolve against.                           |
| rawValue  |      | The raw role value (canonical tag or alias), or \`undefined\`. |

#### Returns

The canonical role tag, or \`undefined\` if unknown or input was \`undefined\`.

### RoleDefinitionSchema

Schema for a role definition — its canonical tag, domain, priority, optional description, aliases, and diagram shape.

```ts
RoleDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Role tag cannot be empty').max(100),
  domain: z.string().min(1, 'Role domain cannot be empty').max(200),
  priority: z.number().int().positive('Priority must be a positive integer'),
  description: z.string().max(1000).optional(),
  aliases: z.array(z.string().max(100)).max(20).optional(),
  diagramShape: z.enum(DIAGRAM_SHAPE_VALUES).optional(),
})
```

### RoleLookup

Pre-computed lookup tables for resolving role tags and their aliases.

```ts
interface RoleLookup {
  /** Map of canonical role tag to itself, for membership/identity checks. */
  readonly canonical: ReadonlyMap<string, string>;
  /** Map of alias to the canonical role tag it resolves to. */
  readonly aliases: ReadonlyMap<string, string>;
  /** Set of every recognized tag (canonical tags and aliases). */
  readonly all: ReadonlySet<string>;
}
```

#### Properties

| Property  | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| canonical | Map of canonical role tag to itself, for membership/identity checks. |
| aliases   | Map of alias to the canonical role tag it resolves to.               |
| all       | Set of every recognized tag (canonical tags and aliases).            |

### TagRegistrySchema

Schema for the full tag registry — version, role/metadata/aggregation tag definitions, format options, and the configured tag prefix.

```ts
TagRegistrySchema = z.strictObject({
  $schema: z.string().max(500).optional(),
  version: z.string().max(20),
  roles: z.array(RoleDefinitionSchema).max(1000),
  metadataTags: z.array(MetadataTagDefinitionSchema).max(100),
  aggregationTags: z.array(AggregationTagDefinitionSchema).max(50),
  formatOptions: z.array(z.string().max(50)).max(20),
  tagPrefix: z.string().max(50),
  fileOptInTag: z.string().max(50),
})
```

---

[← Back to API Reference](../API-REFERENCE.md)
