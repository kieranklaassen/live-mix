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
    'chainDropIndex',
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
    'strokeWavePaths',
    'fadePaths',
    'graphite',
    'paper',
    'water',
    'dusk',
    'night',
    'sand',
    'groovebox',
    'chalk',
    'mist',
    'BRUSH_COUNT',
    // Device meters
    'useDeviceMeter',
    // Console fader and meter
    'heldPeak',
    // Frames without a render
    'subscribeFrames',
    'subscribeFrameSampled',
    // The video kit
    'rulerScale',
    'rulerLabels',
    'zoomAround',
    'fitPxPerSecond',
    'pageScroll',
    'clampPxPerSecond',
    'MIN_PX_PER_SECOND',
    'MAX_PX_PER_SECOND',
    'DEFAULT_PX_PER_SECOND',
    'TimeRuler',
    'Playhead',
    'Lane',
    'LaneHead',
    'brushIndex',
    'LinkMark',
    'RangeSelection',
    'CutSeam',
    'CutNotch',
    'TransitionMark',
    'TRANSITION_MIN_PX',
    'VideoStroke',
    'VIDEO_FRAME_PX',
    'VIDEO_FRAME_INSET_PX',
    'TimelineItem',
    'TIMELINE_ITEM_HEIGHT',
    'envelopePath',
    'Overview',
    'Glyph',
    'GLYPHS',
    'TextButton',
    'Input',
    'Select',
    'Segmented',
    'Check',
    'Panel',
    'PanelHead',
    'Tabs',
    'SectionLabel',
    'PropRow',
    'Menu',
    'MenuItem',
    'MenuSeparator',
    'Sheet',
    'InlineNote',
    'Progress',
    'StateMark',
    'WhoMark',
    'WHO_LABELS',
    'JobRow',
    'LogRow',
    'TranscriptWord',
    'NoteTab',
    'NotePin',
    'NoteSpan',
    'PictureMark',
    'NoteBubble',
    'ContextChip',
    'ReferenceChip',
    'ChangedMark',
    'queryWords',
    'matchRanges',
    'searchScore',
    'searchRows',
    'pickerPlace',
    'cursorStep',
    'tabStops',
    'focusCell',
    'PickerPanel',
    'PickerSearch',
    'PickerGroup',
    'PickerAction',
    'Keycap',
    'Highlight',
    'useRowInView',
    'PickList',
    'PickCell',
    'pickRows',
    'pickSlug',
    'deviceItems',
    'patchItems',
    'PresetCell',
    'DevicePresetCell',
    'presetLabel',
    'PICKER_PHONE_WIDTH',
    'PICK_CHEVRON_DOWN',
    'PICK_CHEVRON_LEFT',
    'PICK_CHEVRON_RIGHT',
    'PRESET_DEFAULT_LABEL',
    'PRESET_NONE_LABEL',
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

  it.each([
    'graphite',
    'paper',
    'water',
    'dusk',
    'night',
    'sand',
    'groovebox',
    'chalk',
    'mist',
  ] as const)(
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

  it('the stylesheet derives the grounds, lines and depth once, for every theme', async () => {
    const css = await readFile(join(src, 'react/styles.css'), 'utf8')
    const rules = [...css.matchAll(/(?:^|\n)([^{}/]+?) \{\n([^}]*)\}/g)].map((match) => ({
      selectors: match[1].split(',').map((selector) => selector.trim()),
      names: [...match[2].matchAll(/--lm-([a-z0-9-]+):/g)].map((declared) => declared[1]),
    }))
    const derived = [
      'edge',
      'bar',
      'pane',
      'head',
      'line',
      'line-strong',
      'hair',
      'slot',
      'well',
      'cap',
      'cap-edge',
      'meter-warm',
      'shade',
      'shade-in',
      'light',
    ]
    // Declared together on every element that can carry a theme, after the themes.
    const base = rules.filter((rule) => rule.names.includes('cap-edge'))
    expect(base).toHaveLength(1)
    expect(base[0].selectors).toEqual([':root', '.lm-root', '[data-lm-theme]'])
    expect(base[0].names).toEqual(derived)
    expect(css.indexOf('--lm-cap-edge:')).toBeGreaterThan(css.indexOf("[data-lm-theme='mist']"))
    // No literal theme token is among them: a theme is still the `LM_TOKENS` alone.
    for (const name of derived) expect(react.LM_TOKENS).not.toContain(name)

    // The dark themes turn the edge to a light line; night lifts its pane.
    const overrides = rules.filter((rule) => rule !== base[0] && rule.names.includes('edge'))
    expect(overrides).toHaveLength(1)
    const themed = (selectors: string[]) =>
      selectors.flatMap((selector) => /^\[data-lm-theme='([a-z-]+)'\]$/.exec(selector)?.[1] ?? [])
    expect(themed(overrides[0].selectors)).toEqual(['dark', 'graphite', 'water', 'dusk', 'night'])
    expect(overrides[0].selectors.filter((selector) => !selector.startsWith('['))).toEqual([
      '.lm-dark',
    ])
    expect(overrides[0].names).toEqual([
      'edge',
      'bar',
      'pane',
      'head',
      'slot',
      'shade',
      'shade-in',
      'light',
    ])
    const night = rules.filter(
      (rule) => rule.selectors.join() === "[data-lm-theme='night']" && rule.names.includes('pane'),
    )
    expect(night.map((rule) => rule.names)).toEqual([['pane']])

    // A pane swaps the tokens the kit draws with; depth is two more classes.
    const pane = rules.find((rule) => rule.selectors.join() === '.lm-pane')
    expect(pane?.names).toEqual(['panel', 'border', 'hairline', 'grid-line-strong'])
    expect(css).toMatch(/\.lm-pane--raised \{\n {2}box-shadow:/)
    expect(css).toMatch(/\.lm-well \{\n {2}border: 1px solid var\(--lm-hairline\);/)
  })

  it("the stylesheet shows the word of a stroke's line whole or not at all", async () => {
    const css = await readFile(join(src, 'react/styles.css'), 'utf8')
    const rule = (selector: string) =>
      [...css.matchAll(/(?:^|\n)([^{}/]+?) \{\n([^}]*)\}/g)]
        .filter((match) => match[1].split(',').some((part) => part.trim() === selector))
        .map((match) => match[2])
        .join('')
    // The word's room is one row high and cuts off the next, the one a word too long for it wraps to.
    const room = rule('.lm-stroke__automation-room')
    for (const line of ['flex-wrap: wrap;', 'height: 14px;', 'overflow: hidden;']) {
      expect(room, line).toContain(line)
    }
    // It wraps behind a first thing a row high, and only if it is in the flow of its room.
    expect(rule('.lm-stroke__automation-room::before')).toContain('height: 14px;')
    expect(rule('.lm-stroke__automation-label')).toContain('height: 14px;')
    expect(rule('.lm-stroke__automation-label')).not.toContain('position:')
  })

  it('the stylesheet reads no variable that neither it nor a component declares', async () => {
    const css = await readFile(join(src, 'react/styles.css'), 'utf8')
    const dir = join(src, 'react/components')
    let components = ''
    for (const file of await readdir(dir)) {
      if (file.endsWith('.tsx')) components += await readFile(join(dir, file), 'utf8')
    }
    // Read with nothing to fall back on: a name nobody declares draws as if the line were not there.
    const read = new Set([...css.matchAll(/var\(--lm-([a-z0-9-]+)\)/g)].map((match) => match[1]))
    const undeclared = [...read].filter(
      (name) => !css.includes(`--lm-${name}:`) && !components.includes(`'--lm-${name}'`),
    )
    expect(undeclared).toEqual([])
  })

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
