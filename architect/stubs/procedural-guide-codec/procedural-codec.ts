/**
 * @architect
 * @architect-status roadmap
 * @architect-implements ProceduralGuideCodec
 * @architect-target src/renderable/codecs/procedural-guide.ts
 *
 * ## ProceduralGuideCodec -- Factory Stub for Dual-Source Procedural Guides
 *
 * **Design Decision DD-1 (One codec, two configs):**
 * This codec IS `createReferenceCodec()`. The ProceduralGuideCodec does not
 * introduce a new codec class. Instead, it adds two new `ReferenceDocConfig`
 * entries to the `referenceDocConfigs` array in `architect.config.ts`.
 * Each entry configures `createReferenceCodec()` with document-specific
 * preamble content and behavior extraction settings.
 *
 * **Why no new codec class is needed:**
 * The existing `createReferenceCodec()` already supports all required
 * composition:
 * - `preamble: SectionBlock[]` -- carries ~95% editorial content
 * - `includeTags: string[]` -- pulls Rule: blocks from SessionGuidesModuleSource
 * - `behaviorCategories: string[]` -- category-based behavior extraction
 * - `conventionTags: string[]` -- convention content extraction
 * - Detail level rendering (summary vs detailed) -- already built
 *
 * The ProceduralGuideCodec "pattern" is therefore a configuration pattern,
 * not a code pattern. The implementation deliverables are:
 * 1. `loadPreambleFromMarkdown()` utility in `src/renderable/load-preamble.ts`
 * 2. Two markdown source files in `docs-sources/`
 * 3. Two `ReferenceDocConfig` entries in `architect.config.ts`
 * 4. `@architect-include:session-workflows` tag on SessionGuidesModuleSource
 *
 * **Design Decision DD-2 (SessionGuidesModuleSource as behavior source):**
 * The SessionGuidesModuleSource spec's Rule: blocks (Rules 3-8) are extracted
 * via the existing `buildBehaviorSectionsFromPatterns()` function. This
 * function already:
 * - Extracts Invariant/Rationale via `parseBusinessRuleAnnotations()`
 * - Extracts tables via `extractTablesFromDescription()`
 * - Renders at two detail levels (summary: compact table, detailed: full rules)
 * - Wraps 3+ rules in collapsible blocks for progressive disclosure
 *
 * The Rule: block tables in SessionGuidesModuleSource (session type contracts,
 * Do/Do-NOT tables, FSM error reference, escape hatches) are ALREADY
 * machine-extractable. The existing behavior extraction pipeline handles them
 * without modification.
 *
 * **What the detailed level adds over the existing AI summary:**
 * - Full Invariant + Rationale text (summary truncates to 120 chars)
 * - Tables rendered as full markdown tables (summary omits tables)
 * - Code examples from DocStrings (summary omits code)
 * - Scenario names as "Verified by" lists (summary omits)
 *
 * The preamble content adds what Rule: blocks cannot express:
 * - Step-by-step numbered checklists with checkbox syntax
 * - Mermaid flowchart decision trees
 * - CLI command examples with full bash code blocks
 * - Cross-references to other docs
 *
 * **Design Decision DD-5 (Annotation guide: hybrid approach):**
 * The annotation guide uses a hybrid approach:
 * - ~95% preamble: getting-started walkthrough, shape extraction mode
 *   explanations, Zod gotcha, file-type annotation examples, verification
 *   CLI recipes, troubleshooting table
 * - ~5% auto-generated: Tag reference summary table derived from taxonomy
 *   registry data via `createReferenceCodec()`'s existing convention or
 *   shape extraction. Tag groups, format types, and example values are
 *   already in MasterDataset.
 *
 * **Rationale (DD-5):** The annotation guide content is highly stable --
 * the getting-started walkthrough, shape extraction modes, and Zod gotcha
 * have not changed since initial authoring. Making them preamble avoids
 * the annotation overhead for content that changes at editorial cadence.
 * The tag reference table is the one section that DOES change when tags
 * are added -- auto-generating it eliminates a maintenance burden.
 *
 * **Design Decision DD-6 (Transition strategy):**
 * The generated files output to `docs-live/reference/` (not `docs/`).
 * The manual files (`docs/SESSION-GUIDES.md`, `docs/ANNOTATION-GUIDE.md`)
 * are retained alongside the generated files during the transition period.
 * The quality comparison deliverable produces an audit document recording
 * section-by-section parity. Only after the audit confirms full parity
 * are the manual files replaced with redirects to the generated output.
 *
 * **Rationale (DD-6):** The SessionGuidesModuleSource invariant (Rule 1)
 * explicitly states SESSION-GUIDES.md "is not deleted, shortened, or
 * replaced with a redirect." The generated file lives in a DIFFERENT
 * directory (`docs-live/reference/`) and has a DIFFERENT name
 * (`SESSION-WORKFLOW-GUIDE.md`). This means:
 * - No violation of the Rule 1 invariant during transition
 * - Both files can be compared side-by-side for quality audit
 * - The manual file continues serving developers until parity is confirmed
 * - After parity, Rule 1 can be explicitly superseded with an unlock-reason
 *
 * **Design Decision DD-7 (Markdown source files for editorial content):**
 * Preamble content is authored as plain markdown files in `docs-sources/`
 * and parsed into `SectionBlock[]` at config import time by
 * `loadPreambleFromMarkdown()`. This replaces inline `SectionBlock[]`
 * TypeScript object literals in the config file, reducing it from 853
 * to ~310 lines (63% reduction). Markdown is the natural authoring format
 * for checklists, code blocks, tables, and Mermaid diagrams.
 *
 * **Rationale (DD-7):** The previous approach required ~541 lines of nested
 * TypeScript object literals (`{ type: 'heading', level: 2, text: '...' }`)
 * to express content that is more naturally written as markdown. The codec
 * still receives `SectionBlock[]` in memory -- it never knows whether
 * the preamble came from inline TypeScript or a parsed markdown file.
 * Codec purity is preserved.
 *
 * **Design Decision DD-8 (loadPreambleFromMarkdown() shared utility):**
 * A `loadPreambleFromMarkdown()` function in `src/renderable/load-preamble.ts`
 * uses `readFileSync` (synchronous, runs at module import time) and a
 * line-by-line state machine to parse markdown into `SectionBlock[]`.
 * Available to all preamble consumers (ErrorGuideCodec, CliRecipeCodec).
 *
 * ### Implementation Plan
 *
 * Step 1: Create `loadPreambleFromMarkdown()` in `src/renderable/load-preamble.ts`
 * Step 2: Create `docs-sources/session-workflow-guide.md` (content from current inline preamble)
 * Step 3: Create `docs-sources/annotation-guide.md` (content from current inline preamble)
 * Step 4: Update `architect.config.ts` to use `loadPreambleFromMarkdown()` calls
 * Step 5: Verify generated output matches current output (regression test)
 * Step 6: Quality audit document comparing generated vs manual
 */

// ---------------------------------------------------------------------------
// Example ReferenceDocConfig entries for architect.config.ts
// ---------------------------------------------------------------------------

import type { SectionBlock } from '../../../src/renderable/schema.js';

/**
 * Placeholder interface showing the shape of a ReferenceDocConfig entry.
 * The actual type is imported from `src/renderable/codecs/reference.ts`.
 * This stub exists to document the design -- the real implementation adds
 * entries directly to the `referenceDocConfigs` array.
 */
interface ReferenceDocConfigEntry {
  readonly title: string;
  readonly conventionTags: readonly string[];
  readonly shapeSelectors: readonly string[];
  readonly behaviorCategories: readonly string[];
  readonly includeTags?: readonly string[];
  readonly preamble?: readonly SectionBlock[];
  readonly claudeMdSection: string;
  readonly docsFilename: string;
  readonly claudeMdFilename: string;
  readonly excludeSourcePaths?: readonly string[];
}

/**
 * ReferenceDocConfig entry for the Session Workflow Guide.
 *
 * DD-7: Preamble loaded from markdown source file, not inline SectionBlock[].
 *
 * ```typescript
 * // In architect.config.ts:
 * import { loadPreambleFromMarkdown } from './src/renderable/load-preamble.js';
 *
 * const sessionWorkflowPreamble = loadPreambleFromMarkdown(
 *   'docs-sources/session-workflow-guide.md'
 * );
 *
 * // In referenceDocConfigs array:
 * {
 *   title: 'Session Workflow Guide',
 *   conventionTags: [],
 *   shapeSelectors: [],
 *   behaviorCategories: [],
 *   includeTags: ['session-workflows'],
 *   claudeMdSection: 'workflow',
 *   docsFilename: 'SESSION-WORKFLOW-GUIDE.md',
 *   claudeMdFilename: 'session-workflow-guide.md',
 *   preamble: [...sessionWorkflowPreamble],
 * }
 * ```
 *
 * Output: docs-live/reference/SESSION-WORKFLOW-GUIDE.md
 */
export function createSessionWorkflowGuideConfig(
  _preamble: readonly SectionBlock[]
): ReferenceDocConfigEntry {
  throw new Error('ProceduralGuideCodec not yet implemented - roadmap pattern');
}

/**
 * ReferenceDocConfig entry for the Annotation Guide.
 *
 * DD-7: Preamble loaded from markdown source file.
 *
 * ```typescript
 * const annotationPreamble = loadPreambleFromMarkdown(
 *   'docs-sources/annotation-guide.md'
 * );
 *
 * // In referenceDocConfigs array:
 * {
 *   title: 'Annotation Reference Guide',
 *   conventionTags: ['annotation-system'],
 *   preamble: [...annotationPreamble],
 *   // ...
 * }
 * ```
 *
 * Output: docs-live/reference/ANNOTATION-REFERENCE.md
 */
export function createAnnotationGuideConfig(
  _preamble: readonly SectionBlock[]
): ReferenceDocConfigEntry {
  throw new Error('ProceduralGuideCodec not yet implemented - roadmap pattern');
}
