// Plain JSON, for the annotations a host application keeps on parts of a
// document (`Clip.meta`, `ScoreSource.meta`). The library carries these
// through validation, serialisation and operations and never reads them.

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

/** A JSON object: what a `meta` field holds. */
export type JsonObject = Record<string, JsonValue>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const proto: unknown = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/** True for anything `JSON.stringify` writes and `JSON.parse` reads back unchanged. */
export function isJsonValue(value: unknown): value is JsonValue {
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return true
    case 'number':
      return Number.isFinite(value)
    case 'object':
      if (value === null) return true
      if (Array.isArray(value)) return value.every(isJsonValue)
      return isPlainObject(value) && Object.values(value).every(isJsonValue)
    default:
      return false
  }
}

export function isJsonObject(value: unknown): value is JsonObject {
  return isPlainObject(value) && isJsonValue(value)
}

/** A deep copy with object keys in sorted order, so equal values serialise identically. */
export function canonicalJson<T extends JsonValue>(value: T): T {
  if (Array.isArray(value)) return value.map(canonicalJson) as T
  if (typeof value !== 'object' || value === null) return value
  const out: JsonObject = {}
  for (const key of Object.keys(value).sort()) out[key] = canonicalJson(value[key])
  return out as T
}

/** Deep equality of two JSON values; key order does not matter. */
export function sameJson(a: JsonValue | undefined, b: JsonValue | undefined): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined || a === null || b === null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, index) => sameJson(item, b[index]))
  }
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => key in b && sameJson(a[key], b[key]))
}
