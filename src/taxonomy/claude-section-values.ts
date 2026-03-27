/**
 * Claude section values for CLAUDE.md module generation.
 *
 * Each value maps to a subdirectory under `_claude-md/` where
 * generated modules are written.
 *
 * @architect
 * @see ClaudeModuleGeneration spec (Phase 25)
 */

export const CLAUDE_SECTION_VALUES = [
  'core',
  'process',
  'testing',
  'infrastructure',
  'workflow',
] as const;

export type ClaudeSectionValue = (typeof CLAUDE_SECTION_VALUES)[number];
