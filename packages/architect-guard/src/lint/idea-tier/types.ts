import type { LintSeverity } from '@libar-dev/architect-core';

export interface IdeaTierLintRule {
  readonly id: string;
  readonly severity: LintSeverity;
  readonly description: string;
}

export const IDEA_TIER_LINT_RULES = {
  lineBudget: {
    id: 'idea-tier-line-budget',
    severity: 'warning' as const,
    description:
      'Idea-tier specs should stay within the 30-line soft budget (excluding blank lines and comments)',
  },
  noScenarios: {
    id: 'idea-tier-no-scenarios',
    severity: 'warning' as const,
    description:
      'Idea-tier specs should not contain Scenario blocks — use rules-with-invariants only at this maturity',
  },
  noBackground: {
    id: 'idea-tier-no-background',
    severity: 'warning' as const,
    description:
      'Idea-tier specs should not contain Background blocks (especially Background: Deliverables) — deliverables emerge at plan-level',
  },
  ruleMissingInvariant: {
    id: 'idea-tier-rule-missing-invariant',
    severity: 'warning' as const,
    description:
      'Every Rule block in an idea-tier spec should declare an **Invariant:** in its description',
  },
  insufficientTags: {
    id: 'idea-tier-insufficient-tags',
    severity: 'warning' as const,
    description:
      'Idea-tier specs should declare the baseline tags (gate, pattern, status, maturity, product-area, parent — parent waived for @architect-level:epic|slice)',
  },
} as const satisfies Record<string, IdeaTierLintRule>;

export const IDEA_TIER_LINE_BUDGET = 30;

// Threshold is 5 because `@architect-level` (when present for epic/slice) is
// structural, not idea-tier metadata; the minimum explicit-tag set is gate,
// pattern, status, maturity, product-area.
export const IDEA_TIER_MIN_EXPLICIT_TAGS = 5;
