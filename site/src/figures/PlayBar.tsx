// The one bar that stays in view: play and stop, which stage is sounding, the source, the level.
// It also starts the page's lab, since every page with a lab has one of these.

import { useEffect, useRef } from 'react'
import { labStore, pagePlayer, startLab, useLab } from '../lab/page.ts'
import type { SourceInfo } from '../lab/sources.ts'
import { BENCH } from '../lab/store.ts'
import { toDb } from './draw.ts'
import SourcePicker from './SourcePicker.tsx'

interface Props {
  lab: string
  seconds: number
  sources: SourceInfo[]
  /** The stages that are sound, in the signal's order. */
  stages: { id: string; name: string }[]
  /** The name of the real device on the bench, when the page has one. */
  bench?: string
}

function Meter() {
  const playing = useLab().playing
  const bar = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    const element = bar.current
    if (!element) return
    if (!playing) {
      element.style.transform = 'scaleX(0)'
      return
    }
    let frame = 0
    let held = 0
    const move = () => {
      frame = requestAnimationFrame(move)
      // 60 dB of the meter's length; the level falls back slowly so a hit can be seen.
      held = Math.max(pagePlayer().level(), held * 0.93)
      element.style.transform = `scaleX(${Math.min(1, Math.max(0, 1 + toDb(held) / 60))})`
    }
    move()
    return () => cancelAnimationFrame(frame)
  }, [playing])
  return (
    <span className="playbar-meter" aria-hidden="true">
      <span ref={bar} />
    </span>
  )
}

export default function PlayBar({ lab, seconds, sources, stages, bench }: Props) {
  const state = useLab()
  useEffect(() => {
    startLab({ lab, seconds, sources: sources.map((source) => source.id) })
  }, [lab, seconds, sources])

  const ready = state.status === 'ready' && state.result !== undefined
  const sounding = state.sounding || stages[stages.length - 1]?.id || ''
  const soundingName =
    sounding === BENCH
      ? `The real device: ${bench}`
      : stages.find((stage) => stage.id === sounding)?.name
  const status =
    state.status === 'failed'
      ? 'The lab did not load'
      : !ready
        ? 'Loading…'
        : state.rendering
          ? 'Rendering…'
          : `Rendered in ${Math.max(1, Math.round(state.result?.ms ?? 0))} ms`

  return (
    <div
      className="playbar"
      role="region"
      aria-label="Player"
      data-ready={ready ? '' : undefined}
      data-renders={state.renders}
    >
      <button
        type="button"
        className="playbar-play"
        disabled={!ready}
        aria-label={state.playing ? `Stop ${soundingName ?? ''}` : `Play ${soundingName ?? ''}`}
        data-playing={state.playing ? '' : undefined}
        onClick={() => (state.playing ? labStore().stop() : labStore().play())}
      >
        <span aria-hidden="true">{state.playing ? '■' : '▶'}</span>
        {state.playing ? 'Stop' : 'Play'}
      </button>
      <div className="playbar-field playbar-stage">
        <label htmlFor="lab-stage">Hearing</label>
        <select
          id="lab-stage"
          value={sounding}
          disabled={!ready}
          onChange={(event) => labStore().listen(event.target.value)}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
          {bench && state.benchOpen && <option value={BENCH}>The real device: {bench}</option>}
        </select>
      </div>
      <SourcePicker sources={sources} />
      <div className="playbar-field playbar-volume">
        <label htmlFor="lab-volume">Level</label>
        <input
          id="lab-volume"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.volume}
          onChange={(event) => labStore().setVolume(Number(event.target.value))}
        />
        <Meter />
      </div>
      <span className="playbar-status" role="status" data-status={state.status}>
        {status}
      </span>
    </div>
  )
}
