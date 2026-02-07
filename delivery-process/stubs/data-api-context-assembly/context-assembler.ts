/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements DataAPIContextAssembly
 * @libar-docs-uses ProcessStateAPI, MasterDataset, PatternSummarizer
 * @libar-docs-used-by ProcessAPICLIImpl, ContextFormatter
 *
 * ## ContextAssembler — Session-Oriented Context Bundle Builder
 *
 * Pure function composition over MasterDataset. Reads from 5 pre-computed
 * views (patterns, relationshipIndex, archIndex, deliverables, FSM) and
 * assembles them into a ContextBundle tailored to the session type.
 *
 * The assembler does NOT format output. It produces structured data that
 * the ContextFormatter renders as plain text (see ADR-008).
 *
 * ### Assembly Algorithm
 *
 * 1. Resolve focal pattern(s) via getPattern()
 * 2. For each pattern: resolve spec file, stubs, deps, consumers, arch neighbors
 * 3. Merge multi-pattern results with dedup (union-then-tag for shared deps)
 * 4. Populate/omit sections based on SessionType
 *
 * ### Session Type Inclusion Matrix
 *
 * | Section | planning | design | implement |
 * |---------|----------|--------|-----------|
 * | Metadata | yes | yes | yes |
 * | Spec path | no | yes | yes |
 * | Stubs | no | yes | no |
 * | Dependencies | name+status | full | name+status |
 * | Consumers | no | yes | no |
 * | Architecture | no | yes | no |
 * | Deliverables | no | no | yes |
 * | FSM state | no | no | yes |
 * | Test files | no | no | yes |
 *
 * Target: src/api/context-assembler.ts
 * See: DataAPIContextAssembly spec, Rules 1-5
 * Since: DS-C
 */

// ---------------------------------------------------------------------------
// Session Types
// ---------------------------------------------------------------------------

/**
 * Session type controls which sections are populated in the ContextBundle.
 *
 * - planning: minimal (~500B) — metadata + deps only
 * - design: full (~1.5KB) — spec + stubs + deps + arch + consumers
 * - implement: focused (~1KB) — spec + deliverables + FSM + tests
 */
export type SessionType = 'planning' | 'design' | 'implement';

// ---------------------------------------------------------------------------
// Context Options
// ---------------------------------------------------------------------------

/**
 * Options for assembling a context bundle.
 */
export interface ContextOptions {
  /** Focal pattern name(s). Multiple patterns triggers merge with dedup. */
  readonly patterns: readonly string[];
  /** Session type controls what sections are populated. */
  readonly sessionType: SessionType;
  /** Base directory for resolving relative file paths. */
  readonly baseDir: string;
}

/**
 * Options for building a dependency tree.
 */
export interface DepTreeOptions {
  /** Focal pattern name. */
  readonly pattern: string;
  /** Maximum depth to walk (default: 10). */
  readonly maxDepth: number;
  /**
   * Whether to include implementation deps (uses/usedBy) in addition
   * to planning deps (dependsOn/enables). Default: true.
   */
  readonly includeImplementationDeps: boolean;
}

// ---------------------------------------------------------------------------
// Context Bundle Types
// ---------------------------------------------------------------------------

/**
 * Compact metadata for a pattern in the context bundle.
 * Lighter than PatternSummary — includes a text summary instead of source type.
 */
export interface PatternContextMeta {
  readonly name: string;
  readonly status: string | undefined;
  readonly phase: number | undefined;
  readonly category: string;
  readonly file: string;
  /** First sentence of the description, for quick orientation. */
  readonly summary: string;
}

/**
 * Reference to a design stub with its target implementation path.
 */
export interface StubRef {
  /** Path to the stub file (e.g., stubs/data-api-output-shaping/summarize.ts). */
  readonly stubFile: string;
  /** Target implementation path from stub header (e.g., src/api/summarize.ts). */
  readonly targetPath: string;
  /** Implementing pattern name from the stub. */
  readonly name: string;
}

/**
 * Dependency entry with status and kind (planning vs implementation).
 */
export interface DepEntry {
  readonly name: string;
  readonly status: string | undefined;
  readonly file: string;
  /** 'planning' = dependsOn/enables, 'implementation' = uses/usedBy. */
  readonly kind: 'planning' | 'implementation';
}

/**
 * Architecture neighbor entry with role metadata.
 */
export interface NeighborEntry {
  readonly name: string;
  readonly status: string | undefined;
  readonly archRole: string | undefined;
  readonly file: string;
}

/**
 * Deliverable entry with completion status.
 */
export interface DeliverableEntry {
  readonly name: string;
  readonly status: string;
  readonly location: string;
}

/**
 * FSM context for the focal pattern's current state.
 */
export interface FsmContext {
  readonly currentStatus: string;
  readonly validTransitions: readonly string[];
  readonly protectionLevel: 'none' | 'scope' | 'hard';
}

/**
 * Assembled context bundle. Flat type with optional sections.
 *
 * Session tailoring populates/omits sections — no discriminated union needed.
 * The formatter renders whatever sections are present.
 *
 * Design: DS-C-1 (flat type, not discriminated union)
 */
export interface ContextBundle {
  /** Focal pattern name(s). */
  readonly patterns: readonly string[];
  /** Session type that shaped this bundle. */
  readonly sessionType: SessionType;

  // --- Metadata (all session types) ---
  /** Per-pattern metadata summaries. */
  readonly metadata: readonly PatternContextMeta[];

  // --- Spec & Stubs (design, implement) ---
  /** Spec file paths (from pattern.source.file for .feature sources). */
  readonly specFiles: readonly string[];
  /** Stub file paths with target locations (from implementedBy). */
  readonly stubs: readonly StubRef[];

  // --- Dependencies (all session types) ---
  /** Direct dependencies with status. */
  readonly dependencies: readonly DepEntry[];
  /** Shared dependencies across multiple focal patterns (multi-pattern only). */
  readonly sharedDependencies: readonly string[];

  // --- Consumers (design only) ---
  /** Patterns that consume/use the focal pattern(s). */
  readonly consumers: readonly DepEntry[];

  // --- Architecture (design only) ---
  /** Same-context neighbor patterns. */
  readonly architectureNeighbors: readonly NeighborEntry[];

  // --- Deliverables (implement only) ---
  /** Deliverables checklist with status. */
  readonly deliverables: readonly DeliverableEntry[];

  // --- FSM (implement only) ---
  /** Current FSM state and valid transitions. */
  readonly fsm: FsmContext | undefined;

  // --- Test locations (implement only) ---
  /** Paths to test/spec files. */
  readonly testFiles: readonly string[];
}

// ---------------------------------------------------------------------------
// Dependency Tree Types
// ---------------------------------------------------------------------------

/**
 * Node in a recursive dependency tree.
 *
 * Built via BFS with visited-set cycle detection (DS-C-2).
 * maxDepth limits walk depth. Truncated branches are marked.
 */
export interface DepTreeNode {
  readonly name: string;
  readonly status: string | undefined;
  readonly phase: number | undefined;
  /** Whether this is the focal pattern (marked with <- YOU ARE HERE). */
  readonly isFocal: boolean;
  /** Whether this branch was truncated due to depth limit. */
  readonly truncated: boolean;
  readonly children: readonly DepTreeNode[];
}

// ---------------------------------------------------------------------------
// File Reading List Types
// ---------------------------------------------------------------------------

/**
 * File paths organized by relevance for a focal pattern.
 *
 * More token-efficient than context — just paths that Claude Code can read.
 */
export interface FileReadingList {
  readonly pattern: string;
  /** Spec file + stub files. */
  readonly primary: readonly string[];
  /** Implementation files of completed dependencies. */
  readonly completedDeps: readonly string[];
  /** Spec files of incomplete dependencies. */
  readonly roadmapDeps: readonly string[];
  /** Same-context pattern files. */
  readonly architectureNeighbors: readonly string[];
}

// ---------------------------------------------------------------------------
// Overview Types
// ---------------------------------------------------------------------------

/**
 * Progress counts and percentage.
 */
export interface ProgressSummary {
  readonly total: number;
  readonly completed: number;
  readonly active: number;
  readonly planned: number;
  readonly percentage: number;
}

/**
 * Active phase summary with pattern counts.
 */
export interface ActivePhaseSummary {
  readonly phase: number;
  readonly name: string | undefined;
  readonly patternCount: number;
  readonly activeCount: number;
}

/**
 * A pattern blocked by incomplete dependencies.
 */
export interface BlockingEntry {
  /** Pattern that is blocked. */
  readonly pattern: string;
  readonly status: string | undefined;
  /** Dependency names that are not yet completed. */
  readonly blockedBy: readonly string[];
}

/**
 * Executive project overview.
 *
 * Answers "where are we?" in one command. Includes progress,
 * active phases, and blocking relationships.
 */
export interface OverviewSummary {
  readonly progress: ProgressSummary;
  readonly activePhases: readonly ActivePhaseSummary[];
  readonly blocking: readonly BlockingEntry[];
}

// ---------------------------------------------------------------------------
// Assembler Functions
// ---------------------------------------------------------------------------

/**
 * Assemble a curated context bundle for one or more focal patterns.
 *
 * Pure function: takes MasterDataset + options, returns ContextBundle.
 *
 * Algorithm:
 * 1. Resolve each focal pattern via dataset.patterns lookup
 * 2. For each pattern: resolve spec, stubs (implementedBy), deps, consumers, arch
 * 3. For multi-pattern: union deps, tag shared (appearing in 2+ sets)
 * 4. Populate/omit sections based on sessionType
 *
 * @param dataset - MasterDataset with patterns, relationshipIndex, archIndex
 * @param options - Context assembly options
 * @returns Assembled context bundle
 */
export function assembleContext(
  _dataset: unknown,
  _options: ContextOptions
): ContextBundle {
  throw new Error('DataAPIContextAssembly not yet implemented — roadmap pattern');
}

/**
 * Build a recursive dependency tree for a focal pattern.
 *
 * Uses iterative BFS with visited-set cycle detection (DS-C-2).
 * Walks dependsOn/enables (planning) and optionally uses/usedBy (implementation).
 *
 * @param dataset - MasterDataset with patterns and relationshipIndex
 * @param options - Dep-tree options (pattern, maxDepth, includeImplementationDeps)
 * @returns Root node of the dependency tree
 */
export function buildDepTree(
  _dataset: unknown,
  _options: DepTreeOptions
): DepTreeNode {
  throw new Error('DataAPIContextAssembly not yet implemented — roadmap pattern');
}

/**
 * Generate a file reading list organized by relevance.
 *
 * Returns file paths grouped by: primary (spec + stubs), completed deps,
 * roadmap deps, architecture neighbors.
 *
 * @param dataset - MasterDataset with patterns and relationshipIndex
 * @param pattern - Focal pattern name
 * @param includeRelated - Whether to include deps and neighbors (default: false)
 * @returns File reading list with paths organized by relevance
 */
export function buildFileReadingList(
  _dataset: unknown,
  _pattern: string,
  _includeRelated: boolean
): FileReadingList {
  throw new Error('DataAPIContextAssembly not yet implemented — roadmap pattern');
}

/**
 * Compute executive project overview summary.
 *
 * Aggregates: progress counts, active phases, blocking relationships.
 * A pattern is "blocked" if any of its dependsOn targets has status !== completed.
 *
 * @param dataset - MasterDataset with patterns, byStatus, byPhase, relationshipIndex
 * @returns Project overview summary
 */
export function buildOverview(
  _dataset: unknown
): OverviewSummary {
  throw new Error('DataAPIContextAssembly not yet implemented — roadmap pattern');
}
