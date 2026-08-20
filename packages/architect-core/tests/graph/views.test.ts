import {
  AuthoredCoreSchema,
  MechanicalCoreSchema,
  createGraph,
} from '@libar-dev/architect-core/graph';
import { describe, expect, it } from 'vitest';

import {
  FEATURE_FILES,
  createDanglingPatternGraphFixture,
  createEmptyMechanicalFixture,
  createEmptyPatternGraphFixture,
  createMechanicalViewsFixture,
  createPatternGraphViewsFixture,
} from './views-fixture.js';

function graph() {
  return createGraph(createPatternGraphViewsFixture(), createMechanicalViewsFixture());
}

describe('core Graph trusted views', () => {
  it('returns stable entry-adapter results for concepts, files, and symbols', () => {
    // Given
    const view = graph();

    // When
    const concept = view.findByConcept('query');
    const mapped = view.byFile('packages/sample/src/core-view.ts');
    const dark = view.byFile('packages/sample/src/dark.ts');
    const missing = view.byFile('packages/sample/src/missing.ts');
    const shared = view.bySymbol('SharedExport');

    // Then
    expect(view.findByConcept('   ')).toEqual([]);
    expect(concept.map((hit) => hit.name)).toEqual([
      'CoreView',
      'UtilityView',
      'AuthoredSpecs',
      'ExecutableSpecs',
    ]);
    expect(mapped).toEqual({
      file: 'packages/sample/src/core-view.ts',
      mapped: true,
      pattern: 'CoreView',
      role: 'service',
      curated: { uses: ['AuthoredSpecs', 'UtilityView'], usedBy: [], implementedBy: FEATURE_FILES },
      mechanical: {
        imports: [
          { file: 'packages/sample/src/dark.ts' },
          { file: 'packages/sample/src/utility-view.ts', pattern: 'UtilityView' },
        ],
        importedBy: [
          { file: 'packages/sample/src/dark.ts' },
          { file: 'packages/sample/src/utility-view.ts', pattern: 'UtilityView' },
        ],
      },
    });
    expect(dark).toEqual({
      file: 'packages/sample/src/dark.ts',
      mapped: false,
      mechanical: {
        imports: [{ file: 'packages/sample/src/core-view.ts', pattern: 'CoreView' }],
        importedBy: [
          { file: 'packages/sample/src/consumer.ts' },
          { file: 'packages/sample/src/core-view.ts', pattern: 'CoreView' },
          { file: 'packages/sample/src/utility-view.ts', pattern: 'UtilityView' },
        ],
      },
    });
    expect(missing).toEqual({
      file: 'packages/sample/src/missing.ts',
      mapped: false,
      mechanical: { imports: [], importedBy: [] },
    });
    expect(shared.definedIn.map((definition) => definition.file)).toEqual([
      'packages/sample/src/core-view.ts',
      'packages/sample/src/utility-view.ts',
    ]);
    expect(shared.importedByFiles).toEqual([
      'packages/sample/src/dark.ts',
      'packages/sample/src/utility-view.ts',
    ]);
    expect(view.bySymbol('MissingExport')).toEqual({
      symbol: 'MissingExport',
      definedIn: [],
      importedByFiles: [],
      importedByPatterns: [],
    });
  });

  it('labels executable and authored cohort invariants and specs exactly', () => {
    // Given
    const view = graph();

    // When
    const invariants = view.invariantsOf('CoreView');
    const specs = view.specsReverifying(['CoreView']);

    // Then
    expect(
      invariants.map(({ rule, maturity, provenance, cohort }) => ({
        rule,
        maturity,
        provenance,
        cohort,
      })),
    ).toEqual([
      {
        rule: 'Planned rule',
        maturity: 'plan',
        provenance: 'authored',
        cohort: ['CoreView', 'UtilityView'],
      },
      {
        rule: 'Shared rule',
        maturity: 'executable',
        provenance: 'executable',
        cohort: ['CoreView', 'UtilityView'],
      },
    ]);
    expect(
      specs.map(({ scenario, maturity, provenance, cohort }) => ({
        scenario,
        maturity,
        provenance,
        cohort,
      })),
    ).toEqual([
      {
        scenario: 'Authored scenario',
        maturity: 'plan',
        provenance: 'authored',
        cohort: ['CoreView', 'UtilityView'],
      },
      {
        scenario: 'Executable scenario',
        maturity: 'executable',
        provenance: 'executable',
        cohort: ['CoreView', 'UtilityView'],
      },
    ]);
  });

  it('walks impact cycles and excludes feature-file seeds', () => {
    // Given
    const view = graph();

    // When
    const impact = view.blastRadius([
      'packages/sample/src/core-view.ts',
      'packages/sample/tests/features/cohort.feature',
    ]);
    const featureOnly = view.blastRadius(['packages/sample/tests/features/cohort.feature']);

    // Then
    expect(impact.changedSrc).toEqual(['packages/sample/src/core-view.ts']);
    expect(impact.mechPatterns).toEqual(['CoreView', 'UtilityView']);
    expect(impact.recovered).toEqual(['UtilityView']);
    expect(impact.atRiskFeatureFiles).toEqual(FEATURE_FILES);
    expect(impact.atRiskSpecs.map((spec) => spec.scenario)).toEqual([
      'Authored scenario',
      'Executable scenario',
    ]);
    expect(featureOnly).toEqual({
      changedSrc: [],
      mappedSeed: [],
      authoredDownstream: [],
      mechFiles: 0,
      mechPatterns: [],
      recovered: [],
      atRiskFeatureFiles: [],
      atRiskSpecs: [],
    });
  });

  it('reports fan-in, drift, census, and graph partitions deterministically', () => {
    // Given
    const view = graph();
    const dangling = createGraph(
      createDanglingPatternGraphFixture(),
      createMechanicalViewsFixture(),
    );

    // When
    const candidates = view.fanInCandidates({ min: 2 });
    const diff = view.graphDiff();
    const drift = dangling.driftFlags((file) => file !== 'packages/sample/src/utility-view.ts');
    const census = view.census();

    // Then
    expect(candidates).toEqual([
      { file: 'packages/sample/src/dark.ts', fanIn: 3, pkg: 'sample', annotated: false },
    ]);
    expect(candidates.some((candidate) => candidate.file.endsWith('/index.ts'))).toBe(false);
    expect(diff).toEqual({
      mechEdges: 2,
      authEdges: 2,
      shared: ['CoreView→UtilityView'],
      dark: ['UtilityView→CoreView'],
      aspirational: ['CoreView→AuthoredSpecs'],
      jaccard: 33,
    });
    expect(drift).toEqual({
      dangling: [{ from: 'CoreView', to: 'MissingPattern' }],
      orphanedSource: [{ pattern: 'UtilityView', file: 'packages/sample/src/utility-view.ts' }],
    });
    expect(census.nodeCoverage).toEqual([
      { pkg: 'empty', mapped: 0, total: 0, pct: 0 },
      { pkg: 'sample', mapped: 2, total: 3, pct: 67 },
    ]);
    expect(census).toEqual({
      nodeCoverage: census.nodeCoverage,
      edgeDensity: { uses: 1, usedBy: 1, implementedBy: 2 },
      edgeDark: 2,
      patternCount: 4,
    });
    expect(
      [
        diff.mechEdges,
        diff.authEdges,
        diff.jaccard,
        census.edgeDark,
        census.patternCount,
        ...census.nodeCoverage.flatMap((entry) => [entry.mapped, entry.total, entry.pct]),
      ].every(Number.isFinite),
    ).toBe(true);
  });

  it('defines empty graph diff as exact Jaccard 100 with finite fields', () => {
    // Given
    const view = createGraph(createEmptyPatternGraphFixture(), createEmptyMechanicalFixture());

    // When
    const diff = view.graphDiff();

    // Then
    expect(diff).toEqual({
      mechEdges: 0,
      authEdges: 0,
      shared: [],
      dark: [],
      aspirational: [],
      jaccard: 100,
    });
    expect(Number.isFinite(diff.jaccard)).toBe(true);
  });

  it('rejects malformed decoded authored and mechanical fixtures', () => {
    // Given
    const malformedMechanical = { ...createMechanicalViewsFixture(), edges: 'not-an-array' };
    const malformedAuthored = { patterns: [], relationshipIndex: { Broken: { uses: 1 } } };

    // When / Then
    expect(() => MechanicalCoreSchema.parse(malformedMechanical)).toThrow();
    expect(() => AuthoredCoreSchema.parse(malformedAuthored)).toThrow();
  });

  it('freezes generated views and keeps fresh Graph state after attempted mutation', () => {
    // Given
    const first = graph();
    const result = first.findByConcept('query');
    const firstHit = result.at(0);
    if (firstHit === undefined) {
      throw new TypeError('Concept fixture returned no hits');
    }

    // When
    const itemChanged = Reflect.set(firstHit, 'name', 'Mutated');
    const arrayChanged = Reflect.set(result, '0', { ...firstHit, name: 'Mutated' });
    const second = graph();

    // Then
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(firstHit)).toBe(true);
    expect(itemChanged).toBe(false);
    expect(arrayChanged).toBe(false);
    expect(second.findByConcept('query').map((hit) => hit.name)).toEqual([
      'CoreView',
      'UtilityView',
      'AuthoredSpecs',
      'ExecutableSpecs',
    ]);
  });
});
