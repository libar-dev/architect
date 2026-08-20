import type { ExtractedPattern } from '@libar-dev/architect-core';
import type { ProjectionContext } from '../../../src/index.js';
import { createTestPackageResolver } from '../../support/test-package-resolver.js';
import {
  buildBusinessRuleStub,
  buildGraphFromPatterns,
  buildPatternStub,
} from '../../support/test-graph-builder.js';

interface RuleSeed {
  readonly name: string;
  readonly description: string;
  readonly scenarioNames: readonly string[];
  readonly scenarioCount: number;
}

interface PatternSeed {
  readonly name: string;
  readonly file: string;
  readonly status: ExtractedPattern['status'];
  readonly maturity: 'idea' | 'plan' | 'design' | 'executable';
  readonly productArea: string;
  readonly rules: readonly RuleSeed[];
}

/**
 * Number of distinct workspace packages spanned by the parity fixture.
 * Derived from {@link PARITY_PATTERN_SEEDS} so assertions stay coupled to the
 * fixture rather than literal counts. Update if a seed in a new package lands.
 */
export const PARITY_PACKAGE_COUNT = 2;

const PARITY_PATTERN_SEEDS: readonly PatternSeed[] = [
  {
    name: 'ParityProjectionAlpha',
    file: 'packages/architect-projection/tests/parity-alpha.feature',
    status: 'completed',
    maturity: 'executable',
    productArea: 'Projection',
    rules: [
      {
        name: 'Bundles stay JSON-safe',
        description:
          '**Invariant:** Bundle payloads contain only JSON-safe values.\n**Rationale:** Renderers stay deterministic across transports.\n**Verified by:** parity scenarios across renderers',
        scenarioNames: ['parity scenarios across renderers'],
        scenarioCount: 1,
      },
      {
        name: 'Disclosure shapes only markdown',
        description:
          '**Invariant:** JSON and UI outputs do not vary by disclosure level.\n**Rationale:** Renderer policy is markdown-local.\n**Verified by:** disclosure invariance scenarios',
        scenarioNames: ['JSON output is byte-identical across disclosure levels'],
        scenarioCount: 1,
      },
    ],
  },
  {
    name: 'ParityProjectionBeta',
    file: 'packages/architect-projection/tests/parity-beta.feature',
    status: 'active',
    maturity: 'executable',
    productArea: 'Projection',
    rules: [
      {
        name: 'Package grouping is config-driven',
        description:
          '**Invariant:** The package axis derives from PackageResolver, not from path regex.\n**Rationale:** Two configured projects produce different bucketing without code changes.\n**Verified by:** package config swap parity scenario',
        scenarioNames: ['package config swap parity scenario'],
        scenarioCount: 1,
      },
    ],
  },
  {
    name: 'ParityCliGamma',
    file: 'packages/architect-cli/tests/parity-gamma.feature',
    status: 'active',
    maturity: 'executable',
    productArea: 'CLI',
    rules: [
      {
        name: 'CLI flags reach the projection boundary',
        description:
          '**Invariant:** --disclosure and --filter survive the parser to ProjectionContext.\n**Rationale:** Boundary validation is the only validation.\n**Verified by:** fragment reuse scenario',
        scenarioNames: ['fragment reuse scenario'],
        scenarioCount: 1,
      },
    ],
  },
];

export function createParityContext(overrides: Partial<ProjectionContext> = {}): ProjectionContext {
  const patterns = PARITY_PATTERN_SEEDS.map((seed) =>
    buildPatternStub(seed.name, {
      patternName: seed.name,
      role: 'service',
      file: seed.file,
      status: seed.status,
      maturity: seed.maturity,
      productArea: seed.productArea,
      rules: seed.rules.map((rule) => buildBusinessRuleStub(rule)),
    }),
  );
  return {
    graph: buildGraphFromPatterns({
      patterns,
      tagRegistry: {
        version: '1.0.0',
        roles: [],
        metadataTags: [],
        aggregationTags: [],
        formatOptions: ['full', 'list', 'summary'],
        tagPrefix: '@architect-',
        fileOptInTag: '@architect',
      },
    }),
    packageResolver: createTestPackageResolver(),
    ...overrides,
  };
}
