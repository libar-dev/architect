# Self-Contained Kernel (anti-anecdote rule)

The `_shared/` doctrine kernel is **self-contained**. Every load-bearing
claim lives inside the kernel and is restated, not linked. External
sources may be cited as **provenance** (where the rule was originally
derived from, with a verification date) but never as **authority** —
canonical doctrine lives here, in plain Markdown, in this folder.

This file anchors two rules: the **anti-anecdote rule** below, and the
**self-containment rule** captured by the structure of every other
`_shared/*.md` file.

## Anti-anecdote rule

When you encounter a sample-derived finding (an ad-hoc
session-handoff note, a snapshot folder with a SHA suffix, an
n=2 "we tried this twice and it worked" worklog, or any similar
narrow-sample artifact) that appears to contradict a kernel rule:

1. **Treat the kernel as correct.** The rule was paraphrased
   intentionally; if the sample disagrees, the sample is anecdote.
2. **Treat the sample as anecdote** — useful for understanding why the
   rule exists, but not authoritative for what the rule is.
3. If the kernel is silent on a question that the sample addresses,
   the sample's finding is **provisional** — flag it for the next
   kernel revision rather than encoding it inline.

This rule keeps doctrine drift bounded. Skill bodies may evolve faster
than the kernel; both may evolve faster than the underlying CLI/MCP and
the architect package's own `docs/` tree. Pin authority to the kernel
and you have one thing to keep right.

## Self-containment rule

Every `_shared/*.md` file:

1. **States its rules inline.** No "see X for the full rule." If a rule
   is load-bearing, it lives in the kernel in full.
2. **Cites siblings via relative links** when one kernel doc builds on
   another (e.g. `value-transfer.md` builds on `annotation-ownership.md`).
3. **Records provenance, not authority.** A `## Provenance` footer (when
   useful) names the external doc the rule was derived from, with a
   verification note. The footer is informational; the kernel content
   does not depend on the external doc continuing to exist.
4. **Does not paraphrase external docs verbatim** — paraphrase carefully
   and adapt to plugin-internal context. Verbatim copies create
   review-time false-positive churn when the upstream doc evolves.

The earlier draft of this file inverted point 4 ("avoid paraphrasing the
canonical source verbatim") in a way that contradicted the
self-containment goal. The corrected rule is above.

## Provenance (informational, verified at commit time)

The kernel's content was originally derived from the following sources.
The kernel does not depend on any of them remaining unchanged or even
remaining present.

- **Tag taxonomy** — derived live via `architect taxonomy --format json`
  (CLI output, not a doc). Re-verify with
  `pnpm architect:query taxonomy --format json | jq '.root.tags | length'`.
- **Process-Guard FSM transitions** — fully inlined in
  [`./fsm-transitions.md`](./fsm-transitions.md). The kernel is the
  single source of truth; no external doc dependency.
- **Annotation ownership policy** — derived from the methodology doctrine
  practiced across the package family, inlined in
  [`./annotation-ownership.md`](./annotation-ownership.md). The kernel
  is now the single source of truth for the policy.
- **Rule-block template** — the 4-field convention (`Rule:` /
  `**Invariant:**` / `**Rationale:**` / `**Verified by:**`) is fully
  inlined in [`./rule-block-template.md`](./rule-block-template.md).
- **Four-tier ladder** — fully inlined in
  [`./four-tier-ladder.md`](./four-tier-ladder.md).
- **Refactoring carve-out** — the rule "when backfilling coverage for
  code that already exists, skip directly to design or executable tier;
  never via plan-level" is inlined in
  [`./spec-pattern-relationships.md`](./spec-pattern-relationships.md)
  with a parenthetical `formal-spec/08-spec-evolution.md` provenance note.

If the kernel ever needs deeper background that does not fit a kernel
file, link the external source at the **point of use** with a
verification date — never as a stand-in for inlining the rule itself.
