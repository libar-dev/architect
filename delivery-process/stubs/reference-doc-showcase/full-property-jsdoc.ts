/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ReferenceDocShowcase
 *
 * ## Full Property-Level JSDoc Without Truncation
 *
 * Target: src/extractor/shape-extractor.ts (extractJsDocText function)
 * See: DD-2 (Join all lines instead of taking first)
 * Since: DS-2
 *
 * ### Change Required
 *
 * In `extractJsDocText()` at shape-extractor.ts:662:
 *
 * BEFORE:
 *   return lines.length > 0 ? lines[0] : undefined;
 *
 * AFTER:
 *   return lines.length > 0 ? lines.join(' ') : undefined;
 *
 * ### Why Space-Join
 *
 * Property JSDoc is rendered in table cells (PropertyDoc tables in reference codec).
 * Newlines in table cells break markdown table rendering. Space-join produces
 * a single flowing sentence suitable for table display.
 *
 * ### What Gets Preserved
 *
 * The `lines` array already filters out:
 * - Empty lines (line 659: `.filter(line => line.length > 0 && ...)`)
 * - Tag lines starting with `@` (line 659: `!line.startsWith('@')`)
 *
 * So the join produces: "First line of description. Second line continues.
 * Any additional paragraphs merged into one."
 *
 * ### No Schema Change Needed
 *
 * `PropertyDoc.jsDoc` is `z.string()` — no length constraint.
 */

// This deliverable is a 1-line change. No stub function needed.
// The design decision documents the exact change location and rationale.
