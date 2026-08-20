/**
 * @architect
 * @architect-pattern AstParser
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:scanner
 * @architect-uses ExportInfoContract
 */
import {
  AST_NODE_TYPES,
  AST_TOKEN_TYPES,
  parse,
  type TSError,
} from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';

import { createRegexBuilders } from '../config/regex-builders.js';
import {
  asDirectiveTag,
  createDirectiveValidationError,
  createFileParseError,
  type DirectiveValidationError,
  type DocDirective,
  type ExportInfo,
  type FileParseError,
} from '../types/index.js';
import { Result } from '../types/index.js';
import {
  DocDirectiveSchema,
  createDefaultTagRegistry,
  type MetadataTagDefinition,
  type TagRegistry,
} from '../validation-schemas/index.js';
import { type AcceptedStatusValue } from '../taxonomy/index.js';

const REGEX_CACHE = new Map<string, RegExp>();

function getCachedRegex(pattern: string, flags?: string): RegExp {
  const key = flags ? `${pattern}|${flags}` : pattern;
  let regex = REGEX_CACHE.get(key);
  if (!regex) {
    regex = new RegExp(pattern, flags);
    REGEX_CACHE.set(key, regex);
  }
  if (regex.global) regex.lastIndex = 0;
  return regex;
}

export interface ParseDirectivesResult {
  readonly directives: readonly {
    directive: DocDirective;
    code: string;
    exports: readonly ExportInfo[];
  }[];
  readonly skippedDirectives: readonly DirectiveValidationError[];
}

function extractSingleValue(commentText: string, fullTag: string): string | undefined {
  const regex = getCachedRegex(
    `(?:^|\\n)\\s*\\*?\\s*${escapeRegex(fullTag)}(?:\\s*:\\s*|\\s+)(.+?)(?=\\s+@[A-Za-z][\\w-]*|\\n|\\*|$)`,
  );
  return regex.exec(commentText)?.[1]?.trim();
}

function extractEnumValue(
  commentText: string,
  fullTag: string,
  validValues: string[],
): string | undefined {
  const valuesPattern = validValues.join('|');
  const regex = getCachedRegex(`${escapeRegex(fullTag)}(?:\\s*:\\s*|\\s+)(${valuesPattern})`);
  return regex.exec(commentText)?.[1];
}

function extractQuotedValue(commentText: string, fullTag: string): string[] {
  const regex = getCachedRegex(
    `${escapeRegex(fullTag)}(?:\\s*:\\s*|\\s+)(?:"([^"]+)"|([^\\n*]+?)(?=\\s+@[A-Za-z][\\w-]*|\\n|\\*|$))`,
    'g',
  );
  const values: string[] = [];
  for (let match = regex.exec(commentText); match !== null; match = regex.exec(commentText)) {
    const value = (match[1] ?? match[2])?.trim();
    if (value) values.push(value);
  }
  return values;
}

function extractCsvValue(commentText: string, fullTag: string): string[] | undefined {
  const regex = getCachedRegex(`${escapeRegex(fullTag)}(?:\\s*:\\s*|\\s+)([^\\n@*]+)`);
  const match = regex.exec(commentText);
  if (!match?.[1]) return undefined;
  return match[1]
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function extractNumberValue(commentText: string, fullTag: string): number | undefined {
  const regex = getCachedRegex(`${escapeRegex(fullTag)}(?:\\s*:\\s*|\\s+)(\\d+)`);
  const match = regex.exec(commentText);
  return match?.[1] ? parseInt(match[1], 10) : undefined;
}

function checkFlagPresent(commentText: string, fullTag: string): boolean {
  const regex = getCachedRegex(`${escapeRegex(fullTag)}(?:\\s|:|$|\\*)`);
  return regex.test(commentText);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDirectivePatterns(registry: TagRegistry): {
  readonly tagRegex: RegExp;
  readonly startsWithOptInOrDirective: RegExp;
  readonly optInTagPattern: RegExp;
  readonly nonOptInAtTagPattern: RegExp;
} {
  const prefixWithoutAt = registry.tagPrefix.startsWith('@')
    ? registry.tagPrefix.substring(1)
    : registry.tagPrefix;
  const escapedPrefixWithoutAt = escapeRegex(prefixWithoutAt);
  const optInWithoutAt = registry.fileOptInTag.startsWith('@')
    ? registry.fileOptInTag.substring(1)
    : registry.fileOptInTag;
  const escapedOptInWithoutAt = escapeRegex(optInWithoutAt);

  return {
    tagRegex: new RegExp(`@${escapedPrefixWithoutAt}[\\w-]+(?:\\s*:\\s*[^\\s*]+)?`, 'g'),
    startsWithOptInOrDirective: new RegExp(`^@${escapedOptInWithoutAt}(?:-[\\w-]+)?`),
    optInTagPattern: new RegExp(`@${escapedOptInWithoutAt}(?!-)(\\s|$)?`, 'g'),
    nonOptInAtTagPattern: new RegExp(`^@(?!${escapedOptInWithoutAt})`),
  };
}

function buildValueTakingTagsPattern(registry: TagRegistry): string {
  const valueTakingTags = registry.metadataTags
    .filter((tag) => tag.format !== 'flag')
    .map((tag) => escapeRegex(tag.tag));
  const tagPrefix = escapeRegex(registry.tagPrefix);
  return `${tagPrefix}(?:${valueTakingTags.join('|')})(?:\\s*:\\s*|\\s)`;
}

function extractMetadataTag(
  commentText: string,
  tagDef: MetadataTagDefinition,
  prefix: string,
): unknown {
  const fullTag = `${prefix}${tagDef.tag}`;
  switch (tagDef.format) {
    case 'value':
      return extractSingleValue(commentText, fullTag);
    case 'enum':
      return extractEnumValue(commentText, fullTag, tagDef.values ? [...tagDef.values] : []);
    case 'quoted-value': {
      const values = extractQuotedValue(commentText, fullTag);
      return tagDef.repeatable ? (values.length > 0 ? values : undefined) : values[0];
    }
    case 'csv':
      return extractCsvValue(commentText, fullTag);
    case 'number':
      return extractNumberValue(commentText, fullTag);
    case 'flag':
      return checkFlagPresent(commentText, fullTag);
    default:
      return undefined;
  }
}

function readStringMetadata(
  metadataResults: ReadonlyMap<string, unknown>,
  key: string,
): string | undefined {
  const value = metadataResults.get(key);
  return typeof value === 'string' ? value : undefined;
}

function readStringArrayMetadata(
  metadataResults: ReadonlyMap<string, unknown>,
  key: string,
): string[] | undefined {
  const value = metadataResults.get(key);
  if (!Array.isArray(value)) {
    return undefined;
  }

  const stringValues = value.filter((entry): entry is string => typeof entry === 'string');
  if (stringValues.length !== value.length) {
    return undefined;
  }

  return stringValues;
}

export function parseFileDirectives(
  content: string,
  filePath: string,
  registry?: TagRegistry,
): Result<ParseDirectivesResult, FileParseError> {
  const effectiveRegistry = registry ?? createDefaultTagRegistry();
  let ast: TSESTree.Program;
  try {
    ast = parse(content, { loc: true, range: true, comment: true, tokens: false });
  } catch (error) {
    const tsError = error as TSError | Error;
    const location =
      'lineNumber' in tsError && 'column' in tsError
        ? { line: tsError.lineNumber, column: tsError.column }
        : undefined;
    return Result.err(
      createFileParseError(filePath, tsError.message || 'Unknown parse error', location, error),
    );
  }

  const results: { directive: DocDirective; code: string; exports: readonly ExportInfo[] }[] = [];
  const skippedDirectives: DirectiveValidationError[] = [];
  const comments = ast.comments ?? [];
  const builders = createRegexBuilders(effectiveRegistry.tagPrefix, effectiveRegistry.fileOptInTag);

  for (const comment of comments) {
    if (comment.type !== AST_TOKEN_TYPES.Block) continue;
    const commentText = comment.value;
    if (!builders.hasDocDirectives(commentText)) continue;

    const directiveResult = parseDirective(commentText, comment.loc, filePath, effectiveRegistry);
    if (Result.isErr(directiveResult)) {
      skippedDirectives.push(directiveResult.error);
      continue;
    }

    const directive = directiveResult.value;
    if (directive.tags.length === 0) continue;

    const codeBlock = extractCodeBlockAfterComment(content, ast, comment);
    if (!codeBlock) continue;

    results.push({
      directive,
      code: codeBlock.code,
      exports: extractExportsFromBlock(ast, codeBlock, content),
    });
  }

  return Result.ok({ directives: results, skippedDirectives });
}

function parseDirective(
  commentText: string,
  loc: TSESTree.SourceLocation,
  filePath: string,
  registry: TagRegistry,
): Result<DocDirective, DirectiveValidationError> {
  const lines = commentText.split('\n').map((line) => line.trim().replace(/^\*\s?/, ''));
  const patterns = buildDirectivePatterns(registry);
  const valueTakingTagsRegex = new RegExp(buildValueTakingTagsPattern(registry));

  const tags: string[] = [];
  let inlineDescription = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '' && tags.length === 0) continue;
    if (trimmedLine === '' && tags.length > 0) break;
    if (patterns.nonOptInAtTagPattern.exec(trimmedLine)) break;

    const startsWithDocTag = patterns.startsWithOptInOrDirective.exec(trimmedLine);
    if (startsWithDocTag) {
      let lastTagEnd = 0;
      patterns.tagRegex.lastIndex = 0;
      for (
        let match = patterns.tagRegex.exec(trimmedLine);
        match !== null;
        match = patterns.tagRegex.exec(trimmedLine)
      ) {
        const textBefore = trimmedLine.slice(lastTagEnd, match.index).trim();
        const cleanedBefore = textBefore.replace(patterns.optInTagPattern, '').trim();
        if (lastTagEnd > 0 && cleanedBefore !== '') break;
        tags.push(match[0].split(/(?:\s*:\s*|\s+)/, 1)[0] ?? match[0]);
        lastTagEnd = match.index + match[0].length;
      }

      const hasMetadataDirective = valueTakingTagsRegex.test(trimmedLine);
      if (!hasMetadataDirective) {
        const textAfterTags = trimmedLine
          .slice(lastTagEnd)
          .replace(patterns.optInTagPattern, '')
          .trim();
        if (textAfterTags) inlineDescription = textAfterTags;
      }
    } else {
      break;
    }
  }

  const metadataResults = new Map<string, unknown>();
  for (const tagDef of registry.metadataTags) {
    const result = extractMetadataTag(commentText, tagDef, registry.tagPrefix);
    if (result !== undefined) metadataResults.set(tagDef.tag, result);
  }

  const patternName = readStringMetadata(metadataResults, 'pattern');
  const status = readStringMetadata(metadataResults, 'status') as AcceptedStatusValue | undefined;
  const boundedContext = readStringMetadata(metadataResults, 'bounded-context');
  const uses = readStringArrayMetadata(metadataResults, 'uses');
  const level = readStringMetadata(metadataResults, 'level') as DocDirective['level'];
  const parent = readStringMetadata(metadataResults, 'parent');
  const implementsPatterns = readStringArrayMetadata(metadataResults, 'implements');
  const extendsPattern = readStringMetadata(metadataResults, 'extends');
  const seeAlso = readStringArrayMetadata(metadataResults, 'see-also');
  const enforcesDecisions = readStringArrayMetadata(metadataResults, 'enforces-decision');
  const apiRef = readStringArrayMetadata(metadataResults, 'api-ref');
  const role = readStringMetadata(metadataResults, 'role');
  const unlockReason = readStringMetadata(metadataResults, 'unlock-reason');
  const target = readStringMetadata(metadataResults, 'target');
  const executableSpecs = readStringArrayMetadata(metadataResults, 'executable-specs');
  const productArea = readStringMetadata(metadataResults, 'product-area');
  const convention = readStringArrayMetadata(metadataResults, 'convention');

  const deprecatedTags: string[] = [];
  const deprecatedFlagTags = new Set<string>();
  for (const roleDef of registry.roles) {
    deprecatedFlagTags.add(`${registry.tagPrefix}${roleDef.tag}`);
    for (const alias of roleDef.aliases ?? [])
      deprecatedFlagTags.add(`${registry.tagPrefix}${alias}`);
  }

  for (const tag of tags) {
    if (deprecatedFlagTags.has(tag)) deprecatedTags.push(tag);
  }

  const whenToUse = extractWhenToUse(commentText, registry.fileOptInTag);

  const descriptionLines: string[] = [];
  const examples: string[] = [];
  let inExample = false;
  let exampleBuffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith('@example')) {
      inExample = true;
      if (exampleBuffer.length > 0) {
        examples.push(exampleBuffer.join('\n'));
        exampleBuffer = [];
      }
      continue;
    }

    if (line.startsWith('@param') || line.startsWith('@returns') || line.startsWith('@')) {
      if (inExample && exampleBuffer.length > 0) {
        examples.push(exampleBuffer.join('\n'));
        exampleBuffer = [];
      }
      inExample = false;
      continue;
    }

    if (inExample) {
      if (!line.startsWith('```')) exampleBuffer.push(line);
    } else if (!line.startsWith('@')) {
      descriptionLines.push(line);
    }
  }

  if (exampleBuffer.length > 0) examples.push(exampleBuffer.join('\n'));

  const directive = {
    tags: tags.map((tag) => asDirectiveTag(tag)),
    description: inlineDescription
      ? [inlineDescription, ...descriptionLines].join('\n').trim()
      : descriptionLines.join('\n').trim(),
    examples,
    position: { startLine: loc.start.line, endLine: loc.end.line },
    ...(patternName && { patternName }),
    ...(status && { status }),
    ...(boundedContext && { boundedContext }),
    ...(whenToUse && { whenToUse }),
    ...(uses && uses.length > 0 && { uses }),
    ...(level !== undefined && { level }),
    ...(parent && { parent }),
    ...(implementsPatterns && implementsPatterns.length > 0 && { implements: implementsPatterns }),
    ...(extendsPattern && { extends: extendsPattern }),
    ...(seeAlso && seeAlso.length > 0 && { seeAlso }),
    ...(enforcesDecisions && enforcesDecisions.length > 0 && { enforcesDecisions }),
    ...(apiRef && apiRef.length > 0 && { apiRef }),
    ...(target && { target }),
    ...(executableSpecs && executableSpecs.length > 0 && { executableSpecs }),
    ...(role && { role }),
    ...(unlockReason && { unlockReason }),
    ...(deprecatedTags.length > 0 && { deprecatedTags }),
    ...(productArea && { productArea }),
    ...(convention && convention.length > 0 && { convention }),
  };

  const validation = DocDirectiveSchema.safeParse(directive);
  if (!validation.success) {
    const reason = validation.error.issues
      .map((issue) => {
        const pathLabel = issue.path.length > 0 ? issue.path.join('.') : 'directive';
        return `${pathLabel}: ${issue.message}`;
      })
      .join('; ');
    return Result.err(
      createDirectiveValidationError(
        filePath,
        loc.start.line,
        `Invalid directive structure: ${reason}`,
        commentText.substring(0, 100),
      ),
    );
  }

  return Result.ok(validation.data);
}

function extractCodeBlockAfterComment(
  content: string,
  ast: TSESTree.Program,
  comment: TSESTree.Comment,
): { code: string; startLine: number; endLine: number } | null {
  const nextNode = findNextNodeAfterPosition(ast, comment.range[1]);
  if (!nextNode) return null;

  const lines = content.split('\n');
  const startLine = nextNode.loc.start.line;
  const endLine = nextNode.loc.end.line;

  return {
    code: lines.slice(startLine - 1, endLine).join('\n'),
    startLine,
    endLine,
  };
}

function findNextNodeAfterPosition(ast: TSESTree.Program, position: number): TSESTree.Node | null {
  for (const node of ast.body) {
    if (node.range[0] > position) return node;
  }
  return null;
}

function extractExportsFromBlock(
  ast: TSESTree.Program,
  block: { code: string; startLine: number; endLine: number },
  sourceCode: string,
): readonly ExportInfo[] {
  const exports: ExportInfo[] = [];

  for (const node of ast.body) {
    if (node.loc.start.line < block.startLine || node.loc.end.line > block.endLine) continue;

    if (node.type === AST_NODE_TYPES.ExportNamedDeclaration) {
      if (node.declaration) {
        exports.push(...extractFromDeclaration(node.declaration, sourceCode));
      }
      const isTypeExport = node.exportKind === 'type';
      for (const spec of node.specifiers) {
        const exportedName =
          spec.exported.type === AST_NODE_TYPES.Identifier
            ? spec.exported.name
            : (spec.exported as { value: string }).value;
        exports.push({ name: exportedName, type: isTypeExport ? 'type' : 'const' });
      }
    } else if (node.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
      exports.push({ name: 'default', type: getExportType(node.declaration) });
    }
  }

  return exports;
}

function buildFunctionSignature(
  declaration: TSESTree.FunctionDeclaration,
  sourceCode: string,
): string {
  const beforeBody = sourceCode.slice(declaration.range[0], declaration.body.range[0]);
  const withoutExport = beforeBody.startsWith('export ')
    ? beforeBody.slice('export '.length)
    : beforeBody;
  return withoutExport.trim() + ';';
}

function extractFromDeclaration(declaration: TSESTree.Node, sourceCode: string): ExportInfo[] {
  const exports: ExportInfo[] = [];
  switch (declaration.type) {
    case AST_NODE_TYPES.FunctionDeclaration:
      if (declaration.id) {
        exports.push({
          name: declaration.id.name,
          type: 'function',
          signature: buildFunctionSignature(declaration, sourceCode),
        });
      }
      break;
    case AST_NODE_TYPES.VariableDeclaration:
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === AST_NODE_TYPES.Identifier) {
          exports.push({ name: declarator.id.name, type: 'const' });
        }
      }
      break;
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
      exports.push({ name: declaration.id.name, type: 'type' });
      break;
    case AST_NODE_TYPES.TSInterfaceDeclaration:
      exports.push({ name: declaration.id.name, type: 'interface' });
      break;
    case AST_NODE_TYPES.ClassDeclaration:
      if (declaration.id) exports.push({ name: declaration.id.name, type: 'class' });
      break;
    case AST_NODE_TYPES.TSEnumDeclaration:
      exports.push({ name: declaration.id.name, type: 'enum' });
      break;
  }
  return exports;
}

function getExportType(declaration: TSESTree.Node): ExportInfo['type'] {
  switch (declaration.type) {
    case AST_NODE_TYPES.FunctionDeclaration:
      return 'function';
    case AST_NODE_TYPES.ClassDeclaration:
      return 'class';
    case AST_NODE_TYPES.TSInterfaceDeclaration:
      return 'interface';
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
      return 'type';
    default:
      return 'const';
  }
}

function extractWhenToUse(
  commentText: string,
  fileOptInTag: string,
): readonly string[] | undefined {
  const cleanedLines = commentText.split('\n').map((line) => {
    return line
      .trim()
      .replace(/^\*\s?/, '')
      .trim();
  });
  const cleanedText = cleanedLines.join('\n');

  const headingMatch = /###\s*When to Use\s*\n/i.exec(cleanedText);
  if (headingMatch) {
    const afterHeading = cleanedText.slice(headingMatch.index + headingMatch[0].length);
    const bullets: string[] = [];

    for (const line of afterHeading.split('\n')) {
      const trimmed = line.trim();

      if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('|')) {
        break;
      }

      if (trimmed.startsWith('@') && !trimmed.startsWith(fileOptInTag)) {
        break;
      }

      const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed);

      if (bulletMatch?.[1]) {
        bullets.push(bulletMatch[1].trim());
        continue;
      }

      break;
    }

    if (bullets.length > 0) {
      return bullets;
    }
  }

  const inlineMatch = /\*\*When to use:\*\*\s*([^\n]+)/i.exec(cleanedText);
  if (inlineMatch?.[1]) {
    const description = inlineMatch[1].trim();
    if (description) {
      return [description];
    }
  }

  return undefined;
}
