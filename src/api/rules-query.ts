/**
 * @architect
 * @architect-core
 * @architect-pattern RulesQueryModule
 * @architect-status completed
 * @architect-implements ProcessAPILayeredExtraction
 * @architect-product-area DataAPI
 * @architect-uses BusinessRulesCodec, CodecHelpers
 *
 * ## RulesQueryModule - Business Rules Domain Query
 *
 * Pure query function for business rules extracted from Gherkin Rule: blocks.
 * Groups rules by product area, phase, and feature pattern.
 *
 * Target: src/api/rules-query.ts
 * See: DD-4 (ProcessAPILayeredExtraction)
 *
 * **When to Use:** When querying business rules and invariants from Gherkin specs via the `rules` CLI subcommand.
 */

import { parseBusinessRuleAnnotations } from '../renderable/codecs/helpers.js';
import type { BusinessRuleAnnotations } from '../renderable/codecs/helpers.js';
import { deduplicateScenarioNames } from '../renderable/codecs/business-rules.js';
import { QueryApiError } from './types.js';
import type { RuntimePatternGraph } from '../generators/pipeline/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface RulesFilters {
  productArea: string | null;
  patternName: string | null;
  onlyInvariants: boolean;
}

export interface RuleOutput {
  readonly name: string;
  readonly invariant: string | undefined;
  readonly rationale: string | undefined;
  readonly verifiedBy: readonly string[];
  readonly scenarioCount: number;
}

export interface RulesQueryResult {
  readonly productAreas: ReadonlyArray<{
    readonly productArea: string;
    readonly ruleCount: number;
    readonly invariantCount: number;
    readonly phases: ReadonlyArray<{
      readonly phase: string;
      readonly features: ReadonlyArray<{
        readonly pattern: string;
        readonly source: string;
        readonly rules: readonly RuleOutput[];
      }>;
    }>;
  }>;
  readonly totalRules: number;
  readonly totalInvariants: number;
  readonly allRuleNames: readonly string[];
  readonly hint?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Query Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Query business rules from the PatternGraph, grouped by product area,
 * phase, and feature pattern.
 *
 * DD-4: Pure function taking RuntimePatternGraph and RulesFilters.
 * All Map/Set construction lives here, not in the CLI handler.
 */
export function queryBusinessRules(
  dataset: RuntimePatternGraph,
  filters: RulesFilters
): RulesQueryResult {
  // Collect patterns with rules, applying filters
  let patternsWithRules = dataset.patterns.filter(
    (p) => p.rules !== undefined && p.rules.length > 0
  );

  if (filters.productArea !== null) {
    const area = filters.productArea.toLowerCase();
    patternsWithRules = patternsWithRules.filter((p) => p.productArea?.toLowerCase() === area);
  }

  if (filters.patternName !== null) {
    const name = filters.patternName.toLowerCase();
    patternsWithRules = patternsWithRules.filter((p) => p.name.toLowerCase() === name);
  }

  // Build structured output grouped by product area → phase → feature
  const areaMap = new Map<
    string,
    {
      features: Map<
        string,
        {
          pattern: string;
          source: string;
          phase: string;
          rules: RuleOutput[];
        }
      >;
    }
  >();

  let totalRules = 0;
  let totalInvariants = 0;
  const allRuleNames: string[] = [];

  for (const pattern of patternsWithRules) {
    const area = pattern.productArea ?? 'Platform';
    const phase =
      pattern.phase !== undefined
        ? `Phase ${String(pattern.phase)}`
        : (pattern.release ?? 'Uncategorized');

    if (!areaMap.has(area)) {
      areaMap.set(area, { features: new Map() });
    }
    const areaGroup = areaMap.get(area);
    if (areaGroup === undefined) {
      throw new Error(`Invariant violation: areaMap missing key "${area}" after set`);
    }

    const featureKey = `${phase}::${pattern.name}`;
    if (!areaGroup.features.has(featureKey)) {
      areaGroup.features.set(featureKey, {
        pattern: pattern.name,
        source: pattern.source.file,
        phase,
        rules: [],
      });
    }
    const feature = areaGroup.features.get(featureKey);
    if (feature === undefined) {
      throw new Error(`Invariant violation: features map missing key "${featureKey}" after set`);
    }

    // rules guaranteed non-empty by patternsWithRules filter above
    if (pattern.rules === undefined) {
      throw new Error(
        `Invariant violation: pattern "${pattern.name}" passed rules filter but has no rules`
      );
    }
    for (const rule of pattern.rules) {
      let annotations: BusinessRuleAnnotations;
      try {
        annotations = parseBusinessRuleAnnotations(rule.description);
      } catch (err) {
        throw new QueryApiError(
          'INVALID_ARGUMENT',
          `Failed to parse rule "${rule.name}" in "${pattern.name}": ${err instanceof Error ? err.message : String(err)}`
        );
      }

      if (filters.onlyInvariants && annotations.invariant === undefined) {
        continue;
      }

      feature.rules.push({
        name: rule.name,
        invariant: annotations.invariant,
        rationale: annotations.rationale,
        verifiedBy: deduplicateScenarioNames(rule.scenarioNames, annotations.verifiedBy),
        scenarioCount: rule.scenarioCount,
      });

      totalRules++;
      if (annotations.invariant !== undefined) {
        totalInvariants++;
      }
      allRuleNames.push(rule.name);
    }
  }

  // Build hint when filters match nothing
  let hint: string | undefined;
  if (totalRules === 0 && (filters.productArea !== null || filters.patternName !== null)) {
    const availableAreas = [
      ...new Set(
        dataset.patterns
          .filter((p) => p.rules !== undefined && p.rules.length > 0)
          .map((p) => p.productArea ?? 'Platform')
      ),
    ];
    hint =
      filters.productArea !== null
        ? `No rules found for product area "${filters.productArea}". Areas with rules: ${availableAreas.join(', ')}`
        : `No rules found for pattern "${String(filters.patternName)}".`;
  }

  // Build final grouped output
  const productAreas = [...areaMap.entries()].map(([areaName, areaGroup]) => {
    const phaseMap = new Map<
      string,
      Array<{ pattern: string; source: string; rules: RuleOutput[] }>
    >();

    let areaRuleCount = 0;
    let areaInvariantCount = 0;

    for (const feature of areaGroup.features.values()) {
      if (feature.rules.length === 0) continue;

      if (!phaseMap.has(feature.phase)) {
        phaseMap.set(feature.phase, []);
      }
      phaseMap.get(feature.phase)?.push({
        pattern: feature.pattern,
        source: feature.source,
        rules: feature.rules,
      });

      areaRuleCount += feature.rules.length;
      areaInvariantCount += feature.rules.filter((r) => r.invariant !== undefined).length;
    }

    const phases = [...phaseMap.entries()].map(([phaseName, features]) => ({
      phase: phaseName,
      features,
    }));

    return {
      productArea: areaName,
      ruleCount: areaRuleCount,
      invariantCount: areaInvariantCount,
      phases,
    };
  });

  return {
    productAreas: productAreas.filter((a) => a.ruleCount > 0),
    totalRules,
    totalInvariants,
    allRuleNames,
    ...(hint !== undefined ? { hint } : {}),
  };
}
