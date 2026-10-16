// The lab's controls. A ranged one is the kit's knob, the control the real device's plate has:
// dragged sideways, stepped by the arrow keys, sent to an end by Home and End, put back by a
// double click, and deaf to the wheel, so that scrolling a long page never moves one. A control
// of a few choices is a group of choices. Moving either renders the lab again.

// The knob is read from the kit's own file. The kit's built module is one file, so taking the
// knob from it would bring every lesson page all of it, plate and timeline included, before
// anything shows; this file brings the knob alone.
import { Knob } from '../../../src/react/components/Knob.tsx'
import { labStore, useLab } from '../lab/page.ts'
import type { ControlInfo } from '../lab/describe.ts'
import Choices from './Choices.tsx'
import { withUnit } from './draw.ts'

/** The knob's width across, in pixels. */
const SIZE = 40

export function Control({ control }: { control: ControlInfo }) {
  const state = useLab()
  const value = state.values[control.id] ?? control.initial
  const ready = state.status === 'ready'
  const name = `control-${control.id}`

  if (control.choices.length > 0) {
    return (
      <div className="dial dial-switch" data-control={control.id}>
        <span className="dial-name" id={name}>
          {control.name}
        </span>
        <Choices
          className="dial-choices"
          labelledBy={name}
          choices={control.choices.map((choice, index) => ({
            value: control.min + index,
            name: choice,
          }))}
          value={Math.round(value)}
          disabled={!ready}
          onChoose={(chosen) => labStore().setValue(control.id, Number(chosen))}
        />
      </div>
    )
  }

  return (
    <div className="dial" data-control={control.id}>
      <span className="dial-name" aria-hidden="true">
        {control.name}
      </span>
      <Knob
        label={control.name}
        value={value}
        defaultValue={control.initial}
        min={control.min}
        max={control.max}
        taper={control.scale === 'log' ? 'log' : 'linear'}
        axis="horizontal"
        wheel={false}
        size={SIZE}
        disabled={!ready}
        format={(shown) => withUnit(shown, control.unit)}
        hideLabel
        hideValue
        onChange={(next) => labStore().setValue(control.id, next)}
      />
      <output className="dial-value">{withUnit(value, control.unit)}</output>
    </div>
  )
}

export default function Controls({ controls }: { controls: ControlInfo[] }) {
  return (
    <div className="dials">
      {controls.map((control) => (
        <Control key={control.id} control={control} />
      ))}
    </div>
  )
}
