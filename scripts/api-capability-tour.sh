#!/usr/bin/env bash
# ============================================================================
# Architect Data API — Capability Tour
# ----------------------------------------------------------------------------
# Run once at the start of a session to EXPERIENCE the Data API before reaching
# for grep/Read. Every step proves the API answers a question that would
# otherwise cost an N-call loop + multiple file Reads + custom parsing.
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
s1() { Q overview; }
s2() { Q query getStatusCounts | jq .; }
# jq slices to 8 instead of `| head` — `head` closing the pipe early would
# SIGPIPE pnpm/jq and register a false failure under pipefail.
s3() { Q search Markdown | jq -r '.[0:8][] | "\(.score)  \(.patternName)"'; }
# Bundle content lives under `.root` (deliverables/deps/rules/etc. selected by
# `.root.includes`); `.children` is for routed sub-documents and is empty inline.
s4() { Q bundle MarkdownRenderer --format json \
         | jq '{pattern: .root.pattern.patternName, includes: .root.includes, members: .root.memberCount}'; }
s5() { Q dep-tree MarkdownRenderer; }
s6() { Q rules --pattern MarkdownRenderer --only-invariants; }
s7() { Q query isValidTransition roadmap active | jq '{from:"roadmap", to:"active", allowed:.data}'; }
# Neighborhood fields live under `.data` (like s9). `-e` + the non-null guard make a
# future regression to all-null output FAIL the smoke check instead of passing on exit 0.
s8() { Q arch neighborhood PatternGraph --format json \
         | jq -e '.data | {pattern, role, context, uses, usedByCount: (.usedBy // [] | length)} | select(.pattern != null)'; }
# drift is on the baseline response (`.data.drift`); the dangling COUNT lives in the
# envelope's graph-validation summary (`.metadata.validation.danglingReferenceCount`),
# NOT on `.data` (which carries baseline counts like `currentCount`).
s9() { Q arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict \
         | jq '{drift: .data.drift, dangling: .metadata.validation.danglingReferenceCount}'; }

step "1. Health + inventory — START HERE every session (text, human-oriented)" s1
step "2. Status distribution as JSON — proof that | jq works (note the -s)" s2
step "3. Locate a pattern by fuzzy name (replaces guessing file paths)" s3
step "4. The default composite pre-flight — everything for a pattern in ONE call" s4
step "5. Dependency walk — replaces reading imports across many files" s5
step "6. Invariants for a pattern — replaces grepping Rule: blocks (add --format json for a BusinessRuleSet object)" s6
step "7. Deterministic FSM gate — is this transition legal?" s7
step "8. Architecture neighborhood as structured JSON — the graph, not a guess" s8
step "9. Graph-integrity gate — non-zero drift = stop and surface" s9

if [ "$fail" -ne 0 ]; then
  printf '\n\033[31m✗ Capability tour: one or more steps FAILED (see [FAILED] above).\033[0m\n'
  printf '  A failing step means the API itself is broken for that verb — fix it, do not ignore it.\n'
  exit 1
fi

printf '\n\033[32m✓ Capability tour: all steps succeeded.\033[0m'
printf ' Next time: bundle <Pattern> first, grep last.\n'
