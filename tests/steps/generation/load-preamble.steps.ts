/**
 * Load Preamble Parser Step Definitions
 *
 * BDD step definitions for testing the parseMarkdownToBlocks function:
 * - Heading parsing (levels 1-6)
 * - Paragraph parsing (single/multi-line)
 * - Separator parsing
 * - Table parsing
 * - List parsing (ordered/unordered/GFM checkbox)
 * - Code block parsing
 * - Mermaid block parsing
 * - Mixed content sequencing
 * - Inline formatting preservation
 *
 * NOTE: Markdown content is hardcoded in step definitions rather than
 * using DocStrings because DocStrings containing code fences (```)
 * are mishandled by vitest-cucumber.
 *
 * @libar-docs
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import type { SectionBlock } from '../../../src/renderable/schema.js';
import { parseMarkdownToBlocks } from '../../../src/renderable/load-preamble.js';

// =============================================================================
// State Types
// =============================================================================

interface LoadPreambleState {
  markdownContent: string;
  blocks: readonly SectionBlock[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: LoadPreambleState | null = null;

function initState(): LoadPreambleState {
  return {
    markdownContent: '',
    blocks: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function requireState(): LoadPreambleState {
  if (!state) throw new Error('State not initialized');
  return state;
}

function getBlock(index: number): SectionBlock {
  const s = requireState();
  const block = s.blocks[index];
  if (!block) throw new Error(`No block at index ${String(index)}`);
  return block;
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/generation/load-preamble.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a markdown parser test context', () => {
      state = initState();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Headings are parsed into HeadingBlock
  // ---------------------------------------------------------------------------

  Rule('Headings are parsed into HeadingBlock', ({ RuleScenario }) => {
    RuleScenario('Single heading is parsed', ({ Given, When, Then }) => {
      Given('markdown with a level 2 heading {string}', (_ctx: unknown, _text: string) => {
        requireState().markdownContent = '## Getting Started';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is a heading at level 2 with text {string}', (_ctx: unknown, text: string) => {
        const block = getBlock(0);
        expect(block.type).toBe('heading');
        if (block.type === 'heading') {
          expect(block.level).toBe(2);
          expect(block.text).toBe(text);
        }
      });
    });

    RuleScenario('All heading levels are parsed correctly', ({ Given, When, Then }) => {
      Given('markdown with all six heading levels', () => {
        requireState().markdownContent = [
          '# H1',
          '## H2',
          '### H3',
          '#### H4',
          '##### H5',
          '###### H6',
        ].join('\n');
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('6 heading blocks are produced with levels 1 through 6', () => {
        const s = requireState();
        expect(s.blocks).toHaveLength(6);
        for (let i = 0; i < 6; i++) {
          const block = getBlock(i);
          expect(block.type).toBe('heading');
          if (block.type === 'heading') {
            expect(block.level).toBe(i + 1);
            expect(block.text).toBe(`H${String(i + 1)}`);
          }
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Paragraphs are parsed into ParagraphBlock
  // ---------------------------------------------------------------------------

  Rule('Paragraphs are parsed into ParagraphBlock', ({ RuleScenario }) => {
    RuleScenario('Single line paragraph', ({ Given, When, Then }) => {
      Given('markdown with a single paragraph line', () => {
        requireState().markdownContent = 'This is a simple paragraph.';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is a paragraph with text {string}', (_ctx: unknown, text: string) => {
        const block = getBlock(0);
        expect(block.type).toBe('paragraph');
        if (block.type === 'paragraph') {
          expect(block.text).toBe(text);
        }
      });
    });

    RuleScenario('Multi-line paragraph joined with space', ({ Given, When, Then }) => {
      Given('markdown with a two-line paragraph', () => {
        requireState().markdownContent =
          'This is the first line\nand this continues the paragraph.';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is a paragraph with joined text', () => {
        const block = getBlock(0);
        expect(block.type).toBe('paragraph');
        if (block.type === 'paragraph') {
          expect(block.text).toBe('This is the first line and this continues the paragraph.');
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Separators are parsed into SeparatorBlock
  // ---------------------------------------------------------------------------

  Rule('Separators are parsed into SeparatorBlock', ({ RuleScenario }) => {
    RuleScenario('Triple dash separator', ({ Given, When, Then }) => {
      Given('markdown with a separator between paragraphs', () => {
        requireState().markdownContent = 'Above\n\n---\n\nBelow';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('the result has a paragraph then separator then paragraph', () => {
        const s = requireState();
        expect(s.blocks).toHaveLength(3);
        expect(s.blocks[0]?.type).toBe('paragraph');
        expect(s.blocks[1]?.type).toBe('separator');
        expect(s.blocks[2]?.type).toBe('paragraph');
        const first = s.blocks[0];
        const last = s.blocks[2];
        if (first?.type === 'paragraph') expect(first.text).toBe('Above');
        if (last?.type === 'paragraph') expect(last.text).toBe('Below');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Tables are parsed into TableBlock
  // ---------------------------------------------------------------------------

  Rule('Tables are parsed into TableBlock', ({ RuleScenario }) => {
    RuleScenario('Simple table with header and rows', ({ Given, When, Then }) => {
      Given('markdown with a two-column table', () => {
        requireState().markdownContent = [
          '| Name | Status |',
          '|------|--------|',
          '| Alpha | active |',
          '| Beta | pending |',
        ].join('\n');
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is a table with the expected columns and rows', () => {
        const block = getBlock(0);
        expect(block.type).toBe('table');
        if (block.type === 'table') {
          expect(block.columns).toEqual(['Name', 'Status']);
          expect(block.rows).toHaveLength(2);
          expect(block.rows[0]).toEqual(['Alpha', 'active']);
          expect(block.rows[1]).toEqual(['Beta', 'pending']);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Unordered lists are parsed into ListBlock
  // ---------------------------------------------------------------------------

  Rule('Unordered lists are parsed into ListBlock', ({ RuleScenario }) => {
    RuleScenario('Dash list items', ({ Given, When, Then }) => {
      Given('markdown with three dash list items', () => {
        requireState().markdownContent = '- First item\n- Second item\n- Third item';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is an unordered list with 3 items', () => {
        const block = getBlock(0);
        expect(block.type).toBe('list');
        if (block.type === 'list') {
          expect(block.ordered).toBe(false);
          expect(block.items).toHaveLength(3);
          expect(block.items[0]).toBe('First item');
          expect(block.items[1]).toBe('Second item');
          expect(block.items[2]).toBe('Third item');
        }
      });
    });

    RuleScenario('GFM checkbox list items', ({ Given, When, Then }) => {
      Given('markdown with GFM checkbox items', () => {
        requireState().markdownContent = '- [ ] Unchecked task\n- [x] Checked task';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is an unordered list with checkbox text preserved', () => {
        const block = getBlock(0);
        expect(block.type).toBe('list');
        if (block.type === 'list') {
          expect(block.ordered).toBe(false);
          expect(block.items).toHaveLength(2);
          expect(block.items[0]).toBe('[ ] Unchecked task');
          expect(block.items[1]).toBe('[x] Checked task');
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Ordered lists are parsed into ListBlock
  // ---------------------------------------------------------------------------

  Rule('Ordered lists are parsed into ListBlock', ({ RuleScenario }) => {
    RuleScenario('Numbered list items', ({ Given, When, Then }) => {
      Given('markdown with three numbered list items', () => {
        requireState().markdownContent = '1. First step\n2. Second step\n3. Third step';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is an ordered list with 3 items', () => {
        const block = getBlock(0);
        expect(block.type).toBe('list');
        if (block.type === 'list') {
          expect(block.ordered).toBe(true);
          expect(block.items).toHaveLength(3);
          expect(block.items[0]).toBe('First step');
          expect(block.items[1]).toBe('Second step');
          expect(block.items[2]).toBe('Third step');
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Code blocks are parsed into CodeBlock
  // ---------------------------------------------------------------------------

  Rule('Code blocks are parsed into CodeBlock', ({ RuleScenario }) => {
    RuleScenario('Code block with language', ({ Given, When, Then }) => {
      Given('markdown with a typescript code block', () => {
        requireState().markdownContent = '```typescript\nconst x = 1;\nconst y = 2;\n```';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then(
        'block 1 is a code block with language {string} and content',
        (_ctx: unknown, language: string) => {
          const block = getBlock(0);
          expect(block.type).toBe('code');
          if (block.type === 'code') {
            expect(block.language).toBe(language);
            expect(block.content).toContain('const x = 1;');
            expect(block.content).toContain('const y = 2;');
          }
        }
      );
    });

    RuleScenario('Empty code block', ({ Given, When, Then }) => {
      Given('markdown with an empty code block', () => {
        requireState().markdownContent = '```bash\n```';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is a code block with empty content', () => {
        const block = getBlock(0);
        expect(block.type).toBe('code');
        if (block.type === 'code') {
          expect(block.language).toBe('bash');
          expect(block.content).toBe('');
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Mermaid blocks are parsed into MermaidBlock
  // ---------------------------------------------------------------------------

  Rule('Mermaid blocks are parsed into MermaidBlock', ({ RuleScenario }) => {
    RuleScenario('Mermaid diagram block', ({ Given, When, Then }) => {
      Given('markdown with a mermaid diagram', () => {
        requireState().markdownContent = '```mermaid\ngraph LR\n  A --> B\n  B --> C\n```';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is a mermaid block with graph content', () => {
        const block = getBlock(0);
        expect(block.type).toBe('mermaid');
        if (block.type === 'mermaid') {
          expect(block.content).toContain('graph LR');
          expect(block.content).toContain('A --> B');
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Mixed content produces correct block sequence
  // ---------------------------------------------------------------------------

  Rule('Mixed content produces correct block sequence', ({ RuleScenario }) => {
    RuleScenario('Mixed content in sequence', ({ Given, When, Then }) => {
      Given('markdown with heading, paragraph, table, code, and list', () => {
        requireState().markdownContent = [
          '## Overview',
          '',
          'This is a paragraph.',
          '',
          '| Col A | Col B |',
          '|-------|-------|',
          '| val1  | val2  |',
          '',
          '```typescript',
          'const x = 1;',
          '```',
          '',
          '- item one',
          '- item two',
        ].join('\n');
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('5 blocks are produced in the correct order', () => {
        const s = requireState();
        expect(s.blocks).toHaveLength(5);

        const b0 = s.blocks[0];
        expect(b0?.type).toBe('heading');
        if (b0?.type === 'heading') {
          expect(b0.level).toBe(2);
          expect(b0.text).toBe('Overview');
        }

        const b1 = s.blocks[1];
        expect(b1?.type).toBe('paragraph');
        if (b1?.type === 'paragraph') {
          expect(b1.text).toBe('This is a paragraph.');
        }

        const b2 = s.blocks[2];
        expect(b2?.type).toBe('table');
        if (b2?.type === 'table') {
          expect(b2.columns).toEqual(['Col A', 'Col B']);
        }

        const b3 = s.blocks[3];
        expect(b3?.type).toBe('code');
        if (b3?.type === 'code') {
          expect(b3.language).toBe('typescript');
        }

        const b4 = s.blocks[4];
        expect(b4?.type).toBe('list');
        if (b4?.type === 'list') {
          expect(b4.ordered).toBe(false);
          expect(b4.items).toHaveLength(2);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Bold and inline formatting is preserved in paragraphs
  // ---------------------------------------------------------------------------

  Rule('Bold and inline formatting is preserved in paragraphs', ({ RuleScenario }) => {
    RuleScenario('Bold text preserved in paragraph', ({ Given, When, Then }) => {
      Given('markdown with bold and code span formatting', () => {
        requireState().markdownContent = 'This has **bold** and `code` in it.';
      });

      When('parsing the markdown to blocks', () => {
        const s = requireState();
        s.blocks = parseMarkdownToBlocks(s.markdownContent);
      });

      Then('block 1 is a paragraph preserving inline formatting', () => {
        const block = getBlock(0);
        expect(block.type).toBe('paragraph');
        if (block.type === 'paragraph') {
          expect(block.text).toBe('This has **bold** and `code` in it.');
        }
      });
    });
  });
});
