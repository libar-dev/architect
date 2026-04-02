/**
 * Component Diagram Step Definitions
 *
 * BDD step definitions for testing the ArchitectureCodec
 * component diagram generation. Tests bounded context subgraphs,
 * relationship arrow rendering, and document structure.
 *
 * @architect
 */

import { expect } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';

import {
  createArchitectureCodec,
  type ArchitectureCodecOptions,
} from '../../../src/renderable/codecs/architecture.js';
import { transformToPatternGraph } from '../../../src/generators/pipeline/transform-dataset.js';
import { renderToMarkdown } from '../../../src/renderable/render.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import { createDefaultTagRegistry, createTestPattern } from '../../fixtures/dataset-factories.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface ComponentDiagramState {
  patterns: ExtractedPattern[];
  relationships: Record<
    string,
    {
      uses: string[];
      dependsOn: string[];
      implementsPatterns: string[];
      extendsPattern?: string;
    }
  >;
  codecOptions: ArchitectureCodecOptions;
  markdown: string | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ComponentDiagramState | null = null;
let patternCounter = 0;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): ComponentDiagramState {
  patternCounter = 0;
  return {
    patterns: [],
    relationships: {},
    codecOptions: {},
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
 * Create a pattern with arch fields and optionally track relationships
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
 * Generate the component diagram and store as markdown
 */
function generateDiagram(): void {
  if (!state) throw new Error('State not initialized');

  // Build dataset with patterns
  const dataset = transformToPatternGraph({
    patterns: state.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });

  // Inject relationships into relationshipIndex
  // (This simulates what the real pipeline would do from @architect-uses tags)
  if (Object.keys(state.relationships).length > 0) {
    dataset.relationshipIndex = {};
    for (const [name, rel] of Object.entries(state.relationships)) {
      dataset.relationshipIndex[name] = {
        uses: rel.uses,
        usedBy: [],
        dependsOn: rel.dependsOn,
        enables: [],
        implementsPatterns: rel.implementsPatterns,
        implementedBy: [],
        extendsPattern: rel.extendsPattern,
        extendedBy: [],
        seeAlso: [],
        apiRef: [],
      };
    }
  }

  // Create codec and generate
  const codec = createArchitectureCodec(state.codecOptions);
  const doc = codec.decode(dataset);
  state.markdown = renderToMarkdown(doc);
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature(
  'tests/features/behavior/architecture-diagrams/component-diagram.feature'
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
    Given('an architecture codec with default options', () => {
      state = initState();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Component diagrams group patterns by bounded context
  // ---------------------------------------------------------------------------

  Rule('Component diagrams group patterns by bounded context', ({ RuleScenario }) => {
    RuleScenario('Generate subgraphs for bounded contexts', ({ Given, When, Then }) => {
      Given('patterns with contexts:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
            })
          );
        }
      });

      When('the component diagram is generated', () => {
        generateDiagram();
      });

      Then(
        'the Mermaid output contains subgraphs for contexts:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            // The codec uses formatContextLabel: "orders" → "Orders BC"
            const expectedLabel =
              row.context.charAt(0).toUpperCase() + row.context.slice(1) + ' BC';
            expect(state?.markdown).toContain(`subgraph`);
            expect(state?.markdown).toContain(`"${expectedLabel}"`);
          }
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Context-less patterns go to Shared Infrastructure
  // ---------------------------------------------------------------------------

  Rule('Context-less patterns go to Shared Infrastructure', ({ RuleScenario }) => {
    RuleScenario(
      'Shared infrastructure subgraph for context-less patterns',
      ({ Given, When, Then, And }) => {
        Given('patterns with contexts:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          if (!state) state = initState();
          for (const row of dataTable) {
            state.patterns.push(
              createPatternWithArch({
                name: row.name,
                archRole: row.archRole !== '-' ? row.archRole : undefined,
                archContext: row.archContext !== '-' ? row.archContext : undefined,
              })
            );
          }
        });

        When('the component diagram is generated', () => {
          generateDiagram();
        });

        Then('the Mermaid output contains subgraph {string}', (_ctx: unknown, subgraph: string) => {
          expect(state?.markdown).toContain(`"${subgraph}"`);
        });

        And('the pattern {string} appears in the diagram', (_ctx: unknown, patternName: string) => {
          expect(state?.markdown).toContain(patternName);
        });
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: Relationship types render with distinct arrow styles
  // ---------------------------------------------------------------------------

  Rule('Relationship types render with distinct arrow styles', ({ RuleScenario }) => {
    RuleScenario('Arrow styles for relationship types', ({ Given, When, Then }) => {
      Given('patterns with relationships:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
            })
          );

          // Track relationships
          const uses = row.uses && row.uses !== '-' ? row.uses.split(',').map((s) => s.trim()) : [];
          const dependsOn =
            row.dependsOn && row.dependsOn !== '-'
              ? row.dependsOn.split(',').map((s) => s.trim())
              : [];
          const implementsPatterns =
            row.implements && row.implements !== '-'
              ? row.implements.split(',').map((s) => s.trim())
              : [];

          if (uses.length > 0 || dependsOn.length > 0 || implementsPatterns.length > 0) {
            state.relationships[row.name] = {
              uses,
              dependsOn,
              implementsPatterns,
            };
          }
        }
      });

      When('the component diagram is generated', () => {
        generateDiagram();
      });

      Then('the Mermaid output contains arrows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state?.markdown).toContain(row.arrow);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Arrows only connect annotated components
  // ---------------------------------------------------------------------------

  Rule('Arrows only connect annotated components', ({ RuleScenario }) => {
    RuleScenario('Skip arrows to non-annotated targets', ({ Given, When, Then, And }) => {
      Given('patterns with relationships:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
            })
          );

          const uses = row.uses && row.uses !== '-' ? row.uses.split(',').map((s) => s.trim()) : [];
          if (uses.length > 0) {
            state.relationships[row.name] = {
              uses,
              dependsOn: [],
              implementsPatterns: [],
            };
          }
        }
      });

      When('the component diagram is generated', () => {
        generateDiagram();
      });

      Then('the Mermaid output contains arrow {string}', (_ctx: unknown, arrow: string) => {
        expect(state?.markdown).toContain(arrow);
      });

      And('the Mermaid output does not contain {string}', (_ctx: unknown, text: string) => {
        expect(state?.markdown).not.toContain(text);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Component diagram includes summary section
  // ---------------------------------------------------------------------------

  Rule('Component diagram includes summary section', ({ RuleScenario }) => {
    RuleScenario('Summary section with counts', ({ Given, When, Then }) => {
      Given('patterns with contexts:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
            })
          );
        }
      });

      When('the component diagram is generated', () => {
        generateDiagram();
      });

      Then('the document contains elements:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state?.markdown).toContain(row.text);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Component diagram includes legend when enabled
  // ---------------------------------------------------------------------------

  Rule('Component diagram includes legend when enabled', ({ RuleScenario }) => {
    RuleScenario('Legend section with arrow explanations', ({ Given, When, Then }) => {
      Given('patterns with contexts:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
            })
          );
        }
      });

      When('the component diagram is generated', () => {
        generateDiagram();
      });

      Then('the document contains elements:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state?.markdown).toContain(row.text);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Component diagram includes inventory table when enabled
  // ---------------------------------------------------------------------------

  Rule('Component diagram includes inventory table when enabled', ({ RuleScenario }) => {
    RuleScenario('Inventory table with component details', ({ Given, When, Then, And }) => {
      Given('patterns with contexts:', (_ctx: unknown, dataTable: DataTableRow[]) => {
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

      When('the component diagram is generated', () => {
        generateDiagram();
      });

      Then('the document contains {string}', (_ctx: unknown, text: string) => {
        expect(state?.markdown).toContain(text);
      });

      And('the inventory table includes columns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state?.markdown).toContain(row.column);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Empty architecture data shows guidance message
  // ---------------------------------------------------------------------------

  Rule('Empty architecture data shows guidance message', ({ RuleScenario }) => {
    RuleScenario('No architecture data message', ({ Given, When, Then }) => {
      Given('no patterns with architecture annotations', () => {
        if (!state) state = initState();
        // Leave patterns empty or add patterns without arch tags
        state.patterns = [];
      });

      When('the component diagram is generated', () => {
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
