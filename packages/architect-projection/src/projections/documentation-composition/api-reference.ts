/**
 * @architect
 * @architect-pattern ApiReferenceProjection
 * @architect-status active
 * @architect-role:projection
 * @architect-uses ApiReferenceDigest, ProjectionFragmentSchema
 * @architect-bounded-context:documentation-composition
 *
 * **Value:** Projects the shape-tagged API/type surface off the
 * PatternGraph into an `ApiReferenceDigest` bundle — a package-grouped
 * navigation index (root) plus one child digest per workspace package — so the
 * `api-reference` documentation type renders field-tables and signatures for
 * every annotated declaration.
 *
 * **Invariant:** Reads shapes from `ExtractedPattern.extractedShapes` (the read
 * model per ADR-006); never re-walks scanner/extractor output. JSDoc prose is
 * cleaned here (data shaping, ADR-005); the renderer escapes all sourced text
 * (ADR-009).
 *
 * **Behavior:**
 * - Collects every pattern's `extractedShapes`, attributes each to its owning
 *   pattern + workspace package, and shapes a renderer-ready `ApiShape`.
 * - Groups shapes by package into per-package child digests; the root carries
 *   `groupingEntries` (package navigation) and the flat shape list.
 * - Degrades to a single root document when the graph has no annotated shapes.
 *
 * ### When to Use
 *
 * - As the projection factory wired into the `api-reference` documentation type.
 */
import type { ExtractedPattern } from '@libar-dev/architect-core';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { ProjectionBundle } from '../../fragments/base.js';
import type {
  ApiReferenceDigest,
  ApiReferenceGroupingEntry,
  ApiShape,
} from '../../fragments/documentation-composition/index.js';
import { filterPatterns } from '../_shared/filter.js';
import {
  buildGroupedRoutedBundle,
  type GroupDescriptor,
} from '../_shared/grouped-routed-bundle.internal.js';

import { createApiReferenceDocumentationRouting } from './api-reference-routes.js';

type ExtractedShape = NonNullable<ExtractedPattern['extractedShapes']>[number];

interface PackagedShape {
  readonly packageId: string;
  readonly shape: ApiShape;
}

const BASE_COLLATOR = new Intl.Collator(undefined, { sensitivity: 'base' });
const NUMERIC_BASE_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

/**
 * The api-reference documentation tree: a package-grouped navigation index root
 * plus one child digest per workspace package. A package child is emitted only
 * when it actually owns shapes, so an unannotated graph degrades to a single
 * `API-REFERENCE.md`. Reuses the generic bundle-routing machinery — the
 * registry's `childDirectory: 'api-reference'` routes children to
 * `api-reference/<package-slug>.md`.
 */
export function buildApiReferenceBundle(
  context: ProjectionContext,
): ProjectionBundle<ApiReferenceDigest> {
  return buildGroupedRoutedBundle<PackagedShape, ApiReferenceDigest>({
    items: collectApiShapes(context),
    groupKey: (item) => slugify(item.packageId),
    compareGroups: (left, right) =>
      NUMERIC_BASE_COLLATOR.compare(packageLabel(left), packageLabel(right)),
    buildRoot: (items, groups) => {
      const groupingEntries: ApiReferenceGroupingEntry[] = groups.map((group) => ({
        childKey: group.key,
        label: packageLabel(group),
        patternCount: new Set(group.items.map((entry) => entry.shape.pattern)).size,
        shapeCount: group.items.length,
      }));
      return {
        kind: 'ApiReferenceDigest',
        scope: 'all',
        shapes: [...items.map((entry) => entry.shape)].sort(compareApiShapes),
        ...(groupingEntries.length > 0 ? { groupingEntries } : {}),
      };
    },
    buildGroupChild: (group) =>
      ({
        kind: 'ApiReferenceDigest',
        scope: 'package',
        scopeValue: packageLabel(group),
        shapes: [...group.items.map((entry) => entry.shape)].sort(compareApiShapes),
      }) satisfies ApiReferenceDigest,
    buildRouting: createApiReferenceDocumentationRouting,
  });
}

/** The package's display label is the first-seen raw package id in the group. */
function packageLabel(group: GroupDescriptor<PackagedShape>): string {
  return group.items[0]?.packageId ?? '';
}

function collectApiShapes(context: ProjectionContext): PackagedShape[] {
  const collected: PackagedShape[] = [];

  for (const pattern of filterPatterns(context.graph.patterns, context.projectionFilter)) {
    const extracted = pattern.extractedShapes;
    if (extracted === undefined || extracted.length === 0) {
      continue;
    }

    const patternName = pattern.patternName ?? pattern.name;
    const packageId = context.packageResolver(pattern.source.file).id;

    for (const shape of extracted) {
      collected.push({ packageId, shape: toApiShape(shape, patternName) });
    }
  }

  return collected;
}

function toApiShape(shape: ExtractedShape, patternName: string): ApiShape {
  const description = cleanShapeDescription(shape.jsDoc);

  return {
    name: shape.name,
    kind: shape.kind,
    pattern: patternName,
    ...(description !== undefined ? { description } : {}),
    sourceText: shape.sourceText,
    ...(shape.typeParameters !== undefined && shape.typeParameters.length > 0
      ? { typeParameters: [...shape.typeParameters] }
      : {}),
    ...(shape.extends !== undefined && shape.extends.length > 0
      ? { extends: [...shape.extends] }
      : {}),
    exported: shape.exported,
    ...(shape.group !== undefined ? { group: shape.group } : {}),
    ...(shape.propertyDocs !== undefined && shape.propertyDocs.length > 0
      ? {
          properties: shape.propertyDocs.map((property) => ({
            name: property.name,
            description: property.jsDoc,
          })),
        }
      : {}),
    ...(shape.params !== undefined && shape.params.length > 0
      ? {
          params: shape.params.map((param) => ({
            name: param.name,
            ...(param.type !== undefined ? { type: param.type } : {}),
            description: param.description,
          })),
        }
      : {}),
    ...(shape.returns !== undefined
      ? {
          returns: {
            ...(shape.returns.type !== undefined ? { type: shape.returns.type } : {}),
            description: shape.returns.description,
          },
        }
      : {}),
    ...(shape.throws !== undefined && shape.throws.length > 0
      ? {
          throws: shape.throws.map((entry) => ({
            ...(entry.type !== undefined ? { type: entry.type } : {}),
            description: entry.description,
          })),
        }
      : {}),
  };
}

/**
 * Reduces a raw declaration JSDoc to its leading prose: strips comment markers,
 * stops at the first block tag (`@param` / `@returns` / `@throws` are rendered
 * separately), unwraps `{@link X}`, and collapses whitespace. Returns undefined
 * when no prose remains.
 */
function cleanShapeDescription(jsDoc: string | undefined): string | undefined {
  if (jsDoc === undefined) {
    return undefined;
  }

  const lines = jsDoc
    .replace(/^\s*\/\*\*+/, '')
    .replace(/\*+\/\s*$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''));

  const prose: string[] = [];
  for (const line of lines) {
    if (/^\s*@/.test(line)) {
      break;
    }
    prose.push(line);
  }

  const text = prose
    .join(' ')
    .replace(/\{@link\s+([^}]+)\}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > 0 ? text : undefined;
}

function compareApiShapes(left: ApiShape, right: ApiShape): number {
  const byPattern = BASE_COLLATOR.compare(left.pattern, right.pattern);
  if (byPattern !== 0) {
    return byPattern;
  }
  return BASE_COLLATOR.compare(left.name, right.name);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
