#!/usr/bin/env bash
# SessionStart hook — injects the Architect API-first contract as session context.
# Zero-latency (static text, no queries). Training-wheels measure to counter the
# documented agent tendency to grep instead of using the Data API; remove once
# the API ergonomics (clean-stdout JSON, arch graph, package dimension) stabilize.
# Wired in .claude/settings.json. The capability tour it points to is tested.
cat <<'CONTRACT'
[Architect — API-first contract for this repo]
The Data API (`pnpm architect:query <verb>`) is your FIRST read surface. Reaching for
grep/Read to learn a pattern's state, deps, role, or rules is a smell — there is a verb.
API usage costs ~10–15× LESS context per task than file-scanning.

CRITICAL idiom — pipe JSON via `pnpm -s` (bare `pnpm` prints a banner to stdout that breaks `| jq`):
    pnpm -s architect:query bundle <Pattern> --format json | jq

Run the capability tour ONCE at the start of architecture work to see the surface:
    bash scripts/api-capability-tour.sh

Everyday verbs:
    overview · search <frag> · bundle <P> --format json · dep-tree <P> · rules --pattern <P>
    scope-validate <P> <design|implement> · arch neighborhood <P> · arch blocking · arch dangling --strict

Load the `architect-data-api` skill for verb shapes, JSON shapes, and known quirks.
The live CLI is canonical — when a doc or memory disagrees with `pnpm architect:query`, the CLI wins.
CONTRACT
