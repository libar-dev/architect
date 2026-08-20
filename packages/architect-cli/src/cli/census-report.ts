import type { Graph, PatternNode } from '@libar-dev/architect-core/graph';

const STRUCTURAL_ROLES = ['contract', 'codec', 'decider', 'read-model'] as const;
type StructuralRole = (typeof STRUCTURAL_ROLES)[number];

type CensusCandidate =
  | {
      readonly category: 'high-fan-in-unmapped';
      readonly rank: number;
      readonly name: string;
      readonly file: string;
      readonly fanIn: number;
    }
  | {
      readonly category: 'edge-dark-structural';
      readonly rank: number;
      readonly name: string;
      readonly file: string;
      readonly fanIn: number;
      readonly role: StructuralRole;
    };

export interface CensusReport {
  readonly candidates: readonly CensusCandidate[];
  readonly nodeCoverage: ReturnType<Graph['census']>['nodeCoverage'];
  readonly edgeDensity: ReturnType<Graph['census']>['edgeDensity'];
  readonly edgeDark: number;
  readonly edgeDarkPercentage: number;
  readonly patternCount: number;
}

function isStructuralRole(role: string | undefined): role is StructuralRole {
  return role !== undefined && STRUCTURAL_ROLES.some((candidate) => candidate === role);
}

function fanInByFile(graph: Graph): ReadonlyMap<string, number> {
  const importers = new Map<string, Set<string>>();
  for (const edge of graph.mech.edges) {
    if (edge.fromFile === edge.toFile) continue;
    const files = importers.get(edge.toFile) ?? new Set<string>();
    files.add(edge.fromFile);
    importers.set(edge.toFile, files);
  }
  return new Map([...importers].map(([file, files]) => [file, files.size]));
}

function isEdgeDarkStructural(pattern: PatternNode): pattern is PatternNode & {
  readonly role: StructuralRole;
  readonly sourceFile: string;
} {
  return (
    isStructuralRole(pattern.role) &&
    pattern.sourceFile?.endsWith('.ts') === true &&
    !pattern.sourceFile.endsWith('/index.ts') &&
    pattern.uses.length === 0 &&
    pattern.usedBy.length === 0 &&
    pattern.implementedBy.length === 0 &&
    pattern.implements.length === 0 &&
    pattern.enforcesDecisions.length === 0 &&
    pattern.children.length === 0
  );
}

function assertNever(value: never): never {
  throw new TypeError(`Unknown census candidate category: ${String(value)}`);
}

export function censusCandidateLine(candidate: CensusCandidate): string {
  switch (candidate.category) {
    case 'high-fan-in-unmapped':
      return `  [${candidate.category}] #${String(candidate.rank)} ${candidate.name} (${String(candidate.fanIn)} importers)`;
    case 'edge-dark-structural':
      return `  [${candidate.category}] #${String(candidate.rank)} ${candidate.name} (${candidate.role}, ${String(candidate.fanIn)} importers)`;
    default:
      return assertNever(candidate);
  }
}

export function buildCensusReport(graph: Graph): CensusReport {
  const census = graph.census();
  const fanIn = fanInByFile(graph);
  const highFanIn = graph.fanInCandidates().map((candidate, index) => ({
    category: 'high-fan-in-unmapped' as const,
    rank: index + 1,
    name: candidate.file,
    file: candidate.file,
    fanIn: candidate.fanIn,
  }));
  const edgeDarkStructural = graph.patterns
    .filter(isEdgeDarkStructural)
    .sort(
      (left, right) =>
        (fanIn.get(right.sourceFile) ?? 0) - (fanIn.get(left.sourceFile) ?? 0) ||
        left.name.localeCompare(right.name),
    )
    .map((pattern, index) => ({
      category: 'edge-dark-structural' as const,
      rank: index + 1,
      name: pattern.name,
      file: pattern.sourceFile,
      fanIn: fanIn.get(pattern.sourceFile) ?? 0,
      role: pattern.role,
    }));

  return {
    candidates: [...highFanIn, ...edgeDarkStructural],
    nodeCoverage: census.nodeCoverage,
    edgeDensity: census.edgeDensity,
    edgeDark: census.edgeDark,
    edgeDarkPercentage: Math.round((census.edgeDark / Math.max(census.patternCount, 1)) * 100),
    patternCount: census.patternCount,
  };
}
