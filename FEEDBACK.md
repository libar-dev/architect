# Feedback

One file for all Architect-tooling feedback. Append newest entries at the top.
An entry is short: surface you used (`pnpm architect:q`, `architect:graph`, MCP,
skill, guard), what you expected, what you got, impact on your session. No
template policing — friction kills the loop.

Referenced from `AGENTS.md` / `architect-base` (anti-anecdote): when a sample,
skill paraphrase, or workflow surprises you against the live graph, flag it
here rather than encoding anecdote as doctrine.

Historical verb-CLI reports live in git (`git log -p -- FEEDBACK.md`). This file
was reset on the ADR-014 cut so post-replacement feedback starts clean.

---

## 2026-08-20 — space-separated `@architect-uses` drops the whole node

Surface: annotation on production TS / the live graph.

Expected: `@architect-uses A B C` to parse as three edges (taxonomy used to call
this a "csv tag (space/comma-separated)").

Got: the scanner splits uses on comma only (`ast-parser.ts`). `A B C` is one
token, fails `PatternReferenceSchema` (`^[A-Z][A-Za-z0-9]+$`), and the pattern
node does not materialize. Comma form (`A, B, C`) works. Campaign protocol
already requires comma-form; `architect-base/references/taxonomy.md` now matches.

Impact: one space instead of a comma silently deletes the node. Doctrine now
requires commas; the parser still does not accept the space form.

## 2026-08-20 — `@architect-executable-specs` path is never resolved

Surface: `pnpm architect:graph dangling --strict` / `pnpm validate:all`.

Expected: a missing or stale `@architect-executable-specs:` file path to fail a
gate, same as a dangling `@architect-uses` / `-implements` / `-parent` name.

Got: the graph validates pattern-name refs and ignores the executable-specs
*path*. A design spec can point at a file that does not exist and every gate
stays green. The path still lands in the read model.

Impact: forward-link rot is invisible until someone follows the path by hand.
Resolve the path in dangling / `validate:all`.
