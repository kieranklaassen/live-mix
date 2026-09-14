// Records every automation call on an AudioParam. Lifted from Breathwork
// Live's musicEngine.test.ts harness; tests assert on the recorded event
// stream rather than on engine internals.

export interface AutomationEvent {
  method: string
  args: unknown[]
}

/** @deprecated Use `AutomationEvent`. */
export type ParamEvent = AutomationEvent

export class MockAudioParam {
  value = 1
  defaultValue = 1
  minValue = -3.4028234663852886e38
  maxValue = 3.4028234663852886e38
  readonly events: AutomationEvent[] = []

  constructor(value = 1) {
    this.value = value
    this.defaultValue = value
  }

  private record(method: string, args: unknown[]): this {
    this.events.push({ method, args })
    return this
  }

  setValueAtTime(...args: unknown[]): this {
    return this.record('setValueAtTime', args)
  }
  linearRampToValueAtTime(...args: unknown[]): this {
    return this.record('linearRampToValueAtTime', args)
  }
  exponentialRampToValueAtTime(...args: unknown[]): this {
    return this.record('exponentialRampToValueAtTime', args)
  }
  setValueCurveAtTime(...args: unknown[]): this {
    return this.record('setValueCurveAtTime', args)
  }
  setTargetAtTime(...args: unknown[]): this {
    return this.record('setTargetAtTime', args)
  }
  cancelScheduledValues(...args: unknown[]): this {
    return this.record('cancelScheduledValues', args)
  }
  cancelAndHoldAtTime(...args: unknown[]): this {
    return this.record('cancelAndHoldAtTime', args)
  }

  eventsFor(method: string): AutomationEvent[] {
    return this.events.filter((e) => e.method === method)
  }

  lastEvent(method: string): AutomationEvent | undefined {
    const events = this.eventsFor(method)
    return events[events.length - 1]
  }
}
