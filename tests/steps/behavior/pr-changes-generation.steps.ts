/**
 * PR Changes Generation Step Definitions
 *
 * BDD step definitions for testing end-to-end PR-CHANGES.md generation:
 * - Release version filtering
 * - Phase grouping
 * - Summary statistics
 * - Deliverables display
 * - Review checklist
 * - Dependencies section
 * - Business value inclusion
 * - Sorting options (phase, priority)
 * - Edge cases
 *
 * Tests markdown string output, complementing pr-changes-codec.steps.ts
 * which tests at the RenderableDocument level.
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { generateDocument } from '../../../src/renderable/generate.js';
import type { PrChangesCodecOptions } from '../../../src/renderable/codecs/pr-changes.js';
import type { PatternGraph } from '../../../src/validation-schemas/pattern-graph.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import {
  createTestPatternGraph,
  createTestPattern,
  resetPatternCounter,
  type TestDeliverable,
} from '../../fixtures/dataset-factories.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface PrChangesGenerationState {
  patterns: ExtractedPattern[];
  dataset: PatternGraph | null;
  output: string;
  options: PrChangesCodecOptions;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PrChangesGenerationState | null = null;

function initState(): PrChangesGenerationState {
  resetPatternCounter();
  return {
    patterns: [],
    dataset: null,
    output: '',
    options: {},
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate PR changes markdown from dataset with options
 */
function generatePrChangesMarkdown(
  dataset: PatternGraph,
  options: PrChangesCodecOptions = {}
): string {
  const files = generateDocument('pr-changes', dataset, { 'pr-changes': options });
  return files[0]?.content ?? '';
}

/**
 * Build dataset from accumulated patterns
 */
function buildDataset(): PatternGraph {
  return createTestPatternGraph({ patterns: state!.patterns });
}

/**
 * Parse status from DataTable (handles various formats)
 */
function parseStatus(statusStr: string): 'roadmap' | 'active' | 'completed' | 'deferred' {
  const normalized = statusStr.toLowerCase().trim();
  if (normalized === 'completed' || normalized === 'complete' || normalized === 'done') {
    return 'completed';
  }
  if (normalized === 'active' || normalized === 'in progress' || normalized === 'in-progress') {
    return 'active';
  }
  if (normalized === 'roadmap' || normalized === 'planned') {
    return 'roadmap';
  }
  if (normalized === 'deferred') {
    return 'deferred';
  }
  return 'completed';
}

/**
 * Parse priority from DataTable
 */
function parsePriority(priorityStr: string): 'critical' | 'high' | 'medium' | 'low' {
  const normalized = priorityStr.toLowerCase().trim();
  if (normalized === 'critical') return 'critical';
  if (normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  return 'low';
}

/**
 * Get position of text in output (for order assertions)
 */
function getPosition(text: string, content: string): number {
  return content.indexOf(text);
}

// =============================================================================
// Assertion Helpers
// =============================================================================

function assertContains(text: string): void {
  expect(state!.output, `Output should contain "${text}"`).toContain(text);
}

function assertNotContains(text: string): void {
  expect(state!.output, `Output should NOT contain "${text}"`).not.toContain(text);
}

function assertAppearsBefore(first: string, second: string): void {
  const firstPos = getPosition(first, state!.output);
  const secondPos = getPosition(second, state!.output);
  expect(firstPos, `"${first}" not found`).toBeGreaterThanOrEqual(0);
  expect(secondPos, `"${second}" not found`).toBeGreaterThanOrEqual(0);
  expect(firstPos, `"${first}" should appear before "${second}"`).toBeLessThan(secondPos);
}

// =============================================================================
// Data Setup Helpers
// =============================================================================

function setupCompletedPhasesWithReleases(dataTable: DataTableRow[]): void {
  state = initState();
  for (const row of dataTable) {
    const name = row.Name ?? '';
    const deliverables = [
      {
        name: `${name} Deliverable`,
        status: 'complete',
        tests: 1,
        location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
        release: row.Release ?? undefined,
      },
    ] satisfies TestDeliverable[];
    state.patterns.push(
      createTestPattern({
        name: row.Name ?? 'Unnamed',
        phase: parseInt(row.Phase ?? '0', 10),
        status: 'completed',
        workflow: row.Workflow ?? 'implementation',
        deliverables,
      })
    );
  }
}

function setupMixedStatusPhases(dataTable: DataTableRow[]): void {
  state = initState();
  for (const row of dataTable) {
    const name = row.Name ?? '';
    const deliverables = [
      {
        name: `${name} Deliverable`,
        status: 'complete',
        tests: 1,
        location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
        release: row.Release ?? undefined,
      },
    ] satisfies TestDeliverable[];
    state.patterns.push(
      createTestPattern({
        name: row.Name ?? 'Unnamed',
        phase: parseInt(row.Phase ?? '0', 10),
        status: parseStatus(row.Status ?? 'completed'),
        workflow: row.Workflow ?? 'implementation',
        deliverables,
      })
    );
  }
}

function setupCompletedPhasesWithUnreleasedMix(dataTable: DataTableRow[]): void {
  state = initState();
  for (const row of dataTable) {
    const name = row.Name ?? '';
    const release = row.Release?.trim() || undefined;
    const deliverables = [
      {
        name: `${name} Deliverable`,
        status: 'complete',
        tests: 1,
        location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
        release,
      },
    ] satisfies TestDeliverable[];
    state.patterns.push(
      createTestPattern({
        name: row.Name ?? 'Unnamed',
        phase: parseInt(row.Phase ?? '0', 10),
        status: 'completed',
        workflow: row.Workflow ?? 'implementation',
        deliverables,
      })
    );
  }
}

function generateWithReleaseFilter(release: string): void {
  state!.dataset = buildDataset();
  state!.options = { releaseFilter: release };
  state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
}

function generateWithoutReleaseFilter(): void {
  state!.dataset = buildDataset();
  state!.options = {};
  state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
}

// =============================================================================
// Feature: PR Changes Generation
// =============================================================================

const feature = await loadFeature('tests/features/behavior/pr-changes-generation.feature');

describeFeature(feature, ({ AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Release Version Filtering
  // ===========================================================================

  Rule('Release version filtering controls which phases appear in output', ({ RuleScenario }) => {
    RuleScenario('Filter phases by specific release version', ({ Given, When, Then, And }) => {
      Given(
        'completed phases tagged with different releases:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          setupCompletedPhasesWithReleases(dataTable);
        }
      );

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        generateWithReleaseFilter('v0.2.0');
      });

      Then('the output should contain "Critical Fixes"', () => assertContains('Critical Fixes'));
      And('the output should contain "Error Handling"', () => assertContains('Error Handling'));
      And('the output should not contain "Foundation"', () => assertNotContains('Foundation'));
      And('the output should not contain "Core Types"', () => assertNotContains('Core Types'));
    });

    RuleScenario(
      'Show all active and completed phases when no releaseFilter',
      ({ Given, When, Then, And }) => {
        Given(
          'completed phases with mixed release status:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            setupCompletedPhasesWithUnreleasedMix(dataTable);
          }
        );

        When('generating PR changes without releaseFilter', () => {
          generateWithoutReleaseFilter();
        });

        Then('the output should contain "Session Handoffs"', () =>
          assertContains('Session Handoffs')
        );
        And('the output should contain "Changelog Gen"', () => assertContains('Changelog Gen'));
        And('the output should contain "Foundation"', () => assertContains('Foundation'));
      }
    );

    RuleScenario(
      'Active phases with matching deliverables are included',
      ({ Given, When, Then, And }) => {
        Given(
          'phases with different statuses and deliverables:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            setupMixedStatusPhases(dataTable);
          }
        );

        When('generating PR changes with releaseFilter "v0.3.0"', () => {
          generateWithReleaseFilter('v0.3.0');
        });

        Then('the output should contain "Documentation"', () => assertContains('Documentation'));
        And('the output should not contain "Previous Work"', () =>
          assertNotContains('Previous Work')
        );
        And('the output should not contain "Future Work"', () => assertNotContains('Future Work'));
      }
    );

    RuleScenario(
      'Roadmap phases are excluded even with matching deliverables',
      ({ Given, When, Then, And }) => {
        Given(
          'phases with different statuses and deliverables:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            setupMixedStatusPhases(dataTable);
          }
        );

        When('generating PR changes with releaseFilter "v1.0.0"', () => {
          generateWithReleaseFilter('v1.0.0');
        });

        Then('the output should contain "Active Feature"', () => assertContains('Active Feature'));
        And('the output should not contain "Planned Feature"', () =>
          assertNotContains('Planned Feature')
        );
      }
    );
  });

  // ===========================================================================
  // Phase Grouping
  // ===========================================================================

  Rule('Patterns are grouped by phase number in the output', ({ RuleScenario }) => {
    RuleScenario('Patterns grouped by phase number', ({ Given, When, Then, And }) => {
      Given(
        'completed phases with different workflows:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          setupCompletedPhasesWithReleases(dataTable);
        }
      );

      When('generating PR changes with releaseFilter "v1.0.0"', () => {
        generateWithReleaseFilter('v1.0.0');
      });

      Then('the output should contain "## Changes by Phase"', () =>
        assertContains('## Changes by Phase')
      );
      And('the output should contain "### Phase 1"', () => assertContains('### Phase 1'));
      And('the output should contain "### Phase 2"', () => assertContains('### Phase 2'));
      And('the output should contain "### Phase 3"', () => assertContains('### Phase 3'));
      And('the output should contain "### Phase 4"', () => assertContains('### Phase 4'));
    });
  });

  // ===========================================================================
  // Summary Statistics
  // ===========================================================================

  Rule('Summary statistics provide a high-level overview of the PR', ({ RuleScenario }) => {
    RuleScenario('Summary shows pattern counts in table format', ({ Given, When, Then, And }) => {
      Given('completed phases with deliverables:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        state = initState();
        for (const row of dataTable) {
          const name = row.Name ?? '';
          const deliverableCount = parseInt(row.Deliverables ?? '1', 10);
          const deliverables = Array.from({ length: deliverableCount }, (_, i) => ({
            name: `${name} Deliverable ${i + 1}`,
            status: 'complete',
            tests: 1,
            location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/item${i + 1}/`,
            release: row.Release ?? undefined,
          })) satisfies TestDeliverable[];
          state.patterns.push(
            createTestPattern({
              name: row.Name ?? 'Unnamed',
              phase: parseInt(row.Phase ?? '0', 10),
              status: 'completed',
              workflow: row.Workflow ?? 'implementation',
              deliverables,
            })
          );
        }
      });

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        generateWithReleaseFilter('v0.2.0');
      });

      Then('the output should contain "## Summary"', () => assertContains('## Summary'));
      And('the output should contain "Patterns in PR"', () => assertContains('Patterns in PR'));
      And('the output should contain "Completed"', () => assertContains('Completed'));
    });

    RuleScenario('Summary shows release tag when filtering', ({ Given, When, Then, And }) => {
      Given('completed phases with deliverables:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        state = initState();
        for (const row of dataTable) {
          const name = row.Name ?? '';
          const deliverableCount = parseInt(row.Deliverables ?? '1', 10);
          const deliverables = Array.from({ length: deliverableCount }, (_, i) => ({
            name: `${name} Deliverable ${i + 1}`,
            status: 'complete',
            tests: 1,
            location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/item${i + 1}/`,
            release: row.Release ?? undefined,
          })) satisfies TestDeliverable[];
          state.patterns.push(
            createTestPattern({
              name: row.Name ?? 'Unnamed',
              phase: parseInt(row.Phase ?? '0', 10),
              status: 'completed',
              workflow: row.Workflow ?? 'implementation',
              deliverables,
            })
          );
        }
      });

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        generateWithReleaseFilter('v0.2.0');
      });

      Then('the output should contain "## Summary"', () => assertContains('## Summary'));
      And('the output should contain "Release Tag"', () => assertContains('Release Tag'));
      And('the output should contain "v0.2.0"', () => assertContains('v0.2.0'));
    });
  });

  // ===========================================================================
  // Deliverables Display
  // ===========================================================================

  Rule('Deliverables are displayed inline with their parent patterns', ({ RuleScenario }) => {
    RuleScenario('Deliverables shown inline with patterns', ({ Given, When, Then, And }) => {
      Given('completed phase 23 with deliverables:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        state = initState();
        const deliverables = dataTable.map((row) => ({
          name: row.Name ?? 'Unnamed',
          status: row.Status ?? 'complete',
          tests: parseInt(row.Tests ?? '0', 10),
          location: row.Location ?? 'src/',
          release: 'v0.2.0',
        })) satisfies TestDeliverable[];
        state.patterns.push(
          createTestPattern({
            name: 'Phase 23 Pattern',
            phase: 23,
            status: 'completed',
            workflow: 'implementation',
            deliverables,
          })
        );
      });

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        state!.dataset = buildDataset();
        state!.options = { releaseFilter: 'v0.2.0', includeDeliverables: true };
        state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
      });

      Then('the output should contain "Deliverables:"', () => assertContains('Deliverables:'));
      And('the output should contain "Fix parseArgs bug"', () =>
        assertContains('Fix parseArgs bug')
      );
      And('the output should contain "Add --version flag"', () =>
        assertContains('Add --version flag')
      );
      And('the output should contain "Update README language"', () =>
        assertContains('Update README language')
      );
    });

    RuleScenario('Deliverables show release tags', ({ Given, When, Then }) => {
      Given('completed phase 23 with deliverables:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        state = initState();
        const deliverables = dataTable.map((row) => ({
          name: row.Name ?? 'Unnamed',
          status: row.Status ?? 'complete',
          tests: parseInt(row.Tests ?? '0', 10),
          location: row.Location ?? 'src/',
          release: 'v0.2.0',
        })) satisfies TestDeliverable[];
        state.patterns.push(
          createTestPattern({
            name: 'Phase 23 Pattern',
            phase: 23,
            status: 'completed',
            workflow: 'implementation',
            deliverables,
          })
        );
      });

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        state!.dataset = buildDataset();
        state!.options = { releaseFilter: 'v0.2.0', includeDeliverables: true };
        state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
      });

      Then('the output should contain "(v0.2.0)"', () => assertContains('(v0.2.0)'));
    });
  });

  // ===========================================================================
  // Review Checklist
  // ===========================================================================

  Rule('Review checklist includes standard code quality verification items', ({ RuleScenario }) => {
    RuleScenario(
      'Review checklist includes standard code quality items',
      ({ Given, When, Then, And }) => {
        Given(
          'completed phase 23 with deliverables:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            state = initState();
            const deliverables = dataTable.map((row) => ({
              name: row.Name ?? 'Unnamed',
              status: row.Status ?? 'complete',
              tests: parseInt(row.Tests ?? '0', 10),
              location: row.Location ?? 'src/',
              release: 'v0.2.0',
            })) satisfies TestDeliverable[];
            state.patterns.push(
              createTestPattern({
                name: 'Phase 23 Pattern',
                phase: 23,
                status: 'completed',
                workflow: 'implementation',
                deliverables,
              })
            );
          }
        );

        When('generating PR changes with releaseFilter "v0.2.0"', () => {
          state!.dataset = buildDataset();
          state!.options = { releaseFilter: 'v0.2.0', includeReviewChecklist: true };
          state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
        });

        Then('the output should contain "## Review Checklist"', () =>
          assertContains('## Review Checklist')
        );
        And('the output should contain "- [ ] Code follows project conventions"', () =>
          assertContains('- [ ] Code follows project conventions')
        );
        And('the output should contain "- [ ] Tests added/updated for changes"', () =>
          assertContains('- [ ] Tests added/updated for changes')
        );
        And('the output should contain "- [ ] Documentation updated if needed"', () =>
          assertContains('- [ ] Documentation updated if needed')
        );
      }
    );

    RuleScenario(
      'Review checklist includes completed pattern verification',
      ({ Given, When, Then, And }) => {
        Given(
          'completed phase 23 with deliverables:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            state = initState();
            const deliverables = dataTable.map((row) => ({
              name: row.Name ?? 'Unnamed',
              status: row.Status ?? 'complete',
              tests: parseInt(row.Tests ?? '0', 10),
              location: row.Location ?? 'src/',
              release: 'v0.2.0',
            })) satisfies TestDeliverable[];
            state.patterns.push(
              createTestPattern({
                name: 'Phase 23 Pattern',
                phase: 23,
                status: 'completed',
                workflow: 'implementation',
                deliverables,
              })
            );
          }
        );

        When('generating PR changes with releaseFilter "v0.2.0"', () => {
          state!.dataset = buildDataset();
          state!.options = { releaseFilter: 'v0.2.0', includeReviewChecklist: true };
          state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
        });

        Then('the output should contain "## Review Checklist"', () =>
          assertContains('## Review Checklist')
        );
        And('the output should contain "- [ ] Completed patterns verified working"', () =>
          assertContains('- [ ] Completed patterns verified working')
        );
      }
    );
  });

  // ===========================================================================
  // Dependencies Section
  // ===========================================================================

  Rule('Dependencies section shows inter-pattern relationships', ({ RuleScenario }) => {
    RuleScenario('Dependencies shows what patterns enable', ({ Given, When, Then, And }) => {
      Given(
        'completed phases with dependency relationships:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state = initState();
          for (const row of dataTable) {
            const name = row.Name ?? '';
            const enables = row.Enables ? row.Enables.split(',').map((e) => e.trim()) : [];
            const deliverables = [
              {
                name: `${name} Deliverable`,
                status: 'complete',
                tests: 1,
                location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
                release: row.Release ?? undefined,
              },
            ] satisfies TestDeliverable[];
            state.patterns.push(
              createTestPattern({
                name: row.Name ?? 'Unnamed',
                phase: parseInt(row.Phase ?? '0', 10),
                status: 'completed',
                workflow: row.Workflow ?? 'implementation',
                deliverables,
                enables,
              })
            );
          }
        }
      );

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        state!.dataset = buildDataset();
        state!.options = { releaseFilter: 'v0.2.0', includeDependencies: true };
        state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
      });

      Then('the output should contain "## Dependencies"', () => assertContains('## Dependencies'));
      And('the output should contain "### Enables"', () => assertContains('### Enables'));
      And('the output should contain "CatalogueSchemas"', () => assertContains('CatalogueSchemas'));
      And('the output should contain "MermaidExpansion"', () => assertContains('MermaidExpansion'));
    });

    RuleScenario('Dependencies shows what patterns depend on', ({ Given, When, Then, And }) => {
      Given(
        'completed phases where all dependencies are met:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state = initState();
          for (const row of dataTable) {
            const name = row.Name ?? '';
            const dependsOn = row.DependsOn ? row.DependsOn.split(',').map((d) => d.trim()) : [];
            const deliverables = [
              {
                name: `${name} Deliverable`,
                status: 'complete',
                tests: 1,
                location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
                release: row.Release ?? undefined,
              },
            ] satisfies TestDeliverable[];
            state.patterns.push(
              createTestPattern({
                name: row.Name ?? 'Unnamed',
                phase: parseInt(row.Phase ?? '0', 10),
                status: 'completed',
                workflow: row.Workflow ?? 'implementation',
                deliverables,
                dependsOn,
              })
            );
          }
        }
      );

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        state!.dataset = buildDataset();
        state!.options = { releaseFilter: 'v0.2.0', includeDependencies: true };
        state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
      });

      Then('the output should contain "## Dependencies"', () => assertContains('## Dependencies'));
      And('the output should contain "### Depends On"', () => assertContains('### Depends On'));
      And('the output should contain "Error Handling"', () => assertContains('Error Handling'));
    });
  });

  // ===========================================================================
  // Business Value
  // ===========================================================================

  Rule('Business value can be included or excluded from pattern metadata', ({ RuleScenario }) => {
    RuleScenario(
      'Pattern metadata includes business value when enabled',
      ({ Given, When, Then, And }) => {
        Given(
          'a completed phase with business value:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            state = initState();
            for (const row of dataTable) {
              const name = row.Name ?? '';
              const deliverables = [
                {
                  name: `${name} Deliverable`,
                  status: 'complete',
                  tests: 1,
                  location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
                  release: row.Release ?? undefined,
                },
              ] satisfies TestDeliverable[];
              const pattern = createTestPattern({
                name: row.Name ?? 'Unnamed',
                phase: parseInt(row.Phase ?? '0', 10),
                status: 'completed',
                workflow: row.Workflow ?? 'implementation',
                deliverables,
              });
              (pattern as { businessValue?: string }).businessValue = row.BusinessValue ?? '';
              state.patterns.push(pattern);
            }
          }
        );

        When(
          'generating PR changes with releaseFilter "v0.2.0" and includeBusinessValue enabled',
          () => {
            state!.dataset = buildDataset();
            state!.options = { releaseFilter: 'v0.2.0', includeBusinessValue: true };
            state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
          }
        );

        Then('the output should contain "Changelog Gen"', () => assertContains('Changelog Gen'));
        And('the output should contain "Business Value"', () => assertContains('Business Value'));
        And('the output should contain "Automated release notes"', () =>
          assertContains('Automated release notes')
        );
      }
    );

    RuleScenario('Business value can be excluded', ({ Given, When, Then }) => {
      Given(
        'a completed phase with business value:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state = initState();
          for (const row of dataTable) {
            const name = row.Name ?? '';
            const deliverables = [
              {
                name: `${name} Deliverable`,
                status: 'complete',
                tests: 1,
                location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
                release: row.Release ?? undefined,
              },
            ] satisfies TestDeliverable[];
            const pattern = createTestPattern({
              name: row.Name ?? 'Unnamed',
              phase: parseInt(row.Phase ?? '0', 10),
              status: 'completed',
              workflow: row.Workflow ?? 'implementation',
              deliverables,
            });
            (pattern as { businessValue?: string }).businessValue = row.BusinessValue ?? '';
            state.patterns.push(pattern);
          }
        }
      );

      When('generating PR changes with includeBusinessValue disabled', () => {
        state!.dataset = buildDataset();
        state!.options = { includeBusinessValue: false };
        state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
      });

      Then('the output should not contain "Business Value"', () =>
        assertNotContains('Business Value')
      );
    });
  });

  // ===========================================================================
  // Sorting Options
  // ===========================================================================

  Rule('Output can be sorted by phase number or priority', ({ RuleScenario }) => {
    RuleScenario('Phases sorted by phase number', ({ Given, When, Then, And }) => {
      Given('completed phases in random order:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        setupCompletedPhasesWithReleases(dataTable);
      });

      When('generating PR changes with sortBy "phase"', () => {
        state!.dataset = buildDataset();
        state!.options = { sortBy: 'phase' };
        state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
      });

      Then('Phase 23 should appear before Phase 31 in the output', () =>
        assertAppearsBefore('Phase 23', 'Phase 31')
      );
      And('Phase 31 should appear before Phase 40 in the output', () =>
        assertAppearsBefore('Phase 31', 'Phase 40')
      );
    });

    RuleScenario('Phases sorted by priority', ({ Given, When, Then }) => {
      Given(
        'completed phases with different priorities:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state = initState();
          for (const row of dataTable) {
            const name = row.Name ?? '';
            const deliverables = [
              {
                name: `${name} Deliverable`,
                status: 'complete',
                tests: 1,
                location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
                release: row.Release ?? undefined,
              },
            ] satisfies TestDeliverable[];
            state.patterns.push(
              createTestPattern({
                name: row.Name ?? 'Unnamed',
                phase: parseInt(row.Phase ?? '0', 10),
                status: 'completed',
                workflow: row.Workflow ?? 'implementation',
                deliverables,
                priority: parsePriority(row.Priority ?? 'medium'),
              })
            );
          }
        }
      );

      When('generating PR changes with sortBy "priority"', () => {
        state!.dataset = buildDataset();
        state!.options = { sortBy: 'priority' };
        state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
      });

      Then('"High Priority" should appear before "Low Priority" in the output', () =>
        assertAppearsBefore('High Priority', 'Low Priority')
      );
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  Rule('Edge cases produce graceful output', ({ RuleScenario }) => {
    RuleScenario('No matching phases produces no changes message', ({ Given, When, Then }) => {
      Given('no completed phases for release "v0.2.0"', () => {
        state = initState();
        state.patterns.push(
          createTestPattern({
            name: 'Other Release Pattern',
            phase: 10,
            status: 'completed',
            workflow: 'implementation',
            deliverables: [
              {
                name: 'Other Deliverable',
                status: 'complete',
                tests: 1,
                location: 'src/other/',
                release: 'v0.1.0',
              },
            ],
          })
        );
      });

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        generateWithReleaseFilter('v0.2.0');
      });

      Then('the output should contain "No patterns found"', () =>
        assertContains('No patterns found')
      );
    });

    RuleScenario('Patterns without deliverables still display', ({ Given, When, Then, And }) => {
      Given(
        'completed phases without deliverables:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state = initState();
          for (const row of dataTable) {
            // Create pattern with deliverable that has the release tag so it gets included
            state.patterns.push(
              createTestPattern({
                name: row.Name ?? 'Unnamed',
                phase: parseInt(row.Phase ?? '0', 10),
                status: 'completed',
                workflow: row.Workflow ?? 'implementation',
                // Add a deliverable with release tag for filtering, but we won't show it
                deliverables: [
                  {
                    name: 'Hidden',
                    status: 'complete',
                    tests: 0,
                    location: 'src/',
                    release: row.Release ?? 'v0.2.0',
                  },
                ],
              })
            );
          }
        }
      );

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        state!.dataset = buildDataset();
        state!.options = { releaseFilter: 'v0.2.0', includeDeliverables: false };
        state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
      });

      Then('the output should contain "Critical Fixes"', () => assertContains('Critical Fixes'));
      And('the output should not contain "Deliverables:"', () =>
        assertNotContains('Deliverables:')
      );
    });

    RuleScenario('Patterns without phase show in phase 0 group', ({ Given, When, Then, And }) => {
      Given('patterns from different sources:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        state = initState();
        for (const row of dataTable) {
          const name = row.Name ?? '';
          const phase = row.Phase?.trim() ? parseInt(row.Phase, 10) : undefined;
          const deliverables = [
            {
              name: `${name} Deliverable`,
              status: 'complete',
              tests: 1,
              location: `src/${name.toLowerCase().replace(/\s+/g, '-')}/`,
              release: row.Release ?? undefined,
            },
          ] satisfies TestDeliverable[];
          state.patterns.push(
            createTestPattern({
              name: row.Name ?? 'Unnamed',
              phase,
              status: parseStatus(row.Status ?? 'completed'),
              workflow: 'implementation',
              deliverables,
            })
          );
        }
      });

      When('generating PR changes with releaseFilter "v0.2.0"', () => {
        generateWithReleaseFilter('v0.2.0');
      });

      Then('the output should contain "Gherkin Phase 23"', () =>
        assertContains('Gherkin Phase 23')
      );
      And('the output should contain "TypeScript Pattern"', () =>
        assertContains('TypeScript Pattern')
      );
      And('the output should contain "### Phase 0"', () => assertContains('### Phase 0'));
    });
  });

  // ===========================================================================
  // Deliverable-Level Filtering
  // ===========================================================================

  Rule(
    'Deliverable-level filtering shows only matching deliverables within a phase',
    ({ RuleScenario }) => {
      RuleScenario(
        'Mixed releases within single phase shows only matching deliverables',
        ({ Given, When, Then, And }) => {
          Given(
            'a phase with mixed-release deliverables:',
            (_ctx: unknown, dataTable: DataTableRow[]) => {
              state = initState();
              // Group rows by phase, then build deliverables arrays
              const phaseGroups = dataTable.reduce(
                (acc, row) => {
                  const phase = parseInt(row.Phase ?? '0', 10);
                  if (!acc[phase]) {
                    acc[phase] = { name: row.Name ?? 'Unnamed', rows: [] };
                  }
                  acc[phase].rows.push(row);
                  return acc;
                },
                {} as Record<number, { name: string; rows: DataTableRow[] }>
              );

              for (const [phaseStr, data] of Object.entries(phaseGroups)) {
                const phase = parseInt(phaseStr, 10);
                const deliverables = data.rows.map((row) => ({
                  name: row.Deliverable ?? 'Unnamed Deliverable',
                  status: row.Status ?? 'complete',
                  tests: parseInt(row.Tests ?? '1', 10),
                  location: row.Location ?? 'src/',
                  release: row.Release ?? undefined,
                })) satisfies TestDeliverable[];
                state.patterns.push(
                  createTestPattern({
                    name: data.name,
                    phase,
                    status: 'completed',
                    workflow: 'implementation',
                    deliverables,
                  })
                );
              }
            }
          );

          When('generating PR changes with releaseFilter "v0.2.0"', () => {
            state!.dataset = buildDataset();
            state!.options = { releaseFilter: 'v0.2.0', includeDeliverables: true };
            state!.output = generatePrChangesMarkdown(state!.dataset, state!.options);
          });

          Then('the output should contain "Feature B"', () => assertContains('Feature B'));
          And('the output should contain "Feature C"', () => assertContains('Feature C'));
          And('the output should not contain "Feature A"', () => assertNotContains('Feature A'));
        }
      );
    }
  );
});
