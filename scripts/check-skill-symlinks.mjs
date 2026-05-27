#!/usr/bin/env node
// @ts-check
/**
 * check-skill-symlinks — drift guard for the skill wiring.
 *
 * Canonical skill content lives in `.agents/skills/`. Each harness dir
 * (`.codex/skills/`, `.claude/skills/`, `.opencode/skills/`) symlinks into it. Nothing keeps the
 * three in sync automatically, so they drift — this asserts the invariants:
 *
 *   1. `.codex/skills/` is a directory symlink to `.agents/skills/`.
 *   2. No dangling symlinks in any per-skill harness skills dir (every target resolves).
 *   3. Every per-skill harness entry is a symlink pointing at the matching
 *      `.agents/skills/<name>` (no stray targets, no orphan names that no longer
 *      exist in the canonical set).
 *   4. `.claude/skills/` MIRRORS the full canonical set — a symlink for every
 *      skill (Claude is the superset).
 *   5. `.opencode/skills/` MIRRORS the canonical `architect-*` domain skills —
 *      the namespace OmO actually consumes (matches the `architect-*` allow rule
 *      in `.opencode/opencode.jsonc`). Non-`architect-*` skills (e.g. Claude-side
 *      authoring tools) are Claude-only by convention and are not required here.
 *
 * Per-harness "required" sets are derived from the canonical skill names by
 * convention (full set / `architect-*` prefix) — no skill name is hardcoded.
 * This is what catches the real regression: a domain skill present in
 * `.agents/skills/` but missing from a harness it belongs in.
 *
 * It also validates each canonical SKILL.md's frontmatter against the two
 * constraints stricter loaders enforce (Codex CLI rejects skills that violate
 * either; Claude Code is lenient, so they slip through unnoticed otherwise):
 *
 *   5. `description` is ≤ 1024 chars (Agent Skills spec maximum).
 *   6. `description` is a YAML-safe single-line scalar — an unquoted `: `
 *      (colon-space) is parsed as a mapping indicator and breaks the frontmatter.
 *
 * Run via `pnpm check:skills`. Exits non-zero with a per-violation message on failure.
 */
import { readdirSync, existsSync, readlinkSync, readFileSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CANON = join(repoRoot, '.agents', 'skills');
const CODEX_SKILLS = join(repoRoot, '.codex', 'skills');

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

if (!existsSync(CODEX_SKILLS)) {
  errors.push(`missing Codex skills symlink: ${rel(CODEX_SKILLS)} → ${rel(CANON)}`);
} else {
  let target;
  try {
    target = readlinkSync(CODEX_SKILLS);
  } catch {
    errors.push(`${rel(CODEX_SKILLS)} is not a symlink (Codex should point directly at .agents/skills/)`);
  }

  if (target !== undefined) {
    if (!existsSync(CODEX_SKILLS)) {
      errors.push(`${rel(CODEX_SKILLS)} → ${target} is DANGLING (target does not exist)`);
    } else if (resolve(dirname(CODEX_SKILLS), target) !== CANON) {
      errors.push(`${rel(CODEX_SKILLS)} → ${target} should point at ${rel(CANON)}`);
    }
  }
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

// Frontmatter validation: assert each canonical SKILL.md's `description`
// stays within the Agent Skills spec limit and is YAML-safe. Lexical check
// (no YAML dependency) targeting exactly the two failure modes strict loaders
// reject — our descriptions are single-line scalars by convention.
const DESCRIPTION_MAX = 1024;

for (const name of canon) {
  const file = join(CANON, name, 'SKILL.md');
  const fmMatch = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    errors.push(`${rel(file)} has no YAML frontmatter block (expected a leading --- ... --- fence)`);
    continue;
  }
  const descLine = fmMatch[1].split(/\r?\n/).find((line) => line.startsWith('description:'));
  if (descLine === undefined) {
    errors.push(`${rel(file)} frontmatter has no description field`);
    continue;
  }
  const value = descLine.slice('description:'.length).trim();
  if (value.length > DESCRIPTION_MAX) {
    errors.push(`${rel(file)} description is ${value.length} chars (max ${DESCRIPTION_MAX})`);
  }
  // Quoted / block scalars (" ' | >) carry their own escaping; only plain
  // scalars are broken by an unquoted colon-space.
  if (!/^["'|>]/.test(value) && value.includes(': ')) {
    errors.push(`${rel(file)} description has an unquoted ": " (colon-space) — breaks YAML parsing; rephrase or quote`);
  }
}

if (errors.length > 0) {
  console.error(`✗ skill check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✓ skills OK — ${canon.size} canonical skills; no dangling links; ` +
    `.codex points at .agents/skills; .claude mirrors the full set; ` +
    `.opencode mirrors the architect-* domain skills; ` +
    `all descriptions ≤${DESCRIPTION_MAX} chars and YAML-safe.`,
);
