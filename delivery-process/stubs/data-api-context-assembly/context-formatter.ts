/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements DataAPIContextAssembly
 * @libar-docs-uses ContextAssembler
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-target src/api/context-formatter.ts
 * @libar-docs-since DS-C
 *
 * ## ContextFormatter — Plain Text Renderer for Context Bundles
 *
 * First plain-text formatter in the codebase. All other rendering goes
 * through the Codec/RenderableDocument/UniversalRenderer markdown pipeline.
 * Context bundles are rendered as compact structured text with === section
 * markers for easy AI parsing (see ADR-008).
 *
 * ### Output Format (DS-C-4)
 *
 * Section markers: `=== SECTION ===` (visually distinct, regex-parseable,
 * no collision with markdown # or YAML ---)
 *
 * Status in brackets: `[completed]`, `[roadmap]`, `[active]`
 * Deliverable checkboxes: `[x]` (done), `[ ]` (pending)
 * Dep-tree arrows: `->` (compact, no Unicode box-drawing)
 * Focal marker: `<- YOU ARE HERE`
 *
 * ### Reusable Helpers
 *
 * May reuse from src/renderable/codecs/helpers.ts:
 * - extractFirstSentence() for metadata summary
 * - truncateText() for long descriptions
 *
 * See: DataAPIContextAssembly spec, ADR-008 (text output path)
 *
 * **When to Use:** When rendering a ContextBundle as plain text for CLI output — use this instead of the markdown codec pipeline.
 */

import type {
  ContextBundle,
  DepTreeNode,
  FileReadingList,
  OverviewSummary,
} from './context-assembler.js';

// ---------------------------------------------------------------------------
// Bundle Formatter
// ---------------------------------------------------------------------------

/**
 * Format a ContextBundle as compact plain text for AI consumption.
 *
 * Renders whatever sections are populated. Session tailoring is already
 * done by the assembler — the formatter just renders what's there.
 *
 * Output format example (design session):
 *
 *     === PATTERN: AgentLLMIntegration ===
 *     Status: roadmap | Phase: 22b | Category: agent
 *     Spec: delivery-process/specs/agent-llm-integration.feature
 *
 *     === STUBS ===
 *     stubs/agent-llm/adapter.ts -> src/agent/adapter.ts
 *
 *     === DEPENDENCIES ===
 *     [completed] AgentBCIsolation (22a) delivery-process/specs/...
 *     [roadmap]   AgentAsBoundedContext (22)
 *
 *     === CONSUMERS ===
 *     AgentCommandInfra (22c, roadmap)
 *
 *     === ARCHITECTURE (context: agent) ===
 *     AgentBCIsolation (completed, bounded-context)
 *
 * @param bundle - Assembled context bundle from assembleContext()
 * @returns Formatted plain text string
 */
export function formatContextBundle(_bundle: ContextBundle): string {
  throw new Error('DataAPIContextAssembly not yet implemented - roadmap pattern');
}

// ---------------------------------------------------------------------------
// Dep-Tree Formatter
// ---------------------------------------------------------------------------

/**
 * Format a dependency tree as indented text with status markers.
 *
 * Output format:
 *
 *     AgentAsBoundedContext (22, completed)
 *       -> AgentBCIsolation (22a, completed)
 *            -> AgentLLMIntegration (22b, roadmap)
 *                 -> [*] AgentCommandInfra (22c, roadmap) <- YOU ARE HERE
 *                      -> AgentChurnRisk (22d, roadmap)
 *
 * Truncated branches show: `-> ... (depth limit reached)`
 *
 * @param tree - Root node from buildDepTree()
 * @returns Formatted tree as indented text
 */
export function formatDepTree(_tree: DepTreeNode): string {
  throw new Error('DataAPIContextAssembly not yet implemented - roadmap pattern');
}

// ---------------------------------------------------------------------------
// File Reading List Formatter
// ---------------------------------------------------------------------------

/**
 * Format a file reading list as plain text with section headers.
 *
 * Output format:
 *
 *     === PRIMARY ===
 *     delivery-process/specs/order-saga.feature
 *     delivery-process/stubs/order-saga/saga.ts
 *
 *     === COMPLETED DEPENDENCIES ===
 *     src/events/event-store.ts
 *
 *     === ROADMAP DEPENDENCIES ===
 *     delivery-process/specs/saga-engine.feature
 *
 *     === ARCHITECTURE NEIGHBORS ===
 *     src/orders/command-handler.ts
 *
 * @param list - File reading list from buildFileReadingList()
 * @returns Formatted file list as plain text
 */
export function formatFileReadingList(_list: FileReadingList): string {
  throw new Error('DataAPIContextAssembly not yet implemented - roadmap pattern');
}

// ---------------------------------------------------------------------------
// Overview Formatter
// ---------------------------------------------------------------------------

/**
 * Format an overview summary as plain text.
 *
 * Output format:
 *
 *     === PROGRESS ===
 *     69 patterns (36 completed, 3 active, 30 planned) = 52%
 *
 *     === ACTIVE PHASES ===
 *     Phase 14: Validation (2 active)
 *     Phase 25: Data API (1 active)
 *
 *     === BLOCKING ===
 *     AgentCommandInfra blocked by: AgentLLMIntegration (roadmap)
 *     DataAPIDesignSessionSupport blocked by: DataAPIContextAssembly (roadmap)
 *
 * @param overview - Overview summary from buildOverview()
 * @returns Formatted overview as plain text
 */
export function formatOverview(_overview: OverviewSummary): string {
  throw new Error('DataAPIContextAssembly not yet implemented - roadmap pattern');
}
