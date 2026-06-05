/**
 * Architecture document render-budget step definitions.
 *
 * Reads the generated `docs-live/ARCHITECTURE.md` and asserts every fenced
 * mermaid block stays under Mermaid's default `maxTextSize`, and that the
 * document is split into more than one block. This guards against a regression
 * back to the single all-pattern `graph TD` that exceeded the limit and failed
 * to render.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

const MERMAID_MAX_TEXT_SIZE = 50_000;

interface RenderBudgetState {
  documentPath: string;
  mermaidBlocks: string[];
}

let state: RenderBudgetState | null = null;

function requireState(): RenderBudgetState {
  if (!state) throw new Error('State not initialized');
  return state;
}

function extractMermaidBlocks(markdown: string): string[] {
  return [...markdown.matchAll(/```mermaid\n([\s\S]*?)\n```/gu)].map((match) => match[1] ?? '');
}

const feature = await loadFeature(
  'tests/features/generation/architecture-doc-render-budget.feature',
);

describeFeature(feature, ({ Rule }) => {
  Rule(
    'No single Mermaid block in the generated architecture document exceeds the renderer limit',
    ({ RuleScenario }) => {
      RuleScenario(
        'every mermaid block in the generated architecture document is renderable',
        ({ Given, When, Then, And }) => {
          Given(
            'the generated architecture document at {string}',
            (_ctx: unknown, relativePath: string) => {
              state = {
                documentPath: path.resolve(process.cwd(), relativePath),
                mermaidBlocks: [],
              };
            },
          );

          When('I extract its fenced mermaid blocks', async () => {
            const current = requireState();
            const markdown = await readFile(current.documentPath, 'utf8');
            current.mermaidBlocks = extractMermaidBlocks(markdown);
          });

          Then('it should contain more than one mermaid block', () => {
            expect(requireState().mermaidBlocks.length).toBeGreaterThan(1);
          });

          And('every mermaid block should be smaller than 50000 characters', () => {
            for (const block of requireState().mermaidBlocks) {
              expect(block.length).toBeLessThan(MERMAID_MAX_TEXT_SIZE);
            }
          });
        },
      );
    },
  );
});
