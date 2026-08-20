import { resolve } from 'node:path';

import { z } from 'zod';

export const GRAPH_HANDLE_BATTERY_SCRIPT = `
const dangling = g.driftFlags(() => true).dangling.length;
const specs = g.specsReverifying(g.patterns.map((p) => p.name));
const incoherent =
  specs.filter((s) => s.provenance === 'executable' && s.maturity !== 'executable').length +
  specs.filter((s) => s.provenance === 'authored' && s.maturity === 'executable').length;
const adapters =
  g.bySymbol('ProjectionBundle').definedIn.length > 0 && g.findByConcept('taxonomy').length > 0;
const specBridge = g.patterns
  .filter((p) => p.implementedBy.length > 0)
  .slice(0, 50)
  .some((p) => g.invariantsOf(p.name).length > 0);
return JSON.stringify({ dangling, incoherent, adapters, specBridge });
`;

const BatterySchema = z.strictObject({
  dangling: z.number(),
  incoherent: z.number(),
  adapters: z.boolean(),
  specBridge: z.boolean(),
});

const MigratedHandleSchema = z.strictObject({
  hasApi: z.literal(false),
  hasFsm: z.literal('function'),
  frozen: z.literal(true),
  deferred: z.literal(true),
});

const StrictDanglingSchema = z.strictObject({
  baselinePath: z.string(),
  written: z.literal(false),
  strict: z.literal(true),
  drift: z.literal(false),
  baselineCount: z.number(),
  currentCount: z.number(),
  addedCount: z.number(),
  removedCount: z.number(),
  added: z.array(z.unknown()),
  removed: z.array(z.unknown()),
  current: z.array(z.unknown()),
});

export const parseBattery = (output: string) => BatterySchema.parse(JSON.parse(output));
export const parseMigratedHandle = (output: string) =>
  MigratedHandleSchema.parse(JSON.parse(output));
export const parseStrictDangling = (output: string) =>
  StrictDanglingSchema.parse(JSON.parse(output));

export const EXPECTED_STRICT_DANGLING = {
  baselinePath: resolve('packages/architect-guard/src/lint/dangling-baseline.json'),
  written: false,
  strict: true,
  drift: false,
  baselineCount: 0,
  currentCount: 0,
  addedCount: 0,
  removedCount: 0,
  added: [],
  removed: [],
  current: [],
} as const;
