// A check's value in the run of a sentence: the number the lab worked out on this render, with
// its unit, and nothing round it. It is a span, so the sentence's paragraph holds it; the line
// of its own that a check otherwise is (CheckLine.tsx) is a paragraph and cannot stand in one.

import { useLab } from '../lab/page.ts'
import type { CheckInfo } from '../lab/describe.ts'
import { valueWithUnit } from '../lib/parts.ts'

type Check = Omit<CheckInfo, 'index'>

/** The value as the sentence prints it. Before a render has landed there is none to print. */
export function CheckValueView({ check, value }: { check: Check; value: number | undefined }) {
  return (
    <span className="check-inline" data-check={check.id} title={check.name}>
      {value === undefined ? '…' : valueWithUnit(value, check.unit)}
    </span>
  )
}

export default function CheckValue({ check }: { check: Check }) {
  return <CheckValueView check={check} value={useLab().result?.checks[check.id]} />
}
