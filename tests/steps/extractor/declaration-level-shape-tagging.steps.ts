/**
 * Step definitions for Declaration-Level Shape Tagging tests
 *
 * Tests the discoverTaggedShapes function that scans TypeScript source
 * code for declarations annotated with the @libar-docs-shape JSDoc tag.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { discoverTaggedShapes } from '../../../src/extractor/shape-extractor.js';
import type { ExtractedShape } from '../../../src/validation-schemas/extracted-shape.js';

// ============================================================================
// State
// ============================================================================

interface TestState {
  sourceCode: string;
  discoveredShapes: readonly ExtractedShape[];
}

function initState(): TestState {
  return { sourceCode: '', discoveredShapes: [] };
}

let state: TestState | null = null;

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature(
  'tests/features/extractor/declaration-level-shape-tagging.feature'
);

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the shape discovery system is initialized', () => {
      state = initState();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule 1: Declarations opt in via libar-docs-shape tag
  // ──────────────────────────────────────────────────────────────────────

  Rule('Declarations opt in via libar-docs-shape tag', ({ RuleScenario }) => {
    RuleScenario('Tagged declaration is extracted as shape', ({ Given, When, Then, And }) => {
      Given('a TypeScript source file containing:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('discoverTaggedShapes runs on the source', () => {
        const result = discoverTaggedShapes(state!.sourceCode);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.discoveredShapes = result.value.shapes;
        }
      });

      Then('1 shape is returned', () => {
        expect(state!.discoveredShapes).toHaveLength(1);
      });

      And(
        'the shape has name {string} and kind {string}',
        (_ctx: unknown, name: string, kind: string) => {
          const shape = state!.discoveredShapes[0];
          expect(shape).toBeDefined();
          expect(shape!.name).toBe(name);
          expect(shape!.kind).toBe(kind);
        }
      );
    });

    RuleScenario('Untagged exported declaration is not extracted', ({ Given, When, Then }) => {
      Given('a TypeScript source file containing:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('discoverTaggedShapes runs on the source', () => {
        const result = discoverTaggedShapes(state!.sourceCode);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.discoveredShapes = result.value.shapes;
        }
      });

      Then('0 shapes are returned', () => {
        expect(state!.discoveredShapes).toHaveLength(0);
      });
    });

    RuleScenario('Group name is captured from tag value', ({ Given, When, Then, And }) => {
      Given('a TypeScript source file containing:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('discoverTaggedShapes runs on the source', () => {
        const result = discoverTaggedShapes(state!.sourceCode);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.discoveredShapes = result.value.shapes;
        }
      });

      Then('1 shape is returned', () => {
        expect(state!.discoveredShapes).toHaveLength(1);
      });

      And(
        'the shape has name {string} and group {string}',
        (_ctx: unknown, name: string, group: string) => {
          const shape = state!.discoveredShapes[0];
          expect(shape).toBeDefined();
          expect(shape!.name).toBe(name);
          expect(shape!.group).toBe(group);
        }
      );
    });

    RuleScenario('Bare tag works without group name', ({ Given, When, Then, And }) => {
      Given('a TypeScript source file containing:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('discoverTaggedShapes runs on the source', () => {
        const result = discoverTaggedShapes(state!.sourceCode);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.discoveredShapes = result.value.shapes;
        }
      });

      Then('1 shape is returned', () => {
        expect(state!.discoveredShapes).toHaveLength(1);
      });

      And('the shape has name {string} and no group', (_ctx: unknown, name: string) => {
        const shape = state!.discoveredShapes[0];
        expect(shape).toBeDefined();
        expect(shape!.name).toBe(name);
        expect(shape!.group).toBeUndefined();
      });
    });

    RuleScenario('Non-exported tagged declaration is extracted', ({ Given, When, Then, And }) => {
      Given('a TypeScript source file containing:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('discoverTaggedShapes runs on the source', () => {
        const result = discoverTaggedShapes(state!.sourceCode);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.discoveredShapes = result.value.shapes;
        }
      });

      Then('1 shape is returned', () => {
        expect(state!.discoveredShapes).toHaveLength(1);
      });

      And(
        'the shape has name {string} and kind {string}',
        (_ctx: unknown, name: string, kind: string) => {
          const shape = state!.discoveredShapes[0];
          expect(shape).toBeDefined();
          expect(shape!.name).toBe(name);
          expect(shape!.kind).toBe(kind);
        }
      );

      And('the shape has exported false', () => {
        const shape = state!.discoveredShapes[0];
        expect(shape).toBeDefined();
        expect(shape!.exported).toBe(false);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule 2: Discovery uses existing estree parser with JSDoc comment scanning
  // ──────────────────────────────────────────────────────────────────────

  Rule('Discovery uses existing estree parser with JSDoc comment scanning', ({ RuleScenario }) => {
    RuleScenario('All five declaration kinds are discoverable', ({ Given, When, Then, And }) => {
      Given('a TypeScript source file containing:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('discoverTaggedShapes runs on the source', () => {
        const result = discoverTaggedShapes(state!.sourceCode);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.discoveredShapes = result.value.shapes;
        }
      });

      Then('5 shapes are returned', () => {
        expect(state!.discoveredShapes).toHaveLength(5);
      });

      And(
        'the shapes have kinds {string}, {string}, {string}, {string}, {string}',
        (_ctx: unknown, k1: string, k2: string, k3: string, k4: string, k5: string) => {
          const kinds = state!.discoveredShapes.map((s) => s.kind);
          expect(kinds).toContain(k1);
          expect(kinds).toContain(k2);
          expect(kinds).toContain(k3);
          expect(kinds).toContain(k4);
          expect(kinds).toContain(k5);
        }
      );

      And('all shapes have group {string}', (_ctx: unknown, group: string) => {
        for (const shape of state!.discoveredShapes) {
          expect(shape.group).toBe(group);
        }
      });
    });

    RuleScenario(
      'JSDoc with gap larger than MAX_JSDOC_LINE_DISTANCE is not matched',
      ({ Given, When, Then }) => {
        Given('a TypeScript source file containing:', (_ctx: unknown, docString: string) => {
          state!.sourceCode = docString;
        });

        When('discoverTaggedShapes runs on the source', () => {
          const result = discoverTaggedShapes(state!.sourceCode);
          expect(result.ok).toBe(true);
          if (result.ok) {
            state!.discoveredShapes = result.value.shapes;
          }
        });

        Then('0 shapes are returned', () => {
          expect(state!.discoveredShapes).toHaveLength(0);
        });
      }
    );

    RuleScenario('Tag coexists with other JSDoc content', ({ Given, When, Then, And }) => {
      Given('a TypeScript source file containing:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('discoverTaggedShapes runs on the source', () => {
        const result = discoverTaggedShapes(state!.sourceCode);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.discoveredShapes = result.value.shapes;
        }
      });

      Then('1 shape is returned', () => {
        expect(state!.discoveredShapes).toHaveLength(1);
      });

      And(
        'the shape has name {string} and group {string}',
        (_ctx: unknown, name: string, group: string) => {
          const shape = state!.discoveredShapes[0];
          expect(shape).toBeDefined();
          expect(shape!.name).toBe(name);
          expect(shape!.group).toBe(group);
        }
      );

      And('the shape JSDoc contains {string}', (_ctx: unknown, expectedContent: string) => {
        const shape = state!.discoveredShapes[0];
        expect(shape).toBeDefined();
        expect(shape!.jsDoc).toBeDefined();
        expect(shape!.jsDoc).toContain(expectedContent);
      });
    });
  });
});
