import type { AuthoredCore, AuthoredPattern, MechanicalCore } from './schema.js';
import { fileToPatternMap } from './view-support.js';

export interface ConceptHit {
  readonly name: string;
  readonly role?: string | undefined;
  readonly boundedContext?: string | undefined;
  readonly status: string;
  readonly score: number;
  readonly matchedOn: readonly string[];
}

export interface FanInOptions {
  readonly min?: number;
  readonly limit?: number;
}

interface FileNeighbor {
  readonly file: string;
  readonly pattern?: string;
}

export interface MechanicalNeighborhood {
  readonly imports: readonly FileNeighbor[];
  readonly importedBy: readonly FileNeighbor[];
}

function tagValue(pattern: AuthoredPattern | undefined, prefix: string): string | undefined {
  for (const tag of pattern?.directive?.tags ?? []) {
    if (tag.startsWith(prefix) && tag.length > prefix.length) return tag.slice(prefix.length);
  }
  return undefined;
}

function roleOf(pattern: AuthoredPattern | undefined): string | undefined {
  return pattern?.role ?? tagValue(pattern, '@architect-role:');
}

function tokens(value: string): readonly string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function findByConcept(
  authored: AuthoredCore,
  query: string,
  options: { readonly limit?: number } = {},
): readonly ConceptHit[] {
  const queryText = query.toLowerCase().trim();
  const queryTokens = tokens(query);
  if (queryText.length === 0) return [];
  const fields = [
    { key: 'name', weight: 10 },
    { key: 'whenToUse', weight: 5 },
    { key: 'productArea', weight: 3 },
    { key: 'description', weight: 2 },
  ] as const;
  const result: ConceptHit[] = [];
  for (const pattern of authored.patterns) {
    const values = {
      name: pattern.name,
      whenToUse: pattern.whenToUse.join(' '),
      productArea: pattern.productArea ?? '',
      description: pattern.directive?.description ?? '',
    };
    let score = 0;
    const matchedOn: string[] = [];
    for (const { key, weight } of fields) {
      const value = values[key].toLowerCase();
      if (value.length === 0) continue;
      let fieldScore = value.includes(queryText) ? weight * 2 : 0;
      const valueTokens = new Set(tokens(value));
      fieldScore += weight * queryTokens.filter((token) => valueTokens.has(token)).length;
      if (fieldScore > 0) {
        score += fieldScore;
        matchedOn.push(key);
      }
    }
    if (score > 0) {
      result.push({
        name: pattern.name,
        role: roleOf(pattern),
        boundedContext: pattern.boundedContext ?? tagValue(pattern, '@architect-bounded-context:'),
        status: pattern.status,
        score,
        matchedOn,
      });
    }
  }
  return result
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, options.limit ?? 12);
}

export function byFile(authored: AuthoredCore, mech: MechanicalCore, filePath: string) {
  const fileToPattern = fileToPatternMap(authored);
  const patternName = fileToPattern.get(filePath);
  const imports = new Map<string, FileNeighbor>();
  const importedBy = new Map<string, FileNeighbor>();
  for (const edge of mech.edges) {
    if (edge.fromFile === filePath && edge.toFile !== filePath) {
      const owner = fileToPattern.get(edge.toFile);
      imports.set(edge.toFile, {
        file: edge.toFile,
        ...(owner === undefined ? {} : { pattern: owner }),
      });
    }
    if (edge.toFile === filePath && edge.fromFile !== filePath) {
      const owner = fileToPattern.get(edge.fromFile);
      importedBy.set(edge.fromFile, {
        file: edge.fromFile,
        ...(owner === undefined ? {} : { pattern: owner }),
      });
    }
  }
  const sorted = (neighbors: ReadonlyMap<string, FileNeighbor>) =>
    [...neighbors.values()].sort((left, right) => left.file.localeCompare(right.file));
  const mechanical: MechanicalNeighborhood = {
    imports: sorted(imports),
    importedBy: sorted(importedBy),
  };
  if (patternName === undefined) return { file: filePath, mapped: false as const, mechanical };
  const relationship = authored.relationshipIndex[patternName];
  return {
    file: filePath,
    mapped: true as const,
    pattern: patternName,
    role: roleOf(authored.patterns.find((pattern) => pattern.name === patternName)),
    curated: {
      uses: [...(relationship?.uses ?? [])].sort(),
      usedBy: [...(relationship?.usedBy ?? [])].sort(),
      implementedBy: (relationship?.implementedBy ?? [])
        .map((implementation) => implementation.file)
        .filter((file): file is string => file?.endsWith('.feature') === true)
        .sort(),
    },
    mechanical,
  };
}

export function bySymbol(mech: MechanicalCore, authored: AuthoredCore, symbolName: string) {
  const fileToPattern = fileToPatternMap(authored);
  const definedIn = mech.symbols
    .filter((symbol) => symbol.name === symbolName)
    .map((symbol) => {
      const pattern = fileToPattern.get(symbol.file);
      return {
        file: symbol.file,
        kind: symbol.kind,
        pkg: symbol.pkg,
        ...(pattern === undefined ? {} : { pattern }),
      };
    })
    .sort((left, right) => left.file.localeCompare(right.file));
  const importedByFiles = [
    ...new Set(
      mech.edges.filter((edge) => edge.symbol === symbolName).map((edge) => edge.fromFile),
    ),
  ].sort();
  const importedByPatterns = [
    ...new Set(
      importedByFiles
        .map((file) => fileToPattern.get(file))
        .filter((name): name is string => name !== undefined),
    ),
  ].sort();
  return { symbol: symbolName, definedIn, importedByFiles, importedByPatterns };
}

function mechanicalPatternEdges(mech: MechanicalCore, fileToPattern: ReadonlyMap<string, string>) {
  const edges = new Set<string>();
  for (const edge of mech.edges) {
    const from = fileToPattern.get(edge.fromFile);
    const to = fileToPattern.get(edge.toFile);
    if (from !== undefined && to !== undefined && from !== to) edges.add(`${from}→${to}`);
  }
  return edges;
}

function authoredUsesEdges(authored: AuthoredCore): Set<string> {
  const edges = new Set<string>();
  for (const [name, relationship] of Object.entries(authored.relationshipIndex)) {
    for (const target of relationship.uses) edges.add(`${name}→${target}`);
  }
  return edges;
}

export function graphDiff(mech: MechanicalCore, authored: AuthoredCore) {
  const mechanical = mechanicalPatternEdges(mech, fileToPatternMap(authored));
  const authoredEdges = authoredUsesEdges(authored);
  const shared = [...mechanical].filter((edge) => authoredEdges.has(edge)).sort();
  const dark = [...mechanical].filter((edge) => !authoredEdges.has(edge)).sort();
  const aspirational = [...authoredEdges].filter((edge) => !mechanical.has(edge)).sort();
  const union = new Set([...mechanical, ...authoredEdges]).size;
  return {
    mechEdges: mechanical.size,
    authEdges: authoredEdges.size,
    shared,
    dark,
    aspirational,
    jaccard: union === 0 ? 100 : Math.round((shared.length / union) * 100),
  };
}
