/**
 * @architect-bounded-context:pattern-relations
 */
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { OpenQuestionList } from '../../fragments/pattern-relations/index.js';

import { filterPatterns } from '../_shared/filter.js';
import {
  extractOpenQuestions,
  getPatternName,
  isDefined,
} from '../_shared/pattern-helpers.internal.js';
import { resolveParentChildNames } from './pattern-catalog.internal.js';

export const OpenQuestionListOptionsSchema = z
  .strictObject({
    parent: z.string().optional(),
    includeSelf: z.boolean().optional(),
  })
  .readonly();

export type OpenQuestionListOptions = z.infer<typeof OpenQuestionListOptionsSchema>;

export function buildOpenQuestionList(
  context: ProjectionContext,
  options: OpenQuestionListOptions = {},
): OpenQuestionList {
  const parentChildNames = resolveParentChildNames(
    context,
    options.parent,
    options.includeSelf === true,
  );
  const items = filterPatterns(context.graph.patterns, context.projectionFilter)
    .map((pattern) => {
      const patternName = getPatternName(pattern);
      if (parentChildNames !== undefined && !parentChildNames.has(patternName)) {
        return undefined;
      }

      const questions = extractOpenQuestions(pattern.directive.description);
      if (questions.length === 0) {
        return undefined;
      }

      return {
        pattern: patternName,
        status: pattern.status,
        file: pattern.source.file,
        questions,
      };
    })
    .filter(isDefined)
    .sort((left, right) => left.pattern.localeCompare(right.pattern));

  return {
    kind: 'OpenQuestionList',
    filters: {
      ...(options.parent !== undefined ? { parent: options.parent } : {}),
    },
    count: items.length,
    items,
  };
}
