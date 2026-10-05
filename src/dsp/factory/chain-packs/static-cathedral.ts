// Static Cathedral: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'static-cathedral-hall-in-the-tower',
    name: 'Hall in the tower',
    category: 'space',
    description:
      'A damped hall whose tail lasts ten seconds and more, then a tape preamp driven for thick lows and a dull top.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -8.01 } },
    ],
  },
  {
    id: 'static-cathedral-plate-ringing-on',
    name: 'Plate ringing on',
    category: 'space',
    description:
      'A long plate with a wide and even tail, then a dark, driven amplifier stack with the mic off to one side.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 40.7 } },
      { deviceId: 're-amp', preset: 'Warm stack' },
    ],
  },
  {
    id: 'static-cathedral-unheated-crypt',
    name: 'Unheated crypt',
    category: 'space',
    description:
      'A huge dark cathedral with only the lows left ringing, then a dark fuzz from a valve pushed far past its limit.',
    effects: [
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28.9, modRate: 0.102 } },
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -7.65 } },
    ],
  },
  {
    id: 'static-cathedral-brownout-cloud',
    name: 'Brownout cloud',
    category: 'space',
    description:
      'A reverb that rises for about four seconds behind each note, then a nasal horn loudspeaker heard from far across a big room.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise' },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 7.02 } },
    ],
  },
  {
    id: 'static-cathedral-cloister-nave',
    name: 'Cloister nave',
    category: 'space',
    description:
      'A vast nave that rings for about eight seconds, then a bright, lean console channel driven for an edge on top.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
      { deviceId: 'analog-drive', preset: 'Sheen' },
    ],
  },
  {
    id: 'static-cathedral-mullion-hall',
    name: 'Mullion hall',
    category: 'space',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -11.4 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Airy tail',
        params: { preDelay: 27.1, lowDecay: 1.1, midDecay: 5.5 },
      },
    ],
  },
  {
    id: 'static-cathedral-rafter-hall',
    name: 'Rafter hall',
    category: 'space',
    description:
      'A thick, loose fuzz from an overloaded transformer, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 7.73, breathRate: 0.327 },
      },
    ],
  },
  {
    id: 'static-cathedral-slate-bloom',
    name: 'Slate bloom',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, then a bright wide room, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'ether-reverb', preset: 'Ether' },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'static-cathedral-cluster-in-midwinter',
    name: 'Cluster in midwinter',
    category: 'space',
    description:
      'A combo amplifier heard from the far side of a big room, into a tight cluster of echoes close behind each note.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { length: 0.089, glide: 0.569 } },
    ],
  },
  {
    id: 'static-cathedral-mist-in-cold-stone',
    name: 'Mist in cold stone',
    category: 'space',
    description:
      'A small room that casts a shadow an octave below, into a thin bright reverb with all its lows cut away.',
    effects: [
      { deviceId: 'shimmer', preset: 'Low shadow', params: { decay: 2.21, predelay: 18.1 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 12.6, modRate: 0.188 } },
    ],
  },
  {
    id: 'static-cathedral-flagstone-cavern',
    name: 'Flagstone cavern',
    category: 'space',
    description:
      'A vast blurred hollow that rings for half a minute, then a low, gentle compressor that brings up everything quiet.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Vast hollow' },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet', params: { makeup: 10.8 } },
    ],
  },
  {
    id: 'static-cathedral-unlit-halo',
    name: 'Unlit halo',
    category: 'space',
    description:
      'The drifting tail of a long reverb with no dry sound, then two copies heard just after the sound, the left one first.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 14.3 } },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
    ],
  },
  {
    id: 'static-cathedral-candle-end-drift',
    name: 'Candle-end drift',
    category: 'space',
    description:
      'A thin band of tone with the lows cut and the top rolled off, into a dark reverb whose tail sags slowly out of tune.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.66 } },
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { decay: 13.1 } },
    ],
  },
  {
    id: 'static-cathedral-space-in-the-crypt',
    name: 'Space in the crypt',
    category: 'space',
    description:
      'Bright tape-style saturation mixed in under the clean sound, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 20.1, modRate: 0.264 } },
    ],
  },
  {
    id: 'static-cathedral-choir-by-the-font',
    name: 'Choir by the font',
    category: 'space',
    description:
      'One slow scatter of echoes over about a second and no tail, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Long scatter' },
      { deviceId: 'vowel-reverb', preset: 'Choir alone' },
    ],
  },
  {
    id: 'static-cathedral-verdigris-valley',
    name: 'Verdigris valley',
    category: 'space',
    description:
      'A huge dark open space that answers late and rings on, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.58 } },
    ],
  },
  {
    id: 'static-cathedral-evensong-memory',
    name: 'Evensong memory',
    category: 'echo',
    description:
      'Moments drifting back, then a far-off horn loudspeaker, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'echo-memory', preset: 'No echo' },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 3.92 } },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'static-cathedral-stutter-in-the-roof',
    name: 'Stutter in the roof',
    category: 'echo',
    description:
      'An endless stutter made of the first fragment played, then a far-off combo amp, into a huge wash by itself.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Stutter held', params: { length: 0.175 } },
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 42.2, modRate: 0.0951 } },
    ],
  },
  {
    id: 'static-cathedral-north-door-chirps',
    name: 'North-door chirps',
    category: 'echo',
    description:
      'A fast backwards loop, then a driven valve amplifier, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse', params: { length: 0.599 } },
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'swarm-reverb', preset: 'Bending', params: { length: 0.478, glide: 2.1 } },
    ],
  },
  {
    id: 'static-cathedral-guttering-memory',
    name: 'Guttering memory',
    category: 'echo',
    description:
      'Earlier phrases that return over and over and slowly gather, into a bright chamber that rings for a couple of seconds.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Gathering',
        params: { time: 680, reach: 23.4, size: 3.76 },
      },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'static-cathedral-unheated-echo',
    name: 'Unheated echo',
    category: 'echo',
    description:
      'Thin valve grit mixed in under the clean sound, then grain repeats that sink by fourths on every pass.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 530, size: 190 } },
    ],
  },
  {
    id: 'static-cathedral-roofless-tape',
    name: 'Roofless tape',
    category: 'echo',
    description:
      'A big lift of the low end that puts weight under the sound, then a tape loop that wears thinner and duller on every pass.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.09 } },
    ],
  },
  {
    id: 'static-cathedral-solder-swells',
    name: 'Solder swells',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, then slow echoes that climb further out of tune on each repeat.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
      { deviceId: 'freq-shifter', preset: 'Rising echo', params: { delay: 470, lfoRate: 0.084 } },
    ],
  },
  {
    id: 'static-cathedral-mortar-echo',
    name: 'Mortar echo',
    category: 'echo',
    description:
      'A drifting reel laid against the dry sound to make a chorus, then a plain echo that is a little darker on each repeat.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 358, reach: 19.2, size: 3.33 },
      },
    ],
  },
  {
    id: 'static-cathedral-tallow-room',
    name: 'Tallow room',
    category: 'tape',
    description:
      'A tape preamp driven for thick lows and a dull top, then a speaker far across a room, into a plate with no dry sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'static-cathedral-room-under-slates',
    name: 'Room under slates',
    category: 'tape',
    description:
      'A bright wavefolder, then a clean speaker at the far end of a big, echoing room, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead' },
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { output: -5.62 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'static-cathedral-amp-past-the-pews',
    name: 'Amp past the pews',
    category: 'tape',
    description:
      'A torn, folded-over fuzz, then a driven combo amplifier with its hiss and hum right up, into a slowly sliding cave.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Torn cone' },
      { deviceId: 're-amp', preset: 'Noisy valves' },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch', params: { length: 0.708, glide: 5.42 } },
    ],
  },
  {
    id: 'static-cathedral-haze-after-mass',
    name: 'Haze after mass',
    category: 'tape',
    description:
      'A wavefolder at full drive, broken up like a torn speaker, then a scrambled audio stream that smears every attack into haze.',
    effects: [
      { deviceId: 'saturator', preset: 'Blown speaker', params: { outputDb: -21 } },
      { deviceId: 'low-bitrate', preset: 'Smeared haze' },
    ],
  },
  {
    id: 'static-cathedral-lenten-fuzz',
    name: 'Lenten fuzz',
    category: 'tape',
    description:
      'An overloaded console channel under the clean sound, then a dial left between stations, mostly whistle and static.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { output: -11.9 } },
      { deviceId: 'radio', preset: 'Between stations' },
    ],
  },
  {
    id: 'static-cathedral-transept-loop',
    name: 'Transept loop',
    category: 'tape',
    description:
      'A tape loop that plays its layers back in reverse, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Backwards layers' },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'static-cathedral-fizz-in-stone',
    name: 'Fizz in stone',
    category: 'tape',
    description:
      'A console channel driven until it is firm in the mids, then an audio stream starved and scrambled until each note fizzes.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'low-bitrate', preset: 'Fizzing phases' },
    ],
  },
  {
    id: 'static-cathedral-empty-pew-fuzz',
    name: 'Empty-pew fuzz',
    category: 'tape',
    description:
      'A hard-clipped copy held at one level under the clean sound, then the low hum of an amplifier left switched on.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.414, hold: 29.3 } },
    ],
  },
  {
    id: 'static-cathedral-roofless-haze',
    name: 'Roofless haze',
    category: 'tape',
    description:
      'A scrambled audio stream that smears every attack into haze, then a far radio station, sinking in and out of heavy static.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Smeared haze' },
      { deviceId: 'patina', preset: 'Distant station' },
    ],
  },
  {
    id: 'static-cathedral-churchyard-sampler',
    name: 'Churchyard sampler',
    category: 'tape',
    description:
      'Worn nine-bit converters, grainy, hissing on the high notes, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'static-cathedral-grey-noon-grain',
    name: 'Grey-noon grain',
    category: 'tape',
    description:
      'Five-bit converters fed hot, coarse and grainy on every note, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'static-cathedral-leaded-hallway',
    name: 'Leaded hallway',
    category: 'tape',
    description:
      'Thin valve grit mixed in under the clean sound, then a far-off combo amp, into a huge hall whose tail hums a soft oo for a long while.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'static-cathedral-valves-under-slates',
    name: 'Valves under slates',
    category: 'tape',
    description:
      'An overloaded tape preamp, then an amplifier stack turned all the way up, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 're-amp', preset: 'Stack flat out', params: { output: -7.57 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 57.9, lowDecay: 7.88, midDecay: 2.04 },
      },
    ],
  },
  {
    id: 'static-cathedral-stone-radio',
    name: 'Stone radio',
    category: 'tape',
    description:
      'A low cut that thins the bass, with a little air on top, then a small boxy radio, then echoes that climb sharp.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.59 } },
      { deviceId: 'radio', preset: 'Kitchen radio' },
      { deviceId: 'freq-shifter', preset: 'Rising echo', params: { delay: 380, lfoRate: 0.0853 } },
    ],
  },
  {
    id: 'static-cathedral-grit-in-the-vestry',
    name: 'Grit in the vestry',
    category: 'tape',
    description:
      'A telephone-grade audio stream, mono, gritty and dull on top, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Dial-up' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 32.2, modRate: 0.0986 } },
    ],
  },
  {
    id: 'static-cathedral-static-in-the-crypt',
    name: 'Static in the crypt',
    category: 'tape',
    description:
      'A low-heavy transformer, then a shortwave station at night, into a clean speaker at the far end of a big, echoing room.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'radio', preset: 'Night shortwave' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'static-cathedral-converter-under-snow',
    name: 'Converter under snow',
    category: 'tape',
    description:
      'An eight-bit digital telephone line, band-limited and dull, into a thin bright reverb with all its lows cut away.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Phone' },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 11.6, modRate: 0.178 } },
    ],
  },
  {
    id: 'static-cathedral-tape-after-mass',
    name: 'Tape after mass',
    category: 'tape',
    description:
      'A warm, full equaliser, then a four-track cassette, then a soft echo while earlier phrases drift back under it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 475, reach: 21.3, size: 2.82 },
      },
    ],
  },
  {
    id: 'static-cathedral-warble-in-midwinter',
    name: 'Warble in midwinter',
    category: 'tape',
    description:
      'A watery, dull audio stream, then a wide wall of tape hiss that stands over the sound, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater' },
      { deviceId: 'noise-floor', preset: 'Wall of hiss' },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { length: 1.2, glide: 0.539 } },
    ],
  },
  {
    id: 'static-cathedral-radio-with-no-heat',
    name: 'Radio with no heat',
    category: 'tape',
    description:
      'A medium-wave set whose dial slips off into whistle and back, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'radio', preset: 'Drifting dial' },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'static-cathedral-drift-breaking-up',
    name: 'Drift breaking up',
    category: 'tape',
    description:
      'A ringing sweep that seems to climb without end, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Barber pole', params: { delay: 11.4, lfoRate: 0.0806 } },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -4.62 } },
    ],
  },
  {
    id: 'static-cathedral-fuse-wire-signal',
    name: 'Fuse-wire signal',
    category: 'tape',
    description:
      'A nasal shortwave channel crossed by whistles and data tones, then the low hum of an amplifier left switched on.',
    effects: [
      { deviceId: 'radio', preset: 'Numbers' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.414, hold: 28.7 } },
    ],
  },
  {
    id: 'static-cathedral-boarded-up-converter',
    name: 'Boarded-up converter',
    category: 'tape',
    description:
      'A small radio speaker muffled as if under a pillow, then an eight-bit digital telephone line, band-limited and dull.',
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'vintage-digital', preset: 'Phone' },
    ],
  },
  {
    id: 'static-cathedral-matins-drift',
    name: 'Matins drift',
    category: 'tape',
    description:
      'A slow phasing drift that turns over every few seconds, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { delay: 42, lfoRate: 0.0814 } },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'static-cathedral-censer-radio',
    name: 'Censer radio',
    category: 'tape',
    description:
      'A small boxy radio, then radio static that drifts and crackles under the sound, into a dark, very long hall.',
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio' },
      { deviceId: 'noise-floor', preset: 'Radio static', params: { response: 0.373, hold: 10.5 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail' },
    ],
  },
  {
    id: 'static-cathedral-grit-in-the-roof',
    name: 'Grit in the roof',
    category: 'tape',
    description:
      'An equaliser that takes presence, air and lows away, then a coarse early sampler, gritty, with bright fizz on top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.59 } },
      { deviceId: 'patina', preset: 'Eight bit' },
    ],
  },
  {
    id: 'static-cathedral-buttress-fuzz',
    name: 'Buttress fuzz',
    category: 'tape',
    description:
      'A bright, buzzing fuzz from a valve driven all the way, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'patina', preset: 'Valve fuzz', params: { output: -9.12 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.586 } },
    ],
  },
  {
    id: 'static-cathedral-burnt-out-signal',
    name: 'Burnt-out signal',
    category: 'tape',
    description:
      'A ringing sweep that seems to climb without end, then an audio stream that drops out in soft-edged gaps of silence.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { delay: 11.7, lfoRate: 0.0792, mix: 0.3 },
      },
      { deviceId: 'low-bitrate', preset: 'Dropouts' },
    ],
  },
  {
    id: 'static-cathedral-sway-in-the-apse',
    name: 'Sway in the apse',
    category: 'motion',
    description:
      'A dark valve fuzz, then the whole sound swaying sharp and flat every few seconds, into a slow tide of reverb.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'freq-shifter', preset: 'Seasick', params: { delay: 19.1, lfoRate: 0.222 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.98 } },
    ],
  },
  {
    id: 'static-cathedral-blown-fuse-sway',
    name: 'Blown-fuse sway',
    category: 'motion',
    description:
      'The whole sound swaying sharp and flat every few seconds, then a thinning tape echo, into a long high choir.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Seasick', params: { delay: 20.7, lfoRate: 0.27 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 369 } },
      { deviceId: 'vowel-reverb', preset: 'High choir' },
    ],
  },
  {
    id: 'static-cathedral-bellows-tide',
    name: 'Bellows tide',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a hall of about four seconds with no dry sound in it.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0279, envAttackMs: 10.3, envReleaseMs: 190 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 22.3, lowDecay: 3.83, midDecay: 4.22 },
      },
    ],
  },
  {
    id: 'static-cathedral-draughty-filter',
    name: 'Draughty filter',
    category: 'motion',
    description:
      'A torn, folded-over fuzz, then a single notch drifting slowly up and down the spectrum, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Torn cone', params: { output: -6.43 } },
      {
        deviceId: 'auto-filter',
        preset: 'Slow notch',
        params: { envAttackMs: 9.84, envReleaseMs: 220 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 70.4, lowDecay: 6.87, midDecay: 5.98 },
      },
    ],
  },
  {
    id: 'static-cathedral-belfry-ripple',
    name: 'Belfry ripple',
    category: 'motion',
    description:
      'A wavefolder at full drive, then a faint, very slow phasing, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Blown speaker', params: { outputDb: -15.6 } },
      { deviceId: 'freq-shifter', preset: 'Still water', params: { delay: 6.38, lfoRate: 0.0464 } },
      { deviceId: 'bloom-reverb', preset: 'Tail alone' },
    ],
  },
  {
    id: 'static-cathedral-candle-end-filter',
    name: 'Candle-end filter',
    category: 'motion',
    description:
      'A resonant upper-mid peak that rises when played hard, into a very long reverb whose tail keeps climbing by octaves.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 0.948, envAttackMs: 21.1, envReleaseMs: 275 },
      },
      { deviceId: 'bloom-reverb', preset: 'Endless rise', params: { decay: 27.7 } },
    ],
  },
  {
    id: 'static-cathedral-compline-sway',
    name: 'Compline sway',
    category: 'motion',
    description:
      'A bright, buzzing fuzz from a hard clipper driven flat, then the whole sound swaying sharp and flat every few seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Fuzz pedal', params: { outputDb: -20 } },
      { deviceId: 'freq-shifter', preset: 'Seasick', params: { delay: 19.4, lfoRate: 0.277 } },
    ],
  },
  {
    id: 'static-cathedral-whitewashed-murk',
    name: 'Whitewashed murk',
    category: 'texture',
    description:
      'Coarse four-bit converters that rasp on every note, then a thick fog of grains, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Rasp' },
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { size: 523 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Airy tail',
        params: { preDelay: 32.6, lowDecay: 1.11, midDecay: 5.37 },
      },
    ],
  },
  {
    id: 'static-cathedral-whiteout-embers',
    name: 'Whiteout embers',
    category: 'texture',
    description:
      'A thin twelve-bit glaze, then grain repeats that fall an octave and darken each time, into a dark rising reverb.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 476, size: 241 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 1.95, preDelay: 58 } },
    ],
  },
  {
    id: 'static-cathedral-cloud-off-the-walls',
    name: 'Cloud off the walls',
    category: 'texture',
    description:
      'A watery, grainy wash, then a cloud of backwards grains close behind the playing, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Frozen stream' },
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { size: 343, density: 9.72 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 20.6, mix: 0.18 } },
    ],
  },
  {
    id: 'static-cathedral-mist-wall-to-wall',
    name: 'Mist wall to wall',
    category: 'texture',
    description:
      'A muffled audio stream, then a diffuse mist where each note hangs on after it is played, into a far-off hall.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Through a wall' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.38 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.48 } },
    ],
  },
  {
    id: 'static-cathedral-north-door-cloud',
    name: 'North-door cloud',
    category: 'texture',
    description:
      'Coarse five-bit converters, then a scattered cloud of short grains behind the playing, into a far-off hall.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { time: 237, size: 78.3 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.611 } },
    ],
  },
  {
    id: 'static-cathedral-evensong-wash',
    name: 'Evensong wash',
    category: 'texture',
    description:
      'A very wide wash in which every note hangs for many seconds, then the soft air of an open microphone under the sound.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { mix: 0.45 } },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { response: 0.388, hold: 10.5 } },
    ],
  },
  {
    id: 'static-cathedral-swell-in-static',
    name: 'Swell in static',
    category: 'texture',
    description:
      'A string pad that takes seconds to swell in after a chord, then tape hiss that sinks under each note and swells in the gaps.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 4.12, fall: 6.95 } },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.866, hold: 16.2 },
      },
    ],
  },
  {
    id: 'static-cathedral-bloom-through-stone',
    name: 'Bloom through stone',
    category: 'texture',
    description:
      'Layers of held chords that bloom slowly and never fade, then a starved audio stream, watery and smeared, its top cut away.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow bloom layers', params: { mix: 0.369 } },
      { deviceId: 'low-bitrate', preset: 'Underwater' },
    ],
  },
  {
    id: 'static-cathedral-unlit-tide',
    name: 'Unlit tide',
    category: 'texture',
    description:
      'Dark, thick valve grit that fills out the low end, then long slow grains an octave down, most of them reversed.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 803, density: 5.39 } },
    ],
  },
  {
    id: 'static-cathedral-bell-rope-echoes',
    name: 'Bell-rope echoes',
    category: 'texture',
    description:
      'Soft repeats an octave up or down, under the dry sound, then raw converters at a very low rate, bright and clanging.',
    effects: [
      { deviceId: 'glitch', preset: 'Octave ghosts' },
      { deviceId: 'vintage-digital', preset: 'Clang' },
    ],
  },
  {
    id: 'static-cathedral-pad-down-the-nave',
    name: 'Pad down the nave',
    category: 'texture',
    description:
      'A wide pad made of the sound with its attacks dissolved, into a far-off room laid in under the untouched sound.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Pad from anything' },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'static-cathedral-soot-strings',
    name: 'Soot strings',
    category: 'texture',
    description:
      'A string pad that stands alone in place of what is played, into a small room that casts a shadow an octave below.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Pad alone' },
      { deviceId: 'shimmer', preset: 'Low shadow', params: { predelay: 21.8 } },
    ],
  },
  {
    id: 'static-cathedral-fuse-wire-strings',
    name: 'Fuse-wire strings',
    category: 'texture',
    description:
      'A string pad that arrives long after the chord and stays, then a medium-wave radio under the dry sound, mostly its static.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Late tide' },
      { deviceId: 'radio', preset: 'Hint of static' },
    ],
  },
  {
    id: 'static-cathedral-bloom-past-the-pews',
    name: 'Bloom past the pews',
    category: 'texture',
    description:
      'Layers of held chords that bloom slowly and never fade, then steady tape hiss that lingers after the last note.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow bloom layers', params: { attack: 4.62, mix: 0.391 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { response: 0.433, hold: 13.1 } },
    ],
  },
  {
    id: 'static-cathedral-wash-ringing-on',
    name: 'Wash ringing on',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -4.95 } },
    ],
  },
  {
    id: 'static-cathedral-nave-end-buzz',
    name: 'Nave-end buzz',
    category: 'texture',
    description:
      'Tiny slices repeated so fast that they buzz, then a faint backwards swell behind each phrase.',
    effects: [
      { deviceId: 'glitch', preset: 'Buzzing stutter' },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { time: 822 } },
    ],
  },
  {
    id: 'static-cathedral-drone-under-snow',
    name: 'Drone under snow',
    category: 'texture',
    description:
      'An unfading slow drone, then a deep pitch wobble in the centre, like a warped tape, into a late-arriving hall.',
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 2.68, glide: 3.77 } },
      { deviceId: 'chorus', preset: 'Warped tape' },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'static-cathedral-bell-rope-shimmer',
    name: 'Bell-rope shimmer',
    category: 'texture',
    description:
      'A bright blurred cloud an octave above everything played, into a long reverb whose tail wavers queasily in pitch.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Bright octave cloud' },
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 16.7, modRate: 1.57 } },
    ],
  },
  {
    id: 'static-cathedral-advent-cloud',
    name: 'Advent cloud',
    category: 'texture',
    description:
      'A wide haze of grains that hangs on long after the playing, then a space that answers in hard separate echoes.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Frozen haze', params: { mix: 0.394 } },
      {
        deviceId: 'expanse',
        preset: 'Hard echoes',
        params: { decay: 4.41, modRate: 0.386, mix: 0.156 },
      },
    ],
  },
  {
    id: 'static-cathedral-snow-light-buzz',
    name: 'Snow-light buzz',
    category: 'texture',
    description:
      'A buzzing metallic fifth above from very short grains, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Metal grains', params: { size: 16.3 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'static-cathedral-pad-in-the-vestry',
    name: 'Pad in the vestry',
    category: 'texture',
    description:
      'A held pad that stands alone in place of what was played, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'sustainer', preset: 'Held sound alone' },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { decay: 4.67, breathRate: 0.31 } },
    ],
  },
  {
    id: 'static-cathedral-buttress-wash',
    name: 'Buttress wash',
    category: 'texture',
    description:
      'A long bowed swell that leans slowly into every note, then a dark, bassy wash, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 637, release: 154 } },
      { deviceId: 'spectral-blur', preset: 'Dark water' },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'static-cathedral-transept-fifth',
    name: 'Transept fifth',
    category: 'pitch',
    description:
      'Grains a fifth down, then a medium-wave station under the crackle of a far storm, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 78.7 } },
      { deviceId: 'radio', preset: 'Storm coming' },
      {
        deviceId: 'hall-reverb',
        preset: 'Vast nave',
        params: { preDelay: 93.8, lowDecay: 7.21, midDecay: 7.52 },
      },
    ],
  },
  {
    id: 'static-cathedral-bass-past-the-pews',
    name: 'Bass past the pews',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, then an audio stream full of gaps, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'low-bitrate', preset: 'Dropouts' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 32.6, modRate: 0.0985 } },
    ],
  },
  {
    id: 'static-cathedral-bass-in-the-loft',
    name: 'Bass in the loft',
    category: 'pitch',
    description:
      'The octave below alone, rounded off like a bass, then a watery, warbling copy laid under the clean sound, into a slow dark swell.',
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone' },
      { deviceId: 'low-bitrate', preset: 'Watery trace' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.9 } },
    ],
  },
  {
    id: 'static-cathedral-loose-wire-chime',
    name: 'Loose-wire chime',
    category: 'pitch',
    description:
      'High inharmonic chimes, then a nasal shortwave channel, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'High chime', params: { delay: 254, lfoRate: 0.0784 } },
      { deviceId: 'radio', preset: 'Numbers' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 18.7, preDelay: 36.3 } },
    ],
  },
  {
    id: 'static-cathedral-nave-end-fourth',
    name: 'Nave-end fourth',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then two copies far out of tune that sway like a worn tape.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below' },
      { deviceId: 'stereo-detune', preset: 'Seasick' },
    ],
  },
  {
    id: 'static-cathedral-short-day-undertow',
    name: 'Short-day undertow',
    category: 'pitch',
    description:
      'Whole phrases dragged out at half speed, an octave down, then smooth, dull converters with a hiss that rides high notes.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
    ],
  },
  {
    id: 'static-cathedral-buried-bass',
    name: 'Buried bass',
    category: 'pitch',
    description:
      'The octave below alone, rounded off like a bass, into a soft sung oo that follows a moment behind each note.',
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone' },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 4.13, preDelay: 89.7 } },
    ],
  },
  {
    id: 'static-cathedral-derelict-octaves',
    name: 'Derelict octaves',
    category: 'pitch',
    description:
      'The octaves below and above alone, beating out of tune, then toy eight-bit converters, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'octaves', preset: 'Hollow pair' },
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'static-cathedral-snowbound-fifths',
    name: 'Snowbound fifths',
    category: 'pitch',
    description:
      'A wide cloud whose grains jump by fifths and octaves, then an audio stream starved down to a few warbling tones.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { size: 548, density: 12.5 } },
      { deviceId: 'low-bitrate', preset: 'Few partials' },
    ],
  },
  {
    id: 'static-cathedral-sunken-fourth',
    name: 'Sunken fourth',
    category: 'pitch',
    description:
      'Uneven pieces a fourth down, like tape slipping and catching, then a plain echo whose repeats bounce from side to side.',
    effects: [
      { deviceId: 'half-speed', preset: 'Tape slip', params: { length: 660 } },
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 296, reach: 18.9, size: 2.65 },
      },
    ],
  },
  {
    id: 'static-cathedral-frostbitten-octaves',
    name: 'Frostbitten octaves',
    category: 'pitch',
    description:
      'Octaves below and above through a nasal, peaked filter, then a wide fog without lows or highs that hangs for seconds.',
    effects: [
      { deviceId: 'octaves', preset: 'Nasal reed' },
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
    ],
  },
  {
    id: 'static-cathedral-sparks-in-the-nave',
    name: 'Sparks in the nave',
    category: 'pitch',
    description:
      'Tiny hard-edged grains an octave up, scattered in pitch, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Glass shards', params: { size: 28.5, density: 13.5 } },
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1520, size: 457 } },
    ],
  },
  {
    id: 'static-cathedral-finish-through-stone',
    name: 'Finish through stone',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a very gentle compressor, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-comp', preset: 'Glue', params: { attack: 661, release: 4.04 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'static-cathedral-derelict-finish',
    name: 'Derelict finish',
    category: 'master',
    description:
      'A gentle compressor that draws loud and quiet together, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 107, release: 2.23 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.46, gain: 2.42 } },
    ],
  },
  {
    id: 'static-cathedral-side-aisle-finish',
    name: 'Side-aisle finish',
    category: 'master',
    description:
      'A little soft saturation, then an even-handed compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 127, release: 1.46 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'static-cathedral-padlocked-master',
    name: 'Padlocked master',
    category: 'master',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.39 } },
    ],
  },
  {
    id: 'static-cathedral-scorched-master',
    name: 'Scorched master',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a parallel compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 355, release: 3.03 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.39 } },
    ],
  },
  {
    id: 'static-cathedral-mixdown-at-evensong',
    name: 'Mixdown at evensong',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a slow compressor that evens out swells over seconds, then a safety limiter.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'static-cathedral-master-by-the-font',
    name: 'Master by the font',
    category: 'master',
    description:
      'A subsonic cut with the low mids and the presence eased, then a slightly wider image, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.36, gain: 2.06 } },
    ],
  },
]
