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
      'A tape preamp driven for thick lows and a dull top, into a far-miked room laid in under the clean sound.',
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
      'A tape preamp pushed just enough to add weight, into a clean speaker at the far end of a big, live room.',
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
      'A transformer that fills out the lows and dulls the top, into a clean speaker in a room, miked from well back.',
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
      'A transformer that fills out the lows and dulls the top, into a far-miked room laid in under the clean sound.',
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
      'Bright tape-style saturation mixed in under the clean sound, into a clean speaker in a room, miked from well back.',
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
    id: 'broadcast-hall-moderator-wash',
    name: 'Moderator wash',
    category: 'space',
    description:
      'A wash of three fed-back tape heads that hovers and fades, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 910 } },
      { deviceId: 'phaser', preset: 'Still formant', params: { rate: 0.279 } },
    ],
  },
  {
    id: 'broadcast-hall-overdub-cluster',
    name: 'Overdub cluster',
    category: 'space',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, into a tight cluster of tape repeats, like a very small room.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -11.9 } },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 91.8 } },
    ],
  },
  {
    id: 'broadcast-hall-broadcast-hall',
    name: 'Broadcast hall',
    category: 'space',
    description:
      'An undamped hall of about three seconds with light lows, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.36 } },
    ],
  },
  {
    id: 'broadcast-hall-coil-on-the-quay',
    name: 'Coil on the quay',
    category: 'space',
    description:
      'A fast, steady reel pushed into soft saturation, into a single dull spring in the centre that is barely heard.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'broadcast-hall-plate-a-room-away',
    name: 'Plate a room away',
    category: 'space',
    description:
      'A resonant peak up high, then a trace of room around the sound, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Resonant peak' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'broadcast-hall-machine-room-hall',
    name: 'Machine-room hall',
    category: 'space',
    description:
      'A transformer driven so the low end thickens and loosens, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.04 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 39, lowDecay: 2.61, midDecay: 3.35 },
      },
    ],
  },
  {
    id: 'broadcast-hall-tank-by-lamplight',
    name: 'Tank by lamplight',
    category: 'space',
    description:
      'Two taut springs that ring long and clean with no drip, then a very gentle compressor that leans on the loudest swells.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
      { deviceId: 'ambient-comp', preset: 'Glue', params: { attack: 570, release: 4.01 } },
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
    id: 'broadcast-hall-hall-over-tea',
    name: 'Hall over tea',
    category: 'space',
    description:
      'A hall with about two and a half seconds of tail, then a wobbling tape double a moment behind each note.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 57.4, lowDecay: 3.06, midDecay: 2.63 },
      },
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { time: 33.6 } },
    ],
  },
  {
    id: 'broadcast-hall-tenth-row-steel',
    name: 'Tenth-row steel',
    category: 'space',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.81 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 4.83 } },
    ],
  },
  {
    id: 'broadcast-hall-upriver-tail',
    name: 'Upriver tail',
    category: 'space',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -8.46 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0869 } },
    ],
  },
  {
    id: 'broadcast-hall-gallery-strings',
    name: 'Gallery strings',
    category: 'space',
    description:
      'Sixteen strings that learn the tune and ring on long, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { decay: 9.86 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'broadcast-hall-harp-by-lamplight',
    name: 'Harp by lamplight',
    category: 'space',
    description:
      'A two-spring tank with a little chirp and drip, into sixteen strings in C major that ring for about ten seconds.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.76 } },
      { deviceId: 'sympathetic', preset: 'Long ring' },
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
    id: 'broadcast-hall-rehearsal-slap',
    name: 'Rehearsal slap',
    category: 'echo',
    description:
      'A short, soft tape echo close behind the playing, into two slack springs that splash and drip on every attack.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 171 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip' },
    ],
  },
  {
    id: 'broadcast-hall-double-door-gallop',
    name: 'Double-door gallop',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a single dull spring in the centre that is barely heard.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.42 } },
    ],
  },
  {
    id: 'broadcast-hall-control-room-echo',
    name: 'Control-room echo',
    category: 'echo',
    description:
      'Three tape heads in a row, a cluster on every repeat, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 477 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { decay: 1.58 } },
    ],
  },
  {
    id: 'broadcast-hall-closedown-bounce',
    name: 'Closedown bounce',
    category: 'echo',
    description:
      'Dotted tape repeats that bounce from side to side, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank' },
    ],
  },
  {
    id: 'broadcast-hall-off-air-echo',
    name: 'Off-air echo',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.59 } },
    ],
  },
  {
    id: 'broadcast-hall-slap-on-the-stairs',
    name: 'Slap on the stairs',
    category: 'echo',
    description:
      'A single saturated tape slap behind each note, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 99.7 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'broadcast-hall-hand-built-reel',
    name: 'Hand-built reel',
    category: 'echo',
    description:
      'A tape loop at half speed, an octave down and darker, into a vast nave that rings for about eight seconds.',
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
      'A short tape loop where each pass comes back quieter, into a hard-driven two-spring tank that answers late and loud.',
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
      'A tape loop kept low, an afterimage behind the playing, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.8 } },
    ],
  },
  {
    id: 'broadcast-hall-clock-on-parquet',
    name: 'Clock on parquet',
    category: 'echo',
    description:
      'A slow, dull echo from a worn-out bucket-brigade line, into eight strings in C major that ring on as under a held pedal.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Noisy clock', params: { modRate: 0.58 } },
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 3.05 } },
    ],
  },
  {
    id: 'broadcast-hall-riverside-repeats',
    name: 'Riverside repeats',
    category: 'echo',
    description:
      'A few decibels of soft saturation with the top eased, then a clean steady echo, into a small tank that goes on ringing for seconds.',
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
      'An echo whose repeats hop up a fifth and down a fourth, into a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'broadcast-hall-trace-on-the-quay',
    name: 'Trace on the quay',
    category: 'echo',
    description:
      'A slow rotating speaker with its amplifier driven hard, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'rotary', preset: 'Slow burn' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 525, mix: 0.072 } },
    ],
  },
  {
    id: 'broadcast-hall-embankment-echo',
    name: 'Embankment echo',
    category: 'echo',
    description:
      'A tape preamp driven for thick lows and a dull top, then a short, soft tape echo close behind the playing, into a fluttering tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -9.26 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 5.15 } },
    ],
  },
  {
    id: 'broadcast-hall-valve-lit-echo',
    name: 'Valve-lit echo',
    category: 'echo',
    description:
      'A light two-voice chorus that widens more than it moves, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.301, delayMs: 8.29 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 266, modRate: 0.812 } },
    ],
  },
  {
    id: 'broadcast-hall-talkback-loop',
    name: 'Talkback loop',
    category: 'echo',
    description:
      'A loop of the last phrase played backwards as a bed, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 3.33 } },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
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
    id: 'broadcast-hall-memory-in-the-yard',
    name: 'Memory in the yard',
    category: 'echo',
    description:
      'A rotating speaker at a standstill, heard close and in mono, then a quick slap while short glimpses of earlier notes return.',
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      {
        deviceId: 'echo-memory',
        preset: 'Glimpses',
        params: { time: 77.9, reach: 20.2, size: 0.639 },
      },
    ],
  },
  {
    id: 'broadcast-hall-cloakroom-echo',
    name: 'Cloakroom echo',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, then a low cut and a small dip in the low mids, to make room.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 423, modRate: 0.552 } },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { clearTime: 1.66 } },
    ],
  },
  {
    id: 'broadcast-hall-back-row-echo',
    name: 'Back-row echo',
    category: 'echo',
    description:
      'Dotted tape repeats that bounce from side to side, into a late wall of reverb that holds and stops dead.',
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
    id: 'broadcast-hall-wash-with-lid-open',
    name: 'Wash with lid open',
    category: 'echo',
    description:
      'A reel driven as hard as it goes, thick with harmonics, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned', params: { output: -2.72 } },
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 725 } },
    ],
  },
  {
    id: 'broadcast-hall-red-brick-reel',
    name: 'Red-brick reel',
    category: 'tape',
    description:
      'A gentle compressor, then a tape reel pushed hard into thick saturation, into a single dull spring in the centre that is barely heard.',
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
      'A compressor that lets each attack through before it levels, then a lightly worn reel, then an amp in a cupboard.',
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
      'A compressor that pulls the tail of every note back up, then a tape reel pushed hard into thick saturation, into a small room.',
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
      'A compressor as slow as a hand on a fader, then a fresh reel of tape, into a single saturated tape slap behind each note.',
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
      'A swell-holding compressor, then a fast, steady reel pushed into soft saturation, into a soft slap close behind each note.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 169, release: 5.44 } },
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'analog-delay', preset: 'Slapback' },
    ],
  },
  {
    id: 'broadcast-hall-embankment-reel',
    name: 'Embankment reel',
    category: 'tape',
    description:
      'A slow reel that trembles fast, mixed against the dry sound, then a deep pitch wobble in the centre, like a warped tape.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'chorus', preset: 'Warped tape', params: { rate: 1.22, delayMs: 23.1 } },
    ],
  },
  {
    id: 'broadcast-hall-reel-by-the-window',
    name: 'Reel by the window',
    category: 'tape',
    description:
      'A reel of tape, then muffled tape hiss with its top taken off, steady and thick, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss' },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'broadcast-hall-tape-and-room-tone',
    name: 'Tape and room tone',
    category: 'tape',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, then thin bright air from a microphone, hardly moving.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 'noise-floor', preset: 'Thin bright air' },
    ],
  },
  {
    id: 'broadcast-hall-interval-amp',
    name: 'Interval amp',
    category: 'tape',
    description:
      'A combo amplifier miked fairly close in a small room, then a subsonic cut and a slow ear that eases whatever rings on.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'ambient-eq', preset: 'Master' },
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
    id: 'broadcast-hall-on-air-drift',
    name: 'On-air drift',
    category: 'tape',
    description:
      'A drifting reel laid half against the dry sound, a chorus, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'broadcast-hall-quayside-tape',
    name: 'Quayside tape',
    category: 'tape',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, then a slow murky bucket-brigade echo with dull, worn repeats.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 1000, modRate: 0.223 } },
    ],
  },
  {
    id: 'broadcast-hall-panelled-tape',
    name: 'Panelled tape',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls and drops out, into a tight damped little room that is barely there.',
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
      'A fast rotating speaker with its amplifier growling, then the low mains hum of an amplifier left switched on.',
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
      'A short loop run backwards at double speed, an octave up, then a reel driven as hard as it goes, thick with harmonics.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse' },
      { deviceId: 'tape', preset: 'Needles pinned' },
    ],
  },
  {
    id: 'broadcast-hall-small-hours-oxide',
    name: 'Small-hours oxide',
    category: 'tape',
    description:
      'A triode valve stage, smoothly overdriven, then a wearing tape loop, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'broadcast-hall-session-tape',
    name: 'Session tape',
    category: 'tape',
    description:
      'A scooped tone with lows and highs up and the body down, then a lightly worn reel, then a faint, dull echo with a slow chorus on it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.33 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 290, modRate: 0.357 } },
    ],
  },
  {
    id: 'broadcast-hall-run-through-reel',
    name: 'Run-through reel',
    category: 'tape',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, then a faint, dull echo with a slow chorus on it.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 257, modRate: 0.383 } },
    ],
  },
  {
    id: 'broadcast-hall-deck-at-soundcheck',
    name: 'Deck at soundcheck',
    category: 'tape',
    description:
      'A phaser swirl about a quarter of a minute round, then a fast, steady reel pushed into soft saturation.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'tape', preset: 'Mastering deck' },
    ],
  },
  {
    id: 'broadcast-hall-studio-tape',
    name: 'Studio tape',
    category: 'tape',
    description:
      'A soft loop of whatever was just played, then a reel of tape, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 2.14 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 2.2 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'broadcast-hall-tape-in-the-yard',
    name: 'Tape in the yard',
    category: 'tape',
    description:
      'A clean pass over fast new tape, with nothing added, into a medium hall with only a breath of a vowel in its tail.',
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
    ],
  },
  {
    id: 'broadcast-hall-live-room-drift',
    name: 'Live-room drift',
    category: 'motion',
    description:
      'Three voices drifting over a cycle of about twelve seconds, then a short, soft tape echo close behind the playing, into a vast nave.',
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
      'A deep slow chorus, then a faint trace of tape echo behind the playing, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.149, delayMs: 28.6 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 507 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'broadcast-hall-voices-half-asleep',
    name: 'Voices half asleep',
    category: 'motion',
    description:
      'Three detuned voices spread hard apart with no dry sound, then two tape heads that make every repeat gallop, into a hall with long lows.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.369, delayMs: 17.9 } },
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'broadcast-hall-oak-panel-chorus',
    name: 'Oak-panel chorus',
    category: 'motion',
    description:
      'A plain two-voice chorus, then a wide echo whose repeats drift slowly in pitch, into a faint hall tail of about three seconds.',
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
      'Three detuned voices spread hard apart with no dry sound, then a short, soft tape echo close behind the playing, into a mid-sized hall.',
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
    id: 'broadcast-hall-red-light-voices',
    name: 'Red-light voices',
    category: 'motion',
    description:
      'A combo amplifier driven hard, miked right on the cone, then a three-voice chorus spread wide across the sides.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge' },
      { deviceId: 'chorus', preset: 'Wide chorus' },
    ],
  },
  {
    id: 'broadcast-hall-swarm-over-tea',
    name: 'Swarm over tea',
    category: 'motion',
    description:
      'A valve stage that gives way under loud notes, tails rising, then a wide string pad that never stops shifting and shimmering.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'pad-follower', preset: 'Restless', params: { rise: 0.497, fall: 6.15 } },
    ],
  },
  {
    id: 'broadcast-hall-workshop-flutter',
    name: 'Workshop flutter',
    category: 'motion',
    description:
      'A fast warble of two voices pulling against each other, then a bucket-brigade echo with a slow chorus on its repeats.',
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
      'A rotating speaker on its slow speed, then a thick three-voice ensemble chorus that turns slowly.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
    ],
  },
  {
    id: 'broadcast-hall-valve-lit-pulse',
    name: 'Valve-lit pulse',
    category: 'motion',
    description:
      'A fast rotating speaker at full depth, microphones close, into a tight damped little room that is barely there.',
    effects: [
      { deviceId: 'rotary', preset: 'Close pulse' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'broadcast-hall-oak-panel-breath',
    name: 'Oak-panel breath',
    category: 'motion',
    description:
      'A triode valve stage, smoothly overdriven, then the level breathing in and out about every four seconds, into a quiet late plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.277 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 84.9 } },
    ],
  },
  {
    id: 'broadcast-hall-parquet-chorus',
    name: 'Parquet chorus',
    category: 'motion',
    description:
      'A reel driven hot, then three voices drifting over a cycle of about twelve seconds, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: 0.426 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0864, delayMs: 24.1 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'broadcast-hall-patchbay-speaker',
    name: 'Patchbay speaker',
    category: 'motion',
    description:
      'A slow rotating speaker heard from across the room, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 4.03, mix: 0.27 } },
    ],
  },
  {
    id: 'broadcast-hall-back-row-pedal',
    name: 'Back-row pedal',
    category: 'texture',
    description:
      'A held pad caught from each chord that glides to the next, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { attack: 0.22, glide: 0.407 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.08, breathRate: 0.189 } },
    ],
  },
  {
    id: 'broadcast-hall-unhurried-shadow',
    name: 'Unhurried shadow',
    category: 'texture',
    description:
      'A slow swell after each silence, with some dry attack left, then a phaser with no dry sound, pulling the two sides apart.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.269 } },
    ],
  },
  {
    id: 'broadcast-hall-drone-after-hours',
    name: 'Drone after hours',
    category: 'texture',
    description:
      'A slow swell on only the first note after each silence, then a steady, unmoving voice per note, like organ pipes.',
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'pad-follower', preset: 'Still pipes' },
    ],
  },
  {
    id: 'broadcast-hall-tenth-row-room',
    name: 'Tenth-row room',
    category: 'texture',
    description:
      'A short diffuse haze around the sound, like a small room, then a clean pass over fast new tape, with nothing added.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'broadcast-hall-tea-break-pad',
    name: 'Tea-break pad',
    category: 'texture',
    description:
      'A swell of about a second that turns struck notes to pads, into a clean speaker in a room, miked from well back.',
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 827, release: 370 } },
      { deviceId: 're-amp', preset: 'Just the room', params: { output: 5.55 } },
    ],
  },
  {
    id: 'broadcast-hall-red-brick-depths',
    name: 'Red-brick depths',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed', params: { mix: 0.15 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0324, envAttackMs: 10.9, envReleaseMs: 225 },
      },
    ],
  },
  {
    id: 'broadcast-hall-octave-sent-out-live',
    name: 'Octave sent out live',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, into three long springs that chirp and drip.',
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
      'A tape loop at half speed, an octave down and darker, into a wide hall that answers about a fifth of a second late.',
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
    id: 'broadcast-hall-session-crawl',
    name: 'Session crawl',
    category: 'pitch',
    description:
      'A quarter-speed crawl two octaves down, smooth and unbroken, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.36 } },
    ],
  },
  {
    id: 'broadcast-hall-piano-lid-drift',
    name: 'Piano-lid drift',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a hollow three-voice chorus swelling over about ten seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift' },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.109, delayMs: 9.3 } },
    ],
  },
  {
    id: 'broadcast-hall-basses-by-the-river',
    name: 'Basses by the river',
    category: 'pitch',
    description:
      'A dark string pad doubled an octave below the playing, then a tape reel pushed hard into thick saturation.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
    ],
  },
  {
    id: 'broadcast-hall-riverside-bass',
    name: 'Riverside bass',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, into a brief ring of sixteen strings behind each note.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals' },
      { deviceId: 'sympathetic', preset: 'Short halo', params: { decay: 0.805 } },
    ],
  },
  {
    id: 'broadcast-hall-cloakroom-chops',
    name: 'Cloakroom chops',
    category: 'pitch',
    description:
      'Half-speed chunks an octave down, cut about twice a second, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops', params: { length: 559 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'broadcast-hall-canteen-channel',
    name: 'Canteen channel',
    category: 'master',
    description:
      'A console channel run hot with its level pulled back down, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -2.22 } },
    ],
  },
  {
    id: 'broadcast-hall-double-door-glue',
    name: 'Double-door glue',
    category: 'master',
    description:
      'A mid-forward tone, then a fast compressor that takes the spike off plucked notes, then an eased-back ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.53 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'ambient-limiter', preset: 'Pull back', params: { gain: 0.386 } },
    ],
  },
  {
    id: 'broadcast-hall-off-air-room',
    name: 'Off-air room',
    category: 'master',
    description:
      'A tight damped little room that is barely there, then a low ceiling that keeps loud passages down for a while.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { release: 3.81 } },
    ],
  },
  {
    id: 'broadcast-hall-red-light-glue',
    name: 'Red-light glue',
    category: 'master',
    description:
      'A fast, firm compressor that stops only the peaks, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Peak stop', params: { attack: 10.6, release: 0.184 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -6.26 } },
    ],
  },
  {
    id: 'broadcast-hall-overdub-reel',
    name: 'Overdub reel',
    category: 'master',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { outputGain: -5.43 } },
    ],
  },
  {
    id: 'broadcast-hall-valve-lit-tone',
    name: 'Valve-lit tone',
    category: 'master',
    description:
      'An equaliser that adds lows and body and eases the top, then a low ceiling that lets go quickly, so loud passages breathe.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.52 } },
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { release: 0.291, gain: -1.03 } },
    ],
  },
]
