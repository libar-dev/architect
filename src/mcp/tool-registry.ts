/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern MCPToolRegistry
 * @libar-docs-status active
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 * @libar-docs-uses ProcessStateAPI, MCPPipelineSession
 * @libar-docs-implements MCPServerIntegration
 *
 * ## MCP Tool Registry
 *
 * Defines all MCP tools with Zod input schemas and handler functions.
 * Each tool wraps a ProcessStateAPI method or CLI subcommand.
 * Tool names use "dp_" prefix to avoid collisions with other MCP servers.
 *
 * ### When to Use
 *
 * - When registering tools on the McpServer instance
 * - When adding a new tool to the MCP server
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PipelineSession, PipelineSessionManager } from './pipeline-session.js';
import {
  assembleContext,
  buildDepTree,
  buildFileReadingList,
  buildOverview,
  isValidSessionType,
  type SessionType,
} from '../api/context-assembler.js';
import {
  formatContextBundle,
  formatDepTree,
  formatFileReadingList,
  formatOverview,
} from '../api/context-formatter.js';
import {
  computeNeighborhood,
  aggregateTagUsage,
  buildSourceInventory,
} from '../api/arch-queries.js';
import { analyzeCoverage, findUnannotatedFiles } from '../api/coverage-analyzer.js';
import { validateScope, formatScopeValidation, type ScopeType } from '../api/scope-validator.js';
import {
  generateHandoff,
  formatHandoff,
  type HandoffSessionType,
} from '../api/handoff-generator.js';
import { queryBusinessRules } from '../api/rules-query.js';
import { findStubPatterns, resolveStubs, groupStubsByPattern } from '../api/stub-resolver.js';
import { fuzzyMatchPatterns } from '../api/fuzzy-match.js';
import { allPatternNames, getPatternName } from '../api/pattern-helpers.js';
import { summarizePatterns } from '../api/summarize.js';

// =============================================================================
// Types
// =============================================================================

type TextContent = { type: 'text'; text: string };
type ToolResult = { content: TextContent[]; isError?: boolean };

function textResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

function jsonResult(data: unknown): ToolResult {
  return textResult(JSON.stringify(data, null, 2));
}

function errorResult(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerAllTools(server: McpServer, sessionManager: PipelineSessionManager): void {
  const getSession = (): PipelineSession => sessionManager.getSession();

  // Wrap handlers so thrown exceptions become MCP error payloads
  // instead of propagating as transport-level errors.
  function safeHandler<T>(
    fn: (args: T) => ToolResult | Promise<ToolResult>
  ): (args: T) => ToolResult | Promise<ToolResult> {
    return (args: T): ToolResult | Promise<ToolResult> => {
      try {
        const result = fn(args);
        if (result instanceof Promise) {
          return result.catch(
            (error: unknown): ToolResult =>
              errorResult(error instanceof Error ? error.message : String(error))
          );
        }
        return result;
      } catch (error: unknown) {
        return errorResult(error instanceof Error ? error.message : String(error));
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Session-aware tools (text output — matches CLI text output)
  // ---------------------------------------------------------------------------

  server.registerTool(
    'dp_overview',
    {
      title: 'Project Overview',
      description:
        'Get project health summary: progress percentage, active phases, blocking chains, and data API commands. Start here to understand project state.',
      inputSchema: z.object({}),
    },
    safeHandler(() => {
      const s = getSession();
      const overview = buildOverview(s.dataset);
      return textResult(formatOverview(overview));
    })
  );

  server.registerTool(
    'dp_context',
    {
      title: 'Pattern Context',
      description:
        'Get curated context bundle for a pattern, tailored to a session type (planning/design/implement). Returns spec, dependencies, deliverables, and FSM state.',
      inputSchema: z.object({
        name: z.string().describe('Pattern name'),
        session: z
          .enum(['planning', 'design', 'implement'])
          .optional()
          .describe('Session type (planning, design, implement)'),
      }),
    },
    safeHandler(({ name, session }) => {
      const s = getSession();
      const validated = session ?? '';
      const sessionType: SessionType = isValidSessionType(validated) ? validated : 'implement';
      const bundle = assembleContext(s.dataset, s.api, {
        patterns: [name],
        sessionType,
        baseDir: s.baseDir,
      });
      return textResult(formatContextBundle(bundle));
    })
  );

  server.registerTool(
    'dp_files',
    {
      title: 'File Reading List',
      description:
        'Get ordered file list for a pattern with implementation paths and roles. Use before reading code.',
      inputSchema: z.object({
        name: z.string().describe('Pattern name'),
      }),
    },
    safeHandler(({ name }) => {
      const s = getSession();
      const fileList = buildFileReadingList(s.dataset, name, true);
      return textResult(formatFileReadingList(fileList));
    })
  );

  server.registerTool(
    'dp_dep_tree',
    {
      title: 'Dependency Tree',
      description:
        'Get dependency chain for a pattern showing status of each dependency. Useful for understanding what must be completed first.',
      inputSchema: z.object({
        name: z.string().describe('Pattern name'),
        maxDepth: z.number().optional().describe('Maximum depth (default: 10)'),
      }),
    },
    safeHandler(({ name, maxDepth }) => {
      const s = getSession();
      const tree = buildDepTree(s.dataset, {
        pattern: name,
        maxDepth: maxDepth ?? 10,
        includeImplementationDeps: false,
      });
      return textResult(formatDepTree(tree));
    })
  );

  server.registerTool(
    'dp_scope_validate',
    {
      title: 'Scope Validation',
      description:
        'Pre-flight check before starting work on a pattern. Validates FSM state, dependencies, deliverables, and design decisions.',
      inputSchema: z.object({
        name: z.string().describe('Pattern name'),
        session: z.enum(['implement', 'design']).describe('Session type (implement or design)'),
      }),
    },
    safeHandler(({ name, session }) => {
      const s = getSession();
      const result = validateScope(s.api, s.dataset, {
        patternName: name,
        scopeType: session as ScopeType,
        baseDir: s.baseDir,
      });
      return textResult(formatScopeValidation(result));
    })
  );

  server.registerTool(
    'dp_handoff',
    {
      title: 'Session Handoff',
      description:
        'Generate session-end state for continuity. Captures progress, remaining work, and next steps.',
      inputSchema: z.object({
        name: z.string().describe('Pattern name'),
        session: z
          .enum(['planning', 'design', 'implement', 'review'])
          .optional()
          .describe('Session type'),
      }),
    },
    safeHandler(({ name, session }) => {
      const s = getSession();
      const handoff = generateHandoff(s.api, s.dataset, {
        patternName: name,
        sessionType: (session ?? 'implement') as HandoffSessionType,
      });
      return textResult(formatHandoff(handoff));
    })
  );

  // ---------------------------------------------------------------------------
  // Data query tools (JSON output)
  // ---------------------------------------------------------------------------

  server.registerTool(
    'dp_status',
    {
      title: 'Status Counts',
      description:
        'Get pattern counts by status (completed, active, roadmap, deferred) and completion percentage.',
      inputSchema: z.object({}),
    },
    safeHandler(() => {
      const s = getSession();
      return jsonResult({
        counts: s.api.getStatusCounts(),
        distribution: s.api.getStatusDistribution(),
      });
    })
  );

  server.registerTool(
    'dp_pattern',
    {
      title: 'Pattern Detail',
      description:
        'Get full metadata for a single pattern: status, phase, deliverables, relationships, business rules, and extracted shapes.',
      inputSchema: z.object({
        name: z.string().describe('Pattern name (case-insensitive)'),
      }),
    },
    safeHandler(({ name }) => {
      const s = getSession();
      const pattern = s.api.getPattern(name);
      if (pattern === undefined) {
        return errorResult(`Pattern "${name}" not found.`);
      }
      const canonicalName = getPatternName(pattern);
      return jsonResult({
        ...pattern,
        deliverables: s.api.getPatternDeliverables(canonicalName),
        dependencies: s.api.getPatternDependencies(canonicalName) ?? null,
        relationships: s.api.getPatternRelationships(canonicalName) ?? null,
      });
    })
  );

  server.registerTool(
    'dp_list',
    {
      title: 'List Patterns',
      description:
        'List patterns with optional filters. Supports filtering by status, phase, and category. Use namesOnly for compact output.',
      inputSchema: z.object({
        status: z
          .enum(['completed', 'active', 'roadmap', 'deferred'])
          .optional()
          .describe('Filter by status (completed, active, roadmap, deferred)'),
        phase: z.number().optional().describe('Filter by phase number'),
        category: z.string().optional().describe('Filter by category'),
        namesOnly: z.boolean().optional().describe('Return only pattern names'),
        count: z.boolean().optional().describe('Return only the count'),
      }),
    },
    safeHandler(({ status, phase, category, namesOnly, count }) => {
      const s = getSession();
      let patterns = [...s.dataset.patterns];

      if (status !== undefined) {
        patterns = patterns.filter((p) => p.status === status);
      }
      if (phase !== undefined) {
        patterns = patterns.filter((p) => p.phase === phase);
      }
      if (category !== undefined) {
        patterns = patterns.filter((p) => p.category === category);
      }

      if (count === true) {
        return textResult(`${patterns.length} patterns`);
      }
      if (namesOnly === true) {
        return textResult(patterns.map((p) => p.name).join('\n'));
      }
      return jsonResult(summarizePatterns(patterns));
    })
  );

  server.registerTool(
    'dp_search',
    {
      title: 'Search Patterns',
      description:
        'Fuzzy search for patterns by name. Returns ranked matches with similarity scores.',
      inputSchema: z.object({
        query: z.string().describe('Search query string'),
      }),
    },
    safeHandler(({ query }) => {
      const s = getSession();
      const names = allPatternNames(s.dataset);
      const matches = fuzzyMatchPatterns(query, names);
      return jsonResult(matches);
    })
  );

  server.registerTool(
    'dp_rules',
    {
      title: 'Business Rules',
      description:
        'Query business rules and invariants extracted from Gherkin Rule: blocks. Filter by pattern name.',
      inputSchema: z.object({
        pattern: z.string().optional().describe('Filter rules by pattern name'),
        onlyInvariants: z
          .boolean()
          .optional()
          .describe('Return only invariants (skip rationale/scenarios)'),
      }),
    },
    safeHandler(({ pattern, onlyInvariants }) => {
      const s = getSession();
      const result = queryBusinessRules(s.dataset, {
        productArea: null,
        patternName: pattern ?? null,
        onlyInvariants: onlyInvariants ?? false,
      });

      // Without pattern filter, return compact summary to avoid 800K+ response
      if (pattern === undefined) {
        return jsonResult({
          totalRules: result.totalRules,
          totalInvariants: result.totalInvariants,
          allRuleNames: result.allRuleNames,
          productAreas: result.productAreas.map((pa) => ({
            productArea: pa.productArea,
            ruleCount: pa.ruleCount,
            invariantCount: pa.invariantCount,
          })),
          hint: 'Use the "pattern" parameter to get full rule details for a specific pattern.',
        });
      }
      return jsonResult(result);
    })
  );

  server.registerTool(
    'dp_tags',
    {
      title: 'Tag Usage Report',
      description: 'Get tag inventory: counts per tag and value across all annotated sources.',
      inputSchema: z.object({}),
    },
    safeHandler(() => {
      const s = getSession();
      return jsonResult(aggregateTagUsage(s.dataset));
    })
  );

  server.registerTool(
    'dp_sources',
    {
      title: 'Source Inventory',
      description:
        'Get file inventory by source type (TypeScript, Gherkin, stubs) with pattern counts.',
      inputSchema: z.object({}),
    },
    safeHandler(() => {
      const s = getSession();
      return jsonResult(buildSourceInventory(s.dataset));
    })
  );

  server.registerTool(
    'dp_stubs',
    {
      title: 'Design Stubs',
      description:
        'Get design stub files grouped by pattern. Shows which stubs have implementations and which are unresolved.',
      inputSchema: z.object({
        unresolved: z
          .boolean()
          .optional()
          .describe('Show only unresolved stubs (no implementation yet)'),
      }),
    },
    safeHandler(({ unresolved }) => {
      const s = getSession();
      const stubs = findStubPatterns(s.dataset);
      const resolutions = resolveStubs(stubs, s.baseDir);

      if (unresolved === true) {
        const unresolvedOnly = resolutions.filter((r) => !r.targetExists);
        return jsonResult({ unresolvedCount: unresolvedOnly.length, stubs: unresolvedOnly });
      }
      return jsonResult(groupStubsByPattern(resolutions));
    })
  );

  server.registerTool(
    'dp_decisions',
    {
      title: 'Design Decisions',
      description: 'Extract design decisions (AD-N / DD-N) from pattern descriptions.',
      inputSchema: z.object({
        name: z.string().optional().describe('Pattern name (shows all if omitted)'),
      }),
    },
    safeHandler(({ name }) => {
      const s = getSession();
      // Extract decisions from pattern descriptions (stub descriptions contain AD-N / DD-N entries)
      const stubs = findStubPatterns(s.dataset);
      const decisions: Array<{ pattern: string; id: string; description: string }> = [];

      for (const stub of stubs) {
        const desc = stub.directive.description;
        const regex = /((?:AD|DD)-\d+):\s*(.+?)(?:\n|$)/g;
        let match = regex.exec(desc);
        while (match !== null) {
          const id = match[1] ?? '';
          const matchedDesc = match[2]?.trim() ?? '';
          decisions.push({ pattern: stub.name, id, description: matchedDesc });
          match = regex.exec(desc);
        }
      }

      if (name !== undefined) {
        const filtered = decisions.filter((d) => d.pattern.toLowerCase() === name.toLowerCase());
        return jsonResult(filtered);
      }
      return jsonResult(decisions);
    })
  );

  // ---------------------------------------------------------------------------
  // Architecture tools
  // ---------------------------------------------------------------------------

  server.registerTool(
    'dp_arch_context',
    {
      title: 'Architecture Contexts',
      description:
        'Get bounded contexts with member patterns. Optionally filter to a specific context name.',
      inputSchema: z.object({
        name: z.string().optional().describe('Filter to a specific bounded context'),
      }),
    },
    safeHandler(({ name }) => {
      const s = getSession();
      if (s.dataset.archIndex === undefined) {
        return jsonResult([]);
      }
      const byContext = s.dataset.archIndex.byContext;
      if (name !== undefined) {
        const patterns = byContext[name] ?? [];
        return jsonResult(summarizePatterns(patterns));
      }
      const contexts = Object.entries(byContext).map(([context, patterns]) => ({
        context,
        count: patterns.length,
        patterns: patterns.map((p) => p.name),
      }));
      return jsonResult(contexts);
    })
  );

  server.registerTool(
    'dp_arch_layer',
    {
      title: 'Architecture Layers',
      description:
        'Get architecture layers with member patterns. Optionally filter to a specific layer.',
      inputSchema: z.object({
        name: z.string().optional().describe('Filter to a specific architecture layer'),
      }),
    },
    safeHandler(({ name }) => {
      const s = getSession();
      if (s.dataset.archIndex === undefined) {
        return jsonResult([]);
      }
      const byLayer = s.dataset.archIndex.byLayer;
      if (name !== undefined) {
        const patterns = byLayer[name] ?? [];
        return jsonResult(summarizePatterns(patterns));
      }
      const layers = Object.entries(byLayer).map(([layer, patterns]) => ({
        layer,
        count: patterns.length,
        patterns: patterns.map((p) => p.name),
      }));
      return jsonResult(layers);
    })
  );

  server.registerTool(
    'dp_arch_neighborhood',
    {
      title: 'Pattern Neighborhood',
      description:
        'Get everything a pattern touches: uses, used-by, same-context peers, and dependency status.',
      inputSchema: z.object({
        name: z.string().describe('Pattern name'),
      }),
    },
    safeHandler(({ name }) => {
      const s = getSession();
      return jsonResult(computeNeighborhood(name, s.dataset));
    })
  );

  server.registerTool(
    'dp_arch_blocking',
    {
      title: 'Blocked Patterns',
      description:
        'Find patterns blocked by incomplete dependencies. Shows which dependencies must be completed first.',
      inputSchema: z.object({}),
    },
    safeHandler(() => {
      const s = getSession();
      const overview = buildOverview(s.dataset);
      return jsonResult(overview.blocking);
    })
  );

  server.registerTool(
    'dp_arch_dangling',
    {
      title: 'Dangling References',
      description: 'Find broken references to nonexistent pattern names in relationship tags.',
      inputSchema: z.object({}),
    },
    safeHandler(() => {
      const s = getSession();
      const allNames = new Set(s.dataset.patterns.map((p) => p.name));
      const dangling: Array<{ pattern: string; tag: string; target: string }> = [];

      for (const p of s.dataset.patterns) {
        for (const dep of p.dependsOn ?? []) {
          if (!allNames.has(dep))
            dangling.push({ pattern: p.name, tag: 'depends-on', target: dep });
        }
        for (const u of p.uses ?? []) {
          if (!allNames.has(u)) dangling.push({ pattern: p.name, tag: 'uses', target: u });
        }
        for (const ub of p.usedBy ?? []) {
          if (!allNames.has(ub)) dangling.push({ pattern: p.name, tag: 'used-by', target: ub });
        }
      }

      return jsonResult(dangling);
    })
  );

  server.registerTool(
    'dp_arch_coverage',
    {
      title: 'Annotation Coverage',
      description:
        'Analyze annotation coverage across source files. Returns coverage percentage, annotated/total counts, and unused taxonomy values.',
      inputSchema: z.object({
        path: z.string().optional().describe('Filter to a specific directory path'),
      }),
    },
    safeHandler(async ({ path: pathFilter }) => {
      const s = getSession();
      const globs =
        pathFilter !== undefined
          ? (() => {
              // Preserve file extensions from configured globs instead of hardcoding *.ts
              const extensions = new Set<string>();
              for (const g of s.sourceGlobs.input) {
                const m = /\*\.(\w+)$/.exec(g);
                if (m?.[1] !== undefined) extensions.add(m[1]);
              }
              if (extensions.size === 0) extensions.add('ts');
              return [...extensions].map((ext) => `${pathFilter}/**/*.${ext}`);
            })()
          : [...s.sourceGlobs.input];
      const report = await analyzeCoverage(s.dataset, globs, s.baseDir, s.registry);
      return jsonResult(report);
    })
  );

  server.registerTool(
    'dp_unannotated',
    {
      title: 'Unannotated Files',
      description:
        'Find TypeScript files missing @libar-docs annotations. Optionally filter by directory.',
      inputSchema: z.object({
        path: z.string().optional().describe('Filter to a specific directory path'),
      }),
    },
    safeHandler(async ({ path: pathFilter }) => {
      const s = getSession();
      const unannotated = await findUnannotatedFiles(
        [...s.sourceGlobs.input],
        s.baseDir,
        s.registry,
        pathFilter
      );
      return jsonResult(unannotated);
    })
  );

  // ---------------------------------------------------------------------------
  // Server management tools
  // ---------------------------------------------------------------------------

  server.registerTool(
    'dp_rebuild',
    {
      title: 'Rebuild Dataset',
      description:
        'Force rebuild of the in-memory MasterDataset from current source files. Use after making changes to annotated sources.',
      inputSchema: z.object({}),
    },
    safeHandler(async () => {
      const newSession = await sessionManager.rebuild();
      return textResult(
        `Dataset rebuilt in ${newSession.buildTimeMs}ms. ${newSession.dataset.patterns.length} patterns loaded.`
      );
    })
  );

  server.registerTool(
    'dp_config',
    {
      title: 'Current Configuration',
      description:
        'Show current project configuration: source globs, base directory, and build time.',
      inputSchema: z.object({}),
    },
    safeHandler(() => {
      const s = getSession();
      return jsonResult({
        baseDir: s.baseDir,
        sourceGlobs: s.sourceGlobs,
        buildTimeMs: s.buildTimeMs,
        patternCount: s.dataset.patterns.length,
        phaseCount: s.dataset.phaseCount,
        categoryCount: s.dataset.categoryCount,
      });
    })
  );

  server.registerTool(
    'dp_help',
    {
      title: 'MCP Tools Help',
      description:
        'List all available MCP tools with descriptions. Use this to discover what queries are available.',
      inputSchema: z.object({}),
    },
    safeHandler(() => {
      const tools = [
        'dp_overview         - Project health summary (start here)',
        'dp_context           - Session-aware context bundle for a pattern',
        'dp_pattern           - Full pattern metadata',
        'dp_list              - List patterns with filters',
        'dp_search            - Fuzzy search patterns',
        'dp_status            - Status counts and completion %',
        'dp_files             - File reading list for a pattern',
        'dp_dep_tree          - Dependency chain with status',
        'dp_scope_validate    - Pre-flight check for implementation',
        'dp_handoff           - Session-end state for continuity',
        'dp_rules             - Business rules and invariants',
        'dp_tags              - Tag usage report',
        'dp_sources           - Source file inventory',
        'dp_stubs             - Design stubs with resolution status',
        'dp_decisions         - Design decisions from stubs',
        'dp_arch_context      - Bounded contexts with members',
        'dp_arch_layer        - Architecture layers with members',
        'dp_arch_neighborhood - Pattern uses/used-by/peers',
        'dp_arch_blocking     - Patterns blocked by dependencies',
        'dp_arch_dangling     - Broken pattern references',
        'dp_arch_coverage     - Annotation coverage analysis',
        'dp_unannotated       - Files missing @libar-docs',
        'dp_rebuild           - Force dataset rebuild',
        'dp_config            - Show current configuration',
        'dp_help              - This help text',
      ];
      return textResult(`delivery-process MCP Server — Available Tools\n\n${tools.join('\n')}`);
    })
  );
}
