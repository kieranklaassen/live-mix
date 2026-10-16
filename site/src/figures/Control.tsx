// The lab's controls, as sliders and switches. Moving one renders the lab again.

import { labStore, useLab } from '../lab/page.ts'
import type { ControlInfo } from '../lab/describe.ts'
import { fromUnit, toUnit, withUnit, type Axis } from './draw.ts'

const STEPS = 1000

const axisOf = (control: ControlInfo): Axis => ({
  min: control.min,
  max: control.max,
  log: control.scale === 'log',
})
const toSlider = (control: ControlInfo, value: number) => toUnit(axisOf(control), value) * STEPS
const fromSlider = (control: ControlInfo, place: number) => fromUnit(axisOf(control), place / STEPS)

export function Control({ control }: { control: ControlInfo }) {
  const state = useLab()
  const value = state.values[control.id] ?? control.initial
  const ready = state.status === 'ready'
  const moved = Math.abs(value - control.initial) > 1e-9
  const name = `control-${control.id}`

  if (control.choices.length > 0) {
    return (
      <div className="control" role="radiogroup" aria-labelledby={name} data-control={control.id}>
        <span className="control-name" id={name}>
          {control.name}
        </span>
        <span className="control-choices">
          {control.choices.map((choice, index) => (
            <button
              key={choice}
              type="button"
              role="radio"
              aria-checked={Math.round(value) === control.min + index}
              disabled={!ready}
              onClick={() => labStore().setValue(control.id, control.min + index)}
            >
              {choice}
            </button>
          ))}
        </span>
      </div>
    )
  }

  return (
    <div className="control" data-control={control.id}>
      <label className="control-name" htmlFor={name}>
        {control.name}
      </label>
      <output className="control-value" htmlFor={name}>
        {withUnit(value, control.unit)}
      </output>
      <input
        id={name}
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={Math.round(toSlider(control, value))}
        disabled={!ready}
        aria-valuetext={withUnit(value, control.unit)}
        onChange={(event) =>
          labStore().setValue(control.id, fromSlider(control, Number(event.target.value)))
        }
      />
      <button
        type="button"
        className="control-reset"
        disabled={!moved}
        aria-label={`Put ${control.name} back to ${withUnit(control.initial, control.unit)}`}
        title={`Back to ${withUnit(control.initial, control.unit)}`}
        onClick={() => labStore().setValue(control.id, control.initial)}
      >
        ↺
      </button>
    </div>
  )
}

export default function Controls({ controls }: { controls: ControlInfo[] }) {
  return (
    <div className="controls">
      {controls.map((control) => (
        <Control key={control.id} control={control} />
      ))}
    </div>
  )
}
