/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ReferenceDocShowcase
 *
 * ## Function Signature Surfacing — ExportInfo.signature
 *
 * Target: src/scanner/ast-parser.ts (extractFromDeclaration, extractExportsFromBlock)
 * See: DD-1 (Thread sourceCode into extractFromDeclaration)
 * Since: DS-2
 *
 * ### Changes Required
 *
 * 1. `extractExportsFromBlock(ast, block)` → `extractExportsFromBlock(ast, block, content)`
 *    - Thread the full file `content` (NOT `block.code`!) because AST ranges are
 *      relative to the full file. `block.code` is a substring — slicing it with
 *      AST ranges produces garbage.
 *
 * 2. `extractFromDeclaration(declaration)` → `extractFromDeclaration(declaration, sourceCode)`
 *    - For FunctionDeclaration: slice the full source text using node.range
 *    - Strip function body using brace-matching (same pattern as shape-extractor's functionToSignature)
 *    - Set signature to the clean `functionName(param: Type, ...): ReturnType` form
 *
 * 3. `parseFileDirectives()` already has `content` — just pass it to extractExportsFromBlock
 *
 * ### Brace-Matching Algorithm (from shape-extractor.ts:676-722)
 *
 * Track braceDepth. When depth=0 and we hit `{`, that's the function body.
 * Slice everything before that brace and append `;`.
 * This correctly handles object types in params like `(o: { a: string }): void`.
 */

// --- Pseudocode for the change in ast-parser.ts ---

// BEFORE (ast-parser.ts:804):
// signature: `${declaration.id.name}(${declaration.params.map(() => '...').join(', ')})`,

// AFTER:
// signature: buildFunctionSignature(declaration, sourceCode),

/**
 * Build a clean function signature from AST node and source code.
 *
 * Extracts the full function text using AST range coordinates,
 * then strips the function body using brace-matching to produce
 * a signature-only form like `functionName(x: number, y: string): boolean`.
 *
 * @param declaration - FunctionDeclaration AST node (must have range property)
 * @param sourceCode - Full file source text
 * @returns Clean function signature string without body
 */
function buildFunctionSignature(
  declaration: { id: { name: string }; range: [number, number] },
  sourceCode: string
): string {
  throw new Error('ReferenceDocShowcase not yet implemented - roadmap pattern');
}

// The implementation will:
// 1. sourceCode.slice(declaration.range[0], declaration.range[1]) → full function text
// 2. Apply brace-matching to find body opening brace at depth=0
// 3. Slice before brace, trim, append ';'
// 4. Remove 'export ' prefix for clean display. KEEP 'async' — it's semantically meaningful.
// 5. Return: "async functionName(param1: Type1, param2: Type2): Promise<ReturnType>"
