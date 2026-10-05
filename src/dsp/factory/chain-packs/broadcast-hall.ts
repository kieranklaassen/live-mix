// Old Broadcast Hall: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'broadcast-hall-skylight-room',
    name: 'Skylight room',
    category: 'space',
    description:
      'A tape preamp driven for thick lows and a dull top, into a far-off room laid in under the untouched sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 're-amp', preset: 'Room underneath', params: { output: 0.973 } },
    ],
  },
  {
    id: 'broadcast-hall-foyer-room',
    name: 'Foyer room',
    category: 'space',
    description:
      'A tape preamp pushed just enough to add weight, into a clean speaker at the far end of a big, echoing room.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { output: -3.13 } },
    ],
  },
  {
    id: 'broadcast-hall-quayside-room',
    name: 'Quayside room',
    category: 'space',
    description:
      'A transformer that fills out the lows and dulls the top, into a clean speaker heard from well back in a room.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 're-amp', preset: 'Just the room', params: { output: -4 } },
    ],
  },
  {
    id: 'broadcast-hall-curtained-room',
    name: 'Curtained room',
    category: 'space',
    description:
      'A transformer that fills out the lows and dulls the top, into a far-off room laid in under the untouched sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 're-amp', preset: 'Room underneath', params: { output: 1.62 } },
    ],
  },
  {
    id: 'broadcast-hall-lid-open-room',
    name: 'Lid-open room',
    category: 'space',
    description:
      'Bright tape-style saturation mixed in under the clean sound, into a clean speaker heard from well back in a room.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 're-amp', preset: 'Just the room' },
    ],
  },
  {
    id: 'broadcast-hall-shade-in-one-pass',
    name: 'Shade in one pass',
    category: 'space',
    description:
      'A valve stage driven hard until it thickens and sags, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -5.42 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.7 } },
    ],
  },
  {
    id: 'broadcast-hall-piano-top-hall',
    name: 'Piano-top hall',
    category: 'space',
    description:
      'Three taut springs kept soft and close to the centre, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 48.9, lowDecay: 3.74, midDecay: 2.75 },
      },
    ],
  },
  {
    id: 'broadcast-hall-sign-off-drone',
    name: 'Sign-off drone',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into thirteen drone strings in D major kept near the centre.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.57 } },
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { decay: 5.35, mix: 0.24 } },
    ],
  },
  {
    id: 'broadcast-hall-workshop-wash',
    name: 'Workshop wash',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 64.6 } },
    ],
  },
  {
    id: 'broadcast-hall-hall-under-the-lid',
    name: 'Hall under the lid',
    category: 'space',
    description:
      'Two copies a few cents sharp and flat, left and right, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Doubler' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Late arrival',
        params: { decay: 5.33, breathRate: 0.285 },
      },
    ],
  },
  {
    id: 'broadcast-hall-after-hours-ring',
    name: 'After-hours ring',
    category: 'space',
    description:
      'Twelve strings in A minor that ring with notes in that key, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 3.64 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 8.43, breathRate: 0.309 },
      },
    ],
  },
  {
    id: 'broadcast-hall-tenth-row-echoes',
    name: 'Tenth-row echoes',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, then a single saturated tape echo close behind each note, into far-off separate echoes.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'broadcast-hall-hall-past-the-weir',
    name: 'Hall past the weir',
    category: 'space',
    description:
      'A huge dark open space that answers late and rings on, then a fast compressor that takes the spike off every attack.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 10.8, predelayMs: 125, breathRate: 0.313 },
      },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'broadcast-hall-hall-left-running',
    name: 'Hall left running',
    category: 'space',
    description:
      'A reel driven as hard as it goes, thick with harmonics, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 31.5 } },
    ],
  },
  {
    id: 'broadcast-hall-swell-in-the-yard',
    name: 'Swell in the yard',
    category: 'space',
    description:
      'A valve stage driven hard until it thickens and sags, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -6.64 } },
      { deviceId: 'expanse', preset: 'Quick swell' },
    ],
  },
  {
    id: 'broadcast-hall-unhurried-halo',
    name: 'Unhurried halo',
    category: 'space',
    description:
      'A tight cluster of tape repeats, like a very small room, into sixteen strings that learn the tune and ring on long.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 99.6 } },
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { decay: 7.9 } },
    ],
  },
  {
    id: 'broadcast-hall-courtyard-hall',
    name: 'Courtyard hall',
    category: 'space',
    description:
      'A tiny boxy room that is gone almost at once, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'expanse', preset: 'Small box' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 74.8, lowDecay: 6.42, midDecay: 5.99 },
      },
    ],
  },
  {
    id: 'broadcast-hall-machine-room-hall',
    name: 'Machine-room hall',
    category: 'space',
    description:
      'A shallow chorus that thickens the sound above its lows, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.367, delayMs: 19.8 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 49.2, lowDecay: 4.15, midDecay: 3.08 },
      },
    ],
  },
  {
    id: 'broadcast-hall-cloakroom-halo',
    name: 'Cloakroom halo',
    category: 'space',
    description:
      'Sixteen hard-driven strings in F major that ring for seconds, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Glass harp' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'broadcast-hall-sheen-in-oak-panels',
    name: 'Sheen in oak panels',
    category: 'space',
    description:
      'A quiet plate tail that comes in late behind each note, then a gentle compressor that draws loud and quiet together.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      {
        deviceId: 'ambient-comp',
        preset: 'Sit back',
        params: { attack: 111, release: 2.04, makeup: 4.26 },
      },
    ],
  },
  {
    id: 'broadcast-hall-parquet-springs',
    name: 'Parquet springs',
    category: 'space',
    description:
      'Bright tape-style saturation mixed in under the clean sound, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine', params: { outputDb: -13.2 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 5.66 } },
    ],
  },
  {
    id: 'broadcast-hall-sign-off-hall',
    name: 'Sign-off hall',
    category: 'space',
    description:
      'A console channel driven until it is firm in the mids, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { output: -2.79 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'broadcast-hall-control-room-echo',
    name: 'Control-room echo',
    category: 'echo',
    description:
      'A tape echo whose three heads make a cluster of each repeat, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 477 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { decay: 1.58 } },
    ],
  },
  {
    id: 'broadcast-hall-off-air-echo',
    name: 'Off-air echo',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.59 } },
    ],
  },
  {
    id: 'broadcast-hall-hand-built-reel',
    name: 'Hand-built reel',
    category: 'echo',
    description:
      'A half-speed tape loop that returns an octave down and dull, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 7.28 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { midDecay: 7.52 } },
    ],
  },
  {
    id: 'broadcast-hall-machine-room-loop',
    name: 'Machine-room loop',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a hard-driven two-spring tank that answers a moment late.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade' },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { decay: 3.35, predelay: 63.1 } },
    ],
  },
  {
    id: 'broadcast-hall-loop-after-hours',
    name: 'Loop after hours',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.97 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'broadcast-hall-piano-lid-loop',
    name: 'Piano-lid loop',
    category: 'echo',
    description:
      'A faint afterimage of a tape loop behind the playing, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.8 } },
    ],
  },
  {
    id: 'broadcast-hall-riverside-repeats',
    name: 'Riverside repeats',
    category: 'echo',
    description:
      'A few decibels of soft saturation with the top eased, then a clean steady echo, into a small ringing chamber.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -6.26 } },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 201, modRate: 0.543 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'broadcast-hall-damped-trail',
    name: 'Damped trail',
    category: 'echo',
    description:
      'A slow tape echo with a long trail that dulls as it goes, into ten strings that tune themselves to the notes they hear.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.394 } },
    ],
  },
  {
    id: 'broadcast-hall-echo-off-the-floor',
    name: 'Echo off the floor',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'broadcast-hall-embankment-echo',
    name: 'Embankment echo',
    category: 'echo',
    description:
      'A tape preamp driven for thick lows and a dull top, then a short soft tape echo, into a space whose tail flutters quickly in pitch.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -9.26 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 5.15 } },
    ],
  },
  {
    id: 'broadcast-hall-loop-on-air',
    name: 'Loop on air',
    category: 'echo',
    description:
      'A mid-forward tone with the lows and the top trimmed, then a thin, far-off tape loop with its lows cut away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.36 } },
      { deviceId: 'tape-loop', preset: 'Thin and distant', params: { length: 2.34 } },
    ],
  },
  {
    id: 'broadcast-hall-back-row-echo',
    name: 'Back-row echo',
    category: 'echo',
    description:
      'Dotted tape repeats that bounce from side to side, into a late wall of reverb that holds, then fades away.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 558 } },
      { deviceId: 'shaped-reverb', preset: 'Late wall', params: { time: 1.66, preDelay: 249 } },
    ],
  },
  {
    id: 'broadcast-hall-soundcheck-echo',
    name: 'Soundcheck echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 697 } },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'broadcast-hall-run-through-wash',
    name: 'Run-through wash',
    category: 'echo',
    description:
      'A wash of three fed-back tape heads that hovers and fades, into two slack springs that splash and drip on every attack.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 897 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { decay: 2.08 } },
    ],
  },
  {
    id: 'broadcast-hall-dust-cover-echo',
    name: 'Dust-cover echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.73 } },
    ],
  },
  {
    id: 'broadcast-hall-studio-echo',
    name: 'Studio echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into one taut dull spring that answers late and rings long.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 640 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark late coil',
        params: { decay: 5.58, predelay: 79.9 },
      },
    ],
  },
  {
    id: 'broadcast-hall-moderator-echo',
    name: 'Moderator echo',
    category: 'echo',
    description:
      'Dotted tape repeats that bounce from side to side, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 533 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 8.77 } },
    ],
  },
  {
    id: 'broadcast-hall-stairwell-memory',
    name: 'Stairwell memory',
    category: 'echo',
    description:
      'Earlier phrases that return over and over and slowly gather, into a hall of about four seconds with no dry sound in it.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Gathering',
        params: { time: 645, reach: 24.2, size: 3.62 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 21.1, lowDecay: 4.44, midDecay: 3.63 },
      },
    ],
  },
  {
    id: 'broadcast-hall-tenth-row-echo',
    name: 'Tenth-row echo',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a far-off room laid in under the untouched sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 349, modRate: 0.618 } },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'broadcast-hall-repeats-by-the-river',
    name: 'Repeats by the river',
    category: 'echo',
    description:
      'A slow rotating speaker heard through one microphone, then a steady tape echo with no wobble, dirt or dulling, into a damped hall.',
    effects: [
      { deviceId: 'rotary', preset: 'Mono cabinet' },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 434, mix: 0.198 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 19.9, mix: 0.18 } },
    ],
  },
  {
    id: 'broadcast-hall-on-air-echo',
    name: 'On-air echo',
    category: 'echo',
    description:
      'Recalled moments that mostly come back reversed or slowed, then a short echo whose pitch sways like a seasick vibrato.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Backwards' },
      { deviceId: 'analog-delay', preset: 'Seasick', params: { time: 153, modRate: 2.93 } },
    ],
  },
  {
    id: 'broadcast-hall-loop-at-soundcheck',
    name: 'Loop at soundcheck',
    category: 'echo',
    description:
      'A short double-speed loop an octave up that soon dies away, then a combo amplifier heard from the far side of a big room.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.19 } },
      { deviceId: 're-amp', preset: 'Down the hall' },
    ],
  },
  {
    id: 'broadcast-hall-small-hours-echoes',
    name: 'Small-hours echoes',
    category: 'echo',
    description:
      'A drifting reel laid against the dry sound to make a chorus, then a handful of separate echoes that fall away and repeat.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 2.08 } },
    ],
  },
  {
    id: 'broadcast-hall-skylight-repeats',
    name: 'Skylight repeats',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.72 } },
    ],
  },
  {
    id: 'broadcast-hall-red-brick-reel',
    name: 'Red-brick reel',
    category: 'tape',
    description:
      'A gentle compressor that draws loud and quiet together, then a tape reel pushed hard, saturated and thick, into a dull single spring.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 107, release: 1.75 } },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.48 } },
    ],
  },
  {
    id: 'broadcast-hall-riverside-reel',
    name: 'Riverside reel',
    category: 'tape',
    description:
      'An even-handed compressor, then a lightly worn reel, then a combo amplifier boxed in by the walls of a cupboard.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 109, release: 1.52 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 're-amp', preset: 'In the cupboard' },
    ],
  },
  {
    id: 'broadcast-hall-after-hours-reel',
    name: 'After-hours reel',
    category: 'tape',
    description:
      'A compressor that pulls the tail of every note back up, then a tape reel pushed hard, saturated and thick, into a small room.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { attack: 197, release: 0.733 } },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'broadcast-hall-reel-on-the-stage',
    name: 'Reel on the stage',
    category: 'tape',
    description:
      'A very slow compressor, then a fresh reel of tape, open on top and nearly steady, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'broadcast-hall-reel-at-sign-off',
    name: 'Reel at sign-off',
    category: 'tape',
    description:
      'A swell-holding compressor, then a fast, steady reel with soft saturation, into a soft slapback echo close behind each note.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 169, release: 5.44 } },
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'analog-delay', preset: 'Slapback' },
    ],
  },
  {
    id: 'broadcast-hall-closedown-loop',
    name: 'Closedown loop',
    category: 'tape',
    description:
      'A short tape loop where each pass comes back quieter, then a clean bright reel under a thick layer of tape hiss.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade' },
      { deviceId: 'tape', preset: 'Hiss and air' },
    ],
  },
  {
    id: 'broadcast-hall-panelled-tape',
    name: 'Panelled tape',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls, drops out and hisses, into a tight, damped little room close around the sound.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'broadcast-hall-rotary-at-closedown',
    name: 'Rotary at closedown',
    category: 'tape',
    description:
      'A fast rotating speaker with its amplifier growling, then the low hum of an amplifier left switched on.',
    effects: [
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.395, hold: 30.9 } },
    ],
  },
  {
    id: 'broadcast-hall-broadcast-loop',
    name: 'Broadcast loop',
    category: 'tape',
    description:
      'A short loop run backwards at double speed and an octave up, then a reel driven as hard as it goes, thick with harmonics.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse' },
      { deviceId: 'tape', preset: 'Needles pinned' },
    ],
  },
  {
    id: 'broadcast-hall-slipping-flutter',
    name: 'Slipping flutter',
    category: 'tape',
    description:
      'A slow reel that trembles fast, mixed against the dry sound, then radio static that sounds only with each note played.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer', params: { output: -6.01 } },
      { deviceId: 'noise-floor', preset: 'Static notes', params: { response: 0.0443, hold: 1.08 } },
    ],
  },
  {
    id: 'broadcast-hall-tape-at-closedown',
    name: 'Tape at closedown',
    category: 'tape',
    description:
      'A dark, driven amplifier stack with the mic off to one side, then a tape reel pushed hard, saturated and thick.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
    ],
  },
  {
    id: 'broadcast-hall-double-door-memory',
    name: 'Double-door memory',
    category: 'tape',
    description:
      'A quick slapback echo over short glimpses of earlier notes, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Glimpses',
        params: { time: 70.7, reach: 17.9, size: 0.592 },
      },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { output: -0.657 } },
    ],
  },
  {
    id: 'broadcast-hall-session-drift',
    name: 'Session drift',
    category: 'tape',
    description:
      'A low-pass that opens and closes over about half a minute, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0295, envAttackMs: 10.9, envReleaseMs: 210 },
      },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -2.23 } },
    ],
  },
  {
    id: 'broadcast-hall-patchbay-loop',
    name: 'Patchbay loop',
    category: 'tape',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then a wearing tape loop, then a far-off horn loudspeaker.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 6.52 } },
    ],
  },
  {
    id: 'broadcast-hall-upriver-echo',
    name: 'Upriver echo',
    category: 'tape',
    description:
      'A hot console channel, forward in the upper mids, then a dull, wobbling, saturated echo on worn tape, into a quick spring twang.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel', params: { output: -20.1 } },
      { deviceId: 'tape-echo', preset: 'Worn tape' },
      { deviceId: 'spring-reverb', preset: 'Quick twang' },
    ],
  },
  {
    id: 'broadcast-hall-tape-by-the-window',
    name: 'Tape by the window',
    category: 'tape',
    description:
      'A reel driven as hard as it goes, thick with harmonics, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'broadcast-hall-canteen-flutter',
    name: 'Canteen flutter',
    category: 'tape',
    description:
      'A scooped tone with lows and highs up and the body down, then a slow reel that trembles fast, mixed against the dry sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
    ],
  },
  {
    id: 'broadcast-hall-overdub-reel',
    name: 'Overdub reel',
    category: 'tape',
    description:
      'An overdriven reel, then steady tape hiss that lingers after the last note, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'noise-floor', preset: 'Tape floor' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.3 } },
    ],
  },
  {
    id: 'broadcast-hall-radio-and-room-tone',
    name: 'Radio and room tone',
    category: 'tape',
    description:
      'A small radio speaker muffled as if under a pillow, then a pure, low electrical hum that sits in the centre.',
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.421, hold: 18 } },
    ],
  },
  {
    id: 'broadcast-hall-parquet-reel',
    name: 'Parquet reel',
    category: 'tape',
    description:
      'A slow reel that trembles fast, mixed against the dry sound, then a slow, dull, worn-out echo with hiss riding on its repeats.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'analog-delay', preset: 'Noisy clock', params: { modRate: 0.552 } },
    ],
  },
  {
    id: 'broadcast-hall-interval-radio',
    name: 'Interval radio',
    category: 'tape',
    description:
      'A small, boxy radio speaker close by in a small room, then a tape echo whose three heads make a cluster of each repeat.',
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio' },
      { deviceId: 'tape-echo', preset: 'Three heads' },
    ],
  },
  {
    id: 'broadcast-hall-live-room-drift',
    name: 'Live-room drift',
    category: 'motion',
    description:
      'A slowly drifting chorus, then a short, soft tape echo close behind the playing, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0804, delayMs: 24.8 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 93, lowDecay: 7.32 } },
    ],
  },
  {
    id: 'broadcast-hall-dust-cover-chorus',
    name: 'Dust-cover chorus',
    category: 'motion',
    description:
      'A deep slow chorus on a long delay, swaying over seconds, then a faint trace of tape echo behind the playing, into a far-off hall.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.149, delayMs: 28.6 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 507 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'broadcast-hall-oak-panel-chorus',
    name: 'Oak-panel chorus',
    category: 'motion',
    description:
      'A plain chorus, then a wide echo whose repeats drift slowly in pitch, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus' },
      { deviceId: 'analog-delay', preset: 'Slow drift' },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { lowDecay: 2.6, midDecay: 2.86 } },
    ],
  },
  {
    id: 'broadcast-hall-chorus-on-the-stage',
    name: 'Chorus on the stage',
    category: 'motion',
    description:
      'A chorus with no dry sound, then a short, soft tape echo close behind the playing, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.338, delayMs: 14.9 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 163 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 53.2, lowDecay: 3.12, midDecay: 2.54 },
      },
    ],
  },
  {
    id: 'broadcast-hall-workshop-flutter',
    name: 'Workshop flutter',
    category: 'motion',
    description:
      'A fast vibrato that warbles the whole sound in pitch, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'chorus', preset: 'Vibrato', params: { rate: 5.06, delayMs: 5.47 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 315, modRate: 0.845 } },
    ],
  },
  {
    id: 'broadcast-hall-gallery-rotary',
    name: 'Gallery rotary',
    category: 'motion',
    description:
      'A rotating speaker on its slow speed, then a thick ensemble chorus turning about every two seconds.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
    ],
  },
  {
    id: 'broadcast-hall-parquet-chorus',
    name: 'Parquet chorus',
    category: 'motion',
    description:
      'A reel driven hot, then a wide chorus drifting over a cycle of about twelve seconds, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: 0.426 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0864, delayMs: 24.1 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'broadcast-hall-studio-chorus',
    name: 'Studio chorus',
    category: 'motion',
    description:
      'A shallow chorus that thickens the sound above its lows, then a soft slapback echo close behind each note, into a hall with long lows.',
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener' },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 105, modRate: 0.548 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 62.5, lowDecay: 7.98, midDecay: 2.14 },
      },
    ],
  },
  {
    id: 'broadcast-hall-canteen-rotary',
    name: 'Canteen rotary',
    category: 'motion',
    description:
      'A fast rotating speaker heard close, pulsing hard, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'rotary', preset: 'Close pulse' },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'broadcast-hall-tremolo-under-glass',
    name: 'Tremolo under glass',
    category: 'motion',
    description:
      'An equaliser that adds lows and body and eases the top, then a shudder in the level, too fast to count.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.56 } },
      { deviceId: 'tremolo', preset: 'Fast shudder' },
    ],
  },
  {
    id: 'broadcast-hall-tenth-row-chorus',
    name: 'Tenth-row chorus',
    category: 'motion',
    description:
      'A chorus heard alone, its detuned copies spread hard apart, then a combo amplifier boxed in by the walls of a cupboard.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.32, delayMs: 17 } },
      { deviceId: 're-amp', preset: 'In the cupboard' },
    ],
  },
  {
    id: 'broadcast-hall-rotary-after-hours',
    name: 'Rotary after hours',
    category: 'motion',
    description:
      'A rotating speaker on its fast speed, into one taut dull spring that answers late and rings long.',
    effects: [
      { deviceId: 'rotary', preset: 'Tremolo' },
      { deviceId: 'spring-reverb', preset: 'Dark late coil' },
    ],
  },
  {
    id: 'broadcast-hall-cloakroom-phaser',
    name: 'Cloakroom phaser',
    category: 'motion',
    description:
      'A console channel driven until it is firm in the mids, then a hollow peaking phaser that turns about every four seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.221 } },
    ],
  },
  {
    id: 'broadcast-hall-tea-break-pad',
    name: 'Tea-break pad',
    category: 'texture',
    description:
      'A swell of about a second that turns struck notes to pads, into a clean speaker heard from well back in a room.',
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 827, release: 370 } },
      { deviceId: 're-amp', preset: 'Just the room', params: { output: 5.55 } },
    ],
  },
  {
    id: 'broadcast-hall-harmony-on-parquet',
    name: 'Harmony on parquet',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.572, glide: 0.829 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'broadcast-hall-lid-open-afterglow',
    name: 'Lid-open afterglow',
    category: 'texture',
    description:
      'The level breathing in and out about every four seconds, then a short glow of held tone that dies just after each note.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'sustainer', preset: 'Brief afterglow' },
    ],
  },
  {
    id: 'broadcast-hall-interval-pad',
    name: 'Interval pad',
    category: 'texture',
    description:
      'A held pad that stands alone in place of what was played, then two copies in tune that wander like extra takes.',
    effects: [
      { deviceId: 'sustainer', preset: 'Held sound alone' },
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 27.2 } },
    ],
  },
  {
    id: 'broadcast-hall-halo-off-the-floor',
    name: 'Halo off the floor',
    category: 'texture',
    description:
      'A string pad with a second section an octave above, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { rise: 0.866, fall: 4.54 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2.75, breathRate: 0.265 } },
    ],
  },
  {
    id: 'broadcast-hall-upriver-pad',
    name: 'Upriver pad',
    category: 'texture',
    description:
      'Octaves below and above that swell in, with no dry sound, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'octaves', preset: 'Swell pad', params: { attack: 0.731 } },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'broadcast-hall-octave-sent-out-live',
    name: 'Octave sent out live',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, kept in the centre, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2120 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'broadcast-hall-floorboard-loop',
    name: 'Floorboard loop',
    category: 'pitch',
    description:
      'A half-speed tape loop that returns an octave down and dull, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 195 } },
    ],
  },
  {
    id: 'broadcast-hall-depths-underfoot',
    name: 'Depths underfoot',
    category: 'pitch',
    description:
      'A quarter-speed copy two octaves down under the dry sound, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves', params: { length: 1320 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { decay: 1.58 } },
    ],
  },
  {
    id: 'broadcast-hall-piano-lid-drift',
    name: 'Piano-lid drift',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a hollow chorus that swells over about ten seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift' },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.109, delayMs: 9.3 } },
    ],
  },
  {
    id: 'broadcast-hall-riverside-bass',
    name: 'Riverside bass',
    category: 'pitch',
    description:
      'A deep bass two octaves down that swells in slowly, into a brief ring of sixteen C major strings behind each note.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals' },
      { deviceId: 'sympathetic', preset: 'Short halo', params: { decay: 0.805 } },
    ],
  },
  {
    id: 'broadcast-hall-live-room-grains',
    name: 'Live-room grains',
    category: 'pitch',
    description:
      'Scattered grains a fifth down, spread across both sides, into three taut springs kept soft and close to the centre.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 70.6 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'broadcast-hall-embankment-cellos',
    name: 'Embankment cellos',
    category: 'pitch',
    description:
      'A dark, low string pad like cellos under the playing, then a combo amplifier heard from the far side of a big room.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.37, fall: 7.74 } },
      { deviceId: 're-amp', preset: 'Down the hall' },
    ],
  },
  {
    id: 'broadcast-hall-octave-on-the-stairs',
    name: 'Octave on the stairs',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, then a plain echo whose repeats bounce from side to side.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 306, reach: 18.2, size: 2.94, mix: 0.21 },
      },
    ],
  },
  {
    id: 'broadcast-hall-tiptoe-mixdown',
    name: 'Tiptoe mixdown',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a very gentle compressor that leans on the loudest swells, then a safety limiter.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'broadcast-hall-tiptoe-master',
    name: 'Tiptoe master',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 372, release: 2.86 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'broadcast-hall-gallery-polish',
    name: 'Gallery polish',
    category: 'master',
    description:
      'A subsonic cut, then a slightly wider image, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.1 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'broadcast-hall-closedown-polish',
    name: 'Closedown polish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a subsonic cut, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.19 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.63 } },
    ],
  },
  {
    id: 'broadcast-hall-talkback-master',
    name: 'Talkback master',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { outputGain: -5.9 } },
    ],
  },
  {
    id: 'broadcast-hall-lacquer-on-parquet',
    name: 'Lacquer on parquet',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a parallel compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 410, release: 3.07 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.59 } },
    ],
  },
]
