/**
 * @architect-bounded-context:documentation-composition
 */
/**
 * Builds the PR change review options schema and branch-matching helpers.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import { z } from 'zod';

import { list, paragraph, type Block } from '@libar-dev/architect-core';
import type { ProjectionContext } from '../../context/projection-context.js';
import type { PrChangeReview } from '../../fragments/documentation-composition/index.js';
import { filterPatterns } from '../_shared/filter.js';
import { getPatternName } from '../_shared/pattern-helpers.internal.js';

import { dedupeStrings } from './documentation-composition-shared.internal.js';

export const ProjectPrChangeReviewOptionsSchema = z
  .strictObject({
    changedFiles: z.array(z.string()).readonly(),
    branch: z.string(),
  })
  .readonly();

export type ProjectPrChangeReviewOptions = z.infer<typeof ProjectPrChangeReviewOptionsSchema>;

export function buildPrChangeReview(
  context: ProjectionContext,
  options: ProjectPrChangeReviewOptions,
): PrChangeReview {
  const changedFiles = dedupeStrings(options.changedFiles);
  const affectedPatterns = filterPatterns(context.graph.patterns, context.projectionFilter)
    .filter((pattern) => patternMatchesChangedFiles(pattern, changedFiles))
    .map(getPatternName)
    .sort((left, right) => left.localeCompare(right));

  const recommendations: Block[] =
    affectedPatterns.length === 0
      ? [
          paragraph(
            `No patterns were matched from ${String(changedFiles.length)} changed ${changedFiles.length === 1 ? 'file' : 'files'} on branch ${options.branch}.`,
          ),
          list([
            'Review whether the changed files belong to unannotated implementation surfaces.',
            'Confirm the PR still includes the intended architecture-linked deliverables before merge.',
          ]),
        ]
      : [
          paragraph(
            `Branch ${options.branch} touches ${String(affectedPatterns.length)} affected ${affectedPatterns.length === 1 ? 'pattern' : 'patterns'}.`,
          ),
          list([
            'Verify affected business rules and deliverables still match the changed files.',
            `Review dependency impact for: ${affectedPatterns.join(', ')}.`,
            'Run the projection package verification gates before merge.',
          ]),
        ];

  return {
    kind: 'PrChangeReview',
    branch: options.branch,
    changedFiles,
    affectedPatterns,
    recommendations,
  };
}

function patternMatchesChangedFiles(
  pattern: ExtractedPattern,
  changedFiles: readonly string[],
): boolean {
  if (changedFiles.length === 0) {
    return false;
  }

  const references = dedupeStrings([
    pattern.source.file,
    ...(pattern.behaviorFile !== undefined ? [pattern.behaviorFile] : []),
    ...(pattern.targetPath !== undefined ? [pattern.targetPath] : []),
    ...(pattern.executableSpecs ?? []),
    ...(pattern.deliverables?.map((deliverable) => deliverable.location) ?? []),
  ]).map(normalizePath);

  return changedFiles
    .map(normalizePath)
    .some((changedFile) =>
      references.some(
        (reference) =>
          reference === changedFile ||
          reference.endsWith(`/${changedFile}`) ||
          changedFile.endsWith(`/${reference}`),
      ),
    );
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').trim();
}
