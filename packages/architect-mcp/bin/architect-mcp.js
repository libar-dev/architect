#!/usr/bin/env node
import { runArchitectMcpEntrypoint } from '../runtime-bridge.js';

await runArchitectMcpEntrypoint('cli/mcp-server.js');
