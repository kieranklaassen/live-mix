import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { createWorkletNode, setWorkletNodeConstructor } from '../worklet-node'

/** A constructor that says which one it is and what it was handed. */
function constructorNamed(realm: string) {
  return class {
    readonly realm = realm
    constructor(
      readonly context: BaseAudioContext,
      readonly name: string,
      readonly options?: AudioWorkletNodeOptions,
    ) {}
  } as unknown as typeof AudioWorkletNode
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createWorkletNode', () => {
  it("makes a node with the page's constructor on a context that was given none", () => {
    vi.stubGlobal('AudioWorkletNode', constructorNamed('page'))
    const context = asAudioContext(createMockContext())
    const options = { numberOfInputs: 2 }
    const node = createWorkletNode(context, 'a-processor', options)
    expect(node).toMatchObject({ realm: 'page', context, name: 'a-processor', options })
  })

  it('makes a node with the constructor its context was given, and no other context with it', () => {
    vi.stubGlobal('AudioWorkletNode', constructorNamed('page'))
    const framed = asAudioContext(createMockContext())
    const other = asAudioContext(createMockContext())
    setWorkletNodeConstructor(framed, constructorNamed('frame'))
    expect(createWorkletNode(framed, 'a-processor', {})).toMatchObject({
      realm: 'frame',
      context: framed,
    })
    expect(createWorkletNode(other, 'a-processor', {})).toMatchObject({ realm: 'page' })
  })
})

describe('the worklet hosts of the library', () => {
  it('make their nodes here and nowhere else, so a context given a constructor has all of them made with it', () => {
    const src = fileURLToPath(new URL('../..', import.meta.url))
    const makers = readdirSync(src, { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.tsx?$/.test(file) && !/__tests__|\.test\./.test(file))
      .filter((file) =>
        readFileSync(`${src}/${file}`, 'utf8')
          .split('\n')
          .some((line) => !/^\s*(\/\/|\/?\*)/.test(line) && line.includes('new AudioWorkletNode(')),
      )
    expect(makers).toEqual([])
  })
})
