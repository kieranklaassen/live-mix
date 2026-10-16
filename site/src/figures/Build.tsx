// The build part's moving half. The page as built holds every step, one after another, and reads
// that way with scripts off. Once the lab is ready this shows one step at a time: a row of the
// steps to go to, and, under the step's listing, Back, Add and "Hear it so far". The step is the
// lab's `build` control (build-steps.ts); nothing here keeps a step of its own.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { labStore, useLab } from '../lab/page.ts'
import { BUILD } from '../lab/store.ts'
import {
  addLabel,
  afterStep,
  beforeStep,
  goToStep,
  hearSoFar,
  stepAt,
  stepPlace,
} from './build-steps.ts'
import { tapState } from './sounding.ts'

interface Props {
  /** The steps' names, as the lab's build control lists them. */
  names: string[]
  /** The sound of what is built so far. */
  tap: { id: string; name: string }
}

/** A step's place, as the row of steps says it over the step's name. */
const placeWord = (place: 'built' | 'here' | 'ahead', index: number) =>
  place === 'built' ? 'built' : place === 'here' ? `step ${index + 1}` : `${index + 1}`

export default function Build({ names, tap }: Props) {
  const state = useLab()
  const root = useRef<HTMLDivElement | null>(null)
  /** How the reader went to the step that is about to show: by Back or Add, or by the row of steps. */
  const went = useRef<'on' | 'across' | undefined>(undefined)
  const [nav, setNav] = useState<Element | null>(null)
  const ready = state.status === 'ready' && state.result !== undefined
  const step = stepAt(state.values[BUILD], names.length)

  // Show the step the lab is on and no other; with no lab, every step, as the page was built.
  useEffect(() => {
    const steps = [
      ...(root.current?.closest('[data-build]')?.querySelectorAll<HTMLElement>('[data-step]') ??
        []),
    ]
    steps.forEach((element, index) => {
      element.hidden = ready && index !== step
      // A step the reader went to comes in with a short fade (styles/parts.css), unless the
      // system asks for less motion; the step a page opens on does not.
      element.toggleAttribute('data-entered', ready && index === step && went.current !== undefined)
    })
    const shown = ready ? steps[step] : undefined
    setNav(shown?.querySelector('[data-step-nav]') ?? null)
    if (shown && went.current === 'on') {
      // Back and Add stand at the foot of a step, and the next step is read from its top: its
      // heading takes the keys and is brought into view, at once under the reduced-motion setting.
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const heading = shown.querySelector<HTMLElement>('[data-step-title]')
      heading?.focus({ preventScroll: true })
      heading?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
    }
    went.current = undefined
  }, [ready, step])

  const go = (to: number, how: 'on' | 'across') => {
    if (to !== step) went.current = how
    goToStep(labStore(), to)
  }
  const back = beforeStep(step)
  const hear = tapState(state, tap.id)

  return (
    <div ref={root} className="build-bar">
      {ready && (
        <ol className="build-tabs" aria-label="The steps of the build">
          {names.map((name, index) => {
            const place = stepPlace(index, step)
            return (
              <li key={index}>
                <button
                  type="button"
                  data-place={place}
                  aria-current={place === 'here' ? 'step' : undefined}
                  onClick={() => go(index, 'across')}
                >
                  <span className="build-tab-place">{placeWord(place, index)}</span>
                  {name}
                </button>
              </li>
            )
          })}
        </ol>
      )}
      {ready &&
        nav &&
        createPortal(
          <>
            <button
              type="button"
              className="hear"
              disabled={back === undefined}
              onClick={() => back !== undefined && go(back, 'on')}
            >
              Back
            </button>
            <button
              type="button"
              className="hear hear-main"
              data-build-add
              onClick={() => go(afterStep(step, names.length), 'on')}
            >
              {addLabel(step, names)}
            </button>
            <button
              type="button"
              className="hear"
              data-build-hear
              aria-pressed={hear === 'sounding'}
              aria-busy={hear === 'busy' || undefined}
              aria-label={`${hear === 'busy' ? 'Loading' : 'Hear it so far'}: ${tap.name}`}
              onClick={() => hearSoFar(labStore(), tap.id)}
            >
              <span aria-hidden="true">{hear === 'sounding' ? '■' : '▶'}</span>
              {hear === 'busy' ? 'Loading' : 'Hear it so far'}
            </button>
          </>,
          nav,
        )}
    </div>
  )
}
