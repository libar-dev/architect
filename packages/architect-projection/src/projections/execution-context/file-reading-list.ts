/**
 * @architect
 * @architect-pattern FileReadingListProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses ExecutionContextProjectionSupport, ProjectionFragmentContracts, FileReadingList
 * @architect-bounded-context:projection
 *
 * **Value:** Assembles the canonical `FileReadingList` for a pattern —
 * separating primary source/test/stub files from completed-dependency,
 * roadmap-dependency, and architecture-neighbor files — so sessions open the
 * same reading order regardless of caller.
 *
 * **Invariant:** Primary files always include the pattern's source, test
 * files, deliverable locations, and stub files; related buckets populate only
 * when `includeRelated` is not false; returns `undefined` when the pattern
 * does not resolve; options are parsed through `FileReadingListOptionsSchema`.
 *
 * **Behavior:**
 * - Routes each dependency's source and test files into `completedDeps` or
 *   `roadmapDeps` based on `isPatternComplete(status)`; completed
 *   dependencies also contribute their `implementedBy` reference files.
 * - Collects architecture neighbors from `context.graph.archIndex.byContext`
 *   and sorts them with legacy parity: source paths alphabetical first,
 *   `architect/stubs/` paths pinned to the end.
 * - Deduplicates every bucket via `pushUnique` so no file appears twice.
 *
 * ### When to Use
 *
 * - Projects the reading-list fragment that orders a pattern's primary, dependency, and neighbor files.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { FileReadingList } from '../../fragments/execution-context/index.js';

import {
  FileReadingListOptionsSchema,
  buildFileReadingList,
  type FileReadingListOptions,
} from './file-reading-list.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { FileReadingListOptionsSchema } from './file-reading-list.internal.js';
export type { FileReadingListOptions } from './file-reading-list.internal.js';

export function projectFileReadingList(
  context: ProjectionContext,
  options: FileReadingListOptions,
): ProjectionBundle<FileReadingList> | undefined {
  const fragment = buildFileReadingList(context, options);
  return fragment === undefined ? undefined : projectSingle(fragment);
}

export const parseAndProjectFileReadingList = parseAndProject(
  FileReadingListOptionsSchema,
  projectFileReadingList,
  'parseAndProjectFileReadingList',
);
