/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ProceduralGuideCodec
 * @libar-docs-target src/renderable/codecs/procedural-guide.ts
 *
 * ## ProceduralGuideCodecOptions -- Configuration Interface
 *
 * **Design Decision DD-1 (One codec, two configs):**
 * A single `createProceduralGuideCodec()` factory produces both the session
 * workflow guide and the annotation guide. The two documents share the same
 * dual-source composition pattern (preamble editorial + auto-generated
 * reference), but differ in their `ReferenceDocConfig` entries: different
 * titles, different preamble content, different behavior source patterns,
 * and different output paths.
 *
 * **Rationale (DD-1):** The codec class contains zero document-specific
 * logic. All document-specific content is in the config: the preamble
 * `SectionBlock[]` array carries editorial content, while
 * `behaviorCategories` and the SessionGuidesModuleSource pattern name
 * control which Rule: blocks are extracted. Creating two separate codec
 * classes would duplicate the identical composition logic. This follows
 * the precedent set by `createReferenceCodec()`, which produces 10+
 * different reference documents from different `ReferenceDocConfig` entries.
 *
 * **Design Decision DD-4 (Preamble from parsed markdown):**
 * The preamble is a flat `SectionBlock[]` array produced by parsing a
 * markdown source file via `loadPreambleFromMarkdown()` at config import
 * time. Editorial content is organized by section headings in the markdown
 * file (e.g., `## Session Decision Tree`, `## Getting Started`). This
 * avoids introducing a new "named template section" abstraction -- the
 * existing `SectionBlock` types (`heading`, `paragraph`, `table`,
 * `mermaid`, `code`, `list`) are sufficient to express all procedural
 * content, and standard markdown maps directly to these types.
 *
 * **Rationale (DD-4):** The preamble IS ~95% of the document, which is
 * unusual but not architecturally different from a 10% preamble. The
 * `SectionBlock[]` array is already the universal composition unit for
 * all reference docs. Authoring this content as markdown (DD-7) instead
 * of inline TypeScript object literals reduces config file size by ~540
 * lines while preserving the same `SectionBlock[]` shape that the codec
 * receives.
 *
 * **Design Decision DD-3 (Checklists and decision trees via existing blocks):**
 * Checklists use `ListBlock` with `- [ ] Step 1` text items (rendered
 * as markdown checkbox syntax). Decision trees use `MermaidBlock` with
 * `graph TD` diagrams. No new `ChecklistBlock` or `DecisionTreeBlock`
 * types are introduced.
 *
 * **Rationale (DD-3):** The markdown renderer already emits `ListBlock`
 * items as `- item` lines. Prefixing list items with `[ ] ` produces
 * valid GitHub/Starlight checkbox syntax without any renderer changes.
 * Mermaid `graph TD` diagrams are already a supported `SectionBlock`
 * type (proven by product area docs and ReferenceDocShowcase). Adding
 * new block types would require schema changes, renderer changes, and
 * test updates -- all for rendering that existing types already handle.
 *
 * ### Integration with ReferenceDocConfig
 *
 * The ProceduralGuideCodec does NOT introduce a new config type. It
 * reuses `ReferenceDocConfig` directly, with these fields populated:
 *
 * | Field | Session Workflow Guide | Annotation Guide |
 * |-------|----------------------|------------------|
 * | title | "Session Workflow Guide" | "Annotation Reference Guide" |
 * | preamble | Checklists, Mermaid decision tree, Do-NOT tables | Getting-started, shape modes, troubleshooting |
 * | behaviorCategories | [] (empty -- uses includeTags instead) | [] |
 * | includeTags | ['session-workflows'] | [] |
 * | conventionTags | [] | ['annotation-system'] |
 * | shapeSources | [] | [] |
 * | claudeMdSection | 'workflow' | 'annotation' |
 * | docsFilename | 'SESSION-WORKFLOW-GUIDE.md' | 'ANNOTATION-REFERENCE.md' |
 * | claudeMdFilename | 'session-workflow-guide.md' | 'annotation-reference.md' |
 *
 * The `includeTags` mechanism is preferred over `behaviorCategories`
 * because SessionGuidesModuleSource needs to be explicitly opted-in
 * via `@libar-docs-include:session-workflows` rather than category-matched.
 * This allows precise control over which patterns contribute behavior
 * content to each guide document.
 */

import type { SectionBlock } from '../../../src/renderable/schema.js';

// ---------------------------------------------------------------------------
// No new options type needed -- ProceduralGuideCodec uses ReferenceDocConfig
// ---------------------------------------------------------------------------

/**
 * Type alias documenting the preamble content structure for session guides.
 * The actual type is `readonly SectionBlock[]` from ReferenceDocConfig.preamble.
 *
 * Content organization within the flat SectionBlock[] array:
 *
 * Session Workflow Guide preamble sections (in order):
 * 1. heading(2, 'Session Decision Tree') + MermaidBlock (graph TD)
 * 2. heading(2, 'Planning Session') + checklist ListBlocks + Do-NOT table
 * 3. heading(2, 'Design Session') + checklist ListBlocks + Do-NOT table
 * 4. heading(2, 'Implementation Session') + execution order ListBlock + Do-NOT table
 * 5. heading(2, 'Planning + Design Session') + combined checklist
 * 6. heading(2, 'Handoff Documentation') + template CodeBlock
 * 7. heading(2, 'FSM Protection Quick Reference') + FSM table
 *
 * Annotation Guide preamble sections (in order):
 * 1. heading(2, 'Getting Started') + opt-in examples + prefix table
 * 2. heading(2, 'Shape Extraction') + mode explanations + Zod gotcha
 * 3. heading(2, 'Annotation Patterns by File Type') + per-type examples
 * 4. heading(2, 'Verification') + CLI recipes + troubleshooting table
 */
export type ProceduralGuidePreamble = readonly SectionBlock[];

/**
 * Validates that a preamble array contains the expected section structure
 * for a session workflow guide. Used in tests to verify preamble completeness.
 *
 * @param _preamble - The preamble SectionBlock[] to validate
 * @returns true if all expected sections are present
 */
export function validateSessionGuidePreamble(
  _preamble: ProceduralGuidePreamble
): boolean {
  throw new Error('ProceduralGuideCodec not yet implemented - roadmap pattern');
}

/**
 * Validates that a preamble array contains the expected section structure
 * for an annotation guide. Used in tests to verify preamble completeness.
 *
 * @param _preamble - The preamble SectionBlock[] to validate
 * @returns true if all expected sections are present
 */
export function validateAnnotationGuidePreamble(
  _preamble: ProceduralGuidePreamble
): boolean {
  throw new Error('ProceduralGuideCodec not yet implemented - roadmap pattern');
}
