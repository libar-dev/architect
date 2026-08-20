/**
 * @architect
 * @architect-pattern OperationalInsightsProjectionSupport
 * @architect-status completed
 * @architect-role:utility
 * @architect-uses ProjectionFragmentContracts, BusinessRuleReference, ExtractedPattern
 * @architect-bounded-context:projection
 *
 * ## Operational insights projection support
 *
 * **Value:** Hosts the pure `build*` helpers and private utilities every
 * operational-insights projection leans on — overview assembly, coverage
 * computation, tag-usage aggregation, source categorisation, role resolution,
 * and requirement-block construction — so each `project*` entry point stays
 * a thin wrapper.
 *
 * **Invariant:** Helpers read only from `ProjectionContext` (graph + tag
 * registry) and `ExtractedPattern`; they never touch the filesystem, emit
 * renderable docs, or mutate the graph; sort keys are always deterministic.
 *
 * **Behavior:**
 * - Classifies files by path (`/stubs/`, `/decisions/`, `.feature`, `.ts`)
 *   and uses a fixed `SOURCE_TYPE_PRIORITY` map so source inventory output
 *   stays stable across runs.
 * - Derives required coverage tags from `tagRegistry.metadataTags` plus the
 *   implicit `role` requirement when any roles are configured.
 * - Reuses governance `BusinessRule` projections to attach stable
 *   `BusinessRuleReference` values to requirement digests without embedding
 *   rule detail fragments into the operational-insights surface.
 * - Ships the canonical overview CLI-hints block verbatim so callers get a
 *   consistent session-bootstrap payload out of the box.
 *
 * ### When to Use
 *
 * - Projects the operational-insights support surface used by the fragment builders below.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import {
  findPatternByName,
  isPatternActive,
  isPatternComplete,
  isPatternPlanned,
  normalizeStatus,
  ProjectionError,
} from '@libar-dev/architect-core';

import { heading, list, mermaid, paragraph, type Block } from '@libar-dev/architect-core';
import type { ProjectionContext } from '../../context/projection-context.js';
import type { BusinessRuleReference } from '../../fragments/governance/index.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import {
  REQUIREMENTS_EXECUTABLE_AREA_LABEL,
  REQUIREMENTS_SPECS_AREA_LABEL,
} from '../../fragments/operational-insights/requirement-digest.js';
import {
  type AnnotationCoverage,
  type OverviewDigest,
  type RequirementDigest,
  type RoleProfile,
  type RoleProfileCollection,
  type SourceInventoryDigest,
  type SourceInventoryEntry,
  type TagUsageMatrix,
} from '../../fragments/operational-insights/index.js';
import type {
  OrientationReference,
  OverviewArchitecture,
  OverviewOrientation,
  RequirementEntry,
  RoleCount,
} from '../../fragments/operational-insights/supporting.js';
import {
  assembleContextMap,
  collectComponentGraph,
} from '../_shared/architecture-graph.internal.js';
import { filterPatterns } from '../_shared/filter.js';
import { getPatternName, getRelationships } from '../_shared/pattern-helpers.internal.js';
import {
  createBusinessRuleOwnerRouteId,
  createRequirementDetailRouteId,
  createRequirementDocumentationRouting,
  createRequirementPackageDetailRouteId,
  createRequirementPackageIndexRouteId,
  type RequirementDocumentationBucket,
} from '../documentation-composition/requirement-routes.js';
import { SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES } from '../documentation-composition/documentation-type-registry.identity.js';

type RoleDefinition = NonNullable<ProjectionContext['graph']['tagRegistry']['roles']>[number];

interface RequirementSourceEntry {
  readonly pattern: ExtractedPattern;
  readonly packageId: string;
  readonly entry: RequirementEntry;
}

interface BucketedRequirementSourceEntry extends RequirementSourceEntry {
  readonly bucket: RequirementDocumentationBucket;
  readonly packageId: string;
  readonly businessRuleReferences: readonly BusinessRuleReference[];
}

interface RequirementProjectionSourceData {
  readonly entries: readonly BucketedRequirementSourceEntry[];
}

const SOURCE_TYPE_PRIORITY = new Map<string, number>([
  ['TypeScript (annotated)', 0],
  ['Gherkin (features)', 1],
  ['Decisions', 2],
  ['Stubs', 3],
  ['Other', 4],
]);

const OVERVIEW_CLI_HINTS: readonly string[] = [
  '=== READ SURFACE — the graph handle (ADR-014; use instead of grep / Explore agents) ===',
  "pnpm architect:q '<js>'             evaluate a script against the live graph handle (g)",
  '',
  '  ORIENT',
  '    g.api.getStatusCounts()               Status distribution · g.api.getCurrentWork() active work',
  "    g.findByConcept('<phrase>')           Fuzzy concept → ranked patterns",
  '    docs-live/ARCHITECTURE.md             THE architecture map · docs-live/TAXONOMY.md the tag set',
  '  INSPECT A PATTERN',
  "    g.pattern('<Name>')                   Decoded node: status · role · edges · maturity",
  "    g.api.getPattern('<Name>')            Full canonical record (deps + rules + open questions)",
  "    g.invariantsOf('<Name>')              Invariants, labeled live-test vs authored",
  '  NAVIGATE / IMPACT',
  "    g.byFile('<path>') · g.bySymbol('<X>')  File / symbol → architectural context",
  '    g.blastRadius(changedFiles)           Exhaustive impact + at-risk specs',
  '  GATE',
  '    g.api.isValidTransition(from, to)     Deterministic FSM check',
  '    architect_scope_validate (MCP)        PASS / WARN / BLOCKED readiness verdict',
  '',
  'Named demos + the CI gate: pnpm architect:graph <census|blast|fan-in|drift|dangling|...>',
  'Load the `architect-graph-handle` skill for the full surface, shapes, and recipes.',
];

/**
 * The high-signal generated docs a cold-start agent should read first, by
 * documentation-type key. The overview owns this curation (which subset counts
 * as "orientation" is a presentation concern), but the reference CONTENT —
 * title, verb — is derived from the canonical documentation-type registry, and
 * `buildOrientationReferences` fails loud if a key here is absent from the
 * registry, so the two cannot silently drift.
 */
const ORIENTATION_DOC_KEYS: readonly string[] = [
  'decisions',
  'taxonomy',
  'validation-rules',
  'business-rules',
  'api-reference',
];

/**
 * One-line note teaching the disclosure drill-down mechanic on
 * `architect_documentation` (the tier vocabulary the orientation docs accept).
 */
const OVERVIEW_DISCLOSURE_HINT =
  'Each doc accepts --disclosure essential|important|useful|advanced to control depth.';

/** Roadmap patterns to name in the "safe to start" sample before collapsing to a count. */
const OVERVIEW_STARTABLE_SAMPLE_LIMIT = 8;

/**
 * The generated documentation surfaces this graph projects, each fetchable via
 * `architect_documentation` (MCP) or `docs-live/`. Derived from the canonical
 * documentation-type registry so the count and list never drift from the
 * supported set. Rendered terse by default (one line) and itemized at `full`
 * disclosure.
 */
const OVERVIEW_GENERATED_VIEWS: readonly { docType: string; verb: string; summary: string }[] =
  SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES.map((identity) => ({
    docType: identity.key,
    verb: `architect_documentation ${identity.key}`,
    summary: identity.description,
  }));

/**
 * The one-line "explore via the live graph, not grep" pointer rendered under
 * the architecture glimpse — names the handle / MCP cuts that drill from the
 * chart into the PatternGraph.
 */
const OVERVIEW_ARCHITECTURE_POINTER =
  "Explore via the live graph, not grep: `docs-live/ARCHITECTURE.md` · `g.pattern('<Name>')` · `architect_arch_neighborhood` · `architect_dep_tree`";

/**
 * Resolves the curated orientation-doc keys against the canonical
 * documentation-type registry, deriving each reference's verb + title from the
 * single source. Fails loud if a key in `ORIENTATION_DOC_KEYS` is not a
 * supported documentation type, so the curated subset cannot silently drift
 * away from the registry.
 */
function buildOrientationReferences(): OrientationReference[] {
  return ORIENTATION_DOC_KEYS.map((key) => {
    const identity = SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES.find(
      (candidate) => candidate.key === key,
    );
    if (identity === undefined) {
      throw new Error(
        `Orientation doc key "${key}" is not a supported documentation type — ` +
          'update ORIENTATION_DOC_KEYS or the documentation-type registry.',
      );
    }
    return {
      docType: identity.key,
      verb: `architect_documentation ${identity.key}`,
      title: identity.displayTitle,
    };
  });
}

/** Tallies the precomputed `@architect-role` of each pattern into a sorted distribution. */
function buildRoleDistribution(patterns: readonly ExtractedPattern[]): RoleCount[] {
  const counts = new Map<string, number>();
  for (const pattern of patterns) {
    if (pattern.role !== undefined) {
      counts.set(pattern.role, (counts.get(pattern.role) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((left, right) => right.count - left.count || left.role.localeCompare(right.role));
}

/**
 * Builds the high-level architecture glimpse for the overview: a coarse
 * package-level context map (always) plus the richer bounded-context map
 * (identical grouping to `docs-live/ARCHITECTURE.md`). Both derive from ONE
 * component-scope node/edge collection so the most-called verb pays a single
 * graph walk; the renderer decides which chart each disclosure level shows.
 *
 * Best-effort: the glimpse needs every component node's source file to resolve
 * to a configured workspace package. In a fully-configured repo it always does.
 * In a consumer repo (or test fixture) that has not declared `packages`
 * matchers, the shared resolver raises `UNMAPPED_PACKAGE` by design — so we omit
 * the glimpse (returning `undefined`) rather than crash this resilience-critical
 * health projection. The same config gap still fails LOUDLY in `docs:all` /
 * `validate:all`, which share the resolver's hard-error contract, so omitting
 * here hides nothing. Any other error is a real bug and propagates.
 */
function buildOverviewArchitecture(context: ProjectionContext): OverviewArchitecture | undefined {
  const componentGraph = ((): ReturnType<typeof collectComponentGraph> | undefined => {
    try {
      return collectComponentGraph(context);
    } catch (error) {
      // The core `ProjectionError` is raised only for `UNMAPPED_PACKAGE` (its
      // sole code), thrown by the package resolver — the architecture projection
      // uses a *different* `ProjectionError` class, so this `instanceof` is
      // precise. Any other error is a real bug and propagates.
      if (error instanceof ProjectionError) {
        return undefined;
      }
      throw error;
    }
  })();
  if (componentGraph === undefined) {
    return undefined;
  }

  const { nodes, edges } = componentGraph;
  const packageChart = assembleContextMap(nodes, edges, 'package');
  const contextMap = assembleContextMap(nodes, edges, 'component');

  return {
    packageChart: mermaid(packageChart.mermaid),
    packageCount: packageChart.groupCount,
    contextMap: mermaid(contextMap.mermaid),
    contextNodeCount: contextMap.groupCount,
    pointer: OVERVIEW_ARCHITECTURE_POINTER,
  };
}

export function buildOverviewDigest(context: ProjectionContext): OverviewDigest {
  const patterns = filterPatterns(context.graph.patterns, context.projectionFilter);
  const counts = createStatusCounts(patterns);
  const total = counts.total - counts.candidate;
  const architecture = buildOverviewArchitecture(context);

  const blocking = patterns.flatMap((pattern) => {
    if (isPatternComplete(pattern.status)) {
      return [];
    }

    const patternName = getPatternName(pattern);
    const relationships = getRelationships(context, patternName);
    if (relationships === undefined) {
      return [];
    }

    const blockedBy = relationships.dependsOn.filter((dependencyName) => {
      const dependency = findPatternByName(context.graph, dependencyName);
      return dependency !== undefined && !isPatternComplete(dependency.status);
    });

    return blockedBy.length === 0
      ? []
      : [{ pattern: patternName, status: pattern.status, blockedBy }];
  });

  // "Safe to start": roadmap-status patterns that are NOT blocked (complement of
  // BLOCKING). Surfaced with equal prominence to BLOCKING so a cold-start agent
  // sees workable items, not only the wall of work it cannot begin.
  const blockedNames = new Set(blocking.map((entry) => entry.pattern));
  const startableNames = patterns
    .filter((pattern) => pattern.status === 'roadmap' && !blockedNames.has(getPatternName(pattern)))
    .map((pattern) => getPatternName(pattern));

  const orientation: OverviewOrientation = {
    references: buildOrientationReferences(),
    disclosureHint: OVERVIEW_DISCLOSURE_HINT,
    startableCount: startableNames.length,
    startableSample: startableNames.slice(0, OVERVIEW_STARTABLE_SAMPLE_LIMIT),
  };

  return {
    kind: 'OverviewDigest',
    progress: {
      total,
      completed: counts.completed,
      active: counts.active,
      planned: counts.planned,
      candidate: counts.candidate,
      percentage: total > 0 ? Math.round((counts.completed / total) * 100) : 0,
    },
    blocking,
    orientation,
    roleDistribution: buildRoleDistribution(patterns),
    ...(architecture !== undefined ? { architecture } : {}),
    generatedViews: OVERVIEW_GENERATED_VIEWS.map((view) => ({ ...view })),
    cliHints: [...OVERVIEW_CLI_HINTS],
  };
}

export function buildAnnotationCoverage(context: ProjectionContext): AnnotationCoverage {
  const files = collectSourceFileEntries(
    filterPatterns(context.graph.patterns, context.projectionFilter),
  );
  const requiredTags = resolveRequiredCoverageTags(context);
  const gapsByTag = new Map<string, string[]>();
  const unannotatedFiles: string[] = [];

  for (const [file, patterns] of files) {
    const missingTags = requiredTags.filter((tag) => !fileSatisfiesTag(context, patterns, tag));
    if (missingTags.length === 0) {
      continue;
    }

    unannotatedFiles.push(file);
    for (const tag of missingTags) {
      const bucket = gapsByTag.get(tag) ?? [];
      bucket.push(file);
      gapsByTag.set(tag, bucket);
    }
  }

  unannotatedFiles.sort((left, right) => left.localeCompare(right));

  const totalSourceFiles = files.size;
  const annotatedFiles = Math.max(totalSourceFiles - unannotatedFiles.length, 0);

  return {
    kind: 'AnnotationCoverage',
    totalSourceFiles,
    annotatedFiles,
    unannotatedFiles,
    coveragePercentage:
      totalSourceFiles > 0 ? Math.round((annotatedFiles / totalSourceFiles) * 100) : 0,
    gapsByTag: Object.fromEntries(
      [...gapsByTag.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([tag, filePaths]) => [
          tag,
          [...filePaths].sort((left, right) => left.localeCompare(right)),
        ]),
    ),
  };
}

export function buildTagUsageMatrix(context: ProjectionContext): TagUsageMatrix {
  const tagMap = new Map<string, Map<string, number>>();
  const patterns = filterPatterns(context.graph.patterns, context.projectionFilter);

  for (const pattern of patterns) {
    incrementTagUsage(tagMap, 'status', pattern.status);
    if (pattern.role !== undefined) incrementTagUsage(tagMap, 'role', pattern.role);
    if (pattern.boundedContext !== undefined)
      incrementTagUsage(tagMap, 'arch-context', pattern.boundedContext);
    if (pattern.adrLayer !== undefined) incrementTagUsage(tagMap, 'arch-layer', pattern.adrLayer);
    if (pattern.team !== undefined) incrementTagUsage(tagMap, 'team', pattern.team);
    if (pattern.workflow !== undefined) incrementTagUsage(tagMap, 'workflow', pattern.workflow);
  }

  return {
    kind: 'TagUsageMatrix',
    tags: [...tagMap.entries()]
      .map(([tag, values]) => ({
        kind: 'TagUsageEntry' as const,
        tag,
        count: [...values.values()].reduce((total, count) => total + count, 0),
        values: [...values.entries()]
          .map(([value, count]) => ({ value, count }))
          .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value)),
      }))
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag)),
    patternCount: patterns.length,
  };
}

export function buildSourceInventory(context: ProjectionContext): SourceInventoryEntry[] {
  const groupedFiles = new Map<string, Set<string>>();

  for (const pattern of filterPatterns(context.graph.patterns, context.projectionFilter)) {
    const type = categorizeFile(pattern.source.file, pattern);
    const bucket = groupedFiles.get(type) ?? new Set<string>();
    bucket.add(pattern.source.file);
    groupedFiles.set(type, bucket);
  }

  return [...groupedFiles.entries()]
    .map(([type, fileSet]): SourceInventoryEntry => {
      const files = [...fileSet].sort((left, right) => left.localeCompare(right));

      return {
        kind: 'SourceInventoryEntry',
        type,
        count: files.length,
        ...(deriveLocationPattern(files) !== ''
          ? { locationPattern: deriveLocationPattern(files) }
          : {}),
        files,
      };
    })
    .sort(
      (left, right) =>
        right.count - left.count ||
        (SOURCE_TYPE_PRIORITY.get(left.type) ?? Number.MAX_SAFE_INTEGER) -
          (SOURCE_TYPE_PRIORITY.get(right.type) ?? Number.MAX_SAFE_INTEGER) ||
        left.type.localeCompare(right.type),
    );
}

export function buildRoleProfile(
  context: ProjectionContext,
  role: string,
): RoleProfile | undefined {
  const definition = resolveRoleDefinition(context, role);
  if (definition === undefined) {
    return undefined;
  }

  return createRoleProfile(context, definition);
}

export function buildRoleProfiles(context: ProjectionContext): RoleProfile[] {
  return context.graph.tagRegistry.roles.map((definition) =>
    createRoleProfile(context, definition),
  );
}

export function buildRequirementDigest(
  context: ProjectionContext,
  productArea?: string,
): RequirementDigest {
  const sourceEntries = createRequirementSourceEntries(context, productArea);

  return createRequirementDigest(
    productArea ?? 'All Product Areas',
    sourceEntries.map(({ entry }) => entry),
    sourceEntries.flatMap(({ pattern }) =>
      createBusinessRuleReferencesForPattern(context, pattern),
    ),
  );
}

function incrementTagUsage(
  tagMap: Map<string, Map<string, number>>,
  tag: string,
  value: string,
): void {
  const values = tagMap.get(tag) ?? new Map<string, number>();
  values.set(value, (values.get(value) ?? 0) + 1);
  tagMap.set(tag, values);
}

function collectSourceFileEntries(
  patterns: readonly ExtractedPattern[],
): Map<string, readonly ExtractedPattern[]> {
  const grouped = new Map<string, ExtractedPattern[]>();

  for (const pattern of patterns) {
    const bucket = grouped.get(pattern.source.file) ?? [];
    bucket.push(pattern);
    grouped.set(pattern.source.file, bucket);
  }

  return new Map(
    [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([file, filePatterns]) => [file, [...filePatterns]] as const),
  );
}

function resolveRequiredCoverageTags(context: ProjectionContext): string[] {
  const required = new Set<string>();

  if (context.graph.tagRegistry.roles.length > 0) {
    required.add('role');
  }

  for (const tag of context.graph.tagRegistry.metadataTags) {
    if (tag.required === true) {
      required.add(tag.tag);
    }
  }

  return [...required].sort((left, right) => left.localeCompare(right));
}

function fileSatisfiesTag(
  context: ProjectionContext,
  patterns: readonly ExtractedPattern[],
  tag: string,
): boolean {
  return patterns.some((pattern) => patternSatisfiesTag(context, pattern, tag));
}

function patternSatisfiesTag(
  context: ProjectionContext,
  pattern: ExtractedPattern,
  tag: string,
): boolean {
  switch (tag) {
    case 'status':
      return pattern.status.length > 0;
    case 'role':
      return hasNonEmptyString(pattern.role);
    case 'arch-context':
      return hasNonEmptyString(pattern.boundedContext);
    case 'arch-layer':
    case 'layer':
      return hasNonEmptyString(pattern.adrLayer);
    case 'team':
      return hasNonEmptyString(pattern.team);
    case 'product-area':
      return hasNonEmptyString(pattern.productArea);
    case 'workflow':
      return hasNonEmptyString(pattern.workflow);
    case 'target-path':
      return hasNonEmptyString(pattern.targetPath);
    case 'depends-on': {
      const relationships = getRelationships(context, getPatternName(pattern));
      return (relationships?.dependsOn.length ?? pattern.uses?.length ?? 0) > 0;
    }
    case 'enables': {
      const relationships = getRelationships(context, getPatternName(pattern));
      return (relationships?.enables.length ?? 0) > 0;
    }
    case 'uses':
      return (pattern.uses?.length ?? 0) > 0;
    case 'used-by': {
      const relationships = getRelationships(context, getPatternName(pattern));
      return (relationships?.usedBy.length ?? 0) > 0;
    }
    case 'implements':
      return (pattern.implementsPatterns?.length ?? 0) > 0;
    case 'see-also':
      return (pattern.seeAlso?.length ?? 0) > 0;
    case 'api-ref':
      return (pattern.apiRef?.length ?? 0) > 0;
    default:
      return true;
  }
}

function hasNonEmptyString(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function categorizeFile(filePath: string, pattern: ExtractedPattern): string {
  if (filePath.includes('/stubs/')) {
    return 'Stubs';
  }

  if (filePath.includes('/decisions/') || pattern.adr !== undefined) {
    return 'Decisions';
  }

  if (filePath.endsWith('.feature')) {
    return 'Gherkin (features)';
  }

  if (filePath.endsWith('.ts')) {
    return 'TypeScript (annotated)';
  }

  return 'Other';
}

function deriveLocationPattern(files: readonly string[]): string {
  if (files.length === 0) {
    return '';
  }

  const parts = files[0]?.split('/') ?? [];
  let commonDepth = 0;

  for (let index = 0; index < parts.length - 1; index += 1) {
    if (files.some((file) => file.split('/')[index] !== parts[index])) {
      break;
    }
    commonDepth = index + 1;
  }

  const prefix = parts.slice(0, commonDepth).join('/');
  const extension = files[0]?.split('.').pop() ?? '*';
  return prefix !== '' ? `${prefix}/**/*.${extension}` : `**/*.${extension}`;
}

function resolveRoleDefinition(
  context: ProjectionContext,
  role: string,
): RoleDefinition | undefined {
  const normalizedRole = role.toLowerCase();
  return context.graph.tagRegistry.roles.find(
    (definition) =>
      definition.tag === normalizedRole || definition.aliases?.includes(normalizedRole) === true,
  );
}

function createRoleProfile(context: ProjectionContext, definition: RoleDefinition): RoleProfile {
  const patterns = resolvePatternsForRole(context, definition);

  return {
    kind: 'RoleProfile',
    tag: definition.tag,
    domain: definition.domain,
    priority: definition.priority,
    count: patterns.length,
    description: definition.description,
    examples: patterns.map(getPatternName).sort((left, right) => left.localeCompare(right)),
  };
}

function resolvePatternsForRole(
  context: ProjectionContext,
  definition: RoleDefinition,
): ExtractedPattern[] {
  const indexed = context.graph.byRole[definition.tag];
  if (indexed !== undefined) {
    return filterPatterns(indexed, context.projectionFilter);
  }

  return filterPatterns(context.graph.patterns, context.projectionFilter).filter(
    (pattern) =>
      pattern.role !== undefined &&
      (pattern.role.toLowerCase() === definition.tag ||
        definition.aliases?.includes(pattern.role.toLowerCase()) === true),
  );
}

function createStatusCounts(
  patterns: readonly ExtractedPattern[],
): ProjectionContext['graph']['counts'] {
  return {
    completed: patterns.filter((pattern) => isPatternComplete(pattern.status)).length,
    active: patterns.filter((pattern) => isPatternActive(pattern.status)).length,
    planned: patterns.filter((pattern) => isPatternPlanned(pattern.status)).length,
    candidate: patterns.filter((pattern) => pattern.status === 'candidate').length,
    total: patterns.length,
  };
}

function createRequirementSourceEntries(
  context: ProjectionContext,
  productArea?: string,
): RequirementSourceEntry[] {
  return resolveRequirementPatterns(context, productArea).map((pattern) => {
    const packageId = context.packageResolver(pattern.source.file).id;

    return {
      pattern,
      packageId,
      entry: createRequirementEntry(pattern, packageId),
    };
  });
}

function createRequirementProjectionSourceData(
  context: ProjectionContext,
): RequirementProjectionSourceData {
  const sourceEntries = createRequirementSourceEntries(context);

  return {
    entries: sourceEntries.map(({ pattern, packageId, entry }) => ({
      pattern,
      entry,
      bucket: resolveRequirementBucket(pattern),
      packageId,
      businessRuleReferences: createBusinessRuleReferencesForPattern(context, pattern),
    })),
  };
}

function createRequirementDigest(
  productArea: string,
  requirements: readonly RequirementEntry[],
  businessRuleReferences: readonly BusinessRuleReference[] = [],
): RequirementDigest {
  return {
    kind: 'RequirementDigest',
    productArea,
    requirements: [...requirements],
    businessRuleReferences: dedupeBusinessRuleReferences(businessRuleReferences),
  };
}

function dedupeBusinessRuleReferences(
  businessRuleReferences: readonly BusinessRuleReference[],
): BusinessRuleReference[] {
  const deduped = new Map<string, BusinessRuleReference>();

  for (const reference of businessRuleReferences) {
    deduped.set(
      `${reference.ownerRouteId}::${reference.feature}::${reference.ruleName}`,
      reference,
    );
  }

  return [...deduped.values()];
}

function createBusinessRuleReferencesForPattern(
  context: ProjectionContext,
  pattern: ExtractedPattern,
): readonly BusinessRuleReference[] {
  const feature = getPatternName(pattern);
  const ownerRouteId = createBusinessRuleOwnerRouteId(
    context.packageResolver(pattern.source.file).id,
  );

  return (pattern.rules ?? []).map((rule) => ({
    kind: 'BusinessRuleReference',
    feature,
    ruleName: rule.name,
    ownerRouteId,
  }));
}

function resolveRequirementPatterns(
  context: ProjectionContext,
  productArea: string | undefined,
): ExtractedPattern[] {
  const patterns =
    productArea !== undefined
      ? [...(context.graph.byProductArea[productArea] ?? [])]
      : context.graph.patterns.filter((pattern) => hasNonEmptyString(pattern.productArea));

  return filterPatterns(patterns, context.projectionFilter)
    .filter((pattern) => pattern.adr === undefined)
    .sort((left, right) => {
      if (productArea === undefined) {
        const areaCompare = (left.productArea ?? '').localeCompare(right.productArea ?? '');
        if (areaCompare !== 0) {
          return areaCompare;
        }
      }

      const statusCompare = compareNormalizedStatus(left, right);
      if (statusCompare !== 0) {
        return statusCompare;
      }

      return getPatternName(left).localeCompare(getPatternName(right));
    });
}

function compareNormalizedStatus(left: ExtractedPattern, right: ExtractedPattern): number {
  const order: Record<'completed' | 'active' | 'planned' | 'candidate', number> = {
    completed: 0,
    active: 1,
    planned: 2,
    candidate: 3,
  };

  return order[normalizeStatus(left.status)] - order[normalizeStatus(right.status)];
}

function createRequirementEntry(pattern: ExtractedPattern, packageId: string): RequirementEntry {
  return {
    pattern: getPatternName(pattern),
    ownerRouteId: createRequirementOwnerRouteId(pattern, packageId),
    status: pattern.status,
    description: buildRequirementDescription(pattern),
    testFiles: resolveRequirementTestFiles(pattern),
  };
}

function createRequirementOwnerRouteId(pattern: ExtractedPattern, packageId: string): string {
  const feature = getPatternName(pattern);
  const bucket = resolveRequirementBucket(pattern);

  if (bucket === 'specs' && usesFlatSpecsRoute(pattern)) {
    return createRequirementDetailRouteId(bucket, feature);
  }

  return createRequirementPackageDetailRouteId(bucket, packageId, feature);
}

function buildRequirementDescription(pattern: ExtractedPattern): Block[] {
  const blocks: Block[] = [];
  const description = pattern.directive.description.trim();
  const rules = pattern.rules ?? [];

  if (description.length > 0) {
    blocks.push(heading(2, 'Requirement'), paragraph(description));
  }

  if (rules.length > 0) {
    blocks.push(heading(3, 'Business Rules'), list(rules.map((rule) => rule.name)));
  }

  if (blocks.length === 0) {
    blocks.push(paragraph('No requirement description recorded.'));
  }

  return blocks;
}

function resolveRequirementTestFiles(pattern: ExtractedPattern): string[] {
  if (pattern.executableSpecs !== undefined && pattern.executableSpecs.length > 0) {
    return [...pattern.executableSpecs];
  }

  return pattern.behaviorFile !== undefined ? [pattern.behaviorFile] : [];
}

// ===========================================================================
// Public projection API for the operational-insights subdomain.
// Each exported projectX function has its own @architect-pattern annotation
// so the PatternGraph extractor registers them separately; implementation
// delegates to the build* helpers above.
// ===========================================================================

/**
 * @architect
 * @architect-pattern AnnotationCoverageProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses OperationalInsightsProjectionSupport, AnnotationCoverage
 * @architect-bounded-context:projection
 *
 * ## Annotation coverage projection
 *
 * **Value:** Reports how well the codebase satisfies its own required
 * annotation tags — totals, percentage, unannotated files, and per-tag
 * gaps — as an `AnnotationCoverage` fragment that can drive CI gates and
 * dashboards.
 *
 * **Invariant:** Every source file and every required tag is accounted for;
 * unannotated files and per-tag file lists are alphabetically sorted;
 * `coveragePercentage` is a rounded integer and is `0` when no source files
 * exist.
 *
 * **Behavior:**
 * - Groups `graph.patterns` by source file, then checks each file against
 *   the required-tag list via `patternSatisfiesTag` to classify it as
 *   annotated or not.
 * - Derives required tags from `tagRegistry.metadataTags` (`required: true`)
 *   plus an implicit `role` requirement whenever any roles are configured.
 * - Emits `gapsByTag` as a sorted map from each missing tag to its sorted
 *   list of offending files so downstream consumers can display per-tag
 *   remediation lists.
 *
 * ### When to Use
 *
 * - Projects the annotation coverage fragment for CI gates and dashboards.
 */
export function projectAnnotationCoverage(
  context: ProjectionContext,
): ProjectionBundle<AnnotationCoverage> {
  return projectSingle(buildAnnotationCoverage(context));
}

/**
 * @architect
 * @architect-pattern OverviewProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses OperationalInsightsProjectionSupport, OverviewDigest, ArchitectureDiagram
 * @architect-bounded-context:projection
 *
 * ## Overview projection
 *
 * **Value:** Assembles the canonical `architect_overview` payload — delivery
 * progress, blocked patterns, a high-level architecture glimpse, and the
 * CLI-hints block — as an `OverviewDigest` fragment that session-start
 * workflows consume directly.
 *
 * **Invariant:** `progress` always excludes candidates from the total;
 * `blocking` only lists non-complete patterns whose `dependsOn` targets are
 * themselves not complete; the `architecture` glimpse derives from one
 * component-scope graph walk (test-features + decision-records excluded);
 * `cliHints` is a copy of the shared bootstrap list.
 *
 * **Behavior:**
 * - Pulls `graph.counts` for the delivery-total progress block, rounding the
 *   percentage to an integer (or `0` when the total is zero).
 * - Walks each incomplete pattern's relationships via `getRelationships`,
 *   filtering `dependsOn` for dependencies that are not complete, and emits
 *   a `{pattern, status, blockedBy}` entry when any exist.
 * - Builds a coarse package-level context map plus the bounded-context map
 *   (mirroring `docs-live/ARCHITECTURE.md`) via the shared architecture-graph
 *   helpers, so the renderer can show the architecture shape at a glance.
 * - Copies `OVERVIEW_CLI_HINTS` into the fragment so consumers do not need
 *   to re-derive the bootstrap command list.
 *
 * ### When to Use
 *
 * - Projects the overview digest used by session-start workflows and CLI bootstrap hints.
 */
export function projectOverviewDigest(
  context: ProjectionContext,
): ProjectionBundle<OverviewDigest> {
  return projectSingle(buildOverviewDigest(context));
}

/**
 * @architect
 * @architect-pattern RequirementDigestProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses OperationalInsightsProjectionSupport, RequirementDigest
 * @architect-bounded-context:projection
 *
 * ## Requirement digest projection
 *
 * **Value:** Surfaces product requirements as a filterable, structured
 * `RequirementDigest` — one entry per non-ADR pattern with a description
 * block list (Requirement / Use Cases / Business Rules), resolved test-file
 * references, and cross-context `BusinessRuleReference` values — for Studio UI
 * and MCP consumers.
 *
 * **Invariant:** The digest carries a `productArea` label (or
 * `"All Product Areas"`); ADR-sourced patterns are excluded; entries are
 * sorted by product area, then normalized status
 * (completed → active → planned → candidate), then pattern name; test
 * files come from `executableSpecs` when present, otherwise fall back to
 * the pattern's `behaviorFile`.
 *
 * **Behavior:**
 * - Filters patterns by `graph.byProductArea[productArea]` when a product
 *   area is supplied, otherwise includes any pattern with a non-empty
 *   `productArea`.
 * - Builds each description from the pattern's directive description, use
 *   cases, and rule names using the `heading`/`paragraph`/`list` block
 *   helpers, falling back to a single placeholder paragraph when nothing
 *   is recorded.
 * - Emits `businessRuleReferences` that point back to the governance-owned
 *   business-rule documentation route for each referenced rule.
 * - Uses `normalizeStatus` for the status ordering so UI views and
 *   markdown renderers agree on completion ranking.
 *
 * ### When to Use
 *
 * - Projects the general requirement digest used by Studio UI and MCP consumers.
 */
export function projectRequirementDigest(
  context: ProjectionContext,
  productArea?: string,
): ProjectionBundle<RequirementDigest> {
  return projectSingle(buildRequirementDigest(context, productArea));
}

/**
 * @architect
 * @architect-pattern RequirementExecutableDigestProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses OperationalInsightsProjectionSupport, RequirementDigest
 * @architect-bounded-context:projection
 *
 * ## Executable requirement digest projection
 *
 * **Value:** Emits a routed `RequirementDigest` covering only patterns
 * whose value transfer is complete — sourced from `tests/features/`
 * locations across the workspace. Each pattern becomes its own child
 * fragment so the docs:requirements:executable generator can produce
 * the implemented requirement index plus per-pattern detail documents.
 *
 * **Invariant:** Only patterns whose value transfer is complete are included —
 * i.e. patterns outside the design-tier paths whose normalized status is
 * `active` or `completed`. The root carries the
 * `Implemented (Value Transfer Complete)` product-area label so the renderer
 * derives a clean top-level title; each child carries the pattern name as its
 * productArea so per-file titles read naturally.
 *
 * **Behavior:**
 * - Reuses `createRequirementProjectionSourceData` to gather entries,
 *   bucket classification, package ids, and business-rule references once.
 * - Sets logical routing so documentation renderers can link the parent
 *   index to each detail document without leaking file paths into fragments.
 *
 * ### When to Use
 *
 * - Projects the executable requirements digest for implemented patterns.
 */
export function projectRequirementExecutableDigest(
  context: ProjectionContext,
): ProjectionBundle<RequirementDigest> {
  return projectBucketedRequirementDigest(context, 'executable');
}

/**
 * @architect
 * @architect-pattern RequirementSpecsDigestProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses OperationalInsightsProjectionSupport, RequirementDigest
 * @architect-bounded-context:projection
 *
 * ## Spec-tier requirement digest projection
 *
 * **Value:** Emits a routed `RequirementDigest` covering only patterns
 * still living as design-level specs in `architect/specs/` or
 * `architect/slices/` — i.e. value transfer has not yet completed. Drives
 * the spec-tier requirements generator through logical child routes.
 *
 * **Invariant:** Only patterns whose `source.file` matches the specs
 * regex (`^architect/(specs|slices)/`) are included. The root carries the
 * `Specs (Pending Implementation)` product-area label so the renderer
 * derives a clean top-level title; each child carries the pattern name as
 * its productArea so per-file titles read naturally.
 *
 * **Behavior:**
 * - Reuses `createRequirementProjectionSourceData` to gather entries,
 *   bucket classification, package ids, and business-rule references once.
 * - Sets logical routing so documentation renderers can link the parent
 *   index to each detail document without leaking file paths into fragments.
 *
 * ### When to Use
 *
 * - Projects the spec-tier requirements digest for design-level patterns.
 */
export function projectRequirementSpecsDigest(
  context: ProjectionContext,
): ProjectionBundle<RequirementDigest> {
  return projectBucketedRequirementDigest(context, 'specs');
}

/**
 * Bucketing rule (single source of truth for both buckets) — combines
 * source-file location AND `@architect-status` so the buckets reflect the
 * user's mental model: "planned vs implemented", not just file location.
 *
 *   spec-tier  ⇔ source.file lives under `architect/(specs|slices|stubs)/...`
 *                OR `@architect-status` is `candidate` / `roadmap` / `planned`.
 *                Either signal means the pattern is not yet implemented;
 *                value transfer has not occurred or has not been signalled.
 *   executable ⇔ source.file is outside the design-tier paths AND
 *                `@architect-status` is `active` or `completed`. The pattern's
 *                durable artifact (executable Gherkin or annotated TypeScript
 *                source) exists and is being maintained or has shipped.
 *
 * ADRs (`pattern.adr !== undefined`) and pattern-area filtering are applied
 * upstream by `createRequirementSourceEntries`.
 */
const ARCHITECT_DESIGN_TIER_RE = /(^|\/)architect\/(specs|slices|stubs)\//u;

function isPlannedStatus(status: string | undefined): boolean {
  const normalizedStatus = normalizeStatus(status);
  return normalizedStatus === 'planned' || normalizedStatus === 'candidate';
}

function projectBucketedRequirementDigest(
  context: ProjectionContext,
  bucket: RequirementDocumentationBucket,
): ProjectionBundle<RequirementDigest> {
  return createBucketedRequirementDigest(createRequirementProjectionSourceData(context), bucket);
}

function createBucketedRequirementDigest(
  sourceData: RequirementProjectionSourceData,
  bucket: RequirementDocumentationBucket,
): ProjectionBundle<RequirementDigest> {
  const bucketLabel =
    bucket === 'executable' ? REQUIREMENTS_EXECUTABLE_AREA_LABEL : REQUIREMENTS_SPECS_AREA_LABEL;
  const bucketEntries = sourceData.entries.filter((entry) => entry.bucket === bucket);

  // Spec-tier patterns may come from architect design-tier files or from
  // status-based planned/candidate patterns. Design-tier artifacts stay flat by
  // feature name, while status-derived package sources use package-aware detail
  // route ids so duplicate feature names do not collide.
  if (bucket === 'specs') {
    const rootEntries = bucketEntries.map(({ entry }) => entry);
    const root = createRequirementDigest(
      bucketLabel,
      rootEntries,
      bucketEntries.flatMap((entry) => entry.businessRuleReferences),
    );

    const flatChildren: Record<string, RequirementDigest> = {};
    for (const sourceEntry of bucketEntries) {
      flatChildren[
        createRequirementChildRouteIdForBucket(bucket, sourceEntry.packageId, sourceEntry.pattern)
      ] = createRequirementDigest(
        sourceEntry.entry.pattern,
        [sourceEntry.entry],
        sourceEntry.businessRuleReferences,
      );
    }

    if (Object.keys(flatChildren).length === 0) {
      return projectSingle(root);
    }

    return {
      root,
      children: flatChildren,
      routing: createRequirementDocumentationRouting(bucket, Object.keys(flatChildren)),
    };
  }

  // Executable bucket: group by owning package so the documentation routing
  // can expose one package index plus per-pattern detail routes. Child keys
  // are stable logical route IDs; file layout belongs to documentation
  // composition and markdown rendering.
  const grouped = new Map<string, BucketedRequirementSourceEntry[]>();
  for (const sourceEntry of bucketEntries) {
    const list = grouped.get(sourceEntry.packageId) ?? [];
    list.push(sourceEntry);
    grouped.set(sourceEntry.packageId, list);
  }

  const rootEntries = bucketEntries.map(({ entry }) => entry);
  const children: Record<string, RequirementDigest> = {};

  for (const [pkgId, entries] of grouped) {
    const perPackageIndexEntries = entries.map(({ entry }) => entry);
    children[createRequirementPackageIndexRouteId(bucket, pkgId)] = createRequirementDigest(
      pkgId,
      perPackageIndexEntries,
      entries.flatMap((entry) => entry.businessRuleReferences),
    );
    for (const sourceEntry of entries) {
      children[createRequirementPackageDetailRouteId(bucket, pkgId, sourceEntry.entry.pattern)] =
        createRequirementDigest(
          sourceEntry.entry.pattern,
          [sourceEntry.entry],
          sourceEntry.businessRuleReferences,
        );
    }
  }

  const root = createRequirementDigest(
    bucketLabel,
    rootEntries,
    bucketEntries.flatMap((entry) => entry.businessRuleReferences),
  );

  if (Object.keys(children).length === 0) {
    return projectSingle(root);
  }

  return {
    root,
    children,
    routing: createRequirementDocumentationRouting(bucket, Object.keys(children)),
  };
}

function resolveRequirementBucket(pattern: ExtractedPattern): RequirementDocumentationBucket {
  return ARCHITECT_DESIGN_TIER_RE.test(pattern.source.file) || isPlannedStatus(pattern.status)
    ? 'specs'
    : 'executable';
}

function usesFlatSpecsRoute(pattern: ExtractedPattern): boolean {
  return ARCHITECT_DESIGN_TIER_RE.test(pattern.source.file);
}

function createRequirementChildRouteIdForBucket(
  bucket: RequirementDocumentationBucket,
  packageId: string,
  pattern: ExtractedPattern,
): string {
  const feature = getPatternName(pattern);

  if (bucket === 'specs' && usesFlatSpecsRoute(pattern)) {
    return createRequirementDetailRouteId(bucket, feature);
  }

  return createRequirementPackageDetailRouteId(bucket, packageId, feature);
}

/**
 * @architect
 * @architect-pattern RoleProfileProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses OperationalInsightsProjectionSupport, RoleProfile, RoleProfileCollection
 * @architect-bounded-context:projection
 *
 * ## Role profile projection
 *
 * **Value:** Normalises the configured roles from `tagRegistry.roles` into
 * `RoleProfile` fragments (single-role lookup and full catalog) that drive
 * role dashboards and doc generators without re-implementing alias or
 * case handling per consumer.
 *
 * **Invariant:** Role lookup is case-insensitive and honors aliases;
 * unknown roles return `undefined`; each profile carries `tag`, `domain`,
 * `priority`, `count`, `description`, and an alphabetically sorted
 * `examples` list; `RoleProfileCollection.items` preserves registry order.
 *
 * **Behavior:**
 * - Prefers the pre-indexed `graph.byRole[tag]` pattern list when
 *   available and falls back to scanning `graph.patterns` for roles (or
 *   aliases) that match the definition.
 * - Derives examples from `getPatternName` and sorts them locale-aware so
 *   UI lists stay stable across runs.
 * - Returns `undefined` (not an empty profile) when a requested role
 *   cannot be resolved, so callers can surface a clear "no such role"
 *   error.
 *
 * ### When to Use
 *
 * - Projects role profile output for one configured role or the full role catalog.
 */
export function projectRoleProfile(
  context: ProjectionContext,
  role: string,
): ProjectionBundle<RoleProfile> | undefined {
  const profile = buildRoleProfile(context, role);
  return profile === undefined ? undefined : projectSingle(profile);
}

export function projectRoleProfiles(
  context: ProjectionContext,
): ProjectionBundle<RoleProfileCollection> {
  return projectSingle({
    kind: 'RoleProfileCollection',
    items: buildRoleProfiles(context),
  });
}

/**
 * @architect
 * @architect-pattern SourceInventoryProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses OperationalInsightsProjectionSupport, SourceInventoryDigest
 * @architect-bounded-context:projection
 *
 * ## Source inventory projection
 *
 * **Value:** Summarises the graph's annotated source files into a
 * `SourceInventoryDigest` — one entry per file type (TypeScript, Gherkin,
 * Decisions, Stubs, Other) with unique sorted files and a glob-style
 * `locationPattern` — so operational dashboards can report codebase shape.
 *
 * **Invariant:** Every pattern's source file is categorised into exactly
 * one entry via `categorizeFile`; files within an entry are unique and
 * sorted; entries are sorted by count descending, then by fixed type
 * priority, then alphabetically.
 *
 * **Behavior:**
 * - Categorises files by path rules: `/stubs/` wins first, then
 *   `/decisions/` or a pattern with `adr`, then `.feature`, then `.ts`,
 *   with everything else falling into `Other`.
 * - Derives `locationPattern` by finding the longest common path prefix
 *   across grouped files and appending the shared extension, producing a
 *   readable glob for the entry.
 * - Omits `locationPattern` when the derived value would be empty so the
 *   fragment stays minimal for single-file entries.
 *
 * ### When to Use
 *
 * - Projects the tag usage matrix that summarizes metadata-tag counts across the graph.
 */
export function projectSourceInventoryDigest(
  context: ProjectionContext,
): ProjectionBundle<SourceInventoryDigest> {
  return projectSingle({
    kind: 'SourceInventoryDigest',
    items: buildSourceInventory(context),
  });
}

/**
 * @architect
 * @architect-pattern TagUsageProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses OperationalInsightsProjectionSupport, TagUsageMatrix
 * @architect-bounded-context:projection
 *
 * ## Tag usage projection
 *
 * **Value:** Produces a `TagUsageMatrix` that counts every metadata-tag
 * value across the pattern graph — status, role, arch-context, arch-layer,
 * team, workflow — so dashboards can surface dominant conventions
 * and outliers at a glance.
 *
 * **Invariant:** Every pattern contributes exactly one increment per
 * populated tag; tag entries and per-value lists are sorted by count
 * descending with an alphabetical tiebreaker; `patternCount` reflects the
 * full graph population used to compute the matrix.
 *
 * **Behavior:**
 * - Walks `graph.patterns` once, incrementing the `(tag, value)` counter
 *   only when a field is populated (e.g. skipping a pattern with no
 *   `team`).
 * - Sorts tag and value lists with a deterministic
 *   count-then-alphabetical comparator so outputs are reproducible across
 *   runs.
 *
 * ### When to Use
 *
 * - Projects the tag usage matrix that summarizes metadata-tag counts across the graph.
 */
export function projectTagUsage(context: ProjectionContext): ProjectionBundle<TagUsageMatrix> {
  return projectSingle(buildTagUsageMatrix(context));
}
