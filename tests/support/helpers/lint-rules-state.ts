/**
 * Shared state and helpers for lint-rules test splits.
 */
import {
  missingPatternName,
  missingStatus,
  invalidStatus,
  missingWhenToUse,
  tautologicalDescription,
  missingRelationships,
  defaultRules,
  filterRulesBySeverity,
  type LintRule,
} from '../../../src/lint/rules.js';
import type { DocDirective } from '../../../src/validation-schemas/doc-directive.js';
import type { LintViolation, LintSeverity } from '../../../src/validation-schemas/lint.js';
import { asDirectiveTag } from '../../../src/types/branded.js';
import type { DataTableRow } from '../world.js';

// Re-export rule functions for step files
export {
  missingPatternName,
  missingStatus,
  invalidStatus,
  missingWhenToUse,
  tautologicalDescription,
  missingRelationships,
  defaultRules,
  filterRulesBySeverity,
};
export type { LintRule, DocDirective, LintViolation, LintSeverity, DataTableRow };

// =============================================================================
// State
// =============================================================================

export interface LintRulesScenarioState {
  directive: DocDirective;
  violation: LintViolation | null;
  filePath: string;
  lineNumber: number;
  rules: readonly LintRule[];
  filteredRules: LintRule[];
}

export function initState(): LintRulesScenarioState {
  return {
    directive: createTestDirective(),
    violation: null,
    filePath: '/test/file.ts',
    lineNumber: 1,
    rules: defaultRules,
    filteredRules: [],
  };
}

// =============================================================================
// Helpers
// =============================================================================

export function createTestDirective(overrides: Partial<DocDirective> = {}): DocDirective {
  return {
    tags: [asDirectiveTag('@architect-test')],
    description: '',
    examples: [],
    position: { startLine: 1, endLine: 10 },
    ...overrides,
  };
}

export function parseDirectiveTable(table: DataTableRow[]): Partial<DocDirective> {
  const overrides: Partial<DocDirective> = {};

  for (const row of table) {
    const { field, value } = row;

    switch (field) {
      case 'patternName':
        overrides.patternName = value;
        break;
      case 'description':
        overrides.description = value.replace(/\\n/g, '\n');
        break;
      case 'status':
        overrides.status = value as 'roadmap' | 'active' | 'completed' | 'deferred';
        break;
      case 'uses':
        overrides.uses = value.split(',').map((s) => s.trim());
        break;
      case 'usedBy':
        overrides.usedBy = value.split(',').map((s) => s.trim());
        break;
      case 'whenToUse':
        overrides.whenToUse = value.split(',').map((s) => s.trim());
        break;
    }
  }

  return overrides;
}
