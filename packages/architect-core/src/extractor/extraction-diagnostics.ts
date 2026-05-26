/**
 * @architect
 * @architect-pattern ExtractionDiagnostics
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:extractor
 *
 * ## ExtractionDiagnostics - Pattern Extraction Diagnostic Codes
 *
 * Closed enum of diagnostic codes the extractor pipeline raises for
 * malformed JSDoc / Gherkin directives. Consumers map codes to
 * human-readable messages; never extend without coordinating with the
 * extractor's emitting sites.
 *
 * ### When to Use
 *
 * - Extractor: emit a diagnostic with one of these codes
 * - Lint/UI: format diagnostics with code-specific guidance
 *
 * @architect-shape
 */
export const EXTRACTION_DIAGNOSTIC_CODES = [
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
] as const;

/**
 * Union of the recognized extraction diagnostic code literals, derived from
 * {@link EXTRACTION_DIAGNOSTIC_CODES}.
 *
 * @architect-shape
 */
export type ExtractionDiagnosticCode = (typeof EXTRACTION_DIAGNOSTIC_CODES)[number];

/**
 * The severity levels a diagnostic may carry, ordered most to least severe.
 *
 * @architect-shape
 */
export const EXTRACTION_DIAGNOSTIC_SEVERITIES = ['error', 'warning', 'info'] as const;

/**
 * Union of the diagnostic severity literals, derived from
 * {@link EXTRACTION_DIAGNOSTIC_SEVERITIES}.
 *
 * @architect-shape
 */
export type ExtractionDiagnosticSeverity = (typeof EXTRACTION_DIAGNOSTIC_SEVERITIES)[number];

/**
 * A single diagnostic raised by the extractor — its source file, severity,
 * code, message, and an optional remediation suggestion.
 *
 * @architect-shape
 */
export interface ExtractionDiagnostic {
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

/**
 * Lookup mapping every diagnostic code to its default severity level.
 *
 * @architect-shape
 */
export const EXTRACTION_DIAGNOSTIC_SEVERITY_BY_CODE: Readonly<
  Record<ExtractionDiagnosticCode, ExtractionDiagnosticSeverity>
> = {
  'unrecognized-status': 'error',
  'missing-status': 'warning',
  'missing-pattern-name': 'warning',
  'invalid-pattern-name': 'error',
  'invalid-uses-target': 'error',
  'invalid-enum-value': 'warning',
  'invalid-unlock-reason': 'warning',
  'deprecated-tag': 'warning',
  'invalid-maturity-combination': 'warning',
  'parse-failure': 'error',
};

/**
 * Build an {@link ExtractionDiagnostic}, deriving its severity from the code.
 *
 * @architect-shape
 * @param filePath - Source file the diagnostic applies to.
 * @param code - Diagnostic code identifying the kind of problem.
 * @param message - Human-readable description of the problem.
 * @param suggestion - Optional remediation guidance.
 * @returns A fully populated diagnostic with the code's default severity.
 */
export function createDiagnostic(
  filePath: string,
  code: ExtractionDiagnosticCode,
  message: string,
  suggestion?: string,
): ExtractionDiagnostic {
  return {
    filePath,
    severity: EXTRACTION_DIAGNOSTIC_SEVERITY_BY_CODE[code],
    code,
    message,
    ...(suggestion !== undefined ? { suggestion } : {}),
  };
}

function normalizeDeprecatedTag(tag: string): string {
  const withoutAt = tag.startsWith('@') ? tag.substring(1) : tag;
  return withoutAt.startsWith('architect-') ? withoutAt.substring('architect-'.length) : withoutAt;
}

/**
 * Build a `deprecated-tag` diagnostic that points the author at a replacement
 * tag for a legacy annotation.
 *
 * @architect-shape
 * @param filePath - Source file containing the deprecated tag.
 * @param deprecatedTag - The legacy tag found (with or without leading `@`).
 * @param replacementTag - The currently supported tag to use instead.
 * @returns A diagnostic naming the deprecated tag and its replacement.
 */
export function createDeprecatedTagDiagnostic(
  filePath: string,
  deprecatedTag: string,
  replacementTag: string,
): ExtractionDiagnostic {
  const normalizedTag = normalizeDeprecatedTag(deprecatedTag);
  return createDiagnostic(
    filePath,
    'deprecated-tag',
    `Deprecated tag '${normalizedTag}' is no longer recognized`,
    `Use ${replacementTag} instead of legacy tag '${normalizedTag}'`,
  );
}

/**
 * Build a `deprecated-tag` diagnostic for a removed layer tag that has no
 * direct replacement, advising the author to remove it.
 *
 * @architect-shape
 * @param filePath - Source file containing the removed tag.
 * @param deprecatedTag - The removed tag found (with or without leading `@`).
 * @returns A diagnostic advising removal of the legacy tag.
 */
export function createRemovedLayerTagDiagnostic(
  filePath: string,
  deprecatedTag: string,
): ExtractionDiagnostic {
  const normalizedTag = normalizeDeprecatedTag(deprecatedTag);
  return createDiagnostic(
    filePath,
    'deprecated-tag',
    `Deprecated tag '${normalizedTag}' is no longer recognized`,
    'Remove the legacy tag. Wave 1 has no direct replacement; author @architect-bounded-context only when the annotation is actually expressing bounded-context ownership.',
  );
}

/**
 * Translate raw pattern-contract validation errors into de-duplicated
 * extraction diagnostics for invalid pattern names and `@architect-uses`
 * targets.
 *
 * @architect-shape
 * @param filePath - Source file the validation errors came from.
 * @param validationErrors - Raw error strings from the contract validator.
 * @returns Diagnostics for the recognized name/uses errors (empty if none match).
 */
export function createPatternContractDiagnostics(
  filePath: string,
  validationErrors: readonly string[],
): ExtractionDiagnostic[] {
  const diagnostics: ExtractionDiagnostic[] = [];
  const seen = new Set<string>();

  for (const validationError of validationErrors) {
    const trimmed = validationError.trim();
    if (trimmed.startsWith('name:') || trimmed.startsWith('patternName:')) {
      const message = trimmed.replace(/^(name|patternName):\s*/u, '');
      const key = `invalid-pattern-name:${message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      diagnostics.push(
        createDiagnostic(
          filePath,
          'invalid-pattern-name',
          `Invalid @architect-pattern identifier. ${message}`,
          'Use @architect-pattern PascalCaseName and keep headings descriptive only.',
        ),
      );
      continue;
    }

    if (trimmed.startsWith('uses.')) {
      const message = trimmed.replace(/^uses\.\d+:\s*/u, '');
      const key = `invalid-uses-target:${message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      diagnostics.push(
        createDiagnostic(
          filePath,
          'invalid-uses-target',
          `Invalid @architect-uses target. ${message}`,
          'Use a declared pattern name like SomePattern or package-id:SomePattern.',
        ),
      );
    }
  }

  return diagnostics;
}
