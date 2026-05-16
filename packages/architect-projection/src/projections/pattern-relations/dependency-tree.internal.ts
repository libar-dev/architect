/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Private helpers used exclusively by the dependency-tree fragment.
 *
 * Part of the PatternRelationsProjectionSupport utility surface.
 */

import { findPatternByName } from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { DependencyTreeNode } from '../../fragments/pattern-relations/supporting.js';

import {
  getPatternName,
  getRelationships,
  requirePattern,
} from '../_shared/pattern-helpers.internal.js';

export const DepTreeOptionsSchema = z
  .strictObject({
    pattern: z.string(),
    maxDepth: z.number().int(),
    includeImplementationDeps: z.boolean(),
  })
  .readonly();

export type DepTreeOptions = z.infer<typeof DepTreeOptionsSchema>;

export function buildDependencyTreeRoot(
  context: ProjectionContext,
  options: DepTreeOptions
): {
  rootName: string;
  rootNode: DependencyTreeNode;
} {
  const focalPattern = requirePattern(context, options.pattern);
  const focalName = getPatternName(focalPattern);
  const rootName = findDependencyTreeRoot(context, focalName, options.includeImplementationDeps);

  return {
    rootName,
    rootNode: buildTreeNode(
      context,
      rootName,
      focalName,
      0,
      options.maxDepth,
      options.includeImplementationDeps,
      new Set<string>()
    ),
  };
}

function findDependencyTreeRoot(
  context: ProjectionContext,
  focalName: string,
  includeImplementationDeps: boolean
): string {
  const visited = new Set<string>();
  let current = focalName;

  for (;;) {
    visited.add(current);

    const relationships = getRelationships(context, current);
    if (relationships === undefined) {
      break;
    }

    const parentCandidates = [
      ...relationships.dependsOn,
      ...(includeImplementationDeps ? relationships.uses : []),
    ];
    const nextParent = parentCandidates.find(
      (candidate) =>
        !visited.has(candidate) && findPatternByName(context.graph, candidate) !== undefined
    );

    if (nextParent === undefined) {
      break;
    }

    current = nextParent;
  }

  return current;
}

function buildTreeNode(
  context: ProjectionContext,
  name: string,
  focalName: string,
  depth: number,
  maxDepth: number,
  includeImplementationDeps: boolean,
  visited: Set<string>
): DependencyTreeNode {
  const pattern = findPatternByName(context.graph, name);
  const isFocal = name.toLowerCase() === focalName.toLowerCase();

  if (visited.has(name)) {
    return {
      name,
      ...(pattern?.status !== undefined ? { status: pattern.status } : {}),
      ...(pattern?.phase !== undefined ? { phase: pattern.phase } : {}),
      isFocal,
      truncated: false,
      children: [],
    };
  }

  const nextVisited = new Set(visited);
  nextVisited.add(name);

  if (depth >= maxDepth) {
    const relationships = getRelationships(context, name);
    const hasChildren =
      relationships !== undefined &&
      (relationships.enables.length > 0 ||
        (includeImplementationDeps && relationships.usedBy.length > 0));

    return {
      name,
      ...(pattern?.status !== undefined ? { status: pattern.status } : {}),
      ...(pattern?.phase !== undefined ? { phase: pattern.phase } : {}),
      isFocal,
      truncated: hasChildren,
      children: [],
    };
  }

  const relationships = getRelationships(context, name);
  const childNames: string[] = [];
  if (relationships !== undefined) {
    childNames.push(...relationships.enables);

    if (includeImplementationDeps) {
      for (const usedBy of relationships.usedBy) {
        if (!childNames.includes(usedBy)) {
          childNames.push(usedBy);
        }
      }
    }
  }

  const children = childNames
    .filter((childName) => findPatternByName(context.graph, childName) !== undefined)
    .map((childName) =>
      buildTreeNode(
        context,
        childName,
        focalName,
        depth + 1,
        maxDepth,
        includeImplementationDeps,
        nextVisited
      )
    );

  return {
    name,
    ...(pattern?.status !== undefined ? { status: pattern.status } : {}),
    ...(pattern?.phase !== undefined ? { phase: pattern.phase } : {}),
    isFocal,
    truncated: false,
    children,
  };
}
