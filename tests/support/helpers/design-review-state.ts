/**
 * Shared state and helpers for design review generation tests.
 *
 * Provides test state management and fixture builders for testing
 * the SequenceIndex builder and DesignReviewCodec pipeline.
 *
 * @libar-docs
 */

import type { BusinessRule } from '../../../src/validation-schemas/extracted-pattern.js';
import type {
  SequenceIndexEntry,
  MasterDataset,
} from '../../../src/validation-schemas/master-dataset.js';
import type { RenderableDocument } from '../../../src/renderable/schema.js';
import { buildSequenceIndexEntry } from '../../../src/generators/pipeline/sequence-utils.js';
import { createDesignReviewCodec } from '../../../src/renderable/codecs/design-review.js';
import { renderToMarkdown } from '../../../src/renderable/render.js';
import { createTestMasterDataset, createTestPattern } from '../../fixtures/dataset-factories.js';

// =============================================================================
// State Types
// =============================================================================

export interface DesignReviewState {
  /** Orchestrator name for buildSequenceIndexEntry */
  orchestrator: string;

  /** Business rules to pass to buildSequenceIndexEntry */
  rules: BusinessRule[];

  /** Result of buildSequenceIndexEntry */
  entry: SequenceIndexEntry | undefined;

  /** MasterDataset for codec tests */
  dataset: MasterDataset | null;

  /** Pattern name for codec lookup */
  patternName: string;

  /** RenderableDocument output from codec */
  doc: RenderableDocument | null;

  /** Rendered markdown string */
  markdown: string;
}

// =============================================================================
// State Management
// =============================================================================

export function initState(): DesignReviewState {
  return {
    orchestrator: '',
    rules: [],
    entry: undefined,
    dataset: null,
    patternName: '',
    doc: null,
    markdown: '',
  };
}

export function requireState(state: DesignReviewState | null): DesignReviewState {
  if (!state) throw new Error('Design review state not initialized');
  return state;
}

// =============================================================================
// Fixture Builders
// =============================================================================

/**
 * Create a business rule with sequence tags and optional annotations.
 */
export function createSequenceRule(options: {
  name: string;
  step: number;
  modules: string[];
  input?: string;
  output?: string;
  invariant?: string;
  errorScenarios?: string[];
}): BusinessRule {
  const descriptionParts: string[] = [];
  if (options.invariant) {
    descriptionParts.push(`**Invariant:** ${options.invariant}`);
  }
  if (options.input) {
    descriptionParts.push(`**Input:** ${options.input}`);
  }
  if (options.output) {
    descriptionParts.push(`**Output:** ${options.output}`);
  }

  const tags = [
    `sequence-step:${String(options.step)}`,
    `sequence-module:${options.modules.join(',')}`,
  ];

  return {
    name: options.name,
    description: descriptionParts.join('\n\n'),
    scenarioCount: 1 + (options.errorScenarios?.length ?? 0),
    scenarioNames: [`Happy path for ${options.name}`, ...(options.errorScenarios ?? [])],
    tags,
    errorScenarioNames: options.errorScenarios ?? [],
  };
}

/**
 * Create a business rule with no sequence tags.
 */
export function createPlainRule(name: string): BusinessRule {
  return {
    name,
    description: `Description for ${name}`,
    scenarioCount: 1,
    scenarioNames: [`Test for ${name}`],
    tags: [],
  };
}

/**
 * Build the sequence index entry from current state.
 */
export function buildEntry(state: DesignReviewState): void {
  state.entry = buildSequenceIndexEntry(state.orchestrator, state.rules);
}

/**
 * Build a MasterDataset with a single pattern that has sequence data,
 * and generate the design review document from it.
 */
export function generateDesignReview(state: DesignReviewState): void {
  // First build the entry if not already done
  if (state.entry === undefined && state.rules.length > 0) {
    buildEntry(state);
  }

  // Create a pattern with sequence orchestrator and rules
  const pattern = createTestPattern({
    name: state.patternName || 'TestPattern',
    status: 'active',
    filePath: 'delivery-process/specs/test-pattern.feature',
    rules: state.rules,
    sequenceOrchestrator: state.orchestrator,
  });

  // Build the dataset with this pattern
  const dataset = createTestMasterDataset({ patterns: [pattern] });

  // The transform pipeline should have built the sequenceIndex
  state.dataset = dataset;

  // Create and run the codec
  const codec = createDesignReviewCodec({ patternName: state.patternName || 'TestPattern' });
  state.doc = codec.decode(dataset);
  state.markdown = renderToMarkdown(state.doc);
}

// =============================================================================
// Re-exports
// =============================================================================

export { buildSequenceIndexEntry } from '../../../src/generators/pipeline/sequence-utils.js';
export { createDesignReviewCodec } from '../../../src/renderable/codecs/design-review.js';
export { renderToMarkdown } from '../../../src/renderable/render.js';
