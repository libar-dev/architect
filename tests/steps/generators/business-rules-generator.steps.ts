/**
 * Business Rules Codec Step Definitions
 *
 * BDD step definitions for testing the BusinessRulesCodec.
 * Tests rule extraction, organization, code preservation, and traceability.
 *
 * Uses Rule() + RuleScenario() pattern as feature file uses Rule: blocks.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { createBusinessRulesCodec } from '../../../src/renderable/codecs/business-rules.js';
import { renderToMarkdown } from '../../../src/renderable/render.js';
import type { RenderableDocument, TableBlock } from '../../../src/renderable/schema.js';
import type { RuntimeMasterDataset } from '../../../src/generators/pipeline/transform-types.js';
import { transformToMasterDataset } from '../../../src/generators/pipeline/transform-dataset.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import type { BusinessRule } from '../../../src/validation-schemas/extracted-pattern.js';
import { createTestPattern, resetPatternCounter } from '../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findTables,
  findCollapsibles,
} from '../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../support/world.js';
import type { SectionBlock } from '../../../src/renderable/schema.js';

// =============================================================================
// State Types
// =============================================================================

interface BusinessRulesState {
  dataset: RuntimeMasterDataset | null;
  document: RenderableDocument | null;
  markdown: string;
  patterns: ExtractedPattern[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: BusinessRulesState | null = null;

function initState(): BusinessRulesState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    markdown: '',
    patterns: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a pattern with rules attached
 */
function createPatternWithRules(
  options: {
    name?: string;
    category?: string;
    phase?: number;
    filePath?: string;
    productArea?: string;
  },
  rules: BusinessRule[]
): ExtractedPattern {
  const pattern = createTestPattern({
    name: options.name ?? 'TestPattern',
    category: options.category ?? 'core',
    phase: options.phase,
    filePath: options.filePath ?? 'test.feature',
    productArea: options.productArea,
  });

  // Add rules to the pattern (rules is an optional field on ExtractedPattern)
  return {
    ...pattern,
    rules,
    scenarios: rules.flatMap((r) =>
      r.scenarioNames.map((name, idx) => ({
        scenarioName: name,
        featureName: pattern.name,
        featureDescription: '',
        featureFile: options.filePath ?? 'test.feature',
        line: 50 + idx * 10,
        semanticTags: [],
        tags: [],
      }))
    ),
  };
}

/**
 * Build the dataset from patterns and run the generator
 */
function buildDataset(): void {
  state!.dataset = transformToMasterDataset({
    patterns: state!.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });
}

interface CodecOptions {
  detailLevel?: 'summary' | 'standard' | 'detailed';
  includeCodeExamples?: boolean;
  includeVerifiedBy?: boolean;
  generateDetailFiles?: boolean;
}

function runGenerator(options: CodecOptions = {}): void {
  buildDataset();
  // Default to non-split mode for existing tests unless explicitly enabled
  const codecOptions = {
    generateDetailFiles: false,
    ...options,
  };
  const codec = createBusinessRulesCodec(codecOptions);
  state!.document = codec.decode(state!.dataset!);
  state!.markdown = renderToMarkdown(state!.document);
}

function findRuleHeading(ruleName: string): boolean {
  const headings = findHeadings(state!.document!);
  return headings.some((h) => h.text === ruleName);
}

function markdownContains(text: string): boolean {
  return state!.markdown.includes(text);
}

function _findSummaryTable(): TableBlock | undefined {
  const tables = findTables(state!.document!);
  return tables.find((t) => t.columns.includes('Metric') && t.columns.includes('Value'));
}

function _findAllRulesTable(): TableBlock | undefined {
  const tables = findTables(state!.document!);
  return tables.find((t) => t.columns.includes('Rule') && t.columns.includes('Source'));
}

function _hasDomainSection(domainName: string): boolean {
  const headings = findHeadings(state!.document!);
  return headings.some((h) => h.level === 2 && h.text.includes(domainName));
}

// =============================================================================
// Feature: Business Rules Document Codec
// =============================================================================

const feature = await loadFeature('tests/features/generators/business-rules-codec.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a business rules codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Extracts Rule blocks with Invariant and Rationale
  // ===========================================================================

  Rule('Extracts Rule blocks with Invariant and Rationale', ({ RuleScenario }) => {
    RuleScenario(
      'Extracts annotated Rule with Invariant and Rationale',
      ({ Given, When, Then, And }) => {
        Given('a pattern with a rule containing:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          // Build rule description with annotations
          const description = `
**Invariant:** ${fields.invariant ?? ''}

**Rationale:** ${fields.rationale ?? ''}

**Verified by:** ${fields.verifiedBy ?? ''}
`.trim();

          const rule: BusinessRule = {
            name: fields.name ?? 'Test Rule',
            description,
            scenarioNames: fields.verifiedBy ? [fields.verifiedBy] : [],
            scenarioCount: fields.verifiedBy ? 1 : 0,
          };

          state!.patterns.push(
            createPatternWithRules(
              { name: 'TestPattern', category: 'ddd', phase: 20, filePath: 'test.feature' },
              [rule]
            )
          );
        });

        When('decoding with BusinessRulesCodec in detailed mode', () => {
          runGenerator({ detailLevel: 'detailed', includeVerifiedBy: true });
        });

        Then('the document contains rule {string}', (_ctx: unknown, expectedRule: string) => {
          expect(findRuleHeading(expectedRule)).toBe(true);
        });

        And(
          'the document contains invariant text {string}',
          (_ctx: unknown, expectedText: string) => {
            expect(markdownContains('**Invariant:**')).toBe(true);
            expect(markdownContains(expectedText)).toBe(true);
          }
        );

        And(
          'the document contains rationale text {string}',
          (_ctx: unknown, expectedText: string) => {
            expect(markdownContains('**Rationale:**')).toBe(true);
            expect(markdownContains(expectedText)).toBe(true);
          }
        );

        And(
          'the document contains verified by link to {string}',
          (_ctx: unknown, scenarioName: string) => {
            expect(markdownContains('Verified by:')).toBe(true);
            expect(markdownContains(scenarioName)).toBe(true);
          }
        );
      }
    );

    RuleScenario(
      'Extracts unannotated Rule without showing not specified',
      ({ Given, When, Then, And }) => {
        Given('a pattern with a rule containing:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          const rule: BusinessRule = {
            name: fields.name ?? 'Test Rule',
            description: fields.description ?? '',
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules({ name: 'TestPattern', category: 'event-sourcing', phase: 2 }, [
              rule,
            ])
          );
        });

        When('decoding with BusinessRulesCodec in detailed mode', () => {
          runGenerator({ detailLevel: 'detailed' });
        });

        Then('the document contains rule {string}', (_ctx: unknown, expectedRule: string) => {
          expect(findRuleHeading(expectedRule)).toBe(true);
        });

        And('the document contains description {string}', (_ctx: unknown, expectedDesc: string) => {
          expect(markdownContains(expectedDesc)).toBe(true);
        });

        And('the document does not contain {string}', (_ctx: unknown, unexpectedText: string) => {
          expect(markdownContains(unexpectedText)).toBe(false);
        });
      }
    );
  });

  // ===========================================================================
  // Rule 2: Organizes rules by product area and phase
  // ===========================================================================

  Rule('Organizes rules by product area and phase', ({ RuleScenario }) => {
    RuleScenario('Groups rules by product area and phase', ({ Given, When, Then }) => {
      Given(
        'patterns with rules in these categories:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          let phaseNum = 15;
          for (const row of dataTable) {
            const category = row.Category ?? 'uncategorized';
            const ruleName = row['Rule Name'] ?? 'Test Rule';

            const rule: BusinessRule = {
              name: ruleName,
              description: `Description for ${ruleName}`,
              scenarioNames: [],
              scenarioCount: 0,
            };

            state!.patterns.push(
              createPatternWithRules({ name: `${category}Pattern`, category, phase: phaseNum++ }, [
                rule,
              ])
            );
          }
        }
      );

      When('decoding with BusinessRulesCodec in standard mode', () => {
        runGenerator({ detailLevel: 'standard' });
      });

      Then('the document has product area sections with phases', () => {
        // New format: "## Platform / Phase X" instead of domain names
        // Check that we have H2 headings with "Phase" in them
        const headings = findHeadings(state!.document!);
        const h2Headings = headings.filter((h) => h.level === 2);
        const hasPhaseHeadings = h2Headings.some((h) => h.text.includes('Phase'));
        expect(hasPhaseHeadings, 'Expected H2 headings with Phase grouping').toBe(true);
      });
    });

    RuleScenario('Orders rules by phase within domain', ({ Given, When, Then }) => {
      Given('patterns with rules in these phases:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          const phase = parseInt(row.Phase ?? '0');
          const ruleName = row['Rule Name'] ?? 'Test Rule';

          const rule: BusinessRule = {
            name: ruleName,
            description: `Description for ${ruleName}`,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules({ name: `Phase${phase}Pattern`, category: 'ddd', phase }, [rule])
          );
        }
      });

      When('decoding with BusinessRulesCodec in standard mode', () => {
        runGenerator({ detailLevel: 'standard' });
      });

      Then(
        'phase {int} content appears before phase {int} content',
        (_ctx: unknown, phase1: number, phase2: number) => {
          const phase1Pos = state!.markdown.indexOf(`Phase ${phase1}`);
          const phase2Pos = state!.markdown.indexOf(`Phase ${phase2}`);

          expect(phase1Pos, `Phase ${phase1} not found`).toBeGreaterThan(-1);
          expect(phase2Pos, `Phase ${phase2} not found`).toBeGreaterThan(-1);
          expect(phase1Pos, `Phase ${phase1} should appear before Phase ${phase2}`).toBeLessThan(
            phase2Pos
          );
        }
      );
    });
  });

  // ===========================================================================
  // Rule 3: Summary mode generates compact output
  // ===========================================================================

  Rule('Summary mode generates compact output', ({ RuleScenario }) => {
    RuleScenario('Summary mode includes statistics line', ({ Given, When, Then }) => {
      Given('multiple patterns with a total of {int} rules', (_ctx: unknown, ruleCount: number) => {
        for (let i = 0; i < ruleCount; i++) {
          const rule: BusinessRule = {
            name: `Rule ${i + 1}`,
            description: `Description for rule ${i + 1}`,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules(
              {
                name: `Pattern${i}`,
                category: i % 2 === 0 ? 'ddd' : 'event-sourcing',
                phase: 10 + i,
              },
              [rule]
            )
          );
        }
      });

      When('decoding with BusinessRulesCodec in summary mode', () => {
        runGenerator({ detailLevel: 'summary' });
      });

      Then(
        'the document has a summary line with rule count {int}',
        (_ctx: unknown, expectedTotal: number) => {
          // New format: single line summary like "169 rules from 38 features across 3 product areas"
          expect(
            markdownContains(`${expectedTotal} rules`),
            `Expected summary to mention "${expectedTotal} rules"`
          ).toBe(true);
        }
      );
    });

    RuleScenario('Summary mode excludes detailed sections', ({ Given, When, Then }) => {
      Given('multiple patterns with a total of {int} rules', (_ctx: unknown, ruleCount: number) => {
        for (let i = 0; i < ruleCount; i++) {
          const rule: BusinessRule = {
            name: `Rule ${i + 1}`,
            description: `Description for rule ${i + 1}`,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules({ name: `Pattern${i}`, category: 'ddd', phase: 10 }, [rule])
          );
        }
      });

      When('decoding with BusinessRulesCodec in summary mode', () => {
        runGenerator({ detailLevel: 'summary' });
      });

      Then('the document does not have detailed rule headings', () => {
        // In summary mode, there should be no H4 rule headings (individual rules)
        const headings = findHeadings(state!.document!);
        const h4Headings = headings.filter((h) => h.level === 4);
        expect(h4Headings.length).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Rule 4: Code examples and tables
  // ===========================================================================

  Rule('Preserves code examples and tables in detailed mode', ({ RuleScenario }) => {
    RuleScenario('Code examples included in detailed mode', ({ Given, When, Then }) => {
      Given('a pattern with a rule containing code examples', () => {
        const description = `
**Invariant:** Code must be documented.

\`\`\`typescript
const example = "code";
\`\`\`
`;
        const rule: BusinessRule = {
          name: 'Code Rule',
          description,
          scenarioNames: [],
          scenarioCount: 0,
        };

        state!.patterns.push(
          createPatternWithRules({ name: 'CodePattern', category: 'core', phase: 1 }, [rule])
        );
      });

      When('decoding with BusinessRulesCodec in detailed mode with code examples enabled', () => {
        runGenerator({ detailLevel: 'detailed', includeCodeExamples: true });
      });

      Then('the document contains code blocks', () => {
        expect(markdownContains('```')).toBe(true);
      });
    });

    RuleScenario('Code examples excluded in standard mode', ({ Given, When, Then }) => {
      Given('a pattern with a rule containing code examples', () => {
        const description = `
**Invariant:** Code must be documented.

\`\`\`typescript
const example = "code";
\`\`\`
`;
        const rule: BusinessRule = {
          name: 'Code Rule',
          description,
          scenarioNames: [],
          scenarioCount: 0,
        };

        state!.patterns.push(
          createPatternWithRules({ name: 'CodePattern', category: 'core', phase: 1 }, [rule])
        );
      });

      When('decoding with BusinessRulesCodec in standard mode', () => {
        runGenerator({ detailLevel: 'standard', includeCodeExamples: false });
      });

      Then('the document does not contain code blocks with language hints', () => {
        // The code blocks from rule descriptions should not appear in standard mode
        expect(markdownContains('```typescript')).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Rule 5: Traceability links
  // ===========================================================================

  Rule('Generates scenario traceability links', ({ RuleScenario }) => {
    RuleScenario('Verification links include file path', ({ Given, When, Then }) => {
      Given(
        'a pattern with scenarios in {string} at line {int}',
        (_ctx: unknown, featureFile: string, _lineNumber: number) => {
          const rule: BusinessRule = {
            name: 'Test Rule',
            description: '**Verified by:** Test Scenario',
            scenarioNames: ['Test Scenario'],
            scenarioCount: 1,
          };

          state!.patterns.push(
            createPatternWithRules(
              { name: 'TestPattern', category: 'ddd', phase: 20, filePath: featureFile },
              [rule]
            )
          );
        }
      );

      When('decoding with BusinessRulesCodec in detailed mode with verification enabled', () => {
        runGenerator({ detailLevel: 'detailed', includeVerifiedBy: true });
      });

      Then('the verification links include {string}', (_ctx: unknown, expectedPath: string) => {
        expect(markdownContains(expectedPath)).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Rule 6: Progressive disclosure splits by product area
  // ===========================================================================

  Rule('Progressive disclosure generates detail files per product area', ({ RuleScenario }) => {
    RuleScenario('Detail files are generated per product area', ({ Given, When, Then }) => {
      Given('patterns with rules in product areas:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          const productArea = row.ProductArea ?? 'Platform';
          const ruleName = row.RuleName ?? 'Test Rule';

          const rule: BusinessRule = {
            name: ruleName,
            description: `**Invariant:** ${ruleName} invariant.`,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules(
              {
                name: `${productArea}Pattern`,
                category: 'core',
                phase: 1,
                filePath: `tests/features/${productArea.toLowerCase()}.feature`,
                productArea,
              },
              [rule]
            )
          );
        }
      });

      When('decoding with BusinessRulesCodec with detail files enabled', () => {
        runGenerator({ detailLevel: 'standard', generateDetailFiles: true });
      });

      Then(
        'the document has {int} additional files for product areas',
        (_ctx: unknown, expectedCount: number) => {
          const additionalFiles = state!.document!.additionalFiles;
          expect(additionalFiles).toBeDefined();
          const keys = Object.keys(additionalFiles!);
          expect(keys.length).toBe(expectedCount);
          // Verify all are in business-rules/ directory
          for (const key of keys) {
            expect(key).toMatch(/^business-rules\//);
          }
        }
      );
    });

    RuleScenario(
      'Main document has product area index table with links',
      ({ Given, When, Then, And }) => {
        Given(
          'patterns with rules in product areas:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            for (const row of dataTable) {
              const productArea = row.ProductArea ?? 'Platform';
              const ruleName = row.RuleName ?? 'Test Rule';

              const rule: BusinessRule = {
                name: ruleName,
                description: `**Invariant:** ${ruleName} invariant.`,
                scenarioNames: [],
                scenarioCount: 0,
              };

              state!.patterns.push(
                createPatternWithRules(
                  {
                    name: `${productArea}Pattern`,
                    category: 'core',
                    phase: 1,
                    filePath: `tests/features/${productArea.toLowerCase()}.feature`,
                    productArea,
                  },
                  [rule]
                )
              );
            }
          }
        );

        When('decoding with BusinessRulesCodec with detail files enabled', () => {
          runGenerator({ detailLevel: 'standard', generateDetailFiles: true });
        });

        Then(
          'the document has a table with column {string}',
          (_ctx: unknown, columnName: string) => {
            const tables = findTables(state!.document!);
            const hasColumn = tables.some((t) => t.columns.includes(columnName));
            expect(hasColumn, `Expected a table with column "${columnName}"`).toBe(true);
          }
        );

        And('the table contains link text {string}', (_ctx: unknown, linkText: string) => {
          // The table rows contain markdown links like [Annotation](business-rules/annotation.md)
          expect(
            markdownContains(linkText),
            `Expected table to contain link text "${linkText}"`
          ).toBe(true);
        });
      }
    );

    RuleScenario('Detail files have back-link to main document', ({ Given, When, Then }) => {
      Given('patterns with rules in product areas:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          const productArea = row.ProductArea ?? 'Platform';
          const ruleName = row.RuleName ?? 'Test Rule';

          const rule: BusinessRule = {
            name: ruleName,
            description: `**Invariant:** ${ruleName} invariant.`,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules(
              {
                name: `${productArea}Pattern`,
                category: 'core',
                phase: 1,
                filePath: `tests/features/${productArea.toLowerCase()}.feature`,
                productArea,
              },
              [rule]
            )
          );
        }
      });

      When('decoding with BusinessRulesCodec with detail files enabled', () => {
        runGenerator({ detailLevel: 'standard', generateDetailFiles: true });
      });

      Then('additional file {string} contains back-link', (_ctx: unknown, filePath: string) => {
        const additionalFiles = state!.document!.additionalFiles;
        expect(additionalFiles).toBeDefined();
        const subDoc = additionalFiles![filePath];
        expect(subDoc).toBeDefined();

        // Check for link-out block in the sub-document
        const hasLinkOut = findLinkOutBlocks(subDoc.sections).length > 0;
        expect(hasLinkOut, `Expected detail file "${filePath}" to have a back-link`).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Rule 7: Empty rules show placeholder instead of blank content
  // ===========================================================================

  Rule('Empty rules show placeholder instead of blank content', ({ RuleScenario }) => {
    RuleScenario(
      'Rule without invariant or description or scenarios shows placeholder',
      ({ Given, When, Then, And }) => {
        Given('a pattern with a rule containing:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          const rule: BusinessRule = {
            name: fields.name ?? 'Test Rule',
            description: '', // Empty description — no invariant, no content
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules(
              {
                name: 'EmptyRulePattern',
                category: 'core',
                phase: 1,
                filePath: 'test.feature',
              },
              [rule]
            )
          );
        });

        When('decoding with BusinessRulesCodec in standard mode', () => {
          runGenerator({ detailLevel: 'standard', generateDetailFiles: false });
        });

        Then('the document contains rule {string}', (_ctx: unknown, expectedRule: string) => {
          expect(findRuleHeading(expectedRule)).toBe(true);
        });

        And('the document contains {string}', (_ctx: unknown, expectedText: string) => {
          expect(markdownContains(expectedText)).toBe(true);
        });
      }
    );

    RuleScenario(
      'Rule without invariant but with scenarios shows verified-by instead',
      ({ Given, When, Then, And }) => {
        Given('a pattern with a rule that has no invariant but 2 scenarios', () => {
          const rule: BusinessRule = {
            name: 'Rule with scenarios only',
            description: '',
            scenarioNames: ['Scenario A', 'Scenario B'],
            scenarioCount: 2,
          };

          state!.patterns.push(
            createPatternWithRules(
              {
                name: 'ScenariosOnlyPattern',
                category: 'core',
                phase: 1,
                filePath: 'test.feature',
              },
              [rule]
            )
          );
        });

        When('decoding with BusinessRulesCodec in standard mode', () => {
          runGenerator({ detailLevel: 'standard', generateDetailFiles: false });
        });

        Then('the document does not contain {string}', (_ctx: unknown, unexpectedText: string) => {
          expect(markdownContains(unexpectedText)).toBe(false);
        });

        And('the document contains {string}', (_ctx: unknown, expectedText: string) => {
          expect(markdownContains(expectedText)).toBe(true);
        });
      }
    );
  });

  // ===========================================================================
  // Rule 8: Rules always render flat without collapsible blocks
  // ===========================================================================

  Rule('Rules always render flat for full visibility', ({ RuleScenario }) => {
    RuleScenario(
      'Features with many rules render flat without collapsible blocks',
      ({ Given, When, Then, And }) => {
        Given(
          'a pattern with {int} rules each having {int} scenarios',
          (_ctx: unknown, ruleCount: number, scenarioCount: number) => {
            const rules: BusinessRule[] = [];
            for (let i = 0; i < ruleCount; i++) {
              const scenarios: string[] = [];
              for (let j = 0; j < scenarioCount; j++) {
                scenarios.push(`Scenario ${i + 1}.${j + 1}`);
              }
              rules.push({
                name: `Rule ${i + 1}`,
                description: `**Invariant:** Rule ${i + 1} constraint.`,
                scenarioNames: scenarios,
                scenarioCount: scenarios.length,
              });
            }

            state!.patterns.push(
              createPatternWithRules(
                { name: 'ManyRulesPattern', category: 'core', phase: 1, filePath: 'test.feature' },
                rules
              )
            );
          }
        );

        When('decoding with BusinessRulesCodec in standard mode', () => {
          runGenerator({ detailLevel: 'standard', generateDetailFiles: false });
        });

        Then('the document does not contain collapsible blocks', () => {
          const collapsibles = findCollapsibles(state!.document!);
          expect(collapsibles.length).toBe(0);
        });

        And('all rule headings are directly visible', () => {
          const headings = findHeadings(state!.document!);
          const h4Headings = headings.filter((h) => h.level === 4);
          expect(h4Headings.length).toBe(4);
        });
      }
    );
  });

  // ===========================================================================
  // Rule 9: Source shown as filename text not broken links
  // ===========================================================================

  Rule('Source file shown as filename text', ({ RuleScenario }) => {
    RuleScenario('Source file rendered as plain text not link', ({ Given, When, Then }) => {
      Given('a pattern with a rule in file {string}', (_ctx: unknown, filePath: string) => {
        const rule: BusinessRule = {
          name: 'Source Rule',
          description: '**Invariant:** Source is shown as text.',
          scenarioNames: ['Source test'],
          scenarioCount: 1,
        };

        state!.patterns.push(
          createPatternWithRules({ name: 'SourcePattern', category: 'core', phase: 1, filePath }, [
            rule,
          ])
        );
      });

      When('decoding with BusinessRulesCodec in standard mode', () => {
        runGenerator({ detailLevel: 'standard', generateDetailFiles: false });
      });

      Then('the document contains {string}', (_ctx: unknown, expectedText: string) => {
        expect(markdownContains(expectedText)).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Rule 10: Verified-by renders as compact italic line
  // ===========================================================================

  Rule('Verified-by renders as checkbox list at standard level', ({ RuleScenario }) => {
    RuleScenario('Rules with scenarios show verified-by checklist', ({ Given, When, Then }) => {
      Given(
        'a pattern with a rule having scenarios {string} and {string}',
        (_ctx: unknown, scenario1: string, scenario2: string) => {
          const rule: BusinessRule = {
            name: 'Verified Rule',
            description: '**Invariant:** Must be verified.',
            scenarioNames: [scenario1, scenario2],
            scenarioCount: 2,
          };

          state!.patterns.push(
            createPatternWithRules(
              { name: 'VerifiedPattern', category: 'core', phase: 1, filePath: 'test.feature' },
              [rule]
            )
          );
        }
      );

      When('decoding with BusinessRulesCodec in standard mode', () => {
        runGenerator({ detailLevel: 'standard', generateDetailFiles: false });
      });

      Then('the document contains verified-by with scenario names', () => {
        expect(markdownContains('Verified by:')).toBe(true);
        expect(markdownContains('Create order')).toBe(true);
        expect(markdownContains('Cancel order')).toBe(true);
      });
    });

    RuleScenario('Duplicate scenario names are deduplicated', ({ Given, When, Then }) => {
      Given('a pattern with a rule having duplicate scenario names', () => {
        const rule: BusinessRule = {
          name: 'Dedup Rule',
          description: '**Invariant:** Deduplication works.\n\n**Verified by:** Scenario Alpha',
          scenarioNames: ['Scenario Alpha', 'Scenario Beta'],
          scenarioCount: 2,
        };

        state!.patterns.push(
          createPatternWithRules(
            { name: 'DedupPattern', category: 'core', phase: 1, filePath: 'test.feature' },
            [rule]
          )
        );
      });

      When('decoding with BusinessRulesCodec in standard mode', () => {
        runGenerator({ detailLevel: 'standard', generateDetailFiles: false });
      });

      Then('the verified-by list contains each scenario name only once', () => {
        // Count occurrences of "Scenario Alpha" as bullet items
        const alphaCount = (state!.markdown.match(/- Scenario Alpha/g) ?? []).length;
        expect(alphaCount, 'Scenario Alpha should appear exactly once').toBe(1);
        expect(state!.markdown).toContain('- Scenario Beta');
      });
    });
  });

  // ===========================================================================
  // Rule 11: Feature names are humanized from camelCase
  // ===========================================================================

  Rule('Feature names are humanized from camelCase pattern names', ({ RuleScenario }) => {
    RuleScenario('CamelCase pattern name becomes spaced heading', ({ Given, When, Then }) => {
      Given('a pattern named {string} with a rule', (_ctx: unknown, patternName: string) => {
        const rule: BusinessRule = {
          name: 'Test Rule',
          description: '**Invariant:** Test constraint.',
          scenarioNames: ['Test scenario'],
          scenarioCount: 1,
        };

        state!.patterns.push(
          createPatternWithRules(
            { name: patternName, category: 'core', phase: 1, filePath: 'test.feature' },
            [rule]
          )
        );
      });

      When('decoding with BusinessRulesCodec in standard mode', () => {
        runGenerator({ detailLevel: 'standard', generateDetailFiles: false });
      });

      Then('the document contains heading {string}', (_ctx: unknown, expectedHeading: string) => {
        const headings = findHeadings(state!.document!);
        const hasHeading = headings.some((h) => h.text === expectedHeading);
        expect(
          hasHeading,
          `Expected heading "${expectedHeading}" in ${headings.map((h) => h.text).join(', ')}`
        ).toBe(true);
      });
    });

    RuleScenario('Testing suffix is stripped from feature names', ({ Given, When, Then }) => {
      Given('a pattern named {string} with a rule', (_ctx: unknown, patternName: string) => {
        const rule: BusinessRule = {
          name: 'Guard Rule',
          description: '**Invariant:** Guard constraint.',
          scenarioNames: ['Guard scenario'],
          scenarioCount: 1,
        };

        state!.patterns.push(
          createPatternWithRules(
            { name: patternName, category: 'core', phase: 1, filePath: 'test.feature' },
            [rule]
          )
        );
      });

      When('decoding with BusinessRulesCodec in standard mode', () => {
        runGenerator({ detailLevel: 'standard', generateDetailFiles: false });
      });

      Then('the document contains heading {string}', (_ctx: unknown, expectedHeading: string) => {
        const headings = findHeadings(state!.document!);
        const hasHeading = headings.some((h) => h.text === expectedHeading);
        expect(
          hasHeading,
          `Expected heading "${expectedHeading}" in ${headings.map((h) => h.text).join(', ')}`
        ).toBe(true);
      });
    });
  });
});

/**
 * Find all link-out blocks in a sections array (including nested in collapsible)
 */
function findLinkOutBlocks(sections: SectionBlock[]): SectionBlock[] {
  const linkOuts: SectionBlock[] = [];
  for (const section of sections) {
    if (section.type === 'link-out') {
      linkOuts.push(section);
    } else if (section.type === 'collapsible' && 'content' in section) {
      linkOuts.push(...findLinkOutBlocks(section.content));
    }
  }
  return linkOuts;
}
