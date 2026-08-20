import { graphDiff } from '@libar-dev/architect-core/graph';
import { describe, expect, it } from 'vitest';

import {
  createCliViewsGraph,
  createMechanicalViewsFixture,
} from '../../support/graph-views-fixture.js';

const FEATURE_FILES = [
  'architect/specs/authored.feature',
  'packages/sample/tests/features/cohort.feature',
] as const;

function graph() {
  return createCliViewsGraph();
}

describe('CLI Graph view characterization', () => {
  it('keeps concept, file, and symbol entry adapters stable and sorted', () => {
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
    expect(shared).toEqual({
      symbol: 'SharedExport',
      definedIn: [
        {
          file: 'packages/sample/src/core-view.ts',
          kind: 'const',
          pkg: 'sample',
          pattern: 'CoreView',
        },
        {
          file: 'packages/sample/src/utility-view.ts',
          kind: 'const',
          pkg: 'sample',
          pattern: 'UtilityView',
        },
      ],
      importedByFiles: ['packages/sample/src/dark.ts', 'packages/sample/src/utility-view.ts'],
      importedByPatterns: ['UtilityView'],
    });
    expect(view.bySymbol('MissingExport')).toEqual({
      symbol: 'MissingExport',
      definedIn: [],
      importedByFiles: [],
      importedByPatterns: [],
    });
  });

  it('keeps cohort-labeled invariant and spec joins stable', () => {
    // Given
    const view = graph();

    // When
    const invariants = view.invariantsOf('CoreView');
    const specs = view.specsReverifying(['CoreView']);

    // Then
    expect(invariants).toEqual([
      {
        rule: 'Planned rule',
        text: 'Authored behavior stays explicit.',
        pattern: 'AuthoredSpecs',
        maturity: 'plan',
        provenance: 'authored',
        featureFile: FEATURE_FILES[0],
        provenByScenarios: ['Authored scenario'],
        cohort: ['CoreView', 'UtilityView'],
      },
      {
        rule: 'Shared rule',
        text: 'Executable behavior stays stable.',
        pattern: 'ExecutableSpecs',
        maturity: 'executable',
        provenance: 'executable',
        featureFile: FEATURE_FILES[1],
        provenByScenarios: ['Executable scenario'],
        cohort: ['CoreView', 'UtilityView'],
      },
    ]);
    expect(specs).toEqual([
      {
        scenario: 'Authored scenario',
        pattern: 'AuthoredSpecs',
        featureFile: FEATURE_FILES[0],
        line: 31,
        maturity: 'plan',
        provenance: 'authored',
        semanticTags: ['validation'],
        cohort: ['CoreView', 'UtilityView'],
      },
      {
        scenario: 'Executable scenario',
        pattern: 'ExecutableSpecs',
        featureFile: FEATURE_FILES[1],
        line: 21,
        maturity: 'executable',
        provenance: 'executable',
        semanticTags: ['happy-path'],
        cohort: ['CoreView', 'UtilityView'],
      },
    ]);
  });

  it('keeps impact and curation-assist views stable', () => {
    // Given
    const view = graph();

    // When
    const impact = view.blastRadius([
      'packages/sample/src/core-view.ts',
      'packages/sample/tests/features/cohort.feature',
    ]);
    const diff = view.graphDiff();
    const drift = view.driftFlags((file) => file !== 'packages/sample/src/utility-view.ts');

    // Then
    expect(impact.changedSrc).toEqual(['packages/sample/src/core-view.ts']);
    expect(impact.mappedSeed).toEqual(['CoreView']);
    expect(impact.mechPatterns).toEqual(['CoreView', 'UtilityView']);
    expect(impact.recovered).toEqual(['UtilityView']);
    expect(impact.atRiskFeatureFiles).toEqual(FEATURE_FILES);
    expect(impact.atRiskSpecs.map((spec) => spec.scenario)).toEqual([
      'Authored scenario',
      'Executable scenario',
    ]);
    expect(view.blastRadius(['packages/sample/tests/features/cohort.feature']).changedSrc).toEqual(
      [],
    );
    expect(view.fanInCandidates({ min: 2 })).toEqual([
      { file: 'packages/sample/src/dark.ts', fanIn: 3, pkg: 'sample', annotated: false },
    ]);
    expect(diff).toEqual({
      mechEdges: 2,
      authEdges: 2,
      shared: ['CoreView→UtilityView'],
      dark: ['UtilityView→CoreView'],
      aspirational: ['CoreView→AuthoredSpecs'],
      jaccard: 33,
    });
    expect(drift).toEqual({
      dangling: [],
      orphanedSource: [{ pattern: 'UtilityView', file: 'packages/sample/src/utility-view.ts' }],
    });
    expect(view.census()).toEqual({
      nodeCoverage: [
        { pkg: 'empty', mapped: 0, total: 0, pct: 0 },
        { pkg: 'sample', mapped: 2, total: 3, pct: 67 },
      ],
      edgeDensity: { uses: 1, usedBy: 1, implementedBy: 2 },
      edgeDark: 2,
      patternCount: 4,
    });
  });

  it('characterizes the current non-empty graph-diff seam without mutating its inputs', () => {
    // Given
    const view = graph();
    const mech = createMechanicalViewsFixture();

    // When
    const result = graphDiff(mech, view.authored);

    // Then
    expect(result.shared).toEqual(['CoreView→UtilityView']);
    expect(Number.isFinite(result.jaccard)).toBe(true);
    expect(view.pattern('CoreView')?.uses).toEqual(['UtilityView', 'AuthoredSpecs']);
  });
});
