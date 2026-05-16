import { buildRegistry } from '../../../src/taxonomy/index.js';
import { extractShapes } from '../../../src/extractor/shape-extractor.js';
import type { ShapeExtractionResult } from '../../../src/validation-schemas/extracted-shape.js';
import type { Result } from '../../../src/types/result.js';

export { extractShapes, buildRegistry };
export type { ShapeExtractionResult, Result };

export interface ShapeExtractionTestState {
  sourceCode: string;
  shapeNames: string[];
  extractionResult: ShapeExtractionResult | null;
  extractionRawResult: Result<ShapeExtractionResult> | null;
  renderedMarkdown: string | null;
  tagRegistry: ReturnType<typeof buildRegistry> | null;
}

export function resetState(): ShapeExtractionTestState {
  return {
    sourceCode: '',
    shapeNames: [],
    extractionResult: null,
    extractionRawResult: null,
    renderedMarkdown: null,
    tagRegistry: null,
  };
}

export function unwrapExtraction(sourceCode: string, shapeNames: string[]): ShapeExtractionResult {
  const result = extractShapes(sourceCode, shapeNames);
  if (!result.ok) {
    throw new Error(`Shape extraction failed: ${result.error.message}`);
  }
  return result.value;
}
