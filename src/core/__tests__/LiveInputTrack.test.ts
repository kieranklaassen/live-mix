import { describe, expect, it } from 'vitest'

import { MockMediaStream, asAudioContext, createMockContext } from '../../testing'
import { createEngine } from '../Engine'
import {
  ConvolverReverb,
  REVERB_DECAY_SECONDS,
  REVERB_WET_LEVEL,
  createConvolverReverb,
} from '../devices/native/ConvolverReverb'
import { LiveInputTrack } from '../tracks/LiveInputTrack'
import { ReturnTrack } from '../tracks/ReturnTrack'

describe('LiveInputTrack', () => {
  it('attach creates a dry gain to the destination and wires the source into it', () => {
    const ctx = createMockContext()
    const track = new LiveInputTrack(asAudioContext(ctx), {
      name: 'voice',
      destination: ctx.destination as unknown as AudioNode,
    })
    const voice = ctx.createGain()
    const node = track.attach(voice as unknown as AudioNode)
    expect(node).toBe(voice)
    const gain = ctx.gains[1]
    expect(track.gainNode).toBe(gain)
    expect(track.source).toBe(voice)
    expect(gain.connectCalls.calledWith(ctx.destination)).toBe(true)
    expect(voice.connectCalls.calledWith(gain)).toBe(true)
  })

  it('re-attach disconnects the previous source and gain and creates a new gain', () => {
    const ctx = createMockContext()
    const track = new LiveInputTrack(asAudioContext(ctx), {
      name: 'voice',
      destination: ctx.destination as unknown as AudioNode,
    })
    const first = ctx.createGain()
    const second = ctx.createGain()
    track.attach(first as unknown as AudioNode)
    const firstGain = ctx.gains[2]
    track.attach(second as unknown as AudioNode)
    expect(first.disconnectCalls.count).toBe(1)
    expect(firstGain.disconnectCalls.count).toBe(1)
    const secondGain = ctx.gains[3]
    expect(second.connectCalls.calledWith(secondGain)).toBe(true)
    expect(secondGain.connectCalls.calledWith(ctx.destination)).toBe(true)
    expect(track.gainNode).toBe(secondGain)
  })

  it('attaches a MediaStream through a MediaStreamAudioSourceNode', () => {
    const ctx = createMockContext()
    const track = new LiveInputTrack(asAudioContext(ctx), {
      name: 'mic',
      destination: ctx.destination as unknown as AudioNode,
      gain: 0.5,
    })
    const stream = new MockMediaStream('mic')
    const node = track.attach(stream as unknown as MediaStream)
    expect(ctx.streamSources).toHaveLength(1)
    expect(node).toBe(ctx.streamSources[0])
    expect(ctx.streamSources[0].mediaStream).toBe(stream)
    expect(ctx.gains[0].gain.value).toBe(0.5)
  })

  it('onAttach fires with the new source before the dry gain exists (ducker re-key hook)', () => {
    const ctx = createMockContext()
    const track = new LiveInputTrack(asAudioContext(ctx), {
      name: 'voice',
      destination: ctx.destination as unknown as AudioNode,
    })
    const order: string[] = []
    track.onAttach((source) => {
      order.push(`attach:${(source as unknown as { id: number }).id}`)
      ctx.createAnalyser()
    })
    const voice = ctx.createGain()
    track.attach(voice as unknown as AudioNode)
    expect(order).toEqual([`attach:${voice.id}`])
    // analyser (from the hook) was created before the dry gain.
    expect(ctx.analysers[0].id).toBeLessThan(ctx.gains[1].id)
  })

  it('sends connect the raw source to the return input, and follow a re-attach', () => {
    const ctx = createMockContext()
    const track = new LiveInputTrack(asAudioContext(ctx), {
      name: 'voice',
      destination: ctx.destination as unknown as AudioNode,
    })
    const hall = new ReturnTrack({
      name: 'hall',
      device: createConvolverReverb(asAudioContext(ctx)),
      destination: ctx.destination as unknown as AudioNode,
    })
    const first = ctx.createGain()
    track.attach(first as unknown as AudioNode)
    track.sends.add(hall)
    expect(first.connectCalls.calledWith(hall.input)).toBe(true)
    expect(ctx.gains.filter((g) => g !== first)).toHaveLength(2) // dry gain + wet gain: no send gain

    const second = ctx.createGain()
    track.attach(second as unknown as AudioNode)
    expect(second.connectCalls.calledWith(hall.input)).toBe(true)

    const levelled = new ReturnTrack({
      name: 'aux',
      device: createConvolverReverb(asAudioContext(ctx)),
      destination: ctx.destination as unknown as AudioNode,
    })
    const send = track.sends.add(levelled, { level: 0.3 })
    expect(send.gainNode?.gain.value).toBe(0.3)
    expect(second.connectCalls.calledWith(send.gainNode)).toBe(true)
    expect(track.sends.all()).toHaveLength(2)
    track.sends.remove(hall)
    expect(track.sends.all().map((s) => s.target)).toEqual([levelled])
  })

  it('detach and dispose unwire everything', () => {
    const ctx = createMockContext()
    const track = new LiveInputTrack(asAudioContext(ctx), {
      name: 'voice',
      destination: ctx.destination as unknown as AudioNode,
    })
    const voice = ctx.createGain()
    track.attach(voice as unknown as AudioNode)
    track.detach()
    expect(track.source).toBeNull()
    expect(track.gainNode).toBeNull()
    expect(voice.disconnectCalls.count).toBe(1)
    track.dispose()
    expect(() => track.attach(voice as unknown as AudioNode)).toThrow(/disposed/)
  })
})

describe('ConvolverReverb (hall preset)', () => {
  it('generates a 2.6 s stereo decaying-noise IR into a 0.26 wet gain', () => {
    const ctx = createMockContext({ sampleRate: 1000 })
    const reverb = createConvolverReverb(asAudioContext(ctx), { random: () => 1 })
    expect(reverb).toBeInstanceOf(ConvolverReverb)
    const convolver = ctx.convolvers[0]
    const wet = ctx.gains[0]
    expect(convolver.id).toBeLessThan(wet.id)
    expect(convolver.buffer?.numberOfChannels).toBe(2)
    expect(convolver.buffer?.length).toBe(Math.floor(REVERB_DECAY_SECONDS * 1000))
    const data = convolver.buffer?.getChannelData(1) ?? new Float32Array(0)
    expect(data[0]).toBeCloseTo(1)
    expect(data[data.length - 1]).toBeLessThan(0.01)
    expect(wet.gain.value).toBe(REVERB_WET_LEVEL)
    expect(convolver.connectCalls.calledWith(wet)).toBe(true)
    expect(reverb.input).toBe(convolver)
    expect(reverb.output).toBe(wet)
  })

  it('wet param ramps, bypass mutes the wet path, dispose disconnects', () => {
    const ctx = createMockContext({ currentTime: 2 })
    const reverb = createConvolverReverb(asAudioContext(ctx))
    reverb.setParam('wet', 0.5)
    expect(reverb.getParam('wet')).toBe(0.5)
    expect(ctx.gains[0].gain.lastEvent('setTargetAtTime')?.args).toEqual([0.5, 2, 0.02])
    reverb.bypass = true
    expect(ctx.gains[0].gain.lastEvent('setTargetAtTime')?.args).toEqual([0, 2, 0.02])
    reverb.bypass = false
    expect(ctx.gains[0].gain.lastEvent('setTargetAtTime')?.args).toEqual([0.5, 2, 0.02])
    expect(() => reverb.setParam('nope', 1)).toThrow(/no parameter/)
    reverb.dispose()
    expect(ctx.convolvers[0].disconnectCalls.count).toBe(1)
    expect(ctx.gains[0].disconnectCalls.count).toBe(1)
  })
})

describe('Breathwork Live topology on the engine (U7 acceptance)', () => {
  it('reproduces musicEngine.attachVoiceSource node order and connections', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const music = engine.addBus('music')
    const ducker = engine.addDucker(music)
    const voice = engine.addLiveInputTrack('voice', { destination: engine.output.output })
    voice.onAttach((source) => ducker.key(source))
    let hall: ReturnTrack | null = null
    const attachVoiceSource = (node: AudioNode) => {
      voice.attach(node)
      if (!hall) {
        hall = engine.addReturnTrack('hall', {
          device: createConvolverReverb(engine.context),
          destination: engine.output.output,
        })
        voice.sends.add(hall)
      }
    }

    // Gains in creation order: master (0), duck (1).
    expect(engine.master.gainNode).toBe(ctx.gains[0])
    expect(music.gainNode).toBe(ctx.gains[1])
    expect(ctx.gains[1].connectCalls.calledWith(ctx.gains[0])).toBe(true)
    expect(ctx.gains[0].connectCalls.calledWith(ctx.destination)).toBe(true)

    const first = ctx.createGain()
    attachVoiceSource(first as unknown as AudioNode)
    const analyser = ctx.analysers[0]
    const duckGain = ctx.gains[1]
    const voiceGain = ctx.gains[3] // gains[2] is the test's own `first`
    // Envelope-follower tap.
    expect(first.connectCalls.calledWith(analyser)).toBe(true)
    // Audible path terminates at the terminus via a dedicated voice gain —
    // never through the duck gain, which would mute the voice.
    expect(first.connectCalls.calledWith(voiceGain)).toBe(true)
    expect(voiceGain.connectCalls.calledWith(ctx.destination)).toBe(true)
    expect(first.connectCalls.calledWith(duckGain)).toBe(false)
    expect(voiceGain.connectCalls.calledWith(duckGain)).toBe(false)
    // Hall-reverb wet send: voice -> convolver (generated IR) -> quiet wet gain -> terminus.
    const reverb = ctx.convolvers[0]
    expect(reverb.buffer).toBeTruthy()
    expect(first.connectCalls.calledWith(reverb)).toBe(true)
    const reverbGain = ctx.gains[4]
    expect(reverbGain.gain.value).toBeCloseTo(REVERB_WET_LEVEL)
    expect(reverb.connectCalls.calledWith(reverbGain)).toBe(true)
    expect(reverbGain.connectCalls.calledWith(ctx.destination)).toBe(true)

    // Re-attach: previous node, gain and analyser disconnected; reverb is engine-lifetime.
    const second = ctx.createGain()
    attachVoiceSource(second as unknown as AudioNode)
    expect(first.disconnectCalls.count).toBe(1)
    expect(voiceGain.disconnectCalls.count).toBe(1)
    expect(analyser.disconnectCalls.count).toBe(1)
    expect(ctx.convolvers).toHaveLength(1)
    const secondGain = ctx.gains[6] // gains[5] is `second`
    expect(second.connectCalls.calledWith(ctx.analysers[1])).toBe(true)
    expect(second.connectCalls.calledWith(secondGain)).toBe(true)
    expect(secondGain.connectCalls.calledWith(ctx.destination)).toBe(true)
    expect(second.connectCalls.calledWith(reverb)).toBe(true)

    // Engine stop: master fades with the Breathwork constant and the ducker poll ends.
    ctx.currentTime = 9
    engine.stop({ fadeSec: 0.75 })
    expect(ctx.gains[0].gain.lastEvent('setTargetAtTime')?.args).toEqual([0, 9, 0.25])
    engine.dispose()
  })
})
