/**
 * @libar-docs
 * @libar-docs-pattern HandoffGeneratorImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIDesignSessionSupport
 * @libar-docs-uses ProcessStateAPI, MasterDataset, ContextFormatterImpl
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-target src/api/handoff-generator.ts
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## HandoffGenerator — Session-End State Summary
 *
 * Pure function that assembles a handoff document from ProcessStateAPI
 * and MasterDataset. Captures everything the next session needs to
 * continue work without context loss.
 */

import type { SessionType } from './context-assembler.js';
import type { ProcessStateAPI } from './process-state.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import { QueryApiError } from './types.js';
import { getPatternName } from './pattern-helpers.js';
import { isDeliverableComplete } from './context-formatter.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Handoff supports 'review' in addition to standard session types (DD-3). */
export type HandoffSessionType = SessionType | 'review';

export interface HandoffOptions {
  readonly patternName: string;
  readonly sessionType?: HandoffSessionType;
  readonly modifiedFiles?: readonly string[];
}

export interface HandoffSection {
  readonly title: string;
  readonly items: readonly string[];
}

export interface HandoffDocument {
  readonly pattern: string;
  readonly sessionType: HandoffSessionType;
  readonly date: string;
  readonly status: string | undefined;
  readonly sections: readonly HandoffSection[];
}

// ---------------------------------------------------------------------------
// Session Type Inference (DD-3)
// ---------------------------------------------------------------------------

function inferSessionType(status: string | undefined): HandoffSessionType {
  switch (status) {
    case 'active':
      return 'implement';
    case 'roadmap':
      return 'design';
    case 'completed':
      return 'review';
    case 'deferred':
      return 'design';
    default:
      return 'design';
  }
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

export function generateHandoff(
  api: ProcessStateAPI,
  _dataset: MasterDataset,
  options: HandoffOptions
): HandoffDocument {
  const { patternName, modifiedFiles } = options;

  const pattern = api.getPattern(patternName);
  if (pattern === undefined) {
    throw new QueryApiError('PATTERN_NOT_FOUND', `Pattern not found: "${patternName}"`);
  }

  const resolvedName = getPatternName(pattern);
  const sessionType = options.sessionType ?? inferSessionType(pattern.status);
  const date = new Date().toISOString().slice(0, 10);
  const sections: HandoffSection[] = [];

  // Deliverables split
  const deliverables = api.getPatternDeliverables(patternName);
  const completed = deliverables.filter((d) => isDeliverableComplete(d.status));
  const inProgress = deliverables.filter(
    (d) =>
      !isDeliverableComplete(d.status) &&
      d.status.toLowerCase() !== 'planned' &&
      d.status.toLowerCase() !== 'pending'
  );
  const remaining = deliverables.filter((d) => !isDeliverableComplete(d.status));

  // Completed deliverables
  if (completed.length > 0) {
    sections.push({
      title: 'COMPLETED',
      items: completed.map((d) => `[x] ${d.name} (${d.location})`),
    });
  }

  // In-progress deliverables
  if (inProgress.length > 0) {
    sections.push({
      title: 'IN PROGRESS',
      items: inProgress.map((d) => `[ ] ${d.name} (${d.location})`),
    });
  }

  // Files modified (DD-2: only when modifiedFiles provided)
  if (modifiedFiles !== undefined && modifiedFiles.length > 0) {
    sections.push({
      title: 'FILES MODIFIED',
      items: modifiedFiles,
    });
  }

  // Discovered items
  const gaps = pattern.discoveredGaps ?? [];
  const improvements = pattern.discoveredImprovements ?? [];
  const learnings = pattern.discoveredLearnings ?? [];
  if (gaps.length > 0 || improvements.length > 0 || learnings.length > 0) {
    const items: string[] = [];
    if (gaps.length > 0) {
      items.push(`Gaps: ${gaps.join(', ')}`);
    }
    if (improvements.length > 0) {
      items.push(`Improvements: ${improvements.join(', ')}`);
    }
    if (learnings.length > 0) {
      items.push(`Learnings: ${learnings.join(', ')}`);
    }
    sections.push({ title: 'DISCOVERED', items });
  }

  // Blockers (incomplete dependencies)
  const deps = api.getPatternDependencies(patternName);
  const incompleteDeps: string[] = [];
  if (deps !== undefined) {
    for (const depName of deps.dependsOn) {
      const depPattern = api.getPattern(depName);
      if (depPattern !== undefined && depPattern.status !== 'completed') {
        incompleteDeps.push(`${depName} (${depPattern.status ?? 'unknown'})`);
      }
    }
  }
  sections.push({
    title: 'BLOCKERS',
    items: incompleteDeps.length > 0 ? incompleteDeps : ['None'],
  });

  // Next session priorities (remaining deliverables in order)
  if (remaining.length > 0) {
    sections.push({
      title: 'NEXT SESSION',
      items: remaining.map((d, i) => `${String(i + 1)}. ${d.name} (${d.location})`),
    });
  }

  return {
    pattern: resolvedName,
    sessionType,
    date,
    status: pattern.status,
    sections,
  };
}

// ---------------------------------------------------------------------------
// Text Formatter (co-located per PDR-002 DD-7)
// ---------------------------------------------------------------------------

export function formatHandoff(doc: HandoffDocument): string {
  const sections: string[] = [];

  sections.push(
    `=== HANDOFF: ${doc.pattern} (${doc.sessionType}) ===\n` +
      `Date: ${doc.date} | Status: ${doc.status ?? 'unknown'}`
  );

  for (const section of doc.sections) {
    sections.push(`=== ${section.title} ===\n` + section.items.join('\n'));
  }

  return sections.join('\n\n') + '\n';
}
