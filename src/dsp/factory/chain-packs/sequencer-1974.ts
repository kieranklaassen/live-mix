// Berlin Sequencer, 1974: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'sequencer-1974-dial-lit-nave',
    name: 'Dial-lit nave',
    category: 'space',
    description:
      'A phaser with no dry sound, pulling the two sides apart, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'sequencer-1974-improvised-hall',
    name: 'Improvised hall',
    category: 'space',
    description:
      'A wide hall that answers about a fifth of a second late, then a compressor that pulls the tail of every note back up.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Late hall' },
      {
        deviceId: 'ambient-comp',
        preset: 'Long sustain',
        params: { attack: 222, release: 0.724, makeup: 10.8 },
      },
    ],
  },
  {
    id: 'sequencer-1974-s-bahn-choir',
    name: 'S-bahn choir',
    category: 'space',
    description:
      'A low cut that thins the bass, with a little air on top, into a soft sung oo that follows a moment behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 4.12, preDelay: 71.2 } },
    ],
  },
  {
    id: 'sequencer-1974-island-city-halo',
    name: 'Island-city halo',
    category: 'space',
    description:
      'A long dark reverb whose tail sinks slowly in pitch, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'sequencer-1974-divided-city-wash',
    name: 'Divided-city wash',
    category: 'space',
    description:
      'A wash of three fed-back tape heads that hovers and fades, then a phaser with no dry sound, pulling the two sides apart.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 973 } },
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.229 } },
    ],
  },
  {
    id: 'sequencer-1974-midnight-wash',
    name: 'Midnight wash',
    category: 'space',
    description:
      'A two-spring tank with a little chirp and drip, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.32 } },
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 851 } },
    ],
  },
  {
    id: 'sequencer-1974-waves-on-step-eight',
    name: 'Waves on step eight',
    category: 'space',
    description:
      'A transformer that fills out the lows and dulls the top, into a long reverb that comes and goes in waves, over and over.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'shaped-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'sequencer-1974-hall-after-hours',
    name: 'Hall after hours',
    category: 'space',
    description:
      'A huge dark open space that answers late and rings on, then a valve stage that gives way under loud notes, tails rising.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
      { deviceId: 'patina', preset: 'Valve bloom' },
    ],
  },
  {
    id: 'sequencer-1974-dry-ice-cathedral',
    name: 'Dry-ice cathedral',
    category: 'space',
    description:
      'Soft saturation that adds the octave above each note, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'sequencer-1974-tower-block-springs',
    name: 'Tower-block springs',
    category: 'space',
    description:
      'A wavering double of the sound spread wide to both sides, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler', params: { time: 38.8, modRate: 1.98 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.27 } },
    ],
  },
  {
    id: 'sequencer-1974-lamp-lit-springs',
    name: 'Lamp-lit springs',
    category: 'space',
    description:
      'A hard-driven two-spring tank that answers a moment late, then a fast limiter pushed so that soft and loud notes even out.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dub send' },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -9.61 } },
    ],
  },
  {
    id: 'sequencer-1974-chancel-choir',
    name: 'Chancel choir',
    category: 'space',
    description:
      'A single saturated tape echo close behind each note, into a hall of deep voices that sing ee late behind each note.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 100 } },
      { deviceId: 'vowel-reverb', preset: 'Late basses' },
    ],
  },
  {
    id: 'sequencer-1974-hall-in-november',
    name: 'Hall in November',
    category: 'space',
    description:
      'A single dull spring kept low in the centre of the sound, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.62 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 11, modRate: 0.366 } },
    ],
  },
  {
    id: 'sequencer-1974-november-plate',
    name: 'November plate',
    category: 'space',
    description:
      'A muffling high cut, then a single saturated tape echo close behind each note, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.46 } },
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'sequencer-1974-valve-warm-murmur',
    name: 'Valve-warm murmur',
    category: 'space',
    description:
      'A single dull spring kept low in the centre of the sound, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.7 } },
      { deviceId: 'vowel-reverb', preset: 'Humming' },
    ],
  },
  {
    id: 'sequencer-1974-all-night-plate',
    name: 'All-night plate',
    category: 'space',
    description:
      'A long plate with a wide and even tail, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 40.6 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.07 } },
    ],
  },
  {
    id: 'sequencer-1974-shade-all-night',
    name: 'Shade all night',
    category: 'space',
    description:
      'A trace of dull detuned copies at the edges, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width', params: { delay: 12.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14 } },
    ],
  },
  {
    id: 'sequencer-1974-echo-near-dawn',
    name: 'Echo near dawn',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 702 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.35 } },
    ],
  },
  {
    id: 'sequencer-1974-scope-lit-echo',
    name: 'Scope-lit echo',
    category: 'echo',
    description:
      'A tape echo whose three heads make a cluster of each repeat, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 596 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'sequencer-1974-last-tram-echo',
    name: 'Last-tram echo',
    category: 'echo',
    description:
      'A short, soft tape echo close behind the playing, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.519 } },
    ],
  },
  {
    id: 'sequencer-1974-eight-step-echo',
    name: 'Eight-step echo',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 336 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'sequencer-1974-tower-block-echo',
    name: 'Tower-block echo',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'sequencer-1974-back-room-loop',
    name: 'Back-room loop',
    category: 'echo',
    description:
      'A tape loop that wears thinner and duller on every pass, into a far-off room laid in under the untouched sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 're-amp', preset: 'Room underneath', params: { output: 6.63 } },
    ],
  },
  {
    id: 'sequencer-1974-echo-by-the-wall',
    name: 'Echo by the wall',
    category: 'echo',
    description:
      'An echo whose repeats jump up an octave and back, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 387, modRate: 0.594 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 141 } },
    ],
  },
  {
    id: 'sequencer-1974-sixteen-step-flutter',
    name: 'Sixteen-step flutter',
    category: 'echo',
    description:
      'An echo with a fast flutter in the pitch of its repeats, into a tight, damped little room close around the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fluttering' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'sequencer-1974-tenement-reel',
    name: 'Tenement reel',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.9 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
    ],
  },
  {
    id: 'sequencer-1974-late-session-trail',
    name: 'Late-session trail',
    category: 'echo',
    description:
      'A pan that wanders to a new place every second or so, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { rate: 0.653 } },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1290 } },
    ],
  },
  {
    id: 'sequencer-1974-island-city-echo',
    name: 'Island-city echo',
    category: 'echo',
    description:
      'An echo that slides down an octave like tape slowed by hand, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 493, modRate: 0.275 } },
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { decay: 9.64, preDelay: 21.9 } },
    ],
  },
  {
    id: 'sequencer-1974-hand-patched-echo',
    name: 'Hand-patched echo',
    category: 'echo',
    description:
      'Grain repeats that sink by fourths on every pass, into a quick bright twang of springs behind each attack.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 573, size: 182 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang' },
    ],
  },
  {
    id: 'sequencer-1974-empty-street-trace',
    name: 'Empty-street trace',
    category: 'echo',
    description:
      'Soft tape-style saturation, then a faint trace of tape echo behind the playing, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 463 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'sequencer-1974-night-run-echo',
    name: 'Night-run echo',
    category: 'echo',
    description:
      'A fast, steady reel with soft saturation, then a short soft tape echo, into three taut springs kept soft and close to the centre.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      {
        deviceId: 'spring-reverb',
        preset: 'Narrow warm tank',
        params: { decay: 1.78, predelay: 16 },
      },
    ],
  },
  {
    id: 'sequencer-1974-third-reel-echo',
    name: 'Third-reel echo',
    category: 'echo',
    description:
      'A tape preamp driven for thick lows and a dull top, then a faint tape echo, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 492 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'sequencer-1974-midnight-echo',
    name: 'Midnight echo',
    category: 'echo',
    description:
      'A reel driven hot, then dotted tape repeats that pile up in a darkening wash, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 5.62 } },
    ],
  },
  {
    id: 'sequencer-1974-november-fifths',
    name: 'November fifths',
    category: 'echo',
    description:
      'A combo amplifier heard from the far side of a big room, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 310, modRate: 0.65 } },
    ],
  },
  {
    id: 'sequencer-1974-echo-in-the-yard',
    name: 'Echo in the yard',
    category: 'echo',
    description:
      'Dark, thick valve grit that fills out the low end, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -19 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
    ],
  },
  {
    id: 'sequencer-1974-courtyard-echo',
    name: 'Courtyard echo',
    category: 'echo',
    description:
      'A dull, wobbling, saturated echo on worn tape, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 586 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'sequencer-1974-echo-on-step-eight',
    name: 'Echo on step eight',
    category: 'echo',
    description:
      'A clean slow rotating speaker blended under the dry sound, then two tape heads that make every repeat gallop.',
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
    ],
  },
  {
    id: 'sequencer-1974-canal-side-loop',
    name: 'Canal-side loop',
    category: 'echo',
    description:
      'A tape loop about a second round that soon dies away, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'One second round' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { decay: 2.68, breathRate: 0.323 } },
    ],
  },
  {
    id: 'sequencer-1974-wet-street-repeats',
    name: 'Wet-street repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'sequencer-1974-shuttered-trail',
    name: 'Shuttered trail',
    category: 'echo',
    description:
      'A slow tape echo with a long trail that dulls as it goes, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1360 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 96.1 } },
    ],
  },
  {
    id: 'sequencer-1974-second-row-reel',
    name: 'Second-row reel',
    category: 'tape',
    description:
      'A tape reel with soft saturation, slight wobble and hiss, then a four-stage phaser, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.263 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 55.8 } },
    ],
  },
  {
    id: 'sequencer-1974-rehearsal-reel',
    name: 'Rehearsal reel',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, then a hollow peaking phaser, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { output: -2.02 } },
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.237 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'sequencer-1974-free-running-flutter',
    name: 'Free-running flutter',
    category: 'tape',
    description:
      'A trembling reel, then a gentle flanger sweeping about every four seconds, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'flanger', preset: 'Gentle sweep' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sequencer-1974-patch-cord-tape',
    name: 'Patch-cord tape',
    category: 'tape',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, then a climbing flanger, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'flanger', preset: 'Rising comb', params: { rate: 0.184, delayMs: 3.91 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 47, lowDecay: 3.54, midDecay: 3.16 },
      },
    ],
  },
  {
    id: 'sequencer-1974-reel-by-lamplight',
    name: 'Reel by lamplight',
    category: 'tape',
    description:
      'A fast, steady reel with soft saturation, then a gentle flanger sweeping about every four seconds, into a hall with long lows.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.253, delayMs: 2.64 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'sequencer-1974-chorus-till-morning',
    name: 'Chorus till morning',
    category: 'tape',
    description:
      'A dense many-notched phaser drifting opposite on each side, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.117 } },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { output: -0.308 } },
    ],
  },
  {
    id: 'sequencer-1974-night-run-hiss',
    name: 'Night-run hiss',
    category: 'tape',
    description:
      'A clean bright reel under a thick layer of tape hiss, then a nasal horn loudspeaker heard from far across a big room.',
    effects: [
      { deviceId: 'tape', preset: 'Hiss and air' },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 4.3 } },
    ],
  },
  {
    id: 'sequencer-1974-candlelit-tape',
    name: 'Candlelit tape',
    category: 'tape',
    description:
      'A reel driven as hard as it goes, thick with harmonics, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'sequencer-1974-tenement-rotary',
    name: 'Tenement rotary',
    category: 'tape',
    description:
      'A stopped speaker cabinet with its amplifier growling, then tape hiss that rises with each note and dies with it.',
    effects: [
      { deviceId: 'rotary', preset: 'Parked growl' },
      { deviceId: 'noise-floor', preset: 'Riding hiss', params: { response: 0.144, hold: 1.76 } },
    ],
  },
  {
    id: 'sequencer-1974-canal-side-chorus',
    name: 'Canal-side chorus',
    category: 'tape',
    description:
      'A wide chorus drifting over a cycle of about twelve seconds, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'sequencer-1974-flight-case-reel',
    name: 'Flight-case reel',
    category: 'tape',
    description:
      'A reel driven as hard as it goes, thick with harmonics, then tape hiss that sinks under each note and swells in the gaps.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'noise-floor', preset: 'Breathing tape', params: { response: 0.92, hold: 16.7 } },
    ],
  },
  {
    id: 'sequencer-1974-coal-cellar-reel',
    name: 'Coal-cellar reel',
    category: 'tape',
    description:
      'A gentle high cut that shades the top end, then a tape reel pushed hard, saturated and thick, then a three-head tape echo.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 568 } },
    ],
  },
  {
    id: 'sequencer-1974-snowbound-phaser',
    name: 'Snowbound phaser',
    category: 'motion',
    description:
      'A phaser taking about a quarter of a minute to come round, into three springs heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'spring-reverb', preset: 'Tank alone' },
    ],
  },
  {
    id: 'sequencer-1974-control-room-flanger',
    name: 'Control-room flanger',
    category: 'motion',
    description:
      'A flanger that takes about twelve seconds over each sweep, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0713, delayMs: 4.31 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sequencer-1974-slow-turning-phaser',
    name: 'Slow-turning phaser',
    category: 'motion',
    description:
      'A four-stage phaser kept high, leaving the low end alone, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.357 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'sequencer-1974-patchbay-swirl',
    name: 'Patchbay swirl',
    category: 'motion',
    description:
      'A four-stage phaser with two broad notches, turning slowly, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 60.4 } },
    ],
  },
  {
    id: 'sequencer-1974-filter-on-row-two',
    name: 'Filter on row two',
    category: 'motion',
    description:
      'A resonant high-pass falling for about two seconds at a time, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { lfoRateHz: 0.489, envAttackMs: 9.68, envReleaseMs: 185 },
      },
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 799 } },
    ],
  },
  {
    id: 'sequencer-1974-overnight-sweep',
    name: 'Overnight sweep',
    category: 'motion',
    description:
      'A resonant low-pass that swings open about every two seconds, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.449, envAttackMs: 10.4, envReleaseMs: 202 },
      },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
    ],
  },
  {
    id: 'sequencer-1974-sweep-over-the-city',
    name: 'Sweep over the city',
    category: 'motion',
    description:
      'A resonant low-pass that swings open about every two seconds, then an echo whose repeats jump up an octave and back.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.523, envAttackMs: 10.6, envReleaseMs: 184 },
      },
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'sequencer-1974-rotary-past-midnight',
    name: 'Rotary past midnight',
    category: 'motion',
    description:
      'A fast rotating speaker heard close, pulsing hard, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'rotary', preset: 'Close pulse' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 94.9 } },
    ],
  },
  {
    id: 'sequencer-1974-transept-swirl',
    name: 'Transept swirl',
    category: 'motion',
    description:
      'A slow rotating speaker with its amplifier driven hard, then a four-stage phaser kept high, leaving the low end alone.',
    effects: [
      { deviceId: 'rotary', preset: 'Slow burn' },
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.342, mix: 0.27 } },
    ],
  },
  {
    id: 'sequencer-1974-wall-side-warble',
    name: 'Wall-side warble',
    category: 'motion',
    description:
      'A fast vibrato that warbles the whole sound in pitch, then an echo whose repeats come in quick, separate pulses.',
    effects: [
      { deviceId: 'chorus', preset: 'Vibrato' },
      {
        deviceId: 'grain-delay',
        preset: 'Pulsing repeat',
        params: { time: 225, size: 109, mix: 0.24 },
      },
    ],
  },
  {
    id: 'sequencer-1974-rotary-by-patch-cord',
    name: 'Rotary by patch cord',
    category: 'motion',
    description:
      'A fast rotating speaker with its bright horn to the fore, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'rotary', preset: 'Bright horn' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 616 } },
    ],
  },
  {
    id: 'sequencer-1974-half-lit-swirl',
    name: 'Half-lit swirl',
    category: 'motion',
    description:
      'A six-stage phaser turning about every three seconds, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 58.1 } },
    ],
  },
  {
    id: 'sequencer-1974-sodium-lit-filter',
    name: 'Sodium-lit filter',
    category: 'motion',
    description:
      'A resonant upper-mid peak that rises when played hard, then a tape echo whose three heads make a cluster of each repeat.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 0.99, envAttackMs: 20.8, envReleaseMs: 289 },
      },
      { deviceId: 'tape-echo', preset: 'Three heads' },
    ],
  },
  {
    id: 'sequencer-1974-cloister-pulse',
    name: 'Cloister pulse',
    category: 'motion',
    description:
      'A half-speed octave below, cut hard about twice a second, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops', params: { length: 559 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 17.6 } },
    ],
  },
  {
    id: 'sequencer-1974-rotary-after-hours',
    name: 'Rotary after hours',
    category: 'motion',
    description:
      'An equaliser that takes presence, air and lows away, then a fast rotating speaker with its amplifier growling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'rotary', preset: 'Growl' },
    ],
  },
  {
    id: 'sequencer-1974-rooftop-phaser',
    name: 'Rooftop phaser',
    category: 'motion',
    description:
      'A four-stage phaser kept high, leaving the low end alone, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.373 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'sequencer-1974-last-tram-ripple',
    name: 'Last-tram ripple',
    category: 'motion',
    description:
      'A sharp copy hard left, a flat one hard right, heard alone, then a harmonic tremolo whose lows and highs trade places quickly.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 14.8 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3.62 } },
    ],
  },
  {
    id: 'sequencer-1974-filter-turning-slow',
    name: 'Filter turning slow',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a hall whose tail sings a high ee.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0271, envAttackMs: 10.3, envReleaseMs: 214 },
      },
      { deviceId: 'vowel-reverb', preset: 'High ee', params: { decay: 4.91, preDelay: 19.9 } },
    ],
  },
  {
    id: 'sequencer-1974-swirl-by-lamplight',
    name: 'Swirl by lamplight',
    category: 'motion',
    description:
      'An amplifier stack turned all the way up, then a six-stage phaser turning about every three seconds.',
    effects: [
      { deviceId: 're-amp', preset: 'Stack flat out', params: { output: -1.83 } },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.315 } },
    ],
  },
  {
    id: 'sequencer-1974-cloud-in-the-snow',
    name: 'Cloud in the snow',
    category: 'motion',
    description:
      'A dense many-notched phaser drifting opposite on each side, then a slow rotating speaker with its amplifier driven hard.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.116 } },
      { deviceId: 'rotary', preset: 'Slow burn' },
    ],
  },
  {
    id: 'sequencer-1974-phaser-in-dry-ice',
    name: 'Phaser in dry ice',
    category: 'motion',
    description:
      'A shallow phaser pulsing about four times a second, then a faint, dull echo with a slow chorus on it.',
    effects: [
      { deviceId: 'phaser', preset: 'Fast throb', params: { rate: 4.04 } },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 237, modRate: 0.422 } },
    ],
  },
  {
    id: 'sequencer-1974-planetarium-flanger',
    name: 'Planetarium flanger',
    category: 'motion',
    description:
      'A triode valve stage, smoothly overdriven, then a deep flanger that sweeps right up through the top, into a driven spring tank.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { output: -3.08 } },
      { deviceId: 'flanger', preset: 'Through-zero feel', params: { rate: 0.271, delayMs: 0.763 } },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { decay: 3.3, predelay: 55.8 } },
    ],
  },
  {
    id: 'sequencer-1974-control-room-cloud',
    name: 'Control-room cloud',
    category: 'motion',
    description:
      'A driven valve amplifier, then a wide cloud of piled-up chords whose overtones all drift, into a late-arriving hall.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves', params: { output: 0.456 } },
      { deviceId: 'sustainer', preset: 'Shimmer cloud', params: { attack: 0.961, glide: 0.877 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival' },
    ],
  },
  {
    id: 'sequencer-1974-small-hours-strings',
    name: 'Small-hours strings',
    category: 'texture',
    description:
      'A soft following string pad, then a ringing sweep that seems to climb without end, into a vast, slowly opening hall.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'freq-shifter', preset: 'Barber pole' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'sequencer-1974-midnight-strings',
    name: 'Midnight strings',
    category: 'texture',
    description:
      'A wide string pad that picks up even the softest notes, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Catch all',
        params: { rise: 0.178, fall: 8.97, mix: 0.3 },
      },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.59 } },
    ],
  },
  {
    id: 'sequencer-1974-swell-before-dawn',
    name: 'Swell before dawn',
    category: 'texture',
    description:
      'A slow swell after each silence that opens only at the end, into a bright chamber that rings for a couple of seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1520, release: 706 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'sequencer-1974-pad-heard-far-off',
    name: 'Pad heard far off',
    category: 'texture',
    description:
      'A string pad that stands alone in place of what is played, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Pad alone', params: { rise: 0.36, fall: 5.11 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'sequencer-1974-winter-night-strings',
    name: 'Winter-night strings',
    category: 'texture',
    description:
      'A dark string pad that lingers long after each chord, into a dark reverb that rises behind each note, then lingers.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering', params: { rise: 1.1, fall: 20 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 2.01, preDelay: 64.1 } },
    ],
  },
  {
    id: 'sequencer-1974-pad-turning-slow',
    name: 'Pad turning slow',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, then a slow phasing drift that turns over every few seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed' },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { delay: 40, lfoRate: 0.0784 } },
    ],
  },
  {
    id: 'sequencer-1974-walnut-strings',
    name: 'Walnut strings',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'sequencer-1974-pad-left-running',
    name: 'Pad left running',
    category: 'texture',
    description:
      'A short swell that rounds the front off every note, then a dark, round pad that melts slowly from chord to chord.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 152, release: 74.5 } },
      { deviceId: 'sustainer', preset: 'Dark bed', params: { glide: 2.74 } },
    ],
  },
  {
    id: 'sequencer-1974-rehearsal-bloom',
    name: 'Rehearsal bloom',
    category: 'pitch',
    description:
      'Four octaves that bloom about two seconds after each note, then a deep flanger that takes most of a minute to sweep.',
    effects: [
      { deviceId: 'octaves', preset: 'Late bloom', params: { attack: 1.93 } },
      { deviceId: 'flanger', preset: 'Glacial drift' },
    ],
  },
  {
    id: 'sequencer-1974-all-night-depths',
    name: 'All-night depths',
    category: 'pitch',
    description:
      'A soft, deep bass one and two octaves below each note, then a phaser that climbs for about two seconds and snaps back.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'phaser', preset: 'Saw riser', params: { rate: 0.528 } },
    ],
  },
  {
    id: 'sequencer-1974-sixteen-step-octave',
    name: 'Sixteen-step octave',
    category: 'pitch',
    description:
      'An unbroken half-speed bed an octave down, with no dry sound, then a tape echo whose three heads make a cluster of each repeat.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 480 } },
    ],
  },
  {
    id: 'sequencer-1974-empty-street-octave',
    name: 'Empty-street octave',
    category: 'pitch',
    description:
      'A half-deep swell that leaves a ghost of each attack, then a rounded octave below every note of a chord.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 465, release: 148 } },
      { deviceId: 'octaves', preset: 'Sub octave' },
    ],
  },
  {
    id: 'sequencer-1974-eight-step-bass',
    name: 'Eight-step bass',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, then a long slow flanger, nearly a chorus, opposite on each side.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'flanger', preset: 'Wide wash' },
    ],
  },
  {
    id: 'sequencer-1974-late-session-swell',
    name: 'Late-session swell',
    category: 'pitch',
    description:
      'A deep bass two octaves down that swells in slowly, then a trace of short flanger, opposite on the two sides.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.2 } },
      { deviceId: 'flanger', preset: 'Faint air', params: { rate: 0.165, delayMs: 1.09 } },
    ],
  },
  {
    id: 'sequencer-1974-lamp-lit-harmony',
    name: 'Lamp-lit harmony',
    category: 'pitch',
    description:
      'A slow swell after each silence that leaves some attack in, then a slowed copy a fifth below, running on beside the dry sound.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { release: 279 } },
      { deviceId: 'half-speed', preset: 'Fifth down bed', params: { length: 1560 } },
    ],
  },
  {
    id: 'sequencer-1974-blur-in-the-rack',
    name: 'Blur in the rack',
    category: 'pitch',
    description:
      'A blurred half-speed wash an octave down, dull on top, into eight strings in C major that ring on as under a held pedal.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 407 } },
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 3.37 } },
    ],
  },
  {
    id: 'sequencer-1974-underfloor-fourth',
    name: 'Underfloor fourth',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below', params: { length: 190 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 178 } },
    ],
  },
  {
    id: 'sequencer-1974-octave-over-the-city',
    name: 'Octave over the city',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 41.3, modRate: 0.0991 } },
    ],
  },
  {
    id: 'sequencer-1974-hand-patched-finish',
    name: 'Hand-patched finish',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 425, release: 2.81 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.84 } },
    ],
  },
  {
    id: 'sequencer-1974-valve-warm-polish',
    name: 'Valve-warm polish',
    category: 'master',
    description:
      'Light tape-style saturation, then a small dip in the low mids, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.56 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.56 } },
    ],
  },
  {
    id: 'sequencer-1974-finish-on-row-two',
    name: 'Finish on row two',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a gentle compressor, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 105, release: 2.16 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'sequencer-1974-black-knob-master',
    name: 'Black-knob master',
    category: 'master',
    description:
      'A very gentle compressor that leans on the loudest swells, then a slightly wider image, then a safety limiter.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue', params: { attack: 596, release: 3.69 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'sequencer-1974-winter-night-polish',
    name: 'Winter-night polish',
    category: 'master',
    description:
      'A subsonic cut, then a slow compressor that evens out swells over seconds, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 337, release: 2.18 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'sequencer-1974-sodium-lit-master',
    name: 'Sodium-lit master',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a gentle compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.03 } },
    ],
  },
  {
    id: 'sequencer-1974-mixdown-all-night',
    name: 'Mixdown all night',
    category: 'master',
    description:
      'A gentle compressor, then a slightly wider image, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 108, release: 2.04 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { gain: 3.76 } },
    ],
  },
]
