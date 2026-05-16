/**
 * @architect
 * @architect-pattern MarkdownRenderer
 * @architect-status completed
 * @architect-role:codec
 * @architect-bounded-context:rendering
 *
 * Renders fragments into GitHub-flavored Markdown documents for generated docs.
 * Normalizers map fragment contracts to block sections, then handle frontmatter,
 * parent/child bundle files, h2 splitting, and relative child links.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
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
import {
  isBundle,
  summarizeTaxonomyDigest,
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
import { getDocumentationTypeMetadata } from '../projections/documentation-composition/documentation-types.js';
import { defaultMarkdownRouteProfile } from './markdown-paths.js';
import type { DisclosureSpec } from '../projections/documentation-composition/disclosure-spec.js';
import {
  REQUIREMENTS_ALL_AREAS_LABEL,
  REQUIREMENTS_EXECUTABLE_AREA_LABEL,
  REQUIREMENTS_SPECS_AREA_LABEL,
} from '../fragments/operational-insights/requirement-digest.js';

import { dispatchByKind, type KindTable } from './_shared/dispatch.js';
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
  readonly parent: MarkdownDocument;
  readonly subFiles: Record<string, MarkdownDocument>;
}

interface MarkdownMetadata {
  readonly title: string;
  readonly purpose?: string;
  readonly detailLevel?: string;
}

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

const MARKDOWN_NORMALIZERS: KindTable<MarkdownDocument, NormalizeMarkdownOptions> = {
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
};

export const renderMarkdown = (
  input: ProjectionInput,
  options?: RenderMarkdownOptions
): string | Record<string, string> => {
  const resolvedOptions = resolveOptions(options);

  if (isBundle(input)) {
    return renderBundle(input, resolvedOptions);
  }

  return renderDocument(normalizeFragment(input), resolvedOptions);
};

function renderBundle(
  bundle: ProjectionBundle<Fragment>,
  options: ResolvedMarkdownOptions
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
      disclosureSpec
    );
    return renderDocument(rootDocument, options);
  }

  if (!bundle.routing) {
    throw new Error('renderMarkdown requires routing metadata when bundle children are included.');
  }

  const routing = bundle.routing;
  const entries = new Map<string, string>();
  const rootPath = normalizeRequiredRoutedOutputPath(
    options.routeProfile.mapPath(routing.rootRouteId, bundle.root.kind),
    routing.rootRouteId
  );
  const sortedKeys = [...childKeys].sort((left, right) => left.localeCompare(right));

  const { childPathMap, childRouteIdPathMap } = resolveChildOutputPaths(
    bundle,
    sortedKeys,
    rootPath,
    options
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
    disclosureSpec
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
      disclosureSpec
    );
    const childDocument = appendBundleBackLink(
      normalizedChild,
      rootDocument.title,
      childPath,
      rootPath
    );
    addRoutedDocument(entries, childPath, childDocument, options);
  }

  return Object.fromEntries(
    Array.from(entries.entries()).sort(([left], [right]) => left.localeCompare(right))
  );
}

function addRoutedDocument(
  entries: Map<string, string>,
  basePath: string,
  document: MarkdownDocument,
  options: ResolvedMarkdownOptions
): void {
  const sizeBudget = options.sizeBudget;
  const splitResult = shouldSplit(document, basePath, options)
    ? splitOversizedDocument(document, sizeBudget ?? 0, basePath, (doc) =>
        renderDocument(doc, options)
      )
    : null;

  if (!splitResult) {
    addUniqueEntry(entries, basePath, renderDocument(document, options));
    return;
  }

  addUniqueEntry(entries, basePath, renderDocument(splitResult.parent, options));

  for (const [path, childDocument] of Object.entries(splitResult.subFiles)) {
    addUniqueEntry(entries, path, renderDocument(childDocument, options));
  }
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
  options: ResolvedMarkdownOptions
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
  options: ResolvedMarkdownOptions
): string {
  const routeId = bundle.routing?.childRouteIds[key];

  if (routeId === undefined) {
    throw new Error(`renderMarkdown missing child route ID for bundle child key: ${key}`);
  }

  return options.routeProfile.mapPath(routeId, child.kind, key);
}

function resolveBundleDisclosureSpec(
  bundle: ProjectionBundle<Fragment>,
  options: ResolvedMarkdownOptions
): DisclosureSpec | undefined {
  if (options.disclosureSpec !== undefined) {
    return options.disclosureSpec;
  }

  const documentType = bundle.routing?.rootRouteId.split(':')[0];
  if (documentType === undefined) {
    return undefined;
  }

  const metadata = getDocumentationTypeMetadata(documentType);
  if (metadata?.status !== 'supported') {
    return undefined;
  }

  const level = options.disclosureLevel ?? metadata.defaultDisclosureLevel;
  return metadata.disclosureMatrix[level];
}

function createUniqueRoutedPath(path: string, stableId: string, usedPaths: Set<string>): string {
  if (!usedPaths.has(path)) {
    usedPaths.add(path);
    return path;
  }

  const suffix = toKebabCase(stableId) || 'route';
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

function shouldSplit(
  document: MarkdownDocument,
  basePath: string,
  options: ResolvedMarkdownOptions
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

  const rendered = renderDocument(document, options);
  return rendered.split('\n').length > options.sizeBudget;
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
  };
}

type ResolvedMarkdownOptions = Required<
  Pick<RenderMarkdownOptions, 'includeChildren' | 'includeFrontmatter' | 'routeProfile'>
> &
  Required<Pick<RenderMarkdownOptions, 'splitStrategy'>> & {
    disclosureLevel?: NonNullable<RenderMarkdownOptions['disclosureLevel']>;
    disclosureSpec?: DisclosureSpec;
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
  disclosureSpec?: DisclosureSpec
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

function normalizeArchitectureDiagram(fragment: ArchitectureDiagram): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const scopeLabel = humanizeKey(fragment.scope);
  const scopeDescription =
    fragment.scopeValue !== undefined
      ? `${scopeLabel} scoped to ${fragment.scopeValue}.`
      : `${scopeLabel} architecture view.`;

  const sections: MarkdownRenderableBlock[] = [
    heading(2, 'Overview'),
    paragraph(
      `This diagram captures ${String(fragment.patterns.length)} ${fragment.patterns.length === 1 ? 'pattern' : 'patterns'} in the ${scopeDescription}`
    ),
    heading(2, 'Diagram'),
    fragment.diagram,
  ];

  if (fragment.legend !== undefined && fragment.legend.length > 0) {
    sections.push(heading(2, 'Legend'), ...fragment.legend);
  }

  if (fragment.patterns.length > 0) {
    sections.push(heading(2, 'Patterns'), list(fragment.patterns));
  }

  return createMarkdownDocument(metadata, sections);
}

function normalizeBusinessRuleSet(
  fragment: BusinessRuleSet,
  options: NormalizeMarkdownOptions
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
      `Structured business-rule catalog with ${String(rules.length)} ${rules.length === 1 ? 'rule' : 'rules'}${fragment.groupedBy !== undefined ? ` grouped by ${humanizeKey(fragment.groupedBy).toLowerCase()}` : ''}.`
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
      options.childRoutes
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
  richness: DisclosureSpec['richness']
): TableBlock {
  if (richness === 'name-only') {
    return table(
      ['Feature', 'Rule Name'],
      rules.map((rule) => [rule.feature, rule.ruleName]),
      ['left', 'left']
    );
  }

  if (richness === 'summary') {
    return table(
      ['Feature', 'Rule Name', 'Invariant'],
      rules.map((rule) => [rule.feature, rule.ruleName, rule.invariant ?? '']),
      ['left', 'left', 'left']
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
      ['left', 'left', 'left', 'left', 'left']
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
    ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'left']
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
      ['left', 'left']
    ),
    heading(2, 'ADR Index'),
    table(
      ['ADR', 'Title', 'Status', 'Type'],
      decisions.map((decision) => [
        toMarkdownLink(decision.id, `decisions/${toKebabCase(decision.id)}.md`) ?? decision.id,
        decision.title,
        decision.status,
        decision.type,
      ]),
      ['left', 'left', 'left', 'left']
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
      ['left', 'left']
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
      `Quarter-grouped ${viewLabel} timeline covering ${String(fragment.quarters.length)} ${fragment.quarters.length === 1 ? 'quarter' : 'quarters'}.`
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
        ['left', 'left']
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
        ['left', 'left', 'left', 'left', 'left']
      )
    );
  }

  return createMarkdownDocument(metadata, sections);
}

function normalizeReleaseNotesDigest(fragment: ReleaseNotesDigest): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const sections: MarkdownRenderableBlock[] = [
    paragraph('All notable changes to this project will be documented in this file.'),
    trustedMarkdownParagraph(
      'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).'
    ),
  ];

  for (const release of fragment.releases) {
    const addedEntries = dedupeStrings([
      ...release.deliverables.map(
        (deliverable) =>
          `**${escapePlainMarkdownText(deliverable.name)}**${deliverable.location.length > 0 ? `: ${escapePlainMarkdownText(deliverable.location)}` : ''}`
      ),
      ...release.patterns.map((pattern) => escapePlainMarkdownText(pattern.patternName)),
    ]);

    sections.push(
      trustedMarkdownHeading(
        2,
        `[${escapePlainMarkdownText(release.release)}]${release.date !== undefined ? ` - ${escapePlainMarkdownText(release.date)}` : ''}`
      )
    );

    if (release.notes !== undefined && release.notes.trim().length > 0) {
      sections.push(paragraph(release.notes));
    }

    sections.push(
      heading(3, 'Added'),
      ...(addedEntries.length > 0
        ? [trustedMarkdownList(addedEntries)]
        : [paragraph('No release additions were recorded.')])
    );
  }

  return createMarkdownDocument(metadata, sections);
}

function normalizeRequirementDigest(
  fragment: RequirementDigest,
  options: NormalizeMarkdownOptions
): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);
  const requirements = [...fragment.requirements].sort((left, right) =>
    left.pattern.localeCompare(right.pattern)
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
        trustedMarkdownParagraph(`**Status:** ${escapePlainMarkdownText(requirement.status)}`)
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
      ['left', 'left', 'left']
    ),
  ]);
}

function renderRequirementPatternCell(
  patternName: string,
  options: NormalizeMarkdownOptions
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
    (group) => group.entries[0]?.kind === 'aggregation'
  );
  const sections: Block[] = [
    heading(2, 'Overview'),
    paragraph(
      `**${String(counts.roles)} roles** | **${String(counts.metadata)} metadata tags** | **${String(counts.aggregation)} aggregation tags** | **${String(counts.total)} total**`
    ),
    table(
      ['Component', 'Count'],
      [
        ['Roles', String(counts.roles)],
        ['Metadata Tags', String(counts.metadata)],
        ['Aggregation Tags', String(counts.aggregation)],
        ['Total', String(counts.total)],
      ],
      ['left', 'left']
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
      ['left', 'left', 'left']
    )
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
        ['left', 'left']
      )
    );
  }

  return createMarkdownDocument(metadata, sections);
}

function normalizeTraceabilityMatrix(fragment: TraceabilityMatrix): MarkdownDocument {
  const metadata = resolveFragmentMetadata(fragment);

  return createMarkdownDocument(metadata, [
    heading(2, 'Summary'),
    paragraph(
      `Traceability matrix covering ${String(fragment.rows.length)} ${fragment.rows.length === 1 ? 'pattern row' : 'pattern rows'}.`
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
      ['left', 'left', 'left', 'left', 'left']
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
    ])
  );

  return createMarkdownDocument(metadata, [
    heading(2, 'Overview'),
    paragraph(
      `Process Guard validates delivery workflow changes at commit time using a Decider pattern. It enforces the ${String(fragment.fsm.states.length)}-state FSM and prevents common workflow violations.`
    ),
    paragraph(
      `**${String(fragment.rules.length)} validation rules** | **${String(fragment.fsm.states.length)} FSM states** | **${String(fragment.protectionLevels.length)} protection levels**`
    ),
    heading(2, 'Validation Rules'),
    table(
      ['Rule ID', 'Severity', 'Description', 'Applies To Roles'],
      fragment.rules.map((rule) => [
        `\`${rule.id}\``,
        rule.severity,
        rule.description,
        rule.appliesToRoles?.join(', ') ?? '',
      ]),
      ['left', 'left', 'left', 'left']
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
  options: NormalizeMarkdownOptions
): MarkdownDocument {
  const fields = Object.entries(fragment).filter(([key]) => key !== 'kind');
  const metadataRows: string[][] = [];
  const sections: Block[] = [];
  const metadata = resolveFragmentMetadata(fragment);
  const title = metadata.title;
  const embeddedSections = renderEmbeddedSections(
    (fragment as Record<string, unknown>)['sections'],
    options
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
        options.currentPath
      ),
    ];
  });
}

function createMarkdownDocument(
  metadata: MarkdownMetadata,
  sections: MarkdownRenderableBlock[]
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
    case 'ArchitectureDiagram':
      return {
        title: 'Architecture',
        purpose: 'Auto-generated architecture diagram from source annotations',
        detailLevel: 'Component diagram with bounded context subgraphs',
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
  fragment: BusinessRuleSet
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
        ['left', 'left', 'left', 'left']
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
        ['left', 'left', 'left', 'left']
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
        ['left', 'left', 'left', 'left']
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
      ['left', 'left', 'left', 'left']
    ),
  };
}

function buildBusinessRuleGroupingLinks(
  groupedBy: BusinessRuleSet['groupedBy'],
  groupingEntries: BusinessRuleSet['groupingEntries'],
  childRoutes: readonly ChildRouteRef[]
): { heading: string; links: TrustedListBlock } | null {
  if (groupedBy === undefined || groupingEntries === undefined || groupingEntries.length === 0) {
    return null;
  }

  const routes = new Map(childRoutes.map((route) => [route.key, route.path]));
  const links = groupingEntries
    .map((entry) => {
      const path = routes.get(entry.childKey);
      if (path === undefined) {
        return null;
      }

      const link = toSafeRoutedMarkdownLink(entry.label, path);
      return link === null ? entry.label : trustedMarkdown(link);
    })
    .filter((entry): entry is string | TrustedMarkdownText => entry !== null);

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

function buildTaxonomyGroupTable(group: TaxonomyDigest['tags'][number]): TableBlock {
  const kind = group.entries[0]?.kind;

  if (kind === 'role') {
    return table(
      ['Tag', 'Domain', 'Priority', 'Description', 'Aliases'],
      group.entries.map((entry) => [
        `\`${entry.tag}\``,
        entry.domain ?? '',
        entry.priority === undefined ? '' : String(entry.priority),
        entry.description ?? '',
        entry.aliases?.join(', ') ?? '',
      ]),
      ['left', 'left', 'left', 'left', 'left']
    );
  }

  if (kind === 'aggregation') {
    return table(
      ['Tag', 'Target Document', 'Purpose'],
      group.entries.map((entry) => [`\`${entry.tag}\``, entry.targetDoc ?? '', entry.purpose]),
      ['left', 'left', 'left']
    );
  }

  return table(
    ['Tag', 'Format', 'Purpose', 'Required', 'Repeatable', 'Values', 'Default Value', 'Example'],
    group.entries.map((entry) => [
      `\`${entry.tag}\``,
      entry.format ?? '',
      entry.purpose,
      entry.required === undefined ? '' : entry.required ? 'Yes' : 'No',
      entry.repeatable === undefined ? '' : entry.repeatable ? 'Yes' : 'No',
      entry.values?.join(', ') ?? '',
      entry.defaultValue ?? '',
      entry.example ?? '',
    ]),
    ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left']
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
  currentPath: string | undefined
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
          currentPath
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
      })
    ),
    columns.map(() => 'left')
  );
}

function appendBundleBackLink(
  document: MarkdownDocument,
  rootTitle: string,
  currentPath: string,
  rootPath: string
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
      const fence = block.content.includes('```') ? '````' : '```';
      return [`${fence}${block.language ?? ''}`, block.content, fence, ''];
    }
    case 'mermaid':
      return ['```mermaid', block.content, '```', ''];
    case 'collapsible':
      return renderCollapsible(block);
    case 'link-out':
      return renderLinkOut(block);
    default: {
      return [`<!-- Unknown block type: ${JSON.stringify(block)} -->`, ''];
    }
  }
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
    `| ${escapedColumns.map((cell, index) => padCell(cell, widths[index] ?? 0)).join(' | ')} |`
  );
  lines.push(
    `| ${separators.map((cell, index) => padSeparator(cell, widths[index] ?? 0, index)).join(' | ')} |`
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
  indent: number
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
  alignment?: ('left' | 'center' | 'right')[]
): TrustedTableBlock {
  return { type: 'table', columns, rows, ...(alignment !== undefined ? { alignment } : {}) };
}

function isTrustedMarkdown(value: MarkdownText): value is TrustedMarkdownText {
  return typeof value === 'object' && TRUSTED_MARKDOWN in value;
}

function isTrustedListItemObject(
  value: ListItem | MarkdownListItem
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

function escapePlainMarkdownText(text: string): string {
  return escapeHtml(text).split('\n').map(escapePlainMarkdownLine).join('\n');
}

function escapePlainMarkdownLine(line: string): string {
  const escapedInline = line.replace(/([\\`*_\[\]()!])/g, '\\$1');

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
  renderFn: (document: MarkdownDocument) => string
): SplitResult {
  const groups = groupByH2(document.sections);

  if (groups.length <= 1) {
    return { parent: document, subFiles: {} };
  }

  const subFiles: Record<string, MarkdownDocument> = {};
  const parentSections: MarkdownRenderableBlock[] = [];
  const directory = extractDirectory(basePath);
  const parentFileName = extractFileName(basePath);

  for (const group of groups) {
    if (group.heading === '_preamble') {
      parentSections.push(...group.sections);
      continue;
    }

    const subDocument: MarkdownDocument = { title: group.heading, sections: group.sections };
    const subLineCount = renderFn(subDocument).split('\n').length;

    if (subLineCount <= budget) {
      const subFileName = `${toKebabCase(group.heading)}.md`;
      const subPath = directory ? `${directory}/${subFileName}` : subFileName;
      subFiles[subPath] = {
        title: group.heading,
        sections: [linkOut(`← Back to ${document.title}`, parentFileName), ...group.sections],
      };
      parentSections.push(heading(2, group.heading), linkOut(`See ${group.heading}`, subFileName));
      continue;
    }

    parentSections.push(heading(2, group.heading), ...group.sections);
  }

  return {
    parent: {
      title: document.title,
      ...(document.purpose !== undefined ? { purpose: document.purpose } : {}),
      ...(document.detailLevel !== undefined ? { detailLevel: document.detailLevel } : {}),
      sections: parentSections,
    },
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

function toKebabCase(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractDirectory(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.slice(0, lastSlash) : '';
}

function extractFileName(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;
}
