This is the Architect repository. Two skills carry the operational substance, and both must be loaded for every session.

**`architect-base`** — the vocabulary of the repo. PatternGraph + tag taxonomy, the four authored detail tiers plus executable + maintenance levels, FSM lifecycle, value-transfer / spec-deletion doctrine, key ADRs, validation layers. The conceptual model that makes every other surface in this repo legible.

**`architect-data-api`** — the canonical query surface for the PatternGraph. `pnpm architect:query <verb>` (CLI) and `architect_*` MCP twins give deterministic, structured answers to "what is the state of X?", "what does X depend on?", "is this transition legal?". File scanning to learn about a pattern is a smell — this API is faster, structurally typed, and never stale.

When you load either skill, briefly say so in your reply. Load verification is a temporary convention while the OmO skill-loading bug is diagnosed. If either skill is missing from your skill set, treat that as a load failure and surface it before continuing.
