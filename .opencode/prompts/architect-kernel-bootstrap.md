## Skills — mandatory

This is the Architect repository. Four skills carry the operational substance of this repo. **`architect-base` is the mandatory first-load; `architect-sessions` loads for spec-driven work; `architect-data-api` and `architect-graph-handle` load on demand** — the two read surfaces (the canonical `pnpm architect:query` verbs, and the agent-sink live-graph handle), pulled in when you need them, not unconditionally at startup.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ▶  architect-base        the vocabulary of the repo               │
│                            PatternGraph · tiers · FSM · ADRs        │
│                                                                     │
│   ▶  architect-data-api    deterministic answers about pattern      │
│                            state, deps, gates, transitions          │
│                                                                     │
│   ▶  architect-graph-handle  architectural cuts the verbs           │
│                              don't pre-bake; script the graph       │
│                                                                     │
│   ▶  architect-sessions    the spec-driven session lifecycle        │
│                            plan · design · implement · review       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**`architect-base`** hands you the PatternGraph + tag taxonomy, the four authored detail tiers plus executable + maintenance levels, the FSM lifecycle, value-transfer / spec-deletion doctrine, key ADRs, and the validation layers. The conceptual model that makes every other surface in this repo legible.

**`architect-data-api`** (load on demand, not auto-loaded at startup) is the product itself and your context-gathering tool. The CLI (`pnpm architect:query <verb>`) gives you "what's the state of `X`?", "what does `X` depend on?", "is this transition legal?" — sub-second, deterministic, structured. Pattern exploration through the API is faster than file scanning and won't lie to you.

**`architect-graph-handle`** (load on demand) is the agent-sink read surface — the complement to the verbs. When you'd otherwise grep across files for an architectural slice the verbs don't pre-bake (a file's owner + neighborhood, a symbol's architectural usage, the blast radius of a diff, what a pattern guarantees, which specs re-verify a change), one command (`pnpm playground:q '<js>'`) builds the live graph in-process and hands you `g` to script the cut — returning the conclusion, not the firehose. The verbs stay canonical for pattern state; reach here to navigate and reshape graph cuts no single verb produces.

**`architect-sessions`** is the spec-driven delivery lifecycle — capture → design → implement → review → handoff — as one skill, with the per-session execution detail behind progressive disclosure so the always-loaded body stays small. Load it for any work that touches a spec, a pattern, or an FSM transition (which is nearly everything here).

Skill bodies are the canonical source. This file does not repeat what they say.
