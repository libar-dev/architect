/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ProceduralGuideCodec
 * @libar-docs-target delivery-process.config.ts
 *
 * ## Session Workflow Guide — Markdown Source File Example
 *
 * **Design Decision DD-7 (Markdown source files):**
 * The session workflow guide preamble content (~276 lines of inline
 * `SectionBlock[]` TypeScript) is replaced by a plain markdown file at
 * `docs-sources/session-workflow-guide.md`. This file is read and parsed
 * into `SectionBlock[]` at config import time by `loadPreambleFromMarkdown()`.
 *
 * **Design Decision DD-3 (Checklists as ListBlock items):**
 * Checklist items written as `- [ ] Step description` in markdown are parsed
 * into `ListBlock` items with the `[ ] ` prefix preserved. The markdown
 * renderer emits `- [ ] Step description` -- valid GitHub Flavored Markdown
 * checkbox syntax rendered by Starlight as interactive checkboxes.
 *
 * **Design Decision DD-3 (Decision trees as MermaidBlock):**
 * Mermaid code fences in the markdown source file are parsed into
 * `MermaidBlock` entries (not `CodeBlock`). The session type decision tree
 * renders as an interactive flowchart on the Starlight website.
 *
 * ### Content Mapping from SESSION-GUIDES.md
 *
 * | Manual Section (SESSION-GUIDES.md) | Markdown Element | Lines |
 * |-----------------------------------|--------------------|-------|
 * | Session Decision Tree (ASCII art) | Mermaid code fence (graph TD) | 9-16 |
 * | Session type table | Markdown table | 18-23 |
 * | Planning Session checklist | Unordered list with [ ] prefix | 40-79 |
 * | Planning Do NOT list | Unordered list | 82-85 |
 * | Design Session checklist | Unordered list with [ ] prefix | 117-153 |
 * | Design Do NOT list | Unordered list | 154-159 |
 * | Implementation execution order | Ordered list | 186-226 |
 * | Implementation Do NOT table | Markdown table | 230-233 |
 * | Planning+Design checklist | Unordered list | 249-276 |
 * | Handoff template | Bash code fence | 333-350 |
 * | FSM Protection table | Markdown table | 369-374 |
 *
 * Content NOT in preamble (auto-generated from SessionGuidesModuleSource):
 * - Session type contract invariants (Rule 3)
 * - FSM error reference table (Rule 7)
 * - Escape hatches table (Rule 7)
 *
 * ### Config Usage Example
 *
 * ```typescript
 * // In delivery-process.config.ts:
 * import { loadPreambleFromMarkdown } from './src/renderable/load-preamble.js';
 *
 * const sessionWorkflowPreamble = loadPreambleFromMarkdown(
 *   'docs-sources/session-workflow-guide.md'
 * );
 *
 * // In referenceDocConfigs:
 * {
 *   title: 'Session Workflow Guide',
 *   includeTags: ['session-workflows'],
 *   preamble: [...sessionWorkflowPreamble],
 *   docsFilename: 'SESSION-WORKFLOW-GUIDE.md',
 *   // ...
 * }
 * ```
 *
 * ### Example Markdown Source File (abbreviated)
 *
 * The full file at `docs-sources/session-workflow-guide.md` contains all
 * sections from the content mapping table above. This example shows the
 * first few sections to illustrate the authoring format:
 *
 * ```markdown
 * ## Session Decision Tree
 *
 * Use this flowchart to determine which session type to run.
 *
 * \`\`\`mermaid
 * graph TD
 *     A[Starting from pattern brief?] -->|Yes| B[Need code stubs now?]
 *     A -->|No| C[Ready to code?]
 *     B -->|Yes| D[Planning + Design Session]
 *     B -->|No| E[Planning Session]
 *     C -->|Yes| F[Complex decisions?]
 *     C -->|No| E
 *     F -->|Yes| G[Design Session]
 *     F -->|No| H[Implementation Session]
 *
 *     style D fill:#e1f5fe
 *     style E fill:#e8f5e9
 *     style G fill:#fff3e0
 *     style H fill:#fce4ec
 * \`\`\`
 *
 * ## Session Type Contracts
 *
 * | Session | Input | Output | FSM Change |
 * |---------|-------|--------|------------|
 * | Planning | Pattern brief | Roadmap spec (`.feature`) | Creates `roadmap` |
 * | Design | Complex requirement | Decision specs + code stubs | None |
 * | Implementation | Roadmap spec | Code + tests | `roadmap` -> `active` -> `completed` |
 * | Planning + Design | Pattern brief | Spec + stubs | Creates `roadmap` |
 *
 * ---
 *
 * ## Planning Session
 *
 * **Goal:** Create a roadmap spec. Do not write implementation code.
 *
 * ### Context Gathering
 *
 * \`\`\`bash
 * pnpm process:query -- overview                                # Project health
 * pnpm process:query -- list --status roadmap --names-only      # Available patterns
 * \`\`\`
 *
 * ### Planning Checklist
 *
 * - [ ] **Extract metadata** from pattern brief: phase, dependencies, status
 * - [ ] **Create spec file** at `{specs-directory}/{product-area}/{pattern}.feature`
 * - [ ] **Convert constraints to Rule: blocks** with Invariant/Rationale
 * - [ ] **Add scenarios** per Rule: 1 happy-path + 1 validation minimum
 *
 * ### Planning Do NOT
 *
 * - Create `.ts` implementation files
 * - Transition to `active`
 * - Ask "Ready to implement?"
 *
 * ---
 * ```
 *
 * The `loadPreambleFromMarkdown()` parser converts this markdown into the
 * same `SectionBlock[]` array that was previously authored inline:
 * - `## Heading` -> `HeadingBlock { level: 2, text: '...' }`
 * - Paragraphs -> `ParagraphBlock { text: '...' }`
 * - `\`\`\`mermaid ... \`\`\`` -> `MermaidBlock { content: '...' }`
 * - `\`\`\`bash ... \`\`\`` -> `CodeBlock { language: 'bash', content: '...' }`
 * - `| col | col |` tables -> `TableBlock { columns: [...], rows: [...] }`
 * - `- [ ] item` -> `ListBlock { items: ['[ ] item', ...] }`
 * - `---` -> `SeparatorBlock`
 */

export function _sessionGuidePreambleDesignStub(): never {
  throw new Error('ProceduralGuideCodec not yet implemented - roadmap pattern');
}
