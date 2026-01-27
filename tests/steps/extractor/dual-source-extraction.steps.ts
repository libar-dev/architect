/**
 * Step definitions for Dual-Source Extraction tests
 *
 * Tests the extraction and combination of pattern metadata from
 * TypeScript code stubs and Gherkin feature files.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ScannedGherkinFile } from '../../../src/validation-schemas/index.js';
import type { ExtractedPattern, SourceInfo } from '../../../src/types/index.js';
import type {
  ProcessMetadata,
  Deliverable,
  DualSourceResults,
  CrossValidationError,
  ValidationSummary,
} from '../../../src/extractor/dual-source-extractor.js';
import {
  extractProcessMetadata,
  extractDeliverables,
  combineSources,
  validateDualSource,
} from '../../../src/extractor/dual-source-extractor.js';

const feature = await loadFeature('tests/features/extractor/dual-source-extraction.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  feature: ScannedGherkinFile | null;
  metadata: ProcessMetadata | null;
  deliverables: readonly Deliverable[];
  codePatterns: ExtractedPattern[];
  featureFiles: ScannedGherkinFile[];
  dualSourceResults: DualSourceResults | null;
  validationSummary: ValidationSummary | null;
}

let state: TestState;

function resetState(): void {
  state = {
    feature: null,
    metadata: null,
    deliverables: [],
    codePatterns: [],
    featureFiles: [],
    dualSourceResults: null,
    validationSummary: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function createMockFeature(
  tags: string[],
  backgroundDeliverables?: Array<{
    Deliverable: string;
    Status: string;
    Tests: string;
    Location: string;
    Finding?: string;
    Release?: string;
  }>
): ScannedGherkinFile {
  const backgroundSteps =
    backgroundDeliverables && backgroundDeliverables.length > 0
      ? [
          {
            keyword: 'Given',
            text: 'the following deliverables:',
            dataTable: {
              headers: ['Deliverable', 'Status', 'Tests', 'Location', 'Finding', 'Release'],
              rows: backgroundDeliverables,
            },
          },
        ]
      : [];

  return {
    filePath: '/test/features/test.feature',
    feature: {
      name: 'Test Feature',
      description: 'Test feature description',
      tags,
      language: 'en',
      line: 1,
    },
    background:
      backgroundSteps.length > 0
        ? {
            name: 'Deliverables',
            steps: backgroundSteps,
            line: 5,
          }
        : undefined,
    scenarios: [],
  };
}

function createMockCodePattern(
  patternName: string,
  phase: number,
  options: {
    category?: string;
    status?: string;
    dependsOn?: string[];
    enables?: string[];
  } = {}
): ExtractedPattern {
  const source: SourceInfo = {
    file: `/test/src/${patternName.toLowerCase()}.ts`,
    line: 1,
  };

  return {
    name: patternName,
    patternName,
    category: options.category ?? 'core',
    status: options.status ?? 'roadmap',
    phase,
    description: `Test pattern ${patternName}`,
    source,
    ...(options.dependsOn && { dependsOn: options.dependsOn }),
    ...(options.enables && { enables: options.enables }),
  };
}

function createMockFeatureFile(
  patternName: string,
  phase: number,
  status = 'active'
): ScannedGherkinFile {
  return createMockFeature([
    `pattern:${patternName}`,
    `phase:${String(phase).padStart(2, '0')}`,
    `status:${status}`,
  ]);
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // Rule: Process metadata is extracted from feature tags
  // ===========================================================================

  Rule('Process metadata is extracted from feature tags', ({ RuleScenario }) => {
    RuleScenario('Complete process metadata extraction', ({ Given, When, Then, And }) => {
      Given('a feature with process tags:', (_ctx, dataTable: Array<{ tag: string }>) => {
        resetState();
        const tags = dataTable.map((row) => row.tag);
        state.feature = createMockFeature(tags);
      });

      When('extracting process metadata', () => {
        state.metadata = extractProcessMetadata(state.feature!);
      });

      Then('metadata is extracted successfully', () => {
        expect(state.metadata).not.toBeNull();
      });

      And('the pattern name is {string}', (_ctx, expectedName: string) => {
        expect(state.metadata!.pattern).toBe(expectedName);
      });

      And('the phase is {int}', (_ctx, expectedPhase: number) => {
        expect(state.metadata!.phase).toBe(expectedPhase);
      });

      And('the status is {string}', (_ctx, expectedStatus: string) => {
        expect(state.metadata!.status).toBe(expectedStatus);
      });
    });

    RuleScenario('Minimal required tags extraction', ({ Given, When, Then, And }) => {
      Given('a feature with process tags:', (_ctx, dataTable: Array<{ tag: string }>) => {
        resetState();
        const tags = dataTable.map((row) => row.tag);
        state.feature = createMockFeature(tags);
      });

      When('extracting process metadata', () => {
        state.metadata = extractProcessMetadata(state.feature!);
      });

      Then('metadata is extracted successfully', () => {
        expect(state.metadata).not.toBeNull();
      });

      And('the status defaults to {string}', (_ctx, expectedStatus: string) => {
        expect(state.metadata!.status).toBe(expectedStatus);
      });
    });

    RuleScenario('Missing pattern tag returns null', ({ Given, When, Then }) => {
      Given('a feature with process tags:', (_ctx, dataTable: Array<{ tag: string }>) => {
        resetState();
        const tags = dataTable.map((row) => row.tag);
        state.feature = createMockFeature(tags);
      });

      When('extracting process metadata', () => {
        state.metadata = extractProcessMetadata(state.feature!);
      });

      Then('no metadata is extracted', () => {
        expect(state.metadata).toBeNull();
      });
    });

    RuleScenario('Missing phase tag returns null', ({ Given, When, Then }) => {
      Given('a feature with process tags:', (_ctx, dataTable: Array<{ tag: string }>) => {
        resetState();
        const tags = dataTable.map((row) => row.tag);
        state.feature = createMockFeature(tags);
      });

      When('extracting process metadata', () => {
        state.metadata = extractProcessMetadata(state.feature!);
      });

      Then('no metadata is extracted', () => {
        expect(state.metadata).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Rule: Deliverables are extracted from Background tables
  // ===========================================================================

  Rule('Deliverables are extracted from Background tables', ({ RuleScenario }) => {
    RuleScenario('Standard deliverables table extraction', ({ Given, When, Then, And }) => {
      Given(
        'a feature with background deliverables:',
        (
          _ctx,
          dataTable: Array<{
            Deliverable: string;
            Status: string;
            Tests: string;
            Location: string;
          }>
        ) => {
          resetState();
          state.feature = createMockFeature(
            [],
            dataTable.map((row) => ({
              Deliverable: row.Deliverable,
              Status: row.Status,
              Tests: row.Tests,
              Location: row.Location,
            }))
          );
        }
      );

      When('extracting deliverables', () => {
        state.deliverables = extractDeliverables(state.feature!);
      });

      Then('{int} deliverables are extracted', (_ctx, count: number) => {
        expect(state.deliverables.length).toBe(count);
      });

      And('deliverable {string} has status {string}', (_ctx, name: string, status: string) => {
        const deliverable = state.deliverables.find((d) => d.name === name);
        expect(deliverable?.status).toBe(status);
      });

      And('deliverable {string} has {int} tests', (_ctx, name: string, testCount: number) => {
        const deliverable = state.deliverables.find((d) => d.name === name);
        expect(deliverable?.tests).toBe(testCount);
      });
    });

    RuleScenario('Extended deliverables with Finding and Release', ({ Given, When, Then, And }) => {
      Given(
        'a feature with background deliverables:',
        (
          _ctx,
          dataTable: Array<{
            Deliverable: string;
            Status: string;
            Tests: string;
            Location: string;
            Finding: string;
            Release: string;
          }>
        ) => {
          resetState();
          state.feature = createMockFeature(
            [],
            dataTable.map((row) => ({
              Deliverable: row.Deliverable,
              Status: row.Status,
              Tests: row.Tests,
              Location: row.Location,
              Finding: row.Finding,
              Release: row.Release,
            }))
          );
        }
      );

      When('extracting deliverables', () => {
        state.deliverables = extractDeliverables(state.feature!);
      });

      Then('deliverable {string} has finding {string}', (_ctx, name: string, finding: string) => {
        const deliverable = state.deliverables.find((d) => d.name === name);
        expect(deliverable?.finding).toBe(finding);
      });

      And('deliverable {string} has release {string}', (_ctx, name: string, release: string) => {
        const deliverable = state.deliverables.find((d) => d.name === name);
        expect(deliverable?.release).toBe(release);
      });
    });

    RuleScenario('Feature without background returns empty', ({ Given, When, Then }) => {
      Given('a feature without background', () => {
        resetState();
        state.feature = {
          filePath: '/test/features/test.feature',
          feature: {
            name: 'Test Feature',
            description: 'No background',
            tags: [],
            language: 'en',
            line: 1,
          },
          scenarios: [],
        };
      });

      When('extracting deliverables', () => {
        state.deliverables = extractDeliverables(state.feature!);
      });

      Then('no deliverables are extracted', () => {
        expect(state.deliverables.length).toBe(0);
      });
    });

    RuleScenario('Tests column handles various formats', ({ Given, When, Then }) => {
      Given(
        'a feature with background deliverables:',
        (
          _ctx,
          dataTable: Array<{
            Deliverable: string;
            Status: string;
            Tests: string;
            Location: string;
          }>
        ) => {
          resetState();
          state.feature = createMockFeature(
            [],
            dataTable.map((row) => ({
              Deliverable: row.Deliverable,
              Status: row.Status,
              Tests: row.Tests,
              Location: row.Location,
            }))
          );
        }
      );

      When('extracting deliverables', () => {
        state.deliverables = extractDeliverables(state.feature!);
      });

      Then('the test counts are correctly parsed', () => {
        // "Yes" should parse to 1
        expect(state.deliverables.find((d) => d.name === 'Test Yes')?.tests).toBe(1);
        // "No" should parse to 0
        expect(state.deliverables.find((d) => d.name === 'Test No')?.tests).toBe(0);
        // "10" should parse to 10
        expect(state.deliverables.find((d) => d.name === 'Test Number')?.tests).toBe(10);
        // Empty should parse to 0
        expect(state.deliverables.find((d) => d.name === 'Test Empty')?.tests).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Rule: Code and feature patterns are combined into dual-source patterns
  // ===========================================================================

  Rule('Code and feature patterns are combined into dual-source patterns', ({ RuleScenario }) => {
    RuleScenario('Matching code and feature are combined', ({ Given, When, Then, And }) => {
      Given(
        'a code pattern {string} with phase {int}',
        (_ctx, patternName: string, phase: number) => {
          resetState();
          state.codePatterns.push(createMockCodePattern(patternName, phase));
        }
      );

      And(
        'a feature file for pattern {string} with phase {int}',
        (_ctx, patternName: string, phase: number) => {
          state.featureFiles.push(createMockFeatureFile(patternName, phase));
        }
      );

      When('combining sources', () => {
        state.dualSourceResults = combineSources(state.codePatterns, state.featureFiles);
      });

      Then('{int} combined pattern is produced', (_ctx, count: number) => {
        expect(state.dualSourceResults!.patterns.length).toBe(count);
      });

      And('combined pattern {string} has process metadata', (_ctx, patternName: string) => {
        const pattern = state.dualSourceResults!.patterns.find(
          (p) => p.patternName === patternName
        );
        expect(pattern?.process).toBeDefined();
      });

      And('{int} code-only patterns exist', (_ctx, count: number) => {
        expect(state.dualSourceResults!.codeOnly.length).toBe(count);
      });

      And('{int} feature-only patterns exist', (_ctx, count: number) => {
        expect(state.dualSourceResults!.featureOnly.length).toBe(count);
      });
    });

    RuleScenario('Code-only pattern has no matching feature', ({ Given, When, Then, And }) => {
      Given(
        'a code pattern {string} with phase {int}',
        (_ctx, patternName: string, phase: number) => {
          resetState();
          state.codePatterns.push(createMockCodePattern(patternName, phase));
        }
      );

      And('no feature files', () => {
        state.featureFiles = [];
      });

      When('combining sources', () => {
        state.dualSourceResults = combineSources(state.codePatterns, state.featureFiles);
      });

      Then('{int} combined patterns are produced', (_ctx, count: number) => {
        expect(state.dualSourceResults!.patterns.length).toBe(count);
      });

      And('{int} code-only patterns exist', (_ctx, count: number) => {
        expect(state.dualSourceResults!.codeOnly.length).toBe(count);
      });
    });

    RuleScenario('Feature-only pattern has no matching code', ({ Given, When, Then, And }) => {
      Given('no code patterns', () => {
        resetState();
        state.codePatterns = [];
      });

      And(
        'a feature file for pattern {string} with phase {int}',
        (_ctx, patternName: string, phase: number) => {
          state.featureFiles.push(createMockFeatureFile(patternName, phase));
        }
      );

      When('combining sources', () => {
        state.dualSourceResults = combineSources(state.codePatterns, state.featureFiles);
      });

      Then('{int} combined patterns are produced', (_ctx, count: number) => {
        expect(state.dualSourceResults!.patterns.length).toBe(count);
      });

      And('{int} feature-only patterns exist', (_ctx, count: number) => {
        expect(state.dualSourceResults!.featureOnly.length).toBe(count);
      });
    });

    RuleScenario('Phase mismatch creates validation error', ({ Given, When, Then, And }) => {
      Given(
        'a code pattern {string} with phase {int}',
        (_ctx, patternName: string, phase: number) => {
          resetState();
          state.codePatterns.push(createMockCodePattern(patternName, phase));
        }
      );

      And(
        'a feature file for pattern {string} with phase {int}',
        (_ctx, patternName: string, phase: number) => {
          state.featureFiles.push(createMockFeatureFile(patternName, phase));
        }
      );

      When('combining sources', () => {
        state.dualSourceResults = combineSources(state.codePatterns, state.featureFiles);
      });

      Then('{int} combined pattern is produced', (_ctx, count: number) => {
        expect(state.dualSourceResults!.patterns.length).toBe(count);
      });

      And('{int} validation error exists', (_ctx, count: number) => {
        expect(state.dualSourceResults!.validationErrors.length).toBe(count);
      });

      And('the error mentions phase mismatch', () => {
        const hasPhaseError = state.dualSourceResults!.validationErrors.some((e) =>
          e.message.toLowerCase().includes('phase')
        );
        expect(hasPhaseError).toBe(true);
      });
    });

    RuleScenario('Pattern name collision merges sources', ({ Given, When, Then, And }) => {
      Given(
        'code patterns:',
        (
          _ctx,
          dataTable: Array<{
            patternName: string;
            phase: string;
            category: string;
            dependsOn: string;
          }>
        ) => {
          resetState();
          for (const row of dataTable) {
            state.codePatterns.push(
              createMockCodePattern(row.patternName, parseInt(row.phase), {
                category: row.category,
                dependsOn: row.dependsOn ? [row.dependsOn] : undefined,
              })
            );
          }
        }
      );

      And(
        'a feature file for pattern {string} with phase {int}',
        (_ctx, patternName: string, phase: number) => {
          state.featureFiles.push(createMockFeatureFile(patternName, phase));
        }
      );

      When('combining sources', () => {
        state.dualSourceResults = combineSources(state.codePatterns, state.featureFiles);
      });

      Then('{int} combined pattern is produced', (_ctx, count: number) => {
        expect(state.dualSourceResults!.patterns.length).toBe(count);
      });

      And('{int} warning about collision exists', (_ctx, count: number) => {
        const collisionWarnings = state.dualSourceResults!.warnings.filter((w) =>
          w.toLowerCase().includes('collision')
        );
        expect(collisionWarnings.length).toBe(count);
      });

      And('combined pattern {string} has merged dependencies', (_ctx, patternName: string) => {
        const pattern = state.dualSourceResults!.patterns.find(
          (p) => p.patternName === patternName
        );
        // Should have dependencies from both code patterns merged
        expect(pattern?.dependsOn?.length).toBeGreaterThanOrEqual(2);
        expect(pattern?.dependsOn).toContain('PatternA');
        expect(pattern?.dependsOn).toContain('PatternB');
      });
    });
  });

  // ===========================================================================
  // Rule: Dual-source results are validated for consistency
  // ===========================================================================

  Rule('Dual-source results are validated for consistency', ({ RuleScenario }) => {
    RuleScenario('Clean results have no errors', ({ Given, When, Then, And }) => {
      Given('dual-source results with no issues', () => {
        resetState();
        state.dualSourceResults = {
          patterns: [],
          codeOnly: [],
          featureOnly: [],
          validationErrors: [],
          warnings: [],
        };
      });

      When('validating dual-source', () => {
        state.validationSummary = validateDualSource(state.dualSourceResults!);
      });

      Then('validation passes', () => {
        expect(state.validationSummary!.isValid).toBe(true);
      });

      And('there are no errors', () => {
        expect(state.validationSummary!.errors.length).toBe(0);
      });

      And('there are no warnings', () => {
        expect(state.validationSummary!.warnings.length).toBe(0);
      });
    });

    RuleScenario('Cross-validation errors are reported', ({ Given, When, Then, And }) => {
      Given(
        'dual-source results with validation errors:',
        (
          _ctx,
          dataTable: Array<{
            codeName: string;
            featureName: string;
            message: string;
          }>
        ) => {
          resetState();
          const validationErrors: CrossValidationError[] = dataTable.map((row) => ({
            codeName: row.codeName,
            featureName: row.featureName,
            codePhase: 10,
            featurePhase: 20,
            sources: {
              code: '/test/code.ts',
              feature: '/test/feature.feature',
            },
            message: row.message,
          }));
          state.dualSourceResults = {
            patterns: [],
            codeOnly: [],
            featureOnly: [],
            validationErrors,
            warnings: [],
          };
        }
      );

      When('validating dual-source', () => {
        state.validationSummary = validateDualSource(state.dualSourceResults!);
      });

      Then('validation fails', () => {
        expect(state.validationSummary!.isValid).toBe(false);
      });

      And('{int} error is reported', (_ctx, count: number) => {
        expect(state.validationSummary!.errors.length).toBe(count);
      });
    });

    RuleScenario('Orphaned roadmap code stubs produce warnings', ({ Given, When, Then, And }) => {
      Given(
        'dual-source results with code-only patterns:',
        (
          _ctx,
          dataTable: Array<{
            patternName: string;
            status: string;
          }>
        ) => {
          resetState();
          const codeOnly: ExtractedPattern[] = dataTable.map((row) =>
            createMockCodePattern(row.patternName, 10, { status: row.status })
          );
          state.dualSourceResults = {
            patterns: [],
            codeOnly,
            featureOnly: [],
            validationErrors: [],
            warnings: [],
          };
        }
      );

      When('validating dual-source', () => {
        state.validationSummary = validateDualSource(state.dualSourceResults!);
      });

      Then('validation passes', () => {
        expect(state.validationSummary!.isValid).toBe(true);
      });

      And('{int} warning about missing feature file exists', (_ctx, count: number) => {
        const featureWarnings = state.validationSummary!.warnings.filter((w) =>
          w.toLowerCase().includes('no feature file')
        );
        expect(featureWarnings.length).toBe(count);
      });
    });

    RuleScenario('Feature-only roadmap patterns produce warnings', ({ Given, When, Then, And }) => {
      Given(
        'dual-source results with feature-only patterns:',
        (
          _ctx,
          dataTable: Array<{
            pattern: string;
            phase: string;
            status: string;
          }>
        ) => {
          resetState();
          const featureOnly: ProcessMetadata[] = dataTable.map((row) => ({
            pattern: row.pattern,
            phase: parseInt(row.phase),
            status: row.status,
          }));
          state.dualSourceResults = {
            patterns: [],
            codeOnly: [],
            featureOnly,
            validationErrors: [],
            warnings: [],
          };
        }
      );

      When('validating dual-source', () => {
        state.validationSummary = validateDualSource(state.dualSourceResults!);
      });

      Then('validation passes', () => {
        expect(state.validationSummary!.isValid).toBe(true);
      });

      And('{int} warning about missing code stub exists', (_ctx, count: number) => {
        const stubWarnings = state.validationSummary!.warnings.filter((w) =>
          w.toLowerCase().includes('no code stub')
        );
        expect(stubWarnings.length).toBe(count);
      });
    });
  });
});
