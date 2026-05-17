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

export type ExtractionDiagnosticCode = (typeof EXTRACTION_DIAGNOSTIC_CODES)[number];

export const EXTRACTION_DIAGNOSTIC_SEVERITIES = ['error', 'warning', 'info'] as const;
export type ExtractionDiagnosticSeverity = (typeof EXTRACTION_DIAGNOSTIC_SEVERITIES)[number];

export interface ExtractionDiagnostic {
  readonly filePath: string;
  readonly severity: ExtractionDiagnosticSeverity;
  readonly code: ExtractionDiagnosticCode;
  readonly message: string;
  readonly suggestion?: string;
}

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
