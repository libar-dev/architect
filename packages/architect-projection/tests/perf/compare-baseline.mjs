import { readFile } from 'node:fs/promises';
import path from 'node:path';

const perfDir = import.meta.dirname;
const repoRoot = path.resolve(perfDir, '../../../..');
const reportPath = path.join(
  repoRoot,
  '.sisyphus/evidence/task-3-business-rule-set-perf-report.json'
);
const baselinePath = path.join(perfDir, 'baselines/business-rule-set.baseline.json');

const HARD_BUDGETS = {
  project: { field: 'avgMs', budget: 1.5, unit: 'ms' },
  renderObject: { field: 'avgMs', budget: 1, unit: 'ms' },
  renderPretty: { field: 'avgMs', budget: 5, unit: 'ms' },
  isBundleP50Micros: { budget: 50, unit: 'us' },
};

const HOT_PATH_BUDGETS = {
  sessionContextBundle: { field: 'avgMs', budget: 2, unit: 'ms' },
  scopeReadinessReport: { field: 'avgMs', budget: 2, unit: 'ms' },
  documentationView: { field: 'avgMs', budget: 8, unit: 'ms' },
  requirementDigestAllAreas: { field: 'avgMs', budget: 8, unit: 'ms' },
  requirementDigestExecutable: { field: 'avgMs', budget: 8, unit: 'ms' },
  patternSatisfiesTag: { field: 'avgMs', budget: 8, unit: 'ms' },
  buildBoundedContext: { field: 'avgMs', budget: 8, unit: 'ms' },
  graphBuild: { field: 'avgMs', budget: 2000, unit: 'ms' },
};

const RENDER_MARKDOWN_BUNDLE_BUDGETS = {
  patterns: { field: 'avgMs', budget: 1, unit: 'ms' },
  decisions: { field: 'avgMs', budget: 1, unit: 'ms' },
  'requirements-executable': { field: 'avgMs', budget: 1, unit: 'ms' },
};

const BASELINE_MULTIPLIER = 1.5;

const [report, baseline] = await Promise.all([
  readJson(reportPath, 'perf report'),
  readJson(baselinePath, 'perf baseline'),
]);

const failures = [
  checkAverageMetric('project'),
  checkAverageMetric('renderObject'),
  checkAverageMetric('renderPretty'),
  checkScalarMetric('isBundleP50Micros'),
  ...Object.keys(HOT_PATH_BUDGETS).map((metricName) => checkHotPathAverageMetric(metricName)),
  ...checkRenderMarkdownBundleMetrics(report),
].filter((failure) => failure !== undefined);

if (failures.length > 0) {
  console.error(`Perf baseline check failed with ${String(failures.length)} exceeded budget(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read ${label} at ${filePath}: ${error.message}`);
  }
}

function checkAverageMetric(metricName) {
  const budget = HARD_BUDGETS[metricName];
  const label = `${metricName}.${budget.field}`;

  return checkBudget({
    label,
    actual: getMetricValue(report, metricName, budget.field),
    baselineValue: getMetricValue(baseline, metricName, budget.field),
    hardBudget: budget.budget,
    unit: budget.unit,
  });
}

function checkScalarMetric(metricName) {
  const budget = HARD_BUDGETS[metricName];

  return checkBudget({
    label: metricName,
    actual: getNumber(report, metricName),
    baselineValue: getNumber(baseline, metricName),
    hardBudget: budget.budget,
    unit: budget.unit,
  });
}

function checkHotPathAverageMetric(metricName) {
  const budget = HOT_PATH_BUDGETS[metricName];
  const label = `projectionHotPaths.${metricName}.${budget.field}`;

  return checkBudget({
    label,
    actual: getMetricValue(report.projectionHotPaths, metricName, budget.field),
    baselineValue: getMetricValue(baseline.projectionHotPaths, metricName, budget.field),
    hardBudget: budget.budget,
    unit: budget.unit,
  });
}

function checkRenderMarkdownBundleMetrics(source) {
  const expectedDocumentTypes = Object.keys(RENDER_MARKDOWN_BUNDLE_BUDGETS);
  const bundles = source.renderMarkdownBundles;

  if (bundles === undefined || typeof bundles !== 'object' || bundles === null) {
    throw new Error('Missing renderMarkdownBundles section in perf report');
  }

  const actualDocumentTypes = Object.keys(bundles).sort();
  const expectedSortedDocumentTypes = [...expectedDocumentTypes].sort();

  if (JSON.stringify(actualDocumentTypes) !== JSON.stringify(expectedSortedDocumentTypes)) {
    throw new Error(
      `Expected renderMarkdownBundles for ${expectedSortedDocumentTypes.join(', ')}, got ${actualDocumentTypes.join(', ')}`
    );
  }

  return expectedDocumentTypes.map((documentType) => {
    const budget = RENDER_MARKDOWN_BUNDLE_BUDGETS[documentType];
    const label = `renderMarkdownBundles.${documentType}.${budget.field}`;

    assertMetricFieldsPresent(bundles, documentType, ['p50Ms', 'iterations']);

    return checkBudget({
      label,
      actual: getMetricValue(bundles, documentType, budget.field),
      baselineValue: getMetricValue(baseline.renderMarkdownBundles, documentType, budget.field),
      hardBudget: budget.budget,
      unit: budget.unit,
    });
  });
}

function assertMetricFieldsPresent(metricsHost, key, fields) {
  for (const field of fields) {
    getMetricValue(metricsHost, key, field);
  }
}

/**
 * @param {object} args
 * @param {string} args.label
 * @param {number} args.actual
 * @param {number} args.baselineValue
 * @param {number} args.hardBudget
 * @param {string} args.unit
 * @returns {string | undefined}
 */
function checkBudget({ label, actual, baselineValue, hardBudget, unit }) {
  const baselineBudget = baselineValue * BASELINE_MULTIPLIER;
  const effectiveBudget = Math.min(hardBudget, baselineBudget);

  if (actual > effectiveBudget) {
    console.error(
      `FAIL ${label}: ${format(actual, unit)} exceeds ${format(effectiveBudget, unit)} ` +
        `(hard ${format(hardBudget, unit)}, baseline ${format(baselineBudget, unit)})`
    );
    return `${label} ${format(actual, unit)} > ${format(effectiveBudget, unit)}`;
  }

  console.log(
    `PASS ${label}: ${format(actual, unit)} <= ${format(effectiveBudget, unit)} ` +
      `(hard ${format(hardBudget, unit)}, baseline ${format(baselineBudget, unit)})`
  );
  return undefined;
}

function getMetricValue(source, metricName, fieldName) {
  const metric = source[metricName];
  if (metric === undefined || typeof metric !== 'object' || metric === null) {
    throw new Error(`Missing metric object: ${metricName}`);
  }

  return getNumber(metric, fieldName);
}

function getNumber(source, fieldName) {
  const value = source[fieldName];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Expected finite number at ${fieldName}`);
  }

  return value;
}

function format(value, unit) {
  return `${value.toFixed(4)} ${unit}`;
}
