#!/usr/bin/env node
/**
 * Wave 2 residual taxonomy codemod.
 *
 * Operates across BOTH delivery instances:
 *   - Studio:  architect/specs/, architect/decisions/, architect/releases/
 *   - Package: packages/architect/architect/{specs,design-reviews,decisions,releases}/
 *              + packages/architect-claude-plugin/skills/ (markdown spec/decision content only)
 *
 * Modes (subset selectors):
 *   --sequence   Drop @architect-sequence-* tags (orchestrator/step/module/error)
 *   --externals  Rewrite @architect-depends-on-external X[, Y]   → @architect-uses X[, Y]
 *                Rewrite @architect-depends-on-external:<ns>:<P> → @architect-uses:<ns>:<P>
 *                Rewrite @architect-parent-external X            → @architect-parent X
 *                Rewrite @architect-parent-external:<ns>:<P>     → @architect-parent:<ns>:<P>
 *   --extract-shapes  Drop @architect-extract-shapes lines (M2d only)
 *   --all        All of the above (default)
 *
 *   --check      Report planned changes without writing.
 *   --write      Apply changes.
 *
 * The codemod intentionally does NOT touch `packages/context/` (research material) or
 * `*-archive/` directories. Tier-A baseline files and `legacy-taxonomy/` fixtures are
 * also excluded.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../');

const TARGET_DIRS = [
  // Studio delivery instance
  { dir: path.join(REPO_ROOT, 'architect/specs'), exts: ['.feature', '.md'] },
  { dir: path.join(REPO_ROOT, 'architect/decisions'), exts: ['.feature', '.md'] },
  { dir: path.join(REPO_ROOT, 'architect/releases'), exts: ['.feature', '.md'] },
  // Package delivery instance
  { dir: path.join(REPO_ROOT, 'packages/architect/architect'), exts: ['.feature', '.md'] },
];

const EXCLUDE_PREFIXES = [
  'packages/context/',
  '.sisyphus/',
  '.pr-coordination-archive',
  '.omo-architect-stash/',
  'docs-live/',
  'legacy-taxonomy/',
];

const EXCLUDE_FILES = new Set(['.architect-cli-feedback.md']);

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {
    sequence: args.includes('--sequence'),
    externals: args.includes('--externals'),
    extractShapes: args.includes('--extract-shapes'),
    all: args.includes('--all'),
    check: args.includes('--check'),
    write: args.includes('--write'),
  };
  if (!flags.sequence && !flags.externals && !flags.extractShapes && !flags.all) {
    flags.all = true;
  }
  if (flags.all) {
    flags.sequence = true;
    flags.externals = true;
    flags.extractShapes = true;
  }
  return flags;
}

function toRel(absPath) {
  return path.relative(REPO_ROOT, absPath).split(path.sep).join('/');
}

function isExcluded(absPath) {
  const rel = toRel(absPath);
  if (EXCLUDE_FILES.has(path.basename(rel))) return true;
  return EXCLUDE_PREFIXES.some((p) => rel.includes(p));
}

async function walk(dir, exts) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return out;
    throw err;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (isExcluded(full)) continue;
    if (e.isDirectory()) {
      out.push(...(await walk(full, exts)));
    } else if (e.isFile() && exts.some((ext) => full.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Drop entire lines whose only architect tag content is a sequence-* tag.
 * Strip @architect-sequence-error tokens from inline scenario tag lines while
 * preserving any other tags on that line.
 */
function applySequenceDrop(content) {
  const lines = content.split('\n');
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();

    // Whole-line sequence tags (orchestrator, step, module, error standalone)
    if (/^@architect-sequence-(?:orchestrator|step|module|error)(?::|$|\s)/.test(trimmed)) {
      // Skip the line entirely.
      continue;
    }

    // Inline @architect-sequence-error within a tag line: strip just that token.
    if (line.includes('@architect-sequence-error')) {
      const cleaned = line.replace(/\s*@architect-sequence-error\b/g, '').replace(/\s+$/u, '');
      // If line becomes empty after trim, drop it.
      if (cleaned.trim().length === 0) continue;
      out.push(cleaned);
      continue;
    }

    out.push(line);
  }
  return out.join('\n');
}

/**
 * Rewrite @architect-depends-on-external → @architect-uses
 * Rewrite @architect-parent-external    → @architect-parent
 * Handles all four shapes:
 *   space-form:   @architect-depends-on-external X
 *   csv:          @architect-depends-on-external X, Y, Z
 *   colon-form:   @architect-depends-on-external:<ns>:<P>
 *   bare colon:   @architect-depends-on-external:<P>
 */
function applyExternalsRewrite(content) {
  return content
    .replaceAll('@architect-depends-on-external:', '@architect-uses:')
    .replaceAll('@architect-depends-on-external ', '@architect-uses ')
    .replaceAll('@architect-parent-external:', '@architect-parent:')
    .replaceAll('@architect-parent-external ', '@architect-parent ');
}

/**
 * Drop @architect-extract-shapes lines. Reserved for M2d.
 */
function applyExtractShapesDrop(content) {
  const lines = content.split('\n');
  const out = [];
  for (const line of lines) {
    if (/^\s*(?:\*\s*)?@architect-extract-shapes\b/.test(line)) continue;
    out.push(line);
  }
  return out.join('\n');
}

async function main() {
  const flags = parseArgs(process.argv);
  if (!flags.check && !flags.write) {
    flags.check = true;
  }

  const files = [];
  for (const target of TARGET_DIRS) {
    files.push(...(await walk(target.dir, target.exts)));
  }
  files.sort();

  let changed = 0;
  for (const absPath of files) {
    const original = await readFile(absPath, 'utf8');
    let next = original;
    if (flags.sequence) next = applySequenceDrop(next);
    if (flags.externals) next = applyExternalsRewrite(next);
    if (flags.extractShapes) next = applyExtractShapesDrop(next);
    if (next !== original) {
      changed += 1;
      const rel = toRel(absPath);
      if (flags.write) {
        await writeFile(absPath, next, 'utf8');
        process.stdout.write(`rewrote ${rel}\n`);
      } else {
        process.stdout.write(`would rewrite ${rel}\n`);
      }
    }
  }

  process.stdout.write(`codemod-wave2: ${changed} file change${changed === 1 ? '' : 's'}\n`);
}

main().catch((err) => {
  process.stderr.write(`codemod-wave2 failed: ${err.message ?? err}\n`);
  process.exit(1);
});
