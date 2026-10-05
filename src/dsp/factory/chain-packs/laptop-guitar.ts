// Sunburnt Laptop Guitar: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'laptop-guitar-bleached-cathedral',
    name: 'Bleached cathedral',
    category: 'space',
    description:
      'A console channel driven until it is firm in the mids, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { output: -2.17 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'laptop-guitar-promenade-vault',
    name: 'Promenade vault',
    category: 'space',
    description:
      'The level rising and falling at random, like surf, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { midDecay: 7.44 } },
    ],
  },
  {
    id: 'laptop-guitar-laptop-halo',
    name: 'Laptop halo',
    category: 'space',
    description:
      'A smooth swell that brings every note in like bowed strings, then a short bright haze with an octave above everything.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 357, release: 662 } },
      { deviceId: 'spectral-blur', preset: 'Glass halo' },
    ],
  },
  {
    id: 'laptop-guitar-overheated-sky',
    name: 'Overheated sky',
    category: 'space',
    description:
      'A scooped tone with lows and highs up and the body down, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9.6, modRate: 0.393 } },
    ],
  },
  {
    id: 'laptop-guitar-autosave-hall',
    name: 'Autosave hall',
    category: 'space',
    description:
      'A combo amplifier boxed in by the walls of a cupboard, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 187 } },
    ],
  },
  {
    id: 'laptop-guitar-jetty-shimmer',
    name: 'Jetty shimmer',
    category: 'space',
    description:
      'A slow swell after each silence that leaves some attack in, into a smeared wash of grains that climbs by octaves.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'grain-delay', preset: 'Shimmer wash', params: { time: 520, size: 280 } },
    ],
  },
  {
    id: 'laptop-guitar-heatwave-springs',
    name: 'Heatwave springs',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.47 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'laptop-guitar-cavern-in-august',
    name: 'Cavern in August',
    category: 'space',
    description:
      'A cavern built from a rush of short echoes, then a fast limiter pushed so that soft and loud notes even out.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { length: 0.489, glide: 0.54 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'laptop-guitar-awning-plate',
    name: 'Awning plate',
    category: 'space',
    description:
      'A long plate with a wide and even tail, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 40.4 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.655 } },
    ],
  },
  {
    id: 'laptop-guitar-line-in-room',
    name: 'Line-in room',
    category: 'space',
    description:
      'A combo amplifier heard from the far side of a big room, into a wide room heard from its far end.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -3.4 } },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'laptop-guitar-terrace-plate',
    name: 'Terrace plate',
    category: 'space',
    description:
      'A bright, lean console channel driven for an edge on top, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14.9 } },
    ],
  },
  {
    id: 'laptop-guitar-august-echo',
    name: 'August echo',
    category: 'echo',
    description:
      'A backwards echo of each phrase that swells in and cuts off, then a thin, bright haze that hangs high above the sound.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 581 } },
      { deviceId: 'spectral-blur', preset: 'High air' },
    ],
  },
  {
    id: 'laptop-guitar-driftwood-echo',
    name: 'Driftwood echo',
    category: 'echo',
    description:
      'Backwards chunks spliced hard with no fades between them, then soft repeats an octave up or down, under the dry sound.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Hard splices' },
      { deviceId: 'glitch', preset: 'Octave ghosts', params: { time: 459 } },
    ],
  },
  {
    id: 'laptop-guitar-arcade-swells',
    name: 'Arcade swells',
    category: 'echo',
    description:
      'Backwards swells that climb an octave on every pass, then soft stumbles where a slice repeats, sticks or turns back.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass' },
      { deviceId: 'glitch', preset: 'Gentle stumble', params: { time: 259 } },
    ],
  },
  {
    id: 'laptop-guitar-quayside-swells',
    name: 'Quayside swells',
    category: 'echo',
    description:
      'Slow backwards swells that rise and die behind the playing, then a diffuse mist where each note hangs on after it is played.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1780 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
    ],
  },
  {
    id: 'laptop-guitar-buffered-echo',
    name: 'Buffered echo',
    category: 'echo',
    description:
      'Grain repeats that climb by fifths on every pass, into a hard-driven two-spring tank that answers a moment late.',
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Rising fifths',
        params: { time: 695, size: 161, mix: 0.21 },
      },
      {
        deviceId: 'spring-reverb',
        preset: 'Dub send',
        params: { decay: 3.2, predelay: 53.6, mix: 0.3 },
      },
    ],
  },
  {
    id: 'laptop-guitar-fifths-on-a-postcard',
    name: 'Fifths on a postcard',
    category: 'echo',
    description:
      'Soft clipping, a little bright, laid under the clean sound, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch', params: { outputDb: -10.1 } },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { time: 608, size: 169 } },
    ],
  },
  {
    id: 'laptop-guitar-low-battery-refrain',
    name: 'Low-battery refrain',
    category: 'echo',
    description:
      'Whole phrases that repeat by chance, each time quieter, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'glitch', preset: 'Phrase repeats' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'laptop-guitar-siesta-echo',
    name: 'Siesta echo',
    category: 'echo',
    description:
      'Soft saturation that adds the octave above each note, then grain repeats that climb an octave on every pass, into a mid-sized hall.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 357, size: 133 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 61.5, lowDecay: 2.75, midDecay: 2.26 },
      },
    ],
  },
  {
    id: 'laptop-guitar-snapshot-octaves',
    name: 'Snapshot octaves',
    category: 'echo',
    description:
      'A full, warm transformer, then grain repeats that climb an octave on every pass, into a vast, slowly opening hall.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 342, size: 123 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'laptop-guitar-soundcard-repeats',
    name: 'Soundcard repeats',
    category: 'echo',
    description:
      'A low-pass that opens and closes over about half a minute, then a quick loop of about the last half second that soon fades.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0335, envAttackMs: 10.9, envReleaseMs: 208 },
      },
      { deviceId: 'micro-looper', preset: 'Quick loop' },
    ],
  },
  {
    id: 'laptop-guitar-terrace-octave',
    name: 'Terrace octave',
    category: 'echo',
    description:
      'An echo whose repeats jump up an octave and back, then a thin, bright haze that hangs high above the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop' },
      { deviceId: 'spectral-blur', preset: 'High air' },
    ],
  },
  {
    id: 'laptop-guitar-echo-down-the-line',
    name: 'Echo down the line',
    category: 'echo',
    description:
      'A hot console channel, forward in the upper mids, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 645 } },
    ],
  },
  {
    id: 'laptop-guitar-snapshot-echoes',
    name: 'Snapshot echoes',
    category: 'echo',
    description:
      'Echoes that jump an octave on every repeat, left and right, into a plate wash that hangs on for half a minute.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Crystal cascade',
        params: { v1Delay: 323, v2Delay: 455, v3Delay: 166, output: 2.49 },
      },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'laptop-guitar-postcard-fuzz',
    name: 'Postcard fuzz',
    category: 'tape',
    description:
      'A thick, loose fuzz from an overloaded transformer, then scattered short grains an octave up, falling like rain.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'grain-cloud', preset: 'Octave rain' },
    ],
  },
  {
    id: 'laptop-guitar-pixelated-grit',
    name: 'Pixelated grit',
    category: 'tape',
    description:
      'Thin valve grit mixed in under the clean sound, then grains fed back an octave up, climbing higher each pass.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 380, density: 10.7 } },
    ],
  },
  {
    id: 'laptop-guitar-windbreak-fuzz',
    name: 'Windbreak fuzz',
    category: 'tape',
    description:
      'A bright, buzzing fuzz from a hard clipper driven flat, then tiny hard-edged grains an octave up, scattered in pitch.',
    effects: [
      { deviceId: 'saturator', preset: 'Fuzz pedal' },
      { deviceId: 'grain-cloud', preset: 'Glass shards' },
    ],
  },
  {
    id: 'laptop-guitar-crackling-grit',
    name: 'Crackling grit',
    category: 'tape',
    description:
      'A bed of six-bit grit and false tones under the clean sound, then a driven combo amplifier with its hiss and hum right up.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Grit bed' },
      { deviceId: 're-amp', preset: 'Noisy valves' },
    ],
  },
  {
    id: 'laptop-guitar-grit-gone-pink',
    name: 'Grit gone pink',
    category: 'tape',
    description:
      'Coarse four-bit converters that rasp on every note, then a lean pentode valve stage with a bite on every attack.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Rasp' },
      { deviceId: 'analog-drive', preset: 'Bite', params: { output: -3.58 } },
    ],
  },
  {
    id: 'laptop-guitar-heat-haze-gaps',
    name: 'Heat-haze gaps',
    category: 'tape',
    description:
      'An audio stream that drops out in soft-edged gaps of silence, then a lean pentode valve stage with a bite on every attack.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Dropouts' },
      { deviceId: 'analog-drive', preset: 'Bite', params: { output: -3.06 } },
    ],
  },
  {
    id: 'laptop-guitar-borrowed-air',
    name: 'Borrowed air',
    category: 'tape',
    description:
      'A fast backwards loop, then the discarded part of an audio stream, thin, in a short wash, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse' },
      { deviceId: 'low-bitrate', preset: 'Thin air' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'laptop-guitar-peeling-fizz',
    name: 'Peeling fizz',
    category: 'tape',
    description:
      'A bright, buzzing fuzz from a valve driven all the way, then an audio stream starved and scrambled until each note fizzes.',
    effects: [
      { deviceId: 'patina', preset: 'Valve fuzz' },
      { deviceId: 'low-bitrate', preset: 'Fizzing phases' },
    ],
  },
  {
    id: 'laptop-guitar-chirps-on-a-postcard',
    name: 'Chirps on a postcard',
    category: 'tape',
    description:
      'A short loop run backwards at double speed and an octave up, then worn nine-bit converters, grainy, hissing on the high notes.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse', params: { length: 0.571 } },
      { deviceId: 'vintage-digital', preset: 'Worn' },
    ],
  },
  {
    id: 'laptop-guitar-remembered-shortwave',
    name: 'Remembered shortwave',
    category: 'tape',
    description:
      'A shortwave station crowded by whistles, buzz and data tones, then radio static that sounds only with each note played.',
    effects: [
      { deviceId: 'radio', preset: 'Crowded band' },
      { deviceId: 'noise-floor', preset: 'Static notes' },
    ],
  },
  {
    id: 'laptop-guitar-overexposed-buzz',
    name: 'Overexposed buzz',
    category: 'tape',
    description:
      'A lift of presence and air, then an audio stream that keeps sticking in long, buzzing loops, then echoes souring apart.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'low-bitrate', preset: 'Stuck stream' },
      { deviceId: 'freq-shifter', preset: 'Parting echo' },
    ],
  },
  {
    id: 'laptop-guitar-bounced-clang',
    name: 'Bounced clang',
    category: 'tape',
    description:
      'A thin band of tone with the lows cut and the top rolled off, then raw converters at a very low rate, bright and clanging.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.42 } },
      { deviceId: 'vintage-digital', preset: 'Clang' },
    ],
  },
  {
    id: 'laptop-guitar-grit-on-shingle',
    name: 'Grit on shingle',
    category: 'tape',
    description:
      'A lean pentode valve stage with a bite on every attack, then a watery audio stream whose notes hang on as a grainy wash.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { output: -2.87 } },
      { deviceId: 'low-bitrate', preset: 'Frozen stream' },
    ],
  },
  {
    id: 'laptop-guitar-valves-in-the-glare',
    name: 'Valves in the glare',
    category: 'tape',
    description:
      'A lean pentode valve stage with a bite on every attack, then grains fed back a fourth down, sinking lower each pass.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { output: -3.67 } },
      { deviceId: 'grain-cloud', preset: 'Sinking spiral', params: { size: 477, density: 7.21 } },
    ],
  },
  {
    id: 'laptop-guitar-tramline-sampler',
    name: 'Tramline sampler',
    category: 'tape',
    description:
      'A coarse early sampler, gritty, with bright fizz on top, then a thin, torn fuzz from a valve pushed until it folds over.',
    effects: [
      { deviceId: 'patina', preset: 'Eight bit' },
      { deviceId: 'analog-drive', preset: 'Torn cone', params: { output: -6.08 } },
    ],
  },
  {
    id: 'laptop-guitar-deckchair-grit',
    name: 'Deckchair grit',
    category: 'tape',
    description:
      'Dark, thick valve grit that fills out the low end, then a starved audio stream, gritty and rough around each attack.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -19.4 } },
      { deviceId: 'low-bitrate', preset: 'Gritty attacks' },
    ],
  },
  {
    id: 'laptop-guitar-mixdown-buzz',
    name: 'Mixdown buzz',
    category: 'tape',
    description:
      'A bad, sticking connection, then tape hiss that rises with each note and dies with it, into a long seasick reverb.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Bad connection' },
      { deviceId: 'noise-floor', preset: 'Riding hiss' },
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 16.9, modRate: 1.46 } },
    ],
  },
  {
    id: 'laptop-guitar-grit-down-the-line',
    name: 'Grit down the line',
    category: 'tape',
    description:
      'A coarse early sampler, gritty, with bright fizz on top, then whole phrases coming back three times, each one duller.',
    effects: [
      { deviceId: 'patina', preset: 'Eight bit', params: { output: 2.46 } },
      { deviceId: 'cascade', preset: 'Phrase returns', params: { time: 1610 } },
    ],
  },
  {
    id: 'laptop-guitar-signal-in-the-buffer',
    name: 'Signal in the buffer',
    category: 'tape',
    description:
      'An audio stream that drops out in soft-edged gaps of silence, into two slack springs that splash and drip on every attack.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Dropouts' },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { decay: 2.19, mix: 0.24 } },
    ],
  },
  {
    id: 'laptop-guitar-breakwater-grain',
    name: 'Breakwater grain',
    category: 'tape',
    description:
      'Light tape-style saturation, then coarse five-bit converters, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: -7.39 } },
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'laptop-guitar-valves-in-the-patch',
    name: 'Valves in the patch',
    category: 'tape',
    description:
      'A combo amplifier driven hard and recorded right up close, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge' },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'laptop-guitar-salted-grain',
    name: 'Salted grain',
    category: 'tape',
    description:
      'A transformer driven so the low end thickens and loosens, then seven-bit converters whose quiet tails break up and cut off.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.25 } },
      { deviceId: 'vintage-digital', preset: 'Coarse' },
    ],
  },
  {
    id: 'laptop-guitar-sunstruck-radio',
    name: 'Sunstruck radio',
    category: 'tape',
    description:
      'A resonant upper-mid peak that rises when played hard, then a small, boxy radio speaker close by in a small room.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 0.958, envAttackMs: 20.7, envReleaseMs: 295 },
      },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { output: -3.05 } },
    ],
  },
  {
    id: 'laptop-guitar-dune-fuzz',
    name: 'Dune fuzz',
    category: 'tape',
    description:
      'A hard-clipped copy held at one level under the clean sound, then the soft air of an open microphone under the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'noise-floor', preset: 'Close mic' },
    ],
  },
  {
    id: 'laptop-guitar-patched-chorus',
    name: 'Patched chorus',
    category: 'motion',
    description:
      'A transformer that fills out the lows and dulls the top, then a chorus on the upper range that leaves the lows steady.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { output: -1.72 } },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.33, delayMs: 13 } },
    ],
  },
  {
    id: 'laptop-guitar-dune-filter',
    name: 'Dune filter',
    category: 'motion',
    description:
      'A combo amplifier driven hard and recorded right up close, then a touch wah, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge' },
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { lfoRateHz: 1.08, envAttackMs: 4.19, envReleaseMs: 122 },
      },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2.92, breathRate: 0.264 } },
    ],
  },
  {
    id: 'laptop-guitar-holiday-spiral',
    name: 'Holiday spiral',
    category: 'motion',
    description:
      'Bright tape-style saturation mixed in under the clean sound, then a ringing sweep that seems to climb without end.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine', params: { outputDb: -20.4 } },
      { deviceId: 'freq-shifter', preset: 'Barber pole', params: { delay: 11.8, lfoRate: 0.0867 } },
    ],
  },
  {
    id: 'laptop-guitar-desktop-filter',
    name: 'Desktop filter',
    category: 'motion',
    description:
      'A resonant low-pass that swings open about every two seconds, into a bright wide room that rings for a second or two.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.542, envAttackMs: 9.25, envReleaseMs: 185 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'laptop-guitar-windbreak-drift',
    name: 'Windbreak drift',
    category: 'motion',
    description:
      'Two copies a few cents sharp and flat, left and right, then the whole sound swaying sharp and flat every few seconds.',
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Doubler',
        params: { size: 63.4, delay: 15.4, mix: 0.3 },
      },
      { deviceId: 'freq-shifter', preset: 'Seasick', params: { delay: 20.2, lfoRate: 0.223 } },
    ],
  },
  {
    id: 'laptop-guitar-filter-on-a-balcony',
    name: 'Filter on a balcony',
    category: 'motion',
    description:
      'A squelching low-pass ramping open about four times a second, then a handful of separate echoes that fall away and repeat.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Squelch',
        params: { lfoRateHz: 4.19, envAttackMs: 9.74, envReleaseMs: 221 },
      },
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'laptop-guitar-peeling-cascade',
    name: 'Peeling cascade',
    category: 'texture',
    description:
      'A wavefolder at full drive, broken up like a torn speaker, then slow swelling octave loops, into a long bright tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Blown speaker' },
      { deviceId: 'cascade', preset: 'Slow tiles', params: { time: 1200 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'laptop-guitar-screen-lit-halo',
    name: 'Screen-lit halo',
    category: 'texture',
    description:
      'A bright wavefolder, then a short bright haze with an octave above everything, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead', params: { outputDb: -14.6 } },
      { deviceId: 'spectral-blur', preset: 'Glass halo' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 37.9, lowDecay: 2.64, midDecay: 2.96 },
      },
    ],
  },
  {
    id: 'laptop-guitar-lifeguard-clatter',
    name: 'Lifeguard clatter',
    category: 'texture',
    description:
      'An overloaded console, then a rattle of restruck notes, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { output: -7.79 } },
      { deviceId: 'cascade', preset: 'Dropped marbles' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 37.1 } },
    ],
  },
  {
    id: 'laptop-guitar-courtyard-octaves',
    name: 'Courtyard octaves',
    category: 'texture',
    description:
      'Stuttered fragments that flicker an octave up and down, then old converters left unsmoothed, with a glassy ring on top.',
    effects: [
      { deviceId: 'glitch', preset: 'Flickering octaves' },
      { deviceId: 'vintage-digital', preset: 'Glassy' },
    ],
  },
  {
    id: 'laptop-guitar-after-dark-undertow',
    name: 'After-dark undertow',
    category: 'texture',
    description:
      'A bright, lean console channel driven for an edge on top, then soft smeared repeats and reversals under the dry sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'glitch', preset: 'Smears underneath' },
    ],
  },
  {
    id: 'laptop-guitar-arpeggio-on-battery',
    name: 'Arpeggio on battery',
    category: 'texture',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, then a nasal horn loudspeaker heard from far across a big room.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 263 } },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 6.38 } },
    ],
  },
  {
    id: 'laptop-guitar-octaves-in-salt-air',
    name: 'Octaves in salt air',
    category: 'texture',
    description:
      'Stuttered fragments that flicker an octave up and down, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'glitch', preset: 'Flickering octaves', params: { time: 109 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 43.6 } },
    ],
  },
  {
    id: 'laptop-guitar-noon-stack',
    name: 'Noon stack',
    category: 'texture',
    description:
      'A fast reel with no hiss, driven hard so peaks are squashed, then loops of each note played backwards at stacked octaves.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'cascade', preset: 'Backwards stack' },
    ],
  },
  {
    id: 'laptop-guitar-jittery-rain',
    name: 'Jittery rain',
    category: 'texture',
    description:
      'A fast glittering stutter of plucked octaves over each note, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 152 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 22.2, lowDecay: 4.53, midDecay: 4.24 },
      },
    ],
  },
  {
    id: 'laptop-guitar-grains-on-battery',
    name: 'Grains on battery',
    category: 'texture',
    description:
      'A scattered cloud of short grains behind the playing, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 44.8, mix: 0.24 } },
    ],
  },
  {
    id: 'laptop-guitar-mixdown-whisper',
    name: 'Mixdown whisper',
    category: 'texture',
    description:
      'A clean combo amplifier with the treble all the way up, then a wide whisper of the sound with its attacks dissolved, into a bright plate.',
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright', params: { output: 2.38 } },
      { deviceId: 'spectral-blur', preset: 'Whisper' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.05 } },
    ],
  },
  {
    id: 'laptop-guitar-balcony-buzz',
    name: 'Balcony buzz',
    category: 'texture',
    description:
      'A bright, buzzing fuzz from a hard clipper driven flat, then a buzz of tiny grains, into a long bright tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Fuzz pedal', params: { outputDb: -21.1 } },
      { deviceId: 'grain-cloud', preset: 'Grain buzz' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'laptop-guitar-cloud-on-hot-tiles',
    name: 'Cloud on hot tiles',
    category: 'texture',
    description:
      'A warm amplifier stack, then a smear of long overlapping grains, half of them reversed, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: 0.549 } },
      { deviceId: 'grain-cloud', preset: 'Slow smear' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 41.1 } },
    ],
  },
  {
    id: 'laptop-guitar-disc-by-the-water',
    name: 'Disc by the water',
    category: 'texture',
    description:
      'The skips of a scratched disc, stuck on tiny fragments, then an audio stream starved down to a few warbling tones.',
    effects: [
      { deviceId: 'glitch', preset: 'Skipping disc', params: { time: 88 } },
      { deviceId: 'low-bitrate', preset: 'Few partials' },
    ],
  },
  {
    id: 'laptop-guitar-souvenir-trace',
    name: 'Souvenir trace',
    category: 'texture',
    description:
      'A few soft stutters and skips under the dry sound, then low-rate converters that fold the highs down as false tones.',
    effects: [
      { deviceId: 'glitch', preset: 'Barely broken' },
      { deviceId: 'vintage-digital', preset: 'Metallic' },
    ],
  },
  {
    id: 'laptop-guitar-stutter-in-heat-haze',
    name: 'Stutter in heat haze',
    category: 'texture',
    description:
      'Slices that repeat faster and faster like a dropped ball, then old converters left unsmoothed, with a glassy ring on top.',
    effects: [
      { deviceId: 'glitch', preset: 'Bouncing' },
      { deviceId: 'vintage-digital', preset: 'Glassy' },
    ],
  },
  {
    id: 'laptop-guitar-sun-faded-stutter',
    name: 'Sun-faded stutter',
    category: 'texture',
    description:
      'Slices that repeat faster and faster like a dropped ball, then a coarse early sampler, gritty, with bright fizz on top.',
    effects: [
      { deviceId: 'glitch', preset: 'Bouncing', params: { time: 352 } },
      { deviceId: 'patina', preset: 'Eight bit' },
    ],
  },
  {
    id: 'laptop-guitar-heatwave-octaves',
    name: 'Heatwave octaves',
    category: 'texture',
    description:
      'Short backwards chunks that climb by octaves and splinter, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Glass splinters' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 9.22 } },
    ],
  },
  {
    id: 'laptop-guitar-low-season-afterglow',
    name: 'Low-season afterglow',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, then a starved audio stream, watery and smeared, its top cut away.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Brief afterglow',
        params: { attack: 0.0317, glide: 0.0266, mix: 0.3 },
      },
      { deviceId: 'low-bitrate', preset: 'Underwater' },
    ],
  },
  {
    id: 'laptop-guitar-rendered-loop',
    name: 'Rendered loop',
    category: 'texture',
    description:
      'A sound that keeps getting stuck and repeating a slice, into three springs heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'glitch', preset: 'Stuck' },
      { deviceId: 'spring-reverb', preset: 'Tank alone', params: { decay: 3.01 } },
    ],
  },
  {
    id: 'laptop-guitar-mist-bleached-out',
    name: 'Mist bleached out',
    category: 'texture',
    description:
      'A diffuse mist where each note hangs on after it is played, then echoes that creep sharp on the left and flat on the right.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.3 } },
      {
        deviceId: 'freq-shifter',
        preset: 'Split sky',
        params: { delay: 175, lfoRate: 0.118, mix: 0.36 },
      },
    ],
  },
  {
    id: 'laptop-guitar-pier-end-haze',
    name: 'Pier-end haze',
    category: 'texture',
    description:
      'A smear of long overlapping grains, half of them reversed, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear' },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
    ],
  },
  {
    id: 'laptop-guitar-rooftop-grains',
    name: 'Rooftop grains',
    category: 'texture',
    description:
      'A half-deep swell, then grains thrown up to an octave out of tune either way, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 453, release: 162 } },
      { deviceId: 'grain-delay', preset: 'Scattered pitches', params: { time: 196, size: 76.9 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'laptop-guitar-sunburnt-buzz',
    name: 'Sunburnt buzz',
    category: 'texture',
    description:
      'Tiny slices repeated so fast that they buzz, then a bad connection that drops out and sticks in buzzing loops.',
    effects: [
      { deviceId: 'glitch', preset: 'Buzzing stutter', params: { time: 27.7 } },
      { deviceId: 'low-bitrate', preset: 'Bad connection' },
    ],
  },
  {
    id: 'laptop-guitar-memory-in-august',
    name: 'Memory in August',
    category: 'texture',
    description:
      'A dark amplifier stack with the bass full up and no treble, then long grains of what was played about four seconds ago.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { output: -1.95 } },
      { deviceId: 'grain-cloud', preset: 'Long memory', params: { size: 1030, density: 4.88 } },
    ],
  },
  {
    id: 'laptop-guitar-arcade-fog',
    name: 'Arcade fog',
    category: 'texture',
    description:
      'A late swell on every note like a rocked volume pedal, then a wide fog without lows or highs that hangs for seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 233, release: 161 } },
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
    ],
  },
  {
    id: 'laptop-guitar-borrowed-cloud',
    name: 'Borrowed cloud',
    category: 'texture',
    description:
      'A wide haze of grains that hangs on long after the playing, into a hard-driven two-spring tank that answers a moment late.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Frozen haze', params: { mix: 0.359 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Dub send',
        params: { decay: 2.78, predelay: 66.8, mix: 0.3 },
      },
    ],
  },
  {
    id: 'laptop-guitar-poolside-glitter',
    name: 'Poolside glitter',
    category: 'pitch',
    description:
      'Sparse short grains two octaves up, after each note, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'grain-delay', preset: 'High glitter' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 38.1, lowDecay: 2.07, midDecay: 2.77 },
      },
    ],
  },
  {
    id: 'laptop-guitar-blistered-spiral',
    name: 'Blistered spiral',
    category: 'pitch',
    description:
      'Grains fed back an octave up, climbing higher each pass, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 388, density: 9.17 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'laptop-guitar-pier-end-spiral',
    name: 'Pier-end spiral',
    category: 'pitch',
    description:
      'Grains fed back an octave up, climbing higher each pass, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 363, density: 9.24 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { midDecay: 7.61 } },
    ],
  },
  {
    id: 'laptop-guitar-bleached-octaves',
    name: 'Bleached octaves',
    category: 'pitch',
    description:
      'A dark fuzz from a valve pushed far past its limit, then stuttered fragments that flicker an octave up and down.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'glitch', preset: 'Flickering octaves', params: { time: 113 } },
    ],
  },
  {
    id: 'laptop-guitar-salted-treble',
    name: 'Salted treble',
    category: 'pitch',
    description:
      'The octave above alone, every note of a chord moved up, then grains thrown up to an octave out of tune either way.',
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone' },
      { deviceId: 'grain-delay', preset: 'Scattered pitches' },
    ],
  },
  {
    id: 'laptop-guitar-pixel-echo',
    name: 'Pixel echo',
    category: 'pitch',
    description:
      'Grain repeats that sink by fourths on every pass, then a plain echo that is a little darker on each repeat, into a big muffled cave.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 533, size: 185 } },
      { deviceId: 'echo-memory', preset: 'Plain echo' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.98, breathRate: 0.274 } },
    ],
  },
  {
    id: 'laptop-guitar-unsaved-shimmer',
    name: 'Unsaved shimmer',
    category: 'pitch',
    description:
      'A swell that takes about four seconds to open after silence, then grains fed back an octave up, climbing higher each pass.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 4100 } },
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 348, density: 10.2 } },
    ],
  },
  {
    id: 'laptop-guitar-shimmer-in-glitter',
    name: 'Shimmer in glitter',
    category: 'pitch',
    description:
      'Grains fed back an octave up, climbing higher each pass, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 345, density: 8.86 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 43.9, lowDecay: 4.09, midDecay: 3.2 },
      },
    ],
  },
  {
    id: 'laptop-guitar-souvenir-cloud',
    name: 'Souvenir cloud',
    category: 'pitch',
    description:
      'A wide cloud whose grains jump by fifths and octaves, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { size: 671, density: 12.8 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.33 } },
    ],
  },
  {
    id: 'laptop-guitar-octave-in-the-glare',
    name: 'Octave in the glare',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, then a soft wash of octave and fifth loops over each note.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 63.5 } },
      { deviceId: 'cascade', preset: 'Sparkle bed' },
    ],
  },
  {
    id: 'laptop-guitar-cloud-from-memory',
    name: 'Cloud from memory',
    category: 'pitch',
    description:
      'A wide cloud whose grains jump by fifths and octaves, then a hollow chorus that swells over about ten seconds.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { size: 590, density: 13.8 } },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.0943, delayMs: 9.65 } },
    ],
  },
  {
    id: 'laptop-guitar-pier-end-echoes',
    name: 'Pier-end echoes',
    category: 'pitch',
    description:
      'Echoes souring apart, then short backwards chunks that climb by octaves and splinter, into a long climbing reverb.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Parting echo' },
      { deviceId: 'reverse-delay', preset: 'Glass splinters', params: { time: 201 } },
      { deviceId: 'bloom-reverb', preset: 'Endless rise' },
    ],
  },
  {
    id: 'laptop-guitar-drone-on-hot-tiles',
    name: 'Drone on hot tiles',
    category: 'pitch',
    description:
      'A drone looped from each note with the fifth above it, then a faint backwards swell behind each phrase.',
    effects: [
      { deviceId: 'cascade', preset: 'Drone of fifths', params: { time: 365 } },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { time: 806 } },
    ],
  },
  {
    id: 'laptop-guitar-esplanade-finish',
    name: 'Esplanade finish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
  {
    id: 'laptop-guitar-soundcard-mixdown',
    name: 'Soundcard mixdown',
    category: 'master',
    description:
      'A gentle compressor, then a slightly wider image, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 92.2, release: 2.13 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: 3.82 } },
    ],
  },
  {
    id: 'laptop-guitar-boardwalk-master',
    name: 'Boardwalk master',
    category: 'master',
    description:
      'A fresh reel of tape, then a slow compressor that evens out swells over seconds, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 287, release: 1.89 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'laptop-guitar-blinding-polish',
    name: 'Blinding polish',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'laptop-guitar-desktop-mixdown',
    name: 'Desktop mixdown',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a parallel compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 366, release: 2.72 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { gain: -2.44 } },
    ],
  },
  {
    id: 'laptop-guitar-awning-finish',
    name: 'Awning finish',
    category: 'master',
    description:
      'A compressor that lets each attack through before it levels, then a slightly wider image, then a safety limiter.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 116, release: 1.58 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 2.2 } },
    ],
  },
]
