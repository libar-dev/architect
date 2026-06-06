/**
 * Snapshot the raw PatternGraph read model to a JSON file for offline design exploration.
 *
 * The CLI deliberately withholds `getPatternGraph` from the `query` passthrough
 * (28/29 read-kernel methods are exposed) to avoid a ~700KB payload drowning an
 * agent mid-conversation. That concern is about tool-result size, not secrecy —
 * dumping the same read model to a file is exactly the supported escape hatch.
 *
 * This reuses the CLI's own `buildCliContext`, so the snapshot is byte-identical
 * to the graph every verb, codec, and renderer consumes (ADR-006: the single
 * read model = the assembled PatternGraph, not per-pattern ExtractedPattern).
 *
 * The graph is encoded through `createJsonOutputCodec(PatternGraphSchema)` — a
 * Zod-backed JSON codec — so the write VALIDATES against the canonical contract
 * (`PatternGraphSchema`) and serializes the post-`.transform()` form. A graph
 * that diverges from the schema fails loudly here instead of silently writing
 * garbage. Reload it with `load-pattern-graph.ts` for a typed, validated graph.
 *
 * Pass `--core` for a lean, blank-slate fixture: only the normalized core
 * (`patterns` + `relationshipIndex` + `tagRegistry`), dropping every precomputed
 * view (`byStatus`/`byRole`/`archIndex`/…). The views are the current pipeline's
 * opinions about useful cuts; a fresh projection design re-derives its own.
 *
 * Usage:
 *   pnpm exec tsx --conditions=source ./scripts/snapshot-pattern-graph.ts [outPath]
 *   pnpm exec tsx --conditions=source ./scripts/snapshot-pattern-graph.ts --core [outPath]
 *   # default outPath: .scratch/pattern-graph-snapshot.json   (full)
 *   #                  .scratch/pattern-graph-core.json        (--core)
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  PatternGraphSchema,
  createJsonOutputCodec,
  type CodecError,
} from '@libar-dev/architect-core';

import { buildCliContext } from '../packages/architect-cli/src/cli/pattern-graph-cli-runtime.js';
import type { ParsedArgs } from '../packages/architect-cli/src/cli/pattern-graph-cli-types.js';

function reportCodecError(error: CodecError): never {
  process.stderr.write(`Codec error (${error.operation}): ${error.message}\n`);
  if (error.source !== undefined) {
    process.stderr.write(`Source: ${error.source}\n`);
  }
  for (const line of error.validationErrors ?? []) {
    process.stderr.write(`${line}\n`);
  }
  process.exit(1);
}

// Lean blank-slate subset: the normalized core, free of precomputed views.
// Validated through its own picked schema so the core file is codec-encoded too.
const CoreGraphSchema = PatternGraphSchema.pick({
  patterns: true,
  relationshipIndex: true,
  tagRegistry: true,
});

const baseDir = process.cwd();
const core = process.argv.includes('--core');
const positional = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
const defaultOut = core
  ? '.scratch/pattern-graph-core.json'
  : '.scratch/pattern-graph-snapshot.json';
const outPath = path.resolve(baseDir, positional ?? defaultOut);

// Minimal ParsedArgs: empty input/features lets the runtime resolve workspace
// sources exactly as `pnpm architect:query` does. noCache forces a fresh build.
const args: ParsedArgs = {
  baseDir,
  input: [],
  features: [],
  command: null,
  commandArgs: [],
  help: false,
  version: false,
  dryRun: false,
  noCache: true,
  format: 'json',
  sessionType: 'planning',
  sessionTypeExplicit: false,
  depth: 1,
};

const ctx = await buildCliContext(args);
const graph = ctx.graph;

// Encode through the Zod-backed output codec: validates against the contract,
// then serializes the parsed (post-transform) form. Fail loud on any divergence.
const encoded = core
  ? createJsonOutputCodec(CoreGraphSchema).serializeWithOptions(
      {
        patterns: graph.patterns,
        relationshipIndex: graph.relationshipIndex,
        tagRegistry: graph.tagRegistry,
      },
      { indent: 2 },
    )
  : createJsonOutputCodec(PatternGraphSchema).serializeWithOptions(graph, { indent: 2 });
if (!encoded.ok) {
  reportCodecError(encoded.error);
}
const json = encoded.value;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, json, 'utf8');

const relCount = Object.keys(graph.relationshipIndex).length;
const sizeMb = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);

process.stdout.write(
  [
    `Wrote validated PatternGraph ${core ? 'core ' : ''}snapshot → ${path.relative(baseDir, outPath)}`,
    `  validated against: ${
      core
        ? 'PatternGraphSchema.pick(patterns, relationshipIndex, tagRegistry)'
        : 'PatternGraphSchema'
    } (codec-encoded)`,
    `  patterns:          ${String(graph.patterns.length)}`,
    `  relationshipIndex: ${String(relCount)} entries`,
    `  top-level keys:    ${
      core ? 'patterns, relationshipIndex, tagRegistry' : Object.keys(graph).join(', ')
    }`,
    `  size:              ${sizeMb} MB`,
    `  pipeline:          ${String(ctx.metadata.pipelineMs)}ms` +
      ` (cache ${ctx.metadata.cache?.hit === true ? 'hit' : 'miss'})`,
    '',
  ].join('\n'),
);
