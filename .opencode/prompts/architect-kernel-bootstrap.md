## Skills — mandatory

This is the Architect repository. Three skills carry the operational substance of this repo. Load all three.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ▶  architect-base        the vocabulary of the repo               │
│                            PatternGraph · tiers · FSM · ADRs        │
│                                                                     │
│   ▶  architect-data-api    deterministic answers about pattern      │
│                            state, deps, gates, transitions          │
│                                                                     │
│   ▶  architect-sessions    the spec-driven session lifecycle        │
│                            plan · design · implement · review       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**`architect-base`** hands you the PatternGraph + tag taxonomy, the four authored detail tiers plus executable + maintenance levels, the FSM lifecycle, value-transfer / spec-deletion doctrine, key ADRs, and the validation layers. The conceptual model that makes every other surface in this repo legible.

**`architect-data-api`** is the product itself and your context-gathering tool. The CLI (`pnpm architect:query <verb>`) gives you "what's the state of `X`?", "what does `X` depend on?", "is this transition legal?" — sub-second, deterministic, structured. Pattern exploration through the API is faster than file scanning and won't lie to you.

**`architect-sessions`** is the spec-driven delivery lifecycle — capture → design → implement → review → handoff — as one skill, with the per-session execution detail behind progressive disclosure so the always-loaded body stays small. Load it for any work that touches a spec, a pattern, or an FSM transition (which is nearly everything here).

Skill bodies are the canonical source. This file does not repeat what they say.
