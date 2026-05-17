import { validateCommandInput } from '../../architect-cli/src/cli/pattern-graph-cli-commands.js';

interface DeprecatedSurfaceCheck {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly expectedSnippet: string;
}

const CHECKS: readonly DeprecatedSurfaceCheck[] = [
  {
    name: 'arch layer',
    command: 'arch',
    args: ['layer'],
    expectedSnippet: 'Unknown arch subcommand: layer',
  },
  {
    name: 'list --phase',
    command: 'list',
    args: ['--phase', '1'],
    expectedSnippet: 'Unknown option: --phase',
  },
  {
    name: 'list --maturity',
    command: 'list',
    args: ['--maturity', 'active'],
    expectedSnippet: 'Unknown option: --maturity',
  },
];

const failures: string[] = [];

for (const check of CHECKS) {
  try {
    validateCommandInput(check.command, check.args);
    failures.push(
      `Deprecated query surface unexpectedly succeeded for ${check.name}: architect ${check.command} ${check.args.join(' ')}`,
    );
    continue;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(check.expectedSnippet)) {
      failures.push(
        `Deprecated query surface for ${check.name} failed without expected output. Expected snippet: ${check.expectedSnippet}\nActual output:\n${message}`,
      );
      continue;
    }
  }

  process.stdout.write(
    `deprecated query surface ok: ${check.name} still fails with \`${check.expectedSnippet}\`\n`,
  );
}

if (failures.length > 0) {
  throw new Error(failures.join('\n\n'));
}
