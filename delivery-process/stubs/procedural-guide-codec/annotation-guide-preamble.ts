/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ProceduralGuideCodec
 * @libar-docs-target delivery-process.config.ts
 *
 * ## Annotation Guide — Markdown Source File Example
 *
 * **Design Decision DD-7 (Markdown source files):**
 * The annotation guide preamble content (~265 lines of inline `SectionBlock[]`
 * TypeScript) is replaced by a plain markdown file at
 * `docs-sources/annotation-guide.md`. This file is read and parsed into
 * `SectionBlock[]` at config import time by `loadPreambleFromMarkdown()`.
 *
 * **Design Decision DD-5 (Hybrid approach):**
 * The annotation guide uses a hybrid approach. Most content (getting-started
 * walkthrough, shape extraction modes, Zod gotcha, file-type annotation
 * patterns, verification CLI recipes, troubleshooting table) is stable
 * editorial content that changes at editorial cadence, not code cadence.
 * This content is authored as markdown. The tag reference summary table is
 * the one section that changes when tags are added or modified -- it is
 * auto-generated from taxonomy data.
 *
 * **Rationale (DD-5):** Attempting to annotate "how to annotate" as source
 * code creates a circular dependency -- the guide that teaches annotation
 * would need annotations to generate itself. The markdown source file
 * breaks this circularity: the walkthrough is editorial content authored
 * once and maintained manually. The tag reference table IS derivable
 * from the taxonomy registry (tag names, format types, enum values) and
 * should be auto-generated to stay current.
 *
 * ### Content Mapping from ANNOTATION-GUIDE.md
 *
 * | Manual Section (ANNOTATION-GUIDE.md) | Markdown Element | Lines |
 * |--------------------------------------|------------------|-------|
 * | Getting Started: File-Level Opt-In | Code fences + paragraphs | 9-42 |
 * | Tag Prefix by Preset | Markdown table | 44-54 |
 * | Dual-Source Ownership | Markdown table | 56-65 |
 * | Shape Extraction: Mode 1 (Explicit) | Code fence | 71-82 |
 * | Shape Extraction: Mode 2 (Wildcard) | Code fence | 84-98 |
 * | Shape Extraction: Mode 3 (Declaration) | Code fence | 99-114 |
 * | Critical Gotcha: Zod Schemas | Markdown table | 116-124 |
 * | Verification CLI Commands | Bash code fence | 229-246 |
 * | Common Issues / Troubleshooting | Markdown table | 250-257 |
 *
 * Content NOT in preamble (auto-generated from taxonomy):
 * - Tag Groups Quick Reference table (lines 196-212)
 * - Format Types table (lines 214-224)
 *
 * ### Config Usage Example
 *
 * ```typescript
 * // In delivery-process.config.ts:
 * import { loadPreambleFromMarkdown } from './src/renderable/load-preamble.js';
 *
 * const annotationPreamble = loadPreambleFromMarkdown(
 *   'docs-sources/annotation-guide.md'
 * );
 *
 * // In referenceDocConfigs:
 * {
 *   title: 'Annotation Reference Guide',
 *   conventionTags: ['annotation-system'],
 *   preamble: [...annotationPreamble],
 *   docsFilename: 'ANNOTATION-REFERENCE.md',
 *   // ...
 * }
 * ```
 *
 * ### Example Markdown Source File (abbreviated)
 *
 * The full file at `docs-sources/annotation-guide.md` contains all sections
 * from the content mapping table above. This example shows a representative
 * section to illustrate the authoring format:
 *
 * ```markdown
 * ## Getting Started
 *
 * Every file that participates in the annotation system must have a
 * `@libar-docs` opt-in marker. Files without this marker are invisible
 * to the scanner.
 *
 * ### File-Level Opt-In
 *
 * **TypeScript** -- file-level JSDoc block:
 *
 * \`\`\`typescript
 * /**
 *  * @libar-docs
 *  * @libar-docs-pattern MyPattern
 *  * @libar-docs-status roadmap
 *  * /
 * \`\`\`
 *
 * ### Tag Prefix by Preset
 *
 * | Preset | Prefix | Categories | Use Case |
 * |--------|--------|------------|----------|
 * | `libar-generic` (default) | `@libar-docs-` | 3 | Simple projects |
 * | `ddd-es-cqrs` | `@libar-docs-` | 21 | DDD/Event Sourcing monorepos |
 *
 * ---
 *
 * ## Critical Gotcha: Zod Schemas
 *
 * For Zod files, extract the **schema constant** (with `Schema` suffix),
 * not the inferred type alias:
 *
 * | Wrong (type alias) | Correct (schema constant) |
 * |--------------------|---------------------------|
 * | `@extract-shapes MasterDataset` | `@extract-shapes MasterDatasetSchema` |
 *
 * ---
 *
 * ## Common Issues
 *
 * | Symptom | Cause | Fix |
 * |---------|-------|-----|
 * | Pattern not in scanner output | Missing `@libar-docs` opt-in | Add file-level `@libar-docs` JSDoc/tag |
 * | Shape shows `z.infer<>` wrapper | Extracted type alias, not schema | Use schema constant name |
 * ```
 */

export function _annotationGuidePreambleDesignStub(): never {
  throw new Error('ProceduralGuideCodec not yet implemented - roadmap pattern');
}
