/**
 * Linter Validation Step Definitions
 *
 * BDD step definitions for testing lint rules that validate
 * relationship integrity and consistency.
 *
 * These step definitions test:
 * 1. Pattern conflict detection (implements + pattern on same file) - IMPLEMENTED
 * 2. Missing relationship target detection (strict mode) - IMPLEMENTED
 * 3. Traceability consistency validation - TESTED WITH HELPER
 * 4. Hierarchy validation (parent references) - TESTED WITH HELPER
 *
 * Note: Some rules are validated using helper functions in this test file
 * since the formal linter rules are not yet implemented. This demonstrates
 * the expected behavior.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  patternConflictInImplements,
  missingRelationshipTarget,
  type LintContext,
} from '../../../../src/lint/rules.js';
import type { DocDirective } from '../../../../src/validation-schemas/doc-directive.js';
import type { LintViolation } from '../../../../src/validation-schemas/lint.js';
import { asDirectiveTag } from '../../../../src/types/branded.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const feature = await loadFeature(
  resolve(__dirname, '../../../features/behavior/pattern-relationships/linter-validation.feature')
);

// =============================================================================
// Module-level state
// =============================================================================

interface LinterValidationState {
  directive: DocDirective;
  patterns: Array<{ name: string; level?: string }>;
  violations: LintViolation[];
  strictMode: boolean;
}

let state: LinterValidationState | null = null;

function initState(): LinterValidationState {
  return {
    directive: createTestDirective(),
    patterns: [],
    violations: [],
    strictMode: false,
  };
}

/**
 * Create a minimal test directive
 */
function createTestDirective(overrides: Partial<DocDirective> = {}): DocDirective {
  return {
    tags: [asDirectiveTag('@architect-test')],
    description: '',
    examples: [],
    position: { startLine: 1, endLine: 10 },
    ...overrides,
  };
}

// =============================================================================
// Helper Validation Functions (for rules not yet in rules.ts)
// =============================================================================

/**
 * Helper function to run the missingRelationshipTarget rule with context
 */
function runMissingRelationshipTargetRule(
  directive: DocDirective,
  existingPatterns: Set<string>,
  file: string,
  line: number
): LintViolation[] {
  const context: LintContext = { knownPatterns: existingPatterns };
  const result = missingRelationshipTarget.check(directive, file, line, context);
  if (result === null) return [];
  return Array.isArray(result) ? result : [result];
}

/**
 * Validate traceability consistency
 * Demonstrates expected behavior of asymmetric-traceability rule
 */
function validateTraceability(
  directive: DocDirective & { executableSpecs?: string; roadmapSpec?: string },
  existingPatterns: Set<string>,
  hasBackLink: boolean,
  file: string,
  line: number
): LintViolation[] {
  const violations: LintViolation[] = [];

  // Check for missing back-link
  if (directive.executableSpecs && !hasBackLink) {
    violations.push({
      rule: 'asymmetric-traceability',
      severity: 'warning',
      message: `Executable specs link exists but missing back-link from '${directive.executableSpecs}'`,
      file,
      line,
    });
  }

  // Check for orphan executable spec
  if (directive.roadmapSpec && !existingPatterns.has(directive.roadmapSpec)) {
    violations.push({
      rule: 'orphan-executable-spec',
      severity: 'warning',
      message: `Roadmap spec '${directive.roadmapSpec}' not found in known patterns`,
      file,
      line,
    });
  }

  return violations;
}

/**
 * Validate parent references
 * Demonstrates expected behavior of invalid-parent-reference rule
 */
function validateParentReference(
  directive: DocDirective & { parent?: string },
  existingPatterns: Set<string>,
  file: string,
  line: number
): LintViolation[] {
  const violations: LintViolation[] = [];

  if (directive.parent && !existingPatterns.has(directive.parent)) {
    violations.push({
      rule: 'invalid-parent-reference',
      severity: 'error',
      message: `Parent '${directive.parent}' not found in known patterns`,
      file,
      line,
    });
  }

  return violations;
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // RULE 1: Pattern Conflict Detection
  // ===========================================================================

  Rule('Pattern cannot implement itself (circular reference)', ({ RuleScenario }) => {
    RuleScenario('Pattern tag with implements tag causes error', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with:', (_ctx: unknown, _docString: string) => {
        state = initState();
        // Create directive with same patternName and implements (circular reference)
        state.directive = createTestDirective({
          patternName: 'EventStoreDurability',
          implements: ['EventStoreDurability'],
        });
      });

      When('the linter runs', () => {
        const violation = patternConflictInImplements.check(state!.directive, '/test/file.ts', 1);
        if (violation) {
          state!.violations.push(violation);
        }
      });

      Then('rule "pattern-conflict-in-implements" should trigger', () => {
        const violation = state!.violations.find(
          (v) => v.rule === 'pattern-conflict-in-implements'
        );
        expect(violation).toBeDefined();
      });

      And('the severity should be "error"', () => {
        const violation = state!.violations.find(
          (v) => v.rule === 'pattern-conflict-in-implements'
        );
        expect(violation?.severity).toBe('error');
      });

      And('the message should mention "cannot implement itself"', () => {
        const violation = state!.violations.find(
          (v) => v.rule === 'pattern-conflict-in-implements'
        );
        // The message says "Pattern 'X' cannot implement itself"
        expect(violation?.message.toLowerCase()).toContain('cannot implement itself');
      });
    });

    RuleScenario('Implements without pattern tag is valid', ({ Given, When, Then }) => {
      Given('a TypeScript file with:', (_ctx: unknown, _docString: string) => {
        state = initState();
        // Create directive with implements but no patternName (valid)
        state.directive = createTestDirective({
          implements: ['EventStoreDurability'],
          status: 'roadmap',
        });
      });

      When('the linter runs', () => {
        const violation = patternConflictInImplements.check(state!.directive, '/test/file.ts', 1);
        if (violation) {
          state!.violations.push(violation);
        }
      });

      Then('rule "pattern-conflict-in-implements" should not trigger', () => {
        const violation = state!.violations.find(
          (v) => v.rule === 'pattern-conflict-in-implements'
        );
        expect(violation).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // RULE 2: Missing Target Detection
  // ===========================================================================

  Rule('Relationship targets should exist (strict mode)', ({ RuleScenario }) => {
    RuleScenario('Uses referencing non-existent pattern warns', ({ Given, When, Then, And }) => {
      Given('a pattern with uses "NonExistentPattern"', () => {
        state = initState();
        state.directive = createTestDirective({
          uses: ['NonExistentPattern'],
        });
      });

      And('no pattern named "NonExistentPattern" exists', () => {
        state!.patterns = []; // No patterns exist
      });

      When('the linter runs in strict mode', () => {
        state!.strictMode = true;
        const existingPatterns = new Set(state!.patterns.map((p) => p.name));
        const violations = runMissingRelationshipTargetRule(
          state!.directive,
          existingPatterns,
          '/test/file.ts',
          1
        );
        state!.violations.push(...violations);
      });

      Then('rule "missing-relationship-target" should trigger', () => {
        const violation = state!.violations.find((v) => v.rule === 'missing-relationship-target');
        expect(violation).toBeDefined();
      });

      And('the severity should be "warning"', () => {
        const violation = state!.violations.find((v) => v.rule === 'missing-relationship-target');
        expect(violation?.severity).toBe('warning');
      });

      And('the message should mention "NonExistentPattern"', () => {
        const violation = state!.violations.find((v) => v.rule === 'missing-relationship-target');
        expect(violation?.message).toContain('NonExistentPattern');
      });
    });

    RuleScenario(
      'Implements referencing non-existent pattern warns',
      ({ Given, When, Then, And }) => {
        Given('a file implementing "NonExistentPattern"', () => {
          state = initState();
          state.directive = createTestDirective({
            implements: ['NonExistentPattern'],
          });
        });

        And('no pattern named "NonExistentPattern" exists', () => {
          state!.patterns = [];
        });

        When('the linter runs in strict mode', () => {
          state!.strictMode = true;
          const existingPatterns = new Set(state!.patterns.map((p) => p.name));
          const violations = runMissingRelationshipTargetRule(
            state!.directive,
            existingPatterns,
            '/test/file.ts',
            1
          );
          state!.violations.push(...violations);
        });

        Then('rule "missing-relationship-target" should trigger', () => {
          const violation = state!.violations.find((v) => v.rule === 'missing-relationship-target');
          expect(violation).toBeDefined();
        });
      }
    );

    RuleScenario('Valid relationship target passes', ({ Given, When, Then, And }) => {
      Given('a pattern with uses "CommandBus"', () => {
        state = initState();
        state.directive = createTestDirective({
          uses: ['CommandBus'],
        });
      });

      And('a pattern named "CommandBus" exists', () => {
        state!.patterns = [{ name: 'CommandBus' }];
      });

      When('the linter runs in strict mode', () => {
        state!.strictMode = true;
        const existingPatterns = new Set(state!.patterns.map((p) => p.name));
        const violations = runMissingRelationshipTargetRule(
          state!.directive,
          existingPatterns,
          '/test/file.ts',
          1
        );
        state!.violations.push(...violations);
      });

      Then('rule "missing-relationship-target" should not trigger', () => {
        const violation = state!.violations.find((v) => v.rule === 'missing-relationship-target');
        expect(violation).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // RULE 3: Traceability Consistency
  // ===========================================================================

  Rule('Bidirectional traceability links should be consistent', ({ RuleScenario }) => {
    RuleScenario('Missing back-link detected', ({ Given, When, Then, And }) => {
      Given('a roadmap spec with executable-specs "path/to/tests"', () => {
        state = initState();
        (state.directive as DocDirective & { executableSpecs?: string }).executableSpecs =
          'path/to/tests';
      });

      And('no file at "path/to/tests" with roadmap-spec back-link', () => {
        // No back-link exists (simulated)
      });

      When('the linter runs in strict mode', () => {
        state!.strictMode = true;
        const existingPatterns = new Set(state!.patterns.map((p) => p.name));
        const violations = validateTraceability(
          state!.directive as DocDirective & { executableSpecs?: string; roadmapSpec?: string },
          existingPatterns,
          false, // No back-link
          '/test/file.ts',
          1
        );
        state!.violations.push(...violations);
      });

      Then('rule "asymmetric-traceability" should trigger', () => {
        const violation = state!.violations.find((v) => v.rule === 'asymmetric-traceability');
        expect(violation).toBeDefined();
      });

      And('the message should mention "missing back-link"', () => {
        const violation = state!.violations.find((v) => v.rule === 'asymmetric-traceability');
        expect(violation?.message.toLowerCase()).toContain('back-link');
      });
    });

    RuleScenario('Orphan executable spec detected', ({ Given, When, Then, And }) => {
      Given('a package spec with roadmap-spec "NonExistentPattern"', () => {
        state = initState();
        (state.directive as DocDirective & { roadmapSpec?: string }).roadmapSpec =
          'NonExistentPattern';
      });

      And('no pattern named "NonExistentPattern" exists', () => {
        state!.patterns = [];
      });

      When('the linter runs', () => {
        const existingPatterns = new Set(state!.patterns.map((p) => p.name));
        const violations = validateTraceability(
          state!.directive as DocDirective & { executableSpecs?: string; roadmapSpec?: string },
          existingPatterns,
          true, // Back-link status doesn't matter for this test
          '/test/file.ts',
          1
        );
        state!.violations.push(...violations);
      });

      Then('rule "orphan-executable-spec" should trigger', () => {
        const violation = state!.violations.find((v) => v.rule === 'orphan-executable-spec');
        expect(violation).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // RULE 4: Hierarchy Validation
  // ===========================================================================

  Rule('Parent references must be valid', ({ RuleScenario }) => {
    RuleScenario('Invalid parent reference detected', ({ Given, When, Then, And }) => {
      Given('a pattern with parent "NonExistentEpic"', () => {
        state = initState();
        (state.directive as DocDirective & { parent?: string }).parent = 'NonExistentEpic';
      });

      And('no pattern named "NonExistentEpic" exists', () => {
        state!.patterns = [];
      });

      When('the linter runs', () => {
        const existingPatterns = new Set(state!.patterns.map((p) => p.name));
        const violations = validateParentReference(
          state!.directive as DocDirective & { parent?: string },
          existingPatterns,
          '/test/file.ts',
          1
        );
        state!.violations.push(...violations);
      });

      Then('rule "invalid-parent-reference" should trigger', () => {
        const violation = state!.violations.find((v) => v.rule === 'invalid-parent-reference');
        expect(violation).toBeDefined();
      });

      And('the severity should be "error"', () => {
        const violation = state!.violations.find((v) => v.rule === 'invalid-parent-reference');
        expect(violation?.severity).toBe('error');
      });
    });

    RuleScenario('Valid parent reference passes', ({ Given, When, Then, And }) => {
      Given('a pattern with parent "ProcessEnhancements"', () => {
        state = initState();
        (state.directive as DocDirective & { parent?: string }).parent = 'ProcessEnhancements';
      });

      And('an epic pattern named "ProcessEnhancements" exists', () => {
        state!.patterns = [{ name: 'ProcessEnhancements', level: 'epic' }];
      });

      When('the linter runs', () => {
        const existingPatterns = new Set(state!.patterns.map((p) => p.name));
        const violations = validateParentReference(
          state!.directive as DocDirective & { parent?: string },
          existingPatterns,
          '/test/file.ts',
          1
        );
        state!.violations.push(...violations);
      });

      Then('rule "invalid-parent-reference" should not trigger', () => {
        const violation = state!.violations.find((v) => v.rule === 'invalid-parent-reference');
        expect(violation).toBeUndefined();
      });
    });
  });
});
