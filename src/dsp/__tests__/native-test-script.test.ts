// scripts/test-native.sh runs the queued harnesses several at a time, as many
// as NATIVE_JOBS says. xargs takes a count of 0 to mean "all of them at
// once", which is every device's harness compiling side by side, so the
// script has to refuse a count that is not 1 or more before it starts.
//
// The script is run here with a compiler that fails at once (`false`), so
// whatever it does it compiles nothing: with a count it takes it stops at its
// first compile, and with one it refuses it stops before that.

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const script = fileURLToPath(new URL('../../../scripts/test-native.sh', import.meta.url))

function run(jobs: string): { status: number | null; stdout: string; stderr: string } {
  return spawnSync('bash', [script], {
    env: { ...process.env, NATIVE_JOBS: jobs, CXX: 'false' },
    encoding: 'utf8',
  })
}

describe.skipIf(process.platform === 'win32')('scripts/test-native.sh', () => {
  it.each(['0', '00', 'abc', '-2', '1.5', '4 4'])(
    'refuses NATIVE_JOBS=%s before it compiles anything',
    (jobs) => {
      const result = run(jobs)
      expect(result.status).toBe(2)
      expect(result.stderr).toContain('NATIVE_JOBS must be a whole number of 1 or more')
      expect(result.stdout).toBe('')
    },
  )

  it.each(['1', '3', '16', ''])('takes NATIVE_JOBS=%s (empty is one a core)', (jobs) => {
    // On to the first compile, where the compiler that fails stops it.
    const result = run(jobs)
    expect(result.status).toBe(1)
    expect(result.stderr).not.toContain('NATIVE_JOBS')
  })
})
