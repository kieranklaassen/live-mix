// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MockAudioBuffer } from '../../testing'
import { Session } from '../../core/session/Session'
import { defaultSlot, type SlotClip } from '../../core/session/Slot'
import { loadScore } from '../../score/loadScore'
import { createScore, defaultStrip, masterDestination, type Score } from '../../score/schema'
import { ScoreDocument } from '../../score/ScoreDocument'
import { GridView, parseQuantizeKey, quantizeKey, quantizeLabel } from '../components/GridView'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

function slotClip(sourceId: string, overrides: Partial<SlotClip> = {}): SlotClip {
  return {
    sourceId,
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
    ...overrides,
  }
}

function gridScore(): Score {
  const score = createScore({ id: 'set' })
  score.sources = [{ id: 'a', durationSec: 10 }]
  score.tracks = [
    {
      kind: 'audio',
      id: 'kick',
      name: 'Kick',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [],
    },
    {
      kind: 'audio',
      id: 'pad',
      name: 'Pad',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [],
    },
  ]
  score.scenes = [
    { id: 'verse', name: 'Verse' },
    { id: 'chorus', name: 'Chorus' },
  ]
  score.slots = [
    defaultSlot({ id: 'kv', track: 'kick', scene: 'verse', clip: slotClip('a', { loop: true }) }),
    defaultSlot({
      id: 'pv',
      track: 'pad',
      scene: 'verse',
      clip: slotClip('a'),
      launchMode: 'gate',
    }),
    defaultSlot({ id: 'pc', track: 'pad', scene: 'chorus', clip: null }),
  ]
  return score
}

interface Rig extends TestEngine {
  session: Session
  advance: (sec: number) => Promise<void>
}

async function rig(): Promise<Rig> {
  const fixture = createTestEngine()
  const buffer = new MockAudioBuffer(2, 48_000 * 10, 48_000) as unknown as AudioBuffer
  await fixture.engine.samples.load('a', buffer)
  const document = new ScoreDocument(gridScore(), { now: () => 0 })
  const renderer = loadScore(fixture.engine, document)
  await renderer.whenIdle()
  const session = new Session({ document, engine: fixture.engine })
  const advance = async (sec: number): Promise<void> => {
    await renderer.whenIdle()
    fixture.ctx.advanceClock(sec)
    fixture.engine.scheduler.tick('timer')
    await renderer.whenIdle()
  }
  return { ...fixture, session, advance }
}

describe('GridView', () => {
  it('lays out scenes × tracks with slot states, launches scenes and slots, stops tracks and all', async () => {
    const { engine, session, advance } = await rig()
    render(<GridView session={session} data-testid="grid" />)

    const grid = screen.getByRole('grid', { name: 'Session grid' })
    expect(grid).toHaveAttribute('aria-rowcount', '3')
    expect(grid).toHaveAttribute('aria-colcount', '3')
    expect(screen.getAllByRole('columnheader').map((el) => el.textContent)).toEqual([
      '',
      'Kick',
      'Pad',
    ])
    expect(screen.getByTestId('grid-slot-kv')).toHaveAttribute('data-state', 'stopped')
    expect(screen.getByTestId('grid-slot-pv')).toHaveAttribute('data-state', 'stopped')
    expect(screen.getByTestId('grid-slot-pc')).toHaveAttribute('data-state', 'stop')
    expect(screen.getByTestId('grid-slot-pv')).toHaveClass('lm-grid__slot--gate')
    // An empty cell (no slot) renders as a blank, not a button.
    const cells = within(grid).getAllByRole('gridcell')
    expect(cells.some((cell) => cell.classList.contains('lm-grid__cell--none'))).toBe(true)

    engine.transport.start()
    await act(() => advance(7.9))
    fireEvent.click(screen.getByRole('button', { name: 'Launch scene Verse' }))
    expect(screen.getByTestId('grid-slot-kv')).toHaveAttribute('data-state', 'queued')
    expect(screen.getByTestId('grid-scene-verse')).toHaveClass('lm-grid__scene--queued')
    await act(() => advance(0.2))
    expect(screen.getByTestId('grid-slot-kv')).toHaveAttribute('data-state', 'playing')
    expect(screen.getByTestId('grid-slot-kv')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('grid-scene-verse')).toHaveClass('lm-grid__scene--playing')

    // Stop one track, then everything.
    fireEvent.click(screen.getByTestId('grid-stop-kick'))
    expect(session.status('kv')?.stopping).toBe(true)
    expect(screen.getByTestId('grid-slot-kv')).toHaveClass('lm-grid__slot--stopping')
    fireEvent.click(screen.getByTestId('grid-stop-all'))
    expect(session.status('pv')?.stopping).toBe(true)
  })

  it('a slot press launches, a gate slot releases on pointer up, and the quantize selector sets the session', async () => {
    const { engine, session, advance } = await rig()
    render(<GridView session={session} data-testid="grid" />)
    engine.transport.start()
    await act(() => advance(7.9))

    const pad = screen.getByTestId('grid-slot-pv')
    fireEvent.pointerDown(pad, { button: 0 })
    expect(session.status('pv')?.state).toBe('queued')
    await act(() => advance(0.2))
    expect(session.status('pv')?.state).toBe('playing')
    fireEvent.pointerUp(pad)
    expect(session.status('pv')?.stopping).toBe(true)

    const select: HTMLSelectElement = screen.getByTestId('grid-quantize')
    expect(select.value).toBe('bar')
    fireEvent.change(select, { target: { value: 'bars:4' } })
    expect(session.quantize).toBe(4)
    expect(select.value).toBe('bars:4')
    fireEvent.change(select, { target: { value: 'none' } })
    expect(session.quantize).toBe('none')

    // Keyboard: space launches a kick slot immediately with quantize off; auto-repeat is one press.
    const kick = screen.getByTestId('grid-slot-kv')
    fireEvent.keyDown(kick, { key: ' ' })
    expect(session.status('kv')?.state).toBe('queued')
    const before = session.version
    fireEvent.keyDown(kick, { key: ' ', repeat: true })
    fireEvent.keyDown(kick, { key: 'Enter', repeat: true })
    expect(session.version).toBe(before)

    // A gate whose pointer slid off the pad still releases when capture is lost.
    await act(() => advance(0.1))
    const padAgain = screen.getByTestId('grid-slot-pv')
    fireEvent.pointerDown(padAgain, { button: 0 })
    await act(() => advance(0.1))
    fireEvent.lostPointerCapture(padAgain)
    expect(session.status('pv')?.stopping).toBe(true)
  })

  it('hides the quantize selector and the stops on request, and labels tracks through trackLabel', async () => {
    const { session } = await rig()
    render(
      <GridView
        session={session}
        hideQuantize
        hideStops
        trackLabel={(track) => track.id.toUpperCase()}
        data-testid="grid"
      />,
    )
    expect(screen.queryByTestId('grid-quantize')).toBeNull()
    expect(screen.queryByTestId('grid-stop-all')).toBeNull()
    expect(screen.queryByTestId('grid-stop-kick')).toBeNull()
    expect(screen.getAllByRole('columnheader').map((el) => el.textContent)).toEqual([
      '',
      'KICK',
      'PAD',
    ])
  })

  it('quantize keys round-trip and label every choice', () => {
    for (const choice of ['none', 'beat', 'bar', 2, { seconds: 1.5 }] as const) {
      expect(parseQuantizeKey(quantizeKey(choice))).toEqual(choice)
    }
    expect(quantizeLabel('none')).toBe('Off')
    expect(quantizeLabel('beat')).toBe('Beat')
    expect(quantizeLabel('bar')).toBe('Bar')
    expect(quantizeLabel(8)).toBe('8 bars')
    expect(quantizeLabel({ seconds: 2 })).toBe('2 s')
    expect(parseQuantizeKey('garbage')).toBe('bar')
  })
})
