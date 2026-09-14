import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  asAudioNode,
  createMockContext,
  type MockAudioContext,
  type MockGainNode,
} from '../../../testing'
import { createConvolverReverb } from '../../devices/native/ConvolverReverb'
import { createEngine, type Engine } from '../../Engine'
import { type AudioTrack } from '../AudioTrack'
import { GroupTrack } from '../GroupTrack'
import { ReturnTrack } from '../ReturnTrack'

function rig(currentTime = 0) {
  const ctx = createMockContext({ currentTime, sampleRate: 48000 })
  const engine = createEngine({ context: asAudioContext(ctx) })
  return { ctx, engine }
}

/** Start a 10 s linear voice on a track; returns the node that leaves the track. */
function sound(ctx: MockAudioContext, track: AudioTrack, key = 'k'): MockGainNode {
  const buffer = new MockAudioBuffer(2, 10 * ctx.sampleRate, ctx.sampleRate)
  const voice = track.play(
    key,
    {
      buffer: buffer as unknown as AudioBuffer,
      offsetSec: 0,
      durationSec: 10,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
    },
    ctx.currentTime,
  )
  if (!voice) throw new Error('voice did not start')
  return (voice.trim ?? voice.gain) as unknown as MockGainNode
}

function gainOf(node: AudioNode | null): MockGainNode {
  if (!node) throw new Error('expected a node')
  return node as unknown as MockGainNode
}

describe('GroupTrack', () => {
  it('is an eager strip: input gain → panner → fader → gate → destination, after the master', () => {
    const { ctx, engine } = rig()
    const drums = engine.addGroup('drums', { gain: 0.5 })
    expect(drums).toBeInstanceOf(GroupTrack)
    expect(drums.strip.materialized).toBe(true)
    const [master, inputGain, fader, gate] = ctx.gains
    const [panner] = ctx.panners
    expect(ctx.gains).toHaveLength(4)
    expect(drums.input).toBe(inputGain)
    expect(inputGain.isConnectedTo(panner)).toBe(true)
    expect(panner.isConnectedTo(fader)).toBe(true)
    expect(fader.isConnectedTo(gate)).toBe(true)
    expect(gate.isConnectedTo(master)).toBe(true)
    expect(fader.gain.value).toBe(0.5)
    expect(drums.strip.level).toBe(0.5)
    expect(drums.members).toEqual([])
    expect(engine.group('drums')).toBe(drums)
    expect(engine.hasGroup('drums')).toBe(true)
    expect(engine.groups).toEqual([drums])
    expect(() => engine.addGroup('drums')).toThrow(/already exists/)
    expect(() => engine.group('nope')).toThrow(/no group/)
  })

  it('tracks created with the group as destination feed its input and are members', () => {
    const { ctx, engine } = rig()
    const drums = engine.addGroup('drums')
    const kick = engine.addAudioTrack('kick', { destination: drums })
    const out = sound(ctx, kick)
    expect(out.isConnectedTo(gainOf(drums.input))).toBe(true)
    expect(out.reaches(ctx.destination)).toBe(true)
    expect(kick.strip.parent).toBe(drums.strip)
    expect(drums.members).toEqual([kick.strip])
    expect(kick.strip.materialized).toBe(false)
  })

  it('add moves a sounding track in without building its strip; remove routes it back', () => {
    const { ctx, engine } = rig()
    const pad = engine.addAudioTrack('pad')
    const out = sound(ctx, pad)
    const master = gainOf(engine.master.input)
    expect(out.isConnectedTo(master)).toBe(true)

    const synths = engine.addGroup('synths')
    synths.add(pad)
    synths.add(pad)
    expect(out.isConnectedTo(master)).toBe(false)
    expect(out.isConnectedTo(gainOf(synths.input))).toBe(true)
    expect(out.reaches(ctx.destination)).toBe(true)
    expect(pad.strip.materialized).toBe(false)
    expect(synths.members).toEqual([pad.strip])

    // A voice started after the move goes to the group; one stopped is forgotten.
    const second = sound(ctx, pad, 'second')
    expect(second.isConnectedTo(gainOf(synths.input))).toBe(true)
    pad.stop('k')
    expect(pad.strip.sourceNodes).toEqual([second])

    synths.remove(pad)
    synths.remove(pad)
    expect(second.isConnectedTo(gainOf(synths.input))).toBe(false)
    expect(second.isConnectedTo(master)).toBe(true)
    expect(pad.strip.parent).toBeNull()
    expect(synths.members).toEqual([])
  })

  it('addGroup({ members }) routes them, groups nest, and loops are refused', () => {
    const { engine } = rig()
    const kick = engine.addAudioTrack('kick')
    const snare = engine.addAudioTrack('snare')
    const drums = engine.addGroup('drums', { members: [kick, snare] })
    expect(drums.members).toEqual([kick.strip, snare.strip])

    const all = engine.addGroup('all', { members: [drums] })
    expect(drums.strip.parent).toBe(all.strip)
    expect(gainOf(drums.strip.gate).isConnectedTo(gainOf(all.input))).toBe(true)
    expect(all.members).toEqual([drums.strip])

    expect(() => drums.add(all)).toThrow(/loop/)
    expect(() => all.add(all)).toThrow(/loop/)
    expect(drums.strip.parent).toBe(all.strip)

    // remove(member, destination) can send a member anywhere.
    const fx = engine.addBus('fx')
    drums.remove(kick, fx)
    expect(kick.strip.destination).toBe(fx.input)
    expect(kick.strip.parent).toBeNull()
  })

  it('a group fader, pan, mute, inserts and post-fader sends behave like any strip', () => {
    const { ctx, engine } = rig(4)
    const drums = engine.addGroup('drums')
    drums.strip.setLevel(0.8)
    drums.strip.setPan(0.25)
    drums.strip.mute = true
    expect(gainOf(drums.strip.fader).gain.events).toEqual([
      { method: 'setTargetAtTime', args: [0.8, 4, 0.005] },
    ])
    expect(ctx.panners[0].pan.events).toEqual([
      { method: 'setTargetAtTime', args: [0.25, 4, 0.005] },
    ])
    expect(gainOf(drums.strip.gate).gain.events).toEqual([
      { method: 'setTargetAtTime', args: [0, 4, 0.005] },
    ])

    const hall = engine.addReturnTrack('hall', { device: createConvolverReverb(engine.context) })
    const send = drums.strip.sends.add(hall, { level: 0.2 })
    expect(gainOf(drums.strip.gate).isConnectedTo(gainOf(send.gainNode))).toBe(true)
    expect(gainOf(send.gainNode).isConnectedTo(gainOf(hall.input))).toBe(true)
  })

  it('removeGroup routes members to where the group fed and disconnects its nodes', () => {
    const { ctx, engine } = rig()
    const music = engine.addBus('music')
    const drums = engine.addGroup('drums', { destination: music })
    const kick = engine.addAudioTrack('kick', { destination: drums })
    const out = sound(ctx, kick)
    const groupNodes = [drums.strip.inputGainNode, drums.strip.fader, drums.strip.gate].map(gainOf)

    engine.removeGroup('drums')
    engine.removeGroup('drums')
    expect(engine.hasGroup('drums')).toBe(false)
    expect(out.isConnectedTo(gainOf(music.input))).toBe(true)
    expect(out.reaches(ctx.destination)).toBe(true)
    expect(kick.strip.parent).toBeNull()
    expect(kick.strip.destinationTarget).toBe(music)
    for (const node of groupNodes) expect(node.disconnectCalls.last).toEqual([])
    expect(ctx.panners[0].disconnectCalls.count).toBe(1)
    expect(() => drums.add(kick)).toThrow(/disposed/)
  })

  it('engine.dispose disposes groups and empties the solo registry', () => {
    const { engine } = rig()
    const kick = engine.addAudioTrack('kick')
    engine.addGroup('drums', { members: [kick] })
    engine.addLiveInputTrack('voice')
    engine.addReturnTrack('hall', { device: createConvolverReverb(engine.context) })
    expect(engine.solo.registered).toHaveLength(4)
    engine.dispose()
    expect(engine.groups).toEqual([])
    expect(engine.solo.registered).toEqual([])
    expect(() => engine.addGroup('x')).toThrow(/disposed/)
  })
})

describe('solo-in-place across tracks, groups and returns', () => {
  function session() {
    const { ctx, engine } = rig(1)
    const kick = engine.addAudioTrack('kick')
    const snare = engine.addAudioTrack('snare')
    const drums = engine.addGroup('drums', { members: [kick, snare] })
    const pad = engine.addAudioTrack('pad')
    const voice = engine.addLiveInputTrack('voice')
    voice.attach(asAudioNode(ctx.createGain()))
    const hall = engine.addReturnTrack('hall', { device: createConvolverReverb(engine.context) })
    voice.sends.add(hall)
    const synthNode = ctx.createGain()
    const synth = engine.addInstrumentTrack('synth', {
      device: {
        id: 'synth',
        input: asAudioNode(synthNode),
        output: asAudioNode(synthNode),
        params: {},
        setParam: () => {},
        getParam: () => 0,
        bypass: false,
        latencySec: 0,
        dispose: () => synthNode.disconnect(),
        noteOn: () => {},
        noteOff: () => {},
      },
    })
    expect(synthNode.isConnectedTo(gainOf(engine.master.input))).toBe(true)
    return { ctx, engine, kick, snare, drums, pad, voice, hall, synth }
  }

  const audible = (s: { engine: Engine }) =>
    Object.fromEntries(s.engine.solo.registered.map((strip) => [strip.name, strip.audible]))

  it('soloing a group keeps its members open and mutes everything outside except returns', () => {
    const s = session()
    const before = s.ctx.gains.length
    s.drums.strip.solo = true
    expect(audible(s)).toEqual({
      kick: true,
      snare: true,
      drums: true,
      pad: false,
      voice: false,
      hall: true,
      synth: false,
    })
    expect(s.kick.strip.materialized).toBe(false)
    expect(s.hall.strip.materialized).toBe(false)
    expect(s.hall.strip.soloSafe).toBe(true)
    expect(s.synth.strip.implicitlyMuted).toBe(true)
    expect(gainOf(s.pad.strip.gate).gain.events).toEqual([
      { method: 'setTargetAtTime', args: [0, 1, 0.005] },
    ])
    expect(gainOf(s.voice.strip.gate).gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0)
    // Only the three implicitly muted strips were built (3 gains each).
    expect(s.ctx.gains.length - before).toBe(9)

    s.drums.strip.solo = false
    expect(Object.values(audible(s)).every(Boolean)).toBe(true)
    expect(gainOf(s.pad.strip.gate).gain.lastEvent('setTargetAtTime')?.args[0]).toBe(1)
  })

  it('soloing a member mutes its siblings, keeps the group passing, and mutes outside tracks', () => {
    const s = session()
    s.kick.strip.solo = true
    expect(audible(s)).toEqual({
      kick: true,
      snare: false,
      drums: true,
      pad: false,
      voice: false,
      hall: true,
      synth: false,
    })
    expect(s.drums.strip.implicitlyMuted).toBe(false)
    expect(gainOf(s.drums.strip.gate).gain.events).toEqual([])
    expect(s.snare.strip.implicitlyMuted).toBe(true)
  })

  it('a muted group silences a soloed member: mute wins', () => {
    const s = session()
    s.drums.strip.mute = true
    s.kick.strip.solo = true
    expect(s.drums.strip.audible).toBe(false)
    expect(s.kick.strip.audible).toBe(true)
    expect(gainOf(s.drums.strip.gate).gain.events).toHaveLength(1)
  })

  it('re-routing while a solo is active recomputes the gates', () => {
    const s = session()
    s.kick.strip.solo = true
    expect(s.pad.strip.audible).toBe(false)
    s.drums.add(s.pad)
    // Now a sibling of the soloed member: still muted, but for the sibling reason.
    expect(s.pad.strip.audible).toBe(false)
    s.pad.strip.solo = true
    expect(s.pad.strip.audible).toBe(true)
    s.drums.remove(s.pad)
    expect(s.pad.strip.audible).toBe(true)
    s.engine.solo.clear()
    expect(Object.values(audible(s)).every(Boolean)).toBe(true)
  })

  it('a return can opt out of solo-safe', () => {
    const s = session()
    s.hall.strip.soloSafe = false
    s.pad.strip.solo = true
    expect(s.hall.strip.audible).toBe(false)
    expect(gainOf(s.hall.strip.gate).gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0)
  })
})

describe('Phase 0 node-count contract', () => {
  it('tracks, live inputs and returns add no strip nodes until a strip feature is used', () => {
    const { ctx, engine } = rig()
    const music = engine.addBus('music')
    const track = engine.addAudioTrack('music', { destination: music })
    const voice = engine.addLiveInputTrack('voice', { destination: engine.output.output })
    const hall = engine.addReturnTrack('hall', {
      device: createConvolverReverb(engine.context),
      destination: engine.output.output,
    })
    voice.sends.add(hall)
    const source = ctx.createGain()
    voice.attach(asAudioNode(source))
    sound(ctx, track)
    // master, music bus, reverb wet, test source, voice dry gain, clip voice gain.
    expect(ctx.gains).toHaveLength(6)
    expect(ctx.panners).toHaveLength(0)
    expect([track, voice, hall].map((host) => host.strip.materialized)).toEqual([
      false,
      false,
      false,
    ])
    expect(gainOf(voice.gainNode).isConnectedTo(ctx.destination)).toBe(true)
    expect(ctx.gains[5].isConnectedTo(ctx.gains[1])).toBe(true)

    // First strip use on the live input builds four nodes and re-points the dry gain.
    voice.strip.setPan(-0.5)
    expect(ctx.gains).toHaveLength(9)
    expect(ctx.panners).toHaveLength(1)
    const dry = gainOf(voice.gainNode)
    expect(dry.isConnectedTo(ctx.destination)).toBe(false)
    expect(dry.isConnectedTo(gainOf(voice.strip.input))).toBe(true)
    expect(dry.reaches(ctx.destination)).toBe(true)
    // The raw source still feeds the pre-fader send directly.
    expect(source.isConnectedTo(gainOf(hall.input))).toBe(true)

    // A re-attach creates a fresh dry gain into the (now built) strip.
    voice.attach(asAudioNode(ctx.createGain()))
    expect(gainOf(voice.gainNode).isConnectedTo(gainOf(voice.strip.input))).toBe(true)
    expect(voice.strip.sourceNodes).toEqual([voice.gainNode])
  })

  it('the first strip use on a clip track re-points sounding voices, trimmed or not', () => {
    const { ctx, engine } = rig(2)
    const track = engine.addAudioTrack('music')
    const plain = sound(ctx, track, 'plain')
    const buffer = new MockAudioBuffer(2, 10 * ctx.sampleRate, ctx.sampleRate)
    const trimmed = track.play(
      'trimmed',
      {
        buffer: buffer as unknown as AudioBuffer,
        offsetSec: 0,
        durationSec: 10,
        fadeInSec: 1,
        fadeOutSec: 1,
        fadeCurve: 'equalPower',
        gainDb: -6,
      },
      2,
    )
    const trim = gainOf((trimmed as { trim: GainNode }).trim)
    const master = gainOf(engine.master.input)
    expect(plain.isConnectedTo(master)).toBe(true)
    expect(trim.isConnectedTo(master)).toBe(true)
    expect(track.strip.sourceNodes).toEqual([plain, trim])

    track.strip.mute = true
    const entry = gainOf(track.strip.input)
    expect(plain.isConnectedTo(master)).toBe(false)
    expect(trim.isConnectedTo(master)).toBe(false)
    expect(plain.isConnectedTo(entry)).toBe(true)
    expect(trim.isConnectedTo(entry)).toBe(true)
    expect(gainOf(track.strip.gate).gain.events).toEqual([
      { method: 'setTargetAtTime', args: [0, 2, 0.005] },
    ])
    // The voices' own envelopes are untouched by the move.
    expect(plain.gain.events).toEqual([{ method: 'setValueAtTime', args: [1, 2] }])

    track.stopAll()
    expect(track.strip.sourceNodes).toEqual([])
    engine.removeTrack('music')
    expect(engine.solo.registered.map((strip) => strip.name)).toEqual([])
  })

  it('a standalone return works without a context until a strip feature is asked for', () => {
    const ctx = createMockContext()
    const bare = new ReturnTrack({
      name: 'bare',
      device: createConvolverReverb(asAudioContext(ctx)),
      destination: asAudioNode(ctx.destination),
    })
    expect(gainOf(bare.device.output).isConnectedTo(ctx.destination)).toBe(true)
    expect(bare.strip.soloSafe).toBe(true)
    expect(() => (bare.strip.mute = true)).toThrow(/needs an AudioContext/)

    const engine = createEngine({ context: asAudioContext(ctx) })
    const hall = engine.addReturnTrack('hall', { device: createConvolverReverb(engine.context) })
    hall.strip.mute = true
    expect(hall.strip.materialized).toBe(true)
    expect(gainOf(hall.device.output).isConnectedTo(gainOf(hall.strip.input))).toBe(true)
  })
})
