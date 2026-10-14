// What the browser hands over or does not: a context, a shader. Where it does not, the frame that asked is given
// up on with a reason, and whoever paints keeps the frame before it.

export function have<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`live-mix visuals: no ${what}`)
  return value
}
