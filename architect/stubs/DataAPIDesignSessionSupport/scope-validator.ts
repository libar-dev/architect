/**
 * @architect
 * @architect-status roadmap
 * @architect-implements DataAPIDesignSessionSupport
 * @architect-uses PatternGraphAPI, PatternGraph, StubResolver
 * @architect-used-by ProcessAPICLIImpl
 * @architect-target src/api/scope-validator.ts
 * @architect-since DS-E
 *
 * ## ScopeValidator — Pre-flight Session Readiness Checker
 *
 * Pure function composition over PatternGraphAPI and PatternGraph.
 * Runs a checklist of prerequisite validations before starting a
 * design or implementation session.
 *
 * ### Algorithm
 *
 * 1. Resolve the focal pattern via api.getPattern(name) — error if not found
 * 2. Select check functions based on scopeType:
 *    - implement: dependencies, deliverables, FSM, PDR refs, executable specs
 *    - design: stubs-from-deps
 * 3. Execute each check function (pure, no I/O) → ValidationCheck
 * 4. Aggregate: count BLOCKEDs and WARNs → determine verdict
 * 5. Return ScopeValidationResult
 *
 * ### Check Composition
 *
 * Each check is an independent pure function returning ValidationCheck.
 * This enables:
 * - Individual unit testing per check
 * - Easy addition of new checks without modifying existing ones
 * - Selective check execution per scope type
 *
 * ### Reused Building Blocks
 *
 * - api.getPatternDependencies(name) — dependency status check
 * - api.getPatternDeliverables(name) — deliverable existence check
 * - api.isValidTransition(from, to) / api.checkTransition(from, to) — FSM check
 * - findStubPatterns(dataset) + extractDecisionItems() from stub-resolver.ts — PDR check
 * - resolveStubs(stubs, baseDir) from stub-resolver.ts — stub existence check
 *
 * ### Severity Model (PDR-002 DD-4)
 *
 * | Severity | Meaning | Blocks Session |
 * |----------|---------|----------------|
 * | PASS | Check passed | No |
 * | BLOCKED | Hard prerequisite missing | Yes |
 * | WARN | Recommendation not met | No (unless --strict) |
 *
 * See: PDR-002 (DD-1 through DD-7), DataAPIDesignSessionSupport spec Rule 1
 *
 * **When to Use:** When running pre-flight checks before a session via the `scope-validate` CLI subcommand.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Severity level for a single validation check.
 * PASS = prerequisite met, BLOCKED = hard blocker, WARN = recommendation.
 */
export type CheckSeverity = 'PASS' | 'BLOCKED' | 'WARN';

/**
 * Identifier for each validation check. Maps to a specific prerequisite.
 */
export type ScopeCheckId =
  | 'dependencies-completed'
  | 'stubs-from-deps-exist'
  | 'deliverables-defined'
  | 'fsm-allows-transition'
  | 'design-decisions-recorded'
  | 'executable-specs-set';

/**
 * Result of a single validation check.
 */
export interface ValidationCheck {
  /** Which check this result is for. */
  readonly id: ScopeCheckId;
  /** Human-readable label (e.g., "Dependencies completed"). */
  readonly label: string;
  /** PASS, BLOCKED, or WARN. */
  readonly severity: CheckSeverity;
  /** Explanation of the result (e.g., "3/3 dependencies completed"). */
  readonly detail: string;
  /** Names of blocking items, if any (e.g., dependency names). */
  readonly blockerNames?: readonly string[];
}

/**
 * Session type to validate for.
 * - implement: checks deps, deliverables, FSM, PDR refs, executable specs
 * - design: checks stubs-from-deps
 */
export type ScopeType = 'implement' | 'design';

/**
 * Options for scope validation.
 */
export interface ScopeValidationOptions {
  /** Pattern name to validate. */
  readonly patternName: string;
  /** Session type to validate for. */
  readonly scopeType: ScopeType;
  /** Base directory for resolving stub file paths. */
  readonly baseDir: string;
  /** When true, WARN checks are promoted to BLOCKED (DD-4, matches lint-process --strict). */
  readonly strict?: boolean;
}

/**
 * Aggregated result of all validation checks.
 */
export interface ScopeValidationResult {
  /** Pattern that was validated. */
  readonly pattern: string;
  /** Session type that was checked. */
  readonly scopeType: ScopeType;
  /** All check results in order. */
  readonly checks: readonly ValidationCheck[];
  /** Overall verdict: ready (no blockers), blocked, or warnings (pass with caveats). */
  readonly verdict: 'ready' | 'blocked' | 'warnings';
  /** Count of BLOCKED checks. */
  readonly blockerCount: number;
  /** Count of WARN checks. */
  readonly warnCount: number;
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

/**
 * Validate scope readiness for a pattern before starting a session.
 *
 * Selects and runs checks based on scopeType, then aggregates results
 * into a verdict.
 *
 * @param api - PatternGraphAPI for pattern/FSM queries
 * @param dataset - PatternGraph for stub resolution
 * @param options - Pattern name, scope type, base directory
 * @returns Aggregated validation result with verdict
 */
export function validateScope(
  _api: unknown,
  _dataset: unknown,
  _options: ScopeValidationOptions
): ScopeValidationResult {
  throw new Error('DataAPIDesignSessionSupport not yet implemented — roadmap pattern');
}

// ---------------------------------------------------------------------------
// Text Formatter (co-located per PDR-002 DD-7)
// ---------------------------------------------------------------------------

/**
 * Format a ScopeValidationResult as structured text with === markers.
 *
 * Output format:
 * ```
 * === SCOPE VALIDATION: PatternName (implement) ===
 *
 * === CHECKLIST ===
 * [PASS] Dependencies completed: Dep1, Dep2
 * [BLOCKED] FSM allows transition: completed cannot transition to active
 * [WARN] Design decisions: no PDR references found
 *
 * === VERDICT ===
 * BLOCKED: 1 blocker(s) prevent implementation session
 * - FSM: completed cannot transition to active
 * ```
 *
 * @param result - Validation result to format
 * @returns Formatted text string
 */
export function formatScopeValidation(_result: ScopeValidationResult): string {
  throw new Error('DataAPIDesignSessionSupport not yet implemented — roadmap pattern');
}

// ---------------------------------------------------------------------------
// Composable Check Functions — Implementation Session
// ---------------------------------------------------------------------------

/**
 * Check that all dependsOn patterns have status "completed".
 *
 * Uses: api.getPatternDependencies(name).dependsOn
 * For each dependency: api.getPattern(dep).status === 'completed'
 *
 * PASS: All deps completed (or no deps).
 * BLOCKED: Any dep not completed. Lists blocker names + their statuses.
 */
export function checkDependenciesCompleted(
  _api: unknown,
  _patternName: string
): ValidationCheck {
  throw new Error('DataAPIDesignSessionSupport not yet implemented — roadmap pattern');
}

/**
 * Check that the pattern has deliverables defined in its Background table.
 *
 * Uses: api.getPatternDeliverables(name)
 *
 * PASS: At least one deliverable exists.
 * BLOCKED: No deliverables found (empty Background table or missing).
 */
export function checkDeliverablesDefined(
  _api: unknown,
  _patternName: string
): ValidationCheck {
  throw new Error('DataAPIDesignSessionSupport not yet implemented — roadmap pattern');
}

/**
 * Check that the FSM allows transitioning to "active" from current status.
 *
 * Uses: api.isValidTransition(currentStatus, 'active')
 *       api.checkTransition(currentStatus, 'active') for error details
 *
 * PASS: Transition is valid (e.g., roadmap → active).
 * BLOCKED: Transition is invalid. Shows current status, valid alternatives.
 */
export function checkFsmAllowsTransition(
  _api: unknown,
  _patternName: string
): ValidationCheck {
  throw new Error('DataAPIDesignSessionSupport not yet implemented — roadmap pattern');
}

/**
 * Check whether design decisions (PDR references) exist in stubs.
 *
 * Uses: findStubPatterns(dataset) to get stubs for this pattern
 *       extractDecisionItems(description) to find PDR references
 *
 * PASS: At least one PDR reference found.
 * WARN: No PDR references found (recommended but not required).
 */
export function checkDesignDecisionsRecorded(
  _dataset: unknown,
  _patternName: string
): ValidationCheck {
  throw new Error('DataAPIDesignSessionSupport not yet implemented — roadmap pattern');
}

/**
 * Check whether the pattern has an @executable-specs tag pointing to test location.
 *
 * Uses: pattern.behaviorFile or executableSpecs metadata field
 *
 * PASS: Executable specs location is set.
 * WARN: No executable specs location (recommended but not required).
 */
export function checkExecutableSpecsSet(
  _api: unknown,
  _patternName: string
): ValidationCheck {
  throw new Error('DataAPIDesignSessionSupport not yet implemented — roadmap pattern');
}

// ---------------------------------------------------------------------------
// Composable Check Functions — Design Session
// ---------------------------------------------------------------------------

/**
 * Check that dependency patterns have stubs from prior design sessions.
 *
 * Uses: api.getPatternDependencies(name).dependsOn
 *       For each dep: check implementedBy entries (stubs exist)
 *       resolveStubs(stubs, baseDir) to verify files exist on disk
 *
 * PASS: All dependencies have stubs.
 * WARN: Some dependencies lack stubs (design sessions may not have run yet).
 */
export function checkStubsFromDepsExist(
  _dataset: unknown,
  _patternName: string,
  _baseDir: string
): ValidationCheck {
  throw new Error('DataAPIDesignSessionSupport not yet implemented — roadmap pattern');
}
