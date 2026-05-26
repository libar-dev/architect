#!/usr/bin/env node
// @ts-check
/**
 * check-skill-symlinks — drift guard for the skill wiring.
 *
 * Canonical skill content lives in `.agents/skills/`. Each harness dir
 * (`.claude/skills/`, `.opencode/skills/`) symlinks into it. Nothing keeps the
 * three in sync automatically, so they drift — this asserts the invariants:
 *
 *   1. No dangling symlinks in any harness skills dir (every target resolves).
 *   2. Every harness entry is a symlink pointing at the matching
 *      `.agents/skills/<name>` (no stray targets, no orphan names that no longer
 *      exist in the canonical set).
 *   3. `.claude/skills/` MIRRORS the full canonical set — a symlink for every
 *      skill (Claude is the superset).
 *   4. `.opencode/skills/` MIRRORS the canonical `architect-*` domain skills —
 *      the namespace OmO actually consumes (matches the `architect-*` allow rule
 *      in `.opencode/opencode.jsonc`). Non-`architect-*` skills (e.g. Claude-side
 *      authoring tools) are Claude-only by convention and are not required here.
 *
 * Per-harness "required" sets are derived from the canonical skill names by
 * convention (full set / `architect-*` prefix) — no skill name is hardcoded.
 * This is what catches the real regression: a domain skill present in
 * `.agents/skills/` but missing from a harness it belongs in. Run via
 * `pnpm check:skills`. Exits non-zero with a per-violation message on failure.
 */
import { readdirSync, existsSync, readlinkSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CANON = join(repoRoot, '.agents', 'skills');

/**
 * Each harness declares the canonical skills it MUST carry, derived from the
 * canonical names by convention — never an explicit name list.
 * @type {{ dir: string, label: string, required: (names: string[]) => string[] }[]}
 */
const HARNESSES = [
  // Claude carries the full canonical set (superset).
  { dir: join(repoRoot, '.claude', 'skills'), label: 'full canonical set', required: (names) => names },
  // OmO carries the `architect-*` domain skills (the namespace it consumes);
  // non-`architect-*` skills are Claude-only by convention.
  {
    dir: join(repoRoot, '.opencode', 'skills'),
    label: 'the canonical `architect-*` skills',
    required: (names) => names.filter((n) => n.startsWith('architect-')),
  },
];

const rel = (/** @type {string} */ p) => relative(repoRoot, p) || '.';
/** @type {string[]} */
const errors = [];

// Canonical skills: entries under .agents/skills that carry a SKILL.md.
const canon = new Set(
  readdirSync(CANON, { withFileTypes: true })
    .filter((e) => e.isDirectory() || e.isSymbolicLink())
    .map((e) => e.name)
    .filter((name) => existsSync(join(CANON, name, 'SKILL.md'))),
);

if (canon.size === 0) {
  console.error(`✗ no canonical skills found under ${rel(CANON)} — wrong repo root?`);
  process.exit(1);
}

for (const { dir, label, required } of HARNESSES) {
  if (!existsSync(dir)) {
    errors.push(`missing harness skills dir: ${rel(dir)}`);
    continue;
  }

  const present = new Set();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue; // .DS_Store etc.
    const p = join(dir, entry.name);

    if (!entry.isSymbolicLink()) {
      errors.push(`${rel(p)} is not a symlink (harness skill dirs must symlink into .agents/skills/)`);
      continue;
    }
    present.add(entry.name);

    const target = readlinkSync(p);
    if (!existsSync(p)) {
      errors.push(`${rel(p)} → ${target} is DANGLING (target does not exist)`);
      continue;
    }
    const expected = join(CANON, entry.name);
    if (resolve(dir, target) !== expected) {
      errors.push(`${rel(p)} → ${target} should point at ${rel(expected)}`);
    }
    if (!canon.has(entry.name)) {
      errors.push(`${rel(p)} symlinks "${entry.name}", which is not a skill in .agents/skills/ (orphaned or renamed?)`);
    }
  }

  for (const name of required([...canon])) {
    if (!present.has(name)) {
      errors.push(`${rel(dir)} is missing a symlink for canonical skill "${name}" (must carry ${label})`);
    }
  }
}

if (errors.length > 0) {
  console.error(`✗ skill-symlink check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✓ skill symlinks OK — ${canon.size} canonical skills; no dangling links; ` +
    `.claude mirrors the full set; .opencode mirrors the architect-* domain skills.`,
);
