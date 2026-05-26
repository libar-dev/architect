import type {
  ExtractedPattern,
  PatternGraph,
  RelationshipEntry,
  TagRegistry,
} from '@libar-dev/architect-core';
import {
  inferMaturity,
  isPatternActive,
  isPatternComplete,
  isPatternPlanned,
} from '@libar-dev/architect-core';

type PatternMaturity = 'idea' | 'plan' | 'design' | 'executable';

type FixtureCompatibilityFields = {
  readonly maturity?: PatternMaturity;
  readonly dependsOn?: readonly string[];
  readonly usedBy?: readonly string[];
  readonly enables?: readonly string[];
};

export interface BusinessRuleStubOptions {
  readonly name: string;
  readonly description: string;
  readonly scenarioNames: readonly string[];
  readonly scenarioCount: number;
}

export interface PatternStubOptions {
  readonly patternName?: string;
  readonly title?: string;
  readonly status?: ExtractedPattern['status'];
  readonly maturity?: PatternMaturity;
  readonly role?: ExtractedPattern['role'];
  readonly phase?: ExtractedPattern['phase'];
  readonly quarter?: ExtractedPattern['quarter'];
  readonly release?: ExtractedPattern['release'];
  readonly completed?: ExtractedPattern['completed'];
  readonly file?: string;
  readonly description?: string;
  readonly boundedContext?: ExtractedPattern['boundedContext'];
  readonly adrLayer?: ExtractedPattern['adrLayer'];
  readonly archContext?: string;
  readonly archLayer?: string;
  readonly productArea?: ExtractedPattern['productArea'];
  readonly userRole?: ExtractedPattern['userRole'];
  readonly businessValue?: ExtractedPattern['businessValue'];
  readonly team?: ExtractedPattern['team'];
  readonly effort?: ExtractedPattern['effort'];
  readonly effortActual?: ExtractedPattern['effortActual'];
  readonly priority?: ExtractedPattern['priority'];
  readonly deliverables?: ExtractedPattern['deliverables'];
  readonly executableSpecs?: ExtractedPattern['executableSpecs'];
  readonly behaviorFile?: ExtractedPattern['behaviorFile'];
  readonly targetPath?: ExtractedPattern['targetPath'];
  readonly dependsOn?: readonly string[];
  readonly uses?: ExtractedPattern['uses'];
  readonly usedBy?: readonly string[];
  readonly enables?: readonly string[];
  readonly implementsPatterns?: ExtractedPattern['implementsPatterns'];
  readonly rules?: readonly BusinessRuleStubOptions[];
  readonly adr?: ExtractedPattern['adr'];
  readonly adrStatus?: ExtractedPattern['adrStatus'];
  readonly adrCategory?: ExtractedPattern['adrCategory'];
  readonly adrSupersedes?: ExtractedPattern['adrSupersedes'];
  readonly adrSupersededBy?: ExtractedPattern['adrSupersededBy'];
  readonly seeAlso?: ExtractedPattern['seeAlso'];
  readonly apiRef?: ExtractedPattern['apiRef'];
  readonly extendsPattern?: ExtractedPattern['extendsPattern'];
  readonly level?: ExtractedPattern['level'];
  readonly parent?: ExtractedPattern['parent'];
  readonly children?: ExtractedPattern['children'];
}

export interface GraphBuilderOptions {
  readonly patterns: readonly ExtractedPattern[];
  readonly tagRegistry: TagRegistry;
  readonly phaseNames?: Record<number, string> | undefined;
  readonly relationshipIndex?: Record<string, RelationshipEntry> | undefined;
  readonly includeArchIndex?: boolean;
}

let nextPatternId = 1;

export function buildBusinessRuleStub(options: BusinessRuleStubOptions): BusinessRuleStubOptions {
  return options;
}

export function buildPatternStub(name: string, options: PatternStubOptions = {}): ExtractedPattern {
  const id = `test-pattern-${nextPatternId.toString(16).padStart(8, '0')}`;
  nextPatternId += 1;

  return {
    id: id as ExtractedPattern['id'],
    name,
    patternName: options.patternName ?? name,
    ...(options.title !== undefined ? { title: options.title } : {}),
    ...(options.role !== undefined ? { role: options.role } : {}),
    directive: {
      description: options.description ?? '',
      tags: [],
    } as unknown as ExtractedPattern['directive'],
    code: '',
    source: {
      file:
        options.file ??
        (options.adr !== undefined
          ? `architect/decisions/adr-${options.adr}.feature`
          : `packages/architect-projection/fixtures/${name}.feature`),
      lines: [1, 200],
    } as unknown as ExtractedPattern['source'],
    exports: [],
    extractedAt: '2026-04-19T00:00:00.000Z',
    status: options.status ?? 'active',
    ...(options.phase !== undefined ? { phase: options.phase } : {}),
    ...(options.quarter !== undefined ? { quarter: options.quarter } : {}),
    ...(options.release !== undefined ? { release: options.release } : {}),
    ...(options.completed !== undefined ? { completed: options.completed } : {}),
    ...(options.boundedContext !== undefined || options.archContext !== undefined
      ? { boundedContext: options.boundedContext ?? options.archContext }
      : {}),
    ...(options.adrLayer !== undefined || options.archLayer !== undefined
      ? { adrLayer: options.adrLayer ?? options.archLayer }
      : {}),
    ...(options.productArea !== undefined ? { productArea: options.productArea } : {}),
    ...(options.userRole !== undefined ? { userRole: options.userRole } : {}),
    ...(options.businessValue !== undefined ? { businessValue: options.businessValue } : {}),
    ...(options.team !== undefined ? { team: options.team } : {}),
    ...(options.effort !== undefined ? { effort: options.effort } : {}),
    ...(options.effortActual !== undefined ? { effortActual: options.effortActual } : {}),
    ...(options.priority !== undefined ? { priority: options.priority } : {}),
    ...(options.deliverables !== undefined ? { deliverables: options.deliverables } : {}),
    ...(options.executableSpecs !== undefined ? { executableSpecs: options.executableSpecs } : {}),
    ...(options.behaviorFile !== undefined ? { behaviorFile: options.behaviorFile } : {}),
    ...(options.targetPath !== undefined ? { targetPath: options.targetPath } : {}),
    ...(options.uses !== undefined ? { uses: options.uses } : {}),
    ...(options.implementsPatterns !== undefined
      ? { implementsPatterns: options.implementsPatterns }
      : {}),
    ...(options.rules !== undefined
      ? {
          rules: options.rules.map((rule) => ({
            name: rule.name,
            description: rule.description,
            scenarioNames: [...rule.scenarioNames],
            scenarioCount: rule.scenarioCount,
          })),
        }
      : {}),
    ...(options.adr !== undefined ? { adr: options.adr } : {}),
    ...(options.adrStatus !== undefined ? { adrStatus: options.adrStatus } : {}),
    ...(options.adrCategory !== undefined ? { adrCategory: options.adrCategory } : {}),
    ...(options.adrSupersedes !== undefined ? { adrSupersedes: options.adrSupersedes } : {}),
    ...(options.adrSupersededBy !== undefined ? { adrSupersededBy: options.adrSupersededBy } : {}),
    ...(options.seeAlso !== undefined ? { seeAlso: options.seeAlso } : {}),
    ...(options.apiRef !== undefined ? { apiRef: options.apiRef } : {}),
    ...(options.extendsPattern !== undefined ? { extendsPattern: options.extendsPattern } : {}),
    ...(options.level !== undefined ? { level: options.level } : {}),
    ...(options.parent !== undefined ? { parent: options.parent } : {}),
    ...(options.children !== undefined ? { children: options.children } : {}),
    ...(options.maturity !== undefined ? { maturity: options.maturity } : {}),
    ...(options.dependsOn !== undefined ? { dependsOn: options.dependsOn } : {}),
    ...(options.usedBy !== undefined ? { usedBy: options.usedBy } : {}),
    ...(options.enables !== undefined ? { enables: options.enables } : {}),
  } as ExtractedPattern;
}

export function buildGraphFromPatterns(options: GraphBuilderOptions): PatternGraph {
  const {
    patterns,
    tagRegistry,
    phaseNames = {},
    relationshipIndex,
    includeArchIndex = false,
  } = options;
  const completed = patterns.filter((pattern) => pattern.status === 'completed');
  const active = patterns.filter((pattern) => pattern.status === 'active');
  const roadmap = patterns.filter((pattern) => pattern.status === 'roadmap');
  const deferred = patterns.filter((pattern) => pattern.status === 'deferred');
  const candidate = patterns.filter((pattern) => pattern.status === 'candidate');
  const phases = patterns
    .map((pattern) => pattern.phase)
    .filter((phase): phase is number => phase !== undefined);
  const roles = patterns
    .map((pattern) => pattern.role)
    .filter((role): role is string => role !== undefined && role.length > 0);

  const byMaturity = buildMaturityGroups(patterns);
  const derivedRelationshipIndex = buildRelationshipIndex(patterns, relationshipIndex);

  return {
    patterns: [...patterns],
    tagRegistry,
    byStatus: {
      candidate: [...candidate],
      roadmap: [...roadmap],
      active: [...active],
      completed: [...completed],
      deferred: [...deferred],
    },
    byNormalizedStatus: {
      completed: [...completed],
      active: [...active],
      planned: [...roadmap, ...deferred],
      candidate: [...candidate],
    },
    byMaturity,
    byPhase: buildPhaseGroups(patterns, phaseNames),
    byQuarter: buildQuarterGroups(patterns),
    byRole: buildRoleGroups(patterns),
    bySourceType: {
      typescript: patterns.filter((pattern) => !pattern.source.file.endsWith('.feature')),
      gherkin: patterns.filter((pattern) => pattern.source.file.endsWith('.feature')),
      roadmap: [],
      prd: patterns.filter(
        (pattern) =>
          pattern.adr === undefined &&
          (pattern.productArea !== undefined ||
            pattern.userRole !== undefined ||
            pattern.businessValue !== undefined),
      ),
    },
    byProductArea: buildProductAreaIndex(patterns),
    counts: {
      completed: patterns.filter((pattern) => isPatternComplete(pattern.status)).length,
      active: patterns.filter((pattern) => isPatternActive(pattern.status)).length,
      planned: patterns.filter((pattern) => isPatternPlanned(pattern.status)).length,
      candidate: patterns.filter((pattern) => pattern.status === 'candidate').length,
      total: patterns.length,
    },
    phaseCount: new Set(phases).size,
    roleCount: new Set(roles).size,
    relationshipIndex: derivedRelationshipIndex,
    ...(includeArchIndex ? { archIndex: createArchIndex(patterns) } : {}),
  } as PatternGraph;
}

function buildMaturityGroups(patterns: readonly ExtractedPattern[]): PatternGraph['byMaturity'] {
  const groups: Record<'idea' | 'plan' | 'design' | 'executable', ExtractedPattern[]> = {
    idea: [],
    plan: [],
    design: [],
    executable: [],
  };

  for (const pattern of patterns) {
    const maturity = inferMaturity(pattern.status, readFixtureCompatibility(pattern).maturity);
    groups[maturity].push(pattern);
  }

  return groups;
}

function buildPhaseGroups(
  patterns: readonly ExtractedPattern[],
  phaseNames: Record<number, string>,
): PatternGraph['byPhase'] {
  const grouped = new Map<number, ExtractedPattern[]>();

  for (const pattern of patterns) {
    if (pattern.phase === undefined) {
      continue;
    }

    const bucket = grouped.get(pattern.phase) ?? [];
    bucket.push(pattern);
    grouped.set(pattern.phase, bucket);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([phaseNumber, phasePatterns]) => ({
      phaseNumber,
      phaseName: phaseNames[phaseNumber],
      patterns: [...phasePatterns],
      counts: {
        completed: phasePatterns.filter((pattern) => isPatternComplete(pattern.status)).length,
        active: phasePatterns.filter((pattern) => isPatternActive(pattern.status)).length,
        planned: phasePatterns.filter((pattern) => isPatternPlanned(pattern.status)).length,
        candidate: phasePatterns.filter((pattern) => pattern.status === 'candidate').length,
        total: phasePatterns.length,
      },
    })) as PatternGraph['byPhase'];
}

function buildQuarterGroups(patterns: readonly ExtractedPattern[]): PatternGraph['byQuarter'] {
  const grouped: Record<string, ExtractedPattern[]> = {};

  for (const pattern of patterns) {
    const quarter = pattern.quarter?.trim();
    if (!quarter) {
      continue;
    }

    const bucket = grouped[quarter] ?? [];
    bucket.push(pattern);
    grouped[quarter] = bucket;
  }

  return grouped;
}

function buildRoleGroups(patterns: readonly ExtractedPattern[]): PatternGraph['byRole'] {
  const grouped: Record<string, ExtractedPattern[]> = {};

  for (const pattern of patterns) {
    const role = pattern.role?.trim();
    if (!role) {
      continue;
    }

    const bucket = grouped[role] ?? [];
    bucket.push(pattern);
    grouped[role] = bucket;
  }

  return grouped;
}

function buildRelationshipIndex(
  patterns: readonly ExtractedPattern[],
  overrides: Record<string, RelationshipEntry> | undefined,
): Record<string, RelationshipEntry> {
  const index: Record<string, RelationshipEntry> = {};

  for (const pattern of patterns) {
    const compatibility = readFixtureCompatibility(pattern);
    const override = overrides?.[getPatternName(pattern)];

    index[getPatternName(pattern)] = {
      uses: override?.uses ?? [...(pattern.uses ?? [])],
      usedBy: override?.usedBy ?? [...(compatibility.usedBy ?? [])],
      dependsOn: override?.dependsOn ?? [...(compatibility.dependsOn ?? pattern.uses ?? [])],
      enables: override?.enables ?? [...(compatibility.enables ?? [])],
      implementsPatterns: override?.implementsPatterns ?? [...(pattern.implementsPatterns ?? [])],
      implementedBy: override?.implementedBy ?? [],
      ...(override?.extendsPattern !== undefined || pattern.extendsPattern !== undefined
        ? { extendsPattern: override?.extendsPattern ?? pattern.extendsPattern }
        : {}),
      extendedBy: override?.extendedBy ?? [],
      seeAlso: override?.seeAlso ?? [...(pattern.seeAlso ?? [])],
      apiRef: override?.apiRef ?? [...(pattern.apiRef ?? [])],
    };
  }

  return index;
}

function createArchIndex(patterns: readonly ExtractedPattern[]): PatternGraph['archIndex'] {
  const byRole: Record<string, ExtractedPattern[]> = {};
  const byContext: Record<string, ExtractedPattern[]> = {};
  const byLayer: Record<string, ExtractedPattern[]> = {};

  for (const pattern of patterns) {
    if (pattern.role !== undefined) {
      const roleBucket = byRole[pattern.role] ?? [];
      roleBucket.push(pattern);
      byRole[pattern.role] = roleBucket;
    }

    if (pattern.boundedContext !== undefined) {
      const contextBucket = byContext[pattern.boundedContext] ?? [];
      contextBucket.push(pattern);
      byContext[pattern.boundedContext] = contextBucket;
    }

    if (pattern.adrLayer !== undefined) {
      const layerBucket = byLayer[pattern.adrLayer] ?? [];
      layerBucket.push(pattern);
      byLayer[pattern.adrLayer] = layerBucket;
    }
  }

  return {
    byRole,
    byContext,
    byLayer,
    byView: {},
    byPackage: {},
    all: [...patterns],
  };
}

function readFixtureCompatibility(pattern: ExtractedPattern): FixtureCompatibilityFields {
  return pattern as ExtractedPattern & FixtureCompatibilityFields;
}

function getPatternName(pattern: ExtractedPattern): string {
  return pattern.patternName ?? pattern.name;
}

function buildProductAreaIndex(
  patterns: readonly ExtractedPattern[],
): PatternGraph['byProductArea'] {
  const grouped: Record<string, ExtractedPattern[]> = {};

  for (const pattern of patterns) {
    const area = pattern.productArea?.trim();
    if (!area) {
      continue;
    }

    const bucket = grouped[area] ?? [];
    bucket.push(pattern);
    grouped[area] = bucket;
  }

  return grouped;
}
