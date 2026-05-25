/**
 * @architect
 * @architect-pattern MCPToolRegistry
 * @architect-status completed
 * @architect-implements MCPToolRegistryIntegrationTests
 * @architect-uses MCPPipelineSession
 * @architect-role:service
 * @architect-bounded-context:api
 * @architect-product-area:DataAPI
 *
 * ## MCPToolRegistry — Projection-backed Tool Registration
 *
 * Maps the package-owned Architect projection surface onto explicit MCP tool names,
 * schemas, and output contracts so clients receive validated fragment output through
 * the projection renderer layer.
 *
 * **When to Use:** Use when exposing or changing the MCP tool contract for the
 * split Architect runtime.
 */

import {
  fuzzyMatchPatterns,
  inferHandoffSessionType,
  parseAtBoundary,
  type SessionType,
} from '@libar-dev/architect-core';
import {
  paragraph,
  projectAnnotationCoverage,
  projectArchitectureNeighborhood,
  projectOverviewDigest,
  projectPatternBundle,
  projectPatternDetail,
  projectStatusDistribution,
  renderCompactText,
  renderJson,
  table,
  type ContentRichness,
  type Fragment,
  type PatternSummary,
  type ProjectionBundle,
  type ProjectionContext,
} from '@libar-dev/architect-projection';
import {
  parseAndProjectConfig,
  parseAndProjectDocumentationBundle,
  projectBusinessRuleSet,
  projectDependencyTree,
  projectFileReadingList,
  projectHandoffRecord,
  projectOpenQuestionList,
  projectPatternCatalog,
  projectScopeReadinessReport,
  projectSessionContextBundle,
  projectTaxonomyDigest,
} from '@libar-dev/architect-projection/projections';
import type { z } from 'zod';
import type { PipelineSession, PipelineSessionManager } from './pipeline-session.js';
import {
  BundleOptionsShape,
  createStrictReadonlyObjectSchema,
  DocumentTypeShape,
  EmptyInputSchema,
  ListFilterShape,
  OptionalContentRichnessShape,
  OptionalDocumentationOptionsShape,
  OptionalDepthShape,
  OptionalHandoffSessionShape,
  OptionalModifiedFilesShape,
  OpenQuestionsFilterShape,
  OptionalRelatedShape,
  OptionalSessionShape,
  OptionalStrictShape,
  PatternNameSchema,
  RequiredScopeShape,
  RulesFilterShape,
  SearchQueryShape,
  TaxonomyOptionsShape,
} from './tool-input-schemas.js';
import {
  ARCHITECT_MCP_TOOLS,
  getToolDescription,
  REGISTERED_TOOL_NAMES,
  type RegisteredToolName,
} from './tool-metadata.js';

export { REGISTERED_TOOL_NAMES };
export type { RegisteredToolName };

interface TextContentResult {
  [key: string]: unknown;
  content: [{ type: 'text'; text: string }];
}

interface BlockingEntry {
  readonly pattern: string;
  readonly blockedBy: readonly string[];
}

interface SectionedDocument {
  readonly kind: 'SectionedDocument';
  readonly documentType: string;
  readonly title: string;
  readonly sections: readonly {
    readonly id: string;
    readonly title: string;
    readonly blocks: readonly object[];
  }[];
}

export interface ToolResult<TOut = unknown> {
  readonly text: string;
  readonly output: TOut;
}

interface ToolRegistrar {
  registerTool(
    name: string,
    options: { description: string; inputSchema: z.ZodType },
    handler: (rawInput: unknown) => Promise<TextContentResult>,
  ): void;
}

interface ToolHandler {
  readonly inputSchema: z.ZodType;
  readonly handle: (
    input: unknown,
    session: PipelineSession,
    sessionManager: PipelineSessionManager,
  ) => ToolResult | Promise<ToolResult>;
}

// Type-preserving builder: lets each TOOL_HANDLERS entry have typed input via
// z.infer<TSchema> while the map itself is Record<Name, ToolHandler> where
// handle takes `unknown` (the input is validated by inputSchema.parse before
// being passed in).
function defineToolHandler<TSchema extends z.ZodType>(spec: {
  readonly inputSchema: TSchema;
  readonly handle: (
    input: z.infer<TSchema>,
    session: PipelineSession,
    sessionManager: PipelineSessionManager,
  ) => ToolResult | Promise<ToolResult>;
}): ToolHandler {
  return {
    inputSchema: spec.inputSchema,
    handle: (input, session, sessionManager) =>
      spec.handle(input as z.infer<TSchema>, session, sessionManager),
  };
}

function formatTextResult(text: string): TextContentResult {
  return {
    content: [{ type: 'text', text }],
  };
}

function renderTextToolResult<TFragment extends Fragment>(
  output: ProjectionBundle<TFragment>,
  richness?: ContentRichness,
): ToolResult<ProjectionBundle<TFragment>> {
  return {
    text: renderCompactText(output, richness !== undefined ? { richness } : undefined),
    output,
  };
}

function renderJsonToolResult<TFragment extends Fragment>(
  output: ProjectionBundle<TFragment>,
): ToolResult<ProjectionBundle<TFragment>> {
  const rendered = renderJson(output, { pretty: true });
  if (typeof rendered !== 'string') {
    throw new Error('renderJson expected pretty output to return a string payload.');
  }
  return { text: rendered, output };
}

function renderPlainJsonToolResult<TOutput>(output: TOutput): ToolResult<TOutput> {
  return { text: JSON.stringify(output, null, 2), output };
}

function getProjectionContext(session: PipelineSession): ProjectionContext {
  return {
    graph: session.dataset,
    packageResolver: session.packageResolver,
    ...(session.projectMetadata !== undefined ? { projectMetadata: session.projectMetadata } : {}),
    ...(session.tagExampleOverrides !== undefined
      ? { tagExampleOverrides: session.tagExampleOverrides }
      : {}),
  };
}

function getSourceGlobGroups(session: PipelineSession): {
  readonly input: readonly string[];
  readonly features: readonly string[];
  readonly exclude?: readonly string[];
} {
  const exclude = session.sourceGlobs.exclude;
  if (exclude === undefined) {
    return {
      input: session.sourceGlobs.input,
      features: session.sourceGlobs.features,
    };
  }

  return {
    input: session.sourceGlobs.input,
    features: session.sourceGlobs.features,
    exclude,
  };
}

function getRequestedSessionType(value: SessionType | undefined): SessionType {
  return value ?? 'implement';
}

function describeTool(name: RegisteredToolName): string {
  return getToolDescription(name);
}

function resolveToolHandler(toolName: string): ToolHandler {
  if (!Object.hasOwn(TOOL_HANDLERS, toolName)) {
    throw new Error(`Unknown Architect MCP tool: ${toolName}`);
  }

  return TOOL_HANDLERS[toolName as RegisteredToolName];
}

function parseToolInput<TSchema extends z.ZodType>(
  toolName: RegisteredToolName,
  schema: TSchema,
  rawInput: unknown,
): z.infer<TSchema> {
  if (
    rawInput !== undefined &&
    rawInput !== null &&
    (typeof rawInput !== 'object' || Array.isArray(rawInput))
  ) {
    throw new Error(`Invalid input for ${toolName}: expected object`);
  }

  return parseAtBoundary(schema, rawInput ?? {}, `Invalid input for ${toolName}`);
}

function createSectionedDocument(
  documentType: string,
  title: string,
  sections: SectionedDocument['sections'],
): SectionedDocument {
  return {
    kind: 'SectionedDocument',
    documentType,
    title,
    sections,
  };
}

function buildSearchResultsDocument(
  query: string,
  matches: readonly ReturnType<typeof fuzzyMatchPatterns>[number][],
  summariesByPattern: ReadonlyMap<string, PatternSummary>,
): SectionedDocument {
  const sections: SectionedDocument['sections'] = [
    {
      id: 'overview',
      title: 'Overview',
      blocks: [
        paragraph(
          matches.length === 0
            ? `No pattern matches were found for query "${query}".`
            : `${String(matches.length)} ${matches.length === 1 ? 'match' : 'matches'} found for query "${query}".`,
        ),
      ],
    },
    {
      id: 'results',
      title: 'Results',
      blocks:
        matches.length === 0
          ? [paragraph('Try a broader query or use architect_list to inspect the full catalog.')]
          : [
              table(
                ['Pattern', 'Score', 'Match Type', 'Status', 'Role', 'File'],
                matches.map((match) => {
                  const summary = summariesByPattern.get(match.patternName);
                  return [
                    match.patternName,
                    match.score.toFixed(2),
                    match.matchType,
                    summary?.status ?? '',
                    summary?.role ?? '',
                    summary?.file ?? '',
                  ];
                }),
                ['left', 'right', 'left', 'left', 'left', 'left'],
              ),
            ],
    },
  ];

  return createSectionedDocument('search-results', 'Search Results', sections);
}

function buildBlockingDocument(blocking: readonly BlockingEntry[]): SectionedDocument {
  return createSectionedDocument('blocking-patterns', 'Blocking Patterns', [
    {
      id: 'overview',
      title: 'Overview',
      blocks: [
        paragraph(
          blocking.length === 0
            ? 'No patterns are currently blocked by incomplete dependencies.'
            : `${String(blocking.length)} ${blocking.length === 1 ? 'pattern is' : 'patterns are'} currently blocked by incomplete dependencies.`,
        ),
      ],
    },
    {
      id: 'blocking',
      title: 'Blocking',
      blocks:
        blocking.length === 0
          ? [paragraph('All tracked patterns are currently unblocked.')]
          : [
              table(
                ['Pattern', 'Blocked By'],
                blocking.map((entry) => [entry.pattern, entry.blockedBy.join(', ')]),
                ['left', 'left'],
              ),
            ],
    },
  ]);
}

function buildHelpDocument(): SectionedDocument {
  return createSectionedDocument('mcp-help', 'Architect MCP Tool Surface', [
    {
      id: 'overview',
      title: 'Overview',
      blocks: [
        paragraph(
          `Registered tools: ${String(ARCHITECT_MCP_TOOLS.length)}. Start with architect_overview, then architect_scope_validate and architect_context; use bounded-context vocabulary for architecture grouping.`,
        ),
      ],
    },
    {
      id: 'tools',
      title: 'Tools',
      blocks: [
        table(
          ['Tool', 'Description'],
          ARCHITECT_MCP_TOOLS.map((tool) => [tool.name, tool.description]),
          ['left', 'left'],
        ),
      ],
    },
  ]);
}

/**
 * Single source of truth for the Architect MCP tool handlers. `registerAllTools`
 * wraps each `handle` result into an MCP `TextContentResult` using `result.text`;
 * the public `invokeTool` returns the whole `ToolResult<TOut>` so programmatic
 * consumers (e.g. the desktop main process) can work with the typed projection
 * output without re-parsing text.
 */
const TOOL_HANDLERS: Record<RegisteredToolName, ToolHandler> = {
  architect_overview: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ ...OptionalContentRichnessShape }),
    handle: ({ disclosure }, session) =>
      renderTextToolResult(
        projectOverviewDigest(getProjectionContext(session)),
        disclosure ?? 'summary',
      ),
  }),

  architect_coverage: defineToolHandler({
    inputSchema: EmptyInputSchema,
    handle: (_input, session) =>
      renderJsonToolResult(projectAnnotationCoverage(getProjectionContext(session))),
  }),

  architect_context: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({
      name: PatternNameSchema,
      ...OptionalSessionShape,
    }),
    handle: ({ name, session: requestedSession }, session) =>
      renderTextToolResult(
        projectSessionContextBundle(getProjectionContext(session), {
          patterns: [name],
          sessionType: getRequestedSessionType(requestedSession),
        }),
      ),
  }),

  architect_files: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({
      name: PatternNameSchema,
      ...OptionalRelatedShape,
    }),
    handle: ({ name, related }, session) => {
      const projected = projectFileReadingList(getProjectionContext(session), {
        pattern: name,
        includeRelated: related !== false,
      });
      if (projected === undefined) {
        throw new Error(`Pattern not found: ${name}`);
      }
      return renderTextToolResult(projected);
    },
  }),

  architect_dep_tree: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({
      name: PatternNameSchema,
      ...OptionalDepthShape,
    }),
    handle: ({ name, maxDepth }, session) =>
      renderTextToolResult(
        projectDependencyTree(getProjectionContext(session), {
          pattern: name,
          maxDepth: maxDepth ?? 10,
          includeImplementationDeps: false,
        }),
      ),
  }),

  architect_scope_validate: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({
      name: PatternNameSchema,
      ...RequiredScopeShape,
      ...OptionalStrictShape,
    }),
    handle: ({ name, session: requestedSession, strict }, session) =>
      renderTextToolResult(
        projectScopeReadinessReport(getProjectionContext(session), {
          pattern: name,
          sessionType: requestedSession,
          strict: strict === true,
        }),
      ),
  }),

  architect_handoff: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({
      name: PatternNameSchema,
      ...OptionalHandoffSessionShape,
      ...OptionalModifiedFilesShape,
    }),
    handle: ({ name, session: requestedSession, modifiedFiles }, session) => {
      const pattern = session.api.getPattern(name);
      const sessionType = requestedSession ?? inferHandoffSessionType(pattern?.status);
      return renderTextToolResult(
        projectHandoffRecord(getProjectionContext(session), {
          pattern: name,
          sessionType,
          ...(modifiedFiles !== undefined ? { filesModified: modifiedFiles } : {}),
        }),
      );
    },
  }),

  architect_status: defineToolHandler({
    inputSchema: EmptyInputSchema,
    handle: (_input, session) =>
      renderJsonToolResult(projectStatusDistribution(getProjectionContext(session))),
  }),

  architect_pattern: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ name: PatternNameSchema }),
    handle: ({ name }, session) =>
      renderJsonToolResult(projectPatternDetail(getProjectionContext(session), name)),
  }),

  architect_bundle: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({
      name: PatternNameSchema,
      ...BundleOptionsShape,
    }),
    handle: ({ name, mode, include, estimateTokens }, session) =>
      renderJsonToolResult(
        projectPatternBundle(getProjectionContext(session), {
          pattern: name,
          ...(mode !== undefined ? { mode } : {}),
          ...(include !== undefined ? { include } : {}),
          estimateTokens: estimateTokens === true,
        }),
      ),
  }),

  architect_list: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ ...ListFilterShape }),
    handle: ({ status, role, namesOnly, count }, session) =>
      renderJsonToolResult(
        projectPatternCatalog(getProjectionContext(session), {
          ...(status !== undefined ? { status } : {}),
          ...(role !== undefined ? { role } : {}),
          namesOnly: namesOnly === true,
          count: count === true,
        }),
      ),
  }),

  architect_open_questions: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ ...OpenQuestionsFilterShape }),
    handle: ({ parent }, session) =>
      renderJsonToolResult(
        projectOpenQuestionList(getProjectionContext(session), {
          ...(parent !== undefined ? { parent } : {}),
        }),
      ),
  }),

  architect_search: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ ...SearchQueryShape }),
    handle: ({ query }, session) => {
      const catalog = projectPatternCatalog(getProjectionContext(session)).root;
      const summariesByPattern = new Map(
        catalog.items.map((summary) => [summary.patternName, summary]),
      );
      const matches = fuzzyMatchPatterns(query, catalog.names);
      return renderPlainJsonToolResult(
        buildSearchResultsDocument(query, matches, summariesByPattern),
      );
    },
  }),

  architect_rules: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ ...RulesFilterShape }),
    handle: ({ pattern, productArea, onlyInvariants }, session) => {
      if (pattern !== undefined && productArea !== undefined) {
        throw new Error('pattern and productArea cannot be used together');
      }

      return renderJsonToolResult(
        projectBusinessRuleSet(
          getProjectionContext(session),
          pattern !== undefined
            ? {
                scope: 'feature',
                scopeValue: pattern,
                onlyInvariants: onlyInvariants ?? false,
              }
            : productArea !== undefined
              ? {
                  scope: 'product-area',
                  scopeValue: productArea,
                  onlyInvariants: onlyInvariants ?? false,
                }
              : {
                  scope: 'all',
                  groupedBy: 'feature',
                  onlyInvariants: onlyInvariants ?? false,
                },
        ),
      );
    },
  }),

  architect_taxonomy: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ ...TaxonomyOptionsShape }),
    handle: ({ exampleOverrides }, session) =>
      renderJsonToolResult(
        projectTaxonomyDigest(getProjectionContext(session), {
          ...(exampleOverrides !== undefined ? { exampleOverrides } : {}),
        }),
      ),
  }),

  architect_arch_neighborhood: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ name: PatternNameSchema }),
    handle: ({ name }, session) =>
      renderJsonToolResult(projectArchitectureNeighborhood(getProjectionContext(session), name)),
  }),

  architect_arch_blocking: defineToolHandler({
    inputSchema: EmptyInputSchema,
    handle: (_input, session) => {
      const overview = projectOverviewDigest(getProjectionContext(session));
      return renderPlainJsonToolResult(buildBlockingDocument(overview.root.blocking));
    },
  }),

  architect_rebuild: defineToolHandler({
    inputSchema: EmptyInputSchema,
    handle: async (_input, _session, sessionManager) => {
      const nextSession = await sessionManager.rebuild();
      return renderTextToolResult(
        parseAndProjectConfig(getProjectionContext(nextSession), {
          baseDir: nextSession.baseDir,
          configPath: nextSession.configPath,
          buildTimeMs: nextSession.buildTimeMs,
          sourceGlobs: getSourceGlobGroups(nextSession),
          ...(nextSession.projectMetadata?.name !== undefined
            ? { projectName: nextSession.projectMetadata.name }
            : {}),
        }),
      );
    },
  }),

  architect_config: defineToolHandler({
    inputSchema: EmptyInputSchema,
    handle: (_input, session) =>
      renderJsonToolResult(
        parseAndProjectConfig(getProjectionContext(session), {
          baseDir: session.baseDir,
          configPath: session.configPath,
          buildTimeMs: session.buildTimeMs,
          sourceGlobs: getSourceGlobGroups(session),
          ...(session.projectMetadata?.name !== undefined
            ? { projectName: session.projectMetadata.name }
            : {}),
        }),
      ),
  }),

  architect_documentation: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({
      ...DocumentTypeShape,
      ...OptionalDocumentationOptionsShape,
    }),
    handle: ({ documentType, disclosure, filter }, session) => {
      const context = getProjectionContext(session);
      return renderJsonToolResult(
        parseAndProjectDocumentationBundle(
          filter === undefined ? context : { ...context, projectionFilter: filter },
          {
            documentType,
            ...(disclosure !== undefined ? { disclosureLevel: disclosure } : {}),
          },
        ),
      );
    },
  }),

  architect_help: defineToolHandler({
    inputSchema: EmptyInputSchema,
    handle: () => renderPlainJsonToolResult(buildHelpDocument()),
  }),
};

export async function invokeTool<TOut = unknown>(
  sessionManager: PipelineSessionManager,
  toolName: RegisteredToolName,
  args: unknown,
): Promise<ToolResult<TOut>> {
  const entry = resolveToolHandler(toolName);
  const input = parseToolInput(toolName, entry.inputSchema, args);
  const session = sessionManager.getSession();
  const result = await entry.handle(input, session, sessionManager);
  return result as ToolResult<TOut>;
}

export function registerAllTools(
  server: ToolRegistrar,
  sessionManager: PipelineSessionManager,
): void {
  for (const name of REGISTERED_TOOL_NAMES) {
    const toolHandler = resolveToolHandler(name);
    server.registerTool(
      name,
      {
        description: describeTool(name),
        inputSchema: toolHandler.inputSchema,
      },
      async (rawInput: unknown): Promise<TextContentResult> => {
        const input = parseToolInput(name, toolHandler.inputSchema, rawInput);
        const session = sessionManager.getSession();
        const result = await toolHandler.handle(input, session, sessionManager);
        return formatTextResult(result.text);
      },
    );
  }
}
