/**
 * @architect
 * @architect-pattern DualSourceExtractor
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:extractor
 * @architect-uses ExtractedPattern, PatternHelpers, GherkinScanResultContract
 */
import type { ExtractedPattern } from '../types/index.js';
import { getPatternName } from '../read-api/pattern-helpers.js';
import {
  DeliverableSchema,
  ProcessMetadataSchema,
  type Deliverable,
  type ProcessMetadata,
  type ScannedGherkinFile,
  type ValidationSummary,
} from '../validation-schemas/index.js';
import { DELIVERABLE_STATUS_VALUES, DEFAULT_STATUS } from '../taxonomy/index.js';
import { createDiagnostic, type ExtractionDiagnostic } from './extraction-diagnostics.js';

export type { ProcessMetadata, Deliverable, ValidationSummary };

export interface DualSourceResults {
  readonly patterns: readonly DualSourcePattern[];
  readonly codeOnly: readonly ExtractedPattern[];
  readonly featureOnly: readonly ProcessMetadata[];
  readonly warnings: readonly string[];
  readonly diagnostics: readonly ExtractionDiagnostic[];
}

export interface ExtractDeliverablesResult {
  readonly deliverables: readonly Deliverable[];
  readonly diagnostics: readonly ExtractionDiagnostic[];
}

export interface DualSourcePattern extends ExtractedPattern {
  readonly process?: ProcessMetadata;
  readonly deliverables?: readonly Deliverable[];
  readonly sources?: readonly ExtractedPattern[];
}

export function extractProcessMetadata(feature: ScannedGherkinFile): ProcessMetadata | null {
  const tags = feature.feature.tags;
  const patternTag = tags.find((tag) => tag.startsWith('pattern:'));
  const statusTag = tags.find((tag) => tag.startsWith('status:'));
  if (!patternTag) return null;

  const pattern = patternTag.replace('pattern:', '');
  const status = statusTag?.replace('status:', '') ?? DEFAULT_STATUS;

  const team = tags.find((tag) => tag.startsWith('team:'))?.replace('team:', '');
  const workflow = tags.find((tag) => tag.startsWith('workflow:'))?.replace('workflow:', '');
  const productArea = tags
    .find((tag) => tag.startsWith('product-area:'))
    ?.replace('product-area:', '');

  const validation = ProcessMetadataSchema.safeParse({
    pattern,
    status,
    ...(team && { team }),
    ...(workflow && { workflow }),
    ...(productArea && { productArea }),
  });

  if (!validation.success) {
    console.warn(
      `Process metadata validation failed in ${feature.filePath}: ` +
        validation.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', '),
    );
    return null;
  }

  return validation.data;
}

function parseTestsValue(value: string): number {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'yes' || trimmed === 'true' || trimmed === '✓' || trimmed === '✅') return 1;
  if (
    trimmed === 'no' ||
    trimmed === 'false' ||
    trimmed === '✗' ||
    trimmed === '' ||
    trimmed === '-'
  ) {
    return 0;
  }
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function extractDeliverables(feature: ScannedGherkinFile): ExtractDeliverablesResult {
  if (!feature.background) return { deliverables: [], diagnostics: [] };

  const deliverables: Deliverable[] = [];
  const diagnostics: ExtractionDiagnostic[] = [];
  for (const step of feature.background.steps) {
    if (!step.dataTable) continue;

    const { headers, rows } = step.dataTable;
    const deliverableIdx = headers.findIndex((header) => header.toLowerCase() === 'deliverable');
    if (deliverableIdx === -1) continue;

    const statusIdx = headers.findIndex((header) => header.toLowerCase() === 'status');
    const testsIdx = headers.findIndex((header) => header.toLowerCase() === 'tests');
    const locationIdx = headers.findIndex((header) => header.toLowerCase() === 'location');
    const findingIdx = headers.findIndex((header) => header.toLowerCase() === 'finding');

    const deliverableHeader = headers[deliverableIdx];
    const statusHeader = statusIdx >= 0 ? headers[statusIdx] : undefined;
    const testsHeader = testsIdx >= 0 ? headers[testsIdx] : undefined;
    const locationHeader = locationIdx >= 0 ? headers[locationIdx] : undefined;
    const findingHeader = findingIdx >= 0 ? headers[findingIdx] : undefined;

    if (!deliverableHeader) continue;

    for (const row of rows) {
      const validation = DeliverableSchema.safeParse({
        name: row[deliverableHeader]?.trim() ?? '',
        status: statusHeader ? (row[statusHeader]?.trim() ?? '').toLowerCase() : '',
        tests: parseTestsValue(testsHeader ? (row[testsHeader]?.trim() ?? '0') : '0'),
        location: locationHeader ? (row[locationHeader]?.trim() ?? '') : '',
        ...(findingHeader && row[findingHeader]?.trim()
          ? { finding: row[findingHeader].trim() }
          : {}),
      });

      if (!validation.success) {
        const statusIssue = validation.error.issues.find(
          (issue) => issue.path.length === 1 && issue.path[0] === 'status',
        );
        if (statusIssue) {
          const rawStatus = statusHeader ? (row[statusHeader]?.trim() ?? '') : '';
          diagnostics.push(
            createDiagnostic(
              feature.filePath,
              'invalid-enum-value',
              `Unrecognized deliverable status '${rawStatus}'`,
              `Valid values: ${DELIVERABLE_STATUS_VALUES.join(', ')}`,
            ),
          );
        } else {
          console.warn(
            `Deliverable validation failed in ${feature.filePath}: ` +
              validation.error.issues
                .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                .join(', '),
          );
        }
        continue;
      }

      deliverables.push(validation.data);
    }
  }

  return { deliverables, diagnostics };
}

export function combineSources(
  codePatterns: readonly ExtractedPattern[],
  featureFiles: readonly ScannedGherkinFile[],
): DualSourceResults {
  const combined: DualSourcePattern[] = [];
  const codeOnly: ExtractedPattern[] = [];
  const featureOnly: ProcessMetadata[] = [];
  const warnings: string[] = [];
  const diagnostics: ExtractionDiagnostic[] = [];

  const codeIndex = new Map<string, ExtractedPattern[]>();
  for (const pattern of codePatterns) {
    if (pattern.patternName) {
      const existing = codeIndex.get(pattern.patternName) ?? [];
      codeIndex.set(pattern.patternName, [...existing, pattern]);
    }
  }

  const featureIndex = new Map<string, { metadata: ProcessMetadata; file: ScannedGherkinFile }>();
  for (const feature of featureFiles) {
    const metadata = extractProcessMetadata(feature);
    if (metadata) featureIndex.set(metadata.pattern, { metadata, file: feature });
  }

  for (const [patternName, codePatternArray] of codeIndex.entries()) {
    const featureData = featureIndex.get(patternName);
    if (!featureData) {
      codeOnly.push(...codePatternArray);
      continue;
    }

    const { metadata: processMetadata, file: featureFile } = featureData;
    const hasCollision = codePatternArray.length > 1;
    const primaryPattern = codePatternArray[0];
    if (!primaryPattern) continue;

    const { deliverables, diagnostics: deliverableDiagnostics } = extractDeliverables(featureFile);
    diagnostics.push(...deliverableDiagnostics);

    const { deliverables: _existingDeliverables, ...patternWithoutDeliverables } = primaryPattern;
    combined.push({
      ...patternWithoutDeliverables,
      process: processMetadata,
      ...(deliverables.length > 0 && { deliverables }),
      ...(hasCollision && { sources: codePatternArray }),
    });

    if (hasCollision) {
      warnings.push(
        `Pattern name collision: "${patternName}" defined in ${String(codePatternArray.length)} files: ` +
          codePatternArray.map((pattern) => pattern.source.file).join(', '),
      );
    }

    featureIndex.delete(patternName);
  }

  for (const { metadata } of featureIndex.values()) {
    featureOnly.push(metadata);
  }

  return { patterns: combined, codeOnly, featureOnly, warnings, diagnostics };
}

export function validateDualSource(results: DualSourceResults): ValidationSummary {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const pattern of results.codeOnly) {
    if (pattern.status === DEFAULT_STATUS) {
      warnings.push(
        `Roadmap pattern "${getPatternName(pattern)}" has code stub but no feature file`,
      );
    }
  }
  for (const metadata of results.featureOnly) {
    if (metadata.status === DEFAULT_STATUS) {
      warnings.push(`Feature "${metadata.pattern}" has no code stub`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}
