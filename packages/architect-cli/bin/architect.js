#!/usr/bin/env node
import { runArchitectCliEntrypoint } from '../runtime-bridge.js';

await runArchitectCliEntrypoint('cli/pattern-graph-cli.js');
