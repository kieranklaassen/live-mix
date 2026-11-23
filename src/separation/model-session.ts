// What the three kinds of model share of a session: how a count is said in a
// refusal, and the check of a tensor a session answered with.

import { SeparationError } from './types'

/** `count` with its word, in the plural unless it is one: "1 input", "2 outputs". */
export function counted(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** The numbers of an answer the session gave under `name`, which has to hold `length` of them. */
export function answered(
  answer: Record<string, unknown>,
  name: string,
  length: number,
): Float32Array {
  const tensor = answer[name] as { data?: unknown; dims?: unknown } | undefined
  const data = tensor?.data
  if (!(data instanceof Float32Array) || data.length !== length) {
    const found =
      data instanceof Float32Array
        ? `${data.length} numbers (dimensions ${JSON.stringify(tensor?.dims)})`
        : 'no float tensor'
    throw new SeparationError(`the model's output "${name}" holds ${found}, not ${length}`)
  }
  return data
}
