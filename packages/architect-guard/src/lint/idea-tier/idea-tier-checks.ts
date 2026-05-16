/**
 * Idea-tier soft lint checks. Scan raw `.feature` text and emit `warning`-only
 * violations for files detected as idea-tier — explicit `@architect-maturity:idea`
 * only. Parent requirement is waived for `@architect-level:epic|slice`.
 */
import type { LintViolation } from '@libar-dev/architect-core';
import {
  IDEA_TIER_LINE_BUDGET,
  IDEA_TIER_LINT_RULES,
  IDEA_TIER_MIN_EXPLICIT_TAGS,
} from './types.js';

const SCENARIO_LINE = /^\s*Scenario(?:\s+Outline)?:/;
const BACKGROUND_LINE = /^\s*Background:/;
const RULE_LINE = /^\s*Rule:\s*(.+)\s*$/;
const FEATURE_LINE = /^\s*Feature:/;
const INVARIANT_MARKER = /\*\*\s*Invariant\s*:\s*\*\*/i;

export type IdeaTierLevel = 'epic' | 'slice' | undefined;

export interface IdeaTierDetection {
  readonly isIdeaTier: boolean;
  readonly explicitArchitectTagCount: number;
  readonly hasParentTag: boolean;
  readonly level: IdeaTierLevel;
}

// A file is idea-tier when it carries an explicit `@architect-maturity:idea`.
// Files without any `@architect` gate are skipped entirely. We deliberately
// no longer infer idea-tier from `status:candidate` alone — legacy plan-tier
// candidate specs would be misclassified.
export function detectIdeaTier(lines: readonly string[]): IdeaTierDetection {
  let hasGate = false;
  let explicitMaturity: string | undefined;
  let explicitArchitectTagCount = 0;
  let hasParentTag = false;
  let level: string | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '') continue;
    // The Architect tag block is contiguous and ends at the Feature: line.
    if (line.startsWith('Feature:')) break;

    if (line === '@architect') {
      hasGate = true;
      explicitArchitectTagCount++;
      continue;
    }

    if (!line.startsWith('@architect-')) continue;

    explicitArchitectTagCount++;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const tag = line.slice('@architect-'.length, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (tag === 'maturity') {
      explicitMaturity = value.toLowerCase();
    } else if (tag === 'parent') {
      hasParentTag = true;
    } else if (tag === 'level') {
      const v = value.toLowerCase();
      if (v === 'epic' || v === 'slice') level = v;
    }
  }

  if (!hasGate) {
    return {
      isIdeaTier: false,
      explicitArchitectTagCount,
      hasParentTag,
      level: undefined,
    };
  }

  const ideaLevel: IdeaTierLevel = level === 'epic' || level === 'slice' ? level : undefined;
  // Detection now requires explicit @architect-maturity:idea — we no longer
  // infer idea-tier from `status:candidate` alone, because legacy plan-tier
  // candidate specs lack an explicit maturity tag and would otherwise produce
  // false-positive cascades through the idea-tier checks.
  if (explicitMaturity === 'idea') {
    return {
      isIdeaTier: true,
      explicitArchitectTagCount,
      hasParentTag,
      level: ideaLevel,
    };
  }

  return {
    isIdeaTier: false,
    explicitArchitectTagCount,
    hasParentTag,
    level: ideaLevel,
  };
}

export function checkLineBudget(
  lines: readonly string[],
  filePath: string
): readonly LintViolation[] {
  let meaningful = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '') continue;
    if (line.startsWith('#')) continue;
    meaningful++;
  }

  if (meaningful <= IDEA_TIER_LINE_BUDGET) return [];

  return [
    {
      rule: IDEA_TIER_LINT_RULES.lineBudget.id,
      severity: IDEA_TIER_LINT_RULES.lineBudget.severity,
      message: `Idea-tier spec has ${String(meaningful)} meaningful lines — 30-line soft budget exceeded. Trim detail or promote to plan-level.`,
      file: filePath,
      line: 1,
    },
  ];
}

function checkForbiddenLinePattern(
  lines: readonly string[],
  filePath: string,
  pattern: RegExp,
  rule: { readonly id: string; readonly severity: 'error' | 'warning' | 'info' },
  message: string
): readonly LintViolation[] {
  const violations: LintViolation[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    if (pattern.test(line)) {
      violations.push({
        rule: rule.id,
        severity: rule.severity,
        message,
        file: filePath,
        line: i + 1,
      });
    }
  }
  return violations;
}

export function checkNoScenarios(
  lines: readonly string[],
  filePath: string
): readonly LintViolation[] {
  return checkForbiddenLinePattern(
    lines,
    filePath,
    SCENARIO_LINE,
    IDEA_TIER_LINT_RULES.noScenarios,
    'Idea-tier spec contains a Scenario block. Idea-tier uses rules-with-invariants only — promote to plan-level for scenarios.'
  );
}

export function checkNoBackground(
  lines: readonly string[],
  filePath: string
): readonly LintViolation[] {
  return checkForbiddenLinePattern(
    lines,
    filePath,
    BACKGROUND_LINE,
    IDEA_TIER_LINT_RULES.noBackground,
    'Idea-tier spec contains a Background block. Deliverables and shared setup belong at plan-level or design-level.'
  );
}

// Every `Rule:` block must declare an `**Invariant:**` somewhere in its
// description before the next `Rule:`, `Scenario:`, or `Feature:` boundary.
export function checkRuleHasInvariant(
  lines: readonly string[],
  filePath: string
): readonly LintViolation[] {
  const violations: LintViolation[] = [];
  let currentRuleStartLine: number | null = null;
  let currentRuleTitle = '';
  let currentRuleHasInvariant = false;

  function flush(): void {
    if (currentRuleStartLine !== null && !currentRuleHasInvariant) {
      const title = currentRuleTitle.length > 0 ? ` "${currentRuleTitle}"` : '';
      violations.push({
        rule: IDEA_TIER_LINT_RULES.ruleMissingInvariant.id,
        severity: IDEA_TIER_LINT_RULES.ruleMissingInvariant.severity,
        message: `Rule${title} is missing an **Invariant:** declaration. Idea-tier rules should each carry an explicit invariant.`,
        file: filePath,
        line: currentRuleStartLine,
      });
    }
    currentRuleStartLine = null;
    currentRuleTitle = '';
    currentRuleHasInvariant = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    const ruleMatch = RULE_LINE.exec(line);
    if (ruleMatch !== null) {
      flush();
      currentRuleStartLine = i + 1;
      currentRuleTitle = (ruleMatch[1] ?? '').trim();
      currentRuleHasInvariant = false;
      continue;
    }

    if (SCENARIO_LINE.test(line) || FEATURE_LINE.test(line)) {
      flush();
      continue;
    }

    if (currentRuleStartLine !== null && INVARIANT_MARKER.test(line)) {
      currentRuleHasInvariant = true;
    }
  }

  flush();
  return violations;
}

// Threshold is on explicit tag count. Idea-tier detection requires an
// explicit `@architect-maturity:idea`, so the minimum baseline set is gate,
// pattern, status, maturity, product-area (parent waived for epic/slice).
export function checkTagMinimum(
  detection: IdeaTierDetection,
  filePath: string
): readonly LintViolation[] {
  if (detection.explicitArchitectTagCount >= IDEA_TIER_MIN_EXPLICIT_TAGS) {
    // Epics (top-of-chain) and slices (cross-cutting views) have no parent by design.
    if (!detection.hasParentTag && detection.level === undefined) {
      return [
        {
          rule: IDEA_TIER_LINT_RULES.insufficientTags.id,
          severity: IDEA_TIER_LINT_RULES.insufficientTags.severity,
          message:
            'Idea-tier spec is missing @architect-parent. Declare the parent pattern that this idea relates to (or set @architect-level:epic|slice if this is a top-of-chain or cross-cutting variant).',
          file: filePath,
          line: 1,
        },
      ];
    }
    return [];
  }

  return [
    {
      rule: IDEA_TIER_LINT_RULES.insufficientTags.id,
      severity: IDEA_TIER_LINT_RULES.insufficientTags.severity,
      message: `Idea-tier spec has only ${String(detection.explicitArchitectTagCount)} explicit @architect-* tag(s); expected at least ${String(IDEA_TIER_MIN_EXPLICIT_TAGS)} (gate, pattern, status, maturity, product-area; parent required unless @architect-level:epic|slice).`,
      file: filePath,
      line: 1,
    },
  ];
}

export function runIdeaTierChecks(content: string, filePath: string): readonly LintViolation[] {
  const lines = content.split('\n');
  const detection = detectIdeaTier(lines);
  if (!detection.isIdeaTier) return [];

  return [
    ...checkLineBudget(lines, filePath),
    ...checkNoScenarios(lines, filePath),
    ...checkNoBackground(lines, filePath),
    ...checkRuleHasInvariant(lines, filePath),
    ...checkTagMinimum(detection, filePath),
  ];
}
