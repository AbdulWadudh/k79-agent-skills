#!/usr/bin/env node
/**
 * Delegates to the canonical release-notes generator shipped with k79-logging-errors-git.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../skills/k79-logging-errors-git/scripts/release-notes.mjs', import.meta.url));

try {
  execFileSync(process.execPath, [script, ...process.argv.slice(2)], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
} catch (error) {
  process.exit(typeof error.status === 'number' ? error.status : 1);
}
