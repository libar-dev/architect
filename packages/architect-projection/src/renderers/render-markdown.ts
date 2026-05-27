/**
 * @architect
 * @architect-pattern MarkdownRenderer
 * @architect-status completed
 * @architect-role:codec
 * @architect-bounded-context:rendering
 * @architect-uses FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema
 *
 * Renders fragments into GitHub-flavored Markdown documents for generated docs.
 * Normalizers map fragment contracts to block sections, then handle frontmatter,
 * parent/child bundle files, h2 splitting, and relative child links.
 *
 * ### When to Use
 *
 * - When generating documentation output such as docs-live pages, package README
 *   content, or the `architect documentation` CLI surface, especially when the
 *   output needs frontmatter, h2 splitting, routed child files, or relative
 *   child-link rewriting.
 */
import { humanizeKey, isPrimitive, stableStringify } from '../_internal/format-utils.js';
import {
  code,
  heading,
  isBlock,
  linkOut,
  list,
  mermaid,
  paragraph,
  separator,
  table,
  type Block,
  type CollapsibleBlock,
  type ListBlock,
  type ListItem,
  type TableBlock,
} from '../blocks/schema.js';
import { slugForFilename } from '../_internal/slug.js';
import { summarizeTaxonomyDigest } from '../projections/governance/taxonomy-digest.js';
import {
  isBundle,
  type ApiReferenceDigest,
  type ApiShape,
  type ArchitectureDiagram,
  type BusinessRule,
  type BusinessRuleSet,
  type DecisionCatalog,
  type DecisionRecord,
  type Fragment,
  type ProjectionBundle,
  type ReleaseNotesDigest,
  type RequirementDigest,
  type RoadmapTimeline,
  type TaxonomyDigest,
  type TraceabilityMatrix,
  type ValidationRuleDigest,
} from '../fragments/index.js';
import { defaultMarkdownRouteProfile } from './markdown-paths.js';
import type { DisclosureSpec } from '../disclosure/spec.js';
import {
  REQUIREMENTS_ALL_AREAS_LABEL,
  REQUIREMENTS_EXECUTABLE_AREA_LABEL,
  REQUIREMENTS_SPECS_AREA_LABEL,
} from '../fragments/operational-insights/requirement-digest.js';

import { dispatchByKind, type StrictKindTable } from './_shared/dispatch.js';
import type { ProjectionInput, RenderMarkdownOptions } from './types.js';

interface MarkdownDocument {
  title: string;
  purpose?: string;
  detailLevel?: string;
  sections: MarkdownRenderableBlock[];
}

interface H2Group {
  readonly heading: string;
  readonly sections: MarkdownRenderableBlock[];
}

interface SplitResult {
  readonly parent: RenderedMarkdownDocument;
  readonly subFiles: Record<string, RenderedMarkdownDocument>;
}

interface RenderedMarkdownDocument {
  readonly document: MarkdownDocument;
  readonly markdown: string;
  readonly lineCount: number;
}

interface MarkdownMetadata {
  readonly title: string;
  readonly purpose?: string;
  readonly detailLevel?: string;
}

/**
 * Module-private bypass marker for renderer-authored Markdown. Helpers below
 * mint trusted values when the renderer intentionally emits raw Markdown and
 * bypasses escaping.
 */
// @invariant: module-private trusted-markdown bypass marker; do not export or widen
const TRUSTED_MARKDOWN = Symbol('trustedMarkdown');

interface TrustedMarkdownText {
  readonly text: string;
  readonly [TRUSTED_MARKDOWN]: true;
}

type MarkdownText = string | TrustedMarkdownText;

interface TrustedHeadingBlock {
  readonly type: 'heading';
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
  readonly text: MarkdownText;
}

interface TrustedParagraphBlock {
  readonly type: 'paragraph';
  readonly text: MarkdownText;
}

interface TrustedTableBlock {
  readonly type: 'table';
  readonly columns: MarkdownText[];
  readonly rows: MarkdownText[][];
  readonly alignment?: ('left' | 'center' | 'right')[] | undefined;
}

interface TrustedListItemObject {
  readonly text: MarkdownText;
  readonly checked?: boolean | undefined;
  readonly children?: MarkdownListItem[] | undefined;
}

type MarkdownListItem = string | TrustedMarkdownText | TrustedListItemObject;

interface TrustedListBlock {
  readonly type: 'list';
  readonly ordered: boolean;
  readonly items: MarkdownListItem[];
}

interface TrustedCollapsibleBlock {
  readonly type: 'collapsible';
  readonly summary: string;
  readonly content: MarkdownRenderableBlock[];
}

type MarkdownRenderableBlock =
  | Block
  | TrustedHeadingBlock
  | TrustedParagraphBlock
  | TrustedTableBlock
  | TrustedListBlock
  | TrustedCollapsibleBlock;

interface ChildRouteRef {
  readonly key: string;
  readonly path: string;
  readonly fragment: Fragment;
}

interface NormalizeMarkdownOptions {
  readonly currentPath?: string;
  readonly isRootDocument: boolean;
  readonly childPathMap: Readonly<Record<string, string>>;
  readonly childRouteIdPathMap: Readonly<Record<string, string>>;
  readonly childRoutes: readonly ChildRouteRef[];
  readonly childRefAliases: ReadonlySet<string>;
  readonly disclosureSpec?: DisclosureSpec;
}

interface RoutedChildOutputMaps {
  readonly childPathMap: Record<string, string>;
  readonly childRouteIdPathMap: Record<string, string>;
}

type MarkdownNormalizerKind =
  | 'ApiReferenceDigest'
  | 'ArchitectureDiagram'
  | 'BusinessRuleSet'
  | 'DecisionCatalog'
  | 'DecisionRecord'
  | 'RoadmapTimeline'
  | 'ReleaseNotesDigest'
  | 'RequirementDigest'
  | 'TaxonomyDigest'
  | 'TraceabilityMatrix'
  | 'ValidationRuleDigest';

const DEFAULT_OPTIONS: {
  includeChildren: boolean;
  includeFrontmatter: boolean;
  routeProfile: ResolvedMarkdownOptions['routeProfile'];
  splitStrategy: ResolvedMarkdownOptions['splitStrategy'];
} = {
  includeChildren: true,
  includeFrontmatter: true,
  routeProfile: defaultMarkdownRouteProfile,
  splitStrategy: 'h2-boundary',
};

const DEFAULT_NORMALIZE_OPTIONS: NormalizeMarkdownOptions = {
  isRootDocument: false,
  childPathMap: {},
  childRouteIdPathMap: {},
  childRoutes: [],
  childRefAliases: new Set<string>(),
};

const MARKDOWN_NORMALIZERS = {
  ApiReferenceDigest: normalizeApiReference,
  ArchitectureDiagram: normalizeArchitectureDiagram,
  BusinessRuleSet: normalizeBusinessRuleSet,
  DecisionCatalog: normalizeDecisionCatalog,
  DecisionRecord: normalizeDecisionRecord,
  RoadmapTimeline: normalizeRoadmapTimeline,
  ReleaseNotesDigest: normalizeReleaseNotesDigest,
  RequirementDigest: (fragment, options) => normalizeRequirementDigest(fragment, options),
  TaxonomyDigest: normalizeTaxonomyDigest,
  TraceabilityMatrix: normalizeTraceabilityMatrix,
  ValidationRuleDigest: normalizeValidationRuleDigest,
} satisfies StrictKindTable<MarkdownDocument, NormalizeMarkdownOptions, MarkdownNormalizerKind>;

export const renderMarkdown = (
  input: ProjectionInput,
  options?: RenderMarkdownOptions,
): string | Record<string, string> => {
  const resolvedOptions = resolveOptions(options);

  if (isBundle(input)) {
    return renderBundle(input, resolvedOptions);
  }

  return renderDocument(normalizeFragment(input), resolvedOptions);
};

function renderBundle(
  bundle: ProjectionBundle<Fragment>,
  options: ResolvedMarkdownOptions,
): string | Record<string, string> {
  const childKeys = Object.keys(bundle.children);

  const disclosureSpec = resolveBundleDisclosureSpec(bundle, options);
  const emitChildren = disclosureSpec?.emitChildren ?? options.includeChildren;

  if (!emitChildren || childKeys.length === 0) {
    const rootDocument = normalizeFragment(
      bundle.root,
      undefined,
      {},
      {},
      [],
      new Set<string>(),
      false,
      disclosureSpec,
    );
    return renderDocument(rootDocument, options);
  }

  if (!bundle.routing) {
    throw new Error('renderMarkdown requires routing metadata when bundle children are included.');
  }

  const routing = bundle.routing;
  const entries = new Map<string, string>();
  const rootPath = normalizeRequiredRoutedOutputPath(
    options.routeProfile.mapPath(routing.rootRouteId, bundle.root.kind, undefined, routing),
    routing.rootRouteId,
  );
  const sortedKeys = [...childKeys].sort((left, right) => left.localeCompare(right));

  const { childPathMap, childRouteIdPathMap } = resolveChildOutputPaths(
    bundle,
    sortedKeys,
    rootPath,
    options,
  );
  const childRefAliases = new Set<string>([
    ...sortedKeys,
    ...Object.values(bundle.routing.childRouteIds),
  ]);
  const childRoutes = sortedKeys.flatMap((key): ChildRouteRef[] => {
    const child = bundle.children[key];
    const path = childPathMap[key];
    return child !== undefined && path !== undefined ? [{ key, path, fragment: child }] : [];
  });

  const rootDocument = normalizeFragment(
    bundle.root,
    rootPath,
    childPathMap,
    childRouteIdPathMap,
    childRoutes,
    childRefAliases,
    true,
    disclosureSpec,
  );

  addRoutedDocument(entries, rootPath, rootDocument, options);

  for (const key of sortedKeys) {
    const child = bundle.children[key];
    if (!child) continue;
    const childPath = childPathMap[key];
    if (childPath === undefined) {
      continue;
    }
    const normalizedChild = normalizeFragment(
      child,
      childPath,
      childPathMap,
      childRouteIdPathMap,
      childRoutes,
      childRefAliases,
      false,
      disclosureSpec,
    );
    const childDocument = appendBundleBackLink(
      normalizedChild,
      rootDocument.title,
      childPath,
      rootPath,
    );
    addRoutedDocument(entries, childPath, childDocument, options);
  }

  return Object.fromEntries(
    Array.from(entries.entries()).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function addRoutedDocument(
  entries: Map<string, string>,
  basePath: string,
  document: MarkdownDocument,
  options: ResolvedMarkdownOptions,
): void {
  const parentRendered = renderMarkdownDocument(document, options, basePath, 'measure');

  if (!shouldSplitFromLineCount(parentRendered.lineCount, basePath, options)) {
    // Non-split path: reuse the rendered output. Saves one render per doc.
    addUniqueEntry(entries, basePath, parentRendered.markdown);
    return;
  }

  const splitResult = splitOversizedDocument(
    document,
    options.sizeBudget ?? 0,
    basePath,
    options,
    parentRendered,
  );

  addUniqueEntry(entries, basePath, splitResult.parent.markdown);

  for (const [path, childDocument] of Object.entries(splitResult.subFiles)) {
    addUniqueEntry(entries, path, childDocument.markdown);
  }
}

function renderMarkdownDocument(
  document: MarkdownDocument,
  options: ResolvedMarkdownOptions,
  path: string,
  phase: 'measure' | 'emit',
  renderKey = path,
): RenderedMarkdownDocument {
  const markdown = renderDocument(document, options);
  const lineCount = countLines(markdown);
  options.onRenderDocument?.({ renderKey, path, title: document.title, phase, lineCount });
  return { document, markdown, lineCount };
}

function addUniqueEntry(entries: Map<string, string>, path: string, content: string): void {
  if (entries.has(path)) {
    throw new Error(`renderMarkdown produced duplicate output path: ${path}`);
  }

  entries.set(path, content);
}

function resolveChildOutputPaths(
  bundle: ProjectionBundle<Fragment>,
  sortedKeys: readonly string[],
  rootPath: string,
  options: ResolvedMarkdownOptions,
): RoutedChildOutputMaps {
  const routing = bundle.routing;
  if (!routing) {
    return { childPathMap: {}, childRouteIdPathMap: {} };
  }

  const usedPaths = new Set<string>([rootPath]);
  const routeIdCounts = new Map<string, number>();

  for (const key of sortedKeys) {
    if (bundle.children[key] === undefined) {
      continue;
    }

    const routeId = routing.childRouteIds[key];
    if (routeId !== undefined) {
      routeIdCounts.set(routeId, (routeIdCounts.get(routeId) ?? 0) + 1);
    }
  }

  const childPathEntries = sortedKeys.flatMap((key) => {
    const child = bundle.children[key];
    if (!child) return [];
    const rawRequestedPath = resolveChildRoutePath(bundle, key, child, options);
    const requestedPath = normalizeRoutedOutputPath(rawRequestedPath);
    if (requestedPath === null || requestedPath !== rawRequestedPath) {
      return [];
    }
    const resolvedPath = createUniqueRoutedPath(requestedPath, key, usedPaths);
    return [[key, resolvedPath, routing.childRouteIds[key]] as const];
  });

  const childPathMap: Record<string, string> = {};
  const childRouteIdPathMap: Record<string, string> = {};

  for (const [key, path, routeId] of childPathEntries) {
    childPathMap[key] = path;
    if (routeId !== undefined && routeIdCounts.get(routeId) === 1) {
      childRouteIdPathMap[routeId] = path;
    }
  }

  return { childPathMap, childRouteIdPathMap };
}

function resolveChildRoutePath(
  bundle: ProjectionBundle<Fragment>,
  key: string,
  child: Fragment,
  options: ResolvedMarkdownOptions,
): string {
  const routeId = bundle.routing?.childRouteIds[key];

  if (routeId === undefined) {
    throw new Error(`renderMarkdown missing child route ID for bundle child key: ${key}`);
  }

  return options.routeProfile.mapPath(routeId, child.kind, key, bundle.routing);
}

function resolveBundleDisclosureSpec(
  bundle: ProjectionBundle<Fragment>,
  _options: ResolvedMarkdownOptions,
): DisclosureSpec | undefined {
  return bundle.routing?.disclosureSpec;
}

function createUniqueRoutedPath(path: string, stableId: string, usedPaths: Set<string>): string {
  if (!usedPaths.has(path)) {
    usedPaths.add(path);
    return path;
  }

  const suffix = slugForFilename(stableId) || 'route';
  const directory = extractDirectory(path);
  const fileName = extractFileName(path);
  const extensionStart = fileName.lastIndexOf('.');
  const stem = extensionStart > 0 ? fileName.slice(0, extensionStart) : fileName;
  const extension = extensionStart > 0 ? fileName.slice(extensionStart) : '';
  const prefix = directory.length > 0 ? `${directory}/` : '';
  let candidate = `${prefix}${stem}--${suffix}${extension}`;
  let counter = 2;

  while (usedPaths.has(candidate)) {
    candidate = `${prefix}${stem}--${suffix}-${String(counter)}${extension}`;
    counter += 1;
  }

  usedPaths.add(candidate);
  return candidate;
}

function shouldSplitFromLineCount(
  lineCount: number,
  basePath: string,
  options: ResolvedMarkdownOptions,
): boolean {
  if (
    options.splitStrategy !== 'h2-boundary' ||
    options.sizeBudget === undefined ||
    options.sizeBudget <= 0
  ) {
    return false;
  }

  if (basePath.trim().length === 0) {
    return false;
  }

  return lineCount > options.sizeBudget;
}

function countLines(s: string): number {
  // Equivalent to s.split('\n').length but without allocating the intermediate
  // array. Char code 10 is '\n'. An empty string still counts as 1 line, matching
  // split('\n').length semantics.
  let count = 1;
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) === 10) count++;
  }
  return count;
}

function resolveOptions(options: RenderMarkdownOptions | undefined): ResolvedMarkdownOptions {
  return {
    ...(options?.disclosureLevel !== undefined ? { disclosureLevel: options.disclosureLevel } : {}),
    ...(options?.disclosureSpec !== undefined ? { disclosureSpec: options.disclosureSpec } : {}),
    includeChildren: options?.includeChildren ?? DEFAULT_OPTIONS.includeChildren,
    includeFrontmatter: options?.includeFrontmatter ?? DEFAULT_OPTIONS.includeFrontmatter,
    routeProfile: options?.routeProfile ?? DEFAULT_OPTIONS.routeProfile,
    splitStrategy: options?.splitStrategy ?? DEFAULT_OPTIONS.splitStrategy,
    ...(options?.sizeBudget !== undefined ? { sizeBudget: options.sizeBudget } : {}),
    ...(options?.onRenderDocument !== undefined
      ? { onRenderDocument: options.onRenderDocument }
      : {}),
  };
}

type ResolvedMarkdownOptions = Required<
  Pick<RenderMarkdownOptions, 'includeChildren' | 'includeFrontmatter' | 'routeProfile'>
> &
  Required<Pick<RenderMarkdownOptions, 'splitStrategy'>> & {
    disclosureLevel?: NonNullable<RenderMarkdownOptions['disclosureLevel']>;
    disclosureSpec?: DisclosureSpec;
    onRenderDocument?: NonNullable<RenderMarkdownOptions['onRenderDocument']>;
    sizeBudget?: number;
  };

function normalizeFragment(
  fragment: Fragment,
  currentPath?: string,
  childPathMap: Record<string, string> = {},
  childRouteIdPathMap: Record<string, string> = {},
  childRoutes: readonly ChildRouteRef[] = [],
  childRefAliases: ReadonlySet<string> = new Set<string>(),
  isRootDocument = false,
  disclosureSpec?: DisclosureSpec,
): MarkdownDocument {
  const normalizeOptions =
    currentPath === undefined &&
    Object.keys(childPathMap).length === 0 &&
    Object.keys(childRouteIdPathMap).length === 0 &&
    childRoutes.length === 0 &&
    childRefAliases.size === 0 &&
    !isRootDocument &&
    disclosureSpec === undefined
      ? DEFAULT_NORMALIZE_OPTIONS
      : {
          isRootDocument,
          childPathMap,
          childRouteIdPathMap,
          childRoutes,
          childRefAliases,
          ...(currentPath !== undefined ? { currentPath } : {}),
          ...(disclosureSpec !== undefined ? { disclosureSpec } : {}),
        };

  return dispatchByKind(fragment, MARKDOWN_NORMALIZERS, normalizeGenericFragment, normalizeOptions);
}

function normalizeArchitectureDiagram(
  fragment: ArchitectureDiagram,
  options: NormalizeMarkdownOptions,
): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const scopeLabel = humanizeKey(fragment.scope);
  const scopeDescription =
    fragment.scopeValue !== undefined
      ? `${scopeLabel} scoped to ${fragment.scopeValue}.`
      : `${scopeLabel} architecture view.`;

  const diagramCount = fragment.sections.length;
  const blocks: MarkdownRenderableBlock[] = [
    heading(2, 'Overview'),
    paragraph(
      `This view captures ${String(fragment.patterns.length)} ${fragment.patterns.length === 1 ? 'pattern' : 'patterns'} across ${String(diagramCount)} ${diagramCount === 1 ? 'diagram' : 'diagrams'} in the ${scopeDescription}`,
    ),
  ];

  // Link the bundle's child lenses (package-seam, layered) ONLY from the root doc. The root
  // sits at the docs root, so each child route path is already the correct relative link; a
  // child lens doc lives inside architecture/ and would mis-resolve those docs-root-relative
  // paths, so children omit this section and rely on their back-link to the root instead.
  if (options.isRootDocument) {
    const relatedViewLinks = options.childRoutes
      .map((route) => {
        const link = toSafeRoutedMarkdownLink(
          humanizeKey(route.key.split(':').slice(1).join('-')),
          route.path,
        );
        return link === null ? null : trustedMarkdown(link);
      })
      .filter((entry): entry is TrustedMarkdownText => entry !== null);
    if (relatedViewLinks.length > 0) {
      blocks.push(heading(2, 'Related views'), {
        type: 'list',
        ordered: false,
        items: relatedViewLinks,
      });
    }
  }

  blocks.push(heading(2, 'Diagrams'));

  for (const section of fragment.sections) {
    // section.title is SOURCED group/scope data (bounded-context / package / role / layer
    // name) → escape it; ADR-009 forbids trusting sourced text as raw markdown. Only the
    // pattern-count suffix is renderer-authored, so its parens stay live. (Mirrors the
    // DecisionCatalog rule: trust the structure, escape the sourced text.)
    // section.description is a renderer-authored literal (code spans) → trusted.
    const patternCount = section.patterns.length;
    if (patternCount > 0) {
      const suffix = ` (${String(patternCount)} ${patternCount === 1 ? 'pattern' : 'patterns'})`;
      blocks.push(trustedMarkdownHeading(3, `${escapePlainMarkdownText(section.title)}${suffix}`));
    } else {
      blocks.push(heading(3, section.title));
    }
    if (section.description !== undefined) {
      blocks.push(trustedMarkdownParagraph(section.description));
    }
    blocks.push(section.diagram);
  }

  if (fragment.fanIn !== undefined && fragment.fanIn.length > 0) {
    // Pattern / consumer names are SOURCED → the plain `table` block escapes every cell.
    blocks.push(
      heading(2, 'Fan-in'),
      paragraph('Most-depended-on patterns in this view, ranked by in-view dependant count.'),
      table(
        ['Pattern', 'Dependants', 'Top dependants'],
        fragment.fanIn.map((entry) => [
          entry.pattern,
          String(entry.usedByCount),
          entry.topConsumers.join(', '),
        ]),
      ),
    );
  }

  if (fragment.crossPackageContexts !== undefined && fragment.crossPackageContexts.length > 0) {
    // Context / package names are SOURCED → the plain `table` block escapes every cell.
    blocks.push(
      heading(2, 'Cross-package bounded contexts'),
      paragraph('Bounded contexts whose patterns span more than one workspace package.'),
      table(
        ['Bounded context', 'Packages', 'Patterns'],
        fragment.crossPackageContexts.map((entry) => [
          entry.context,
          entry.packages.join(', '),
          String(entry.patternCount),
        ]),
      ),
    );
  }

  if (fragment.legend !== undefined && fragment.legend.length > 0) {
    blocks.push(heading(2, 'Legend'), ...fragment.legend.map(trustAuthoredBlock));
  }

  if (fragment.patterns.length > 0) {
    blocks.push(heading(2, 'Patterns'), list(fragment.patterns));
  }

  return createMarkdownDocument(metadata, blocks);
}

function normalizeApiReference(
  fragment: ApiReferenceDigest,
  options: NormalizeMarkdownOptions,
): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  if (fragment.scope === 'all') {
    return normalizeApiReferenceIndex(fragment, options, metadata);
  }
  return normalizeApiReferencePackage(fragment, metadata);
}

function normalizeApiReferenceIndex(
  fragment: Extract<ApiReferenceDigest, { scope: 'all' }>,
  options: NormalizeMarkdownOptions,
  metadata: MarkdownMetadata,
): MarkdownDocument {
  const groupingEntries = fragment.groupingEntries ?? [];
  const shapeCount = fragment.shapes.length;
  const packageCount = groupingEntries.length;

  const blocks: MarkdownRenderableBlock[] = [
    heading(2, 'Overview'),
    paragraph(
      `This API reference covers ${String(shapeCount)} ${shapeCount === 1 ? 'shape' : 'shapes'} across ${String(packageCount)} ${packageCount === 1 ? 'package' : 'packages'}, sourced from \`@architect-shape\` annotations.`,
    ),
  ];

  if (groupingEntries.length > 0) {
    // Package labels are SOURCED → the plain `table` block escapes every cell.
    blocks.push(
      heading(2, 'Packages'),
      table(
        ['Package', 'Patterns', 'Shapes'],
        groupingEntries.map((entry) => [
          entry.label,
          String(entry.patternCount),
          String(entry.shapeCount),
        ]),
        ['left', 'left', 'left'],
      ),
    );

    const links = buildChildRouteLinks(groupingEntries, options.childRoutes);
    if (links.length > 0) {
      blocks.push(heading(2, 'Packages — detail'), {
        type: 'list',
        ordered: false,
        items: links,
      });
    }
  }

  return createMarkdownDocument(metadata, blocks);
}

function normalizeApiReferencePackage(
  fragment: Extract<ApiReferenceDigest, { scope: 'package' }>,
  metadata: MarkdownMetadata,
): MarkdownDocument {
  const patternCount = new Set(fragment.shapes.map((shape) => shape.pattern)).size;
  const shapeCount = fragment.shapes.length;

  const blocks: MarkdownRenderableBlock[] = [
    heading(2, 'Overview'),
    paragraph(
      `${String(shapeCount)} ${shapeCount === 1 ? 'shape' : 'shapes'} across ${String(patternCount)} ${patternCount === 1 ? 'pattern' : 'patterns'} in ${fragment.scopeValue}.`,
    ),
  ];

  // Shapes arrive pre-sorted by (pattern, name); group consecutive runs by owning pattern.
  let currentPattern: string | undefined;
  for (const shape of fragment.shapes) {
    if (shape.pattern !== currentPattern) {
      currentPattern = shape.pattern;
      // Pattern name is SOURCED → the plain `heading` block escapes it.
      blocks.push(heading(2, currentPattern));
    }
    blocks.push(...renderApiShape(shape));
  }

  return createMarkdownDocument(metadata, blocks);
}

function renderApiShape(shape: ApiShape): MarkdownRenderableBlock[] {
  // Shape name is SOURCED → the plain `heading` block escapes it.
  const blocks: MarkdownRenderableBlock[] = [heading(3, shape.name)];

  if (shape.description !== undefined) {
    blocks.push(paragraph(shape.description));
  }

  // sourceText is SOURCED, but a code fence is a sanctioned raw surface (ADR-009);
  // `code` routes through pickFence so embedded backtick runs cannot break out.
  blocks.push(code(shape.sourceText, 'ts'));

  if (shape.properties !== undefined && shape.properties.length > 0) {
    blocks.push(
      heading(4, 'Properties'),
      table(
        ['Property', 'Description'],
        shape.properties.map((property) => [property.name, property.description]),
        ['left', 'left'],
      ),
    );
  }

  if (shape.params !== undefined && shape.params.length > 0) {
    blocks.push(
      heading(4, 'Parameters'),
      table(
        ['Parameter', 'Type', 'Description'],
        shape.params.map((param) => [param.name, param.type ?? '', param.description]),
        ['left', 'left', 'left'],
      ),
    );
  }

  if (shape.returns !== undefined) {
    blocks.push(
      heading(4, 'Returns'),
      paragraph(
        shape.returns.type !== undefined
          ? `${shape.returns.type} — ${shape.returns.description}`
          : shape.returns.description,
      ),
    );
  }

  if (shape.throws !== undefined && shape.throws.length > 0) {
    blocks.push(
      heading(4, 'Throws'),
      list(
        shape.throws.map((entry) =>
          entry.type !== undefined ? `${entry.type} — ${entry.description}` : entry.description,
        ),
      ),
    );
  }

  return blocks;
}

function normalizeBusinessRuleSet(
  fragment: BusinessRuleSet,
  options: NormalizeMarkdownOptions,
): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const rules = [...fragment.rules].sort((left, right) => {
    const featureCompare = left.feature.localeCompare(right.feature);
    if (featureCompare !== 0) return featureCompare;
    return left.ruleName.localeCompare(right.ruleName);
  });
  const richness = options.disclosureSpec?.richness ?? 'full';

  const sections: MarkdownRenderableBlock[] = [
    heading(2, 'Overview'),
    paragraph(
      `Structured business-rule catalog with ${String(rules.length)} ${rules.length === 1 ? 'rule' : 'rules'}${fragment.groupedBy !== undefined ? ` grouped by ${humanizeKey(fragment.groupedBy).toLowerCase()}` : ''}.`,
    ),
  ];

  const groupingSummary = buildBusinessRuleGroupingSummary(fragment);
  if (groupingSummary !== null) {
    sections.push(heading(2, groupingSummary.heading), groupingSummary.table);
  }

  if (options.disclosureSpec?.rootShape === 'navigation' && groupingSummary !== null) {
    const groupingLinks = buildBusinessRuleGroupingLinks(
      fragment.groupedBy,
      fragment.groupingEntries,
      options.childRoutes,
    );
    if (groupingLinks !== null) {
      sections.push(heading(2, groupingLinks.heading), groupingLinks.links);
    }
    return createMarkdownDocument(metadata, sections);
  }

  if (richness === 'name-only' && groupingSummary !== null) {
    return createMarkdownDocument(metadata, sections);
  }

  const ruleTable = createBusinessRuleTable(rules, richness);

  sections.push(heading(2, 'Rules'), ruleTable);

  return createMarkdownDocument(metadata, sections);
}

function createBusinessRuleTable(
  rules: readonly BusinessRule[],
  richness: DisclosureSpec['richness'],
): TableBlock {
  if (richness === 'name-only') {
    return table(
      ['Feature', 'Rule Name'],
      rules.map((rule) => [rule.feature, rule.ruleName]),
      ['left', 'left'],
    );
  }

  if (richness === 'summary') {
    return table(
      ['Feature', 'Rule Name', 'Invariant'],
      rules.map((rule) => [rule.feature, rule.ruleName, rule.invariant ?? '']),
      ['left', 'left', 'left'],
    );
  }

  if (richness === 'summary-with-references') {
    return table(
      ['Feature', 'Rule Name', 'Invariant', 'Verified By', 'Scenarios'],
      rules.map((rule) => [
        rule.feature,
        rule.ruleName,
        rule.invariant ?? '',
        rule.verifiedBy.join(', '),
        String(rule.scenarioCount),
      ]),
      ['left', 'left', 'left', 'left', 'left'],
    );
  }

  return table(
    [
      'Feature',
      'Rule Name',
      'Invariant',
      'Rationale',
      'Verified By',
      'Scenarios',
      'Pattern',
      'Phase',
      'Product Area',
    ],
    rules.map((rule): string[] => [
      rule.feature,
      rule.ruleName,
      rule.invariant ?? '',
      rule.rationale ?? '',
      rule.verifiedBy.join(', '),
      String(rule.scenarioCount),
      rule.pattern ?? '',
      rule.phase === undefined ? '' : String(rule.phase),
      rule.productArea ?? '',
    ]),
    ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'left'],
  );
}

function normalizeDecisionCatalog(fragment: DecisionCatalog): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const decisions = [...fragment.decisions].sort((left, right) => left.id.localeCompare(right.id));
  const counts = new Map<string, number>();

  for (const decision of decisions) {
    counts.set(decision.status, (counts.get(decision.status) ?? 0) + 1);
  }

  return createMarkdownDocument(metadata, [
    heading(2, 'Summary'),
    table(
      ['Metric', 'Value'],
      [
        ['Total ADRs', String(decisions.length)],
        ['Accepted', String(counts.get('accepted') ?? 0)],
        ['Proposed', String(counts.get('proposed') ?? 0)],
        ['Deprecated', String(counts.get('deprecated') ?? 0)],
        ['Superseded', String(counts.get('superseded') ?? 0)],
      ],
      ['left', 'left'],
    ),
    heading(2, 'ADR Index'),
    markdownTable(
      ['ADR', 'Title', 'Status', 'Type'],
      decisions.map((decision) => {
        // The link is renderer-authored markdown; the link TEXT (decision.id) is
        // already escaped inside toMarkdownLink. title/status/type stay sourced → escaped.
        const link = toMarkdownLink(decision.id, `decisions/${slugForFilename(decision.id)}.md`);
        return [
          link === null ? decision.id : trustedMarkdown(link),
          decision.title,
          decision.status,
          decision.type,
        ];
      }),
      ['left', 'left', 'left', 'left'],
    ),
  ]);
}

function normalizeDecisionRecord(fragment: DecisionRecord): MarkdownDocument {
  const title = fragment.title.startsWith(`${fragment.id}:`)
    ? fragment.title
    : `${fragment.id}: ${fragment.title}`;
  const sections: Block[] = [
    heading(2, 'Overview'),
    table(
      ['Property', 'Value'],
      [
        ['Status', fragment.status],
        ['Type', fragment.type],
      ],
      ['left', 'left'],
    ),
    heading(2, 'Context'),
    ...fragment.context,
    heading(2, 'Decision'),
    ...fragment.decision,
    heading(2, 'Consequences'),
    ...fragment.consequences,
  ];

  if (fragment.alternatives !== undefined && fragment.alternatives.length > 0) {
    sections.push(heading(2, 'Alternatives'), ...fragment.alternatives);
  }

  if (fragment.relatedDecisions.length > 0) {
    sections.push(heading(2, 'Related Decisions'), list(fragment.relatedDecisions));
  }

  if (fragment.affectedPatterns.length > 0) {
    sections.push(heading(2, 'Affected Patterns'), list(fragment.affectedPatterns));
  }

  return {
    title,
    purpose: `Architecture decision record for ${fragment.title}`,
    sections,
  };
}

function normalizeRoadmapTimeline(fragment: RoadmapTimeline): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const viewLabel = getRoadmapViewTitle(fragment.view).toLowerCase();
  const sections: MarkdownRenderableBlock[] = [
    heading(2, 'Overview'),
    paragraph(
      `Quarter-grouped ${viewLabel} timeline covering ${String(fragment.quarters.length)} ${fragment.quarters.length === 1 ? 'quarter' : 'quarters'}.`,
    ),
  ];

  if (fragment.quarters.length === 0) {
    sections.push(paragraph('No quarter entries were recorded.'));
    return createMarkdownDocument(metadata, sections);
  }

  for (const entry of fragment.quarters) {
    sections.push(
      heading(2, entry.quarter),
      table(
        ['Metric', 'Value'],
        [
          ['Patterns', String(entry.patterns.length)],
          ['Completed', String(entry.counts.completed)],
          ['Active', String(entry.counts.active)],
          ['Planned', String(entry.counts.planned)],
          ['Candidate', String(entry.counts.candidate)],
        ],
        ['left', 'left'],
      ),
      table(
        ['Pattern', 'Status', 'Role', 'Phase', 'Source File'],
        entry.patterns.map((pattern) => [
          pattern.patternName,
          pattern.status ?? '',
          pattern.role,
          pattern.phase === undefined ? '' : String(pattern.phase),
          pattern.file,
        ]),
        ['left', 'left', 'left', 'left', 'left'],
      ),
    );
  }

  return createMarkdownDocument(metadata, sections);
}

function normalizeReleaseNotesDigest(fragment: ReleaseNotesDigest): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const sections: MarkdownRenderableBlock[] = [
    paragraph('All notable changes to this project will be documented in this file.'),
    trustedMarkdownParagraph(
      'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).',
    ),
  ];

  for (const release of fragment.releases) {
    const addedEntries = dedupeStrings([
      ...release.deliverables.map(
        (deliverable) =>
          `**${escapePlainMarkdownText(deliverable.name)}**${deliverable.location.length > 0 ? `: ${escapePlainMarkdownText(deliverable.location)}` : ''}`,
      ),
      ...release.patterns.map((pattern) => escapePlainMarkdownText(pattern.patternName)),
    ]);

    sections.push(
      trustedMarkdownHeading(
        2,
        `[${escapePlainMarkdownText(release.release)}]${release.date !== undefined ? ` - ${escapePlainMarkdownText(release.date)}` : ''}`,
      ),
    );

    if (release.notes !== undefined && release.notes.trim().length > 0) {
      sections.push(paragraph(release.notes));
    }

    sections.push(
      heading(3, 'Added'),
      ...(addedEntries.length > 0
        ? [trustedMarkdownList(addedEntries)]
        : [paragraph('No release additions were recorded.')]),
    );
  }

  return createMarkdownDocument(metadata, sections);
}

function normalizeRequirementDigest(
  fragment: RequirementDigest,
  options: NormalizeMarkdownOptions,
): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const requirements = [...fragment.requirements].sort((left, right) =>
    left.pattern.localeCompare(right.pattern),
  );

  // Per-pattern detail file (single-entry digest where the productArea label
  // matches the entry's pattern name): render the pattern's content directly
  // — status, description, test files — with no Summary table or Requirements
  // wrapper. The H1 is the pattern name; the file IS the requirement.
  const isPerPatternFile =
    requirements.length === 1 && requirements[0]?.pattern === fragment.productArea;

  if (isPerPatternFile) {
    const requirement = requirements[0];
    if (requirement === undefined) {
      return createMarkdownDocument(metadata, []);
    }
    const sections: MarkdownRenderableBlock[] = [];
    if (requirement.status !== undefined) {
      sections.push(
        trustedMarkdownParagraph(`**Status:** ${escapePlainMarkdownText(requirement.status)}`),
      );
    }
    sections.push(...requirement.description);
    if (requirement.testFiles.length > 0) {
      sections.push(heading(2, 'Test Files'), list(requirement.testFiles));
    }
    return createMarkdownDocument(metadata, sections);
  }

  // Index file (top-level overview or per-package index): show only the
  // Summary table. Markdown links are resolved from bundle child routes so
  // requirement fragments stay renderer-neutral.
  return createMarkdownDocument(metadata, [
    heading(2, 'Summary'),
    markdownTable(
      ['Pattern', 'Status', 'Test Files'],
      requirements.map((requirement) => [
        renderRequirementPatternCell(requirement.pattern, options),
        requirement.status ?? '',
        requirement.testFiles.join(', '),
      ]),
      ['left', 'left', 'left'],
    ),
  ]);
}

function renderRequirementPatternCell(
  patternName: string,
  options: NormalizeMarkdownOptions,
): MarkdownText {
  const detailRoute = options.childRoutes.find((route) => {
    const child = route.fragment;
    return (
      child.kind === 'RequirementDigest' &&
      child.requirements.length === 1 &&
      child.requirements[0]?.pattern === patternName
    );
  });

  if (detailRoute === undefined) {
    return patternName;
  }

  const linkPath =
    options.currentPath === undefined
      ? detailRoute.path
      : toRelativePath(options.currentPath, detailRoute.path);
  const link =
    options.currentPath === undefined
      ? toSafeRoutedMarkdownLink(patternName, detailRoute.path)
      : toMarkdownLink(patternName, linkPath);
  return link === null ? patternName : trustedMarkdown(link);
}

function normalizeTaxonomyDigest(fragment: TaxonomyDigest): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const counts = summarizeTaxonomyDigest(fragment);
  const roleGroups = fragment.tags.filter((group) => group.entries[0]?.kind === 'role');
  const metadataGroups = fragment.tags.filter((group) => group.entries[0]?.kind === 'metadata');
  const aggregationGroups = fragment.tags.filter(
    (group) => group.entries[0]?.kind === 'aggregation',
  );
  const sections: MarkdownRenderableBlock[] = [
    heading(2, 'Overview'),
    trustedMarkdownParagraph(
      `**${String(counts.roles)} roles** | **${String(counts.metadata)} metadata tags** | **${String(counts.aggregation)} aggregation tags** | **${String(counts.total)} total**`,
    ),
    table(
      ['Component', 'Count'],
      [
        ['Roles', String(counts.roles)],
        ['Metadata Tags', String(counts.metadata)],
        ['Aggregation Tags', String(counts.aggregation)],
        ['Total', String(counts.total)],
      ],
      ['left', 'left'],
    ),
  ];

  for (const group of roleGroups) {
    sections.push(heading(2, group.groupName), buildTaxonomyGroupTable(group));
  }

  if (metadataGroups.length > 0) {
    sections.push(heading(2, 'Metadata Tags'));
    for (const group of metadataGroups) {
      sections.push(heading(3, group.groupName), buildTaxonomyGroupTable(group));
    }
  }

  if (aggregationGroups.length > 0) {
    sections.push(heading(2, 'Aggregation Tags'));
    for (const group of aggregationGroups) {
      sections.push(heading(3, group.groupName), buildTaxonomyGroupTable(group));
    }
  }

  sections.push(
    heading(2, 'Format Types'),
    table(
      ['Format', 'Description', 'Example'],
      fragment.formatTypes.map((formatType) => [
        formatType.format,
        formatType.description,
        formatType.example,
      ]),
      ['left', 'left', 'left'],
    ),
  );

  if (
    fragment.exampleOverrides !== undefined &&
    Object.keys(fragment.exampleOverrides).length > 0
  ) {
    sections.push(
      heading(2, 'Example Overrides'),
      table(
        ['Format', 'Example'],
        Object.entries(fragment.exampleOverrides)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([format, example]) => [format, example]),
        ['left', 'left'],
      ),
    );
  }

  return createMarkdownDocument(metadata, sections);
}

function normalizeTraceabilityMatrix(fragment: TraceabilityMatrix): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);

  return createMarkdownDocument(metadata, [
    heading(2, 'Summary'),
    paragraph(
      `Traceability matrix covering ${String(fragment.rows.length)} ${fragment.rows.length === 1 ? 'pattern row' : 'pattern rows'}.`,
    ),
    heading(2, 'Rows'),
    table(
      ['Pattern', 'Status', 'Tests', 'Specs', 'Deliverables'],
      fragment.rows.map((row) => [
        row.pattern,
        row.status ?? '',
        row.tests.join(', '),
        row.specs.join(', '),
        row.deliverables.join(', '),
      ]),
      ['left', 'left', 'left', 'left', 'left'],
    ),
  ]);
}

function normalizeValidationRuleDigest(fragment: ValidationRuleDigest): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const rows = fragment.protectionLevels.flatMap((level) =>
    level.statuses.map((status) => [
      status,
      level.level,
      level.canAddDeliverables ? 'Yes' : 'No',
      level.needsUnlock ? 'Yes' : 'No',
      level.meaning ?? '',
    ]),
  );

  return createMarkdownDocument(metadata, [
    heading(2, 'Overview'),
    paragraph(
      `Process Guard validates delivery workflow changes at commit time using a Decider pattern. It enforces the ${String(fragment.fsm.states.length)}-state FSM and prevents common workflow violations.`,
    ),
    trustedMarkdownParagraph(
      `**${String(fragment.rules.length)} validation rules** | **${String(fragment.fsm.states.length)} FSM states** | **${String(fragment.protectionLevels.length)} protection levels**`,
    ),
    heading(2, 'Validation Rules'),
    markdownTable(
      ['Rule ID', 'Severity', 'Description', 'Applies To Roles'],
      fragment.rules.map((rule) => [
        // Rule id renders as inline code; `inlineCode` trusts the backtick fence only
        // when the sourced id cannot break out of it. severity/description stay sourced → escaped.
        inlineCode(rule.id),
        rule.severity,
        rule.description,
        rule.appliesToRoles?.join(', ') ?? '',
      ]),
      ['left', 'left', 'left', 'left'],
    ),
    heading(2, 'FSM State Diagram'),
    paragraph('Valid transitions for the delivery workflow FSM:'),
    mermaid(buildFsmStateDiagram(fragment)),
    heading(2, 'Protection Levels'),
    table(['Status', 'Protection', 'Can Add Deliverables', 'Needs Unlock', 'Meaning'], rows, [
      'left',
      'left',
      'left',
      'left',
      'left',
    ]),
  ]);
}

function normalizeGenericFragment(
  fragment: Fragment,
  options: NormalizeMarkdownOptions,
): MarkdownDocument {
  const fields = Object.entries(fragment).filter(([key]) => key !== 'kind');
  const metadataRows: string[][] = [];
  const sections: Block[] = [];
  const metadata = resolveFragmentMetadata(fragment);
  const title = metadata.title;
  const embeddedSections = renderEmbeddedSections(
    (fragment as Record<string, unknown>)['sections'],
    options,
  );

  if (embeddedSections.length > 0) {
    return {
      title,
      ...(metadata.purpose !== undefined ? { purpose: metadata.purpose } : {}),
      ...(metadata.detailLevel !== undefined ? { detailLevel: metadata.detailLevel } : {}),
      sections: embeddedSections,
    };
  }

  for (const [key, value] of fields) {
    if (
      key === 'title' ||
      (key === 'patternName' && value === title) ||
      (key === 'id' && typeof value === 'string' && value === title)
    ) {
      continue;
    }

    if (value === undefined) {
      continue;
    }

    const label = humanizeKey(key);

    if (isBlockArray(value)) {
      sections.push(heading(2, label), ...value);
      continue;
    }

    if (isBlock(value)) {
      sections.push(heading(2, label), value);
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }

      if (value.every(isPrimitive)) {
        sections.push(heading(2, label), list(value.map((item) => formatPrimitive(item))));
        continue;
      }

      const tabularRows = toTabularRows(value);
      if (tabularRows) {
        sections.push(heading(2, label), renderRecordArrayTable(tabularRows));
        continue;
      }

      sections.push(heading(2, label), code(stableStringify(value, 2), 'json'));
      continue;
    }

    if (isPrimitive(value)) {
      metadataRows.push([label, formatPrimitive(value)]);
      continue;
    }

    sections.push(heading(2, label), code(stableStringify(value, 2), 'json'));
  }

  const normalizedSections =
    metadataRows.length > 0
      ? [
          heading(2, 'Details'),
          table(['Field', 'Value'], metadataRows, ['left', 'left']),
          ...sections,
        ]
      : sections;

  return {
    title,
    ...(metadata.purpose !== undefined ? { purpose: metadata.purpose } : {}),
    ...(metadata.detailLevel !== undefined ? { detailLevel: metadata.detailLevel } : {}),
    sections: normalizedSections,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function renderEmbeddedSections(value: unknown, options: NormalizeMarkdownOptions): Block[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const title = entry['title'];
    const blocks = entry['blocks'];
    if (typeof title !== 'string' || !isBlockArray(blocks)) {
      return [];
    }

    return [
      heading(2, title),
      ...rewriteDocumentationLinks(
        blocks,
        options.childPathMap,
        options.childRouteIdPathMap,
        options.childRefAliases,
        options.currentPath,
      ),
    ];
  });
}

function createMarkdownDocument(
  metadata: MarkdownMetadata,
  sections: MarkdownRenderableBlock[],
): MarkdownDocument {
  return {
    title: metadata.title,
    ...(metadata.purpose !== undefined ? { purpose: metadata.purpose } : {}),
    ...(metadata.detailLevel !== undefined ? { detailLevel: metadata.detailLevel } : {}),
    sections,
  };
}

// This stays as a specialized switch because some fragment kinds derive
// metadata from instance values rather than kind alone.
function resolveFragmentMetadata(fragment: Fragment): MarkdownMetadata {
  switch (fragment.kind) {
    case 'ApiReferenceDigest': {
      switch (fragment.scope) {
        case 'all':
          return {
            title: 'API Reference',
            purpose: 'Type and API surface extracted from @architect-shape annotations',
            detailLevel: 'Package index with links to per-package field tables',
          };
        case 'package':
          return {
            title: `${fragment.scopeValue} API Reference`,
            purpose: 'Type and API surface for a single workspace package',
          };
        default:
          throw new Error('Unsupported api-reference scope');
      }
    }
    case 'ArchitectureDiagram':
      return {
        title: 'Architecture',
        purpose: 'Auto-generated architecture diagrams from source annotations',
        detailLevel: 'Context map plus per-group component diagrams',
      };
    case 'BusinessRuleSet': {
      switch (fragment.scope) {
        case 'all':
          return {
            title: 'Business Rules',
            purpose: 'Domain constraints and invariants extracted from feature files',
            detailLevel: 'Overview with links to detailed business rules by package',
          };
        case 'phase':
          return { title: `Phase ${String(fragment.scopeValue)} Business Rules` };
        case 'package':
        case 'product-area':
        case 'feature':
          return { title: `${fragment.scopeValue} Business Rules` };
        default:
          throw new Error('Unsupported business-rule scope');
      }
    }
    case 'DecisionCatalog':
      return {
        title: 'Architecture Decision Records',
        purpose: 'Architectural decisions extracted from feature files',
        detailLevel: 'Summary with links to category details',
      };
    case 'RoadmapTimeline':
      return {
        title: getRoadmapViewTitle(fragment.view),
        purpose: `Quarter-grouped ${getRoadmapViewTitle(fragment.view).toLowerCase()} timeline.`,
      };
    case 'ReleaseNotesDigest':
      return {
        title: 'Changelog',
        purpose: 'Project changelog in Keep a Changelog format',
      };
    case 'RequirementDigest': {
      const knownTitles: Record<string, string> = {
        [REQUIREMENTS_ALL_AREAS_LABEL]: 'Product Requirements',
        [REQUIREMENTS_EXECUTABLE_AREA_LABEL]: 'Implemented Product Requirements',
        [REQUIREMENTS_SPECS_AREA_LABEL]: 'Spec-Tier Product Requirements',
      };
      return {
        title: knownTitles[fragment.productArea] ?? `${fragment.productArea} Product Requirements`,
        purpose: 'Product requirements and feature specifications',
        detailLevel: 'Overview with links to detailed requirements',
      };
    }
    case 'TaxonomyDigest':
      return {
        title: 'Taxonomy Reference',
        purpose: 'Tag taxonomy configuration for code-first documentation',
        detailLevel: 'Overview with links to details',
      };
    case 'TraceabilityMatrix':
      return {
        title: 'Traceability',
      };
    case 'ValidationRuleDigest':
      return {
        title: 'Validation Rules',
        purpose: 'Process Guard validation rules and FSM reference',
        detailLevel: 'Overview with links to details',
      };
    default:
      return { title: deriveTitle(fragment) };
  }
}

function deriveTitle(fragment: Fragment): string {
  if ('title' in fragment && typeof fragment.title === 'string' && fragment.title.length > 0) {
    return fragment.title;
  }

  if (
    'patternName' in fragment &&
    typeof fragment.patternName === 'string' &&
    fragment.patternName.length > 0
  ) {
    return fragment.patternName;
  }

  if ('id' in fragment && typeof fragment.id === 'string' && fragment.id.length > 0) {
    return fragment.id;
  }

  return humanizeKey(fragment.kind);
}

function getRoadmapViewTitle(view: RoadmapTimeline['view']): string {
  switch (view) {
    case 'roadmap':
      return 'Roadmap';
    case 'milestones':
      return 'Completed Milestones';
    case 'current':
      return 'Current Work';
  }
}

function formatPrimitive(value: string | number | boolean): string {
  return typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
}

type PrimitiveLike = string | number | boolean | (string | number | boolean)[];

type TabularRow = Record<string, unknown>;

function formatPrimitiveLike(value: PrimitiveLike): string {
  if (Array.isArray(value)) {
    return value.map((item) => formatPrimitive(item)).join(', ');
  }

  return formatPrimitive(value);
}

function buildBusinessRuleGroupingSummary(
  fragment: BusinessRuleSet,
): { heading: string; table: TableBlock } | null {
  const groupedBy = fragment.groupedBy;
  if (groupedBy === undefined) {
    return null;
  }

  const groupingEntries = fragment.groupingEntries;
  if (groupingEntries === undefined || groupingEntries.length === 0) {
    return null;
  }

  if (groupedBy === 'product-area') {
    return {
      heading: 'Product Areas',
      table: table(
        ['Product Area', 'Features', 'Rules', 'With Invariants'],
        groupingEntries.map((entry) => [
          entry.label || 'Unassigned',
          String(entry.featureCount),
          String(entry.ruleCount),
          String(entry.invariantCount),
        ]),
        ['left', 'left', 'left', 'left'],
      ),
    };
  }

  if (groupedBy === 'feature') {
    return {
      heading: 'Features',
      table: table(
        ['Feature', 'Product Area', 'Rules', 'With Invariants'],
        groupingEntries.map((entry) => [
          entry.label,
          entry.secondaryLabel ?? '',
          String(entry.ruleCount),
          String(entry.invariantCount),
        ]),
        ['left', 'left', 'left', 'left'],
      ),
    };
  }

  if (groupedBy === 'package') {
    return {
      heading: 'Packages',
      table: table(
        ['Package', 'Features', 'Rules', 'With Invariants'],
        groupingEntries.map((entry) => [
          entry.label,
          String(entry.featureCount),
          String(entry.ruleCount),
          String(entry.invariantCount),
        ]),
        ['left', 'left', 'left', 'left'],
      ),
    };
  }

  return {
    heading: 'Phases',
    table: table(
      ['Phase', 'Features', 'Rules', 'With Invariants'],
      groupingEntries.map((entry) => [
        entry.label,
        String(entry.featureCount),
        String(entry.ruleCount),
        String(entry.invariantCount),
      ]),
      ['left', 'left', 'left', 'left'],
    ),
  };
}

function buildBusinessRuleGroupingLinks(
  groupedBy: BusinessRuleSet['groupedBy'],
  groupingEntries: BusinessRuleSet['groupingEntries'],
  childRoutes: readonly ChildRouteRef[],
): { heading: string; links: TrustedListBlock } | null {
  if (groupedBy === undefined || groupingEntries === undefined || groupingEntries.length === 0) {
    return null;
  }

  const links = buildChildRouteLinks(groupingEntries, childRoutes);

  if (links.length === 0) {
    return null;
  }

  const heading =
    groupedBy === 'product-area'
      ? 'Product Area Detail'
      : groupedBy === 'feature'
        ? 'Feature Detail'
        : groupedBy === 'package'
          ? 'Package Detail'
          : 'Phase Detail';

  return {
    heading,
    links: {
      type: 'list',
      ordered: false,
      items: links,
    },
  };
}

function buildTaxonomyGroupTable(group: TaxonomyDigest['tags'][number]): TrustedTableBlock {
  const kind = group.entries[0]?.kind;

  // The `Tag` column renders as an inline code span. The tag VALUE is sourced, so
  // `inlineCode` only trusts the backtick fence when the value cannot break out of
  // it (no embedded backtick) and otherwise degrades to escaped plain text. Every
  // other column is sourced text and stays a plain string → escaped by
  // `escapeTableCell`.
  const tagCell = (entry: TaxonomyDigest['tags'][number]['entries'][number]): MarkdownText =>
    inlineCode(entry.tag);

  if (kind === 'role') {
    return markdownTable(
      ['Tag', 'Domain', 'Priority', 'Description', 'Aliases'],
      group.entries.map((entry) => [
        tagCell(entry),
        entry.domain ?? '',
        entry.priority === undefined ? '' : String(entry.priority),
        entry.description ?? '',
        entry.aliases?.join(', ') ?? '',
      ]),
      ['left', 'left', 'left', 'left', 'left'],
    );
  }

  if (kind === 'aggregation') {
    return markdownTable(
      ['Tag', 'Target Document', 'Purpose'],
      group.entries.map((entry) => [tagCell(entry), entry.targetDoc ?? '', entry.purpose]),
      ['left', 'left', 'left'],
    );
  }

  return markdownTable(
    ['Tag', 'Format', 'Purpose', 'Required', 'Repeatable', 'Values', 'Default Value', 'Example'],
    group.entries.map((entry) => [
      tagCell(entry),
      entry.format ?? '',
      entry.purpose,
      entry.required === undefined ? '' : entry.required ? 'Yes' : 'No',
      entry.repeatable === undefined ? '' : entry.repeatable ? 'Yes' : 'No',
      entry.values?.join(', ') ?? '',
      entry.defaultValue ?? '',
      entry.example ?? '',
    ]),
    ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left'],
  );
}

function buildFsmStateDiagram(fragment: ValidationRuleDigest): string {
  const lines = ['stateDiagram-v2'];
  lines.push(`    [*] --> ${fragment.fsm.initialState}: new pattern`);

  for (const transition of fragment.fsm.transitions) {
    const suffix = hasText(transition.description) ? `: ${transition.description}` : '';
    lines.push(`    ${transition.from} --> ${transition.to}${suffix}`);
  }

  for (const terminalState of fragment.fsm.terminalStates) {
    lines.push(`    ${terminalState} --> [*]: terminal`);
  }

  return lines.join('\n');
}

function rewriteDocumentationLinks(
  blocks: readonly Block[],
  childPathMap: Readonly<Record<string, string>>,
  childRouteIdPathMap: Readonly<Record<string, string>>,
  childRefAliases: ReadonlySet<string>,
  currentPath: string | undefined,
): Block[] {
  return blocks.map((block) => {
    if (block.type === 'link-out') {
      const childKeyTargetPath = childPathMap[block.path];
      const routeIdTargetPath = childRouteIdPathMap[block.path];

      if (
        childKeyTargetPath !== undefined &&
        routeIdTargetPath !== undefined &&
        childKeyTargetPath !== routeIdTargetPath
      ) {
        return paragraph(block.text);
      }

      const targetPath = childKeyTargetPath ?? routeIdTargetPath;
      if (targetPath === undefined) {
        return childRefAliases.has(block.path) ? paragraph(block.text) : block;
      }

      return {
        ...block,
        path: currentPath === undefined ? targetPath : toRelativePath(currentPath, targetPath),
      };
    }

    if (block.type === 'collapsible') {
      return {
        ...block,
        content: rewriteDocumentationLinks(
          block.content,
          childPathMap,
          childRouteIdPathMap,
          childRefAliases,
          currentPath,
        ),
      };
    }

    return block;
  });
}

function toRelativePath(fromPath: string, toPath: string): string {
  const fromParts = splitPathSegments(extractDirectory(fromPath));
  const toParts = splitPathSegments(toPath);
  let shared = 0;

  while (
    shared < fromParts.length &&
    shared < toParts.length - 1 &&
    fromParts[shared] === toParts[shared]
  ) {
    shared += 1;
  }

  const upward = fromParts.slice(shared).map(() => '..');
  const downward = toParts.slice(shared);
  return [...upward, ...downward].join('/');
}

function splitPathSegments(filePath: string): string[] {
  return filePath
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function dedupeStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

function isBlockArray(value: unknown): value is Block[] {
  return Array.isArray(value) && value.every(isBlock);
}

function isPrimitiveLike(value: unknown): value is PrimitiveLike {
  return isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive));
}

function getTabularColumns(rows: TabularRow[]): string[] {
  const columns = new Set<string>();

  for (const row of rows) {
    for (const [key] of Object.entries(row)) {
      if (key === 'kind') {
        continue;
      }

      columns.add(key);
    }
  }

  return Array.from(columns).sort((left, right) => left.localeCompare(right));
}

function toTabularRows(value: unknown): TabularRow[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const rows: TabularRow[] = [];

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return null;
    }

    const row: TabularRow = {};

    for (const [key, fieldValue] of Object.entries(entry as Record<string, unknown>)) {
      if (key === 'kind') {
        continue;
      }

      if (fieldValue !== undefined && !isPrimitiveLike(fieldValue)) {
        return null;
      }

      row[key] = fieldValue;
    }

    rows.push(row);
  }

  return rows;
}

function renderRecordArrayTable(rows: TabularRow[]): TableBlock {
  const columns = getTabularColumns(rows);

  return table(
    columns.map(humanizeKey),
    rows.map((row) =>
      columns.map((column) => {
        const value = row[column];
        return value === undefined || !isPrimitiveLike(value) ? '' : formatPrimitiveLike(value);
      }),
    ),
    columns.map(() => 'left'),
  );
}

function appendBundleBackLink(
  document: MarkdownDocument,
  rootTitle: string,
  currentPath: string,
  rootPath: string,
): MarkdownDocument {
  return {
    ...document,
    sections: [
      ...document.sections,
      separator(),
      linkOut(`← Back to ${rootTitle}`, toRelativePath(currentPath, rootPath)),
    ],
  };
}

function renderDocument(document: MarkdownDocument, options: ResolvedMarkdownOptions): string {
  const lines: string[] = [];

  lines.push(`# ${renderMarkdownText(document.title)}`, '');

  if (options.includeFrontmatter && (document.purpose || document.detailLevel)) {
    if (document.purpose) {
      lines.push(`**Purpose:** ${renderMarkdownText(document.purpose)}`);
    }
    if (document.detailLevel) {
      lines.push(`**Detail Level:** ${renderMarkdownText(document.detailLevel)}`);
    }
    lines.push('', '---', '');
  }

  for (const block of document.sections) {
    lines.push(...renderBlock(block));
  }

  return lines.join('\n').trimEnd() + '\n';
}

function renderBlock(block: MarkdownRenderableBlock): string[] {
  switch (block.type) {
    case 'heading': {
      const level = Math.max(1, Math.min(6, block.level));
      return [`${'#'.repeat(level)} ${renderMarkdownText(block.text)}`, ''];
    }
    case 'paragraph':
      return [renderMarkdownText(block.text), ''];
    case 'separator':
      return ['---', ''];
    case 'table':
      return renderTable(block);
    case 'list':
      return renderList(block);
    case 'code': {
      const fence = pickFence(block.content);
      return [`${fence}${block.language ?? ''}`, block.content, fence, ''];
    }
    case 'mermaid': {
      const fence = pickFence(block.content);
      return [`${fence}mermaid`, block.content, fence, ''];
    }
    case 'collapsible':
      return renderCollapsible(block);
    case 'link-out':
      return renderLinkOut(block);
    default: {
      return [`<!-- Unknown block type: ${JSON.stringify(block)} -->`, ''];
    }
  }
}

function pickFence(content: string): string {
  const longestRun = (content.match(/`{3,}/g) ?? []).reduce(
    (max, run) => Math.max(max, run.length),
    0,
  );
  return '`'.repeat(Math.max(3, longestRun + 1));
}

function renderTable(block: TableBlock | TrustedTableBlock): string[] {
  const columns = block.columns as MarkdownText[];
  const rows = block.rows as MarkdownText[][];

  if (columns.length === 0) {
    return [];
  }

  const escapedColumns = columns.map(escapeTableCell);
  const escapedRows = rows.map((row) => {
    const paddedRow = [...row];
    while (paddedRow.length < columns.length) {
      paddedRow.push('');
    }
    return paddedRow.map((cell) => escapeTableCell(cell));
  });

  const separators = columns.map((_, index) => {
    const align = block.alignment?.[index] ?? 'left';
    switch (align) {
      case 'center':
        return ':---:';
      case 'right':
        return '---:';
      default:
        return '---';
    }
  });

  const widths = columns.map((_, index) => {
    const headerWidth = escapedColumns[index]?.length ?? 0;
    const separatorWidth = separators[index]?.length ?? 3;
    const dataWidth = Math.max(0, ...escapedRows.map((row) => row[index]?.length ?? 0));
    return Math.max(headerWidth, separatorWidth, dataWidth);
  });

  const padCell = (cell: string, width: number): string => cell.padEnd(width);
  const padSeparator = (separatorCell: string, width: number, index: number): string => {
    const align = block.alignment?.[index] ?? 'left';
    if (separatorCell.length >= width) {
      return separatorCell;
    }
    switch (align) {
      case 'center':
        return `:${'-'.repeat(Math.max(width - 2, 1))}:`;
      case 'right':
        return `${'-'.repeat(Math.max(width - 1, 1))}:`;
      default:
        return separatorCell + '-'.repeat(width - separatorCell.length);
    }
  };

  const lines: string[] = [];
  lines.push(
    `| ${escapedColumns.map((cell, index) => padCell(cell, widths[index] ?? 0)).join(' | ')} |`,
  );
  lines.push(
    `| ${separators.map((cell, index) => padSeparator(cell, widths[index] ?? 0, index)).join(' | ')} |`,
  );

  for (const row of escapedRows) {
    lines.push(`| ${row.map((cell, index) => padCell(cell, widths[index] ?? 0)).join(' | ')} |`);
  }

  lines.push('');
  return lines;
}

function renderList(block: ListBlock | TrustedListBlock): string[] {
  const lines: string[] = [];

  for (let index = 0; index < block.items.length; index += 1) {
    const item = block.items[index];
    if (item === undefined) continue;
    const prefix = block.ordered ? `${String(index + 1)}.` : '-';
    lines.push(...renderListItem(item, prefix, 0));
  }

  lines.push('');
  return lines;
}

function renderListItem(
  item: ListItem | MarkdownListItem,
  prefix: string,
  indent: number,
): string[] {
  const lines: string[] = [];
  const indentation = '  '.repeat(indent);

  if (!isTrustedListItemObject(item)) {
    lines.push(`${indentation}${prefix} ${renderMarkdownText(item)}`);
    return lines;
  }

  const checkbox = item.checked !== undefined ? (item.checked ? '[x] ' : '[ ] ') : '';
  lines.push(`${indentation}${prefix} ${checkbox}${renderMarkdownText(item.text)}`);

  for (let index = 0; index < (item.children?.length ?? 0); index += 1) {
    const child = item.children?.[index];
    if (!child) continue;
    const childPrefix = /^\d/.test(prefix) ? `${String(index + 1)}.` : '-';
    lines.push(...renderListItem(child, childPrefix, indent + 1));
  }

  return lines;
}

function renderCollapsible(block: CollapsibleBlock | TrustedCollapsibleBlock): string[] {
  const lines: string[] = [
    '<details>',
    `<summary>${renderMarkdownText(block.summary)}</summary>`,
    '',
  ];

  for (const contentBlock of block.content) {
    lines.push(...renderBlock(contentBlock));
  }

  lines.push('</details>', '');
  return lines;
}

function renderLinkOut(block: { text: string; path: string }): string[] {
  const link = toMarkdownLink(block.text, block.path);
  if (link === null) {
    return [renderMarkdownText(block.text), ''];
  }

  return [link, ''];
}

function renderMarkdownText(text: MarkdownText): string {
  return isTrustedMarkdown(text) ? text.text : escapePlainMarkdownText(text);
}

function renderMarkdownLinkText(text: string): string {
  return escapePlainMarkdownText(text);
}

/**
 * Renders a sourced value as an inline code span WITHOUT trusting it raw. The
 * backtick fence makes any markup inside inert, but the one character that can
 * close the span early — a backtick — would let the remainder of a hostile value
 * inject live markdown. So the trusted code span is emitted only when the value
 * contains no backtick; otherwise the value falls back to a plain string that the
 * caller's escaping path renders literally (never as markup). `|`/newline stay the
 * table layer's concern (`escapeTableCell`). This is the ONLY sanctioned way to
 * code-span sourced text — never hand-wrap sourced values in `trustedMarkdown`
 * backticks, which trusts them and re-opens the injection this guards against.
 */
function inlineCode(value: string): MarkdownText {
  return value.includes('`') ? value : trustedMarkdown(`\`${value}\``);
}

function trustedMarkdown(text: string): TrustedMarkdownText {
  return { text, [TRUSTED_MARKDOWN]: true };
}

function trustedMarkdownParagraph(text: string): TrustedParagraphBlock {
  return { type: 'paragraph', text: trustedMarkdown(text) };
}

function trustedMarkdownHeading(level: 1 | 2 | 3 | 4 | 5 | 6, text: string): TrustedHeadingBlock {
  return { type: 'heading', level, text: trustedMarkdown(text) };
}

function trustedMarkdownList(items: readonly string[], ordered = false): TrustedListBlock {
  return {
    type: 'list',
    ordered,
    items: items.map((item) => trustedMarkdown(item)),
  };
}

function markdownTable(
  columns: MarkdownText[],
  rows: MarkdownText[][],
  alignment?: ('left' | 'center' | 'right')[],
): TrustedTableBlock {
  return { type: 'table', columns, rows, ...(alignment !== undefined ? { alignment } : {}) };
}

/**
 * Re-emit a renderer/projection-authored Block as its trusted-markdown variant so
 * intentional inline markdown (code spans, parens) renders instead of being escaped.
 */
// @invariant: apply ONLY to renderer/projection-authored blocks, never to sourced fragment text
function trustAuthoredBlock(block: Block): MarkdownRenderableBlock {
  switch (block.type) {
    case 'heading':
      return trustedMarkdownHeading(block.level, block.text);
    case 'paragraph':
      return trustedMarkdownParagraph(block.text);
    case 'list':
      return {
        type: 'list',
        ordered: block.ordered,
        items: block.items.map((item) => (typeof item === 'string' ? trustedMarkdown(item) : item)),
      };
    default:
      return block;
  }
}

function isTrustedMarkdown(value: MarkdownText): value is TrustedMarkdownText {
  return typeof value === 'object' && TRUSTED_MARKDOWN in value;
}

function isTrustedListItemObject(
  value: ListItem | MarkdownListItem,
): value is TrustedListItemObject | Exclude<ListItem, string> {
  return typeof value === 'object' && !(TRUSTED_MARKDOWN in value);
}

function toMarkdownLink(text: string, path: string): string | null {
  const href = sanitizeMarkdownLinkTarget(path);
  if (href === null) {
    return null;
  }

  return `[${renderMarkdownLinkText(text)}](${href})`;
}

function toSafeRoutedMarkdownLink(text: string, path: string): string | null {
  if (!isSafeRoutedOutputPath(path)) {
    return null;
  }

  return toMarkdownLink(text, path);
}

/**
 * Resolves grouping entries to routed child links — the navigation list shared
 * by every routed-bundle index (api-reference packages, business-rule groups,
 * …). Each entry's `childKey` is matched against `childRoutes`; the link TEXT
 * (a sourced label) is escaped inside `toSafeRoutedMarkdownLink`, and entries
 * whose route is missing (or whose path is unsafe) fall back to the plain
 * escaped label. Entries with no resolvable route are dropped.
 */
function buildChildRouteLinks(
  entries: readonly { readonly childKey: string; readonly label: string }[],
  childRoutes: readonly ChildRouteRef[],
): (string | TrustedMarkdownText)[] {
  const routes = new Map(childRoutes.map((route) => [route.key, route.path]));
  return entries
    .map((entry) => {
      const path = routes.get(entry.childKey);
      if (path === undefined) {
        return null;
      }
      const link = toSafeRoutedMarkdownLink(entry.label, path);
      return link === null ? entry.label : trustedMarkdown(link);
    })
    .filter((entry): entry is string | TrustedMarkdownText => entry !== null);
}

function escapePlainMarkdownText(text: string): string {
  return escapeHtml(text).split('\n').map(escapePlainMarkdownLine).join('\n');
}

function escapePlainMarkdownLine(line: string): string {
  // Escape only the inline constructs that could actually start markup, so the
  // text renders literally without gratuitous backslashes. Deliberately NOT
  // escaped: `(` `)` are never markup standalone (a link needs a preceding `]`,
  // which IS escaped here, so the `](…)` form can never close); `!` only matters
  // as `![` (the `[` is escaped); and intra-word `_` never emphasizes in
  // CommonMark, so `snake_case` / `MARKDOWN_NORMALIZERS` stay literal. `*`, by
  // contrast, emphasizes mid-word and is always escaped.
  const escapedInline = line
    .replace(/[\\`*\[\]]/g, '\\$&')
    .replace(/_/g, (underscore: string, offset: number, source: string) => {
      const left = source[offset - 1] ?? '';
      const right = source[offset + 1] ?? '';
      const intraWord = /[\p{L}\p{N}]/u.test(left) && /[\p{L}\p{N}]/u.test(right);
      return intraWord ? underscore : `\\${underscore}`;
    });

  if (/^\s*$/.test(escapedInline)) {
    return escapedInline;
  }

  return escapedInline
    .replace(/^(\s*)(#{1,6})(?=\s)/, '$1\\$2')
    .replace(/^(\s*)>(?=\s?)/, '$1\\>')
    .replace(/^(\s*)([-+*])(?=\s)/, '$1\\$2')
    .replace(/^(\s*)(\d+)\.(?=\s)/, '$1$2\\.')
    .replace(/^(\s*)(-{3,}|_{3,}|\*{3,})(\s*)$/, '$1\\$2$3');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeTableCell(cell: MarkdownText): string {
  const rendered = renderMarkdownText(cell);
  return rendered.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

/**
 * Single chokepoint for markdown-link href values: decode HTML entities before
 * classification, reject control characters and protocol-relative URLs, and
 * enforce the scheme allowlist accepted by link rendering.
 */
function sanitizeMarkdownLinkTarget(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const decoded = decodeLinkTargetForClassification(trimmed);

  if (containsControlCharacters(decoded)) {
    return null;
  }

  const classified = decoded.trim();

  if (classified.startsWith('//')) {
    return null;
  }

  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(classified);
  if (schemeMatch !== null) {
    const scheme = schemeMatch[1]?.toLowerCase();
    if (scheme !== 'http' && scheme !== 'https' && scheme !== 'mailto') {
      return null;
    }
  }

  return encodeURI(trimmed).replace(/[()]/g, (character) => encodeURIComponent(character));
}

function isSafeRoutedOutputPath(path: string): boolean {
  return normalizeRoutedOutputPath(path) !== null;
}

function normalizeRequiredRoutedOutputPath(path: string, routeId: string): string {
  const normalizedPath = normalizeRoutedOutputPath(path);
  if (normalizedPath === null) {
    throw new Error(`renderMarkdown rejected unsafe routed output path for ${routeId}: ${path}`);
  }

  return normalizedPath;
}

function normalizeRoutedOutputPath(path: string): string | null {
  const classified = decodeLinkTargetForClassification(path);
  if (containsControlCharacters(classified)) {
    return null;
  }

  const trimmed = classified.trim();
  if (
    trimmed.length === 0 ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\')
  ) {
    return null;
  }

  if (/^([a-z][a-z0-9+.-]*):/i.test(trimmed)) {
    return null;
  }

  if (/%2f|%5c|%2e|%0[0-9a-f]|%1[0-9a-f]|%7f/iu.test(trimmed)) {
    return null;
  }

  if (!trimmed.toLowerCase().endsWith('.md')) {
    return null;
  }

  const segments = trimmed.split('/');
  if (!segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..')) {
    return null;
  }

  return trimmed;
}

function decodeLinkTargetForClassification(value: string): string {
  return value
    .replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, raw: string) => {
      const codePoint = raw.toLowerCase().startsWith('x')
        ? Number.parseInt(raw.slice(1), 16)
        : Number.parseInt(raw, 10);

      if (!Number.isFinite(codePoint)) {
        return match;
      }

      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    })
    .replace(/&colon;/gi, ':')
    .replace(/&sol;/gi, '/')
    .replace(/&Tab;/g, '\t')
    .replace(/&NewLine;/g, '\n');
}

function isControlCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0);
  return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
}

function containsControlCharacters(value: string): boolean {
  for (const character of value) {
    if (isControlCharacter(character)) {
      return true;
    }
  }

  return false;
}

function splitOversizedDocument(
  document: MarkdownDocument,
  budget: number,
  basePath: string,
  options: ResolvedMarkdownOptions,
  renderedDocument: RenderedMarkdownDocument,
): SplitResult {
  const groups = groupByH2(document.sections);

  if (groups.length <= 1) {
    return { parent: renderedDocument, subFiles: {} };
  }

  const subFiles: Record<string, RenderedMarkdownDocument> = {};
  const parentSections: MarkdownRenderableBlock[] = [];
  const directory = extractDirectory(basePath);
  const parentFileName = extractFileName(basePath);

  for (const [groupIndex, group] of groups.entries()) {
    if (group.heading === '_preamble') {
      parentSections.push(...group.sections);
      continue;
    }

    const subDocument: MarkdownDocument = { title: group.heading, sections: group.sections };
    const subFileName = `${slugForFilename(group.heading)}.md`;
    const subPath = directory ? `${directory}/${subFileName}` : subFileName;
    const renderKey = `${basePath}#${String(groupIndex)}:${slugForFilename(group.heading)}`;
    const renderedSubDocument = renderMarkdownDocument(
      subDocument,
      options,
      subPath,
      'measure',
      renderKey,
    );

    if (renderedSubDocument.lineCount <= budget) {
      const splitChildDocument: MarkdownDocument = {
        title: group.heading,
        sections: [linkOut(`← Back to ${document.title}`, parentFileName), ...group.sections],
      };
      // Re-renders splitChildDocument (not subDocument) because linkOut is prepended after the measure pass, so the emitted output is genuinely different.
      subFiles[subPath] = renderMarkdownDocument(
        splitChildDocument,
        options,
        subPath,
        'emit',
        renderKey,
      );
      parentSections.push(heading(2, group.heading), linkOut(`See ${group.heading}`, subFileName));
      continue;
    }

    parentSections.push(heading(2, group.heading), ...group.sections);
  }

  return {
    parent: renderMarkdownDocument(
      {
        title: document.title,
        ...(document.purpose !== undefined ? { purpose: document.purpose } : {}),
        ...(document.detailLevel !== undefined ? { detailLevel: document.detailLevel } : {}),
        sections: parentSections,
      },
      options,
      basePath,
      'emit',
    ),
    subFiles,
  };
}

function groupByH2(sections: readonly MarkdownRenderableBlock[]): H2Group[] {
  const groups: H2Group[] = [];
  let current: { heading: string; sections: MarkdownRenderableBlock[] } | undefined;

  for (const block of sections) {
    if (block.type === 'heading' && block.level === 2) {
      if (current) {
        groups.push(current);
      }
      current = {
        heading: typeof block.text === 'string' ? block.text : block.text.text,
        sections: [],
      };
      continue;
    }

    if (current) {
      current.sections.push(block);
    } else {
      current = { heading: '_preamble', sections: [block] };
    }
  }

  if (current) {
    groups.push(current);
  }

  return groups;
}

function extractDirectory(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.slice(0, lastSlash) : '';
}

function extractFileName(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;
}
