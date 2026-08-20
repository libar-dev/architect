/**
 * @architect
 * @architect-pattern ShapeExtractor
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:extractor
 */
import { AST_NODE_TYPES, AST_TOKEN_TYPES, parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';

import { Result } from '../types/result.js';
import type {
  ExtractedShape,
  ParamDoc,
  PropertyDoc,
  ReExportedShape,
  ReturnsDoc,
  ShapeExtractionOptionsInput,
  ShapeExtractionResult,
  ShapeKind,
  ThrowsDoc,
} from '../validation-schemas/extracted-shape.js';

const MAX_JSDOC_LINE_DISTANCE = 3;
const PROPERTY_JSDOC_MAX_GAP = 1;
const MAX_SOURCE_SIZE_BYTES = 5 * 1024 * 1024;

interface FoundDeclaration {
  node: TSESTree.Node;
  kind: ShapeKind;
  name: string;
  exported: boolean;
}

interface ImportOrReExport {
  name: string;
  sourceModule: string;
  isReExport: boolean;
  typeOnly: boolean;
}

function parseSource(sourceCode: string, jsx: boolean): TSESTree.Program {
  return parse(sourceCode, { loc: true, range: true, comment: true, jsx });
}

export function extractShapes(
  sourceCode: string,
  shapeNames: string[],
  options: ShapeExtractionOptionsInput = {},
): Result<ShapeExtractionResult> {
  if (sourceCode.length > MAX_SOURCE_SIZE_BYTES) {
    return Result.err(
      new Error(
        `Source code size (${String(sourceCode.length)} bytes) exceeds maximum allowed (${String(MAX_SOURCE_SIZE_BYTES)} bytes)`,
      ),
    );
  }

  const { includeJsDoc = true, preserveFormatting = true } = options;
  const shapes: ExtractedShape[] = [];
  const notFound: string[] = [];
  const imported: string[] = [];
  const reExported: ReExportedShape[] = [];
  const warnings: string[] = [];

  let ast: TSESTree.Program;
  try {
    ast = parseSource(sourceCode, options.jsx ?? false);
  } catch (error) {
    return Result.err(
      error instanceof Error ? error : new Error(`Failed to parse source code: ${String(error)}`),
    );
  }

  const declarations = findDeclarations(ast);
  const importsAndReExports = findImportsAndReExports(ast);

  for (const shapeName of shapeNames) {
    const declarationList = declarations.get(shapeName);
    if (declarationList !== undefined) {
      const declaration = pickBestDeclaration(declarationList);
      shapes.push(
        extractShape(sourceCode, declaration, ast.comments ?? [], {
          includeJsDoc,
          preserveFormatting,
        }),
      );
      continue;
    }

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

    notFound.push(shapeName);
  }

  return Result.ok({ shapes, notFound, imported, reExported, warnings });
}

function findDeclarations(ast: TSESTree.Program): Map<string, FoundDeclaration[]> {
  const declarations = new Map<string, FoundDeclaration[]>();

  function pushDeclaration(declaration: FoundDeclaration): void {
    const existing = declarations.get(declaration.name);
    if (existing !== undefined) existing.push(declaration);
    else declarations.set(declaration.name, [declaration]);
  }

  for (const node of ast.body) {
    if (node.type === AST_NODE_TYPES.ExportNamedDeclaration) {
      if (node.declaration) {
        for (const declaration of processDeclaration(node.declaration, true)) {
          pushDeclaration(declaration);
        }
      }
      if (!node.source) {
        for (const spec of node.specifiers) {
          const localName = spec.local.name;
          const existing = declarations.get(localName);
          if (existing !== undefined) {
            for (const declaration of existing) declaration.exported = true;
          }
        }
      }
    } else {
      for (const declaration of processDeclaration(node, false)) {
        const existing = declarations.get(declaration.name);
        if (existing !== undefined) {
          const hasExportedSameKind = existing.some(
            (entry) => entry.exported && entry.kind === declaration.kind,
          );
          if (!hasExportedSameKind) existing.push(declaration);
        } else {
          declarations.set(declaration.name, [declaration]);
        }
      }
    }
  }

  return declarations;
}

const KIND_PRIORITY: Record<ShapeKind, number> = {
  interface: 0,
  type: 1,
  enum: 2,
  function: 3,
  const: 4,
};

function pickBestDeclaration(declarations: readonly FoundDeclaration[]): FoundDeclaration {
  if (declarations.length === 1) {
    const only = declarations[0];
    if (only === undefined) throw new Error('Empty declarations array');
    return only;
  }
  const sorted = [...declarations].sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]);
  const best = sorted[0];
  if (best === undefined) throw new Error('Empty declarations array after sort');
  return best;
}

function processDeclaration(node: TSESTree.Node, exported: boolean): FoundDeclaration[] {
  const results: FoundDeclaration[] = [];

  switch (node.type) {
    case AST_NODE_TYPES.TSInterfaceDeclaration:
      results.push({ node, kind: 'interface', name: node.id.name, exported });
      break;
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
      results.push({ node, kind: 'type', name: node.id.name, exported });
      break;
    case AST_NODE_TYPES.TSEnumDeclaration:
      results.push({ node, kind: 'enum', name: node.id.name, exported });
      break;
    case AST_NODE_TYPES.FunctionDeclaration:
      if (node.id) results.push({ node, kind: 'function', name: node.id.name, exported });
      break;
    case AST_NODE_TYPES.VariableDeclaration:
      if (node.kind === 'const') {
        for (const declarator of node.declarations) {
          if (declarator.id.type === AST_NODE_TYPES.Identifier) {
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

function findImportsAndReExports(ast: TSESTree.Program): Map<string, ImportOrReExport> {
  const result = new Map<string, ImportOrReExport>();

  for (const node of ast.body) {
    if (node.type === AST_NODE_TYPES.ImportDeclaration) {
      const sourceModule = node.source.value;
      const typeOnly = node.importKind === 'type';
      for (const spec of node.specifiers) {
        if (spec.type === AST_NODE_TYPES.ImportSpecifier) {
          result.set(spec.local.name, {
            name: spec.local.name,
            sourceModule,
            isReExport: false,
            typeOnly: typeOnly || spec.importKind === 'type',
          });
        } else if (spec.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
          result.set(spec.local.name, {
            name: spec.local.name,
            sourceModule,
            isReExport: false,
            typeOnly,
          });
        }
      }
    }

    if (node.type === AST_NODE_TYPES.ExportNamedDeclaration && node.source) {
      const sourceModule = node.source.value;
      const typeOnly = node.exportKind === 'type';
      for (const spec of node.specifiers) {
        const exportedName =
          spec.exported.type === AST_NODE_TYPES.Identifier
            ? spec.exported.name
            : spec.exported.value;
        result.set(exportedName, {
          name: exportedName,
          sourceModule,
          isReExport: true,
          typeOnly,
        });
      }
    }
  }

  return result;
}

function extractShape(
  sourceCode: string,
  declaration: FoundDeclaration,
  comments: TSESTree.Comment[],
  options: { includeJsDoc: boolean; preserveFormatting: boolean },
): ExtractedShape {
  const { node, kind, name, exported } = declaration;
  let sourceText = sourceCode.slice(node.range[0], node.range[1]);

  if (kind === 'function' && node.type === AST_NODE_TYPES.FunctionDeclaration) {
    const bodyStart = node.body.range[0];
    sourceText = sourceCode.slice(node.range[0], bodyStart).trim();
    if (sourceText.startsWith('export ')) sourceText = sourceText.slice('export '.length);
    sourceText = sourceText.trim() + ';';
  }

  if (
    kind === 'const' &&
    node.type === AST_NODE_TYPES.VariableDeclarator &&
    node.id.typeAnnotation
  ) {
    const idRange = node.id.range;
    const typeRange = node.id.typeAnnotation.range;
    sourceText = `const ${sourceCode.slice(idRange[0], typeRange[1])};`;
  }

  let jsDoc: string | undefined;
  if (options.includeJsDoc) {
    const rawJsDoc = extractPrecedingJsDoc(sourceCode, node, comments);
    jsDoc = rawJsDoc !== undefined ? stripArchitectTags(rawJsDoc) : undefined;
  }

  let parsedTags: ParsedJsDocTags | undefined;
  if (options.includeJsDoc && kind === 'function' && jsDoc) {
    parsedTags = parseJsDocTags(jsDoc);
  }

  const lineNumber = node.loc.start.line;

  let typeParameters: string[] | undefined;
  if (
    node.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
    node.type === AST_NODE_TYPES.TSTypeAliasDeclaration
  ) {
    const params = node.typeParameters;
    if (params?.params) {
      typeParameters = params.params.map((param) =>
        sourceCode.slice(param.range[0], param.range[1]),
      );
    }
  }

  let extendsArr: string[] | undefined;
  if (node.type === AST_NODE_TYPES.TSInterfaceDeclaration && node.extends.length > 0) {
    extendsArr = node.extends.map((ext) => sourceCode.slice(ext.range[0], ext.range[1]));
  }

  let propertyDocs: PropertyDoc[] | undefined;
  if (options.includeJsDoc && node.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
    const docs: PropertyDoc[] = [];
    const interfaceBodyStartLine = node.body.loc.start.line;
    const sortedComments = prepareJsDocComments(comments);

    for (const member of node.body.body) {
      if (
        member.type === AST_NODE_TYPES.TSPropertySignature &&
        member.key.type === AST_NODE_TYPES.Identifier
      ) {
        const propJsDoc = findStrictlyAdjacentPropertyJsDoc(
          sourceCode,
          member,
          sortedComments,
          interfaceBodyStartLine,
        );
        if (propJsDoc) {
          const cleanedJsDoc = extractJsDocText(propJsDoc);
          if (cleanedJsDoc) docs.push({ name: member.key.name, jsDoc: cleanedJsDoc });
        }
      }
    }

    if (docs.length > 0) propertyDocs = docs;
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
    params:
      parsedTags !== undefined && parsedTags.params.length > 0 ? parsedTags.params : undefined,
    returns: parsedTags?.returns,
    throws:
      parsedTags !== undefined && parsedTags.throws.length > 0 ? parsedTags.throws : undefined,
  };
}

function extractJsDocLineContent(line: string): string {
  return line
    .trim()
    .replace(/^\/\*\*\s*/, '')
    .replace(/\*\/\s*$/, '')
    .replace(/^\*\s?/, '')
    .trim();
}

function stripArchitectTags(jsDoc: string): string | undefined {
  const lines = jsDoc.split('\n');
  const filtered = lines.filter((line) => !extractJsDocLineContent(line).startsWith('@architect'));
  const hasContent = filtered.some((line) => extractJsDocLineContent(line).length > 0);
  if (!hasContent) return undefined;

  const result: string[] = [];
  let prevWasEmptyJsDocLine = false;
  for (const line of filtered) {
    const trimmed = line.trim();
    const isEmptyJsDocLine = trimmed === '*' || trimmed === '';
    if (isEmptyJsDocLine && prevWasEmptyJsDocLine) continue;
    result.push(line);
    prevWasEmptyJsDocLine = isEmptyJsDocLine;
  }

  return result.join('\n');
}

function extractPrecedingJsDoc(
  sourceCode: string,
  node: TSESTree.Node,
  comments: TSESTree.Comment[],
): string | undefined {
  const nodeStart = node.range[0];
  const nodeLine = node.loc.start.line;
  let closestJsDoc: TSESTree.Comment | undefined;

  for (const comment of comments) {
    if (comment.type !== AST_TOKEN_TYPES.Block) continue;
    if (!comment.value.startsWith('*')) continue;
    const commentEnd = comment.range[1];
    const commentEndLine = comment.loc.end.line;
    if (commentEnd > nodeStart) continue;
    if (nodeLine - commentEndLine > MAX_JSDOC_LINE_DISTANCE) continue;
    if (!closestJsDoc || comment.range[1] > closestJsDoc.range[1]) {
      closestJsDoc = comment;
    }
  }

  return closestJsDoc ? sourceCode.slice(closestJsDoc.range[0], closestJsDoc.range[1]) : undefined;
}

interface JsDocCommentWithLine {
  comment: TSESTree.Comment;
  endLine: number;
  startLine: number;
  endPosition: number;
}

function prepareJsDocComments(comments: readonly TSESTree.Comment[]): JsDocCommentWithLine[] {
  const jsDocComments: JsDocCommentWithLine[] = [];
  for (const comment of comments) {
    if (comment.type !== AST_TOKEN_TYPES.Block || !comment.value.startsWith('*')) continue;
    jsDocComments.push({
      comment,
      endLine: comment.loc.end.line,
      startLine: comment.loc.start.line,
      endPosition: comment.range[1],
    });
  }
  jsDocComments.sort((a, b) => a.endLine - b.endLine);
  return jsDocComments;
}

function findCommentEndingAtLine(
  sortedComments: readonly JsDocCommentWithLine[],
  targetLine: number,
): number {
  if (sortedComments.length === 0) return -1;

  let left = 0;
  let right = sortedComments.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comment = sortedComments[mid];
    if (!comment) break;

    if (comment.endLine === targetLine) {
      result = mid;
      left = mid + 1;
    } else if (comment.endLine < targetLine) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

function findStrictlyAdjacentPropertyJsDoc(
  sourceCode: string,
  member: TSESTree.Node,
  sortedComments: readonly JsDocCommentWithLine[],
  interfaceBodyStartLine: number,
): string | undefined {
  const memberStartLine = member.loc.start.line;
  const memberStart = member.range[0];
  const expectedCommentEndLine = memberStartLine - PROPERTY_JSDOC_MAX_GAP;
  const index = findCommentEndingAtLine(sortedComments, expectedCommentEndLine);
  if (index === -1) return undefined;

  for (let i = index; i >= 0; i--) {
    const entry = sortedComments[i];
    if (entry?.endLine !== expectedCommentEndLine) break;
    if (entry.endPosition > memberStart) continue;
    if (entry.startLine <= interfaceBodyStartLine) continue;
    return sourceCode.slice(entry.comment.range[0], entry.comment.range[1]);
  }

  return undefined;
}

interface ParsedJsDocTags {
  readonly params: readonly ParamDoc[];
  readonly returns: ReturnsDoc | undefined;
  readonly throws: readonly ThrowsDoc[];
}

function parseJsDocTags(rawJsDoc: string): ParsedJsDocTags {
  let text = rawJsDoc.trim();
  if (text.startsWith('/**')) text = text.slice(3);
  if (text.endsWith('*/')) text = text.slice(0, -2);

  const lines = text.split('\n').map((line) => {
    let cleaned = line.trim();
    if (cleaned.startsWith('*')) cleaned = cleaned.slice(1).trim();
    return cleaned;
  });

  const params: ParamDoc[] = [];
  let returns: ReturnsDoc | undefined;
  const throws: ThrowsDoc[] = [];
  const paramRegex = /^@param\s+(?:\{([^}]+)\}\s+)?([\w.]+)\s*(?:-\s*)?(.*)$/;
  const returnsRegex = /^@returns?\s+(?:\{([^}]+)\}\s+)?(.*)$/;
  const throwsRegex = /^@throws?\s+(?:\{([^}]+)\}\s+)?(.*)$/;
  let currentTag: { target: 'param' | 'returns' | 'throws'; index: number } | undefined;

  for (const line of lines) {
    if (line.length === 0) {
      currentTag = undefined;
      continue;
    }

    const paramMatch = paramRegex.exec(line);
    if (paramMatch) {
      params.push({
        name: paramMatch[2] ?? '',
        type: paramMatch[1] ?? undefined,
        description: (paramMatch[3] ?? '').trim(),
      });
      currentTag = { target: 'param', index: params.length - 1 };
      continue;
    }

    const returnsMatch = returnsRegex.exec(line);
    if (returnsMatch) {
      returns = { type: returnsMatch[1] ?? undefined, description: (returnsMatch[2] ?? '').trim() };
      currentTag = { target: 'returns', index: 0 };
      continue;
    }

    const throwsMatch = throwsRegex.exec(line);
    if (throwsMatch) {
      throws.push({
        type: throwsMatch[1] ?? undefined,
        description: (throwsMatch[2] ?? '').trim(),
      });
      currentTag = { target: 'throws', index: throws.length - 1 };
      continue;
    }

    if (line.startsWith('@')) {
      currentTag = undefined;
      continue;
    }

    if (currentTag) {
      const continuation = line.trim();
      if (continuation.length === 0) continue;

      const paramEntry = currentTag.target === 'param' ? params[currentTag.index] : undefined;
      const throwEntry = currentTag.target === 'throws' ? throws[currentTag.index] : undefined;
      if (currentTag.target === 'param' && paramEntry !== undefined) {
        params[currentTag.index] = {
          ...paramEntry,
          description:
            paramEntry.description.length > 0
              ? `${paramEntry.description} ${continuation}`
              : continuation,
        };
      } else if (currentTag.target === 'returns' && returns !== undefined) {
        returns = {
          ...returns,
          description:
            returns.description.length > 0
              ? `${returns.description} ${continuation}`
              : continuation,
        };
      } else if (currentTag.target === 'throws' && throwEntry !== undefined) {
        throws[currentTag.index] = {
          ...throwEntry,
          description:
            throwEntry.description.length > 0
              ? `${throwEntry.description} ${continuation}`
              : continuation,
        };
      }
    }
  }

  return { params, returns, throws };
}

function extractJsDocText(jsDoc: string): string | undefined {
  let text = jsDoc.trim();
  if (text.startsWith('/**')) text = text.slice(3);
  if (text.endsWith('*/')) text = text.slice(0, -2);

  const lines = text
    .split('\n')
    .map((line) => {
      let cleaned = line.trim();
      if (cleaned.startsWith('*')) cleaned = cleaned.slice(1).trim();
      return cleaned;
    })
    .filter((line) => line.length > 0 && !line.startsWith('@'));

  return lines.length > 0 ? lines.join(' ') : undefined;
}

export interface ProcessExtractShapesResult {
  shapes: ExtractedShape[];
  warnings: string[];
}

/**
 * Block-tag patterns anchored to a JSDoc tag line. The leading `^[ \t]*\*?[ \t]*`
 * consumes a line's indentation and optional `*` comment marker, so the tag is only
 * recognised when it *begins* a line — a prose mention mid-sentence (e.g. "see
 * `@architect-shape` for details") can never false-tag the declaration. The literal
 * `@` marker is **required**: leniency at this trust boundary is the bug, not a
 * feature — a line-start prose mention without the `@` (e.g. a wrapped sentence
 * beginning "architect-shape contracts …") must NOT opt a declaration into the API
 * surface. `[ \t]` (never `\s`) keeps every part of the match within one physical
 * line, so the optional group/value cannot bleed onto a following line. `m` makes
 * `^`/`$` match per line within the multi-line JSDoc block.
 */
const SHAPE_TAG_PATTERN = /^[ \t]*\*?[ \t]*@architect-shape(?!-)(?:[ \t]+([^\s*/]+))?[ \t]*$/m;
const INCLUDE_TAG_PATTERN = /^[ \t]*\*?[ \t]*@architect-include(?!-)(?:[ \t]+([^\n@*]+?))?[ \t]*$/m;

function extractShapeTag(jsDocText: string): { tagged: boolean; group?: string } {
  const match = SHAPE_TAG_PATTERN.exec(jsDocText);
  if (!match) return { tagged: false };
  const group = match[1];
  return group !== undefined ? { tagged: true, group } : { tagged: true };
}

function extractIncludeTag(jsDocText: string): readonly string[] | undefined {
  const match = INCLUDE_TAG_PATTERN.exec(jsDocText);
  if (!match) return undefined;
  const raw = match[1];
  if (raw === undefined) return undefined;
  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return values.length > 0 ? values : undefined;
}

export function discoverTaggedShapes(
  sourceCode: string,
  options?: { readonly jsx?: boolean },
): Result<ProcessExtractShapesResult> {
  if (sourceCode.length > MAX_SOURCE_SIZE_BYTES) {
    return Result.err(
      new Error(
        `Source code size (${String(sourceCode.length)} bytes) exceeds maximum allowed (${String(MAX_SOURCE_SIZE_BYTES)} bytes)`,
      ),
    );
  }

  let ast: TSESTree.Program;
  try {
    ast = parseSource(sourceCode, options?.jsx ?? false);
  } catch (error) {
    return Result.err(
      error instanceof Error ? error : new Error(`Failed to parse source code: ${String(error)}`),
    );
  }

  const declarations = findDeclarations(ast);
  const comments = ast.comments ?? [];
  const shapes: ExtractedShape[] = [];
  const warnings: string[] = [];

  for (const [, declarationList] of declarations) {
    for (const declaration of declarationList) {
      const jsDoc = extractPrecedingJsDoc(sourceCode, declaration.node, comments);
      if (jsDoc === undefined) continue;

      const tagResult = extractShapeTag(jsDoc);
      if (!tagResult.tagged) continue;

      const shape = extractShape(sourceCode, declaration, comments, {
        includeJsDoc: true,
        preserveFormatting: true,
      });

      const includeValues = extractIncludeTag(jsDoc);
      shapes.push({
        ...shape,
        group: tagResult.group,
        ...(includeValues !== undefined && { includes: includeValues }),
      });
    }
  }

  return Result.ok({ shapes, warnings });
}
