// The video kit's tokens: the values the design gives for graphite and paper,
// and what every theme has to hold whatever its palette.

import { describe, expect, it } from 'vitest'

import { graphite, paper, themes, water, type LiveMixThemeName } from '../components/tokens'

const NAMES = Object.keys(themes) as LiveMixThemeName[]

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16)) as [number, number, number]
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const share = channel / 255
    return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe('the video kit tokens', () => {
  it('graphite and paper carry the values the design gives', () => {
    expect(graphite).toMatchObject({
      stage: '#181c1a',
      scrim: '#0f1211b8',
      removed: '#e2e7e414',
      record: '#e07a6a',
      note: '#d9a0e8',
      'note-soft': '#d9a0e833',
      'note-mark': '#e6a8f5',
      'mark-edge': '#0f1211',
    })
    expect(paper).toMatchObject({
      stage: '#e6e9e0',
      scrim: '#1b262266',
      removed: '#1b262214',
      record: '#b04a3c',
      note: '#8a3fa3',
      'note-soft': '#8a3fa326',
      'note-mark': '#e6a8f5',
      'mark-edge': '#0f1211',
    })
  })

  it('the sizes are the same in every theme', () => {
    for (const name of NAMES) {
      expect(themes[name], name).toMatchObject({
        'bar-height': '40px',
        'panel-width': '320px',
        'lane-head-width': '160px',
        'read-size': '13px',
        'handle-size': '7px',
      })
    }
  })

  it('the record dot is the danger colour, with a meaning of its own', () => {
    for (const name of NAMES) {
      expect(themes[name].record.toLowerCase(), name).toBe(themes[name].danger.toLowerCase())
    }
  })

  it('a note reads on the page and on the field in every theme', () => {
    for (const name of NAMES) {
      const theme = themes[name]
      expect(contrast(theme.note, theme.bg), `${name} on bg`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(theme.note, theme.sunken), `${name} on sunken`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('a note is no brush, not the accent and not the automation colour', () => {
    for (const name of NAMES) {
      const theme = themes[name]
      const taken = [
        theme.accent,
        theme.automation,
        theme.danger,
        theme['brush-1'],
        theme['brush-2'],
        theme['brush-3'],
        theme['brush-4'],
        theme['brush-5'],
        theme['brush-6'],
      ].map((colour) => colour.toLowerCase())
      expect(taken, name).not.toContain(theme.note.toLowerCase())
    }
  })

  it('marks on a picture are one value everywhere, and the soft wash is the note at part strength', () => {
    for (const name of NAMES) {
      const theme = themes[name]
      expect(theme['note-mark'], name).toBe('#e6a8f5')
      expect(theme['mark-edge'], name).toBe('#0f1211')
      expect(theme['note-soft'].slice(0, 7), name).toBe(theme.note)
      expect(theme['note-soft']).toHaveLength(9)
    }
  })

  it('water is a dark theme with a stage under its lowest ground', () => {
    expect(luminance(water.stage)).toBeLessThan(luminance(water.sunken))
    expect(luminance(graphite.stage)).toBeLessThan(luminance(graphite.sunken))
    // A light theme's stage is the grid's own line: a step down from the page.
    expect(paper.stage).toBe(paper['grid-line'])
  })
})
