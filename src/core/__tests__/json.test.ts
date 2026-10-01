import { describe, expect, it } from 'vitest'

import { canonicalJson, isJsonObject, isJsonValue, sameJson } from '../json'

describe('json', () => {
  it('accepts what JSON round-trips and nothing else', () => {
    expect(isJsonValue({ a: [1, 'two', true, null, { b: 0.5 }] })).toBe(true)
    expect(isJsonValue(Number.NaN)).toBe(false)
    expect(isJsonValue(Number.POSITIVE_INFINITY)).toBe(false)
    expect(isJsonValue(undefined)).toBe(false)
    expect(isJsonValue({ a: undefined })).toBe(false)
    expect(isJsonValue({ at: new Date(0) })).toBe(false)
    expect(isJsonValue([() => 1])).toBe(false)
    expect(isJsonValue(new Map())).toBe(false)
  })

  it('an object is a plain one: no arrays, nulls or class instances', () => {
    expect(isJsonObject({})).toBe(true)
    expect(isJsonObject(Object.create(null))).toBe(true)
    expect(isJsonObject([])).toBe(false)
    expect(isJsonObject(null)).toBe(false)
    expect(isJsonObject('x')).toBe(false)
    expect(isJsonObject(new (class Thing {})())).toBe(false)
  })

  it('canonicalJson copies deeply with sorted keys', () => {
    const value = { b: [{ d: 1, c: 2 }], a: null }
    const copy = canonicalJson(value)
    expect(JSON.stringify(copy)).toBe('{"a":null,"b":[{"c":2,"d":1}]}')
    expect(copy).not.toBe(value)
    expect(copy.b[0]).not.toBe(value.b[0])
  })

  it('sameJson compares by value and ignores key order', () => {
    expect(sameJson({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 })).toBe(true)
    expect(sameJson({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(sameJson([1, 2], [2, 1])).toBe(false)
    expect(sameJson([1], { 0: 1 })).toBe(false)
    expect(sameJson(null, null)).toBe(true)
    expect(sameJson(null, {})).toBe(false)
    expect(sameJson(undefined, undefined)).toBe(true)
    expect(sameJson(undefined, {})).toBe(false)
    expect(sameJson('a', 'a')).toBe(true)
    expect(sameJson(1, '1')).toBe(false)
  })
})
