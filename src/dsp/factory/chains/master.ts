// Master: last on the mix.

import { type FactoryChain } from '../types'

export const MASTER_CHAINS: readonly FactoryChain[] = [
  {
    id: 'gentle-glue',
    name: 'Gentle glue',
    category: 'master',
    description: 'A few decibels of soft saturation and a limiter that only catches peaks.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 3, outputDb: -4 } },
      { deviceId: 'fet-limiter', params: { inputGain: 3, outputGain: -3 } },
    ],
  },
  {
    id: 'wide-and-safe',
    name: 'Wide and safe',
    category: 'master',
    description:
      'A little more side signal with the bass kept in the middle, then a safety limiter.',
    effects: [
      { deviceId: 'stereo-widener', params: { width: 0.62 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'tape-master',
    name: 'Tape master',
    category: 'master',
    description:
      'The mix printed to clean tape at fifteen inches a second, a touch wider, then limited.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.25, hiss: 0 } },
      { deviceId: 'stereo-widener', params: { width: 0.56 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'ambient-master',
    name: 'Ambient master',
    category: 'master',
    description:
      'Made for long layered sound: what rings on is eased, swells are ridden over seconds, and a true-peak ceiling holds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'subsonic-guard',
    name: 'Subsonic guard',
    category: 'master',
    description:
      'A steep cut below thirty hertz and a brickwall ceiling, with nothing else touched.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 26, resonance: 0.55 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'streaming-ready',
    name: 'Streaming ready',
    category: 'master',
    description:
      'Rumble out, the level up a little, and a true peak ceiling two decibels down to leave room for an encoder.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { lowCut: 30, clear: 0 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { gain: 1.5 } },
    ],
  },
  {
    id: 'clear-the-stack',
    name: 'Clear the stack',
    category: 'master',
    description:
      'For many stacked layers: the low mids are thinned and any band that rings above the rest is turned down fast.',
    effects: [
      {
        deviceId: 'ambient-eq',
        preset: 'Layer',
        params: { lowCut: 40, body: -3, clear: 0.7, clearTime: 0.8 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 1.5 } },
    ],
  },
  {
    id: 'slow-fader-ride',
    name: 'Slow fader ride',
    category: 'master',
    description:
      'A hand on the fader for a long piece: three seconds to turn a swell down and twenty to let it back up.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Slow fader',
        params: { threshold: -26, ratio: 2.5, makeup: 1 },
      },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'open-top',
    name: 'Open top',
    category: 'master',
    description:
      'Lifts the air and the presence, thins the low mids a little and eases any band that rings, under a true peak ceiling.',
    effects: [
      {
        deviceId: 'ambient-eq',
        preset: 'Open',
        params: { body: -1.5, presence: 1.5, air: 3.5, clear: 0.5 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'clip-and-catch',
    name: 'Clip and catch',
    category: 'master',
    description:
      'The loudest peaks are clipped flat three decibels down so the mix can sit louder, with a wall behind.',
    effects: [
      { deviceId: 'saturator', preset: 'Hard clip master', params: { outputDb: -1.5 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'console-presence',
    name: 'Console presence',
    category: 'master',
    description:
      'A console stage driven lightly: the upper mids come forward and firm up, under a true peak ceiling.',
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Console',
        params: { drive: 0.12, lowCut: 20, tone: 0 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'iron-weight',
    name: 'Iron weight',
    category: 'master',
    description:
      'A transformer that thickens and softly breaks up the lows, with the rumble under it cut and peaks caught.',
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Low warmth',
        params: { drive: 0.05, lowBump: 0.4, tone: 0, output: -2 },
      },
      { deviceId: 'ambient-eq', preset: 'Master', params: { lowCut: 28, clear: 0 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'harmonic-edge',
    name: 'Harmonic edge',
    category: 'master',
    description:
      'A pentode driven only by the upper mids and the top and mixed in faintly: detail gains an edge and a slight lift.',
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Parallel grit',
        params: { drive: 0.5, lowCut: 900, highCut: 20000, output: 0, mix: 0.1 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 0.8 } },
    ],
  },
  {
    id: 'evening-shade',
    name: 'Evening shade',
    category: 'master',
    description:
      'Darkens the top and eases the presence, then gently evens out the level under a slow ceiling.',
    effects: [
      {
        deviceId: 'ambient-eq',
        preset: 'Shaded',
        params: { low: 1.5, presence: -2, air: -3, highCut: 9000 },
      },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { makeup: 4 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'slow-reel-print',
    name: 'Slow reel print',
    category: 'master',
    description:
      'The mix on a reel at seven and a half inches a second: a softer top, a low bump, a trace of hiss and drift.',
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { drive: 0.4, wow: 0.08, flutter: 0.05, age: 0.1, hiss: 0.1, bump: 0.4 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'cassette-copy',
    name: 'Cassette copy',
    category: 'master',
    description:
      'A copy of the mix on a good cassette: dull on top, a little narrower and unsteady, with hiss under it.',
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { drive: 0.3, wobble: 0.1, wear: 0.2, noise: 0.15, tone: 0.2 },
      },
      { deviceId: 'stereo-widener', params: { width: 0.42 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'fresh-pressing',
    name: 'Fresh pressing',
    category: 'master',
    description:
      'The mix cut to a clean record: a hint of warp, fine crackle and surface hiss, under a ceiling.',
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'New pressing',
        params: { warp: 0.06, crackle: 0.12, pops: 0, surface: 0.25 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'old-converter',
    name: 'Old converter',
    category: 'master',
    description:
      'The mix through an early twelve bit converter: the top stops near eleven kilohertz and quiet tails turn grainy.',
    effects: [
      {
        deviceId: 'vintage-digital',
        preset: 'Glaze',
        params: { rate: 22000, aliasing: 0.15, filter: 2, jitter: 0.05 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'air-and-width',
    name: 'Air and width',
    category: 'master',
    description:
      'Only the upper range is doubled a few cents either side, with a lift of air, so the lows stay centred.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { air: 2, clear: 0 } },
      {
        deviceId: 'stereo-detune',
        preset: 'Top only',
        params: { detune: 5, drift: 0.05, focus: 700, mix: 0.2 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'one-room',
    name: 'One room',
    category: 'master',
    description:
      'A faint one second chamber under everything so separate sounds share a room, then glued and capped.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { damping: 5000, mix: 0.08 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'phone-speaker-check',
    name: 'Phone speaker check',
    category: 'master',
    description:
      'The mix as a small mono speaker would play it, for checking: no bass, no top, folded nearly to the middle.',
    effects: [
      {
        deviceId: 'ambient-eq',
        preset: 'Thin',
        params: { lowCut: 300, presence: 2, highCut: 6000, clear: 0 },
      },
      { deviceId: 'stereo-widener', preset: 'Mono' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'late-night-level',
    name: 'Late night level',
    category: 'master',
    description:
      'Quiet passages come up and loud ones are held nine decibels under full scale, for listening low.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Raise the quiet',
        params: { threshold: -45, ratio: 2.5, makeup: 12 },
      },
      { deviceId: 'ambient-limiter', preset: 'Late night' },
    ],
  },
  {
    id: 'parallel-lift',
    name: 'Parallel lift',
    category: 'master',
    description:
      'A compressed copy mixed half under the mix: tails and quiet detail come up five decibels, loud passages barely move.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Lift',
        params: { threshold: -32, ratio: 2, attack: 10, release: 0.8, makeup: 8 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'swells-soften',
    name: 'Swells soften',
    category: 'master',
    description:
      'The louder the mix swells, the more the top is rolled off, so dense passages lose their edge.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Loud goes dark',
        params: {
          cutoffHz: 18000,
          resonance: 0.7071,
          envAmount: -65,
          envAttackMs: 150,
          envReleaseMs: 1200,
        },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
]
