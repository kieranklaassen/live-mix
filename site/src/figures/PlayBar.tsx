// The one bar that stays in view: play and stop, what is sounding, the way back from a card,
// the source, the level. It also starts the page's lab, since every page with a lab has one of
// these, and it brings the styles of the parts that play (styles/parts.css) with it.

import '../styles/parts.css'
import { useEffect, useRef } from 'react'
import { labStore, pagePlayer, startLab, useLab } from '../lab/page.ts'
import type { SourceInfo } from '../lab/sources.ts'
import { BENCH, isBuilt, type LabState } from '../lab/store.ts'
import { toDb } from './draw.ts'
import SourcePicker from './SourcePicker.tsx'

interface Props {
  lab: string
  seconds: number
  sources: SourceInfo[]
  /** The stages that are sound, in the signal's order. Those the build path writes are listed apart. */
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

/** What the bar says of the lab's last render, or of why there is none. */
function statusOf(state: LabState): string {
  if (state.status === 'failed') return 'The lab did not load'
  if (state.status !== 'ready' || !state.result) return 'Loading…'
  if (state.rendering) return 'Rendering…'
  return `Rendered in ${Math.max(1, Math.round(state.result.ms))} ms`
}

/** The audio taps the page's spectrum figures name: the lab works out a spectrum of these alone. */
function spectrumTaps(): string[] {
  const named = [...document.querySelectorAll<HTMLElement>('[data-spectrum-taps]')].flatMap(
    (figure) => (figure.dataset.spectrumTaps ?? '').split(' ').filter(Boolean),
  )
  return [...new Set(named)]
}

export default function PlayBar({ lab, seconds, sources, stages, bench }: Props) {
  const state = useLab()
  const bar = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    startLab({
      lab,
      seconds,
      sources: sources.map((source) => source.id),
      spectra: spectrumTaps(),
    })
  }, [lab, seconds, sources])

  useEffect(() => {
    const root = document.documentElement
    // Scripts run here: the buttons that need the lab may show (figures/Mark.astro says it first
    // on a page that has such a button in its text).
    root.setAttribute('data-lab', '')
    // The bar lies over the page's foot, and wraps to more rows in a narrow window: the page is
    // told how tall it is, so that what a key brings into view is never brought under it.
    const element = bar.current
    if (!element) return
    const measure = () =>
      root.style.setProperty('--playbar-height', `${Math.ceil(element.offsetHeight)}px`)
    measure()
    const sizes = new ResizeObserver(measure)
    sizes.observe(element)
    return () => {
      sizes.disconnect()
      root.style.removeProperty('--playbar-height')
    }
  }, [])

  const ready = state.status === 'ready' && state.result !== undefined
  const main = stages.filter((stage) => !isBuilt(stage.id))
  const built = stages.filter((stage) => isBuilt(stage.id))
  const sounding = state.sounding || main[main.length - 1]?.id || ''
  // A card that is sounding is named beside its stage; once a control is moved by hand the card's
  // name goes and the stage's stands alone.
  const audition = state.playing ? state.audition : null
  const called = (name: string) => (audition ? `${name} · ${audition.label}` : name)
  const stageName = stages.find((stage) => stage.id === sounding)?.name
  const soundingName =
    sounding === BENCH ? `The real device: ${bench}` : stageName && called(stageName)
  const option = (stage: { id: string; name: string }) => (
    <option key={stage.id} value={stage.id}>
      {stage.id === sounding ? called(stage.name) : stage.name}
    </option>
  )

  return (
    <div
      ref={bar}
      className="playbar"
      role="region"
      aria-label="Player"
      data-ready={ready ? '' : undefined}
      data-renders={state.renders}
      data-audition={audition?.id}
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
      {state.memory && (
        <button
          type="button"
          className="playbar-back"
          title="Put back the settings, the source and the stage from before the first card"
          onClick={() => labStore().back()}
        >
          <span aria-hidden="true">↩</span> Back
          <span className="playbar-back-more"> to where you were</span>
        </button>
      )}
      <div className="playbar-field playbar-stage">
        <label htmlFor="lab-stage">Hearing</label>
        <select
          id="lab-stage"
          value={sounding}
          disabled={!ready}
          onChange={(event) => labStore().listen(event.target.value)}
        >
          {main.map(option)}
          {built.length > 0 && <optgroup label="Built so far">{built.map(option)}</optgroup>}
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
        {statusOf(state)}
      </span>
    </div>
  )
}
