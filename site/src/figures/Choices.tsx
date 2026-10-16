// A few choices of which one holds: the positions of a switch, the sounds of a lesson. Arrow keys
// move the choice along, Home and End take the ends, and Tab stops once, on the one chosen.

import type { KeyboardEvent, ReactNode } from 'react'

interface Props {
  /** The choices, in order: what picks each, what it says, and a line about it. */
  choices: { value: string | number; name: ReactNode; about?: string }[]
  /** The one that holds; none when it is not among the choices. */
  value: string | number | undefined
  onChoose: (value: string | number) => void
  disabled?: boolean
  className?: string
  /** What the group is called: the id of the element that names it, or the name itself. */
  labelledBy?: string
  label?: string
}

export default function Choices(props: Props) {
  const { choices, value, onChoose, disabled } = props
  const chosen = choices.findIndex((choice) => choice.value === value)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = chosen < 0 ? 0 : chosen
    const to =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? (from + 1) % choices.length
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? (from + choices.length - 1) % choices.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? choices.length - 1
              : undefined
    if (to === undefined || disabled) return
    event.preventDefault()
    onChoose(choices[to]!.value)
    event.currentTarget.querySelectorAll<HTMLElement>('[role=radio]')[to]?.focus()
  }
  return (
    <div
      className={props.className}
      role="radiogroup"
      aria-labelledby={props.labelledBy}
      aria-label={props.label}
      onKeyDown={onKeyDown}
    >
      {choices.map((choice, index) => (
        <button
          key={choice.value}
          type="button"
          role="radio"
          aria-checked={index === chosen}
          // One stop for the group: the choice that holds, or the first when none does.
          tabIndex={index === Math.max(0, chosen) ? 0 : -1}
          title={choice.about}
          disabled={disabled}
          onClick={() => onChoose(choice.value)}
        >
          {choice.name}
        </button>
      ))}
    </div>
  )
}
