# Downstream PR note — taxonomy campaign

> Status: Final scope covers Waves 1, 2, 2.5, 3, and 4, plus bundled milestones M1 through M4. Last updated 2026-05-08.

Reviewers: this PR lands the full taxonomy and annotation campaign, not just the original Wave 1 cut set. It removes the cut taxonomy tags from normal package and plugin guidance, keeps top-level `context <pattern> --session <type>` as the session-context bundle command, confirms that the renamed architecture query surface is `arch bounded-context`, narrows `@architect-uses` to declared-pattern targets only, and keeps the file-backed dangling-reference baseline in the shipped validation flow.

Before reviewing consumer impact, read [`../../architect-claude-plugin/MIGRATION.md`](../../architect-claude-plugin/MIGRATION.md). Then keep these coordination notes open alongside it:

- [`../../../.pr-coordination/05-wave-1-finalization-and-merge-blockers.md`](../../../.pr-coordination/05-wave-1-finalization-and-merge-blockers.md)
- [`../../../.pr-coordination/06-doctrine-drift-fixes-spanning-waves.md`](../../../.pr-coordination/06-doctrine-drift-fixes-spanning-waves.md)
- [`../../../.pr-coordination/03-taxonomy-wave-2-residual-cuts.md`](../../../.pr-coordination/03-taxonomy-wave-2-residual-cuts.md)
- [`../../../.pr-coordination/04-doctrine-level-parent-resolution.md`](../../../.pr-coordination/04-doctrine-level-parent-resolution.md)
- [`../../../.pr-coordination/07-wave-3-annotation-backfill-and-pattern-cleanup.md`](../../../.pr-coordination/07-wave-3-annotation-backfill-and-pattern-cleanup.md)
- [`../../../.pr-coordination/08-wave-4-residual-cuts-mega-features-and-test-tree.md`](../../../.pr-coordination/08-wave-4-residual-cuts-mega-features-and-test-tree.md)

Consumer-facing callouts:

- Cut tags are no longer part of normal authored guidance.
- Top-level `context <pattern> --session <type>` remains the supported session-context bundle command.
- `arch bounded-context` is the supported bounded-context query surface. `arch context` is not the supported alias, and the rename does not remove top-level `context`.
- `@architect-uses` now names only declared patterns. Reverse or external relationship noise is derived, not authored.
- The dangling-reference baseline shipped in Wave 1 and is now queryable directly. `pnpm pkg:query -- arch dangling` stays raw for inspection, `pnpm pkg:query -- arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json` checks the committed baseline, and package validation enforces that committed baseline without requiring caller-owned `--strict` mode.

Migration framing to call out explicitly:

`MIGRATION.md` is the canonical cut and narrowing table for downstream readers. Keep it open beside the campaign briefs when reviewing hierarchy-axis changes, especially the retained-and-narrowed `@architect-level` and `@architect-parent` pair that Wave 2.5 reframed away from the maturity axis.

Read the shipped waves as one campaign, not isolated cleanup:

- Wave 2, [`../../../.pr-coordination/03-taxonomy-wave-2-residual-cuts.md`](../../../.pr-coordination/03-taxonomy-wave-2-residual-cuts.md), finishes the remaining taxonomy cuts.
- Wave 2.5, [`../../../.pr-coordination/04-doctrine-level-parent-resolution.md`](../../../.pr-coordination/04-doctrine-level-parent-resolution.md), resolves the retained hierarchy-axis semantics for `level` and `parent`.
- The Wave 1 finalization brief, [`../../../.pr-coordination/05-wave-1-finalization-and-merge-blockers.md`](../../../.pr-coordination/05-wave-1-finalization-and-merge-blockers.md), records the shipped disambiguation and dangling-baseline stance.
- The doctrine drift brief, [`../../../.pr-coordination/06-doctrine-drift-fixes-spanning-waves.md`](../../../.pr-coordination/06-doctrine-drift-fixes-spanning-waves.md), records the cross-wave doctrine repairs that landed with the bundled campaign.
- Wave 3, [`../../../.pr-coordination/07-wave-3-annotation-backfill-and-pattern-cleanup.md`](../../../.pr-coordination/07-wave-3-annotation-backfill-and-pattern-cleanup.md), picks up the annotation backfill and pattern cleanup work.
- Wave 4, [`../../../.pr-coordination/08-wave-4-residual-cuts-mega-features-and-test-tree.md`](../../../.pr-coordination/08-wave-4-residual-cuts-mega-features-and-test-tree.md), handles the remaining residual cuts, mega-feature splits, and test-tree work.
