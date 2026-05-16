#!/usr/bin/env node
import { runArchitectCliEntrypoint } from '../runtime-bridge.js';

await runArchitectCliEntrypoint('cli/lint-steps.js');
