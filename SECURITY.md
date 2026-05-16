# Security Policy

## Supported Versions

| Version     | Supported          |
| ----------- | ------------------ |
| 1.0.0-pre.x | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Use [GitHub's private vulnerability reporting](https://github.com/libar-dev/architect/security/advisories/new)
3. Or email: security@libar.dev

We will acknowledge receipt within 48 hours and provide an initial assessment within 7 days.

## Scope

This package runs as a dev tool (pre-commit hooks, CLI commands, doc generation). It processes local source files and does not make network requests. Supply chain integrity is maintained via npm provenance attestation on all published versions.
