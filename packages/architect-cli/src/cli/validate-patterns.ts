#!/usr/bin/env node

import { runValidatePatternsCli } from '@libar-dev/architect-guard';

await runValidatePatternsCli(process.argv.slice(2));
