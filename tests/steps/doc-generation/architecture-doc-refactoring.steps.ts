/**
 * Integration steps for architecture doc refactoring coverage.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface ArchitectureRefactoringState {
  architectureContent: string | null;
  currentSectionName: string | null;
  currentSectionContent: string | null;
  currentFileContent: string | null;
}

function initState(): ArchitectureRefactoringState {
  return {
    architectureContent: null,
    currentSectionName: null,
    currentSectionContent: null,
    currentFileContent: null,
  };
}

function getHeadingStart(content: string, heading: string): number {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingRegex = new RegExp(`^##\\s+${escaped}\\s*$`, 'm');
  const match = headingRegex.exec(content);
  return match?.index ?? -1;
}

function getSectionContent(content: string, heading: string): string {
  const start = getHeadingStart(content, heading);
  if (start < 0) return '';

  const afterStart = content.slice(start);
  const nextHeadingMatch = /^##\s+/m.exec(afterStart.slice(1));
  if (!nextHeadingMatch) return afterStart;

  const nextStart = nextHeadingMatch.index + 1;
  return afterStart.slice(0, nextStart);
}

let state: ArchitectureRefactoringState | null = null;

const feature = await loadFeature(
  'tests/features/doc-generation/architecture-doc-refactoring.feature'
);

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('ARCHITECTURE.md on the filesystem', () => {
      state = initState();
      const fullPath = path.join(process.cwd(), 'docs/ARCHITECTURE.md');
      state.architectureContent = fs.readFileSync(fullPath, 'utf-8');
    });
  });

  Rule('Product area pointer replacements link to covering documents', ({ RuleScenario }) => {
    RuleScenario(
      'Configuration Architecture pointer links to covering document',
      ({ When, Then, And }) => {
        When('reading the {string} section', (_ctx: unknown, section: string) => {
          state!.currentSectionName = section;
          state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
          expect(state!.currentSectionContent.length).toBeGreaterThan(0);
        });

        Then('the section contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).toContain(text);
        });

        And('file {string} contains {string}', (_ctx: unknown, filePath: string, text: string) => {
          const fullPath = path.join(process.cwd(), filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content.toLowerCase()).toContain(text.toLowerCase());
        });

        And(
          'file {string} also contains {string}',
          (_ctx: unknown, filePath: string, text: string) => {
            const fullPath = path.join(process.cwd(), filePath);
            const content = fs.readFileSync(fullPath, 'utf-8');
            expect(content.toLowerCase()).toContain(text.toLowerCase());
          }
        );
      }
    );

    RuleScenario(
      'Source Systems pointer links to annotation product area',
      ({ When, Then, And }) => {
        When('reading the {string} section', (_ctx: unknown, section: string) => {
          state!.currentSectionName = section;
          state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
          expect(state!.currentSectionContent.length).toBeGreaterThan(0);
        });

        Then('the section contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).toContain(text);
        });

        And('file {string} contains {string}', (_ctx: unknown, filePath: string, text: string) => {
          const fullPath = path.join(process.cwd(), filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content.toLowerCase()).toContain(text.toLowerCase());
        });

        And(
          'file {string} also contains {string}',
          (_ctx: unknown, filePath: string, text: string) => {
            const fullPath = path.join(process.cwd(), filePath);
            const content = fs.readFileSync(fullPath, 'utf-8');
            expect(content.toLowerCase()).toContain(text.toLowerCase());
          }
        );
      }
    );

    RuleScenario(
      'Workflow Integration pointer links to process product area',
      ({ When, Then, And }) => {
        When('reading the {string} section', (_ctx: unknown, section: string) => {
          state!.currentSectionName = section;
          state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
          expect(state!.currentSectionContent.length).toBeGreaterThan(0);
        });

        Then('the section contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).toContain(text);
        });

        And('file {string} contains {string}', (_ctx: unknown, filePath: string, text: string) => {
          const fullPath = path.join(process.cwd(), filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content.toLowerCase()).toContain(text.toLowerCase());
        });

        And(
          'file {string} also contains {string}',
          (_ctx: unknown, filePath: string, text: string) => {
            const fullPath = path.join(process.cwd(), filePath);
            const content = fs.readFileSync(fullPath, 'utf-8');
            expect(content.toLowerCase()).toContain(text.toLowerCase());
          }
        );
      }
    );
  });

  Rule('Annotation examples remain in Four-Stage Pipeline section', ({ RuleScenario }) => {
    RuleScenario(
      'Annotation format examples appear before Source Systems',
      ({ When, Then, And }) => {
        When('reading the {string} section', (_ctx: unknown, section: string) => {
          state!.currentSectionName = section;
          state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
          expect(state!.currentSectionContent.length).toBeGreaterThan(0);
        });

        Then('the section contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).toContain(text);
        });

        And('the section also contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).toContain(text);
        });

        And(
          'section {string} appears before section {string}',
          (_ctx: unknown, first: string, second: string) => {
            const content = state!.architectureContent!;
            const firstStart = getHeadingStart(content, first);
            const secondStart = getHeadingStart(content, second);
            expect(firstStart).toBeGreaterThanOrEqual(0);
            expect(secondStart).toBeGreaterThanOrEqual(0);
            expect(firstStart).toBeLessThan(secondStart);
          }
        );
      }
    );
  });

  Rule(
    'Convention extraction produces ARCHITECTURE-CODECS reference document',
    ({ RuleScenario }) => {
      RuleScenario(
        'Session codecs file produces multiple convention sections',
        ({ When, Then }) => {
          When('reading file {string}', (_ctx: unknown, filePath: string) => {
            const fullPath = path.join(process.cwd(), filePath);
            state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
          });

          Then('the file contains each of the following:', (_ctx: unknown, docString: string) => {
            for (const line of docString.trim().split('\n')) {
              if (line.trim().length > 0) {
                expect(state!.currentFileContent).toContain(line.trim());
              }
            }
          });
        }
      );

      RuleScenario('Convention sections include output file references', ({ When, Then, And }) => {
        When('reading file {string}', (_ctx: unknown, filePath: string) => {
          const fullPath = path.join(process.cwd(), filePath);
          state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
        });

        Then('the file contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentFileContent).toContain(text);
        });

        And('the file also contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentFileContent).toContain(text);
        });
      });

      RuleScenario(
        'ARCHITECTURE-CODECS document has substantial content from all codec files',
        ({ When, Then }) => {
          When('reading file {string}', (_ctx: unknown, filePath: string) => {
            const fullPath = path.join(process.cwd(), filePath);
            state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
          });

          Then('the file has more than {int} lines', (_ctx: unknown, minLines: number) => {
            const lineCount = state!.currentFileContent!.split('\n').length;
            expect(lineCount).toBeGreaterThan(minLines);
          });
        }
      );

      RuleScenario('Session codec source file has structured JSDoc headings', ({ When, Then }) => {
        When('reading file {string}', (_ctx: unknown, filePath: string) => {
          const fullPath = path.join(process.cwd(), filePath);
          state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
        });

        Then('the file contains each of the following:', (_ctx: unknown, docString: string) => {
          for (const line of docString.trim().split('\n')) {
            if (line.trim().length > 0) {
              expect(state!.currentFileContent).toContain(line.trim());
            }
          }
        });
      });

      RuleScenario(
        'Convention rule titles match source heading text in generated output',
        ({ When, Then, And }) => {
          When('reading file {string}', (_ctx: unknown, filePath: string) => {
            const fullPath = path.join(process.cwd(), filePath);
            state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
          });

          Then('the file contains {string}', (_ctx: unknown, text: string) => {
            expect(state!.currentFileContent).toContain(text);
          });

          And('the file also contains {string}', (_ctx: unknown, text: string) => {
            expect(state!.currentFileContent).toContain(text);
          });
        }
      );
    }
  );

  Rule('Section disposition routes content to generated equivalents', ({ RuleScenario }) => {
    RuleScenario(
      'Unified Transformation Architecture section is a pointer to ARCHITECTURE-TYPES',
      ({ When, Then, And }) => {
        When('reading the {string} section', (_ctx: unknown, section: string) => {
          state!.currentSectionName = section;
          state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
          expect(state!.currentSectionContent.length).toBeGreaterThan(0);
        });

        Then('the section contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).toContain(text);
        });

        And('the section does not contain {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).not.toContain(text);
        });
      }
    );

    RuleScenario('Data Flow Diagrams section is a pointer', ({ When, Then }) => {
      When('reading the {string} section', (_ctx: unknown, section: string) => {
        state!.currentSectionName = section;
        state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
        expect(state!.currentSectionContent.length).toBeGreaterThan(0);
      });

      Then('the section contains {string}', (_ctx: unknown, text: string) => {
        expect(state!.currentSectionContent).toContain(text);
      });
    });

    RuleScenario('Quick Reference section points to ARCHITECTURE-CODECS', ({ When, Then }) => {
      When('reading the {string} section', (_ctx: unknown, section: string) => {
        state!.currentSectionName = section;
        state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
        expect(state!.currentSectionContent.length).toBeGreaterThan(0);
      });

      Then('the section contains {string}', (_ctx: unknown, text: string) => {
        expect(state!.currentSectionContent).toContain(text);
      });
    });
  });

  Rule('MasterDataset shapes appear in ARCHITECTURE-TYPES reference', ({ RuleScenario }) => {
    RuleScenario('Core MasterDataset types appear in ARCHITECTURE-TYPES', ({ When, Then }) => {
      When('reading file {string}', (_ctx: unknown, filePath: string) => {
        const fullPath = path.join(process.cwd(), filePath);
        state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
      });

      Then('the file contains each of the following:', (_ctx: unknown, docString: string) => {
        for (const line of docString.trim().split('\n')) {
          if (line.trim().length > 0) {
            expect(state!.currentFileContent).toContain(line.trim());
          }
        }
      });
    });

    RuleScenario('Pipeline types appear in ARCHITECTURE-TYPES reference', ({ When, Then, And }) => {
      When('reading file {string}', (_ctx: unknown, filePath: string) => {
        const fullPath = path.join(process.cwd(), filePath);
        state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
      });

      Then('the file contains {string}', (_ctx: unknown, text: string) => {
        expect(state!.currentFileContent).toContain(text);
      });

      And('the file also contains {string}', (_ctx: unknown, text: string) => {
        expect(state!.currentFileContent).toContain(text);
      });
    });

    RuleScenario(
      'Unified Transformation section replaced with pointer and narrative',
      ({ When, Then, And }) => {
        When('reading the {string} section', (_ctx: unknown, section: string) => {
          state!.currentSectionName = section;
          state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
          expect(state!.currentSectionContent.length).toBeGreaterThan(0);
        });

        Then('the section contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).toContain(text);
        });

        And('the section also contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentSectionContent).toContain(text);
        });
      }
    );
  });

  Rule('Pipeline architecture convention appears in generated reference', ({ RuleScenario }) => {
    RuleScenario(
      'Orchestrator source file has pipeline-architecture convention tag',
      ({ When, Then }) => {
        When('reading file {string}', (_ctx: unknown, filePath: string) => {
          const fullPath = path.join(process.cwd(), filePath);
          state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
        });

        Then('the file contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentFileContent).toContain(text);
        });
      }
    );

    RuleScenario(
      'Build-pipeline source file has pipeline-architecture convention tag',
      ({ When, Then }) => {
        When('reading file {string}', (_ctx: unknown, filePath: string) => {
          const fullPath = path.join(process.cwd(), filePath);
          state!.currentFileContent = fs.readFileSync(fullPath, 'utf-8');
        });

        Then('the file contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.currentFileContent).toContain(text);
        });
      }
    );
  });

  Rule('Editorial trimming removes tutorial sections and reduces file size', ({ RuleScenario }) => {
    RuleScenario('Programmatic Usage section removed from ARCHITECTURE.md', ({ Then }) => {
      Then('section {string} is absent from ARCHITECTURE.md', (_ctx: unknown, heading: string) => {
        const idx = getHeadingStart(state!.architectureContent!, heading);
        expect(idx).toBe(-1);
      });
    });

    RuleScenario('Extending the System section removed from ARCHITECTURE.md', ({ Then }) => {
      Then('section {string} is absent from ARCHITECTURE.md', (_ctx: unknown, heading: string) => {
        const idx = getHeadingStart(state!.architectureContent!, heading);
        expect(idx).toBe(-1);
      });
    });

    RuleScenario('Key Design Patterns section has pointer to CORE-TYPES', ({ When, Then }) => {
      When('reading the {string} section', (_ctx: unknown, section: string) => {
        state!.currentSectionName = section;
        state!.currentSectionContent = getSectionContent(state!.architectureContent!, section);
        expect(state!.currentSectionContent.length).toBeGreaterThan(0);
      });

      Then('the section contains {string}', (_ctx: unknown, text: string) => {
        expect(state!.currentSectionContent).toContain(text);
      });
    });

    RuleScenario('ARCHITECTURE.md is under 400 lines after editorial trimming', ({ Then }) => {
      Then('ARCHITECTURE.md has fewer than {int} lines', (_ctx: unknown, limit: number) => {
        const lineCount = state!.architectureContent!.split('\n').length;
        expect(lineCount).toBeLessThan(limit);
      });
    });
  });
});
