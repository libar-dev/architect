/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ProceduralGuideCodec
 * @libar-docs-target src/renderable/load-preamble.ts
 *
 * ## loadPreambleFromMarkdown() — Shared Utility Stub
 *
 * **Design Decision DD-8 (Shared markdown-to-SectionBlock parser):**
 * A `loadPreambleFromMarkdown()` function in `src/renderable/load-preamble.ts`
 * reads a markdown file via `readFileSync` (synchronous, runs at module import
 * time) and parses it into a `readonly SectionBlock[]` array using a line-by-line
 * state machine. This utility is available to all preamble consumers:
 * ProceduralGuideCodec, ErrorGuideCodec, CliRecipeCodec.
 *
 * **Rationale (DD-8):** Preamble content is naturally authored as markdown —
 * headings, tables, code fences, lists, and Mermaid diagrams all have standard
 * markdown syntax. Converting this to inline TypeScript `SectionBlock[]` object
 * literals (e.g., `{ type: 'heading', level: 2, text: '...' }`) is verbose
 * and harder to review. A shared parser eliminates 540+ lines of inline
 * TypeScript per codec config while preserving the same `SectionBlock[]`
 * shape that codecs receive in memory.
 *
 * **Codec purity preserved:** The parser runs at config import time (before
 * any codec `decode()` call). Codecs receive `SectionBlock[]` in memory via
 * `ReferenceDocConfig.preamble` — they never know whether the preamble came
 * from inline TypeScript or a parsed markdown file. No filesystem I/O occurs
 * during codec execution.
 *
 * ### Parsing Rules (Line-by-Line State Machine)
 *
 * The parser processes the markdown file line by line, maintaining a state
 * that tracks whether it is inside a code fence, accumulating a table, or
 * collecting paragraph text.
 *
 * | Markdown Construct | SectionBlock Type | Detection Rule |
 * |--------------------|-------------------|----------------|
 * | `# Heading` through `###### Heading` | HeadingBlock | Line starts with 1-6 `#` chars followed by space |
 * | Plain text paragraphs | ParagraphBlock | Consecutive non-empty lines separated by blank lines |
 * | `---` (horizontal rule) | SeparatorBlock | Line is exactly `---`, `***`, or `___` |
 * | `\| col \| col \|` with separator row | TableBlock | Line starts with `\|`, second line has `\|---` pattern |
 * | `- item` or `* item` | ListBlock (unordered) | Line starts with `- ` or `* ` |
 * | `1. item` | ListBlock (ordered) | Line starts with `\d+. ` |
 * | ` ```language ` ... ` ``` ` | CodeBlock | Fenced code block with language info string |
 * | ` ```mermaid ` ... ` ``` ` | MermaidBlock | Special case: code fence with `mermaid` info string |
 *
 * ### State Machine States
 *
 * | State | Entered When | Exited When |
 * |-------|-------------|-------------|
 * | `idle` | Start, after emitting a block | Any non-blank line |
 * | `in-code-fence` | Line matches ` ``` ` with optional info string | Line matches closing ` ``` ` |
 * | `in-table` | Line starts with `\|` and next line is separator | Line does not start with `\|` |
 * | `in-paragraph` | Non-blank line that doesn't match other patterns | Blank line encountered |
 * | `in-list` | Line starts with `- `, `* `, or `\d+. ` | Line does not match list pattern |
 *
 * ### Edge Cases
 *
 * | Case | Behavior |
 * |------|----------|
 * | `- [ ] Step text` | Parsed as ListBlock item with `[ ] ` prefix preserved (GFM checkbox) |
 * | Nested lists | Not supported — flattened to single-level list |
 * | `**bold**` in paragraphs | Preserved as-is in ParagraphBlock text (markdown inline formatting) |
 * | Empty code fence | Produces CodeBlock with empty content string |
 * | Table alignment (`:---:`) | Alignment markers stripped, columns extracted from header row |
 * | Consecutive headings | Each produces a separate HeadingBlock |
 * | YAML frontmatter (`---` ... `---`) | Not parsed — not needed for preamble content |
 *
 * ### Blocks NOT Produced
 *
 * | SectionBlock Type | Why Not Parsed |
 * |-------------------|---------------|
 * | CollapsibleBlock | No standard markdown syntax; codec adds these for progressive disclosure |
 * | LinkOutBlock | No standard markdown syntax; codec adds cross-reference links |
 *
 * ### Usage
 *
 * ```typescript
 * // In delivery-process.config.ts:
 * import { loadPreambleFromMarkdown } from './src/renderable/load-preamble.js';
 *
 * const sessionWorkflowPreamble = loadPreambleFromMarkdown(
 *   'docs-sources/session-workflow-guide.md'
 * );
 *
 * const annotationPreamble = loadPreambleFromMarkdown(
 *   'docs-sources/annotation-guide.md'
 * );
 *
 * // In referenceDocConfigs:
 * {
 *   title: 'Session Workflow Guide',
 *   preamble: [...sessionWorkflowPreamble],
 *   // ...
 * }
 * ```
 *
 * ### File Resolution
 *
 * The `filePath` argument is resolved relative to the project root directory
 * (the directory containing `package.json`). This matches how other config
 * file paths are resolved in `delivery-process.config.ts`.
 *
 * ```typescript
 * // These are equivalent:
 * loadPreambleFromMarkdown('docs-sources/session-workflow-guide.md')
 * // Resolves to: /absolute/path/to/project/docs-sources/session-workflow-guide.md
 * ```
 */

import type { SectionBlock } from '../../src/renderable/schema.js';

/**
 * Reads a markdown file and parses it into a `readonly SectionBlock[]` array.
 *
 * Uses `readFileSync` (synchronous) — intended to run at config import time,
 * not during codec decode. Resolves `filePath` relative to project root.
 *
 * @param _filePath - Path to markdown file, relative to project root
 * @returns Parsed SectionBlock array suitable for ReferenceDocConfig.preamble
 *
 * @example
 * ```typescript
 * const preamble = loadPreambleFromMarkdown('docs-sources/session-workflow-guide.md');
 * // Returns: readonly SectionBlock[] with HeadingBlock, ParagraphBlock,
 * //          CodeBlock, MermaidBlock, TableBlock, ListBlock, SeparatorBlock
 * ```
 */
export function loadPreambleFromMarkdown(
  _filePath: string
): readonly SectionBlock[] {
  throw new Error('ProceduralGuideCodec not yet implemented - roadmap pattern');
}
