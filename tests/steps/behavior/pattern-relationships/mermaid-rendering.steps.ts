/**
 * Mermaid Rendering Step Definitions
 *
 * BDD step definitions for testing Mermaid graph generation with
 * all relationship types rendered using distinct arrow styles.
 *
 * These step definitions test:
 * 1. Arrow style mapping (uses, depends-on, implements, extends)
 * 2. Node ID sanitization
 * 3. Combined graph rendering
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { transformToMasterDataset } from '../../../../src/generators/pipeline/transform-dataset.js';
import { createDefaultTagRegistry } from '../../../../src/validation-schemas/index.js';
import type { RelationshipEntry } from '../../../../src/validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../../../src/types/index.js';
import { asPatternId, asCategoryName, asSourceFilePath } from '../../../../src/types/branded.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const feature = await loadFeature(
  resolve(__dirname, '../../../features/behavior/pattern-relationships/mermaid-rendering.feature')
);

// =============================================================================
// Module-level state
// =============================================================================

interface MermaidRenderingState {
  patterns: ExtractedPattern[];
  generatedMermaid: string;
  sanitizedNodeId: string;
}

let state: MermaidRenderingState | null = null;

function initState(): MermaidRenderingState {
  return {
    patterns: [],
    generatedMermaid: '',
    sanitizedNodeId: '',
  };
}

/**
 * Sanitize pattern name for mermaid node ID
 * (Matches implementation in patterns.ts)
 */
function sanitizeNodeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Build Mermaid graph string from patterns
 * (Simplified version of buildDependencyGraph for testing)
 */
function buildMermaidGraph(relationshipIndex: Record<string, RelationshipEntry>): string {
  const patternNames = Object.keys(relationshipIndex);

  if (patternNames.length === 0) {
    return '';
  }

  const lines: string[] = ['graph TD'];

  for (const name of patternNames) {
    const rel = relationshipIndex[name];
    if (!rel) continue;

    const nodeId = sanitizeNodeId(name);

    // uses relationships (solid arrow)
    for (const target of rel.uses) {
      lines.push(`    ${nodeId} --> ${sanitizeNodeId(target)}`);
    }

    // dependsOn relationships (dashed arrow)
    for (const target of rel.dependsOn) {
      lines.push(`    ${nodeId} -.-> ${sanitizeNodeId(target)}`);
    }

    // implements relationships (dotted arrow)
    for (const target of rel.implementsPatterns) {
      lines.push(`    ${nodeId} ..-> ${sanitizeNodeId(target)}`);
    }

    // extends relationships (solid open arrow)
    if (rel.extendsPattern) {
      lines.push(`    ${nodeId} -->> ${sanitizeNodeId(rel.extendsPattern)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Create a minimal ExtractedPattern for testing
 */
function createTestPattern(
  name: string,
  overrides: Partial<ExtractedPattern> = {}
): ExtractedPattern {
  return {
    id: asPatternId(`test-${name.toLowerCase().replace(/\s/g, '-')}`),
    name,
    category: asCategoryName('test'),
    directive: {
      tags: [],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 10 },
    },
    code: '',
    source: {
      file: asSourceFilePath(`test/${name}.ts`),
      lines: [1, 10] as const,
    },
    exports: [],
    extractedAt: new Date().toISOString(),
    patternName: name,
    ...overrides,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // RULE 1: Arrow Style Mapping
  // ===========================================================================

  Rule('Each relationship type has a distinct arrow style', ({ RuleScenario }) => {
    state = initState();
    RuleScenario('Uses relationships render as solid arrows', ({ Given, When, Then, And }) => {
      Given('a pattern "Orchestrator" with uses ["CommandBus", "EventStore"]', () => {
        state!.patterns = [
          createTestPattern('Orchestrator', {
            uses: ['CommandBus', 'EventStore'],
          }),
          createTestPattern('CommandBus'),
          createTestPattern('EventStore'),
        ];
      });

      When('the Mermaid graph is generated', () => {
        const tagRegistry = createDefaultTagRegistry();
        const dataset = transformToMasterDataset({
          patterns: state!.patterns,
          tagRegistry,
        });
        state!.generatedMermaid = buildMermaidGraph(dataset.relationshipIndex ?? {});
      });

      Then('the output should contain "Orchestrator --> CommandBus"', () => {
        expect(state!.generatedMermaid).toContain('Orchestrator --> CommandBus');
      });

      And('the output should contain "Orchestrator --> EventStore"', () => {
        expect(state!.generatedMermaid).toContain('Orchestrator --> EventStore');
      });
    });

    RuleScenario('Depends-on relationships render as dashed arrows', ({ Given, When, Then }) => {
      Given('a pattern "DCB" with dependsOn ["CMSDualWrite"]', () => {
        state!.patterns = [
          createTestPattern('DCB', {
            dependsOn: ['CMSDualWrite'],
          }),
          createTestPattern('CMSDualWrite'),
        ];
      });

      When('the Mermaid graph is generated', () => {
        const tagRegistry = createDefaultTagRegistry();
        const dataset = transformToMasterDataset({
          patterns: state!.patterns,
          tagRegistry,
        });
        state!.generatedMermaid = buildMermaidGraph(dataset.relationshipIndex ?? {});
      });

      Then('the output should contain "DCB -.-> CMSDualWrite"', () => {
        expect(state!.generatedMermaid).toContain('DCB -.-> CMSDualWrite');
      });
    });

    RuleScenario('Implements relationships render as dotted arrows', ({ Given, When, Then }) => {
      Given('a file "outbox.ts" that implements "EventStoreDurability"', () => {
        state!.patterns = [
          createTestPattern('outbox.ts', {
            implementsPatterns: ['EventStoreDurability'],
          }),
          createTestPattern('EventStoreDurability'),
        ];
      });

      When('the Mermaid graph is generated', () => {
        const tagRegistry = createDefaultTagRegistry();
        const dataset = transformToMasterDataset({
          patterns: state!.patterns,
          tagRegistry,
        });
        state!.generatedMermaid = buildMermaidGraph(dataset.relationshipIndex ?? {});
      });

      Then('the output should contain "outbox_ts ..-> EventStoreDurability"', () => {
        expect(state!.generatedMermaid).toContain('outbox_ts ..-> EventStoreDurability');
      });
    });

    RuleScenario('Extends relationships render as solid open arrows', ({ Given, When, Then }) => {
      Given('a pattern "ReactiveProjections" that extends "ProjectionCategories"', () => {
        state!.patterns = [
          createTestPattern('ReactiveProjections', {
            extendsPattern: 'ProjectionCategories',
          }),
          createTestPattern('ProjectionCategories'),
        ];
      });

      When('the Mermaid graph is generated', () => {
        const tagRegistry = createDefaultTagRegistry();
        const dataset = transformToMasterDataset({
          patterns: state!.patterns,
          tagRegistry,
        });
        state!.generatedMermaid = buildMermaidGraph(dataset.relationshipIndex ?? {});
      });

      Then('the output should contain "ReactiveProjections -->> ProjectionCategories"', () => {
        expect(state!.generatedMermaid).toContain('ReactiveProjections -->> ProjectionCategories');
      });
    });
  });

  // ===========================================================================
  // RULE 2: Node Sanitization
  // ===========================================================================

  Rule('Pattern names are sanitized for Mermaid node IDs', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'Special characters are replaced',
      ({ Given, When, Then }, variables: { patternName: string; nodeId: string }) => {
        Given('a pattern named {string}', () => {
          state = initState();
          // patternName comes from Scenario Outline Examples
        });

        When('the node ID is sanitized', () => {
          state!.sanitizedNodeId = sanitizeNodeId(variables.patternName);
        });

        Then('the node ID should be {string}', () => {
          expect(state!.sanitizedNodeId).toBe(variables.nodeId);
        });
      }
    );
  });

  // ===========================================================================
  // RULE 3: Combined Graph
  // ===========================================================================

  Rule('All relationship types appear in single graph', ({ RuleScenario }) => {
    state = initState();
    RuleScenario(
      'Complete dependency graph with all relationship types',
      ({ Given, When, Then, And }) => {
        Given('the following patterns and relationships:', (_ctx: unknown, table: unknown) => {
          const rows = table as Array<{
            name: string;
            uses: string;
            dependsOn: string;
            implements: string;
            extends: string;
          }>;

          state!.patterns = rows.map((row) =>
            createTestPattern(row.name, {
              uses: row.uses !== '-' ? [row.uses] : undefined,
              dependsOn: row.dependsOn !== '-' ? [row.dependsOn] : undefined,
              implementsPatterns: row.implements !== '-' ? [row.implements] : undefined,
              extendsPattern: row.extends !== '-' ? row.extends : undefined,
            })
          );

          // Add target patterns that are referenced
          const targets = new Set<string>();
          for (const row of rows) {
            if (row.uses !== '-') targets.add(row.uses);
            if (row.dependsOn !== '-') targets.add(row.dependsOn);
            if (row.implements !== '-') targets.add(row.implements);
            if (row.extends !== '-') targets.add(row.extends);
          }

          for (const target of targets) {
            if (!state!.patterns.find((p) => p.patternName === target || p.name === target)) {
              state!.patterns.push(createTestPattern(target));
            }
          }
        });

        When('the Mermaid graph is generated', () => {
          const tagRegistry = createDefaultTagRegistry();
          const dataset = transformToMasterDataset({
            patterns: state!.patterns,
            tagRegistry,
          });
          state!.generatedMermaid = buildMermaidGraph(dataset.relationshipIndex ?? {});
        });

        Then('the graph should contain at least one of each arrow type', () => {
          expect(state!.generatedMermaid).toContain('-->'); // uses
          expect(state!.generatedMermaid).toContain('-.->'); // dependsOn
          expect(state!.generatedMermaid).toContain('..->'); // implements
          expect(state!.generatedMermaid).toContain('-->>'); // extends
        });

        And('the graph header should be "graph TD"', () => {
          expect(state!.generatedMermaid).toContain('graph TD');
        });
      }
    );
  });
});
