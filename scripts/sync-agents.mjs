#!/usr/bin/env node
/**
 * Delegates to the canonical sync script shipped with the k79-conductor skill.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../skills/k79-conductor/scripts/sync-agents.mjs', import.meta.url));

try {
  execFileSync(process.execPath, [script, ...process.argv.slice(2)], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
} catch (error) {
  process.exit(typeof error.status === 'number' ? error.status : 1);
}
