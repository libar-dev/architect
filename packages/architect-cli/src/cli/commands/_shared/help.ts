import { COMMAND_NAMES, COMMANDS } from '../../pattern-graph-cli-commands.js';
import { readCliPackageMetadata } from '../../runtime-helpers.js';

const GLOBAL_OPTIONS: readonly string[] = [
  '-b, --base-dir <dir>     Base directory (default: cwd)',
  '-i, --input <glob>       TypeScript source glob (repeatable)',
  '-f, --feature <glob>     Gherkin feature glob (repeatable)',
  '    --dry-run            Show resolved inputs without running the pipeline',
  '    --no-cache           Bypass CLI cache metadata tracking',
  '    --session <type>     planning, design, or implement',
  '    --depth <n>          Dependency tree depth',
  '-h, --help               Show help',
  '-v, --version            Show version',
];

export function printGlobalHelp(stream: NodeJS.WriteStream = process.stdout): void {
  const commandLines = COMMAND_NAMES.map((name) => `  ${COMMANDS[name].helpSignature}\n`).join('');
  const optionLines = GLOBAL_OPTIONS.map((line) => `  ${line}\n`).join('');
  stream.write(
    'architect query helper\n\n' +
      'Usage:\n' +
      '  architect [global-options] <command> [command-options]\n\n' +
      'Commands:\n' +
      commandLines +
      '\n' +
      'Global options:\n' +
      optionLines +
      '\n' +
      'Agent environments: load the `architect-data-api` skill for verb shapes,\n' +
      'deterministic gates, JSON shapes, and known quirks.\n',
  );
}

export function printCommandHelp(command: string): void {
  const def = (COMMANDS as Record<string, (typeof COMMANDS)[keyof typeof COMMANDS] | undefined>)[
    command
  ];
  // Only commands that declare `usage` (and optionally `helpDetail`) emit detailed help;
  // everything else falls back to the generic message.
  if (def?.usage === undefined) {
    process.stdout.write(
      `No detailed help for subcommand "${command}". See --help for global usage.\n`,
    );
    return;
  }

  const usageText = def.usage.startsWith('Usage:')
    ? def.usage.slice('Usage:'.length).trimStart()
    : def.usage;

  let output = 'Usage:\n' + `  ${usageText}\n`;

  const detail = def.helpDetail;
  if (detail?.body !== undefined && detail.body.length > 0) {
    output += '\n' + detail.body.map((line) => `${line}\n`).join('');
  }
  if (detail?.examples !== undefined && detail.examples.length > 0) {
    output += '\nExamples:\n' + detail.examples.map((example) => `  ${example}\n`).join('');
  }

  process.stdout.write(output);
}

export function printVersion(): void {
  const pkg = readCliPackageMetadata();
  process.stdout.write(`architect (${pkg.name}) v${pkg.version}\n`);
}

export function printReplHelp(): void {
  process.stdout.write(
    'Available commands: status, list, context, dep-tree, files, scope-validate, handoff, reload, help, quit\n',
  );
}
