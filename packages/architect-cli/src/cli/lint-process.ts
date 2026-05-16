#!/usr/bin/env node

import { runLintProcessCli } from '@libar-dev/architect-guard';

await runLintProcessCli(process.argv.slice(2));
