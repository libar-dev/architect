/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ErrorGuideCodec
 * @libar-docs-target src/renderable/codecs/validation-rules.ts
 *
 * ## Enhanced ValidationRulesCodecOptions — DD-1 Decision
 *
 * **Decision:** Extend the existing `ValidationRulesCodec` rather than creating
 * a separate `ErrorGuideCodec`. The `ValidationRulesCodec` already owns
 * `RULE_DEFINITIONS` with error codes, causes, and fixes, and generates
 * `error-catalog.md`, `fsm-transitions.md`, and `protection-levels.md`.
 * Creating a parallel codec would duplicate `RULE_DEFINITIONS` access and
 * fragment validation documentation across two codecs.
 *
 * **Rationale (DD-1):** The existing ValidationRulesCodec has the right
 * extension points:
 * - `ValidationRulesCodecOptions` for feature toggles (pattern already
 *   established by `includeFSMDiagram`, `includeCLIUsage`, etc.)
 * - `RULE_DEFINITIONS` constant for error code metadata
 * - `buildDetailFiles()` for progressive disclosure
 * - Section builder functions for composing document parts
 *
 * A new `ErrorGuideCodec` class would need to duplicate access to all of
 * these, and consumers (orchestrator, config) would need to wire two codecs
 * for what is logically one validation reference document.
 *
 * **What changes in validation-rules.ts:**
 * 1. `RuleDefinition` interface gains optional `rationale` field
 * 2. `ValidationRulesCodecOptions` gains `includeErrorGuide` toggle
 * 3. `buildErrorCatalogDetailDocument()` conditionally renders rationale
 * 4. New `buildErrorGuideSections()` builder for the rationale+alternatives layer
 *
 * **What does NOT change:**
 * - No new class or codec file is created
 * - Existing option defaults remain `true` (backward compatible)
 * - `RULE_DEFINITIONS` entries without rationale fall back to `description`
 */

import type { BaseCodecOptions } from '../../../src/renderable/codecs/types/base.js';

// ---------------------------------------------------------------------------
// DD-1: Extended RuleDefinition interface
// ---------------------------------------------------------------------------

/**
 * Extended rule definition for documentation, adding error guide fields.
 *
 * The `rationale` field is populated from convention-extracted content
 * at generation time. If no convention annotation exists for a rule,
 * the codec falls back to the `description` field.
 *
 * The `alternatives` field documents escape hatches and alternative
 * approaches, also sourced from convention annotations.
 */
export interface EnhancedRuleDefinition {
  /** Unique rule ID matching ProcessGuardRule union type */
  readonly id: string;
  /** Default severity level */
  readonly severity: 'error' | 'warning';
  /** Human-readable rule description */
  readonly description: string;
  /** What triggers this error */
  readonly cause: string;
  /** How to fix this error */
  readonly fix: string;
  /**
   * Why this rule exists - sourced from convention annotation rationale.
   * Falls back to `description` if no convention annotation exists.
   */
  readonly rationale?: string;
  /**
   * Alternative approaches / escape hatches for this rule.
   * Sourced from convention annotation alternatives section.
   */
  readonly alternatives?: readonly string[];
}

// ---------------------------------------------------------------------------
// DD-1: Extended ValidationRulesCodecOptions
// ---------------------------------------------------------------------------

/**
 * Enhanced options for ValidationRulesCodec with error guide toggles.
 *
 * New toggles follow the established pattern: boolean flags with `true`
 * defaults, independently toggleable. The `includeErrorGuide` flag
 * controls whether rationale and alternative-approach content from
 * convention annotations is merged into the error catalog detail file.
 *
 * When `includeErrorGuide` is `false`, the codec produces the same
 * output as before this enhancement (backward compatible).
 */
export interface EnhancedValidationRulesCodecOptions extends BaseCodecOptions {
  /** Include FSM state diagram (default: true) */
  readonly includeFSMDiagram?: boolean;
  /** Include CLI usage section (default: true) */
  readonly includeCLIUsage?: boolean;
  /** Include escape hatches section (default: true) */
  readonly includeEscapeHatches?: boolean;
  /** Include protection levels matrix (default: true) */
  readonly includeProtectionMatrix?: boolean;

  /**
   * DD-1: Include error guide rationale and alternatives in the error
   * catalog detail file. When enabled, each error code entry in
   * `validation/error-catalog.md` gains "Why this rule exists" and
   * "Alternative approaches" sections sourced from convention annotations.
   *
   * Default: true
   */
  readonly includeErrorGuide?: boolean;
}

/**
 * Default options with error guide enabled.
 */
export const ENHANCED_DEFAULT_OPTIONS: EnhancedValidationRulesCodecOptions = {
  detailLevel: 'detailed',
  generateDetailFiles: true,
  includeFSMDiagram: true,
  includeCLIUsage: true,
  includeEscapeHatches: true,
  includeProtectionMatrix: true,
  includeErrorGuide: true,
};

// ---------------------------------------------------------------------------
// DD-3: Rationale composition from convention bundles
// ---------------------------------------------------------------------------

/**
 * Compose rationale into RuleDefinition entries from convention-extracted content.
 *
 * This function takes the static `RULE_DEFINITIONS` array and enriches each
 * entry with rationale and alternatives from convention bundles extracted by
 * the convention extractor pipeline.
 *
 * Matching strategy: Convention rule names are matched to RULE_DEFINITIONS
 * entries by normalizing to the `id` field (e.g., convention rule name
 * "completed-protection" matches `RULE_DEFINITIONS[0].id`).
 *
 * Fallback: If no convention content exists for a rule, `rationale` defaults
 * to the `description` field. No empty rationale sections appear in output.
 *
 * @param rules - Static RULE_DEFINITIONS array
 * @param conventionRationale - Map of rule ID to convention-extracted rationale
 * @returns Enhanced rule definitions with rationale populated
 */
export function composeRationaleIntoRules(
  _rules: readonly EnhancedRuleDefinition[],
  _conventionRationale: ReadonlyMap<string, { rationale: string; alternatives?: readonly string[] }>
): EnhancedRuleDefinition[] {
  throw new Error('ErrorGuideCodec not yet implemented - roadmap pattern');
}
