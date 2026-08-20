import { inferMaturity } from '../taxonomy/maturity-values.js';
import type { PatternGraph } from '../validation-schemas/pattern-graph.js';
import {
  getProtectionSummary,
  getValidTransitionsFrom,
  isValidTransition,
  validateTransition,
} from '../validation/fsm/index.js';
import {
  AuthoredCoreSchema,
  type AuthoredCore,
  type MechanicalCore,
  type PatternNode,
} from './schema.js';
import {
  blastRadius as blastRadiusView,
  census as censusView,
  driftFlags as driftFlagsView,
  fanInCandidates as fanInCandidatesView,
} from './analysis-views.js';
import { createSpecBridge, type SpecBridge } from './spec-bridge.js';
import {
  byFile as byFileView,
  bySymbol as bySymbolView,
  findByConcept as findByConceptView,
  graphDiff as graphDiffView,
  type FanInOptions,
} from './views.js';

export interface FsmKernel {
  readonly isValidTransition: typeof isValidTransition;
  readonly validateTransition: typeof validateTransition;
  readonly getValidTransitionsFrom: typeof getValidTransitionsFrom;
  readonly getProtectionSummary: typeof getProtectionSummary;
}

function deepFreeze<T>(
  value: T,
  seen: WeakSet<object> = new WeakSet<object & Record<never, never>>(),
): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }

  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && 'value' in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
}

const FSM_KERNEL = {
  isValidTransition,
  validateTransition: (from, to) => deepFreeze(validateTransition(from, to)),
  getValidTransitionsFrom: (status) => deepFreeze([...getValidTransitionsFrom(status)]),
  getProtectionSummary: (status, options) => deepFreeze(getProtectionSummary(status, options)),
} satisfies FsmKernel;

function tagValue(tags: readonly string[], prefix: string): string | undefined {
  for (const tag of tags) {
    if (tag.startsWith(prefix)) {
      return tag.slice(prefix.length);
    }
  }
  return undefined;
}

/**
 * Pure, frozen graph handle over caller-supplied canonical and mechanical values.
 * Construction performs no source, config, git, or filesystem IO.
 */
export class Graph {
  readonly graph: PatternGraph;
  readonly fsm: FsmKernel;
  readonly authored: AuthoredCore;
  readonly mech: MechanicalCore;
  readonly patterns: readonly PatternNode[];

  readonly #nodes: ReadonlyMap<string, PatternNode>;
  readonly #fileToPattern: ReadonlyMap<string, string>;
  readonly #specBridge: SpecBridge;

  constructor(graph: PatternGraph, mechanical: MechanicalCore) {
    const authored = AuthoredCoreSchema.parse({
      patterns: graph.patterns,
      relationshipIndex: graph.relationshipIndex,
    });
    const childrenByParent = new Map<string, string[]>();
    for (const pattern of authored.patterns) {
      if (pattern.parent === undefined) {
        continue;
      }
      const children = childrenByParent.get(pattern.parent) ?? [];
      children.push(pattern.name);
      childrenByParent.set(pattern.parent, children);
    }

    const nodes = new Map<string, PatternNode>();
    const fileToPattern = new Map<string, string>();
    for (const pattern of authored.patterns) {
      const tags = pattern.directive?.tags ?? [];
      const relationship = authored.relationshipIndex[pattern.name];
      const implementedBy = (relationship?.implementedBy ?? [])
        .map((implementation) => implementation.file)
        .filter((file): file is string => file?.endsWith('.feature') === true);
      const sourceFile = pattern.source?.file;
      const node: PatternNode = {
        name: pattern.name,
        status: pattern.status,
        maturity: inferMaturity(pattern.status, tagValue(tags, '@architect-maturity:')),
        role: pattern.role ?? tagValue(tags, '@architect-role:'),
        boundedContext: pattern.boundedContext ?? tagValue(tags, '@architect-bounded-context:'),
        productArea: pattern.productArea,
        sourceFile,
        level: pattern.level ?? tagValue(tags, '@architect-level:'),
        ...(pattern.parent === undefined ? {} : { parent: pattern.parent }),
        children: [...(childrenByParent.get(pattern.name) ?? [])].sort(),
        uses: relationship?.uses ?? [],
        usedBy: relationship?.usedBy ?? [],
        implementedBy,
        implements: relationship?.implementsPatterns ?? [],
        enforcesDecisions: relationship?.enforcesDecisions ?? [],
        ruleCount: pattern.rules.length,
        scenarioCount: pattern.scenarios.length,
      };
      nodes.set(pattern.name, node);
      if (sourceFile?.endsWith('.ts') === true) {
        fileToPattern.set(sourceFile, pattern.name);
      }
    }

    this.graph = deepFreeze(graph);
    this.fsm = deepFreeze(FSM_KERNEL);
    this.authored = deepFreeze(authored);
    this.mech = deepFreeze(mechanical);
    this.patterns = deepFreeze([...nodes.values()]);
    this.#nodes = nodes;
    this.#fileToPattern = fileToPattern;
    this.#specBridge = createSpecBridge(authored, this.patterns);
    Object.freeze(this);
  }

  pattern(name: string): PatternNode | undefined {
    return this.#nodes.get(name);
  }

  fileToPattern(file: string): string | undefined {
    return this.#fileToPattern.get(file);
  }

  findByConcept(query: string, options?: { readonly limit?: number }) {
    return deepFreeze(findByConceptView(this.authored, query, options));
  }

  byFile(filePath: string) {
    return deepFreeze(byFileView(this.authored, this.mech, filePath));
  }

  bySymbol(symbolName: string) {
    return deepFreeze(bySymbolView(this.mech, this.authored, symbolName));
  }

  invariantsOf(patternOrFile: string) {
    return deepFreeze(this.#specBridge.invariantsOf(patternOrFile));
  }

  specsReverifying(filesOrPatterns: readonly string[]) {
    return deepFreeze(this.#specBridge.specsReverifying(filesOrPatterns));
  }

  blastRadius(changedFiles: readonly string[]) {
    const impact = blastRadiusView(this.mech, this.authored, changedFiles);
    const atRiskSpecs = this.#specBridge.specsForPatterns(new Set(impact.mechPatterns));
    return deepFreeze({ ...impact, atRiskSpecs });
  }

  fanInCandidates(options?: FanInOptions) {
    return deepFreeze(fanInCandidatesView(this.mech, this.authored, options));
  }

  graphDiff() {
    return deepFreeze(graphDiffView(this.mech, this.authored));
  }

  driftFlags(existsOnDisk: (file: string) => boolean) {
    return deepFreeze(driftFlagsView(this.authored, existsOnDisk));
  }

  census() {
    return deepFreeze(censusView(this.mech, this.authored));
  }
}

/** Create a pure frozen Graph from already-built canonical and mechanical values. */
export function createGraph(graph: PatternGraph, mechanical: MechanicalCore): Graph {
  return new Graph(graph, mechanical);
}
