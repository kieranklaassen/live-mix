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
    'useControlSurface',
    'useLearn',
    'useArbiter',
    'useArbiterTarget',
    'useVersions',
    'useMaybeArbiter',
    'useMaybeVersions',
    'VersionList',
    // U25 kit
    'Knob',
    'Fader',
    'Meter',
    'TransportBar',
    'ChannelStripView',
    'MixerStrip',
    'MasterStripView',
    'MixerView',
    'DeviceFrame',
    'DevicePanel',
    'DeviceView',
    'DeviceToggle',
    'ToggleButton',
    'DeviceChainView',
    'TimelineView',
    'Waveform',
    'useParamControl',
    'useStripMeter',
    'reorderInserts',
    'useChainReorder',
    'freshDeviceId',
    'normalizeValue',
    'denormalizeValue',
    'formatControlValue',
    'faderDbToLevel',
    'levelToFaderDb',
    'themeStyle',
    'jaxaZenLight',
    'jaxaZenDark',
    'LM_TOKENS',
    // Paint kit
    'Stroke',
    'SoundIcon',
    'SOUND_KIND_LABELS',
    'PaintField',
    'ChannelRowView',
    'strokeLevels',
    'fadePaths',
    'graphite',
    'paper',
    'water',
    'BRUSH_COUNT',
    // Device meters
    'useDeviceMeter',
  ] as const)('`./react` exports %s', (name) => {
    expect((react as Record<string, unknown>)[name]).toBeDefined()
  })

  it('the stylesheet declares every token of the default theme, light and dark', async () => {
    const css = await readFile(join(src, 'react/styles.css'), 'utf8')
    for (const token of react.LM_TOKENS) {
      expect(css, `--lm-${token}`).toMatch(new RegExp(`--lm-${token}:`))
    }
    expect(css).toMatch(/\[data-lm-theme='dark'\]/)
    // The tokens module and the stylesheet agree on the JAXA-Zen defaults.
    expect(css).toMatch(/--lm-bg: #fdfdfb/i)
    expect(css).toMatch(/--lm-panel: #f4f4f0/i)
    expect(css).toMatch(/--lm-text: #1a1a1a/i)
    expect(css).toMatch(/--lm-accent: #e63946/i)
    expect(react.jaxaZenLight.bg.toLowerCase()).toBe('#fdfdfb')
    expect(react.jaxaZenDark.text.toLowerCase()).toBe('#fdfdfb')
  })

  it.each(['graphite', 'paper', 'water'] as const)(
    'the stylesheet carries the %s theme exactly as the tokens module does',
    async (name) => {
      const css = await readFile(join(src, 'react/styles.css'), 'utf8')
      const block = new RegExp(`\\[data-lm-theme='${name}'\\] \\{([^}]*)\\}`).exec(css)?.[1] ?? ''
      const declared = new Map(
        [...block.matchAll(/--lm-([a-z0-9-]+): ([^;]+);/g)].map((match) => [match[1], match[2]]),
      )
      const theme = react.themes[name]
      for (const token of react.LM_TOKENS) {
        expect(declared.get(token)?.toLowerCase(), `--lm-${token}`).toBe(theme[token].toLowerCase())
      }
    },
  )

  it('components reference colours only through --lm-* variables', async () => {
    const dir = join(src, 'react/components')
    const offenders: string[] = []
    for (const file of await readdir(dir)) {
      if (!file.endsWith('.tsx')) continue
      const text = await readFile(join(dir, file), 'utf8')
      // Hex colours are allowed only as `tokenRef('token', '#fallback')` fallbacks.
      const stripped = text.replace(/tokenRef\([^)]*\)/g, '')
      const bare = stripped.match(/#[0-9a-fA-F]{6}\b/g)
      if (bare) offenders.push(`${file}: ${bare.join(', ')}`)
    }
    expect(offenders).toEqual([])
  })
})
