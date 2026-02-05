/**
 * @libar-docs
 * @libar-docs-pattern ShapeExtractor
 * @libar-docs-status completed
 * @libar-docs-phase 26
 * @libar-docs-implements ShapeExtraction
 * @libar-docs-uses typescript-estree
 *
 * ## Shape Extractor - TypeScript Type Extraction
 *
 * Extracts TypeScript type definitions (interfaces, type aliases, enums,
 * function signatures) from source files for documentation generation.
 *
 * ### When to Use
 *
 * - When processing @libar-docs-extract-shapes tags during extraction
 * - When generating documentation that needs actual type definitions
 * - When eliminating duplication between JSDoc examples and code
 *
 * ### Key Concepts
 *
 * - **AST-based extraction**: Uses typescript-estree for accurate parsing
 * - **Preserves formatting**: Extracts exact source text, not regenerated
 * - **Includes JSDoc**: Type-level JSDoc comments are preserved
 * - **Order from tag**: Shapes appear in tag-specified order, not source order
 */

import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { Result } from '../types/result.js';
import type {
  ExtractedShape,
  PropertyDoc,
  ReExportedShape,
  ShapeExtractionOptionsInput,
  ShapeExtractionResult,
  ShapeKind,
} from '../validation-schemas/extracted-shape.js';

// =============================================================================
// Constants
// =============================================================================

/**
 * Maximum line gap between JSDoc comment end and declaration start.
 * Allows 1 blank line between JSDoc and declaration (comment end line + 1 blank + decl line = 3 gap)
 */
const MAX_JSDOC_LINE_DISTANCE = 3;

/**
 * Strict adjacency required for property-level JSDoc.
 * Property JSDoc must end on the line immediately before the property (no gap allowed).
 * This prevents interface-level JSDoc from being misattributed to the first property.
 */
const PROPERTY_JSDOC_MAX_GAP = 1;

/**
 * Maximum source code size in bytes (5MB).
 * Prevents memory exhaustion from oversized input during AST parsing.
 */
const MAX_SOURCE_SIZE_BYTES = 5 * 1024 * 1024;

// =============================================================================
// Types
// =============================================================================

/** Internal representation of a found declaration */
interface FoundDeclaration {
  node: TSESTree.Node;
  kind: ShapeKind;
  name: string;
  exported: boolean;
}

/** Internal representation of an import/re-export */
interface ImportOrReExport {
  name: string;
  sourceModule: string;
  isReExport: boolean;
  typeOnly: boolean;
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
 * @returns Result containing extraction result with shapes, warnings, and not-found list
 */
export function extractShapes(
  sourceCode: string,
  shapeNames: string[],
  options: ShapeExtractionOptionsInput = {}
): Result<ShapeExtractionResult> {
  // Validate input size to prevent memory exhaustion
  if (sourceCode.length > MAX_SOURCE_SIZE_BYTES) {
    return Result.err(
      new Error(
        `Source code size (${sourceCode.length} bytes) exceeds maximum allowed (${MAX_SOURCE_SIZE_BYTES} bytes)`
      )
    );
  }

  const { includeJsDoc = true, preserveFormatting = true } = options;

  const shapes: ExtractedShape[] = [];
  const notFound: string[] = [];
  const imported: string[] = [];
  const reExported: ReExportedShape[] = [];
  const warnings: string[] = [];

  // Parse the source code
  let ast: TSESTree.Program;
  try {
    ast = parse(sourceCode, {
      loc: true,
      range: true,
      comment: true,
      jsx: true,
    });
  } catch (error) {
    return Result.err(
      error instanceof Error ? error : new Error(`Failed to parse source code: ${String(error)}`)
    );
  }

  // Build maps of declarations and imports/re-exports
  const declarations = findDeclarations(ast);
  const importsAndReExports = findImportsAndReExports(ast);

  // Process each requested shape name
  for (const shapeName of shapeNames) {
    // Check if it's a local declaration
    const declaration = declarations.get(shapeName);
    if (declaration) {
      const shape = extractShape(sourceCode, declaration, ast.comments ?? [], {
        includeJsDoc,
        preserveFormatting,
      });
      shapes.push(shape);
      continue;
    }

    // Check if it's an import or re-export
    const importInfo = importsAndReExports.get(shapeName);
    if (importInfo) {
      if (importInfo.isReExport) {
        reExported.push({
          name: shapeName,
          sourceModule: importInfo.sourceModule,
          typeOnly: importInfo.typeOnly,
        });
      } else {
        imported.push(shapeName);
      }
      continue;
    }

    // Not found at all
    notFound.push(shapeName);
  }

  return Result.ok({ shapes, notFound, imported, reExported, warnings });
}

// =============================================================================
// AST Traversal Functions
// =============================================================================

/**
 * Find all declarations that could be extracted as shapes.
 */
function findDeclarations(ast: TSESTree.Program): Map<string, FoundDeclaration> {
  const declarations = new Map<string, FoundDeclaration>();

  for (const node of ast.body) {
    // Handle export declarations
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        const found = processDeclaration(node.declaration, true);
        for (const decl of found) {
          declarations.set(decl.name, decl);
        }
      }
      // Handle export { Foo } without a source (local re-export)
      if (!node.source) {
        for (const spec of node.specifiers) {
          const localName = spec.local.name;
          // This might reference a local declaration - mark it as exported
          const existing = declarations.get(localName);
          if (existing) {
            existing.exported = true;
          }
        }
      }
    }
    // Handle non-exported declarations
    else {
      const found = processDeclaration(node, false);
      for (const decl of found) {
        // Only add if not already found (export takes precedence)
        if (!declarations.has(decl.name)) {
          declarations.set(decl.name, decl);
        }
      }
    }
  }

  return declarations;
}

/**
 * Process a declaration node and extract shape info.
 */
function processDeclaration(node: TSESTree.Node, exported: boolean): FoundDeclaration[] {
  const results: FoundDeclaration[] = [];

  switch (node.type) {
    case 'TSInterfaceDeclaration':
      results.push({
        node,
        kind: 'interface',
        name: node.id.name,
        exported,
      });
      break;

    case 'TSTypeAliasDeclaration':
      results.push({
        node,
        kind: 'type',
        name: node.id.name,
        exported,
      });
      break;

    case 'TSEnumDeclaration':
      results.push({
        node,
        kind: 'enum',
        name: node.id.name,
        exported,
      });
      break;

    case 'FunctionDeclaration':
      if (node.id) {
        results.push({
          node,
          kind: 'function',
          name: node.id.name,
          exported,
        });
      }
      break;

    case 'VariableDeclaration':
      // Handle const declarations
      if (node.kind === 'const') {
        for (const declarator of node.declarations) {
          if (declarator.id.type === 'Identifier') {
            results.push({
              node: declarator,
              kind: 'const',
              name: declarator.id.name,
              exported,
            });
          }
        }
      }
      break;
  }

  return results;
}

/**
 * Find all imports and re-exports.
 */
function findImportsAndReExports(ast: TSESTree.Program): Map<string, ImportOrReExport> {
  const result = new Map<string, ImportOrReExport>();

  for (const node of ast.body) {
    // Import declarations
    if (node.type === 'ImportDeclaration') {
      const sourceModule = node.source.value;
      const typeOnly = node.importKind === 'type';

      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          result.set(spec.local.name, {
            name: spec.local.name,
            sourceModule,
            isReExport: false,
            typeOnly: typeOnly || spec.importKind === 'type',
          });
        } else if (spec.type === 'ImportDefaultSpecifier') {
          result.set(spec.local.name, {
            name: spec.local.name,
            sourceModule,
            isReExport: false,
            typeOnly,
          });
        }
      }
    }

    // Export declarations with source (re-exports)
    if (node.type === 'ExportNamedDeclaration' && node.source) {
      const sourceModule = node.source.value;
      const typeOnly = node.exportKind === 'type';

      for (const spec of node.specifiers) {
        const exportedName =
          spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value;
        result.set(exportedName, {
          name: exportedName,
          sourceModule,
          isReExport: true,
          typeOnly,
        });
      }
    }

    // Export all (export * from './module')
    if (node.type === 'ExportAllDeclaration') {
      // We can't know specific names from export *, just note it
      // This is handled by the "not found" case
    }
  }

  return result;
}

// =============================================================================
// Shape Extraction
// =============================================================================

/**
 * Extract a single shape from its declaration.
 */
function extractShape(
  sourceCode: string,
  declaration: FoundDeclaration,
  comments: TSESTree.Comment[],
  options: { includeJsDoc: boolean; preserveFormatting: boolean }
): ExtractedShape {
  const { node, kind, name, exported } = declaration;

  // Get the node's range for source extraction (guaranteed by parse options: range: true)
  let sourceText = sourceCode.slice(node.range[0], node.range[1]);

  // For functions, convert to signature only (remove body)
  if (kind === 'function') {
    sourceText = functionToSignature(sourceText);
  }

  // For const, extract just the type annotation if present
  if (kind === 'const' && node.type === 'VariableDeclarator') {
    const declNode = node as TSESTree.VariableDeclarator;
    if (declNode.id.typeAnnotation) {
      // Extract const with type annotation (ranges guaranteed by parse options)
      const idRange = declNode.id.range;
      const typeRange = declNode.id.typeAnnotation.range;
      sourceText = `const ${sourceCode.slice(idRange[0], typeRange[1])};`;
    }
  }

  // Get JSDoc if requested
  let jsDoc: string | undefined;
  if (options.includeJsDoc) {
    jsDoc = extractPrecedingJsDoc(sourceCode, node, comments);
  }

  // Get line number (guaranteed by parse options: loc: true)
  const lineNumber = node.loc.start.line;

  // Extract type parameters for interfaces and types
  let typeParameters: string[] | undefined;
  if (node.type === 'TSInterfaceDeclaration' || node.type === 'TSTypeAliasDeclaration') {
    const params = node.typeParameters;
    if (params?.params) {
      typeParameters = params.params.map((p) => sourceCode.slice(p.range[0], p.range[1]));
    }
  }

  // Extract extends for interfaces
  let extendsArr: string[] | undefined;
  if (node.type === 'TSInterfaceDeclaration' && node.extends.length > 0) {
    extendsArr = node.extends.map((ext) => sourceCode.slice(ext.range[0], ext.range[1]));
  }

  // Extract property-level JSDoc for interfaces
  // Uses strict adjacency to prevent interface-level JSDoc from being misattributed to first property
  let propertyDocs: PropertyDoc[] | undefined;
  if (options.includeJsDoc && node.type === 'TSInterfaceDeclaration') {
    const docs: PropertyDoc[] = [];
    // Get the line where the interface body starts (the `{` line)
    // loc is guaranteed by parse options: { range: true, loc: true }
    const interfaceBodyStartLine = node.body.loc.start.line;

    for (const member of node.body.body) {
      if (member.type === 'TSPropertySignature' && member.key.type === 'Identifier') {
        const propName = member.key.name;
        // Use strict adjacency - comment must be inside interface body and immediately before property
        const propJsDoc = findStrictlyAdjacentPropertyJsDoc(
          sourceCode,
          member,
          comments,
          interfaceBodyStartLine
        );
        if (propJsDoc) {
          // Extract just the text content from JSDoc, removing delimiters
          const cleanedJsDoc = extractJsDocText(propJsDoc);
          if (cleanedJsDoc) {
            docs.push({ name: propName, jsDoc: cleanedJsDoc });
          }
        }
      }
    }
    if (docs.length > 0) {
      propertyDocs = docs;
    }
  }

  return {
    name,
    kind,
    sourceText,
    jsDoc,
    lineNumber,
    typeParameters,
    extends: extendsArr,
    exported,
    propertyDocs,
  };
}

/**
 * Extract JSDoc comment preceding a node.
 */
function extractPrecedingJsDoc(
  sourceCode: string,
  node: TSESTree.Node,
  comments: TSESTree.Comment[]
): string | undefined {
  // Range and loc are guaranteed by parse options: { range: true, loc: true }
  const nodeStart = node.range[0];
  const nodeLine = node.loc.start.line;

  // Find the closest block comment that ends before this node
  // and is a JSDoc comment (starts with /**)
  let closestJsDoc: TSESTree.Comment | undefined;

  for (const comment of comments) {
    if (comment.type !== 'Block') continue;
    if (!comment.value.startsWith('*')) continue; // JSDoc starts with /**

    const commentEnd = comment.range[1];
    const commentEndLine = comment.loc.end.line;

    // Comment must end before node starts
    if (commentEnd > nodeStart) continue;

    // Comment must be close to the node
    if (nodeLine - commentEndLine > MAX_JSDOC_LINE_DISTANCE) continue;

    // This is a candidate - pick the one closest to the node
    if (!closestJsDoc || comment.range[1] > closestJsDoc.range[1]) {
      closestJsDoc = comment;
    }
  }

  if (!closestJsDoc) return undefined;

  // Return the full JSDoc including delimiters
  return sourceCode.slice(closestJsDoc.range[0], closestJsDoc.range[1]);
}

/**
 * Find JSDoc comment strictly adjacent to an interface property member.
 *
 * Unlike extractPrecedingJsDoc which allows a 3-line gap, this function requires:
 * 1. Comment must be INSIDE the interface body (start line > minLine)
 * 2. Comment must end exactly at member.startLine - 1 (strictly adjacent)
 *
 * This prevents interface-level JSDoc from being misattributed to the first property
 * when the interface is tightly formatted.
 *
 * @param sourceCode - Full source code text
 * @param member - The property member node
 * @param comments - All comments from the AST
 * @param interfaceBodyStartLine - Line where interface body starts (the `{` line)
 * @returns JSDoc string if found, undefined otherwise
 */
function findStrictlyAdjacentPropertyJsDoc(
  sourceCode: string,
  member: TSESTree.Node,
  comments: readonly TSESTree.Comment[],
  interfaceBodyStartLine: number
): string | undefined {
  // Range and loc are guaranteed by parse options: { range: true, loc: true }
  const memberStartLine = member.loc.start.line;
  const memberStart = member.range[0];

  // Property JSDoc must end exactly on the line before the property
  const expectedCommentEndLine = memberStartLine - PROPERTY_JSDOC_MAX_GAP;

  for (const comment of comments) {
    // Must be a block comment
    if (comment.type !== 'Block') continue;

    // Must be JSDoc format (starts with *)
    if (!comment.value.startsWith('*')) continue;

    const commentEndLine = comment.loc.end.line;
    const commentStartLine = comment.loc.start.line;
    const commentEnd = comment.range[1];

    // Comment must end before the member starts (character position)
    if (commentEnd > memberStart) continue;

    // Comment must be INSIDE the interface body (after the opening brace line)
    if (commentStartLine <= interfaceBodyStartLine) continue;

    // Comment must end exactly on the expected line (strictly adjacent)
    if (commentEndLine !== expectedCommentEndLine) continue;

    // Found a valid property-level JSDoc
    return sourceCode.slice(comment.range[0], comment.range[1]);
  }

  return undefined;
}

/**
 * Extract clean text content from a JSDoc comment.
 *
 * Removes the JSDoc delimiters (/** and *\/) and leading asterisks from each line.
 * Returns the first meaningful line as the description.
 */
function extractJsDocText(jsDoc: string): string | undefined {
  // Remove /** prefix and */ suffix
  let text = jsDoc.trim();
  if (text.startsWith('/**')) {
    text = text.slice(3);
  }
  if (text.endsWith('*/')) {
    text = text.slice(0, -2);
  }

  // Split into lines and clean each line
  const lines = text
    .split('\n')
    .map((line) => {
      // Remove leading whitespace and asterisk
      let cleaned = line.trim();
      if (cleaned.startsWith('*')) {
        cleaned = cleaned.slice(1).trim();
      }
      return cleaned;
    })
    .filter((line) => line.length > 0 && !line.startsWith('@')); // Skip empty and tag lines

  // Return first non-empty line as the description
  return lines.length > 0 ? lines[0] : undefined;
}

/**
 * Convert function declaration to signature-only form.
 */
function functionToSignature(sourceText: string): string {
  // Find the opening brace of the function body
  const braceIndex = sourceText.indexOf('{');
  if (braceIndex === -1) {
    // Already a signature (declaration without body)
    return sourceText;
  }

  // Take everything before the brace, trim, and add semicolon
  let signature = sourceText.slice(0, braceIndex).trim();

  // Remove async keyword from arrow functions that might have body
  // and ensure proper formatting
  if (!signature.endsWith(')') && !signature.endsWith('>')) {
    // Might have a return type - find the last )
    const lastParen = signature.lastIndexOf(')');
    if (lastParen !== -1) {
      // Check for return type after )
      const afterParen = signature.slice(lastParen + 1).trim();
      if (afterParen.startsWith(':')) {
        // Has return type, keep it
      } else {
        signature = signature.slice(0, lastParen + 1);
      }
    }
  }

  return signature + ';';
}

// =============================================================================
// Integration with Extractor Pipeline
// =============================================================================

/**
 * Result of processing extract-shapes tag.
 */
export interface ProcessExtractShapesResult {
  /** Successfully extracted shapes in tag order */
  shapes: ExtractedShape[];
  /** Warnings generated during extraction */
  warnings: string[];
}

/**
 * Process extract-shapes tag and return shapes for ExtractedPattern.
 *
 * Called by the document extractor when processing TypeScript files
 * with @libar-docs-extract-shapes tags.
 *
 * @param sourceCode - File content
 * @param extractShapesTag - Comma-separated shape names from tag
 * @returns Result with extracted shapes and any warnings
 */
export function processExtractShapesTag(
  sourceCode: string,
  extractShapesTag: string
): ProcessExtractShapesResult {
  const shapeNames = extractShapesTag
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const extractionResult = extractShapes(sourceCode, shapeNames);

  // If extraction failed (parse error), return empty shapes with error as warning
  if (!extractionResult.ok) {
    return {
      shapes: [],
      warnings: [`[extract-shapes] ${extractionResult.error.message}`],
    };
  }

  const result = extractionResult.value;
  const warnings: string[] = [...result.warnings];

  // Collect warnings for not-found shapes
  for (const name of result.notFound) {
    warnings.push(`[extract-shapes] Shape '${name}' not found in file`);
  }

  // Collect warnings for imported shapes
  for (const name of result.imported) {
    warnings.push(
      `[extract-shapes] Shape '${name}' is imported, not defined in this file. ` +
        `Add @libar-docs-extract-shapes to the source file instead.`
    );
  }

  // Collect warnings for re-exported shapes with source module info
  for (const reExport of result.reExported) {
    const typeOnlyNote = reExport.typeOnly ? ' (type-only)' : '';
    warnings.push(
      `[extract-shapes] Shape '${reExport.name}' is re-exported${typeOnlyNote} from '${reExport.sourceModule}'. ` +
        `Add @libar-docs-extract-shapes to ${reExport.sourceModule} instead.`
    );
  }

  return { shapes: [...result.shapes], warnings };
}

// =============================================================================
// Re-export Rendering Helper (moved to codec layer)
// =============================================================================

// Re-export renderShapesAsMarkdown from the codec helpers where it belongs
// This maintains backwards compatibility for existing imports
export { renderShapesAsMarkdown } from '../renderable/codecs/helpers.js';
