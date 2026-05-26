# HUD ideation — progressive disclosure for the Data API

> Maintainer steer: "use progressive-disclosure features to reuse the same
> projections and drastically reduce verbosity for API output."
>
> **Build status:** steps **1 + 2 shipped** (WS-3 Sessions 14–15, D-17/D-18) — `--disclosure
<ContentRichness>` on `overview` (default `summary`), a disclosure-gated generated-views
> index, and an architecture glimpse (package map at `summary`, bounded-context map at `full`);
> CLI + MCP parity; production-only component view. Steps **3 + 4 remain sequenced ideation**
> (below). Per-session detail: SESSION-REPORTS S14–S15 + `archive/DECISIONS-resolved.md` D-17/D-18.
>
> **Vocabulary clarification (load-bearing, resolved in D-17):** the read surface
> uses `ContentRichnessSchema` (`name-only · summary · summary-with-references ·
full`), NOT `ProgressiveDisclosureLevelSchema` (`essential…advanced`). The
> progressive level only resolves through a per-doc-type `disclosureMatrix`
> (`generate-docs`); read verbs have no doc-type, so richness is the right knob.
> Also: `render-compact-text.ts` was NOT disclosure-aware — step 1 added the
> branching, it was not a free reuse.

## Thesis

The Data API is already a projection engine with a **disclosure vocabulary** that
today only shapes generated Markdown. The HUD move is to **reuse that same
`DisclosureSpec` on the CLI/MCP read surface** so an agent can dial payload size —
turning a wall of text into a heads-up display.

- Vocabulary already exists: `packages/architect-projection/src/disclosure/spec.ts`
  — `richness` (`name-only` → `summary` → `summary-with-references` → `full`) ×
  `grouping` × `rootShape` (`navigation` | `summary`) × `filter`.
- Today only `renderMarkdown` / `documentation --disclosure` consume it. The read
  verbs (`overview`, `bundle`, `pattern`, `arch blocking`) render at one fixed,
  verbose level.
- The pain is real and already named in the `architect-data-api` skill: the two
  failure modes of a query API are **payload overflow** and **underflow**. The
  pasted `overview` (~50 lines of blocking + a verb table) is overflow on a
  bootstrap call.

## First steps (smallest blast radius first)

1. **[SHIPPED — Session 14] `--disclosure <ContentRichness>` on the read surface.**
   `overview` defaults `summary` (progress + top-N blockers + one-line "more: …"); `full`
   reproduces the prior output. `bundle` / `pattern` / `arch blocking` are the documented
   fast-follow — renderer plumbing (`render-compact-text.ts`) + flag pattern in place, each
   needs per-fragment richness branching. MCP parity free (shared projection + renderer).

2. **[SHIPPED — Session 14] A compact "generated-views index" `overview` section** —
   a structured `generatedViews` field on `OverviewDigest`, disclosure-gated (one line at
   `summary`, itemized at `full`); one line per generated surface (`architecture`, `decisions`,
   `requirements-*`, `roadmap`, `changelog`, `taxonomy`) + the verb to fetch it.

3. **Token-budget signal everywhere.** Generalize `bundle --estimate-tokens`
   (`chars / 4` heuristic) into the shared output path so any verb can report
   payload size, and let a heuristic auto-flag overflow/underflow. This is the
   substrate the planned `feedback` verb already anticipates (data-api skill,
   "Coming" section).

4. **A single `hud` / `brief` composite verb (later).** Progress + top blockers +
   active-pattern context + projections index in one disclosure-aware call — the
   session-bootstrap HUD. Aligns with the `ArchitectBriefDeterministicBundle`
   direction already in the graph.

## Why this shape

- **Reuse, not reinvention.** Same `DisclosureSpec`, same projections, same
  renderers — verbosity becomes a render-time parameter, not a fork.
- **State-driven, not intent-driven** (data-api skill doctrine): disclosure shapes
  _how much_ is returned; _what_ is returned still derives from the pattern's
  state on disk.
- **Deterministic + cacheable.** Disclosure is a pure post-projection transform;
  no new graph reads.

## Open questions (resolve before building)

- Default disclosure level per verb — is `summary` right for `overview`, or should
  the bootstrap stay `full` and only the per-pattern verbs default terse?
- Does `summary` for `overview` truncate the blocking list to top-N, or collapse it
  to a count + "run `arch blocking`"? (Underflow risk if too terse.)
- Should `--disclosure` be a global flag (all verbs) or opt-in per verb to start?
- Is a new `hud`/`brief` verb worth it, or is a disclosure-aware `overview` enough?

## Capture status

Steps 1 + 2 built in WS-3 Session 14 (D-16/D-17). Steps 3 (token-budget signal —
generalize `bundle --estimate-tokens` `chars/4` into the shared output path with
heuristic overflow/underflow auto-flagging) and 4 (composite `hud`/`brief` verb,
aligns with `ArchitectBriefDeterministicBundle`) remain the next-up sequence.
Promote to a candidate-tier spec in `architect/specs/candidates/` if steps 3-4 grow
beyond a single session.
