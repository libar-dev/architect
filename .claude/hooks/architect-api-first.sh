#!/usr/bin/env bash

set -u

# SessionStart context injection.
#
# Injects durable orientation only:
#   1. the source-first / event-sourced mental model, and
#   2. loading the self-contained `architect-base` skill, with the graph handle
#      (`architect-graph-handle`) and `architect-sessions` as on-demand loads.
# The gen-1 verb CLI is retired (ADR-014); the graph handle is THE agent read
# surface. Prior hook versions (API-first contract, live overview exec) live in
# git history.

MENTAL_MODEL_BLOCK="$(cat <<'EOF'
[Architect mental model — source-first, event-sourced, projected]
Source of truth = annotated production TS (`@architect-*` JSDoc) + executable Gherkin (`tests/features/**`); git-committed annotated code is the immutable event store.
The PatternGraph, generated docs (`docs-live/`), and Studio UI are all PROJECTIONS off that one graph — never hand-author or hand-edit a projection to reconcile it with source.
`docs-live/` regenerates via `pnpm docs:all` and is git-tracked, so `pnpm docs:all && git diff --exit-code docs-live` is a determinism gate; a non-empty diff means a projection drifted from source.
Working state under `architect/` (specs · stubs · decisions) is scaffold, not source: a design spec transfers its invariants to executable Gherkin + its rationale to JSDoc, then is deleted. `architect/decisions/` ADRs are the permanent exception.
EOF
)"

SKILL_BLOCK="$(cat <<'EOF'
[Load skills]
Before proceeding, load `.agents/skills/architect-base` NOW (canonical repo-root path; self-contained — the vocabulary every other surface assumes; pulls in no other skill).
Load these ON DEMAND, never pre-loaded at startup:
- `.agents/skills/architect-graph-handle` — THE read surface (ADR-014; the verb CLI is retired). Whenever you need graph state (a pattern's status/deps/rules, a file's owner + neighborhood, a symbol's usage, blast radius, what a pattern guarantees / which specs re-verify), or you'd otherwise grep across files to learn the architecture: script cuts over the live graph via `pnpm architect:q`.
- `.agents/skills/architect-sessions` — for spec-driven work (capture/design/implement/review/handoff).
`.codex/skills/` symlinks to `.agents/skills/`; `.claude/skills/` and `.opencode/skills/` mirror it. Use `.agents/skills/` as the canonical path set.
EOF
)"

ADDITIONAL_CONTEXT="${MENTAL_MODEL_BLOCK}"$'\n\n'"${SKILL_BLOCK}"

ADDITIONAL_CONTEXT_JSON="$(
  ADDITIONAL_CONTEXT="$ADDITIONAL_CONTEXT" python3 - <<'PY'
import json
import os
import sys

sys.stdout.write(json.dumps(os.environ.get("ADDITIONAL_CONTEXT", "")))
PY
)"

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":%s}}' "$ADDITIONAL_CONTEXT_JSON"
