import { z } from 'zod';

import { AcceptedStatusSchema } from '../domain-enums.js';
import type { MaturityLevel } from '../taxonomy/maturity-values.js';

export const SymbolNodeSchema = z.strictObject({
  id: z.string(),
  file: z.string(),
  name: z.string(),
  kind: z.enum(['function', 'class', 'interface', 'type', 'enum', 'const', 'default', 'reexport']),
  pkg: z.string(),
});

export const ImportEdgeSchema = z.strictObject({
  fromFile: z.string(),
  toFile: z.string(),
  symbol: z.string().nullable(),
  kind: z.enum(['named', 'default', 'namespace']),
  typeOnly: z.boolean(),
  crossPkg: z.boolean(),
});

export const MechanicalCoreSchema = z.strictObject({
  version: z.literal('1.0.0'),
  head: z.string(),
  fileCount: z.number().int().nonnegative(),
  symbols: z.array(SymbolNodeSchema),
  edges: z.array(ImportEdgeSchema),
  unresolved: z.array(z.strictObject({ fromFile: z.string(), spec: z.string() })),
});

export type SymbolNode = z.infer<typeof SymbolNodeSchema>;
export type ImportEdge = z.infer<typeof ImportEdgeSchema>;
export type MechanicalCore = z.infer<typeof MechanicalCoreSchema>;

export const ScenarioSchema = z.looseObject({
  featureFile: z.string(),
  featureName: z.string().optional(),
  scenarioName: z.string().default(''),
  steps: z.array(z.looseObject({ keyword: z.string(), text: z.string() })).default([]),
  tags: z.array(z.string()).default([]),
  semanticTags: z.array(z.string()).default([]),
  layer: z.string().optional(),
  line: z.number().optional(),
});

export const RuleSchema = z.looseObject({
  name: z.string(),
  description: z.string().default(''),
  scenarioCount: z.number().default(0),
  scenarioNames: z.array(z.string()).default([]),
});

export type Scenario = z.infer<typeof ScenarioSchema>;
export type Rule = z.infer<typeof RuleSchema>;

export const AuthoredPatternSchema = z.looseObject({
  name: z.string(),
  status: AcceptedStatusSchema,
  source: z.looseObject({ file: z.string() }).optional(),
  role: z.string().optional(),
  boundedContext: z.string().optional(),
  level: z.string().optional(),
  parent: z.string().optional(),
  directive: z
    .looseObject({ tags: z.array(z.string()).default([]), description: z.string().optional() })
    .optional(),
  whenToUse: z.array(z.string()).default([]),
  productArea: z.string().optional(),
  scenarios: z.array(ScenarioSchema).default([]),
  rules: z.array(RuleSchema).default([]),
});

export type AuthoredPattern = z.infer<typeof AuthoredPatternSchema>;

export const AuthoredEdgeSchema = z.looseObject({
  uses: z.array(z.string()).default([]),
  usedBy: z.array(z.string()).default([]),
  implementedBy: z.array(z.looseObject({ file: z.string().optional() })).default([]),
  implementsPatterns: z.array(z.string()).default([]),
  enforcesDecisions: z.array(z.string()).default([]),
});

export const AuthoredCoreSchema = z.looseObject({
  patterns: z.array(AuthoredPatternSchema),
  relationshipIndex: z.record(z.string(), AuthoredEdgeSchema),
});

export type AuthoredCore = z.infer<typeof AuthoredCoreSchema>;
export type Provenance = 'executable' | 'authored';

export interface PatternNode {
  readonly name: string;
  readonly status: string;
  readonly maturity: MaturityLevel;
  readonly role?: string | undefined;
  readonly boundedContext?: string | undefined;
  readonly productArea?: string | undefined;
  readonly sourceFile?: string | undefined;
  readonly level?: string | undefined;
  readonly parent?: string;
  readonly children: readonly string[];
  readonly uses: readonly string[];
  readonly usedBy: readonly string[];
  readonly implementedBy: readonly string[];
  readonly implements: readonly string[];
  readonly enforcesDecisions: readonly string[];
  readonly ruleCount: number;
  readonly scenarioCount: number;
}

export interface Invariant {
  readonly rule: string;
  readonly text: string;
  readonly pattern: string;
  readonly maturity: MaturityLevel;
  readonly provenance: Provenance;
  readonly featureFile: string;
  readonly provenByScenarios: readonly string[];
  readonly cohort?: readonly string[];
}

export interface AtRiskSpec {
  readonly scenario: string;
  readonly pattern: string;
  readonly featureFile: string;
  readonly line?: number;
  readonly maturity: MaturityLevel;
  readonly provenance: Provenance;
  readonly semanticTags: readonly string[];
  readonly cohort?: readonly string[];
}
