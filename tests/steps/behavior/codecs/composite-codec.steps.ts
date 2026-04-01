/**
 * Step definitions for Composite Codec tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { z } from 'zod';
import type { PatternGraph } from '../../../../src/validation-schemas/pattern-graph.js';
import type { RenderableDocument, SectionBlock } from '../../../../src/renderable/schema.js';
import { paragraph, document } from '../../../../src/renderable/schema.js';
import type { DocumentCodec } from '../../../../src/renderable/codecs/types/base.js';
import {
  createCompositeCodec,
  composeDocuments,
} from '../../../../src/renderable/codecs/composite.js';
import { PatternGraphSchema } from '../../../../src/validation-schemas/pattern-graph.js';
import { RenderableDocumentOutputSchema } from '../../../../src/renderable/codecs/shared-schema.js';
import { createTestPatternGraph } from '../../../fixtures/dataset-factories.js';
import { resetPatternCounter } from '../../../fixtures/pattern-factories.js';
import { findParagraphs, findBlocksByType } from '../../../support/helpers/document-assertions.js';

// ============================================================================
// State
// ============================================================================

interface CompositeCodecState {
  codecs: DocumentCodec[];
  documents: RenderableDocument[];
  dataset: PatternGraph;
  result: RenderableDocument | null;
}

function initState(): CompositeCodecState {
  resetPatternCounter();
  return {
    codecs: [],
    documents: [],
    dataset: createTestPatternGraph({ patterns: [] }),
    result: null,
  };
}

let state: CompositeCodecState | null = null;

// ============================================================================
// Helpers
// ============================================================================

function stubCodec(doc: RenderableDocument): DocumentCodec {
  return z.codec(PatternGraphSchema, RenderableDocumentOutputSchema, {
    decode: (_dataset: PatternGraph): RenderableDocument => doc,
    encode: (): never => {
      throw new Error('stub codec is decode-only');
    },
  });
}

function makeDoc(
  sections: SectionBlock[],
  options?: { additionalFiles?: Record<string, RenderableDocument> }
): RenderableDocument {
  return document('Stub Doc', sections, {
    additionalFiles: options?.additionalFiles,
  });
}

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/composite-codec.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a composite codec test context', () => {
      state = initState();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: CompositeCodec concatenates sections in codec array order
  // ──────────────────────────────────────────────────────────────────────

  Rule('CompositeCodec concatenates sections in codec array order', ({ RuleScenario }) => {
    RuleScenario('Sections from two codecs appear in order', ({ Given, And, When, Then }) => {
      Given('a codec producing a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.codecs.push(stubCodec(makeDoc([paragraph(text)])));
      });

      And('a codec producing a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.codecs.push(stubCodec(makeDoc([paragraph(text)])));
      });

      When('CompositeCodec assembles them with title {string}', (_ctx: unknown, title: string) => {
        const codec = createCompositeCodec(state!.codecs, { title });
        state!.result = codec.decode(state!.dataset) as RenderableDocument;
      });

      Then('the output title is {string}', (_ctx: unknown, expectedTitle: string) => {
        expect(state!.result!.title).toBe(expectedTitle);
      });

      And(
        'paragraph {string} appears before {string}',
        (_ctx: unknown, first: string, second: string) => {
          const paragraphs = findParagraphs(state!.result!);
          const texts = paragraphs.map((p) => p.text);
          const firstIdx = texts.indexOf(first);
          const secondIdx = texts.indexOf(second);
          expect(firstIdx).toBeGreaterThanOrEqual(0);
          expect(secondIdx).toBeGreaterThan(firstIdx);
        }
      );
    });

    RuleScenario('Three codecs produce sections in array order', ({ Given, When, Then }) => {
      Given(
        'three codecs producing paragraphs {string}, {string}, {string}',
        (_ctx: unknown, first: string, second: string, third: string) => {
          state!.codecs.push(stubCodec(makeDoc([paragraph(first)])));
          state!.codecs.push(stubCodec(makeDoc([paragraph(second)])));
          state!.codecs.push(stubCodec(makeDoc([paragraph(third)])));
        }
      );

      When('CompositeCodec assembles them with title {string}', (_ctx: unknown, title: string) => {
        const codec = createCompositeCodec(state!.codecs, { title });
        state!.result = codec.decode(state!.dataset) as RenderableDocument;
      });

      Then(
        'paragraphs appear in order {string}, {string}, {string}',
        (_ctx: unknown, first: string, second: string, third: string) => {
          const paragraphs = findParagraphs(state!.result!);
          const texts = paragraphs.map((p) => p.text);
          const firstIdx = texts.indexOf(first);
          const secondIdx = texts.indexOf(second);
          const thirdIdx = texts.indexOf(third);
          expect(firstIdx).toBeGreaterThanOrEqual(0);
          expect(secondIdx).toBeGreaterThan(firstIdx);
          expect(thirdIdx).toBeGreaterThan(secondIdx);
        }
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Separators between codec outputs are configurable
  // ──────────────────────────────────────────────────────────────────────

  Rule('Separators between codec outputs are configurable', ({ RuleScenario }) => {
    RuleScenario('Default separator between sections', ({ Given, And, When, Then }) => {
      Given('a codec producing a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.codecs.push(stubCodec(makeDoc([paragraph(text)])));
      });

      And('a codec producing a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.codecs.push(stubCodec(makeDoc([paragraph(text)])));
      });

      When('CompositeCodec assembles them with title {string}', (_ctx: unknown, title: string) => {
        const codec = createCompositeCodec(state!.codecs, { title });
        state!.result = codec.decode(state!.dataset) as RenderableDocument;
      });

      Then('a separator block appears between the two paragraph sections', () => {
        const sections = state!.result!.sections;
        expect(sections).toHaveLength(3);
        expect(sections[0].type).toBe('paragraph');
        expect(sections[1].type).toBe('separator');
        expect(sections[2].type).toBe('paragraph');
      });
    });

    RuleScenario('No separator when disabled', ({ Given, And, When, Then }) => {
      Given('a codec producing a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.codecs.push(stubCodec(makeDoc([paragraph(text)])));
      });

      And('a codec producing a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.codecs.push(stubCodec(makeDoc([paragraph(text)])));
      });

      When('CompositeCodec assembles them with separateSections disabled', () => {
        const codec = createCompositeCodec(state!.codecs, {
          title: 'No Sep Test',
          separateSections: false,
        });
        state!.result = codec.decode(state!.dataset) as RenderableDocument;
      });

      Then('no separator block exists in the output', () => {
        const separators = findBlocksByType(state!.result!, 'separator');
        expect(separators).toHaveLength(0);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: additionalFiles merge with last-wins semantics
  // ──────────────────────────────────────────────────────────────────────

  Rule('additionalFiles merge with last-wins semantics', ({ RuleScenario }) => {
    RuleScenario('Non-overlapping files merged', ({ Given, And, When, Then }) => {
      Given(
        'a codec with additionalFile {string} titled {string}',
        (_ctx: unknown, key: string, title: string) => {
          const additionalFiles: Record<string, RenderableDocument> = {
            [key]: document(title, [paragraph(`Content of ${title}`)]),
          };
          state!.codecs.push(stubCodec(makeDoc([paragraph('main')], { additionalFiles })));
        }
      );

      And(
        'a codec with additionalFile {string} titled {string}',
        (_ctx: unknown, key: string, title: string) => {
          const additionalFiles: Record<string, RenderableDocument> = {
            [key]: document(title, [paragraph(`Content of ${title}`)]),
          };
          state!.codecs.push(stubCodec(makeDoc([paragraph('main')], { additionalFiles })));
        }
      );

      When('CompositeCodec assembles them with title {string}', (_ctx: unknown, title: string) => {
        const codec = createCompositeCodec(state!.codecs, { title });
        state!.result = codec.decode(state!.dataset) as RenderableDocument;
      });

      Then(
        'additionalFiles contains keys {string} and {string}',
        (_ctx: unknown, keyA: string, keyB: string) => {
          const files = state!.result!.additionalFiles;
          expect(files).toBeDefined();
          expect(files![keyA]).toBeDefined();
          expect(files![keyB]).toBeDefined();
        }
      );
    });

    RuleScenario('Colliding keys use last-wins', ({ Given, And, When, Then }) => {
      Given(
        'a codec with additionalFile {string} titled {string}',
        (_ctx: unknown, key: string, title: string) => {
          const additionalFiles: Record<string, RenderableDocument> = {
            [key]: document(title, [paragraph(`Content of ${title}`)]),
          };
          state!.codecs.push(stubCodec(makeDoc([paragraph('main')], { additionalFiles })));
        }
      );

      And(
        'a codec with additionalFile {string} titled {string}',
        (_ctx: unknown, key: string, title: string) => {
          const additionalFiles: Record<string, RenderableDocument> = {
            [key]: document(title, [paragraph(`Content of ${title}`)]),
          };
          state!.codecs.push(stubCodec(makeDoc([paragraph('main')], { additionalFiles })));
        }
      );

      When('CompositeCodec assembles them with title {string}', (_ctx: unknown, title: string) => {
        const codec = createCompositeCodec(state!.codecs, { title });
        state!.result = codec.decode(state!.dataset) as RenderableDocument;
      });

      Then(
        'additionalFiles key {string} has title {string}',
        (_ctx: unknown, key: string, expectedTitle: string) => {
          const files = state!.result!.additionalFiles;
          expect(files).toBeDefined();
          expect(files![key].title).toBe(expectedTitle);
        }
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: composeDocuments works at document level without codecs
  // ──────────────────────────────────────────────────────────────────────

  Rule('composeDocuments works at document level without codecs', ({ RuleScenario }) => {
    RuleScenario('Direct document composition', ({ Given, And, When, Then }) => {
      Given('a RenderableDocument with paragraph {string}', (_ctx: unknown, text: string) => {
        state!.documents.push(document('Doc', [paragraph(text)]));
      });

      And('a RenderableDocument with paragraph {string}', (_ctx: unknown, text: string) => {
        state!.documents.push(document('Doc', [paragraph(text)]));
      });

      When(
        'composeDocuments assembles them with title {string}',
        (_ctx: unknown, title: string) => {
          state!.result = composeDocuments(state!.documents, { title });
        }
      );

      Then('the result has title {string}', (_ctx: unknown, expectedTitle: string) => {
        expect(state!.result!.title).toBe(expectedTitle);
      });

      And(
        'paragraph {string} appears before {string}',
        (_ctx: unknown, first: string, second: string) => {
          const paragraphs = findParagraphs(state!.result!);
          const texts = paragraphs.map((p) => p.text);
          const firstIdx = texts.indexOf(first);
          const secondIdx = texts.indexOf(second);
          expect(firstIdx).toBeGreaterThanOrEqual(0);
          expect(secondIdx).toBeGreaterThan(firstIdx);
        }
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Empty codec outputs are handled gracefully
  // ──────────────────────────────────────────────────────────────────────

  Rule('Empty codec outputs are handled gracefully', ({ RuleScenario }) => {
    RuleScenario('Empty codec skipped without separator', ({ Given, And, When, Then }) => {
      Given('a codec producing 0 sections', () => {
        state!.codecs.push(stubCodec(makeDoc([])));
      });

      And('a codec producing a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.codecs.push(stubCodec(makeDoc([paragraph(text)])));
      });

      When('CompositeCodec assembles them with title {string}', (_ctx: unknown, title: string) => {
        const codec = createCompositeCodec(state!.codecs, { title });
        state!.result = codec.decode(state!.dataset) as RenderableDocument;
      });

      Then('the output contains exactly 1 section', () => {
        expect(state!.result!.sections).toHaveLength(1);
      });

      And('no separator block exists in the output', () => {
        const separators = findBlocksByType(state!.result!, 'separator');
        expect(separators).toHaveLength(0);
      });
    });
  });
});
