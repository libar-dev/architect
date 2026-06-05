### `.pr-coordination/` — bootstrap coordination residue, being retired

These files are **bootstrap-era campaign coordination** from when the refactored
architect package had no working delivery process. They are being **retired into the
live repo** — durable decisions to `architect/decisions/` ADRs/PDRs, doctrine and
heuristics to the skills, plan + sequencing to the specs — with **git history as the
archive** (no new markdown archive copy). The live repo (PatternGraph + executable
specs + ADRs + skills) is the source of truth; treat anything here as residue, not
canon. Retiring a coordination package at campaign close is the **normal lifecycle** of
the coordination doctrine below, not a contradiction of it.

Working in this folder:

- **Rescue-then-delete.** Before deleting a coordination file, move any still-unique
  value to its durable home (heuristics → the relevant skill; a decision → an ADR/PDR),
  then delete. Do **not** preserve campaign history, verification provenance, or
  "remaining work" bookkeeping — that is a `git log` question.
- **Retiring this folder is value transfer** — the same move as design-spec deletion:
  `.agents/skills/architect-sessions/references/ephemeral-spec-deletion.md`.

Do not add new content to this folder:

- **Do not add new durable state, doctrine, or recorded spec content here.** If you find
  live drift, fix it in its **owning** skill / spec / PRD / ADR — not by editing a
  coordination doc. The spec is the prompt; no wrapper "context"/"session-prep" docs.
- **Planning has a home in the spec ladder, not here.** idea → candidate → plan → design
  specs carry the plan and sequencing; the live consumer / blast-radius surface is a
  Data API query (`files <Pattern> --related`, `dep-tree`, `arch neighborhood`).
