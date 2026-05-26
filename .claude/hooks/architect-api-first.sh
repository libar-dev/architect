#!/usr/bin/env bash

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Read the harness payload from stdin, but never block on it. Claude Code pipes
# the hook JSON and closes stdin (EOF arrives immediately); other harnesses
# (e.g. Codex) may leave stdin open with no EOF, which makes a bare `cat` hang
# forever and wedges the SessionStart hook. A bounded `read` captures any
# payload delivered on spawn, then falls back to the "startup" default.
RAW_INPUT=""
IFS= read -r -d '' -t 2 RAW_INPUT 2>/dev/null || true

SOURCE="$(
  RAW_INPUT="$RAW_INPUT" python3 - <<'PY'
import json
import os
import sys

raw_input = os.environ.get("RAW_INPUT", "")
source = "startup"

try:
    parsed = json.loads(raw_input) if raw_input.strip() else {}
    if isinstance(parsed, dict):
        candidate = parsed.get("source")
        if isinstance(candidate, str) and candidate.strip():
            source = candidate.strip()
except Exception:
    pass

sys.stdout.write(source)
PY
)"

CONTRACT_BLOCK="$(cat <<'EOF'
[Architect API-first contract]
Use `pnpm architect:query <verb>` as the first read surface for pattern state, dependencies, rules, decisions, and transitions.
Prefer `pnpm -s` whenever piping or capturing JSON because bare `pnpm` writes a lifecycle banner to stdout.
Default verbs: `overview`, `search <fragment>`, `bundle <Pattern> --format json`, `dep-tree <Pattern>`, `rules --pattern <Pattern>`, `scope-validate <Pattern> <design|implement>`.
If live CLI output disagrees with docs or memory, trust the live CLI.
For a full API demo run once: `bash scripts/api-capability-tour.sh`
EOF
)"

SKILL_BLOCK="$(cat <<'EOF'
[Load mandatory skills now]
Before proceeding, load all 3 mandatory skills NOW from the canonical repo-root paths:
- `.agents/skills/architect-base`
- `.agents/skills/architect-data-api`
- `.agents/skills/architect-sessions`
`.claude/skills/` symlinks into `.agents/skills/`; use `.agents/skills/` as the canonical path set.
EOF
)"

ADDITIONAL_CONTEXT="${CONTRACT_BLOCK}"$'\n\n'"${SKILL_BLOCK}"

if [[ "$SOURCE" != "resume" && "$SOURCE" != "clear" && "$SOURCE" != "compact" ]]; then
  LIVE_BLOCK="$(
    REPO_ROOT="$REPO_ROOT" python3 - <<'PY'
import os
import subprocess
import sys

repo_root = os.environ["REPO_ROOT"]
command = ["pnpm", "-s", "architect:query", "overview"]
fallback_header = "[Live overview unavailable]"

try:
    result = subprocess.run(
        command,
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=15,
    )
except subprocess.TimeoutExpired:
    sys.stdout.write(
        f"{fallback_header}\n"
        "`pnpm -s architect:query overview` timed out after 15s. "
        "Continue with the contract and mandatory skills above, then run it manually when the environment permits it."
    )
    raise SystemExit
except Exception as exc:
    sys.stdout.write(
        f"{fallback_header}\n"
        f"`pnpm -s architect:query overview` could not be executed: {exc}. "
        "Continue with the contract and mandatory skills above, then run it manually when the environment permits it."
    )
    raise SystemExit

stdout = (result.stdout or "").strip()
stderr = (result.stderr or "").strip()

if result.returncode == 0 and stdout:
    snapshot = stdout[:4000]
    sys.stdout.write("[Live overview snapshot]\n" + snapshot)
    raise SystemExit

detail = stdout or stderr or f"command exited {result.returncode} with no output"
detail = " ".join(detail.split())
if len(detail) > 600:
    detail = detail[:600]

sys.stdout.write(
    f"{fallback_header}\n"
    "`pnpm -s architect:query overview` failed or returned no output. "
    f"Reason: {detail}"
)
PY
  )"

  ADDITIONAL_CONTEXT="${ADDITIONAL_CONTEXT}"$'\n\n'"${LIVE_BLOCK}"
fi

ADDITIONAL_CONTEXT_JSON="$(
  ADDITIONAL_CONTEXT="$ADDITIONAL_CONTEXT" python3 - <<'PY'
import json
import os
import sys

sys.stdout.write(json.dumps(os.environ.get("ADDITIONAL_CONTEXT", "")))
PY
)"

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":%s}}' "$ADDITIONAL_CONTEXT_JSON"
