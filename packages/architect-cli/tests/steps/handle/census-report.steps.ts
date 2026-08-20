import { describe, expect, it } from 'vitest';

import { buildCensusReport } from '../../../src/cli/census-report.js';
import {
  createCurationCensusGraph,
  createEmptyCensusGraph,
} from '../../support/graph-views-fixture.js';

describe('census report', () => {
  it('leads with ranked significance candidates and finite diagnostics', () => {
    const report = buildCensusReport(createCurationCensusGraph());

    expect(report.candidates).toEqual([
      {
        category: 'high-fan-in-unmapped',
        rank: 1,
        name: 'packages/sample/src/dark.ts',
        file: 'packages/sample/src/dark.ts',
        fanIn: 4,
      },
      {
        category: 'edge-dark-structural',
        rank: 1,
        name: 'CurationContract',
        file: 'packages/sample/src/contract.ts',
        fanIn: 0,
        role: 'contract',
      },
    ]);
    expect(report.candidates.map((candidate) => candidate.category)).toEqual([
      'high-fan-in-unmapped',
      'edge-dark-structural',
    ]);
    expect(Object.keys(report)[0]).toBe('candidates');
    expect(report.candidates.every((candidate) => !candidate.file.endsWith('/index.ts'))).toBe(
      true,
    );
    expect(report.nodeCoverage.every((entry) => Number.isFinite(entry.pct))).toBe(true);
    expect(Object.values(report.edgeDensity).every((value) => Number.isFinite(value))).toBe(true);
    expect(Number.isFinite(report.edgeDarkPercentage)).toBe(true);
    expect(Object.keys(report).includes('targetPercentage')).toBe(false);
  });

  it('returns empty candidate lists and finite values for an empty graph', () => {
    const report = buildCensusReport(createEmptyCensusGraph());

    expect(report.candidates).toEqual([]);
    expect(report.nodeCoverage.every((entry) => Number.isFinite(entry.pct))).toBe(true);
    expect(Number.isFinite(report.edgeDarkPercentage)).toBe(true);
  });
});
