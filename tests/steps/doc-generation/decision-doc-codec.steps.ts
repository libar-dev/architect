/**
 * Step definitions for Decision Doc Codec behavior tests
 *
 * Tests the Decision Doc Codec that parses decision documents (ADR/PDR
 * in .feature format) and extracts content for documentation generation.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  partitionDecisionRules,
  extractDocStrings,
  parseSourceMappingTable,
  isSelfReference,
  parseSelfReference,
  normalizeExtractionMethod,
  findRuleByName,
  parseDecisionDocument,
  type PartitionedDecisionRules,
  type ExtractedDocString,
  type SourceMappingEntry,
  type DecisionDocContent,
  type EXTRACTION_METHODS,
} from '../../../src/renderable/codecs/decision-doc.js';
import type { BusinessRule } from '../../../src/validation-schemas/extracted-pattern.js';

const feature = await loadFeature('tests/features/doc-generation/decision-doc-codec.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  // Input data
  businessRules: BusinessRule[];
  textContent: string;
  sourceFile: string;
  extractionMethod: string;

  // Output data
  partitionedRules: PartitionedDecisionRules | null;
  extractedDocStrings: ExtractedDocString[];
  sourceMappings: SourceMappingEntry[];
  isSelfRef: boolean | null;
  selfRefParsed: { type: 'document' | 'rule' | 'docstring'; name?: string } | null;
  normalizedMethod: keyof typeof EXTRACTION_METHODS | 'unknown' | null;
  foundRule: BusinessRule | undefined;
  parsedDecision: DecisionDocContent | null;
}

let state: TestState;

function resetState(): void {
  state = {
    businessRules: [],
    textContent: '',
    sourceFile: '',
    extractionMethod: '',
    partitionedRules: null,
    extractedDocStrings: [],
    sourceMappings: [],
    isSelfRef: null,
    selfRefParsed: null,
    normalizedMethod: null,
    foundRule: undefined,
    parsedDecision: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the decision doc codec is initialized', () => {
      resetState();
    });
  });

  // ===========================================================================
  // RULE 1: Rule Block Partitioning
  // ===========================================================================

  Rule('Rule blocks are partitioned by semantic prefix', ({ RuleScenario }) => {
    RuleScenario('Partition rules into ADR sections', ({ Given, When, Then, And }) => {
      Given(
        'business rules:',
        (_ctx: unknown, table: Array<{ Name: string; Description: string }>) => {
          state.businessRules = table.map((row) => ({
            name: row.Name,
            description: row.Description,
            scenarioCount: 0,
            scenarioNames: [],
          }));
        }
      );

      When('partitioning rules for decision doc', () => {
        state.partitionedRules = partitionDecisionRules(state.businessRules);
      });

      Then('context should have {int} rule', (_ctx: unknown, count: number) => {
        expect(state.partitionedRules!.context.length).toBe(count);
      });

      And('decision should have {int} rule', (_ctx: unknown, count: number) => {
        expect(state.partitionedRules!.decision.length).toBe(count);
      });

      And('consequences should have {int} rule', (_ctx: unknown, count: number) => {
        expect(state.partitionedRules!.consequences.length).toBe(count);
      });

      And('other should have {int} rules', (_ctx: unknown, count: number) => {
        expect(state.partitionedRules!.other.length).toBe(count);
      });
    });

    RuleScenario('Non-standard rules go to other category', ({ Given, When, Then, And }) => {
      Given(
        'business rules:',
        (_ctx: unknown, table: Array<{ Name: string; Description: string }>) => {
          state.businessRules = table.map((row) => ({
            name: row.Name,
            description: row.Description,
            scenarioCount: 0,
            scenarioNames: [],
          }));
        }
      );

      When('partitioning rules for decision doc', () => {
        state.partitionedRules = partitionDecisionRules(state.businessRules);
      });

      Then('other should have {int} rules', (_ctx: unknown, count: number) => {
        expect(state.partitionedRules!.other.length).toBe(count);
      });

      And('context should have {int} rules', (_ctx: unknown, count: number) => {
        expect(state.partitionedRules!.context.length).toBe(count);
      });
    });
  });

  // ===========================================================================
  // RULE 2: DocString Extraction
  // ===========================================================================

  Rule('DocStrings are extracted with language tags', ({ RuleScenario }) => {
    RuleScenario('Extract single DocString', ({ Given, When, Then, And }) => {
      Given('text with single DocString', () => {
        state.textContent = `Some explanation...

"""bash
npm install @libar-dev/architect
"""

More text here.`;
      });

      When('extracting DocStrings', () => {
        state.extractedDocStrings = extractDocStrings(state.textContent);
      });

      Then('{int} DocString should be extracted', (_ctx: unknown, count: number) => {
        expect(state.extractedDocStrings.length).toBe(count);
      });

      And('first DocString should have language {string}', (_ctx: unknown, lang: string) => {
        expect(state.extractedDocStrings[0].language).toBe(lang);
      });
    });

    RuleScenario('Extract multiple DocStrings', ({ Given, When, Then }) => {
      Given('text with multiple DocStrings', () => {
        state.textContent = `First example:

"""typescript
const x = 1;
"""

Second example:

"""json
{ "key": "value" }
"""`;
      });

      When('extracting DocStrings', () => {
        state.extractedDocStrings = extractDocStrings(state.textContent);
      });

      Then('{int} DocStrings should be extracted', (_ctx: unknown, count: number) => {
        expect(state.extractedDocStrings.length).toBe(count);
      });
    });

    RuleScenario('DocString without language defaults to text', ({ Given, When, Then }) => {
      Given('text with untagged DocString', () => {
        state.textContent = `Example:

"""
plain text content
"""`;
      });

      When('extracting DocStrings', () => {
        state.extractedDocStrings = extractDocStrings(state.textContent);
      });

      Then('first DocString should have language {string}', (_ctx: unknown, lang: string) => {
        expect(state.extractedDocStrings[0].language).toBe(lang);
      });
    });
  });

  // ===========================================================================
  // RULE 3: Source Mapping Table Parsing
  // ===========================================================================

  Rule('Source mapping tables are parsed from rule descriptions', ({ RuleScenario }) => {
    RuleScenario('Parse basic source mapping table', ({ Given, When, Then, And }) => {
      Given('text with source mapping table', () => {
        state.textContent = `**Source Mapping:**

| Section | Source File | Extraction Method |
| Intro | THIS DECISION | Decision rule description |
| API Types | src/types.ts | @extract-shapes tag |`;
      });

      When('parsing source mapping table', () => {
        state.sourceMappings = parseSourceMappingTable(state.textContent);
      });

      Then('{int} source mappings should be found', (_ctx: unknown, count: number) => {
        expect(state.sourceMappings.length).toBe(count);
      });

      And('first mapping section should be {string}', (_ctx: unknown, section: string) => {
        expect(state.sourceMappings[0].section).toBe(section);
      });
    });

    RuleScenario('No source mapping returns empty', ({ Given, When, Then }) => {
      Given('text without tables', () => {
        state.textContent = `This is just regular text without any tables.
It has multiple paragraphs but no source mapping.`;
      });

      When('parsing source mapping table', () => {
        state.sourceMappings = parseSourceMappingTable(state.textContent);
      });

      Then('{int} source mappings should be found', (_ctx: unknown, count: number) => {
        expect(state.sourceMappings.length).toBe(count);
      });
    });
  });

  // ===========================================================================
  // RULE 4: Self-Reference Detection
  // ===========================================================================

  Rule('Self-reference markers are correctly detected', ({ RuleScenario }) => {
    RuleScenario('Detect THIS DECISION marker', ({ Given, When, Then }) => {
      Given('sourceFile {string}', (_ctx: unknown, sourceFile: string) => {
        state.sourceFile = sourceFile;
      });

      When('checking if self-reference', () => {
        state.isSelfRef = isSelfReference(state.sourceFile);
      });

      Then('it should be a self-reference', () => {
        expect(state.isSelfRef).toBe(true);
      });
    });

    RuleScenario('Detect THIS DECISION with Rule', ({ Given, When, Then }) => {
      Given('sourceFile {string}', (_ctx: unknown, sourceFile: string) => {
        state.sourceFile = sourceFile;
      });

      When('checking if self-reference', () => {
        state.isSelfRef = isSelfReference(state.sourceFile);
      });

      Then('it should be a self-reference', () => {
        expect(state.isSelfRef).toBe(true);
      });
    });

    RuleScenario('Regular file path is not self-reference', ({ Given, When, Then }) => {
      Given('sourceFile {string}', (_ctx: unknown, sourceFile: string) => {
        state.sourceFile = sourceFile;
      });

      When('checking if self-reference', () => {
        state.isSelfRef = isSelfReference(state.sourceFile);
      });

      Then('it should not be a self-reference', () => {
        expect(state.isSelfRef).toBe(false);
      });
    });

    RuleScenario('Parse self-reference types', ({ Given, When, Then }) => {
      Given('sourceFile {string}', (_ctx: unknown, sourceFile: string) => {
        state.sourceFile = sourceFile;
      });

      When('parsing self-reference', () => {
        state.selfRefParsed = parseSelfReference(state.sourceFile);
      });

      Then('self-reference type should be {string}', (_ctx: unknown, refType: string) => {
        expect(state.selfRefParsed!.type).toBe(refType);
      });
    });

    RuleScenario('Parse self-reference with rule name', ({ Given, When, Then }) => {
      Given('sourceFile {string}', (_ctx: unknown, sourceFile: string) => {
        state.sourceFile = sourceFile;
      });

      When('parsing self-reference', () => {
        state.selfRefParsed = parseSelfReference(state.sourceFile);
      });

      Then('self-reference type should be {string}', (_ctx: unknown, refType: string) => {
        expect(state.selfRefParsed!.type).toBe(refType);
      });
    });
  });

  // ===========================================================================
  // RULE 5: Extraction Method Normalization
  // ===========================================================================

  Rule('Extraction methods are normalized to known types', ({ RuleScenario }) => {
    RuleScenario('Normalize Decision rule description', ({ Given, When, Then }) => {
      Given('extraction method {string}', (_ctx: unknown, method: string) => {
        state.extractionMethod = method;
      });

      When('normalizing extraction method', () => {
        state.normalizedMethod = normalizeExtractionMethod(state.extractionMethod);
      });

      Then('normalized method should be {string}', (_ctx: unknown, expected: string) => {
        expect(state.normalizedMethod).toBe(expected);
      });
    });

    RuleScenario('Normalize extract-shapes', ({ Given, When, Then }) => {
      Given('extraction method {string}', (_ctx: unknown, method: string) => {
        state.extractionMethod = method;
      });

      When('normalizing extraction method', () => {
        state.normalizedMethod = normalizeExtractionMethod(state.extractionMethod);
      });

      Then('normalized method should be {string}', (_ctx: unknown, expected: string) => {
        expect(state.normalizedMethod).toBe(expected);
      });
    });

    RuleScenario('Normalize unknown method', ({ Given, When, Then }) => {
      Given('extraction method {string}', (_ctx: unknown, method: string) => {
        state.extractionMethod = method;
      });

      When('normalizing extraction method', () => {
        state.normalizedMethod = normalizeExtractionMethod(state.extractionMethod);
      });

      Then('normalized method should be {string}', (_ctx: unknown, expected: string) => {
        expect(state.normalizedMethod).toBe(expected);
      });
    });
  });

  // ===========================================================================
  // RULE 6: Full Decision Document Parsing
  // ===========================================================================

  Rule('Complete decision documents are parsed with all content', ({ RuleScenario }) => {
    RuleScenario('Parse complete decision document', ({ Given, When, Then, And }) => {
      Given('a complete decision document', () => {
        state.businessRules = [
          {
            name: 'Context - Why',
            description: 'Background\n"""bash\nnpm install\n"""',
            scenarioCount: 0,
            scenarioNames: [],
          },
          {
            name: 'Decision - How',
            description: 'Implementation',
            scenarioCount: 0,
            scenarioNames: [],
          },
          {
            name: 'Consequences - Results',
            description: 'Benefits and costs',
            scenarioCount: 0,
            scenarioNames: [],
          },
        ];
      });

      When('parsing the decision document', () => {
        state.parsedDecision = parseDecisionDocument('TestDecision', '', state.businessRules);
      });

      Then('parsed content should have {int} context rule', (_ctx: unknown, count: number) => {
        expect(state.parsedDecision!.rules.context.length).toBe(count);
      });

      And('parsed content should have {int} decision rule', (_ctx: unknown, count: number) => {
        expect(state.parsedDecision!.rules.decision.length).toBe(count);
      });

      And('parsed content should have DocStrings', () => {
        expect(state.parsedDecision!.docStrings.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // RULE 7: Rule Finding
  // ===========================================================================

  Rule('Rules can be found by name with partial matching', ({ RuleScenario }) => {
    RuleScenario('Find rule by exact name', ({ Given, When, Then }) => {
      Given(
        'business rules:',
        (_ctx: unknown, table: Array<{ Name: string; Description: string }>) => {
          state.businessRules = table.map((row) => ({
            name: row.Name,
            description: row.Description,
            scenarioCount: 0,
            scenarioNames: [],
          }));
        }
      );

      When('finding rule {string}', (_ctx: unknown, ruleName: string) => {
        state.foundRule = findRuleByName(state.businessRules, ruleName);
      });

      Then('the found rule should have name {string}', (_ctx: unknown, expectedName: string) => {
        expect(state.foundRule).toBeDefined();
        expect(state.foundRule!.name).toBe(expectedName);
      });
    });

    RuleScenario('Find rule by partial name', ({ Given, When, Then }) => {
      Given(
        'business rules:',
        (_ctx: unknown, table: Array<{ Name: string; Description: string }>) => {
          state.businessRules = table.map((row) => ({
            name: row.Name,
            description: row.Description,
            scenarioCount: 0,
            scenarioNames: [],
          }));
        }
      );

      When('finding rule {string}', (_ctx: unknown, ruleName: string) => {
        state.foundRule = findRuleByName(state.businessRules, ruleName);
      });

      Then('the found rule should have name {string}', (_ctx: unknown, expectedName: string) => {
        expect(state.foundRule).toBeDefined();
        expect(state.foundRule!.name).toBe(expectedName);
      });
    });

    RuleScenario('Rule not found returns undefined', ({ Given, When, Then }) => {
      Given(
        'business rules:',
        (_ctx: unknown, table: Array<{ Name: string; Description: string }>) => {
          state.businessRules = table.map((row) => ({
            name: row.Name,
            description: row.Description,
            scenarioCount: 0,
            scenarioNames: [],
          }));
        }
      );

      When('finding rule {string}', (_ctx: unknown, ruleName: string) => {
        state.foundRule = findRuleByName(state.businessRules, ruleName);
      });

      Then('no rule should be found', () => {
        expect(state.foundRule).toBeUndefined();
      });
    });
  });
});
