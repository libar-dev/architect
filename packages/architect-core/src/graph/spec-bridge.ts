import type { MaturityLevel } from '../taxonomy/maturity-values.js';
import type {
  AtRiskSpec,
  AuthoredCore,
  Invariant,
  PatternNode,
  Provenance,
  Rule,
  Scenario,
} from './schema.js';
import { fileToPatternMap } from './view-support.js';

interface FeatureEntry {
  scenarios: Scenario[];
  rules: Rule[];
  ownerPattern?: string;
  readonly maturity: MaturityLevel;
}

interface InvariantSource {
  readonly pattern: string;
  readonly featureFile: string;
  readonly maturity: MaturityLevel;
}

interface SpecSource {
  readonly pattern: string;
  readonly maturity: MaturityLevel;
}

export interface SpecBridge {
  readonly invariantsOf: (patternOrFile: string) => readonly Invariant[];
  readonly specsReverifying: (filesOrPatterns: readonly string[]) => readonly AtRiskSpec[];
  readonly specsForPatterns: (patterns: ReadonlySet<string>) => readonly AtRiskSpec[];
}

function provenanceOf(featureFile: string): Provenance {
  return featureFile.includes('tests/features') ? 'executable' : 'authored';
}

function specMaturity(owner: MaturityLevel, provenance: Provenance): MaturityLevel {
  if (provenance === 'executable') return 'executable';
  return owner === 'executable' ? 'design' : owner;
}

function distillInvariant(description: string): string {
  const match = /\*\*Invariant:\*\*\s*([\s\S]*?)(?:\n\s*\*\*|$)/.exec(description);
  const text = (match?.[1] ?? description).replace(/\s+/g, ' ').trim();
  return text.length > 240 ? `${text.slice(0, 237)}…` : text;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createSpecBridge(
  authored: AuthoredCore,
  patternNodes: readonly PatternNode[],
): SpecBridge {
  const nodes = new Map(patternNodes.map((node) => [node.name, node]));
  const rawPatterns = new Map(authored.patterns.map((pattern) => [pattern.name, pattern]));
  const fileToPattern = fileToPatternMap(authored);
  const featureCohorts = new Map<string, string[]>();
  const features = new Map<string, FeatureEntry>();

  for (const node of patternNodes) {
    for (const featureFile of node.implementedBy) {
      const cohort = featureCohorts.get(featureFile) ?? [];
      cohort.push(node.name);
      featureCohorts.set(featureFile, cohort);
    }
  }
  for (const cohort of featureCohorts.values()) cohort.sort();

  function feature(file: string, owner: PatternNode): FeatureEntry {
    const current = features.get(file);
    if (current !== undefined) return current;
    const created = { scenarios: [], rules: [], maturity: owner.maturity };
    features.set(file, created);
    return created;
  }

  for (const pattern of authored.patterns) {
    const node = nodes.get(pattern.name);
    if (node === undefined) continue;
    for (const scenario of pattern.scenarios)
      feature(scenario.featureFile, node).scenarios.push(scenario);
    if (pattern.source?.file.endsWith('.feature') === true && pattern.rules.length > 0) {
      const entry = feature(pattern.source.file, node);
      entry.rules.push(...pattern.rules);
      entry.ownerPattern = pattern.name;
    }
  }

  function scenariosForRule(featureFile: string, rule: Rule): readonly string[] {
    if (rule.scenarioNames.length > 0) return rule.scenarioNames;
    const expectedTag = `rule:${slug(rule.name)}`;
    return (features.get(featureFile)?.scenarios ?? [])
      .filter((scenario) => scenario.tags.some((tag) => slug(tag) === slug(expectedTag)))
      .map((scenario) => scenario.scenarioName);
  }

  function invariantsOf(patternOrFile: string): readonly Invariant[] {
    const direct = fileToPattern.get(patternOrFile);
    const seeds = nodes.has(patternOrFile) ? [patternOrFile] : direct === undefined ? [] : [direct];
    const result: Invariant[] = [];
    const seen = new Set<string>();
    const emit = (rule: Rule, source: InvariantSource): void => {
      const key = `${source.featureFile}#${rule.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      const cohort = featureCohorts.get(source.featureFile);
      const provenance = provenanceOf(source.featureFile);
      result.push({
        rule: rule.name,
        text: distillInvariant(rule.description),
        pattern: source.pattern,
        maturity: specMaturity(source.maturity, provenance),
        provenance,
        featureFile: source.featureFile,
        provenByScenarios: scenariosForRule(source.featureFile, rule),
        ...(cohort !== undefined && cohort.length > 1 ? { cohort } : {}),
      });
    };
    for (const name of seeds) {
      const raw = rawPatterns.get(name);
      const node = nodes.get(name);
      if (raw === undefined || node === undefined) continue;
      if (raw.source?.file !== undefined) {
        for (const rule of raw.rules) {
          emit(rule, { pattern: name, featureFile: raw.source.file, maturity: node.maturity });
        }
      }
      for (const featureFile of node.implementedBy) {
        const entry = features.get(featureFile);
        if (entry === undefined) continue;
        for (const rule of entry.rules) {
          emit(rule, {
            pattern: entry.ownerPattern ?? name,
            featureFile,
            maturity: entry.maturity,
          });
        }
      }
    }
    return result.sort(
      (left, right) =>
        left.pattern.localeCompare(right.pattern) || left.rule.localeCompare(right.rule),
    );
  }

  function specsForPatterns(patterns: ReadonlySet<string>): readonly AtRiskSpec[] {
    const result: AtRiskSpec[] = [];
    const seen = new Set<string>();
    const emit = (scenario: Scenario, source: SpecSource): void => {
      const key = `${scenario.featureFile}#${scenario.scenarioName}`;
      if (seen.has(key)) return;
      seen.add(key);
      const cohort = featureCohorts.get(scenario.featureFile);
      const provenance = provenanceOf(scenario.featureFile);
      result.push({
        scenario: scenario.scenarioName,
        pattern: source.pattern,
        featureFile: scenario.featureFile,
        ...(scenario.line === undefined ? {} : { line: scenario.line }),
        maturity: specMaturity(source.maturity, provenance),
        provenance,
        semanticTags: scenario.semanticTags,
        ...(cohort !== undefined && cohort.length > 1 ? { cohort } : {}),
      });
    };
    for (const name of patterns) {
      const raw = rawPatterns.get(name);
      const node = nodes.get(name);
      if (raw === undefined || node === undefined) continue;
      for (const scenario of raw.scenarios)
        emit(scenario, { pattern: name, maturity: node.maturity });
      for (const featureFile of node.implementedBy) {
        const entry = features.get(featureFile);
        if (entry === undefined) continue;
        for (const scenario of entry.scenarios) {
          emit(scenario, { pattern: entry.ownerPattern ?? name, maturity: entry.maturity });
        }
      }
    }
    return result.sort(
      (left, right) =>
        left.featureFile.localeCompare(right.featureFile) ||
        left.scenario.localeCompare(right.scenario),
    );
  }

  function specsReverifying(filesOrPatterns: readonly string[]): readonly AtRiskSpec[] {
    const seeds = new Set<string>();
    for (const value of filesOrPatterns) {
      const pattern = fileToPattern.get(value) ?? (nodes.has(value) ? value : undefined);
      if (pattern !== undefined) seeds.add(pattern);
    }
    return specsForPatterns(seeds);
  }

  return { invariantsOf, specsReverifying, specsForPatterns };
}
