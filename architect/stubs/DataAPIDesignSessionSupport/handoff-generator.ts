/**
 * @architect
 * @architect-status roadmap
 * @architect-implements DataAPIDesignSessionSupport
 * @architect-uses PatternGraphAPI, PatternGraph, ContextFormatterImpl
 * @architect-used-by PatternGraphCLIImpl
 * @architect-target src/api/handoff-generator.ts
 * @architect-since DS-E
 *
 * ## HandoffGenerator — Session-End State Summary
 *
 * Pure function that assembles a handoff document from PatternGraphAPI
 * and PatternGraph. Captures everything the next session needs to
 * continue work without context loss.
 *
 * ### Algorithm
 *
 * 1. Resolve focal pattern via api.getPattern(name) — error if not found
 * 2. Infer session type from FSM status (PDR-002 DD-3):
 *    active → implement, roadmap → design, completed → review, deferred → design
 *    Explicit sessionType option overrides inference.
 * 3. Build sections in order:
 *    a. Session summary (name, type, date, status)
 *    b. Completed deliverables (status matches complete indicators)
 *    c. In-progress deliverables (not complete, not planned/Pending)
 *    d. Files modified (from modifiedFiles param, omitted if empty)
 *    e. Discovered items (discoveredGaps/Improvements/Learnings)
 *    f. Blockers (incomplete dependencies)
 *    g. Next session priorities (remaining deliverables, ordered)
 * 4. Return HandoffDocument with all populated sections
 *
 * ### Reused Building Blocks
 *
 * - api.getPattern(name) — pattern metadata + discovery tags
 * - api.getPatternDeliverables(name) — deliverable status split
 * - api.getPatternDependencies(name) — blocker identification
 * - isDeliverableComplete() logic from context-formatter.ts
 *   (reuse the COMPLETE_STATUSES set: done, complete, completed, check, x)
 *
 * ### Date Handling (PDR-002 DD-5)
 *
 * Always uses current date: new Date().toISOString().slice(0, 10).
 * No --date flag. Handoff is run at session end.
 *
 * ### Git Integration (PDR-002 DD-2)
 *
 * This module has NO shell dependency. The modifiedFiles parameter is
 * populated by the CLI handler when --git flag is present. The CLI calls:
 *   execSync('git diff --name-only HEAD', { encoding: 'utf-8' })
 * and passes the resulting file list. Without --git, the section is omitted.
 *
 * See: PDR-002 (DD-1 through DD-7), DataAPIDesignSessionSupport spec Rule 2
 *
 * **When to Use:** When ending a work session and capturing state for the next session via the `handoff` CLI subcommand.
 */

import type { SessionType } from '../data-api-context-assembly/context-assembler.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for generating a handoff document.
 */
export interface HandoffOptions {
  /** Pattern name to generate handoff for. */
  readonly patternName: string;
  /**
   * Session type override. If not provided, inferred from FSM status:
   * active → implement, roadmap → design, completed → review, deferred → design.
   */
  readonly sessionType?: SessionType;
  /**
   * Files modified during this session (from git diff).
   * Populated by CLI handler when --git flag is present.
   * Omitted section if undefined or empty.
   */
  readonly modifiedFiles?: readonly string[];
}

/**
 * A section of the handoff document.
 */
export interface HandoffSection {
  /** Section title (e.g., "COMPLETED", "BLOCKERS"). */
  readonly title: string;
  /** Section content lines. */
  readonly items: readonly string[];
}

/**
 * Assembled handoff document.
 */
export interface HandoffDocument {
  /** Pattern this handoff is for. */
  readonly pattern: string;
  /** Session type (inferred or explicit). */
  readonly sessionType: SessionType;
  /** Session date (YYYY-MM-DD). */
  readonly date: string;
  /** Current pattern status. */
  readonly status: string | undefined;
  /** Ordered sections of the handoff. */
  readonly sections: readonly HandoffSection[];
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

/**
 * Generate a handoff document for a pattern's current session state.
 *
 * Assembles completed/in-progress deliverables, discovered items,
 * blockers, and next priorities into a structured document.
 *
 * @param api - PatternGraphAPI for pattern/deliverable/dependency queries
 * @param dataset - PatternGraph (unused currently, reserved for future)
 * @param options - Pattern name, optional session type override, optional git files
 * @returns Assembled handoff document
 */
export function generateHandoff(
  _api: unknown,
  _dataset: unknown,
  _options: HandoffOptions
): HandoffDocument {
  throw new Error('DataAPIDesignSessionSupport not yet implemented - roadmap pattern');
}

// ---------------------------------------------------------------------------
// Text Formatter (co-located per PDR-002 DD-7)
// ---------------------------------------------------------------------------

/**
 * Format a HandoffDocument as structured text with === markers.
 *
 * Output format:
 * ```
 * === HANDOFF: PatternName (implement) ===
 * Date: 2026-02-07 | Status: active
 *
 * === COMPLETED ===
 * [x] Output pipeline (src/api/output-pipeline.ts)
 * [x] Fuzzy search (src/api/fuzzy-match.ts)
 *
 * === IN PROGRESS ===
 * [ ] Field selection (src/api/field-selector.ts)
 *
 * === FILES MODIFIED ===
 * src/api/output-pipeline.ts
 * src/api/fuzzy-match.ts
 * tests/steps/output-shaping.steps.ts
 *
 * === DISCOVERED ===
 * Gaps: Missing-edge-case-for-empty-input
 * Improvements: Cache-parsed-results
 *
 * === BLOCKERS ===
 * None
 *
 * === NEXT SESSION ===
 * 1. Field selection (src/api/field-selector.ts)
 * ```
 *
 * @param doc - Handoff document to format
 * @returns Formatted text string
 */
export function formatHandoff(_doc: HandoffDocument): string {
  throw new Error('DataAPIDesignSessionSupport not yet implemented - roadmap pattern');
}
