/**
 * Shared state and helpers for render test splits.
 *
 * Extracted from the original render.steps.ts to be shared between
 * render-blocks.steps.ts and render-output.steps.ts.
 */
import {
  renderToMarkdown,
  renderToClaudeContext,
  renderDocumentWithFiles,
  type OutputFile,
} from '../../../src/renderable/render.js';
import {
  type RenderableDocument,
  type SectionBlock,
  type ListItem,
  heading,
  paragraph,
  separator,
  table,
  list,
  code,
  mermaid,
  collapsible,
  linkOut,
  document,
} from '../../../src/renderable/schema.js';
import type { DataTableRow } from '../world.js';

// Re-export for step files
export {
  renderToMarkdown,
  renderToClaudeContext,
  renderDocumentWithFiles,
  heading,
  paragraph,
  separator,
  table,
  list,
  code,
  mermaid,
  collapsible,
  linkOut,
  document,
};
export type { OutputFile, RenderableDocument, SectionBlock, ListItem, DataTableRow };

// =============================================================================
// State
// =============================================================================

export interface RenderScenarioState {
  // Document building
  doc: RenderableDocument | null;
  sections: SectionBlock[];

  // Results
  markdown: string;
  claudeContext: string;
  outputFiles: OutputFile[];

  // Collapsible builder state
  collapsibleSummary: string;
  collapsibleContent: SectionBlock[];
}

export function initState(): RenderScenarioState {
  return {
    doc: null,
    sections: [],
    markdown: '',
    claudeContext: '',
    outputFiles: [],
    collapsibleSummary: '',
    collapsibleContent: [],
  };
}
