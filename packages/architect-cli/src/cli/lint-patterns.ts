#!/usr/bin/env node

import { runLintPatternsCli } from '@libar-dev/architect-guard';

await runLintPatternsCli(process.argv.slice(2));
