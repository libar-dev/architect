/**
 * Step definitions for Validation Rules Codec behavior tests
 *
 * Tests the Validation Rules Codec that transforms MasterDataset into a
 * RenderableDocument for Process Guard validation rules reference (VALIDATION-RULES.md).
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createValidationRulesCodec,
  type ValidationRulesCodecOptions,
} from '../../../src/renderable/codecs/validation-rules.js';
import type { RenderableDocument, SectionBlock } from '../../../src/renderable/schema.js';
import { createTestMasterDataset } from '../../fixtures/dataset-factories.js';
import type { MasterDataset } from '../../../src/validation-schemas/master-dataset.js';

const feature = await loadFeature('tests/features/doc-generation/validation-rules-codec.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  // Input
  options: Partial<ValidationRulesCodecOptions>;
  dataset: MasterDataset | null;

  // Output
  document: RenderableDocument | null;
}

let state: TestState;

function resetState(): void {
  state = {
    options: {},
    dataset: null,
    document: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find a section block by heading text
 */
function findSectionByHeading(
  sections: SectionBlock[],
  headingText: string
): SectionBlock | undefined {
  for (const block of sections) {
    if (block.type === 'heading' && block.text.includes(headingText)) {
      return block;
    }
  }
  return undefined;
}

/**
 * Get all blocks between a heading and the next heading of same or higher level
 */
function getSectionContent(sections: SectionBlock[], headingText: string): SectionBlock[] {
  const result: SectionBlock[] = [];
  let inSection = false;
  let sectionLevel = 0;

  for (const block of sections) {
    if (block.type === 'heading') {
      if (block.text.includes(headingText)) {
        inSection = true;
        sectionLevel = block.level;
        result.push(block);
        continue;
      }
      if (inSection && block.level <= sectionLevel) {
        break;
      }
    }
    if (inSection) {
      result.push(block);
    }
  }
  return result;
}

/**
 * Find a table block within sections
 */
function findTable(sections: SectionBlock[]): SectionBlock | undefined {
  return sections.find((b) => b.type === 'table');
}

/**
 * Find a mermaid block in sections
 */
function findMermaid(sections: SectionBlock[]): SectionBlock | undefined {
  return sections.find((b) => b.type === 'mermaid');
}

/**
 * Find a code block in sections
 */
function findCodeBlock(sections: SectionBlock[]): SectionBlock | undefined {
  return sections.find((b) => b.type === 'code');
}

/**
 * Check if table contains a rule
 */
function tableContainsRule(tableBlock: SectionBlock | undefined, ruleId: string): boolean {
  if (tableBlock?.type !== 'table') {
    return false;
  }
  return tableBlock.rows.some((row) => row.some((cell) => cell.includes(ruleId)));
}

/**
 * Get rule severity from the table
 */
function getRuleSeverity(sections: SectionBlock[], ruleId: string): string | null {
  const rulesContent = getSectionContent(sections, 'Validation Rules');
  const tableBlock = findTable(rulesContent);
  if (tableBlock?.type !== 'table') {
    return null;
  }

  for (const row of tableBlock.rows) {
    if (row.some((cell) => cell.includes(ruleId))) {
      // Find the severity cell (usually the second column)
      const severityCell = row.find((cell) => cell === 'error' || cell === 'warning');
      return severityCell ?? null;
    }
  }
  return null;
}

/**
 * Check if mermaid diagram contains a state
 */
function mermaidContainsState(mermaidBlock: SectionBlock | undefined, stateName: string): boolean {
  if (mermaidBlock?.type !== 'mermaid') {
    return false;
  }
  return mermaidBlock.content.includes(stateName);
}

/**
 * Check if protection table shows status with protection level
 */
function protectionTableShowsStatus(
  sections: SectionBlock[],
  status: string,
  protection: string
): boolean {
  const protectionContent = getSectionContent(sections, 'Protection Levels');
  const tableBlock = findTable(protectionContent);
  if (tableBlock?.type !== 'table') {
    return false;
  }

  return tableBlock.rows.some((row) => {
    const hasStatus = row.some((cell) => cell.includes(status));
    const hasProtection = row.some((cell) => cell.toLowerCase().includes(protection));
    return hasStatus && hasProtection;
  });
}

/**
 * Check if CLI section documents an option
 */
function cliDocumentsOption(sections: SectionBlock[], option: string): boolean {
  const cliContent = getSectionContent(sections, 'CLI');
  const contentStr = JSON.stringify(cliContent);
  return contentStr.includes(option);
}

/**
 * Check if CLI section documents an exit code
 */
function cliDocumentsExitCode(sections: SectionBlock[], exitCode: number): boolean {
  const cliContent = getSectionContent(sections, 'CLI');
  const contentStr = JSON.stringify(cliContent);
  // Look for exit code in various formats
  return contentStr.includes(`${exitCode}`) || contentStr.includes(`code ${exitCode}`);
}

/**
 * Check if escape hatches documents a specific escape hatch
 */
function escapeHatchesDocuments(sections: SectionBlock[], hatch: string): boolean {
  const escapeContent = getSectionContent(sections, 'Escape Hatches');
  const contentStr = JSON.stringify(escapeContent);
  return contentStr.includes(hatch);
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the validation rules codec is initialized', () => {
      resetState();
    });
  });

  // ===========================================================================
  // RULE 1: Document Metadata
  // ===========================================================================

  Rule('Document metadata is correctly set', ({ RuleScenario }) => {
    RuleScenario('Document title is Validation Rules', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('document title should be {string}', (_ctx: unknown, expectedTitle: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.title).toBe(expectedTitle);
      });
    });

    RuleScenario('Document purpose describes Process Guard', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('document purpose should contain {string}', (_ctx: unknown, expectedText: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.purpose?.toLowerCase()).toContain(expectedText.toLowerCase());
      });
    });

    RuleScenario('Detail level reflects generateDetailFiles option', ({ When, Then }) => {
      When('decoding with generateDetailFiles disabled', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec({ generateDetailFiles: false });
        state.document = codec.decode(state.dataset);
      });

      Then('document detailLevel should be {string}', (_ctx: unknown, expectedLevel: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.detailLevel).toBe(expectedLevel);
      });
    });
  });

  // ===========================================================================
  // RULE 2: Validation Rules Table
  // ===========================================================================

  Rule('All validation rules are documented in a table', ({ RuleScenario }) => {
    RuleScenario('All 6 rules appear in table', ({ When, Then, And }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the Validation Rules section should have a table', () => {
        const rulesContent = getSectionContent(state.document!.sections, 'Validation Rules');
        const tableBlock = findTable(rulesContent);
        expect(tableBlock).toBeDefined();
      });

      And('the table should contain all 6 validation rules', () => {
        const rulesContent = getSectionContent(state.document!.sections, 'Validation Rules');
        const tableBlock = findTable(rulesContent);
        const rules = [
          'completed-protection',
          'invalid-status-transition',
          'scope-creep',
          'session-scope',
          'session-excluded',
          'deliverable-removed',
        ];
        for (const rule of rules) {
          expect(tableContainsRule(tableBlock, rule)).toBe(true);
        }
      });
    });

    RuleScenario('Rules have correct severity levels', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('error rules and warning rules should have correct severity', () => {
        expect(state.document).not.toBeNull();
        // Error rules
        expect(getRuleSeverity(state.document!.sections, 'completed-protection')).toBe('error');
        expect(getRuleSeverity(state.document!.sections, 'invalid-status-transition')).toBe(
          'error'
        );
        expect(getRuleSeverity(state.document!.sections, 'scope-creep')).toBe('error');
        expect(getRuleSeverity(state.document!.sections, 'session-excluded')).toBe('error');
        // Warning rules
        expect(getRuleSeverity(state.document!.sections, 'session-scope')).toBe('warning');
        expect(getRuleSeverity(state.document!.sections, 'deliverable-removed')).toBe('warning');
      });
    });
  });

  // ===========================================================================
  // RULE 3: FSM State Diagram
  // ===========================================================================

  Rule('FSM state diagram is generated from transitions', ({ RuleScenario }) => {
    RuleScenario('Mermaid diagram generated when includeFSMDiagram enabled', ({ When, Then }) => {
      When('decoding with includeFSMDiagram enabled', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec({ includeFSMDiagram: true });
        state.document = codec.decode(state.dataset);
      });

      Then('a mermaid block should exist', () => {
        expect(state.document).not.toBeNull();
        const mermaidBlock = findMermaid(state.document!.sections);
        expect(mermaidBlock).toBeDefined();
      });
    });

    RuleScenario('Diagram includes all 4 states', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the mermaid diagram should contain all 4 FSM states', () => {
        expect(state.document).not.toBeNull();
        const mermaidBlock = findMermaid(state.document!.sections);
        const states = ['roadmap', 'active', 'completed', 'deferred'];
        for (const stateName of states) {
          expect(mermaidContainsState(mermaidBlock, stateName)).toBe(true);
        }
      });
    });

    RuleScenario('FSM diagram excluded when includeFSMDiagram disabled', ({ When, Then }) => {
      When('decoding with includeFSMDiagram disabled', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec({ includeFSMDiagram: false });
        state.document = codec.decode(state.dataset);
      });

      Then('a mermaid block should not exist', () => {
        expect(state.document).not.toBeNull();
        const mermaidBlock = findMermaid(state.document!.sections);
        expect(mermaidBlock).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // RULE 4: Protection Level Matrix
  // ===========================================================================

  Rule('Protection level matrix shows status protections', ({ RuleScenario }) => {
    RuleScenario('Matrix shows all 4 statuses with protection levels', ({ When, Then, And }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the Protection Levels section should have a table', () => {
        const protectionContent = getSectionContent(state.document!.sections, 'Protection Levels');
        const tableBlock = findTable(protectionContent);
        expect(tableBlock).toBeDefined();
      });

      And('all protection levels should be correctly documented', () => {
        expect(protectionTableShowsStatus(state.document!.sections, 'roadmap', 'none')).toBe(true);
        expect(protectionTableShowsStatus(state.document!.sections, 'active', 'scope')).toBe(true);
        expect(protectionTableShowsStatus(state.document!.sections, 'completed', 'hard')).toBe(
          true
        );
        expect(protectionTableShowsStatus(state.document!.sections, 'deferred', 'none')).toBe(true);
      });
    });

    RuleScenario(
      'Protection matrix excluded when includeProtectionMatrix disabled',
      ({ When, Then }) => {
        When('decoding with includeProtectionMatrix disabled', () => {
          state.dataset = createTestMasterDataset();
          const codec = createValidationRulesCodec({ includeProtectionMatrix: false });
          state.document = codec.decode(state.dataset);
        });

        Then(
          'a section with heading {string} should not exist',
          (_ctx: unknown, headingText: string) => {
            expect(state.document).not.toBeNull();
            const section = findSectionByHeading(state.document!.sections, headingText);
            expect(section).toBeUndefined();
          }
        );
      }
    );
  });

  // ===========================================================================
  // RULE 5: CLI Usage Section
  // ===========================================================================

  Rule('CLI usage is documented with options and exit codes', ({ RuleScenario }) => {
    RuleScenario('CLI example code block included', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the CLI Usage section should have a code block', () => {
        const cliContent = getSectionContent(state.document!.sections, 'CLI');
        const codeBlock = findCodeBlock(cliContent);
        expect(codeBlock).toBeDefined();
      });
    });

    RuleScenario('All 6 CLI options documented', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('all CLI options should be documented', () => {
        expect(state.document).not.toBeNull();
        const options = [
          '--staged',
          '--all',
          '--strict',
          '--ignore-session',
          '--show-state',
          '--format',
        ];
        for (const option of options) {
          expect(cliDocumentsOption(state.document!.sections, option)).toBe(true);
        }
      });
    });

    RuleScenario('Exit codes documented', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('both exit codes should be documented', () => {
        expect(state.document).not.toBeNull();
        expect(cliDocumentsExitCode(state.document!.sections, 0)).toBe(true);
        expect(cliDocumentsExitCode(state.document!.sections, 1)).toBe(true);
      });
    });

    RuleScenario('CLI section excluded when includeCLIUsage disabled', ({ When, Then }) => {
      When('decoding with includeCLIUsage disabled', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec({ includeCLIUsage: false });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });
  });

  // ===========================================================================
  // RULE 6: Escape Hatches
  // ===========================================================================

  Rule('Escape hatches are documented for special cases', ({ RuleScenario }) => {
    RuleScenario('All 3 escape hatches documented', ({ When, Then, And }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createValidationRulesCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the Escape Hatches section should have a table', () => {
        const escapeContent = getSectionContent(state.document!.sections, 'Escape Hatches');
        const tableBlock = findTable(escapeContent);
        expect(tableBlock).toBeDefined();
      });

      And('all escape hatches should be documented', () => {
        const hatches = ['unlock-reason', 'ignore-session', 'strict'];
        for (const hatch of hatches) {
          expect(escapeHatchesDocuments(state.document!.sections, hatch)).toBe(true);
        }
      });
    });

    RuleScenario(
      'Escape hatches section excluded when includeEscapeHatches disabled',
      ({ When, Then }) => {
        When('decoding with includeEscapeHatches disabled', () => {
          state.dataset = createTestMasterDataset();
          const codec = createValidationRulesCodec({ includeEscapeHatches: false });
          state.document = codec.decode(state.dataset);
        });

        Then(
          'a section with heading {string} should not exist',
          (_ctx: unknown, headingText: string) => {
            expect(state.document).not.toBeNull();
            const section = findSectionByHeading(state.document!.sections, headingText);
            expect(section).toBeUndefined();
          }
        );
      }
    );
  });
});
