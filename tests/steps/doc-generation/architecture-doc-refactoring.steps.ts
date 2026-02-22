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
}

function initState(): ArchitectureRefactoringState {
  return {
    architectureContent: null,
    currentSectionName: null,
    currentSectionContent: null,
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
});
