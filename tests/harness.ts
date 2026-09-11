/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Minimal test harness: register cases with `test()` (expected to pass) or
 * `knownFailureTest()` (expected to currently throw — a genuine bug elsewhere
 * in the codebase that this suite documents but does not fix). The runner
 * (tests/run.ts) imports every *.test.ts file, which populates this registry
 * as a side effect of being imported, then executes everything.
 */

export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
  knownFailure: boolean;
  diagnosis?: string;
}

const cases: TestCase[] = [];

export function test(name: string, fn: () => void | Promise<void>): void {
  cases.push({ name, fn, knownFailure: false });
}

/**
 * Registers a case that is EXPECTED to fail right now because of a genuine bug
 * in the pure layer under test (fieldModel.ts / configMigration.ts /
 * cymaticResonator.ts / automation.ts) — files this test suite must not edit.
 * The assertion inside `fn` should express the CORRECT/intended behaviour per
 * the spec; the runner reports it as `KNOWN-FAILURE` (not a suite failure) as
 * long as it keeps throwing, and flags it loudly if it ever starts passing
 * (i.e. the bug got fixed and the label is stale).
 */
export function knownFailureTest(name: string, fn: () => void | Promise<void>, diagnosis?: string): void {
  cases.push({ name, fn, knownFailure: true, diagnosis });
}

export function getCases(): TestCase[] {
  return cases;
}
