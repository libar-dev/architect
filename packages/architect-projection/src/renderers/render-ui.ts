/**
 * @architect
 * @architect-pattern UiRenderer
 * @architect-status completed
 * @architect-role:codec
 * @architect-bounded-context:rendering
 * @architect-uses FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema
 *
 * Renders fragments into UiDocument blocks consumed by the Studio desktop UI.
 * It preserves block-level structure, rewrites child links to bundle anchors,
 * and keeps React/component rendering outside the projection package.
 * @invariant The UI renderer does not sanitize URL targets and is not a
 * hardening boundary for untrusted links; sanitize before this layer.
 *
 * ### When to Use
 *
 * - When the Studio desktop app needs UiDocument trees for BlockRenderer,
 *   including ordered section layouts, routed bundle children, or PatternDetail
 *   field ordering.
 */
import { slugify } from '@libar-dev/architect-core';

import { humanizeKey, isPrimitive, stableStringify } from '../_internal/format-utils.js';
import {
  code,
  heading,
  isBlock,
  list,
  paragraph,
  table,
  type Block,
  type CollapsibleBlock,
  type LinkOutBlock,
} from '@libar-dev/architect-core';
import {
  isBundle,
  type Fragment,
  type PatternDetail,
  type ProjectionBundle,
} from '../fragments/index.js';

import { dispatchByKind, type KindTable } from './_shared/dispatch.js';
import type { ProjectionInput, RenderUiOptions } from './types.js';

/**
 * One titled section of a {@link UiDocument} — a stable id, a display title, and
 * the {@link Block}s the section renders.
 *
 * @architect-shape
 */
export interface UiSection {
  /** Stable slug identifying the section (used for anchors and ordering). */
  id: string;
  /** Human-readable section title. */
  title: string;
  /** The blocks rendered within the section. */
  blocks: Block[];
}

/**
 * A renderable document tree consumed by the Studio desktop UI's BlockRenderer —
 * the fragment kind, a heading, ordered sections, and optional routed children
 * keyed by bundle child path.
 *
 * @architect-shape
 */
export interface UiDocument {
  /** The originating fragment's kind discriminant. */
  kind: Fragment['kind'];
  /** The document's top-level heading. */
  heading: string;
  /** The ordered sections that make up the document body. */
  sections: UiSection[];
  /** Optional routed child documents, keyed by bundle child path. */
  children?: Record<string, UiDocument>;
}

type Primitive = string | number | boolean;
type PrimitiveLike = Primitive | Primitive[];
type TabularRow = Record<string, unknown>;
interface ChildLinkRef {
  slug: string;
  aliases: Set<string>;
}

interface RenderFragmentOptions {
  readonly options: Required<RenderUiOptions>;
  readonly inheritedChildRefs: readonly ChildLinkRef[];
}

const DEFAULT_OPTIONS: Required<RenderUiOptions> = {
  resolveChildLinks: true,
};

const DEFAULT_FIELD_ORDER_BY_KIND: Partial<Record<Fragment['kind'], readonly string[]>> = {
  PatternDetail: ['overview', 'deliverables', 'relationships', 'rules', 'stubs'],
};

const PATTERN_DETAIL_RELATIONSHIP_ORDER = [
  'dependsOn',
  'uses',
  'enables',
  'usedBy',
  'implementsPatterns',
  'implementedBy',
  'extendsPattern',
  'extendedBy',
  'seeAlso',
  'apiRef',
] as const;

const UI_RENDERERS: KindTable<UiDocument, RenderFragmentOptions> = {
  PatternDetail: renderPatternDetail,
};

/**
 * Renders a projection fragment or bundle into a {@link UiDocument} tree for the
 * Studio desktop UI. Bundles render their root and merge in routed children;
 * child links are rewritten to bundle anchors unless disabled via options.
 *
 * @architect-shape
 * @param input - The fragment or bundle to render.
 * @param options - Optional controls — `resolveChildLinks` toggles child-link rewriting.
 * @returns The rendered {@link UiDocument} (typed as `object` at the package boundary).
 */
export const renderUi = (input: ProjectionInput, options?: RenderUiOptions): object => {
  const resolvedOptions = resolveOptions(options);

  if (isBundle(input)) {
    return renderBundle(input, resolvedOptions);
  }

  return renderFragment(input, resolvedOptions);
};

function resolveOptions(options: RenderUiOptions | undefined): Required<RenderUiOptions> {
  return {
    resolveChildLinks: options?.resolveChildLinks ?? DEFAULT_OPTIONS.resolveChildLinks,
  };
}

function renderBundle(
  bundle: ProjectionBundle<Fragment>,
  options: Required<RenderUiOptions>,
): UiDocument {
  const bundleChildren = getSortedEntries(bundle.children);
  const bundleChildRefs = createChildLinkRefs(
    bundleChildren,
    bundle.routing?.anchorStrategy ?? 'heading-slug',
  );
  const rootDocument = renderFragment(bundle.root, options, bundleChildRefs);
  const renderedBundleChildren = renderChildren(bundleChildren, options, bundleChildRefs);

  return mergeChildren(rootDocument, renderedBundleChildren);
}

function renderFragment(
  fragment: Fragment,
  options: Required<RenderUiOptions>,
  inheritedChildRefs: readonly ChildLinkRef[] = [],
): UiDocument {
  return dispatchByKind(fragment, UI_RENDERERS, renderStructuredFragment, {
    options,
    inheritedChildRefs,
  });
}

function renderPatternDetail(
  fragment: PatternDetail,
  renderOptions: RenderFragmentOptions,
): UiDocument {
  const { options, inheritedChildRefs } = renderOptions;
  const childRefs = inheritedChildRefs;
  const metadataRows: string[][] = [];

  if (fragment.status !== undefined) {
    metadataRows.push(['Status', fragment.status]);
  }
  metadataRows.push(['Role', fragment.role]);
  if (fragment.phase !== undefined) {
    metadataRows.push(['Phase', String(fragment.phase)]);
  }
  metadataRows.push(['File', fragment.file], ['Source', fragment.source]);

  const overviewBlocks: Block[] = [];
  if (fragment.description !== undefined && fragment.description.length > 0) {
    overviewBlocks.push(paragraph(fragment.description));
  }
  if (metadataRows.length > 0) {
    overviewBlocks.push(table(['Field', 'Value'], metadataRows, ['left', 'left']));
  }

  const deliverableItems =
    fragment.deliverables.length > 0
      ? fragment.deliverables
      : (fragment.deliverableManifest?.items ?? []);
  const deliverableBlocks: Block[] =
    deliverableItems.length === 0
      ? []
      : [
          table(
            ['Name', 'Status', 'Location', 'Tests'],
            deliverableItems.map((item) => [
              item.name,
              item.status,
              item.location,
              item.tests.join(', '),
            ]),
            ['left', 'left', 'left', 'left'],
          ),
        ];

  const relationshipBlocks: Block[] = [];
  for (const key of PATTERN_DETAIL_RELATIONSHIP_ORDER) {
    if (key === 'implementedBy') {
      const implementedBy = fragment.relationships.implementedBy;
      if (implementedBy.length === 0) {
        continue;
      }

      relationshipBlocks.push(
        heading(3, humanizeKey(key)),
        list(
          implementedBy.map((entry) =>
            entry.description !== undefined && entry.description.length > 0
              ? `${entry.name} — ${entry.file} — ${entry.description}`
              : `${entry.name} — ${entry.file}`,
          ),
        ),
      );
      continue;
    }

    const value = fragment.relationships[key];
    if (value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      relationshipBlocks.push(heading(3, humanizeKey(key)), paragraph(value));
      continue;
    }

    if (value.length === 0) {
      continue;
    }

    relationshipBlocks.push(heading(3, humanizeKey(key)), list([...value]));
  }

  const ruleBlocks = fragment.rules.flatMap((rule) => {
    const blocks: Block[] = [heading(3, rule.name)];

    if (rule.invariant !== undefined && rule.invariant.length > 0) {
      blocks.push(paragraph(`Invariant: ${rule.invariant}`));
    }
    if (rule.rationale !== undefined && rule.rationale.length > 0) {
      blocks.push(paragraph(`Rationale: ${rule.rationale}`));
    }
    if (rule.verifiedBy.length > 0) {
      blocks.push(list(rule.verifiedBy));
    }

    return rewriteBlocks(blocks, childRefs, options.resolveChildLinks);
  });

  const stubBlocks: Block[] =
    fragment.stubs.length === 0
      ? []
      : [
          table(
            ['Name', 'Stub File', 'Target Path'],
            fragment.stubs.map((stub) => [stub.name, stub.stubFile, stub.targetPath]),
            ['left', 'left', 'left'],
          ),
        ];

  return {
    kind: fragment.kind,
    heading: fragment.patternName,
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: rewriteBlocks(overviewBlocks, childRefs, options.resolveChildLinks),
      },
      {
        id: 'deliverables',
        title: 'Deliverables',
        blocks: rewriteBlocks(deliverableBlocks, childRefs, options.resolveChildLinks),
      },
      {
        id: 'relationships',
        title: 'Relationships',
        blocks: rewriteBlocks(relationshipBlocks, childRefs, options.resolveChildLinks),
      },
      { id: 'rules', title: 'Rules', blocks: ruleBlocks },
      {
        id: 'stubs',
        title: 'Stubs',
        blocks: rewriteBlocks(stubBlocks, childRefs, options.resolveChildLinks),
      },
    ],
  };
}

function renderStructuredFragment(
  fragment: Fragment,
  renderOptions: RenderFragmentOptions,
): UiDocument {
  const { options, inheritedChildRefs } = renderOptions;
  const sections = getOrderedFieldKeys(fragment)
    .map((key) =>
      createFieldSection(
        key,
        (fragment as Record<string, unknown>)[key],
        inheritedChildRefs,
        options,
      ),
    )
    .filter((section): section is UiSection => section !== null);

  return {
    kind: fragment.kind,
    heading: deriveHeading(fragment),
    sections,
  };
}

function createFieldSection(
  key: string,
  value: unknown,
  childRefs: readonly ChildLinkRef[],
  options: Required<RenderUiOptions>,
): UiSection | null {
  if (value === undefined) {
    return null;
  }

  const title = humanizeKey(key);
  const id = slugify(key);

  if (isBlockArray(value)) {
    return {
      id,
      title,
      blocks: rewriteBlocks(value, childRefs, options.resolveChildLinks),
    };
  }

  if (isBlock(value)) {
    return {
      id,
      title,
      blocks: rewriteBlocks([value], childRefs, options.resolveChildLinks),
    };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }

    if (value.every(isPrimitive)) {
      return {
        id,
        title,
        blocks: [list(value.map((item) => formatPrimitive(item)))],
      };
    }

    const tabularRows = toTabularRows(value);
    if (tabularRows) {
      const columns = getTabularColumns(tabularRows);
      return {
        id,
        title,
        blocks: [
          table(
            columns.map(humanizeKey),
            tabularRows.map((row) =>
              columns.map((column) =>
                formatPrimitiveLike((row[column] as PrimitiveLike | undefined) ?? ''),
              ),
            ),
            columns.map((): 'left' => 'left'),
          ),
        ],
      };
    }

    return {
      id,
      title,
      blocks: [code(stableStringify(value, 2), 'json')],
    };
  }

  if (isPrimitive(value)) {
    return {
      id,
      title,
      blocks: [paragraph(formatPrimitive(value))],
    };
  }

  if (isPrimitiveRecord(value)) {
    return {
      id,
      title,
      blocks: [
        table(
          ['Field', 'Value'],
          Object.entries(value).map(([entryKey, entryValue]) => [
            humanizeKey(entryKey),
            formatPrimitiveLike(entryValue),
          ]),
          ['left', 'left'],
        ),
      ],
    };
  }

  return {
    id,
    title,
    blocks: [code(stableStringify(value, 2), 'json')],
  };
}

function rewriteBlocks(
  blocks: readonly Block[],
  childRefs: readonly ChildLinkRef[],
  resolveChildLinks: boolean,
): Block[] {
  if (!resolveChildLinks || childRefs.length === 0) {
    return [...blocks];
  }

  return blocks.map((block) => rewriteBlock(block, childRefs));
}

function rewriteBlock(block: Block, childRefs: readonly ChildLinkRef[]): Block {
  if (block.type === 'collapsible') {
    const content = rewriteBlocks(block.content, childRefs, true);
    return {
      ...block,
      content,
    } satisfies CollapsibleBlock;
  }

  if (block.type === 'link-out') {
    return {
      ...block,
      path: resolveChildLinkPath(block.path, childRefs),
    } satisfies LinkOutBlock;
  }

  return block;
}

function resolveChildLinkPath(path: string, childRefs: readonly ChildLinkRef[]): string {
  if (isExternalPath(path)) {
    return path;
  }

  const hashIndex = path.indexOf('#');
  const rawTarget = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const rawAnchor = hashIndex >= 0 ? path.slice(hashIndex + 1) : '';
  const normalizedTarget = normalizePathToken(rawTarget);
  const matchedRef = childRefs.find((ref) => ref.aliases.has(normalizedTarget));

  if (!matchedRef) {
    if (rawTarget.length === 0 && rawAnchor.length > 0) {
      return `#${slugify(rawAnchor)}`;
    }
    return path;
  }

  const anchorSuffix = rawAnchor.length > 0 ? `#${slugify(rawAnchor)}` : '';
  return `${matchedRef.slug}${anchorSuffix}`;
}

function mergeChildren(document: UiDocument, children: Record<string, UiDocument>): UiDocument {
  if (Object.keys(children).length === 0) {
    return document;
  }

  const mergedChildren = {
    ...(document.children ?? {}),
    ...children,
  };

  const mergedKeys = Object.keys(mergedChildren).sort((left, right) => left.localeCompare(right));

  const sortedChildrenEntries = mergedKeys.map((key) => [key, mergedChildren[key]] as const);

  return {
    ...document,
    children: Object.fromEntries(sortedChildrenEntries) as Record<string, UiDocument>,
  };
}

function renderChildren(
  childEntries: readonly (readonly [string, Fragment])[],
  options: Required<RenderUiOptions>,
  inheritedChildRefs: readonly ChildLinkRef[],
): Record<string, UiDocument> {
  return Object.fromEntries(
    childEntries.map(([key, child]) => [key, renderFragment(child, options, inheritedChildRefs)]),
  );
}

function createChildLinkRefs(
  childEntries: readonly (readonly [string, Fragment])[],
  anchorStrategy: 'heading-slug' | 'kind-id',
): ChildLinkRef[] {
  return childEntries.map(([key, child]) => {
    const headingValue = deriveHeading(child);
    const slug =
      anchorStrategy === 'kind-id'
        ? slugify(`${child.kind}-${deriveIdentityValue(child, key)}`)
        : slugify(key);

    const aliases = new Set<string>([
      normalizePathToken(key),
      normalizePathToken(headingValue),
      normalizePathToken(slug),
      normalizePathToken(getBasename(key)),
      normalizePathToken(stripKnownExtension(getBasename(key))),
    ]);

    return { slug, aliases };
  });
}

function getSortedEntries<T>(record: Record<string, T>): (readonly [string, T])[] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function getOrderedFieldKeys(fragment: Fragment): string[] {
  const preferred = DEFAULT_FIELD_ORDER_BY_KIND[fragment.kind] ?? [];
  const preferredSet = new Set(preferred);
  const allKeys = Object.keys(fragment).filter((key) => shouldIncludeField(fragment, key));
  const remaining = allKeys
    .filter((key) => !preferredSet.has(key))
    .sort((left, right) => left.localeCompare(right));

  return [...preferred.filter((key) => allKeys.includes(key)), ...remaining];
}

function shouldIncludeField(fragment: Fragment, key: string): boolean {
  if (key === 'kind') {
    return false;
  }

  const headingValue = deriveHeading(fragment);
  const value = (fragment as Record<string, unknown>)[key];

  if (key === 'title' || key === 'patternName') {
    return typeof value !== 'string' || value !== headingValue;
  }

  if (key === 'id') {
    return typeof value !== 'string' || value !== headingValue;
  }

  return true;
}

function deriveHeading(fragment: Fragment): string {
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

function deriveIdentityValue(fragment: Fragment, fallback: string): string {
  if ('id' in fragment && typeof fragment.id === 'string' && fragment.id.length > 0) {
    return fragment.id;
  }
  if (
    'patternName' in fragment &&
    typeof fragment.patternName === 'string' &&
    fragment.patternName.length > 0
  ) {
    return fragment.patternName;
  }
  if ('title' in fragment && typeof fragment.title === 'string' && fragment.title.length > 0) {
    return fragment.title;
  }
  return fallback;
}

function isPrimitiveLike(value: unknown): value is PrimitiveLike {
  return isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive));
}

function isPrimitiveRecord(value: unknown): value is Record<string, PrimitiveLike> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => isPrimitiveLike(entry))
  );
}

function formatPrimitive(value: Primitive): string {
  return typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
}

function formatPrimitiveLike(value: PrimitiveLike): string {
  if (Array.isArray(value)) {
    return value.map((entry) => formatPrimitive(entry)).join(', ');
  }

  return formatPrimitive(value);
}

function isBlockArray(value: unknown): value is Block[] {
  return Array.isArray(value) && value.every(isBlock);
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

function getTabularColumns(rows: TabularRow[]): string[] {
  const columns = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      columns.add(key);
    }
  }

  return Array.from(columns).sort((left, right) => left.localeCompare(right));
}

function getBasename(value: string): string {
  const slashIndex = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'));
  return slashIndex >= 0 ? value.slice(slashIndex + 1) : value;
}

function stripKnownExtension(value: string): string {
  return value.replace(/\.[a-z0-9]+$/i, '');
}

function normalizePathToken(value: string): string {
  const decoded = safeDecodeURIComponent(value.trim());
  return decoded
    .replace(/^\.?\//, '')
    .replace(/\\/g, '/')
    .toLowerCase();
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isExternalPath(value: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('mailto:');
}
