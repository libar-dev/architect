/**
 * @libar-docs
 * @libar-docs-pattern ContextFormatterImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIContextAssembly
 * @libar-docs-uses ContextAssemblerImpl
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## ContextFormatter — Plain Text Renderer for Context Bundles
 *
 * First plain-text formatter in the codebase. All other rendering goes
 * through the Codec/RenderableDocument/UniversalRenderer markdown pipeline.
 * Context bundles are rendered as compact structured text with === section
 * markers for easy AI parsing (see ADR-008).
 */
import { isDeliverableStatusComplete } from '../taxonomy/deliverable-status.js';
// ---------------------------------------------------------------------------
// Bundle Formatter
// ---------------------------------------------------------------------------
export function formatContextBundle(bundle) {
    const sections = [];
    // Metadata (always present)
    for (const meta of bundle.metadata) {
        const parts = [];
        if (meta.status !== undefined)
            parts.push(`Status: ${meta.status}`);
        if (meta.phase !== undefined)
            parts.push(`Phase: ${String(meta.phase)}`);
        parts.push(`Category: ${meta.category}`);
        sections.push(`=== PATTERN: ${meta.name} ===\n` +
            `${parts.join(' | ')}\n` +
            (meta.summary !== '' ? `${meta.summary}\n` : '') +
            `File: ${meta.file}`);
    }
    // Spec files
    if (bundle.specFiles.length > 0) {
        sections.push('=== SPEC ===\n' + bundle.specFiles.join('\n'));
    }
    // Stubs
    if (bundle.stubs.length > 0) {
        const lines = bundle.stubs.map((s) => s.targetPath !== '' ? `${s.stubFile} -> ${s.targetPath}` : s.stubFile);
        sections.push('=== STUBS ===\n' + lines.join('\n'));
    }
    // Dependencies
    if (bundle.dependencies.length > 0) {
        const lines = bundle.dependencies.map((d) => {
            const status = d.status !== undefined ? `[${d.status}]` : '[unknown]';
            const filePart = d.file !== '' ? ` ${d.file}` : '';
            return `${status} ${d.name} (${d.kind})${filePart}`;
        });
        let header = '=== DEPENDENCIES ===';
        if (bundle.sharedDependencies.length > 0) {
            header += `\nShared: ${bundle.sharedDependencies.join(', ')}`;
        }
        sections.push(header + '\n' + lines.join('\n'));
    }
    // Consumers
    if (bundle.consumers.length > 0) {
        const lines = bundle.consumers.map((c) => {
            const status = c.status ?? 'unknown';
            return `${c.name} (${status})`;
        });
        sections.push('=== CONSUMERS ===\n' + lines.join('\n'));
    }
    // Architecture neighbors
    if (bundle.architectureNeighbors.length > 0) {
        const ctx = bundle.architectureNeighbors[0]?.archContext ?? 'unknown';
        const lines = bundle.architectureNeighbors.map((n) => {
            const status = n.status ?? 'unknown';
            const role = n.archRole !== undefined ? `, ${n.archRole}` : '';
            return `${n.name} (${status}${role})`;
        });
        sections.push(`=== ARCHITECTURE (context: ${ctx}) ===\n` + lines.join('\n'));
    }
    // Deliverables
    if (bundle.deliverables.length > 0) {
        const lines = bundle.deliverables.map((d) => {
            const checkbox = isDeliverableStatusComplete(d.status) ? '[x]' : '[ ]';
            return `${checkbox} ${d.name} (${d.location})`;
        });
        sections.push('=== DELIVERABLES ===\n' + lines.join('\n'));
    }
    // FSM
    if (bundle.fsm !== undefined) {
        const transitions = bundle.fsm.validTransitions.length > 0 ? bundle.fsm.validTransitions.join(', ') : 'none';
        sections.push('=== FSM ===\n' +
            `Status: ${bundle.fsm.currentStatus} | Transitions: ${transitions} | Protection: ${bundle.fsm.protectionLevel}`);
    }
    // Test files
    if (bundle.testFiles.length > 0) {
        sections.push('=== TEST FILES ===\n' + bundle.testFiles.join('\n'));
    }
    return sections.join('\n\n') + '\n';
}
// ---------------------------------------------------------------------------
// Dep-Tree Formatter
// ---------------------------------------------------------------------------
export function formatDepTree(tree) {
    const lines = [];
    renderTreeNode(tree, 0, lines);
    return lines.join('\n') + '\n';
}
function renderTreeNode(node, depth, lines) {
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
        renderTreeNode(child, depth + 1, lines);
    }
}
// ---------------------------------------------------------------------------
// File Reading List Formatter
// ---------------------------------------------------------------------------
export function formatFileReadingList(list) {
    const sections = [];
    if (list.primary.length > 0) {
        sections.push('=== PRIMARY ===\n' + list.primary.join('\n'));
    }
    if (list.completedDeps.length > 0) {
        sections.push('=== COMPLETED DEPENDENCIES ===\n' + list.completedDeps.join('\n'));
    }
    if (list.roadmapDeps.length > 0) {
        sections.push('=== ROADMAP DEPENDENCIES ===\n' + list.roadmapDeps.join('\n'));
    }
    if (list.architectureNeighbors.length > 0) {
        sections.push('=== ARCHITECTURE NEIGHBORS ===\n' + list.architectureNeighbors.join('\n'));
    }
    return sections.join('\n\n') + '\n';
}
// ---------------------------------------------------------------------------
// Overview Formatter
// ---------------------------------------------------------------------------
export function formatOverview(overview) {
    const sections = [];
    const { progress } = overview;
    sections.push('=== PROGRESS ===\n' +
        `${String(progress.total)} patterns (${String(progress.completed)} completed, ${String(progress.active)} active, ${String(progress.planned)} planned) = ${String(progress.percentage)}%`);
    if (overview.activePhases.length > 0) {
        const lines = overview.activePhases.map((p) => {
            const name = p.name !== undefined ? `: ${p.name}` : '';
            return `Phase ${String(p.phase)}${name} (${String(p.activeCount)} active)`;
        });
        sections.push('=== ACTIVE PHASES ===\n' + lines.join('\n'));
    }
    if (overview.blocking.length > 0) {
        const lines = overview.blocking.map((b) => {
            const blockers = b.blockedBy.join(', ');
            return `${b.pattern} blocked by: ${blockers}`;
        });
        sections.push('=== BLOCKING ===\n' + lines.join('\n'));
    }
    sections.push('=== DATA API — Use Instead of Explore Agents ===\n' +
        'pnpm process:query -- <subcommand>\n' +
        '\n' +
        '  overview                             Project health (this output)\n' +
        '  context <pattern> --session <type>   Curated context bundle (planning/design/implement)\n' +
        '  scope-validate <pattern> <session>   Pre-flight check before starting work\n' +
        '  dep-tree <pattern>                   Dependency chains\n' +
        '  list --status roadmap                Available patterns to work on\n' +
        '  stubs --unresolved                   Design stubs missing implementations\n' +
        '  files <pattern>                      File paths for a pattern\n' +
        '  rules                                Business rules from Gherkin\n' +
        '  arch blocking                        Patterns stuck on incomplete deps\n' +
        '\n' +
        'Full reference: pnpm process:query -- --help');
    return sections.join('\n\n') + '\n';
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
//# sourceMappingURL=context-formatter.js.map