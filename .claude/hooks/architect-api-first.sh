#!/usr/bin/env bash

set -u

# SessionStart context injection.
#
# The previous version pushed an "API-first" contract and EXECUTED the gen-1
# `architect` verb CLI (a live `overview` snapshot) on every startup. During the
# projection rearchitecture we are moving off that verb API, so this hook no
# longer suggests or runs it. What remains is durable orientation only:
#   1. the source-first / event-sourced mental model, and
#   2. loading the self-contained `architect-base` skill.
# The full prior version lives in git history. The new graph-handle read surface
# is now proven (reviewed, tested, smoke-guarded, cold-validated) and wired in
# below as an on-demand skill (architect-graph-handle) — the agent-sink complement
# to the verbs.

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
- `.agents/skills/architect-data-api` — when you need pattern state, deps, gates, or transitions (the canonical `pnpm architect:query` verbs).
- `.agents/skills/architect-graph-handle` — when you need an architectural slice the verbs don't pre-bake (a file's owner + neighborhood, a symbol's usage, blast radius, what a pattern guarantees / which specs re-verify), or you'd otherwise grep across files. The agent-sink complement to the verbs: script cuts over the live graph via `pnpm playground:q`.
- `.agents/skills/architect-sessions` — for spec-driven work (capture/design/implement/review/handoff). NB: loading it pulls in architect-data-api per its own prerequisite, so pre-loading sessions at startup would re-introduce the data-api startup load.
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
