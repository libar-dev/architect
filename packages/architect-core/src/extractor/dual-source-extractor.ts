/**
 * @architect
 * @architect-pattern DualSourceExtractor
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:extractor
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import type { ExtractedPattern } from '../types/index.js';
import { getPatternName } from '../read-api/pattern-helpers.js';
import {
  DeliverableSchema,
  ProcessMetadataSchema,
  type CrossValidationError,
  type Deliverable,
  type ProcessMetadata,
  type ScannedGherkinFile,
  type ValidationSummary,
} from '../validation-schemas/index.js';
import { DELIVERABLE_STATUS_VALUES, DEFAULT_STATUS } from '../taxonomy/index.js';
import { createDiagnostic, type ExtractionDiagnostic } from './extraction-diagnostics.js';

export type { ProcessMetadata, Deliverable, CrossValidationError, ValidationSummary };

export interface DualSourceResults {
  readonly patterns: readonly DualSourcePattern[];
  readonly codeOnly: readonly ExtractedPattern[];
  readonly featureOnly: readonly ProcessMetadata[];
  readonly validationErrors: readonly CrossValidationError[];
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
  const phaseTag = tags.find((tag) => tag.startsWith('phase:'));
  const statusTag = tags.find((tag) => tag.startsWith('status:'));
  if (!patternTag || !phaseTag) return null;

  const pattern = patternTag.replace('pattern:', '');
  const phase = parseInt(phaseTag.replace('phase:', ''), 10);
  const status = statusTag?.replace('status:', '') ?? DEFAULT_STATUS;

  const quarter = tags.find((tag) => tag.startsWith('quarter:'))?.replace('quarter:', '');
  const effort = tags.find((tag) => tag.startsWith('effort:'))?.replace('effort:', '');
  const team = tags.find((tag) => tag.startsWith('team:'))?.replace('team:', '');
  const workflow = tags.find((tag) => tag.startsWith('workflow:'))?.replace('workflow:', '');
  const completed = tags.find((tag) => tag.startsWith('completed:'))?.replace('completed:', '');
  const effortActual = tags
    .find((tag) => tag.startsWith('effort-actual:'))
    ?.replace('effort-actual:', '');
  const risk = tags.find((tag) => tag.startsWith('risk:'))?.replace('risk:', '');
  const productArea = tags
    .find((tag) => tag.startsWith('product-area:'))
    ?.replace('product-area:', '');
  const userRole = tags.find((tag) => tag.startsWith('user-role:'))?.replace('user-role:', '');
  const businessValueRaw = tags
    .find((tag) => tag.startsWith('business-value:'))
    ?.replace('business-value:', '');
  const businessValue = businessValueRaw?.replace(/^["']|["']$/g, '');

  const validation = ProcessMetadataSchema.safeParse({
    pattern,
    phase,
    status,
    ...(quarter && { quarter }),
    ...(effort && { effort }),
    ...(team && { team }),
    ...(workflow && { workflow }),
    ...(completed && { completed }),
    ...(effortActual && { effortActual }),
    ...(risk && { risk }),
    ...(productArea && { productArea }),
    ...(userRole && { userRole }),
    ...(businessValue && { businessValue }),
  });

  if (!validation.success) {
    console.warn(
      `Process metadata validation failed in ${feature.filePath}: ` +
        validation.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ')
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
    const releaseIdx = headers.findIndex((header) => header.toLowerCase() === 'release');

    const deliverableHeader = headers[deliverableIdx];
    const statusHeader = statusIdx >= 0 ? headers[statusIdx] : undefined;
    const testsHeader = testsIdx >= 0 ? headers[testsIdx] : undefined;
    const locationHeader = locationIdx >= 0 ? headers[locationIdx] : undefined;
    const findingHeader = findingIdx >= 0 ? headers[findingIdx] : undefined;
    const releaseHeader = releaseIdx >= 0 ? headers[releaseIdx] : undefined;

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
        ...(releaseHeader && row[releaseHeader]?.trim()
          ? { release: row[releaseHeader].trim() }
          : {}),
      });

      if (!validation.success) {
        const statusIssue = validation.error.issues.find(
          (issue) => issue.path.length === 1 && issue.path[0] === 'status'
        );
        if (statusIssue) {
          const rawStatus = statusHeader ? (row[statusHeader]?.trim() ?? '') : '';
          diagnostics.push(
            createDiagnostic(
              feature.filePath,
              'invalid-enum-value',
              `Unrecognized deliverable status '${rawStatus}'`,
              `Valid values: ${DELIVERABLE_STATUS_VALUES.join(', ')}`
            )
          );
        } else {
          console.warn(
            `Deliverable validation failed in ${feature.filePath}: ` +
              validation.error.issues
                .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                .join(', ')
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
  featureFiles: readonly ScannedGherkinFile[]
): DualSourceResults {
  const combined: DualSourcePattern[] = [];
  const codeOnly: ExtractedPattern[] = [];
  const featureOnly: ProcessMetadata[] = [];
  const validationErrors: CrossValidationError[] = [];
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

    if (primaryPattern.phase !== undefined && processMetadata.phase !== primaryPattern.phase) {
      validationErrors.push({
        codeName: patternName,
        featureName: processMetadata.pattern,
        codePhase: primaryPattern.phase,
        featurePhase: processMetadata.phase,
        sources: {
          code: primaryPattern.source.file,
          feature: featureFile.filePath,
        },
        message: `Phase mismatch: code has ${String(primaryPattern.phase)}, feature has ${String(processMetadata.phase)}`,
      });
    }

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
          codePatternArray.map((pattern) => pattern.source.file).join(', ')
      );
    }

    featureIndex.delete(patternName);
  }

  for (const { metadata } of featureIndex.values()) {
    featureOnly.push(metadata);
  }

  return { patterns: combined, codeOnly, featureOnly, validationErrors, warnings, diagnostics };
}

export function validateDualSource(results: DualSourceResults): ValidationSummary {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const error of results.validationErrors) {
    errors.push(`${error.codeName}: ${error.message}`);
  }
  for (const pattern of results.codeOnly) {
    if (pattern.status === DEFAULT_STATUS) {
      warnings.push(
        `Roadmap pattern "${getPatternName(pattern)}" has code stub but no feature file`
      );
    }
  }
  for (const metadata of results.featureOnly) {
    if (metadata.status === DEFAULT_STATUS) {
      warnings.push(
        `Feature "${metadata.pattern}" (phase ${String(metadata.phase)}) has no code stub`
      );
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}
