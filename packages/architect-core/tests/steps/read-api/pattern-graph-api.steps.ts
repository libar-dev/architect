import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { computeNeighborhood } from '../../../src/read-api/architecture-inspection.js';
import { createPatternGraphAPI } from '../../../src/read-api/pattern-graph-api.js';
import type { PatternGraphAPI } from '../../../src/read-api/pattern-graph-api.js';
import { getRelationshipsForPattern } from '../../../src/read-api/pattern-helpers.js';
import type { ProvenancedRule } from '../../../src/read-api/rule-aggregation.js';
import type {
  BusinessRuleRef,
  DependencyContext,
  DependencyContextNode,
  PatternDependencies,
  PatternRelationships,
} from '../../../src/read-api/types.js';
import { transformToPatternGraph } from '../../../src/generators/pipeline/transform-dataset.js';
import type { RawDataset } from '../../../src/generators/pipeline/transform-types.js';
import { createPackageResolver } from '../../../src/package/package-resolver.js';
import { ExtractedPatternSchema } from '../../../src/validation-schemas/extracted-pattern.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/extracted-pattern.js';
import {
  PatternGraphSchema,
  type PatternGraph,
  type RelationshipEntry,
} from '../../../src/validation-schemas/pattern-graph.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';

const feature = await loadFeature('tests/features/read-api/pattern-graph-api.feature');

const FEATURE_FILE = 'packages/architect-core/tests/features/widget-feature.feature';

interface State {
  graph: PatternGraph | null;
  relationships: PatternRelationships | null;
  dependencies: PatternDependencies | null;
  neighborhoodUsedBy: readonly string[] | null;
  neighborhoodEnables: readonly string[] | null;
  foreignPattern: ExtractedPattern | null;
  invariantError: string | null;
  api: PatternGraphAPI | null;
  dependencyContext: DependencyContext | undefined;
  rules: readonly ProvenancedRule[] | null;
  decisionRules: readonly BusinessRuleRef[] | null;
  decisionPatterns: readonly string[] | null;
  packages: readonly string[] | null;
}

let state: State;

interface BuildPatternSpec {
  readonly name: string;
  readonly sourceFile?: string;
  readonly uses?: readonly string[];
  readonly implementsPatterns?: readonly string[];
  readonly enforcesDecisions?: readonly string[];
  readonly rules?: readonly string[];
}

function hashPatternId(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `pattern-${hash.toString(16).padStart(8, '0').slice(0, 8)}`;
}

function makeBuildPattern(spec: BuildPatternSpec): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id: hashPatternId(spec.name),
    name: spec.name,
    patternName: spec.name,
    directive: {
      tags: [`@architect-pattern:${spec.name}`],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
      patternName: spec.name,
    },
    code: '',
    source: {
      file: spec.sourceFile ?? `packages/architect-core/src/${spec.name.toLowerCase()}.ts`,
      lines: [1, 1],
    },
    exports: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    ...(spec.uses !== undefined ? { uses: [...spec.uses] } : {}),
    ...(spec.implementsPatterns !== undefined
      ? { implementsPatterns: [...spec.implementsPatterns] }
      : {}),
    ...(spec.enforcesDecisions !== undefined
      ? { enforcesDecisions: [...spec.enforcesDecisions] }
      : {}),
    ...(spec.rules !== undefined
      ? {
          rules: spec.rules.map((ruleName) => ({
            name: ruleName,
            description: '',
            scenarioCount: 0,
            scenarioNames: [],
          })),
        }
      : {}),
  });
}

function buildPipelineApi(
  specs: readonly BuildPatternSpec[],
  resolver?: ReturnType<typeof createPackageResolver>,
): PatternGraphAPI {
  const raw: RawDataset = {
    patterns: specs.map(makeBuildPattern),
    tagRegistry: createDefaultTagRegistry(),
  };
  return createPatternGraphAPI(
    resolver !== undefined ? transformToPatternGraph(raw, resolver) : transformToPatternGraph(raw),
  );
}

function requireApi(): PatternGraphAPI {
  if (state.api === null) throw new Error('api not built');
  return state.api;
}

function requireDependencyContext(): DependencyContext {
  if (state.dependencyContext === undefined) throw new Error('dependency context not read');
  return state.dependencyContext;
}

function nodeNames(nodes: readonly DependencyContextNode[]): string[] {
  return nodes.map((node) => node.name);
}

function findNode(
  nodes: readonly DependencyContextNode[],
  name: string,
): DependencyContextNode | undefined {
  for (const node of nodes) {
    if (node.name === name) return node;
    const nested = findNode(node.children, name);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function hasRepeatedNameAlongAnyPath(
  nodes: readonly DependencyContextNode[],
  seen: ReadonlySet<string>,
): boolean {
  for (const node of nodes) {
    if (seen.has(node.name)) return true;
    if (hasRepeatedNameAlongAnyPath(node.children, new Set([...seen, node.name]))) return true;
  }
  return false;
}

function makePatternId(name: string): string {
  if (name === 'AlphaCore') return 'pattern-0000000a';
  if (name === 'BetaCore') return 'pattern-0000000b';
  return 'pattern-0000000f';
}

function makePattern(
  name: string,
  sourceFile: string,
  uses: readonly string[] = [],
): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id: makePatternId(name),
    name,
    patternName: name,
    directive: {
      tags: [`@architect-pattern:${name}`],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
      patternName: name,
    },
    code: '',
    source: { file: sourceFile, lines: [1, 1] },
    exports: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    uses: [...uses],
  });
}

function makeGraph(patterns: ExtractedPattern[]): PatternGraph {
  const graph: PatternGraph = {
    patterns,
    tagRegistry: createDefaultTagRegistry(),
    byStatus: { candidate: [], roadmap: [], active: patterns, completed: [], deferred: [] },
    byNormalizedStatus: { completed: [], active: patterns, planned: [], candidate: [] },
    byMaturity: {},
    byRole: {},
    bySourceType: { typescript: patterns, gherkin: [], roadmap: [], prd: [] },
    byProductArea: {},
    counts: {
      completed: 0,
      active: patterns.length,
      planned: 0,
      candidate: 0,
      total: patterns.length,
    },
    roleCount: 0,
    relationshipIndex: buildRelationshipIndex(patterns),
  };

  PatternGraphSchema.parse(graph);
  return graph;
}

function buildRelationshipIndex(
  patterns: readonly ExtractedPattern[],
): Record<string, RelationshipEntry> {
  const index: Record<string, RelationshipEntry> = {};

  for (const pattern of patterns) {
    const patternName = pattern.patternName ?? pattern.name;
    const uses = [...(pattern.uses ?? [])];
    index[patternName] = {
      uses,
      usedBy: [],
      dependsOn: uses,
      enables: [],
      implementsPatterns: [],
      implementedBy: [],
      extendedBy: [],
      seeAlso: [],
      apiRef: [],
      enforcesDecisions: [],
      enforcedBy: [],
    };
  }

  for (const pattern of patterns) {
    const patternName = pattern.patternName ?? pattern.name;
    for (const target of pattern.uses ?? []) {
      const targetEntry = index[target];
      if (targetEntry !== undefined) {
        targetEntry.usedBy.push(patternName);
        targetEntry.enables.push(patternName);
      }
    }
  }

  return index;
}

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a synthetic graph where "AlphaCore" uses "BetaCore"', () => {
      state = {
        graph: makeGraph([
          makePattern('AlphaCore', 'packages/architect-core/src/alpha.ts', ['BetaCore']),
          makePattern('BetaCore', 'packages/architect-core/src/beta.ts'),
        ]),
        relationships: null,
        dependencies: null,
        neighborhoodUsedBy: null,
        neighborhoodEnables: null,
        foreignPattern: null,
        invariantError: null,
        api: null,
        dependencyContext: undefined,
        rules: null,
        decisionRules: null,
        decisionPatterns: null,
        packages: null,
      };
    });
  });

  Rule('Canonical relationship index resolves reverse lookups', ({ RuleScenario }) => {
    RuleScenario(
      'Reverse relationships read from the canonical relationship index',
      ({ Given, When, Then, And }) => {
        Given('the graph includes the canonical relationship index', () => {
          state.graph = makeGraph(state.graph!.patterns);
        });

        When('I query pattern relationships for "BetaCore"', () => {
          state.relationships =
            createPatternGraphAPI(state.graph!).getPatternRelationships('BetaCore') ?? null;
        });

        Then('the relationships field "usedBy" contains "AlphaCore"', () => {
          expect(state.relationships?.usedBy).toContain('AlphaCore');
        });

        And('the relationships field "enables" contains "AlphaCore"', () => {
          expect(state.relationships?.enables).toContain('AlphaCore');
        });
      },
    );
  });

  Rule('Dependency queries reuse the same canonical relationship index', ({ RuleScenario }) => {
    RuleScenario(
      'Reverse relationships stay canonical through dependency queries',
      ({ Given, When, Then, And }) => {
        Given('the graph includes the canonical relationship index', () => {
          state.graph = makeGraph(state.graph!.patterns);
        });

        When('I query pattern dependencies for "BetaCore"', () => {
          state.dependencies =
            createPatternGraphAPI(state.graph!).getPatternDependencies('BetaCore') ?? null;
        });

        Then('the dependencies field "usedBy" contains "AlphaCore"', () => {
          expect(state.dependencies?.usedBy).toContain('AlphaCore');
        });

        And('the dependencies field "enables" contains "AlphaCore"', () => {
          expect(state.dependencies?.enables).toContain('AlphaCore');
        });
      },
    );
  });

  Rule('Shared read-api helpers fail loudly for missing canonical entries', ({ RuleScenario }) => {
    RuleScenario(
      'Foreign patterns trigger the canonical relationship invariant',
      ({ Given, When, Then }) => {
        Given('a foreign pattern named {string}', (_ctx: unknown, name: string) => {
          state.foreignPattern = makePattern(name, 'packages/architect-core/src/ghost.ts');
        });

        When('I resolve relationships for that foreign pattern through the shared helper', () => {
          let errorMessage: string | null = null;
          try {
            getRelationshipsForPattern(state.graph!, state.foreignPattern!);
          } catch (error) {
            errorMessage = error instanceof Error ? error.message : String(error);
          }

          state.invariantError = errorMessage;
        });

        Then('the invariant error equals {string}', (_ctx: unknown, message: string) => {
          expect(state.invariantError).toBe(message);
        });
      },
    );
  });

  Rule('Neighbor queries reuse the shared canonical relationship seam', ({ RuleScenario }) => {
    RuleScenario(
      'Neighborhood lookup reads the canonical relationship index',
      ({ Given, When, Then, And }) => {
        Given('the graph includes the canonical relationship index', () => {
          state.graph = makeGraph(state.graph!.patterns);
        });

        When('I compute the neighborhood for {string}', (_ctx: unknown, name: string) => {
          const neighborhood = computeNeighborhood(name, state.graph!);
          state.neighborhoodUsedBy = neighborhood?.usedBy.map((entry) => entry.name) ?? null;
          state.neighborhoodEnables = neighborhood?.enables.map((entry) => entry.name) ?? null;
        });

        Then(
          'the neighborhood field {string} contains {string}',
          (_ctx: unknown, field: string, value: string) => {
            const collection =
              field === 'usedBy' ? state.neighborhoodUsedBy : state.neighborhoodEnables;
            expect(collection).toContain(value);
          },
        );

        And(
          'the neighborhood field {string} contains {string}',
          (_ctx: unknown, field: string, value: string) => {
            const collection =
              field === 'usedBy' ? state.neighborhoodUsedBy : state.neighborhoodEnables;
            expect(collection).toContain(value);
          },
        );
      },
    );
  });

  Rule('Dependency context reports bidirectional transitive closure', ({ RuleScenario }) => {
    // "Leaf" -> "Mid" -> "Root": Leaf uses Mid, Mid uses Root. Upstream of a
    // node closes over dependsOn∪uses (prerequisites); downstream closes over
    // usedBy∪enables (blast radius).
    function buildChain(): void {
      state.api = buildPipelineApi([
        { name: 'Leaf', uses: ['Mid'] },
        { name: 'Mid', uses: ['Root'] },
        { name: 'Root' },
      ]);
    }

    RuleScenario(
      'Upstream and downstream forests are reported off one focal pattern',
      ({ Given, When, Then, And }) => {
        Given(
          'a pipeline-built graph with the dependency chain {string} -> {string} -> {string}',
          () => {
            buildChain();
          },
        );
        When('I read the dependency context for {string}', (_ctx: unknown, name: string) => {
          state.dependencyContext = requireApi().getDependencyContext(name);
        });
        Then('the focal pattern is {string}', (_ctx: unknown, name: string) => {
          expect(requireDependencyContext().focal).toBe(name);
        });
        And('the upstream forest direct children are {string}', (_ctx: unknown, names: string) => {
          expect(nodeNames(requireDependencyContext().upstream)).toEqual([names]);
        });
        And(
          'the downstream forest direct children are {string}',
          (_ctx: unknown, names: string) => {
            expect(nodeNames(requireDependencyContext().downstream)).toEqual([names]);
          },
        );
        And('the upstream summary direct count is {number}', (_ctx: unknown, count: number) => {
          expect(requireDependencyContext().summary.upstreamDirect).toBe(count);
        });
        And('the downstream summary direct count is {number}', (_ctx: unknown, count: number) => {
          expect(requireDependencyContext().summary.downstreamDirect).toBe(count);
        });
      },
    );

    RuleScenario(
      'Transitive prerequisites are summarized beyond the direct ring',
      ({ Given, When, Then, And }) => {
        Given(
          'a pipeline-built graph with the dependency chain {string} -> {string} -> {string}',
          () => {
            buildChain();
          },
        );
        When('I read the dependency context for {string}', (_ctx: unknown, name: string) => {
          state.dependencyContext = requireApi().getDependencyContext(name);
        });
        Then('the upstream summary direct count is {number}', (_ctx: unknown, count: number) => {
          expect(requireDependencyContext().summary.upstreamDirect).toBe(count);
        });
        And('the upstream summary transitive count is {number}', (_ctx: unknown, count: number) => {
          expect(requireDependencyContext().summary.upstreamTransitive).toBe(count);
        });
      },
    );

    RuleScenario('The walk is cycle-safe on a cyclic graph', ({ Given, When, Then, And }) => {
      Given(
        'a pipeline-built graph with the dependency cycle {string} uses {string} uses {string}',
        () => {
          state.api = buildPipelineApi([
            { name: 'Ouro', uses: ['Boros'] },
            { name: 'Boros', uses: ['Ouro'] },
          ]);
        },
      );
      When('I read the dependency context for {string}', (_ctx: unknown, name: string) => {
        state.dependencyContext = requireApi().getDependencyContext(name);
      });
      Then('a dependency context is returned', () => {
        expect(state.dependencyContext).toBeDefined();
      });
      And('no upstream node name appears twice along any path', () => {
        expect(hasRepeatedNameAlongAnyPath(requireDependencyContext().upstream, new Set())).toBe(
          false,
        );
      });
    });

    RuleScenario(
      'The depth cap truncates and flags the boundary node',
      ({ Given, When, Then, And }) => {
        Given(
          'a pipeline-built graph with the dependency chain {string} -> {string} -> {string}',
          () => {
            buildChain();
          },
        );
        When(
          'I read the dependency context for {string} with max depth {number}',
          (_ctx: unknown, name: string, depth: number) => {
            state.dependencyContext = requireApi().getDependencyContext(name, { maxDepth: depth });
          },
        );
        Then('the upstream forest direct children are {string}', (_ctx: unknown, names: string) => {
          expect(nodeNames(requireDependencyContext().upstream)).toEqual([names]);
        });
        And('the upstream boundary node {string} is truncated', (_ctx: unknown, name: string) => {
          const node = findNode(requireDependencyContext().upstream, name);
          expect(node?.truncated).toBe(true);
        });
        And(
          'the upstream boundary node {string} has no children',
          (_ctx: unknown, name: string) => {
            const node = findNode(requireDependencyContext().upstream, name);
            expect(node?.children).toEqual([]);
          },
        );
      },
    );

    RuleScenario('An unknown pattern yields no dependency context', ({ Given, When, Then }) => {
      Given(
        'a pipeline-built graph with the dependency chain {string} -> {string} -> {string}',
        () => {
          buildChain();
        },
      );
      When('I read the dependency context for {string}', (_ctx: unknown, name: string) => {
        state.dependencyContext = requireApi().getDependencyContext(name);
      });
      Then('no dependency context is returned', () => {
        expect(state.dependencyContext).toBeUndefined();
      });
    });
  });

  Rule(
    'Rules reverse-trace from a TypeScript pattern through its implementers',
    ({ RuleScenario }) => {
      RuleScenario(
        "A TypeScript pattern surfaces its implementing feature's rules with provenance",
        ({ Given, When, Then, And }) => {
          Given(
            'a pipeline-built graph where feature {string} implements TypeScript pattern {string} and owns rule {string}',
            (_ctx: unknown, featureName: string, tsName: string, ruleName: string) => {
              state.api = buildPipelineApi([
                { name: tsName },
                {
                  name: featureName,
                  sourceFile: FEATURE_FILE,
                  implementsPatterns: [tsName],
                  rules: [ruleName],
                },
              ]);
            },
          );
          When('I read the rules for {string}', (_ctx: unknown, name: string) => {
            state.rules = requireApi().getRulesForPattern(name);
          });
          Then('a rule named {string} is returned', (_ctx: unknown, ruleName: string) => {
            const names = (state.rules ?? []).map((entry) => entry.rule.name);
            expect(names).toContain(ruleName);
          });
          And('that rule is sourced from pattern {string}', (_ctx: unknown, source: string) => {
            const entry = (state.rules ?? []).find(
              (candidate) => candidate.sourcePattern === source,
            );
            expect(entry).toBeDefined();
          });
          And("that rule's source file is the feature file", () => {
            const entry = (state.rules ?? [])[0];
            expect(entry?.sourceFile).toBe(FEATURE_FILE);
          });
        },
      );
    },
  );

  Rule(
    'Decision-scoped rule and pattern lookups resolve through enforcedBy',
    ({ RuleScenario }) => {
      RuleScenario(
        'A rule-owning pattern surfaces under the decision it enforces',
        ({ Given, When, Then, And }) => {
          Given(
            'a pipeline-built graph where pattern {string} enforces decision {string} and owns rule {string}',
            (_ctx: unknown, patternName: string, decision: string, ruleName: string) => {
              state.api = buildPipelineApi([
                { name: decision },
                {
                  name: patternName,
                  enforcesDecisions: [decision],
                  rules: [ruleName],
                },
              ]);
            },
          );
          When('I read the patterns for decision {string}', (_ctx: unknown, decision: string) => {
            state.decisionPatterns = requireApi().getPatternsByDecision(decision);
          });
          Then('the decision patterns include {string}', (_ctx: unknown, name: string) => {
            expect(state.decisionPatterns ?? []).toContain(name);
          });
          When('I read the rules for decision {string}', (_ctx: unknown, decision: string) => {
            state.decisionRules = requireApi().getRulesByDecision(decision);
          });
          Then('a decision rule named {string} is returned', (_ctx: unknown, ruleName: string) => {
            const names = (state.decisionRules ?? []).map((entry) => entry.ruleName);
            expect(names).toContain(ruleName);
          });
          And('that decision rule is owned by pattern {string}', (_ctx: unknown, owner: string) => {
            const owners = (state.decisionRules ?? []).map((entry) => entry.pattern);
            expect(owners).toContain(owner);
          });
        },
      );
    },
  );

  Rule('Package keys are reported distinct and sorted', ({ RuleScenario }) => {
    RuleScenario('Packages are reported as distinct sorted keys', ({ Given, When, Then }) => {
      Given(
        'a pipeline-built graph resolving patterns into packages {string} and {string}',
        (_ctx: unknown, first: string, second: string) => {
          const resolver = createPackageResolver([
            { id: first, displayName: first, match: `packages/${first}/` },
            { id: second, displayName: second, match: `packages/${second}/` },
          ]);
          state.api = buildPipelineApi(
            [
              { name: 'CoreA', sourceFile: `packages/${first}/src/core-a.ts` },
              { name: 'CoreB', sourceFile: `packages/${first}/src/core-b.ts` },
              { name: 'CliA', sourceFile: `packages/${second}/src/cli-a.ts` },
            ],
            resolver,
          );
        },
      );
      When('I list the packages', () => {
        state.packages = requireApi().listPackages();
      });
      Then('the package list is exactly {string}', (_ctx: unknown, csv: string) => {
        const expected = csv.split(',').map((item) => item.trim());
        expect([...(state.packages ?? [])]).toEqual(expected);
      });
    });
  });
});
