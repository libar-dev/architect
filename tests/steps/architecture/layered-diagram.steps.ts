/**
 * Layered Diagram Step Definitions
 *
 * BDD step definitions for testing the ArchitectureCodec
 * layered diagram generation. Tests layer subgraphs,
 * layer ordering, and context labels in nodes.
 *
 * @architect
 */

import { expect } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';

import {
  createArchitectureCodec,
  type ArchitectureCodecOptions,
} from '../../../src/renderable/codecs/architecture.js';
import { transformToMasterDataset } from '../../../src/generators/pipeline/transform-dataset.js';
import { renderToMarkdown } from '../../../src/renderable/render.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import { createDefaultTagRegistry, createTestPattern } from '../../fixtures/dataset-factories.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface LayeredDiagramState {
  patterns: ExtractedPattern[];
  codecOptions: ArchitectureCodecOptions;
  markdown: string | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: LayeredDiagramState | null = null;
let patternCounter = 0;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): LayeredDiagramState {
  patternCounter = 0;
  return {
    patterns: [],
    codecOptions: { diagramType: 'layered' },
    markdown: null,
  };
}

/**
 * Generate a valid pattern ID matching /^pattern-[a-f0-9]{8}$/
 */
function generatePatternId(): string {
  patternCounter++;
  return `pattern-${patternCounter.toString(16).padStart(8, '0')}`;
}

/**
 * Create a pattern with arch fields
 */
function createPatternWithArch(options: {
  name: string;
  archRole?: string;
  archContext?: string;
  archLayer?: string;
}): ExtractedPattern {
  const basePattern = createTestPattern({
    id: generatePatternId(),
    name: options.name,
    status: 'completed',
  });

  return {
    ...basePattern,
    ...(options.archRole && { archRole: options.archRole }),
    ...(options.archContext && { archContext: options.archContext }),
    ...(options.archLayer && { archLayer: options.archLayer }),
  };
}

/**
 * Generate the layered diagram and store as markdown
 */
function generateDiagram(): void {
  if (!state) throw new Error('State not initialized');

  // Build dataset with patterns
  const dataset = transformToMasterDataset({
    patterns: state.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });

  // Create codec with layered diagram type and generate
  const codec = createArchitectureCodec(state.codecOptions);
  const doc = codec.decode(dataset);
  state.markdown = renderToMarkdown(doc);
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature(
  'tests/features/behavior/architecture-diagrams/layered-diagram.feature'
);

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('an architecture codec configured for layered diagrams', () => {
      state = initState();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Layered diagrams group patterns by arch-layer
  // ---------------------------------------------------------------------------

  Rule('Layered diagrams group patterns by arch-layer', ({ RuleScenario }) => {
    RuleScenario('Generate subgraphs for each layer', ({ Given, When, Then }) => {
      Given('patterns with layers:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      When('the layered diagram is generated', () => {
        generateDiagram();
      });

      Then(
        'the Mermaid output contains subgraphs for layers:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            // The codec uses formatLayerLabel: "domain" → "Domain Layer"
            const expectedLabel = row.layer.charAt(0).toUpperCase() + row.layer.slice(1) + ' Layer';
            expect(state?.markdown).toContain(`subgraph`);
            expect(state?.markdown).toContain(`"${expectedLabel}"`);
          }
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Layer order is domain to infrastructure (top to bottom)
  // ---------------------------------------------------------------------------

  Rule('Layer order is domain to infrastructure (top to bottom)', ({ RuleScenario }) => {
    RuleScenario('Layers render in correct order', ({ Given, When, Then, And }) => {
      Given('patterns with layers:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      When('the layered diagram is generated', () => {
        generateDiagram();
      });

      Then('the domain layer appears before application layer', () => {
        const markdown = state?.markdown ?? '';
        const domainPos = markdown.indexOf('"Domain Layer"');
        const appPos = markdown.indexOf('"Application Layer"');
        // Guard: verify both layers are present before comparing positions
        expect(domainPos).toBeGreaterThanOrEqual(0);
        expect(appPos).toBeGreaterThanOrEqual(0);
        expect(domainPos).toBeLessThan(appPos);
      });

      And('the application layer appears before infrastructure layer', () => {
        const markdown = state?.markdown ?? '';
        const appPos = markdown.indexOf('"Application Layer"');
        const infraPos = markdown.indexOf('"Infrastructure Layer"');
        // Guard: verify both layers are present before comparing positions
        expect(appPos).toBeGreaterThanOrEqual(0);
        expect(infraPos).toBeGreaterThanOrEqual(0);
        expect(appPos).toBeLessThan(infraPos);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Context labels included in layered diagram nodes
  // ---------------------------------------------------------------------------

  Rule('Context labels included in layered diagram nodes', ({ RuleScenario }) => {
    RuleScenario('Nodes include context labels', ({ Given, When, Then, And }) => {
      Given('patterns with layers:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      When('the layered diagram is generated', () => {
        generateDiagram();
      });

      Then(
        'the Mermaid output contains node {string} with context {string}',
        (_ctx: unknown, nodeName: string, context: string) => {
          // The layered codec adds context labels like: NodeName (context)
          expect(state?.markdown).toContain(`${nodeName} (${context})`);
        }
      );

      // Note: vitest-cucumber requires separate definitions for Then vs And
      // even when the pattern is identical
      And(
        'the Mermaid output contains node {string} with context {string}',
        (_ctx: unknown, nodeName: string, context: string) => {
          expect(state?.markdown).toContain(`${nodeName} (${context})`);
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Patterns without layer go to Other subgraph
  // ---------------------------------------------------------------------------

  Rule('Patterns without layer go to Other subgraph', ({ RuleScenario }) => {
    RuleScenario('Unlayered patterns in Other subgraph', ({ Given, When, Then, And }) => {
      Given('patterns with layers:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      When('the layered diagram is generated', () => {
        generateDiagram();
      });

      Then('the Mermaid output contains subgraph {string}', (_ctx: unknown, subgraph: string) => {
        expect(state?.markdown).toContain(`"${subgraph}"`);
      });

      And('the pattern {string} appears in the diagram', (_ctx: unknown, patternName: string) => {
        expect(state?.markdown).toContain(patternName);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Layered diagram includes summary section
  // ---------------------------------------------------------------------------

  Rule('Layered diagram includes summary section', ({ RuleScenario }) => {
    RuleScenario('Summary section for layered view', ({ Given, When, Then }) => {
      Given('patterns with layers:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      When('the layered diagram is generated', () => {
        generateDiagram();
      });

      Then('the document contains elements:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state?.markdown).toContain(row.text);
        }
      });
    });
  });
});
