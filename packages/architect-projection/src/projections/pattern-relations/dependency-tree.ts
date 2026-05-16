/**
 * @architect
 * @architect-pattern DependencyTreeProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts
 * @architect-bounded-context:projection
 *
 * ## Dependency tree projection
 *
 * **Value:** Gives consumers a rooted dependency tree for any focal pattern,
 * with focal highlighting, depth truncation, and preserved legacy traversal
 * semantics, so UI trees, MCP tools, and docs can render hierarchies
 * without re-implementing the walk.
 *
 * **Invariant:** The output is always a `DependencyTree` with `{root, nodes,
 * options}`; traversal honours `maxDepth` by stopping recursion and setting
 * `truncated: true` when more children exist, never recurses through a
 * cycle, and falls back to a single-node tree rooted at the focal pattern
 * when the relationship index is absent.
 *
 * **Behavior:**
 * - Validates options through `DepTreeOptionsSchema` (pattern, maxDepth,
 *   includeImplementationDeps) and delegates to `buildDependencyTreeRoot`.
 * - Walks upward from the focal pattern to find the tree root, then expands
 *   children through the relationship index, tracking visited names to cut
 *   cycles.
 * - Exposes `parseAndProjectDependencyTree` for callers that receive raw
 *   option payloads.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { DependencyTree } from '../../fragments/pattern-relations/index.js';
import {
  DepTreeOptionsSchema,
  buildDependencyTreeRoot,
  type DepTreeOptions,
} from './dependency-tree.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { DepTreeOptionsSchema } from './dependency-tree.internal.js';
export type { DepTreeOptions } from './dependency-tree.internal.js';

export function projectDependencyTree(
  context: ProjectionContext,
  options: DepTreeOptions
): ProjectionBundle<DependencyTree> {
  const { rootName, rootNode } = buildDependencyTreeRoot(context, options);

  return projectSingle({
    kind: 'DependencyTree',
    root: rootName,
    nodes: [rootNode],
    options: {
      maxDepth: options.maxDepth,
      includeImplementationDeps: options.includeImplementationDeps,
    },
  });
}

export const parseAndProjectDependencyTree = parseAndProject(
  DepTreeOptionsSchema,
  projectDependencyTree,
  'parseAndProjectDependencyTree'
);
