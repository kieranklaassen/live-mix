// A number the lab works out on every render to hold the lesson to the device: how far what the
// lesson rebuilt stands from what the device itself did.

import { useLab } from '../lab/page.ts'
import type { CheckInfo } from '../lab/describe.ts'
import { withUnit } from './draw.ts'

export default function CheckLine({ check }: { check: Omit<CheckInfo, 'index'> }) {
  const value = useLab().result?.checks[check.id]
  return (
    <p className="check" data-check={check.id}>
      <span className="label">Checked on this render</span>
      <span>
        {check.name}: <b>{value === undefined ? '…' : withUnit(value, check.unit)}</b>
      </span>
    </p>
  )
}
