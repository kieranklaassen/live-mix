// The `.` and `./dsp` entries stay free of React: nothing outside `src/react`
// may import it, so a consumer that never mounts a hook never loads the peer.
// Also pins the `./react` export surface.

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import * as react from '../index'

const src = fileURLToPath(new URL('../..', import.meta.url))

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'react' && dir === src) continue
      files.push(...(await sourceFiles(path)))
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      files.push(path)
    }
  }
  return files
}

const REACT_IMPORT = /from\s+['"]react(-dom)?(\/[^'"]*)?['"]|require\(\s*['"]react/

describe('entries', () => {
  it('nothing outside src/react imports react', async () => {
    const files = await sourceFiles(src)
    expect(files.length).toBeGreaterThan(50)
    const offenders: string[] = []
    for (const file of files) {
      if (REACT_IMPORT.test(await readFile(file, 'utf8'))) offenders.push(file.slice(src.length))
    }
    expect(offenders).toEqual([])
  })

  it.each([
    'LiveMixProvider',
    'useEngine',
    'useMaybeEngine',
    'useTransport',
    'useTrack',
    'useStrip',
    'useGroup',
    'useMeter',
    'useDevice',
    'useDeviceParam',
    'useLane',
    'useModulation',
    'useSampleStore',
    'useEngineStats',
    'useClips',
    'useSchedule',
    'useSession',
    'useSlot',
    'useExternalSnapshot',
    'useFrameSampled',
    'defaultFrameScheduler',
    'normalizeParam',
    'denormalizeParam',
  ] as const)('`./react` exports %s', (name) => {
    expect((react as Record<string, unknown>)[name]).toBeDefined()
  })
})
