/**
 * @architect
 * @architect-pattern OpenQuestionListProjection
 * @architect-status active
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts
 * @architect-bounded-context:projection
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { OpenQuestionList } from '../../fragments/pattern-relations/index.js';

import {
  buildOpenQuestionList,
  OpenQuestionListOptionsSchema,
  type OpenQuestionListOptions,
} from './open-question-list.internal.js';

export { OpenQuestionListOptionsSchema };
export type { OpenQuestionListOptions };

export function projectOpenQuestionList(
  context: ProjectionContext,
  options: OpenQuestionListOptions = {}
): ProjectionBundle<OpenQuestionList> {
  return projectSingle(buildOpenQuestionList(context, options));
}

export function parseAndProjectOpenQuestionList(
  context: ProjectionContext,
  rawOptions: unknown = {}
): ProjectionBundle<OpenQuestionList> {
  return projectOpenQuestionList(context, OpenQuestionListOptionsSchema.parse(rawOptions));
}
