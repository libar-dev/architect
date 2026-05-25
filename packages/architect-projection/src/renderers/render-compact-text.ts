/**
 * @architect
 * @architect-pattern CompactTextRenderer
 * @architect-status completed
 * @architect-role:codec
 * @architect-bounded-context:rendering
 * @architect-uses FragmentRendererDispatch, ProjectionFragmentSchema
 *
 * Renders projection fragments into compact plain text for AI-facing CLI/MCP output.
 * Dedicated render paths assert the high-signal context fragments; unknown fragment
 * kinds fall back to a generic key-value view instead of failing.
 *
 * ### When to Use
 *
 * - When MCP tools or CLI surfaces need compact, marker-delimited plain text for
 *   LLM consumption, especially for overview, session context, dependency,
 *   reading-list, scope-readiness, or handoff fragments.
 */
import {
  isDeliverableStatusComplete,
  type DeliverableStatus,
  VALID_DELIVERABLE_STATUS_SET,
} from '@libar-dev/architect-core';

import { humanizeKey, isPrimitive, stableStringify } from '../_internal/format-utils.js';
import {
  isBundle,
  type DependencyTree,
  type FileReadingList,
  type Fragment,
  type HandoffRecord,
  type OverviewDigest,
  type ProjectionBundle,
  type ScopeReadinessCheck,
  type ScopeReadinessReport,
  type SessionContextBundle,
} from '../fragments/index.js';

import type { ContentRichness } from '../disclosure/spec.js';

import { dispatchByKind, type KindTable } from './_shared/dispatch.js';
import type { ProjectionInput, RenderCompactOptions } from './types.js';

/** Blocking entries shown before collapsing to a "… and N more" pointer at non-full richness. */
const OVERVIEW_SUMMARY_BLOCKING_LIMIT = 5;

const COMPACT_NORMALIZERS: KindTable<string, RenderCompactOptions | undefined> = {
  OverviewDigest: (f, o) => renderOverviewDigest(f, o),
  SessionContextBundle: (f, o) => renderSessionContextBundle(f, o),
  DependencyTree: (f) => renderDependencyTree(f),
  FileReadingList: (f, o) => renderFileReadingList(f, o),
  ScopeReadinessReport: (f, o) => renderScopeReadinessReport(f, o),
  HandoffRecord: (f, o) => renderHandoffRecord(f, o),
};

export const renderCompactText = (
  input: ProjectionInput,
  options?: RenderCompactOptions,
): string => {
  if (isBundle(input)) {
    return renderBundle(input, options);
  }

  return renderFragment(input, options);
};

function renderBundle(
  bundle: ProjectionBundle<Fragment>,
  options: RenderCompactOptions | undefined,
): string {
  const renderedRoot = renderFragment(bundle.root, options).trimEnd();
  const childEntries = Object.entries(bundle.children).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  if (childEntries.length === 0) {
    return renderedRoot + '\n';
  }

  const sections = [renderedRoot];

  for (const [key, child] of childEntries) {
    sections.push(`${renderMarker(key, options)}\n${renderFragment(child, options).trimEnd()}`);
  }

  return sections.join('\n\n') + '\n';
}

function renderFragment(fragment: Fragment, options: RenderCompactOptions | undefined): string {
  return dispatchByKind(fragment, COMPACT_NORMALIZERS, renderMinimalStructured, options);
}

function renderOverviewDigest(
  overview: OverviewDigest,
  options: RenderCompactOptions | undefined,
): string {
  // Undefined richness renders at full fidelity (back-compatible for internal
  // callers and fixtures). The CLI/MCP read surface defaults to `summary`.
  const richness: ContentRichness = options?.richness ?? 'full';
  const sections: string[] = [];
  const { progress } = overview;

  sections.push(
    renderMarker('PROGRESS', options) +
      '\n' +
      `${String(progress.total)} delivery patterns (${String(progress.completed)} completed, ${String(progress.active)} active, ${String(progress.planned)} planned) = ${String(progress.percentage)}%` +
      (progress.candidate > 0
        ? `\n${String(progress.candidate)} candidate patterns excluded from delivery progress`
        : ''),
  );

  // name-only = the progress line alone — the most compact heads-up signal.
  if (richness === 'name-only') {
    return sections.join('\n\n') + '\n';
  }

  if (overview.activePhases.length > 0) {
    const lines = overview.activePhases.map((phase) => {
      const name = phase.name !== undefined ? `: ${phase.name}` : '';
      return `Phase ${String(phase.phase)}${name} (${String(phase.activeCount)} active)`;
    });
    sections.push(renderMarker('ACTIVE PHASES', options) + '\n' + lines.join('\n'));
  }

  if (overview.blocking.length > 0) {
    const showAll = richness === 'full';
    const shown = showAll
      ? overview.blocking
      : overview.blocking.slice(0, OVERVIEW_SUMMARY_BLOCKING_LIMIT);
    const lines = shown.map(
      (entry) => `${entry.pattern} blocked by: ${entry.blockedBy.join(', ')}`,
    );
    const hidden = overview.blocking.length - shown.length;
    if (hidden > 0) {
      lines.push(`... and ${String(hidden)} more — run \`arch blocking\``);
    }
    sections.push(renderMarker('BLOCKING', options) + '\n' + lines.join('\n'));
  }

  if (overview.generatedViews !== undefined && overview.generatedViews.length > 0) {
    sections.push(renderGeneratedViews(overview.generatedViews, richness, options));
  }

  if (overview.cliHints !== undefined && overview.cliHints.length > 0) {
    sections.push(overview.cliHints.join('\n'));
  }

  return sections.join('\n\n') + '\n';
}

function renderGeneratedViews(
  views: NonNullable<OverviewDigest['generatedViews']>,
  richness: ContentRichness,
  options: RenderCompactOptions | undefined,
): string {
  const header = renderMarker('GENERATED VIEWS', options);

  if (richness === 'full') {
    const width = Math.max(...views.map((view) => view.docType.length));
    const lines = views.map(
      (view) => `  ${view.docType.padEnd(width)}  ${view.summary} — \`${view.verb}\``,
    );
    return header + '\n' + lines.join('\n');
  }

  // summary / summary-with-references: one line naming the fetchable views.
  return (
    header +
    '\n' +
    `${String(views.length)} docs via \`documentation <type>\`: ${views.map((view) => view.docType).join(', ')}`
  );
}

function renderSessionContextBundle(
  bundle: SessionContextBundle,
  options: RenderCompactOptions | undefined,
): string {
  const sections: string[] = [];

  for (const meta of bundle.metadata) {
    const parts: string[] = [];
    if (meta.status !== undefined) parts.push(`Status: ${meta.status}`);
    if (meta.phase !== undefined) parts.push(`Phase: ${String(meta.phase)}`);
    parts.push(`Role: ${meta.role}`);

    sections.push(
      renderMarker(`PATTERN: ${meta.name}`, options) +
        '\n' +
        `${parts.join(' | ')}\n` +
        (meta.summary !== '' ? `${meta.summary}\n` : '') +
        `File: ${meta.file}`,
    );
  }

  if (bundle.specFiles.length > 0) {
    sections.push(renderMarker('SPEC', options) + '\n' + bundle.specFiles.join('\n'));
  }

  if (bundle.stubs.length > 0) {
    const lines = bundle.stubs.map((stub) =>
      stub.targetPath !== '' ? `${stub.stubFile} -> ${stub.targetPath}` : stub.stubFile,
    );
    sections.push(renderMarker('STUBS', options) + '\n' + lines.join('\n'));
  }

  if (bundle.dependencies.length > 0) {
    const lines = bundle.dependencies.map((dependency) => {
      const status = dependency.status !== undefined ? `[${dependency.status}]` : '[unknown]';
      const filePart = dependency.file !== '' ? ` ${dependency.file}` : '';
      return `${status} ${dependency.name} (${dependency.kind})${filePart}`;
    });

    let header = renderMarker('DEPENDENCIES', options);
    if (bundle.sharedDependencies.length > 0) {
      header += `\nShared: ${bundle.sharedDependencies.map((dependency) => dependency.name).join(', ')}`;
    }

    sections.push(header + '\n' + lines.join('\n'));
  }

  if (bundle.consumers.length > 0) {
    const lines = bundle.consumers.map(
      (consumer) => `${consumer.name} (${consumer.status ?? 'unknown'})`,
    );
    sections.push(renderMarker('CONSUMERS', options) + '\n' + lines.join('\n'));
  }

  if (bundle.architectureNeighbors.length > 0) {
    const context = bundle.architectureNeighbors[0]?.archContext ?? 'unknown';
    const lines = bundle.architectureNeighbors.map((neighbor) => {
      const status = neighbor.status ?? 'unknown';
      const role = neighbor.role !== undefined ? `, ${neighbor.role}` : '';
      return `${neighbor.name} (${status}${role})`;
    });
    sections.push(
      renderMarker(`ARCHITECTURE (context: ${context})`, options) + '\n' + lines.join('\n'),
    );
  }

  if (bundle.deliverables.length > 0) {
    const lines = bundle.deliverables.map((deliverable) => {
      const checkbox = isCompletedDeliverable(deliverable.status) ? '[x]' : '[ ]';
      return `${checkbox} ${deliverable.name} (${deliverable.location})`;
    });
    sections.push(renderMarker('DELIVERABLES', options) + '\n' + lines.join('\n'));
  }

  if (bundle.fsmByPattern.length > 1) {
    const lines = bundle.fsmByPattern.map(({ pattern, fsm }) => {
      const transitions =
        fsm.validTransitions.length > 0 ? fsm.validTransitions.join(', ') : 'none';
      return `${pattern}: Status: ${fsm.currentStatus} | Transitions: ${transitions} | Protection: ${fsm.protectionLevel}`;
    });
    sections.push(renderMarker('FSM', options) + '\n' + lines.join('\n'));
  } else if (bundle.fsm !== undefined) {
    const transitions =
      bundle.fsm.validTransitions.length > 0 ? bundle.fsm.validTransitions.join(', ') : 'none';
    sections.push(
      renderMarker('FSM', options) +
        '\n' +
        `Status: ${bundle.fsm.currentStatus} | Transitions: ${transitions} | Protection: ${bundle.fsm.protectionLevel}`,
    );
  } else if (bundle.fsmByPattern.length === 1) {
    const entry = bundle.fsmByPattern[0];
    if (entry) {
      const transitions =
        entry.fsm.validTransitions.length > 0 ? entry.fsm.validTransitions.join(', ') : 'none';
      sections.push(
        renderMarker('FSM', options) +
          '\n' +
          `${entry.pattern}: Status: ${entry.fsm.currentStatus} | Transitions: ${transitions} | Protection: ${entry.fsm.protectionLevel}`,
      );
    }
  }

  if (bundle.testFiles.length > 0) {
    sections.push(renderMarker('TEST FILES', options) + '\n' + bundle.testFiles.join('\n'));
  }

  return sections.join('\n\n') + '\n';
}

function renderDependencyTree(tree: DependencyTree): string {
  const lines: string[] = [];

  for (const node of tree.nodes) {
    renderDependencyTreeNode(node, 0, lines);
  }

  return lines.join('\n') + '\n';
}

function renderDependencyTreeNode(
  node: DependencyTree['nodes'][number],
  depth: number,
  lines: string[],
): void {
  const indent = depth > 0 ? '  '.repeat(depth) + '-> ' : '';
  const phase = node.phase !== undefined ? `${String(node.phase)}, ` : '';
  const status = node.status ?? 'unknown';
  const focal = node.isFocal ? ' <- YOU ARE HERE' : '';

  lines.push(`${indent}${node.name} (${phase}${status})${focal}`);

  if (node.truncated) {
    const truncIndent = '  '.repeat(depth + 1) + '-> ';
    lines.push(`${truncIndent}... (depth limit reached)`);
    return;
  }

  for (const child of node.children) {
    renderDependencyTreeNode(child, depth + 1, lines);
  }
}

function renderFileReadingList(
  list: FileReadingList,
  options: RenderCompactOptions | undefined,
): string {
  const sections: string[] = [];

  if (list.primary.length > 0) {
    sections.push(renderMarker('PRIMARY', options) + '\n' + list.primary.join('\n'));
  }

  if (list.completedDeps.length > 0) {
    sections.push(
      renderMarker('COMPLETED DEPENDENCIES', options) + '\n' + list.completedDeps.join('\n'),
    );
  }

  if (list.roadmapDeps.length > 0) {
    sections.push(
      renderMarker('ROADMAP DEPENDENCIES', options) + '\n' + list.roadmapDeps.join('\n'),
    );
  }

  if (list.architectureNeighbors.length > 0) {
    sections.push(
      renderMarker('ARCHITECTURE NEIGHBORS', options) +
        '\n' +
        list.architectureNeighbors.join('\n'),
    );
  }

  return sections.join('\n\n') + '\n';
}

function renderScopeReadinessReport(
  report: ScopeReadinessReport,
  options: RenderCompactOptions | undefined,
): string {
  const sections: string[] = [];

  sections.push(
    renderMarker(`SCOPE VALIDATION: ${report.pattern} (${report.sessionType})`, options),
  );

  const checkLines = report.checks.map((check) => {
    const legacySeverity = renderLegacyCheckSeverity(check);
    const detail = check.details ?? '';
    return detail === ''
      ? `[${legacySeverity}] ${check.label}`
      : `[${legacySeverity}] ${check.label}: ${detail}`;
  });
  sections.push(renderMarker('CHECKLIST', options) + '\n' + checkLines.join('\n'));

  const blockedChecks = report.checks.filter(
    (check) => renderLegacyCheckSeverity(check) === 'BLOCKED',
  );
  const warningChecks = report.checks.filter(
    (check) => renderLegacyCheckSeverity(check) === 'WARN',
  );

  let verdictText: string;
  if (report.verdict === 'BLOCKED') {
    verdictText =
      `BLOCKED: ${String(blockedChecks.length)} blocker(s) prevent ${report.sessionType} session` +
      '\n' +
      blockedChecks.map((check) => `- ${check.label}: ${check.details ?? 'Blocked'}`).join('\n');
  } else if (report.verdict === 'WARN') {
    verdictText = `READY (with ${String(warningChecks.length)} warning(s)): ${report.sessionType} session can proceed`;
  } else {
    verdictText = `READY: All checks passed for ${report.sessionType} session`;
  }

  sections.push(renderMarker('VERDICT', options) + '\n' + verdictText);

  return sections.join('\n\n') + '\n';
}

function renderLegacyCheckSeverity(check: ScopeReadinessCheck): 'PASS' | 'WARN' | 'BLOCKED' {
  if (check.passed) {
    return 'PASS';
  }

  if (check.severity === 'warning') {
    return 'WARN';
  }

  return 'BLOCKED';
}

function renderHandoffRecord(
  handoff: HandoffRecord,
  options: RenderCompactOptions | undefined,
): string {
  const sections: string[] = [];
  const headerLines = [
    renderMarker(`HANDOFF: ${handoff.pattern} (${handoff.sessionType})`, options),
  ];

  if (handoff.status !== undefined) {
    headerLines.push(`Status: ${handoff.status}`);
  }

  sections.push(headerLines.join('\n'));

  if (handoff.completed.length > 0) {
    sections.push(renderMarker('COMPLETED', options) + '\n' + handoff.completed.join('\n'));
  }

  if (handoff.inProgress.length > 0) {
    sections.push(renderMarker('IN PROGRESS', options) + '\n' + handoff.inProgress.join('\n'));
  }

  if (handoff.filesModified.length > 0) {
    sections.push(
      renderMarker('FILES MODIFIED', options) + '\n' + handoff.filesModified.join('\n'),
    );
  }

  if (handoff.discovered.length > 0) {
    sections.push(renderMarker('DISCOVERED', options) + '\n' + handoff.discovered.join('\n'));
  }

  sections.push(
    renderMarker('BLOCKERS', options) +
      '\n' +
      (handoff.blockers.length > 0 ? handoff.blockers.join('\n') : 'None'),
  );

  if (handoff.nextSession !== '') {
    sections.push(renderMarker('NEXT SESSION', options) + '\n' + handoff.nextSession);
  }

  return sections.join('\n\n') + '\n';
}

function renderMinimalStructured(
  fragment: Fragment,
  options: RenderCompactOptions | undefined,
): string {
  const sections: string[] = [renderMarker(fragment.kind, options)];

  for (const [key, value] of Object.entries(fragment).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (key === 'kind' || value === undefined) {
      continue;
    }

    if (isPrimitive(value)) {
      sections.push(`${humanizeKey(key)}: ${String(value)}`);
      continue;
    }

    if (Array.isArray(value) && value.every(isPrimitive)) {
      sections.push(renderMarker(humanizeKey(key), options) + '\n' + value.map(String).join('\n'));
      continue;
    }

    if (Array.isArray(value)) {
      sections.push(
        renderMarker(humanizeKey(key), options) +
          '\n' +
          value.map((entry) => stableStringify(entry)).join('\n'),
      );
      continue;
    }

    sections.push(renderMarker(humanizeKey(key), options) + '\n' + stableStringify(value));
  }

  return sections.join('\n\n') + '\n';
}

function renderMarker(title: string, options: RenderCompactOptions | undefined): string {
  const separator = options?.sectionSeparator ?? '===';

  if (separator === 'none') {
    return title;
  }

  return `${separator} ${title} ${separator}`;
}

function isCompletedDeliverable(status: string): boolean {
  if (!VALID_DELIVERABLE_STATUS_SET.has(status)) {
    return false;
  }

  return isDeliverableStatusComplete(status as DeliverableStatus);
}
