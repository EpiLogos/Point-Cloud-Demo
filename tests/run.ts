/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tiny node-runnable test runner. Imports every tests/*.test.ts file (which
 * register cases with the harness as a side effect of import), runs each
 * case, prints PASS/FAIL/KNOWN-FAILURE per case, and exits non-zero if any
 * non-known-failure case failed (or any known-failure case unexpectedly
 * started passing, which means its label is stale).
 *
 * Run with: npm test   (== tsx tests/run.ts)
 */

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getCases } from './harness.ts';

const here = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const files = readdirSync(here)
    .filter((f) => f.endsWith('.test.ts'))
    .sort();

  if (files.length === 0) {
    console.error('No *.test.ts files found in tests/.');
    process.exit(1);
  }

  for (const f of files) {
    await import(pathToFileURL(path.join(here, f)).href);
  }

  const cases = getCases();
  let failed = 0;
  let passed = 0;
  let knownFailed = 0;
  let staleKnownFailures = 0;

  for (const c of cases) {
    try {
      await c.fn();
      if (c.knownFailure) {
        console.log(`STALE KNOWN-FAILURE (now passes — remove the label): ${c.name}`);
        staleKnownFailures++;
        failed++;
      } else {
        console.log(`PASS: ${c.name}`);
        passed++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (c.knownFailure) {
        console.log(`KNOWN-FAILURE: ${c.name}`);
        console.log(`    ${msg.split('\n').join('\n    ')}`);
        if (c.diagnosis) console.log(`    diagnosis: ${c.diagnosis}`);
        knownFailed++;
      } else {
        console.log(`FAIL: ${c.name}`);
        console.log(`    ${msg.split('\n').join('\n    ')}`);
        failed++;
      }
    }
  }

  console.log('');
  console.log(
    `${cases.length} total — ${passed} passed, ${failed - staleKnownFailures} failed, ${knownFailed} known-failure(s)` +
      (staleKnownFailures > 0 ? `, ${staleKnownFailures} STALE known-failure(s)` : '')
  );

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Test runner crashed:', e);
  process.exit(1);
});
