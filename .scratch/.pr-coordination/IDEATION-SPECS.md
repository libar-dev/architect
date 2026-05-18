# Documentation generation — ideation specs (index)

> Idea-tier specs shaped per
> [`../.claude/skills/architect-plan-session/SKILL.md`](../.claude/skills/architect-plan-session/SKILL.md)
> — five tags, one user story, one rule with one invariant, ≤30 lines per
> file, no narrative.
>
> **Location:** kept in `.pr-coordination/ideation-specs/` (not
> `architect/specs/ideas/`) so they don't sit on any implementation path
> while the maintainer validates intent. Once accepted, the files
> `git mv` into `architect/specs/ideas/` to enter the pattern graph.

## Spec inventory

- `ideation-specs/00-wiki-doc-generation.feature` — **epic** (parent)
- `ideation-specs/01-doc-source-fidelity.feature` — Capability 1
- `ideation-specs/02-one-source-multiple-audiences.feature` — Capability 2
- `ideation-specs/03-goal-oriented-navigation.feature` — Capability 3
- `ideation-specs/04-source-canonical.feature` — Capability 4

The four capabilities are siblings under the epic. None encodes an
implementation choice; each is a single business invariant.

## Validation gate — the PoC (out-of-band, not a spec)

The capabilities above are validated by producing **two example documents
about the documentation system itself, generated from one source**:

1. A full document for a human reader who needs the complete picture.
2. A condensed document for a reader (human or AI) who needs an oriented
   summary and can descend to detail on demand.

The two must share core content, differ in audience-appropriate depth,
each carry some content unique to its audience, and cross-link such that
the condensed reader can reach full detail.

**Maintainer's validation answer:** "Yes, this is what I want generated
for any future topic in this project." Anything other than yes ⇒
implementation does not proceed.

Detailed PoC scope and content-source coverage requirements: see
[`DECISIONS.md`](./DECISIONS.md) D4', D10 and
[`PROPOSED-DESIGN.md`](./PROPOSED-DESIGN.md) § 11.

## Maintainer validation marks

Mark each ✅ accept / ❌ reject / 🔁 reword. Until every line is ✅, the
design-tier session does not begin.

- [ ] `WikiDocGeneration` (epic) — campaign compositional intent
- [ ] `DocSourceFidelity` — Capability 1
- [ ] `OneSourceMultipleAudiences` — Capability 2
- [ ] `GoalOrientedNavigation` — Capability 3
- [ ] `SourceCanonical` — Capability 4
- [ ] PoC validation gate — two docs from one source, the "yes/no" question

## Out of scope at this tier

Per `architect-plan-session/SKILL.md` idea-tier anti-patterns: no
deliverables, no phases/effort/priority, no ADRs, no scenarios, no
implementation choices. Any of those, if needed, lifts in at candidate
tier and beyond — after the maintainer's validation marks are ✅.
