/**
 * @libar-docs
 * @libar-docs-pattern ShapeExtractorStub
 * @libar-docs-status roadmap
 * @libar-docs-phase 26
 *
 * ## Shape Extractor - Implementation Stub
 *
 * This stub demonstrates the API and approach for extracting TypeScript
 * type definitions from source files for documentation generation.
 *
 * ### Design Principles
 *
 * - **AST-based extraction**: Uses typescript-estree for accurate parsing
 * - **Preserves formatting**: Extracts exact source text, not regenerated
 * - **Includes JSDoc**: Type-level JSDoc comments are preserved
 * - **Order from tag**: Shapes appear in tag-specified order, not source order
 *
 * ### Supported Constructs
 *
 * | Construct | Extraction | Notes |
 * |-----------|------------|-------|
 * | `interface` | Full definition | Includes extends, generics |
 * | `type` alias | Full definition | Union, intersection, mapped |
 * | `enum` | Full definition | String and numeric |
 * | `function` | Signature only | Body replaced with `;` |
 * | `const` | Type annotation only | When has `as const` |
 *
 * ### Usage
 *
 * ```typescript
 * const shapes = extractShapes(sourceCode, ['DeciderInput', 'ValidationResult']);
 * // Returns: Map<string, ExtractedShape>
 * ```
 */

import type { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';

// =============================================================================
// Types
// =============================================================================

/**
 * A single extracted shape from TypeScript source.
 */
export interface ExtractedShape {
  /** Shape name (interface/type/enum/function name) */
  name: string;

  /** Kind of TypeScript construct */
  kind: 'interface' | 'type' | 'enum' | 'function' | 'const';

  /** Extracted source text (exact from file) */
  sourceText: string;

  /** JSDoc comment above the shape, if present */
  jsDoc?: string;

  /** Line number in source file */
  lineNumber: number;

  /** Generic type parameters, if any */
  typeParameters?: string[];

  /** For interfaces: what it extends */
  extends?: string[];

  /** For functions: overload signatures (excludes implementation signature) */
  overloads?: string[];

  /** Whether this is an exported shape */
  exported: boolean;
}

/**
 * Result of shape extraction from a file.
 */
export interface ShapeExtractionResult {
  /** Successfully extracted shapes, keyed by name */
  shapes: Map<string, ExtractedShape>;

  /** Shape names that were requested but not found */
  notFound: string[];

  /** Shape names that exist but are imports (not defined in file) */
  imported: string[];

  /** Shape names that are re-exported from other files */
  reExported: ReExportedShape[];

  /** Any warnings generated during extraction */
  warnings: string[];
}

/**
 * Information about a re-exported shape.
 * Re-exports are treated like imports - not extracted, but with source info.
 */
export interface ReExportedShape {
  /** The shape name that was re-exported */
  name: string;

  /** The source module path (e.g., './types.js') */
  sourceModule: string;

  /** Whether it's a type-only re-export */
  typeOnly: boolean;
}

/**
 * Options for shape extraction.
 */
export interface ShapeExtractionOptions {
  /** Include JSDoc comments in extraction (default: true) */
  includeJsDoc?: boolean;

  /** For functions, include full signature or just name+params (default: 'signature') */
  functionDetail?: 'signature' | 'name-only';

  /** Preserve original formatting vs normalize (default: true) */
  preserveFormatting?: boolean;
}

// =============================================================================
// Main Extraction Function
// =============================================================================

/**
 * Extract named shapes from TypeScript source code.
 *
 * @param sourceCode - The TypeScript source code to parse
 * @param shapeNames - Names of shapes to extract (in desired output order)
 * @param options - Extraction options
 * @returns Extraction result with shapes, warnings, and not-found list
 *
 * @example
 * ```typescript
 * const result = extractShapes(
 *   fileContent,
 *   ['ProcessState', 'ValidationResult', 'validateChanges'],
 *   { includeJsDoc: true }
 * );
 *
 * if (result.notFound.length > 0) {
 *   console.warn('Shapes not found:', result.notFound);
 * }
 *
 * for (const [name, shape] of result.shapes) {
 *   console.log(`${shape.kind} ${name}:`);
 *   console.log(shape.sourceText);
 * }
 * ```
 */
export function extractShapes(
  sourceCode: string,
  shapeNames: string[],
  options: ShapeExtractionOptions = {}
): ShapeExtractionResult {
  // TODO: Implementation
  // 1. Parse sourceCode with typescript-estree
  // 2. Build map of all exported declarations
  // 3. Build map of imports and re-exports
  // 4. For each requested shapeName:
  //    a. Find in declarations map → extract shape
  //    b. If not found, check if it's an import → add to imported[]
  //    c. If not found, check if it's a re-export → add to reExported[]
  //    d. If truly not found → add to notFound[]
  // 5. For functions, collect all overload signatures
  // 6. Extract source text using location info
  // 7. Extract preceding JSDoc if present
  // 8. Return shapes in requested order

  throw new Error('ShapeExtractor not yet implemented - roadmap pattern');
}

// =============================================================================
// AST Visitor Functions (internal)
// =============================================================================

/**
 * Find all exportable declarations in AST.
 * @internal
 */
function findDeclarations(
  _ast: unknown
): Map<string, { node: unknown; kind: ExtractedShape['kind'] }> {
  // Walk AST looking for:
  // - ExportNamedDeclaration with interface/type/enum/function
  // - InterfaceDeclaration (may be exported separately)
  // - TypeAliasDeclaration
  // - EnumDeclaration
  // - FunctionDeclaration
  // - VariableDeclaration with const

  throw new Error('Not implemented');
}

/**
 * Extract source text for a node, preserving original formatting.
 * @internal
 */
function extractSourceText(_sourceCode: string, _node: unknown): string {
  // Use node.range or node.loc to slice original source
  // This preserves exact formatting, comments, etc.

  throw new Error('Not implemented');
}

/**
 * Extract JSDoc comment preceding a node.
 * @internal
 */
function extractPrecedingJsDoc(_sourceCode: string, _node: unknown): string | undefined {
  // Look for comment block immediately before node
  // Parse as JSDoc if starts with /**

  throw new Error('Not implemented');
}

/**
 * Convert function declaration to signature-only form.
 * @internal
 */
function functionToSignature(_sourceText: string): string {
  // Replace function body { ... } with ;
  // Preserve async, generics, params, return type

  throw new Error('Not implemented');
}

/**
 * Find all imports and re-exports in the AST.
 * @internal
 *
 * Distinguishes between:
 * - `import { Foo } from './mod'` → imported
 * - `export { Foo } from './mod'` → re-exported
 * - `export type { Foo } from './mod'` → re-exported (typeOnly)
 */
function findImportsAndReExports(
  _ast: unknown
): {
  imports: Map<string, string>; // name → sourceModule
  reExports: Map<string, ReExportedShape>;
} {
  // Walk AST looking for:
  // - ImportDeclaration → add to imports
  // - ExportNamedDeclaration with source → add to reExports
  // - ExportAllDeclaration → note but can't extract specific names

  throw new Error('Not implemented');
}

/**
 * Collect all overload signatures for a function.
 * @internal
 *
 * TypeScript allows multiple function declarations with the same name
 * followed by an implementation. We want only the declaration signatures.
 */
function collectOverloads(
  _ast: unknown,
  _functionName: string
): string[] {
  // Find all FunctionDeclaration nodes with matching name
  // Filter: keep declarations (no body), exclude implementation (has body)
  // Return array of signature source texts

  throw new Error('Not implemented');
}

// =============================================================================
// Integration with Extractor Pipeline
// =============================================================================

/**
 * Process extract-shapes tag and add shapes to ExtractedPattern.
 *
 * Called by the document extractor when processing TypeScript files
 * with @libar-docs-extract-shapes tags.
 *
 * @param sourceCode - File content
 * @param extractShapesTag - Comma-separated shape names from tag
 * @returns Array of extracted shapes in tag order
 */
export function processExtractShapesTag(
  sourceCode: string,
  extractShapesTag: string
): ExtractedShape[] {
  const shapeNames = extractShapesTag.split(',').map((s) => s.trim());
  const result = extractShapes(sourceCode, shapeNames);

  // Log warnings for not-found shapes
  for (const name of result.notFound) {
    console.warn(`[extract-shapes] Shape '${name}' not found in file`);
  }

  // Log warnings for imported shapes
  for (const name of result.imported) {
    console.warn(
      `[extract-shapes] Shape '${name}' is imported, not defined in this file. ` +
        `Add @libar-docs-extract-shapes to the source file instead.`
    );
  }

  // Log warnings for re-exported shapes with source module info
  for (const reExport of result.reExported) {
    const typeOnlyNote = reExport.typeOnly ? ' (type-only)' : '';
    console.warn(
      `[extract-shapes] Shape '${reExport.name}' is re-exported${typeOnlyNote} from '${reExport.sourceModule}'. ` +
        `Add @libar-docs-extract-shapes to ${reExport.sourceModule} instead.`
    );
  }

  // Return shapes in tag order
  return shapeNames
    .filter((name) => result.shapes.has(name))
    .map((name) => result.shapes.get(name)!);
}

// =============================================================================
// Rendering Helper
// =============================================================================

/**
 * Render extracted shapes as markdown code blocks.
 *
 * @param shapes - Shapes to render
 * @param options - Rendering options
 * @returns Markdown string with fenced code blocks
 *
 * @example
 * ```typescript
 * const markdown = renderShapesAsMarkdown(shapes, { groupInSingleBlock: true });
 * // Returns:
 * // ```typescript
 * // interface Foo { ... }
 * //
 * // interface Bar { ... }
 * // ```
 * ```
 */
export function renderShapesAsMarkdown(
  shapes: ExtractedShape[],
  options: { groupInSingleBlock?: boolean; includeJsDoc?: boolean } = {}
): string {
  const { groupInSingleBlock = true, includeJsDoc = true } = options;

  if (shapes.length === 0) {
    return '';
  }

  const renderShape = (shape: ExtractedShape): string => {
    const parts: string[] = [];
    if (includeJsDoc && shape.jsDoc) {
      parts.push(shape.jsDoc);
    }
    parts.push(shape.sourceText);
    return parts.join('\n');
  };

  if (groupInSingleBlock) {
    const content = shapes.map(renderShape).join('\n\n');
    return '```typescript\n' + content + '\n```';
  }

  return shapes.map((shape) => '```typescript\n' + renderShape(shape) + '\n```').join('\n\n');
}
