## Skills — mandatory

This is the Architect repository. Three skills carry the operational substance of this repo. **`architect-base` is the mandatory first-load; `architect-graph-handle` loads on demand as THE read surface (ADR-014); `architect-sessions` loads for spec-driven work.**

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ▶  architect-base        the vocabulary of the repo               │
│                            PatternGraph · tiers · FSM · ADRs        │
│                                                                     │
│   ▶  architect-graph-handle  the read surface — script the live     │
│                              graph (state, slices, impact, gates)   │
│                                                                     │
│   ▶  architect-sessions    the spec-driven session lifecycle        │
│                            plan · design · implement · review       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**`architect-base`** hands you the PatternGraph + tag taxonomy, the four authored detail tiers plus executable + maintenance levels, the FSM lifecycle, value-transfer / spec-deletion doctrine, key ADRs, and the validation layers. The conceptual model that makes every other surface in this repo legible.

**`architect-graph-handle`** (load on demand) is the agent read surface (ADR-014 — the verb CLI is retired). Whenever you need graph state — a pattern's status/deps/rules, a file's owner + neighborhood, a symbol's architectural usage, the blast radius of a diff, what a pattern guarantees, which specs re-verify a change — one command (`pnpm architect:q '<js>'`) builds the live graph in-process and hands you `g` to script the cut, returning the conclusion, not the firehose. `g.graph` is the complete frozen PatternGraph and `g.fsm` contains the deterministic transition operations. Programmatic consumers import the Graph contract from `@libar-dev/architect-core/graph` and named pure read kernels from `@libar-dev/architect-core`. Ordinary grep stays the complement for content-level search; the `architect_*` MCP tools remain the stable typed surface for burst-mode/Studio use.

**`architect-sessions`** is the spec-driven delivery lifecycle — capture → design → implement → review → handoff — as one skill, with the per-session execution detail behind progressive disclosure so the always-loaded body stays small. Load it for any work that touches a spec, a pattern, or an FSM transition (which is nearly everything here).

Skill bodies are the canonical source. This file does not repeat what they say.
