import type { ExtractedPattern } from '../../validation-schemas/index.js';
import { parsePatternReference } from '../../validation-schemas/index.js';
import type {
  ImplementationRef,
  RelationshipEntry,
} from '../../validation-schemas/pattern-graph.js';
import type { DanglingReference } from './transform-types.js';

function getPatternName(pattern: ExtractedPattern): string {
  return pattern.patternName ?? pattern.name;
}

export interface DeclaredPatternTarget {
  readonly canonicalName: string;
  readonly packageId?: string;
  readonly isSourceDeclaration: boolean;
}

function normalizeSourceFilePath(sourceFile: string): string {
  return sourceFile.replaceAll('\\', '/');
}

export function inferPackageId(sourceFile: string): string | undefined {
  const normalized = normalizeSourceFilePath(sourceFile);
  const siblingPackageMatch = /^(?:\.\.\/)+([^/]+)\//u.exec(normalized);
  if (siblingPackageMatch?.[1]) return siblingPackageMatch[1];

  const workspacePackageMatch = /(?:^|\/)packages\/([^/]+)\//u.exec(normalized);
  return workspacePackageMatch?.[1];
}

function isSourceDeclaration(sourceFile: string): boolean {
  const normalized = normalizeSourceFilePath(sourceFile);
  return normalized.startsWith('src/') || normalized.includes('/src/');
}

export function buildDeclaredPatternIndex(
  patterns: readonly ExtractedPattern[],
): ReadonlyMap<string, readonly DeclaredPatternTarget[]> {
  const index = new Map<string, DeclaredPatternTarget[]>();

  for (const pattern of patterns) {
    if (pattern.patternName === undefined) continue;

    const packageId = inferPackageId(pattern.source.file);
    const existing = index.get(pattern.patternName) ?? [];
    existing.push({
      canonicalName: getPatternName(pattern),
      ...(packageId !== undefined ? { packageId } : {}),
      isSourceDeclaration: isSourceDeclaration(pattern.source.file),
    });
    index.set(pattern.patternName, existing);
  }

  return index;
}

export function resolveUsesTarget(
  sourcePattern: ExtractedPattern,
  reference: string,
  declaredTargetsByName: ReadonlyMap<string, readonly DeclaredPatternTarget[]>,
): string | undefined {
  const parsed = parsePatternReference(reference);
  if (parsed === undefined) return undefined;

  const candidates = declaredTargetsByName.get(parsed.patternName) ?? [];
  if (candidates.length === 0) return undefined;

  const sourcePackageId = inferPackageId(sourcePattern.source.file);

  if (parsed.packageId !== undefined) {
    const prefixedMatches = candidates.filter(
      (candidate) => candidate.packageId === parsed.packageId,
    );
    const [prefixedMatch] = prefixedMatches;
    return prefixedMatches.length === 1 && prefixedMatch ? prefixedMatch.canonicalName : undefined;
  }

  const samePackageMatches = candidates.filter(
    (candidate) => candidate.packageId === sourcePackageId,
  );
  const [samePackageMatch] = samePackageMatches;
  if (samePackageMatches.length === 1 && samePackageMatch) return samePackageMatch.canonicalName;
  if (samePackageMatches.length > 1) return undefined;

  const externalSourceMatches = candidates.filter(
    (candidate) => candidate.packageId !== sourcePackageId && candidate.isSourceDeclaration,
  );
  const [externalSourceMatch] = externalSourceMatches;
  if (externalSourceMatches.length === 1 && externalSourceMatch)
    return externalSourceMatch.canonicalName;

  return undefined;
}

export function createRelationshipEntry(pattern: ExtractedPattern): RelationshipEntry {
  return {
    uses: [...(pattern.uses ?? [])],
    usedBy: [],
    dependsOn: [...(pattern.uses ?? [])],
    enables: [],
    implementsPatterns: [...(pattern.implementsPatterns ?? [])],
    implementedBy: [],
    extendsPattern: pattern.extendsPattern,
    extendedBy: [],
    seeAlso: [...(pattern.seeAlso ?? [])],
    apiRef: [...(pattern.apiRef ?? [])],
  };
}

export function buildCanonicalRelationshipIndex(
  patterns: readonly ExtractedPattern[],
): Record<string, RelationshipEntry> {
  const relationshipIndex: Record<string, RelationshipEntry> = {};

  for (const pattern of patterns) {
    relationshipIndex[getPatternName(pattern)] = createRelationshipEntry(pattern);
  }

  buildReverseLookups(patterns, relationshipIndex);
  return relationshipIndex;
}

export function buildReverseLookups(
  patterns: readonly ExtractedPattern[],
  relationshipIndex: Record<string, RelationshipEntry>,
): void {
  const declaredTargetsByName = buildDeclaredPatternIndex(patterns);

  for (const pattern of patterns) {
    const patternKey = getPatternName(pattern);
    const entry = relationshipIndex[patternKey];
    if (!entry) continue;

    for (const implemented of entry.implementsPatterns) {
      const target = relationshipIndex[implemented];
      if (target) {
        const alreadyAdded = target.implementedBy.some(
          (impl: ImplementationRef) => impl.name === patternKey,
        );
        if (!alreadyAdded) {
          const desc = pattern.directive.description;
          const firstLine = desc ? desc.split('\n')[0]?.trim() : undefined;
          const description =
            firstLine && firstLine.length > 0
              ? firstLine.slice(0, 100) + (firstLine.length > 100 ? '...' : '')
              : undefined;

          target.implementedBy.push({
            name: patternKey,
            file: pattern.source.file,
            description,
          });
        }
      }
    }

    if (entry.extendsPattern) {
      const target = relationshipIndex[entry.extendsPattern];
      if (target && !target.extendedBy.includes(patternKey)) {
        target.extendedBy.push(patternKey);
      }
    }

    for (const dep of entry.dependsOn) {
      const resolvedTarget = resolveUsesTarget(pattern, dep, declaredTargetsByName);
      if (resolvedTarget === undefined) continue;

      const target = relationshipIndex[resolvedTarget];
      if (target && !target.enables.includes(patternKey)) {
        target.enables.push(patternKey);
      }
    }

    for (const used of entry.uses) {
      const resolvedTarget = resolveUsesTarget(pattern, used, declaredTargetsByName);
      if (resolvedTarget === undefined) continue;

      const target = relationshipIndex[resolvedTarget];
      if (target && !target.usedBy.includes(patternKey)) {
        target.usedBy.push(patternKey);
      }
    }
  }

  for (const entry of Object.values(relationshipIndex)) {
    entry.implementedBy.sort((a: ImplementationRef, b: ImplementationRef) =>
      a.file.localeCompare(b.file),
    );
    entry.extendedBy.sort((a, b) => a.localeCompare(b));
    entry.enables.sort((a, b) => a.localeCompare(b));
    entry.usedBy.sort((a, b) => a.localeCompare(b));
  }
}

export function detectDanglingReferences(
  patterns: readonly ExtractedPattern[],
  allPatternNames: ReadonlySet<string>,
): DanglingReference[] {
  const danglingReferences: DanglingReference[] = [];
  const declaredTargetsByName = buildDeclaredPatternIndex(patterns);

  for (const pattern of patterns) {
    const patternKey = getPatternName(pattern);

    for (const ref of pattern.uses ?? []) {
      if (resolveUsesTarget(pattern, ref, declaredTargetsByName) === undefined) {
        danglingReferences.push({ pattern: patternKey, field: 'uses', missing: ref });
      }
    }
    for (const ref of pattern.implementsPatterns ?? []) {
      if (!allPatternNames.has(ref)) {
        danglingReferences.push({ pattern: patternKey, field: 'implementsPatterns', missing: ref });
      }
    }
    if (pattern.extendsPattern && !allPatternNames.has(pattern.extendsPattern)) {
      danglingReferences.push({
        pattern: patternKey,
        field: 'extendsPattern',
        missing: pattern.extendsPattern,
      });
    }
    for (const ref of pattern.seeAlso ?? []) {
      if (!allPatternNames.has(ref))
        danglingReferences.push({ pattern: patternKey, field: 'seeAlso', missing: ref });
    }
  }

  return danglingReferences;
}
