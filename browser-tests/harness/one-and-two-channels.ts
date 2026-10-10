// The page side of the check that a strip plays one channel as it plays two.
// A browser's StereoPanner pans a one-channel input with equal power, 3.01 dB
// down each side at the centre, and passes a two-channel input at the centre
// as it came. A strip with no nodes yet has no panner at all, and a
// compressor (the browser's gives two channels out for one in), a WASM device
// or a utility ahead of the panner hands it two channels. So what a voice in
// one channel played at depended on what its strip had been used for. Each
// case renders the same tone through an audio track on a real
// OfflineAudioContext and is measured here.

import {
  createCompressor,
  createRack,
  createUtility,
  renderOffline,
  type AudioTrack,
  type Clip,
} from '@kieranklaassen/live-mix'

const RATE = 48000
const RENDER_SEC = 1
const AMPLITUDE = 0.25

/** What the tone's strip is: untouched, or with its nodes made, panned, or with one device ahead of the pan. */
export type StripCase =
  | 'untouched'
  | 'nodes'
  | 'compressor'
  | 'utility'
  | 'rack'
  | 'panned left'
  | 'compressor, panned left'

export interface ChannelLevels {
  /** Level of each output channel over the tone's own, in dB; -200 for silence. */
  leftDb: number
  rightDb: number
}

const CLIP: Clip = {
  id: 'tone',
  sourceId: 'tone',
  startSec: 0,
  offsetSec: 0,
  durationSec: RENDER_SEC,
  fadeInSec: 0,
  fadeOutSec: 0,
  fadeCurve: 'linear',
  gainDb: 0,
}

function tone(ctx: BaseAudioContext, channels: 1 | 2): AudioBuffer {
  const buffer = ctx.createBuffer(channels, RATE * RENDER_SEC, RATE)
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i += 1) {
      data[i] = AMPLITUDE * Math.sin((2 * Math.PI * 1000 * i) / RATE)
    }
  }
  return buffer
}

function dress(track: AudioTrack, ctx: BaseAudioContext, strip: StripCase): void {
  if (strip === 'untouched') return
  track.strip.materialize()
  // A compressor that compresses nothing: only what it does to the channels is left.
  const through = { threshold: 0, knee: 0, ratio: 1, makeupDb: 0 }
  if (strip === 'compressor' || strip === 'compressor, panned left') {
    track.strip.addInsert(createCompressor(ctx, { params: through }))
  }
  if (strip === 'utility') track.strip.addInsert(createUtility(ctx))
  if (strip === 'rack') track.strip.addInsert(createRack(ctx, { chains: [{}] }))
  if (strip === 'panned left' || strip === 'compressor, panned left') {
    track.strip.setPan(-1, { at: 0 })
  }
}

/** The second half of the render, once every ramp is over. */
function levelDb(samples: Float32Array): number {
  let sum = 0
  for (let i = samples.length / 2; i < samples.length; i += 1) sum += samples[i] * samples[i]
  const rms = Math.sqrt(sum / (samples.length / 2))
  return rms < 1e-9 ? -200 : 20 * Math.log10(rms / (AMPLITUDE / Math.SQRT2))
}

/** Render the tone, in one channel or two, through a strip of each case. */
export async function measureChannels(
  channels: 1 | 2,
  cases: readonly StripCase[],
): Promise<Record<string, ChannelLevels>> {
  const measured: Record<string, ChannelLevels> = {}
  for (const strip of cases) {
    const result = await renderOffline({
      durationSec: RENDER_SEC,
      sampleRate: RATE,
      build: async (engine) => {
        const track = engine.addAudioTrack('voice', { lookaheadSec: 1 })
        await engine.samples.load('tone', tone(engine.context, channels))
        track.clips.add(CLIP)
        dress(track, engine.context, strip)
      },
    })
    result.engine.dispose()
    const [left, right] = result.audio.channels
    measured[strip] = { leftDb: levelDb(left), rightDb: levelDb(right) }
  }
  return measured
}
