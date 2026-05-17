/**
 * Prototype: documentation projection over the Architect CLI surface.
 *
 * Validates the documentation-projection design (architect/specs/documentation-projection/)
 * by composing a CliCatalog read model from multiple source aggregates and materializing
 * it into two audience-shaped markdown outputs from one source — without touching the
 * production projection substrate.
 *
 * Run:
 *   pnpm tsx scripts/proto/cli-catalog.ts
 *
 * Outputs:
 *   .agents/skills/architect-cli-overview/SKILL.md            (compact agent shape)
 *   .pr-coordination/proto-output/cli-docs/INDEX.md           (full human-reader shape)
 *   .pr-coordination/proto-output/FINDINGS.md                 (lessons; written by hand after inspection)
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  COMMANDS,
  COMMAND_NAMES,
  type CommandDef,
  type CommandName,
} from '../../packages/architect-cli/src/cli/pattern-graph-cli-commands.js';

// ──────────────────────────────────────────────────────────────────────────────
// Source aggregate 1 — schema-derived (from COMMANDS object)
// ──────────────────────────────────────────────────────────────────────────────

interface SchemaVerb {
  readonly name: CommandName;
  readonly helpSignature: string;
  readonly body: readonly string[];
  readonly examples: readonly string[];
  readonly requiresCliContext: boolean;
}

function readSchemaVerbs(): SchemaVerb[] {
  return COMMAND_NAMES.map((name): SchemaVerb => {
    const def: CommandDef = COMMANDS[name];
    return {
      name,
      helpSignature: def.helpSignature,
      body: def.helpDetail?.body ?? [],
      examples: def.helpDetail?.examples ?? [],
      requiresCliContext: def.requiresCliContext ?? false,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Source aggregate 2 — editorial framing (hand-coded; lifted from architect-data-api/SKILL.md)
//
// In the production projection, this lives either as:
//   - `_shared/*.md` doctrine loaded as preamble fragments, or
//   - JSDoc on each command module, or
//   - a config file describing intent bundles
// The prototype hand-codes it to surface the gap. See FINDINGS.md.
// ──────────────────────────────────────────────────────────────────────────────

interface IntentBundle {
  readonly intent: string;
  readonly summary: string;
  readonly verbs: readonly { name: CommandName; flags?: string; note?: string }[];
}

const intentBundles: IntentBundle[] = [
  {
    intent: 'planning',
    summary: 'Capture a new idea, refine a candidate, decide what to build next.',
    verbs: [
      { name: 'overview' },
      { name: 'list', flags: '--status candidate --names-only' },
      { name: 'open-questions', flags: '[--parent <Epic>]', note: 'candidate readiness signal' },
      { name: 'context', flags: '<Pattern> --session planning' },
    ],
  },
  {
    intent: 'design',
    summary: 'Promote a candidate to design tier — deliverables, stubs, ADRs, scenarios.',
    verbs: [
      { name: 'overview' },
      { name: 'scope-validate', flags: '<Pattern> design', note: 'deterministic gate' },
      { name: 'bundle', flags: '<Pattern> --mode design --format json' },
      { name: 'dep-tree', flags: '<Pattern>' },
      { name: 'rules', flags: '--pattern <Pattern>' },
    ],
  },
  {
    intent: 'implement',
    summary: 'Build a design-tier spec end-to-end; transfer value to code + executable specs.',
    verbs: [
      { name: 'overview' },
      { name: 'scope-validate', flags: '<Pattern> implement', note: 'must be PASS' },
      { name: 'bundle', flags: '<Pattern> --mode implement --format json' },
      { name: 'files', flags: '<Pattern>' },
      { name: 'rules', flags: '--pattern <Pattern> --only-invariants' },
      {
        name: 'query',
        flags: 'isValidTransition <from> active',
        note: 'FSM gate before status flip',
      },
    ],
  },
  {
    intent: 'review',
    summary: 'Read a design-tier spec for implementation readiness, find gaps.',
    verbs: [
      { name: 'overview' },
      { name: 'scope-validate', flags: '<Pattern> implement', note: 'PASS / WARN / BLOCKED is the gate' },
      { name: 'bundle', flags: '<Pattern> --mode review --format json' },
      { name: 'dep-tree', flags: '<Pattern>' },
      { name: 'arch', flags: 'blocking', note: 'global blocker view' },
      { name: 'files', flags: '<Pattern> --related' },
    ],
  },
  {
    intent: 'refactor',
    summary: 'Modify shipped code that has no design spec (refactoring carve-out).',
    verbs: [
      { name: 'overview' },
      { name: 'context', flags: '<Pattern> --session implement', note: 'current surface' },
      { name: 'files', flags: '<Pattern>' },
      { name: 'dep-tree', flags: '<Pattern>', note: 'blast radius' },
      { name: 'arch', flags: 'blocking' },
      {
        name: 'arch',
        flags: 'dangling --baseline <path> --strict',
        note: 'graph-integrity gate',
      },
    ],
  },
  {
    intent: 'handoff',
    summary: 'Wrap a session; capture state, list blockers, prepare continuation.',
    verbs: [
      { name: 'overview' },
      { name: 'context', flags: '<Pattern> --session <intent>' },
      { name: 'arch', flags: 'blocking' },
      { name: 'open-questions', flags: '[--parent <X>]', note: 'forward-looking signal' },
      {
        name: 'handoff',
        flags: '--pattern <Pattern> --session <intent> [--modified-file <p>]...',
      },
    ],
  },
];

interface ParityRow {
  readonly cli: string;
  readonly mcp: string;
}

const parityTable: ParityRow[] = [
  { cli: 'overview', mcp: 'architect_overview' },
  { cli: 'status', mcp: 'architect_status' },
  { cli: 'context', mcp: 'architect_context' },
  { cli: 'dep-tree', mcp: 'architect_dep_tree' },
  { cli: 'files', mcp: 'architect_files' },
  { cli: 'scope-validate', mcp: 'architect_scope_validate' },
  { cli: 'handoff', mcp: 'architect_handoff' },
  { cli: 'pattern', mcp: 'architect_pattern' },
  { cli: 'bundle', mcp: 'architect_bundle' },
  { cli: 'list', mcp: 'architect_list' },
  { cli: 'open-questions', mcp: 'architect_open_questions' },
  { cli: 'search', mcp: 'architect_search' },
  { cli: 'rules', mcp: 'architect_rules' },
  { cli: 'taxonomy', mcp: 'architect_taxonomy' },
  { cli: 'arch neighborhood', mcp: 'architect_arch_neighborhood' },
  { cli: 'arch blocking', mcp: 'architect_arch_blocking' },
  { cli: 'arch coverage', mcp: 'architect_coverage' },
  { cli: 'documentation', mcp: 'architect_documentation' },
  { cli: '(CLI-only)', mcp: 'architect_rebuild' },
  { cli: '(CLI-only)', mcp: 'architect_config' },
  { cli: '(CLI-only)', mcp: 'architect_help' },
];

interface DeterministicGate {
  readonly verb: string;
  readonly purpose: string;
  readonly verdictShape: string;
}

const deterministicGates: DeterministicGate[] = [
  {
    verb: 'scope-validate <Pattern> <design|implement>',
    purpose: 'Pre-flight check before starting design or implement work. Only design/implement accepted.',
    verdictShape: 'Per-criterion [PASS] / [WARN] / [BLOCKED]; final verdict READY / READY (with warnings) / BLOCKED.',
  },
  {
    verb: 'query isValidTransition <from> <to>',
    purpose: 'FSM gate before flipping @architect-status.',
    verdictShape: 'JSON { success: true, data: boolean }.',
  },
  {
    verb: 'arch dangling --baseline <path> --strict',
    purpose: 'Graph-integrity check against committed baseline.',
    verdictShape: 'Exits non-zero on any drift; without --strict prints current drift as JSON.',
  },
];

interface KnownQuirk {
  readonly title: string;
  readonly body: string;
}

const knownQuirks: KnownQuirk[] = [
  {
    title: 'MCP names use underscores end-to-end',
    body: '`architect_scope_validate`, not `architect_scope-validate`. Hyphenated forms 404 against the registry.',
  },
  {
    title: '`scope-validate` rejects `planning` and `review`',
    body: 'Error message: `Scope type must be design or implement`. Idea/candidate readiness has no CLI gate — it is structural.',
  },
  {
    title: '`pattern <Name>` "not found" is two distinct error paths',
    body: 'First checks getPattern; if that misses, probes findPatternParseFailure and re-throws with provenance. Cross-check with `search` or `list --names-only` before concluding the pattern does not exist.',
  },
  {
    title: '`bundle --include` repeated flag keeps only the last value',
    body: '`--include rules --include deps` silently keeps only `deps`. Use the comma form: `--include rules,deps,open-questions`.',
  },
  {
    title: 'CLI vs MCP latency tradeoff',
    body: 'CLI 2–5s cold, 0.5s warm; one Bash result. MCP sub-millisecond per call but each call is its own round trip. Default to CLI; reach for MCP when bursting ≥5 verbs.',
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Read model — the composed CliCatalog
// ──────────────────────────────────────────────────────────────────────────────

interface CliCatalog {
  readonly verbs: readonly SchemaVerb[];
  readonly intentBundles: readonly IntentBundle[];
  readonly parityTable: readonly ParityRow[];
  readonly deterministicGates: readonly DeterministicGate[];
  readonly knownQuirks: readonly KnownQuirk[];
}

function buildCatalog(): CliCatalog {
  return {
    verbs: readSchemaVerbs(),
    intentBundles,
    parityTable,
    deterministicGates,
    knownQuirks,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Renderers — both produce markdown from the same read model at different INPUT depths
// ──────────────────────────────────────────────────────────────────────────────

function renderSkill(catalog: CliCatalog): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push(
    'description: Quick reference to Architect CLI verbs grouped by session intent. Compact alternative to the full data-api kernel; load when a session needs verb-by-purpose lookup without the deep reference.',
  );
  lines.push('---');
  lines.push('');
  lines.push('# Architect CLI Overview (prototype)');
  lines.push('');
  lines.push(
    '> **Status:** prototype output of `scripts/proto/cli-catalog.ts`. Validates the documentation-projection design (architect/specs/documentation-projection/). Not a production skill.',
  );
  lines.push('');
  lines.push('## When this fires');
  lines.push('');
  lines.push(
    'Any architect-scoped session that needs to look up a CLI verb by what it does, grouped by what the session is trying to do. For deep verb shapes (JSON outputs, deterministic gates, quirks), descend to the full reference under `.pr-coordination/proto-output/cli-docs/INDEX.md`.',
  );
  lines.push('');
  lines.push('## Verbs by session intent');
  lines.push('');

  for (const bundle of catalog.intentBundles) {
    lines.push(`### ${bundle.intent}`);
    lines.push('');
    lines.push(bundle.summary);
    lines.push('');
    for (const verb of bundle.verbs) {
      const flagPart = verb.flags !== undefined ? ` ${verb.flags}` : '';
      const notePart = verb.note !== undefined ? ` — ${verb.note}` : '';
      lines.push(`- \`pnpm architect:query ${verb.name}${flagPart}\`${notePart}`);
    }
    lines.push('');
  }

  lines.push('## Deterministic gates');
  lines.push('');
  lines.push(
    'Three verbs are designed to be parsed for a verdict, not read as prose. Default to these before any FSM/state mutation.',
  );
  lines.push('');
  for (const gate of catalog.deterministicGates) {
    lines.push(`- **\`${gate.verb}\`** — ${gate.purpose}`);
  }
  lines.push('');

  lines.push('## Anti-patterns');
  lines.push('');
  lines.push('- Reading files (`Read` / `Glob` / `Grep`) on architect-scoped paths before any CLI/MCP call.');
  lines.push('- Hand-writing hyphenated MCP names — they 404. See full reference.');
  lines.push('- Using `scope-validate <X> planning` — only `design` and `implement` are accepted.');
  lines.push('');

  lines.push('## Full reference');
  lines.push('');
  lines.push(
    '`.pr-coordination/proto-output/cli-docs/INDEX.md` — per-verb signatures, CLI↔MCP parity table, JSON shapes, full quirk list.',
  );
  lines.push('');

  return lines.join('\n');
}

function renderDocs(catalog: CliCatalog): string {
  const lines: string[] = [];

  lines.push('# Architect CLI — Generated Reference (prototype)');
  lines.push('');
  lines.push(
    '> **Status:** prototype output of `scripts/proto/cli-catalog.ts`. Generated from CLI Zod command schemas + editorial framing aggregated in the script. Validates the documentation-projection design.',
  );
  lines.push('');
  lines.push(
    `**${catalog.verbs.length} verbs, ${catalog.parityTable.length} parity rows, ${catalog.intentBundles.length} intent bundles, ${catalog.deterministicGates.length} deterministic gates.**`,
  );
  lines.push('');

  // Goal-oriented entry — addresses GoalOrientedNavigation
  lines.push('## Find what you need');
  lines.push('');
  lines.push('| If you want to… | Go to |');
  lines.push('| --- | --- |');
  lines.push('| Look up a verb by what your session is doing | [Verbs by session intent](#verbs-by-session-intent) |');
  lines.push('| Find the MCP twin of a CLI verb (or vice versa) | [CLI ↔ MCP parity table](#cli--mcp-parity-table) |');
  lines.push('| Know which verbs produce deterministic verdicts | [Deterministic gates](#deterministic-gates) |');
  lines.push('| Read every verb shape, ordered alphabetically | [Per-verb reference](#per-verb-reference) |');
  lines.push('| Avoid the known traps | [Known quirks](#known-quirks) |');
  lines.push('');

  lines.push('## Verbs by session intent');
  lines.push('');
  for (const bundle of catalog.intentBundles) {
    lines.push(`### ${bundle.intent}`);
    lines.push('');
    lines.push(bundle.summary);
    lines.push('');
    lines.push('| Verb | Flags | Notes |');
    lines.push('| --- | --- | --- |');
    for (const verb of bundle.verbs) {
      const flags = verb.flags ?? '';
      const note = verb.note ?? '';
      lines.push(`| \`${verb.name}\` | \`${flags}\` | ${note} |`);
    }
    lines.push('');
  }

  lines.push('## CLI ↔ MCP parity table');
  lines.push('');
  lines.push(
    'Every CLI subcommand has an MCP twin. **MCP names use underscores end-to-end** — `architect_scope_validate`, not `architect_scope-validate`.',
  );
  lines.push('');
  lines.push('| CLI subcommand | MCP tool name |');
  lines.push('| --- | --- |');
  for (const row of catalog.parityTable) {
    lines.push(`| \`${row.cli}\` | \`${row.mcp}\` |`);
  }
  lines.push('');

  lines.push('## Deterministic gates');
  lines.push('');
  for (const gate of catalog.deterministicGates) {
    lines.push(`### \`${gate.verb}\``);
    lines.push('');
    lines.push(`**Purpose.** ${gate.purpose}`);
    lines.push('');
    lines.push(`**Verdict shape.** ${gate.verdictShape}`);
    lines.push('');
  }

  lines.push('## Per-verb reference');
  lines.push('');
  lines.push('Sorted alphabetically. Each entry shows the signature from the live Zod schema; flags and quirks are in the dedicated sections.');
  lines.push('');
  const sorted = [...catalog.verbs].sort((a, b) => a.name.localeCompare(b.name));
  for (const verb of sorted) {
    lines.push(`### \`${verb.name}\``);
    lines.push('');
    lines.push('```');
    lines.push(`pnpm architect:query ${verb.helpSignature}`);
    lines.push('```');
    lines.push('');
    if (verb.requiresCliContext) {
      lines.push('Requires a resolved CLI context (config file present).');
      lines.push('');
    }
    if (verb.body.length > 0) {
      for (const line of verb.body) {
        lines.push(line);
      }
      lines.push('');
    }
    if (verb.examples.length > 0) {
      lines.push('**Examples:**');
      lines.push('');
      lines.push('```');
      for (const example of verb.examples) {
        lines.push(example);
      }
      lines.push('```');
      lines.push('');
    }
  }

  lines.push('## Known quirks');
  lines.push('');
  for (const quirk of catalog.knownQuirks) {
    lines.push(`### ${quirk.title}`);
    lines.push('');
    lines.push(quirk.body);
    lines.push('');
  }

  lines.push('## Provenance');
  lines.push('');
  lines.push(
    'Source aggregates composed by `scripts/proto/cli-catalog.ts`: (1) Zod command schemas in `packages/architect-cli/src/cli/commands/`; (2) editorial intent-bundle framing hand-coded in the prototype script (lifted from `.agents/skills/architect-data-api/SKILL.md`); (3) deterministic-gate + quirk catalog hand-coded in the script. The production projection would source (2) and (3) from `_shared/` doctrine modules or per-command JSDoc.',
  );
  lines.push('');

  return lines.join('\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// Entry
// ──────────────────────────────────────────────────────────────────────────────

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function writeOutput(relativePath: string, body: string): void {
  const fullPath = resolve(repoRoot, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, body, { encoding: 'utf-8' });
  console.log(`wrote ${relativePath} (${body.split('\n').length} lines)`);
}

const catalog = buildCatalog();
console.log(`built CliCatalog: ${catalog.verbs.length} verbs, ${catalog.intentBundles.length} intent bundles`);
writeOutput('.agents/skills/architect-cli-overview/SKILL.md', renderSkill(catalog));
writeOutput('.pr-coordination/proto-output/cli-docs/INDEX.md', renderDocs(catalog));
