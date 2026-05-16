export const ARCHITECT_MCP_TOOLS = [
  {
    name: 'architect_overview',
    description: 'Project health summary with active delivery status and blockers.',
  },
  {
    name: 'architect_coverage',
    description: 'Annotation coverage summary for the current project sources.',
  },
  { name: 'architect_context', description: 'Session-aware context bundle for a pattern.' },
  { name: 'architect_files', description: 'Ordered file reading list for a pattern.' },
  {
    name: 'architect_dep_tree',
    description: 'Dependency tree with status and relationship context.',
  },
  {
    name: 'architect_scope_validate',
    description: 'Pre-flight design or implementation readiness check.',
  },
  { name: 'architect_handoff', description: 'Session-end handoff summary for continuity.' },
  {
    name: 'architect_status',
    description: 'Status counts, completion percentage, and distribution.',
  },
  {
    name: 'architect_pattern',
    description: 'Full pattern metadata including deliverables and relationships.',
  },
  {
    name: 'architect_bundle',
    description:
      'Composite root-plus-immediate-member bundle for a pattern, with include blocks and heuristic token estimates.',
  },
  {
    name: 'architect_list',
    description: 'Filtered pattern listing for status and current role names.',
  },
  {
    name: 'architect_open_questions',
    description: 'Patterns with extracted Open Questions prose, optionally filtered by parent.',
  },
  { name: 'architect_search', description: 'Fuzzy pattern-name search.' },
  { name: 'architect_rules', description: 'Business rules summary or full rules for one pattern.' },
  {
    name: 'architect_taxonomy',
    description:
      'Taxonomy digest — current roles, bounded-context metadata tags by domain bucket, format types, and per-tag required/repeatable/enum metadata.',
  },
  {
    name: 'architect_arch_neighborhood',
    description: 'Uses, dependency, implementation, and peer neighborhood for a pattern.',
  },
  {
    name: 'architect_arch_blocking',
    description: 'Patterns currently blocked by incomplete dependencies.',
  },
  { name: 'architect_rebuild', description: 'Force a fresh in-process PatternGraph rebuild.' },
  {
    name: 'architect_config',
    description: 'Current base directory, config path, source globs, and dataset stats.',
  },
  {
    name: 'architect_documentation',
    description:
      'Projection-backed documentation bundle for a supported document type, with optional disclosure and filter parameters.',
  },
  {
    name: 'architect_help',
    description: 'Lists the currently registered split-package tool surface.',
  },
] as const;

export type RegisteredToolName = (typeof ARCHITECT_MCP_TOOLS)[number]['name'];

const TOOL_METADATA_BY_NAME: Record<RegisteredToolName, (typeof ARCHITECT_MCP_TOOLS)[number]> =
  Object.fromEntries(ARCHITECT_MCP_TOOLS.map((tool) => [tool.name, tool])) as Record<
    RegisteredToolName,
    (typeof ARCHITECT_MCP_TOOLS)[number]
  >;

export const REGISTERED_TOOL_NAMES: readonly RegisteredToolName[] = ARCHITECT_MCP_TOOLS.map(
  (tool) => tool.name
);

export const MCP_SERVER_INSTRUCTIONS =
  'Use architect_overview first. Then use architect_scope_validate and architect_context for focused delivery work.';

export function getToolDescription(name: RegisteredToolName): string {
  return TOOL_METADATA_BY_NAME[name].description;
}

export function buildToolHelpText(): string {
  const lines = ARCHITECT_MCP_TOOLS.map((tool) => `- ${tool.name}: ${tool.description}`);
  return [
    'architect-mcp split runtime',
    '',
    `Registered tools (${String(ARCHITECT_MCP_TOOLS.length)}):`,
    ...lines,
    '',
    'Start with architect_overview, then architect_scope_validate and architect_context.',
    'This split runtime intentionally exposes the current bounded-context workflow surface, not the historical full 25-tool monolith.',
    '',
  ].join('\n');
}
