@architect
@architect-adr:014
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-adr-layer:infrastructure
@architect-adr-theme:projections
@architect-pattern:ADR014AgentReadSurface
@architect-status:completed
@architect-unlock-reason:Born-accepted-after-the-playground-proved-the-handle-and-the-code-retired-the-verb-CLI
@architect-uses:ADR006SingleReadModelArchitecture,ADR010DocumentationCompositionHelpers
Feature: ADR-014 - Scriptable Graph Handle as the Agent Read Surface

  **Context:**
  The agent-facing CLI grew to a 24-verb surface (plus a 29-method `query`
  passthrough and an 11-subcommand `arch` family) of pre-computed,
  per-question envelopes. A byte-level audit found ~89% of a full
  PatternGraph snapshot was precomputed views shaped for the lowest-priority
  sink (markdown), and a consumer-side experiment (the playground) showed an
  agent scripting ad-hoc cuts over the raw graph shapes spends roughly one
  fifth of the context of the verb API or grep, because the data stays
  in-process and only conclusions return. The verb surface was held up almost
  entirely by its own dogfood tests: outside them, exactly one invocation was
  operationally load-bearing (the `arch dangling` graph-integrity gate in
  `ci:verify`). The verb logic itself lives in `architect-projection`
  functions shared with the MCP server, which never imported the CLI. A cold
  fresh-context agent validated the handle end-to-end (a complete
  design-review slice with zero grep) before this decision was recorded.

  **Decision:**
  The agent read surface is the scriptable graph handle, not a verb wall.
  Agents answer questions by scripting plain JS over exposed, typed shapes —
  plus ordinary grep over annotated source — instead of calling one frozen
  verb per question.

  1. The `architect` bin is the graph-handle CLI. `architect q '<js>'`
     (argv or stdin) evaluates the caller's script with `g` — the live,
     in-process graph handle — in scope and prints the returned conclusion.
     Named commands (census, diff, blast, fan-in, drift, find, file, symbol,
     invariants, specs, maturity) are runnable documentation over the same
     handle, never a contract.

  2. The handle is two surfaces, never merged: the CURATED core (the
     annotated PatternGraph — editorial sparsity is its virtue) and the
     MECHANICAL substrate (a tsc walk of packages/*/src — exhaustiveness is
     its virtue). The substrate serves impact and curation-assist only; the
     architecture is never derived from the import graph — divergence between
     the two surfaces is curation, not drift.

  3. The handle exposes the complete, deeply frozen canonical PatternGraph
     as `g.graph` and the four deterministic FSM operations as `g.fsm`. It
     freezes only irreducible cross-source joins: the entry adapters
     (findByConcept, byFile, bySymbol — the grep-to-graph bridge), the spec
     bridge (invariantsOf, specsReverifying — maturity- and
     provenance-labeled), and blastRadius. Thin traversals over exposed
     fields (a groupBy, a transitive walk) stay scripts, deliberately —
     freezing them is how a verb wall rebuilds. Reusable algorithms that
     need the canonical graph, including dependency context and rule
     aggregation, remain named pure core functions rather than handle
     methods. There is no facade or query-envelope layer.

  4. The verb CLI is deleted, not deprecated (No-BC): the command families,
     the `query`/`arch` dispatchers, the REPL, their flag schemas, their
     dogfood features, and the CLI-vs-MCP parity test. A CLI command may be
     frozen only when a second MACHINE consumer needs its exact contract
     (ADR-010's second-caller bar). Exactly one clears the bar today:
     `architect dangling --baseline <path> --strict`, the CI graph-integrity
     gate.

  5. The MCP server keeps its stable typed tool surface. It is a different
     sink — the Studio embedded runtime and burst-mode agent access — with a
     genuine second machine consumer, and it consumes the same
     architect-projection functions directly. Retiring the CLI verbs does not
     touch it, and the handle does not replace it.

  6. The `q` evaluator runs the CALLER'S OWN code in-process (node:vm
     compilation, injected read-only graph + `inspect`/`execFileSync`/
     `REPO_ROOT` globals). It carries the same trust level as the shell that
     invoked it, like `node -e`; it is not a sandbox and must never be
     exposed to untrusted input. External untrusted input that reaches git
     (`blast <ref>`) is resolved to a verified commit SHA at the boundary
     (charset guard, --end-of-options, ^{commit} peel) rather than sanitized
     in place.

  7. The handle's decode schemas type what an agent should FIND, not what
     may exist: the authored-side schemas are deliberately loose (the trust
     boundary was `buildPatternGraph`, parse-once per ADR-009), because for
     an AI-native surface the type is the discovery surface — under-typing a
     shape hides a capability. The mechanical-core schema stays strict; this
     package owns that shape end-to-end.

  **Consequences:**
  Agents reach architectural conclusions in one script instead of stitching
  verb envelopes; cuts no verb pre-baked (blast radius of a diff, per-tier
  invariant provenance, epic membership) are one-liners. The cost is that
  pattern-state questions no longer have a memorizable verb-per-question
  menu — the skill teaches shapes and recipes instead. Deterministic gates
  survive as exactly one frozen CLI contract (dangling) plus guard and the
  generated-docs determinism gate; everything else that needs a stable typed
  answer belongs to the MCP/Studio surface, which keeps verbs by design.
