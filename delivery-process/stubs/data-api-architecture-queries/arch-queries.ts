/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements DataAPIArchitectureQueries
 * @libar-docs-uses ProcessStateAPI, MasterDataset, Pattern Scanner
 * @libar-docs-used-by ProcessAPICLIImpl
 *
 * ## ArchQueries — Neighborhood, Comparison, Tags, Sources, and CLI Context
 *
 * Extends the existing `arch` subcommand with deeper analysis and adds
 * new top-level discovery commands (tags, sources). Also defines the
 * SubcommandContext type used by all new CLI handlers (ADR-008).
 *
 * ### Design Decisions
 *
 * - DS-D-2: Neighborhood is fixed 1-hop (spec says "1-hop relationships")
 * - DS-D-3: Source categorization uses path heuristics (no re-scan)
 * - DS-D-4: Tag aggregation is single-pass over patterns
 *
 * ### CLI Integration
 *
 * New cases in handleArch(): neighborhood, compare, coverage
 * New top-level subcommands: tags, sources, unannotated
 * All use SubcommandContext for access to CLI config and registry.
 *
 * Target: src/api/arch-queries.ts (neighborhood, compare, tags, sources)
 * Note: SubcommandContext should be defined in src/cli/types.ts (cross-cutting CLI type).
 *       NeighborEntry should be unified in src/api/types.ts (shared with ContextAssembler).
 * See: DataAPIArchitectureQueries spec, Rules 1-3
 * Since: DS-D
 */

// ---------------------------------------------------------------------------
// SubcommandContext (Cross-cutting, ADR-008)
// ---------------------------------------------------------------------------

/**
 * Broader context for subcommand handlers replacing the narrow
 * routeSubcommand(api, cmd, args) signature.
 *
 * Needed because coverage and unannotated commands require:
 * - CLI config (input globs, baseDir) for file discovery
 * - TagRegistry for opt-in detection and taxonomy queries
 *
 * See ADR-008 for rationale.
 */
export interface SubcommandContext {
  /** ProcessStateAPI instance for pattern queries. */
  readonly api: unknown;
  /** CLI config with input globs, features, baseDir. */
  readonly cliConfig: {
    readonly input: readonly string[];
    readonly features: readonly string[];
    readonly baseDir: string;
  };
  /** TagRegistry for taxonomy queries and opt-in detection. */
  readonly registry: unknown;
}

// ---------------------------------------------------------------------------
// Neighborhood Types (DS-D-2: fixed 1-hop)
// ---------------------------------------------------------------------------

/**
 * Entry for a neighboring pattern with context, role, and file metadata.
 *
 * IMPLEMENTATION NOTE: Unify with ContextAssembler's NeighborEntry into a single
 * shared type in src/api/types.ts. Both modules should import from there.
 * Fields: name, status, archRole, archContext, file.
 */
export interface NeighborEntry {
  readonly name: string;
  readonly archContext: string | undefined;
  readonly archRole: string | undefined;
  readonly status: string | undefined;
  readonly file: string | undefined;
}

/**
 * 1-hop neighborhood result for a focal pattern.
 *
 * Resolves: uses, usedBy, same-context siblings, implements/implementedBy.
 * All from pre-computed MasterDataset views (no additional scanning).
 */
export interface NeighborhoodResult {
  /** Focal pattern name. */
  readonly pattern: string;
  /** Bounded context of the focal pattern. */
  readonly context: string | undefined;
  /** Architecture role. */
  readonly role: string | undefined;
  /** Architecture layer. */
  readonly layer: string | undefined;
  /** Patterns this directly uses (from relationshipIndex.uses). */
  readonly uses: readonly NeighborEntry[];
  /** Patterns that directly use this (from relationshipIndex.usedBy). */
  readonly usedBy: readonly NeighborEntry[];
  /** Patterns in the same bounded context (excluding self). */
  readonly sameContext: readonly NeighborEntry[];
  /** Patterns this implements (realization relationship). */
  readonly implements: readonly string[];
  /** Patterns that implement this (implemented-by relationship). */
  readonly implementedBy: readonly string[];
}

// ---------------------------------------------------------------------------
// Context Comparison Types
// ---------------------------------------------------------------------------

/**
 * Summary of a bounded context for comparison.
 */
export interface ContextSummary {
  readonly name: string;
  readonly patternCount: number;
  readonly patterns: readonly string[];
  /** All external dependencies (uses + dependsOn) aggregated across patterns. */
  readonly allDependencies: readonly string[];
}

/**
 * Integration point between two bounded contexts.
 * A relationship where one endpoint is in ctx1 and the other in ctx2.
 */
export interface IntegrationPoint {
  readonly from: string;
  readonly fromContext: string;
  readonly to: string;
  readonly toContext: string;
  /** Relationship type: 'uses', 'usedBy', 'dependsOn', 'enables'. */
  readonly relationship: string;
}

/**
 * Comparison result for two bounded contexts.
 *
 * Shows shared deps, unique deps, and direct integration points.
 * Dependencies are the union of uses + dependsOn for all patterns in a context.
 */
export interface ContextComparison {
  readonly context1: ContextSummary;
  readonly context2: ContextSummary;
  /** Dependencies shared by both contexts. */
  readonly sharedDependencies: readonly string[];
  /** Dependencies only in context1. */
  readonly uniqueToContext1: readonly string[];
  /** Dependencies only in context2. */
  readonly uniqueToContext2: readonly string[];
  /** Direct relationships crossing the context boundary. */
  readonly integrationPoints: readonly IntegrationPoint[];
}

// ---------------------------------------------------------------------------
// Tag Usage Types (DS-D-4: single-pass aggregation)
// ---------------------------------------------------------------------------

/**
 * Count of a specific tag value.
 */
export interface TagValueCount {
  readonly value: string;
  readonly count: number;
}

/**
 * Usage statistics for a single tag.
 */
export interface TagUsageEntry {
  /** Tag name (e.g., "status", "arch-role", "category"). */
  readonly tag: string;
  /** Number of patterns with this tag set. */
  readonly count: number;
  /** For enum-valued tags: distribution of values. Null for non-enum tags. */
  readonly values: readonly TagValueCount[] | null;
}

/**
 * Aggregate tag usage across all patterns.
 *
 * Output for `tags` subcommand:
 *     status: 69 patterns — completed(36), roadmap(30), active(3)
 *     category: 41 patterns — projection(6), saga(4), handler(5)
 */
export interface TagUsageReport {
  /** Tags sorted by usage count descending. */
  readonly tags: readonly TagUsageEntry[];
  /** Total patterns analyzed. */
  readonly patternCount: number;
}

// ---------------------------------------------------------------------------
// Source Inventory Types (DS-D-3: path heuristics)
// ---------------------------------------------------------------------------

/**
 * A source type with file count and paths.
 */
export interface SourceTypeEntry {
  /** Human-readable type name (e.g., "TypeScript (annotated)"). */
  readonly type: string;
  /** Number of files of this type. */
  readonly count: number;
  /** Representative glob pattern (e.g., "src/**\/*.ts"). */
  readonly locationPattern: string;
  /** Actual file paths. */
  readonly files: readonly string[];
}

/**
 * File inventory grouped by source type.
 *
 * Source types detected by path heuristics:
 * - TypeScript (annotated): .ts AND NOT /stubs/
 * - Gherkin (features): .feature AND NOT /decisions/
 * - Stubs: path contains /stubs/
 * - Decisions: .feature AND (path contains /decisions/ OR pattern has adr field)
 *
 * Output for `sources` subcommand:
 *     TypeScript (annotated): 47 files — src/**\/*.ts
 *     Gherkin (features): 37 files — specs/**\/*.feature
 *     Stubs: 22 files — stubs/**\/*.ts
 *     Decisions: 13 files — decisions/**\/*.feature
 */
export interface SourceInventory {
  /** Source types with file counts and paths. */
  readonly types: readonly SourceTypeEntry[];
  /** Total files across all types. */
  readonly totalFiles: number;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Compute 1-hop neighborhood for a pattern.
 *
 * Algorithm:
 * 1. Look up pattern by name (case-insensitive)
 * 2. Read uses/usedBy from relationshipIndex[name]
 * 3. Read archContext, filter archIndex.byContext[ctx] for siblings (excl self)
 * 4. Read implements/implementedBy from relationshipIndex
 * 5. Resolve NeighborEntry metadata for each neighbor
 *
 * @param name - Pattern name to get neighborhood for
 * @param dataset - MasterDataset with archIndex and relationshipIndex
 * @returns Neighborhood result, or undefined if pattern not found
 */
export function computeNeighborhood(
  _name: string,
  _dataset: unknown
): NeighborhoodResult | undefined {
  throw new Error('DataAPIArchitectureQueries not yet implemented — roadmap pattern');
}

/**
 * Compare two bounded contexts for shared dependencies and integration points.
 *
 * Algorithm:
 * 1. Get patterns for each context from archIndex.byContext
 * 2. For each context, aggregate external deps (uses + dependsOn) via relationshipIndex
 * 3. Compute set intersection (shared) and differences (unique)
 * 4. Find integration points: relationships where one end is in ctx1, other in ctx2
 *
 * @param ctx1 - First context name
 * @param ctx2 - Second context name
 * @param dataset - MasterDataset with archIndex and relationshipIndex
 * @returns Comparison result, or undefined if either context not found
 */
export function compareContexts(
  _ctx1: string,
  _ctx2: string,
  _dataset: unknown
): ContextComparison | undefined {
  throw new Error('DataAPIArchitectureQueries not yet implemented — roadmap pattern');
}

/**
 * Aggregate tag usage across all patterns in a single pass.
 *
 * Algorithm:
 * 1. Iterate dataset.patterns once
 * 2. For each pattern, check which optional fields are set
 * 3. Increment counters per tag
 * 4. For enum fields (status, archRole, archLayer), track value distribution
 * 5. Cross-reference with tagRegistry.metadataTags for tag names
 * 6. Sort by count descending
 *
 * @param dataset - MasterDataset with patterns and tagRegistry
 * @returns Tag usage report sorted by count
 */
export function aggregateTagUsage(
  _dataset: unknown
): TagUsageReport {
  throw new Error('DataAPIArchitectureQueries not yet implemented — roadmap pattern');
}

/**
 * Build source inventory from pattern source metadata.
 *
 * Categorizes files by path heuristics (DS-D-3):
 * - /stubs/ in path → Stubs
 * - /decisions/ in path or adr field set → Decisions
 * - .feature extension → Gherkin
 * - .ts extension → TypeScript
 *
 * No re-scan needed — all data from MasterDataset.patterns[].source.file.
 *
 * @param dataset - MasterDataset with patterns
 * @returns Source inventory grouped by type
 */
export function buildSourceInventory(
  _dataset: unknown
): SourceInventory {
  throw new Error('DataAPIArchitectureQueries not yet implemented — roadmap pattern');
}
