#!/usr/bin/env bash
# ============================================================================
# Architect Data API — Capability Tour
# ----------------------------------------------------------------------------
# Run once at the start of a session to EXPERIENCE the Data API before reaching
# for grep/Read. Most steps prove the API answers a question that would otherwise
# cost an N-call loop + multiple file Reads + custom parsing (step 1 is a lean
# progress pulse that just proves the overview verb — the full cheat-sheet + map
# are injected once at session start by .claude/hooks/architect-api-first.sh, not
# re-dumped here).
#
# THE ONE IDIOM THAT MATTERS:  pnpm -s architect:query <verb> [--format json] | jq
#   `-s` (silent) suppresses pnpm's `> architect@0.0.0 …` banner, which would
#   otherwise be printed to stdout AHEAD of the JSON and break `| jq`.
#   Bare `pnpm architect:query … | jq` FAILS with a parse error — that failure
#   is the #1 reason agents wrongly conclude "the API isn't clean JSON" and
#   fall back to grep. Always use `-s` when piping.
#
# This script also doubles as a smoke check: any step that fails (pnpm error,
# jq parse error, verb regression) is reported and makes the tour exit NON-ZERO.
# It never masks a failure behind a clean exit.
# ============================================================================
set -uo pipefail

Q() { pnpm -s architect:query "$@"; }

fail=0
hr() { printf '\n\033[1m── %s\033[0m\n' "$1"; }
# Run a pipeline step under a title; on non-zero exit (pipefail catches any
# stage, incl. pnpm and jq), report it and flag the tour as failed.
step() {
  local title=$1
  shift
  hr "$title"
  if ! "$@"; then
    printf '  \033[31m[FAILED]\033[0m %s\n' "$title"
    fail=1
  fi
}

# Each step is wrapped in a function so `step` can detect its exit status.
# (Pipelines can't be passed as bare args; functions keep pipefail semantics.)
s1() { Q overview --richness name-only; }
# `jq .` would dump the full envelope incl. run-to-run-volatile noise (timestamp,
# cache.ageMs, pipelineMs) — modeling dump-don't-slice. Slice to the real counts
# (.data) + a preview of `.metadata.validation` (the exact block step 13's
# integrity gate keys off), so step 2 foreshadows step 13 and the output is stable.
s2() { Q query getStatusCounts | jq '{data, validation: .metadata.validation}'; }
# jq slices to 8 instead of `| head` — `head` closing the pipe early would
# SIGPIPE pnpm/jq and register a false failure under pipefail. Searching "PatternGraph"
# surfaces the whole core family ranked (the read-model schema, its API kernel, the CLIs)
# and sets up the showcase pattern for the steps that follow.
s3() { Q search PatternGraph | jq -r '.[0:8][] | ((((.score*100|round)/100)|tostring) + "      ")[0:6] + "  " + .patternName'; }
# Name-it-then-locate-it: step 3 resolves the canonical name, `files` turns that name
# into the implementation surface (primary .ts + the implementing .feature specs) in ONE
# call — the structured answer to "where is X implemented?", the #1 reason to reach for grep.
sfiles() { Q files PatternGraphApi; }
# Bundle content lives under `.root.blocks` (deps/rules/scenarios/openQuestions/docstring,
# selected by `.root.includes`); the envelope's TOP-LEVEL `.children` sibling of `.root` holds
# routed sub-documents and is `{}` inline (a leaf pattern routes none).
# Surface the CONTENT-bearing counts — not memberCount, which is 0 for a leaf pattern — so the
# "everything in ONE call" claim lands, then quantify the saving with --estimate-tokens.
s4() {
  Q bundle PatternGraphApi --format json \
    | jq '{pattern: .root.pattern.patternName, dependsOn: (.root.blocks.deps.dependsOn | length), usedBy: (.root.blocks.deps.usedBy | length), rules: (.root.blocks.rules | length), scenarios: (.root.blocks.scenarios | length)}' \
    && Q bundle PatternGraphApi --estimate-tokens --format json \
         | jq -r '"  -> this entire pre-flight = ~\(.root.bundleTokenEstimate.tokens) tokens, ONE call"'
}
# PatternGraphApi — the read-side kernel (ADR-006's read-model API that every CLI/MCP
# verb calls) — is the tour's showcase pattern: it is what Architect IS. Its dep-tree is
# deep in BOTH directions (3 upstream core types; 1 direct + 8 transitive downstream into
# the MCP pipeline), so this one flagless call answers prerequisites AND blast radius.
s5() { Q dep-tree PatternGraphApi; }
# The invariants live on PatternGraphApi's implementing specs (PatternGraphApi*Tests),
# not on its .ts — `rules --pattern` resolves through implementedBy to surface them, so
# this both proves the read-kernel's consistency contract (FSM methods agree, status
# partition is exact, reverse edges stay consistent) AND demonstrates reverse-trace
# resolution. Rendered through jq as `• name / invariant` — far cheaper than the raw
# minified-JSON-per-line text render — and the `jq -e ... select(length>0)` doubles as
# the emptiness guard: a future implementedBy:[] regression (empty rules) FAILs the smoke
# check instead of silently printing nothing, so "all steps succeeded" can't lie.
s6() {
  Q rules --pattern PatternGraphApi --only-invariants --format json \
    | jq -e -r '.root.rules | select(length>0) | .[] | "• \(.ruleName)\n    \(.invariant)"'
}
# Governance navigability: an ADR -> the executable invariants that enforce it, shown as
# a tight rule-name list (the full per-rule text is what step 6 demonstrates; here the
# point is the ADR->rule EDGE). ADR-006 (Single Read Model) is the decision that governs
# the showcase pattern above, so the tour stays one coherent story about the read model.
# `jq -e ... select(length>0)` doubles as the emptiness guard so a broken edge FAILs.
sgov() {
  Q rules --decision ADR006SingleReadModelArchitecture --format json \
    | jq -e -r '.root.rules | select(length>0) | "\(length) invariants enforce ADR-006 (Single Read Model):", (.[] | "  • \(.ruleName)")'
}
# `documentation architecture` fans out in ONE call into by-theme / layered / package-seam
# lens children (75f5509). The by-theme lens synthesizes @architect-adr-theme into NAMED
# decision clusters — "which decisions cluster around projections/taxonomy/testing?" is one
# lens, never a grep over the decisions folder. The projections cluster contains ADR-006
# (the showcase decision from the step above), so the tour stays one coherent read-model story.
# `jq -e ... select(length>0)` is the emptiness guard so a dropped adr-theme grouping FAILs.
stheme() {
  Q documentation architecture --format json \
    | jq -e -r '.children["architecture:by-theme"].sections
                | map(select(.title|startswith("Theme:")))
                | select(length>0)
                | "ADRs cluster into \(length) decision themes (one lens, no decisions-folder grep):",
                  (.[] | "  • \(.title)  →  \(.patterns|join(", "))")'
}
# Pre-flight gate — the inspect -> "is it safe to start a session?" close. The
# session-start cheat-sheet (injected by the hook) advertises scope-validate under
# PLAN/GATE; here we actually exercise it.
sgate() { Q scope-validate PatternGraphApi design; }
# A lone `true` can't prove the gate actually decides — show a LEGAL and an ILLEGAL
# transition side by side (roadmap->active allowed; completed->active rejected) so the
# deterministic hard yes/no is visible.
s7() {
  Q query isValidTransition roadmap active | jq '{from:"roadmap", to:"active", allowed:.data}' \
    && Q query isValidTransition completed active | jq '{from:"completed", to:"active", allowed:.data}'
}
# Neighborhood fields live under `.data` (like s9). `-e` + the non-null guard make a
# future regression to all-null output FAIL the smoke check instead of passing on exit 0.
s8() { Q arch neighborhood PatternGraph --format json \
         | jq -e '.data | {pattern, role, context, uses, usedByCount: (.usedBy // [] | length)} | select(.pattern != null)'; }
# drift is on the baseline response (`.data.drift`); the dangling COUNT lives in the
# envelope's graph-validation summary (`.metadata.validation.danglingReferenceCount`),
# NOT on `.data` (which carries baseline counts like `currentCount`).
s9() { Q arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict \
         | jq '{drift: .data.drift, dangling: .metadata.validation.danglingReferenceCount}'; }

step "1. Progress pulse — the 'overview' verb live (full map + cheat-sheet already injected by the SessionStart hook)" s1
step "2. Status distribution as JSON — proof that | jq works (note the -s); slice the envelope, don't dump it" s2
step "3. Locate a pattern by fuzzy name (replaces guessing the canonical pattern name)" s3
step "4. Locate the implementation surface — name it (step 3), then find it (replaces grep 'where is X?')" sfiles
step "5. The default composite pre-flight — everything for a pattern in ONE call (+ token cost)" s4
step "6. Dependency walk, both directions — replaces reading imports across many files" s5
step "7. Invariants for a pattern — replaces grepping Rule: blocks (--format json envelope: .root is a BusinessRuleSet {kind, rules[], scope, scopeValue})" s6
step "8. Invariants that enforce an ADR — governance navigability, not grep across decision records" sgov
step "9. Decision clusters by theme — one \`documentation architecture\` lens groups ADRs by theme (no decisions-folder grep)" stheme
step "10. Pre-flight scope gate — is it safe to start a design session on this pattern?" sgate
step "11. Deterministic FSM gate — a legal AND an illegal transition, side by side" s7
step "12. Architecture neighborhood (PatternGraph — the read-model contract/schema, not the kernel in step 5) — the graph, not a guess" s8
step "13. Graph-integrity gate — non-zero drift = stop and surface" s9

if [ "$fail" -ne 0 ]; then
  printf '\n\033[31m✗ Capability tour: one or more steps FAILED (see [FAILED] above).\033[0m\n'
  printf '  A failing step means the API itself is broken for that verb — fix it, do not ignore it.\n'
  exit 1
fi

printf '\n\033[32m✓ Capability tour: all steps succeeded.\033[0m'
printf ' Next time: bundle <Pattern> first, grep last.\n'
