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
    id: 'sequencer-1974-chapel-after-hours',
    name: 'Chapel after hours',
    category: 'space',
    description:
      'A single saturated tape slap behind each note, into a small chapel with a short sung eh in its tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'vowel-reverb', preset: 'Chapel' },
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
    id: 'sequencer-1974-control-room-tail',
    name: 'Control-room tail',
    category: 'space',
    description:
      'A warm, full equaliser, then a small plate that is gone in a second or two, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.58 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
      {
        deviceId: 'hall-reverb',
        preset: 'Airy tail',
        params: { preDelay: 29.6, lowDecay: 1.12, midDecay: 4.66 },
      },
    ],
  },
  {
    id: 'sequencer-1974-hum-on-the-clock',
    name: 'Hum on the clock',
    category: 'space',
    description:
      'A huge hall whose tail hums a soft oo for a long while, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.76 } },
    ],
  },
  {
    id: 'sequencer-1974-four-a-m-cathedral',
    name: 'Four-a-m cathedral',
    category: 'space',
    description:
      'A short pipe that rings like metal on every attack, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Metal pipe', params: { length: 0.0538, glide: 0.654 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28, modRate: 0.104 } },
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
      'A transformer that fills out the lows and dulls the top, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'shaped-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'sequencer-1974-clock-driven-plate',
    name: 'Clock-driven plate',
    category: 'space',
    description:
      'A dark plate whose tail is soft on top, then a resonant upper-mid peak that rises when played hard.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 0.893, envAttackMs: 21.8, envReleaseMs: 302 },
      },
    ],
  },
  {
    id: 'sequencer-1974-drip-by-patch-cord',
    name: 'Drip by patch cord',
    category: 'space',
    description:
      'A transformer overloaded into a thick, loose fuzz, into two slack springs that splash and drip on every attack.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt', params: { output: -14.4 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip' },
    ],
  },
  {
    id: 'sequencer-1974-shuttered-monks',
    name: 'Shuttered monks',
    category: 'space',
    description:
      'A half-hidden slow swell, then a large hall whose tail hums a deep oh in bass voices, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1290, release: 335 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 11.2, preDelay: 20.5 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 38.4, lowDecay: 2.49, midDecay: 3.12 },
      },
    ],
  },
  {
    id: 'sequencer-1974-third-reel-strings',
    name: 'Third-reel strings',
    category: 'space',
    description:
      'A thin band of tone with the lows cut and the top rolled off, into four strings that retune to what is played and ring briefly.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'sympathetic', preset: 'Echo the tune', params: { decay: 1.54 } },
    ],
  },
  {
    id: 'sequencer-1974-plate-all-night',
    name: 'Plate all night',
    category: 'space',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
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
      'Three tape heads in a row, a cluster on every repeat, into three long springs with all the top taken off.',
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
      'A short, soft tape echo close behind the playing, into a far-off plate with a long soft tail and little dry sound.',
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
    id: 'sequencer-1974-lamp-lit-slap',
    name: 'Lamp-lit slap',
    category: 'echo',
    description:
      'Dark, thick valve grit, then a single saturated tape slap behind each note, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -18.5 } },
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 5.96 } },
    ],
  },
  {
    id: 'sequencer-1974-sodium-lit-clock',
    name: 'Sodium-lit clock',
    category: 'echo',
    description:
      'The first hint of weight from a tape preamp, then a slow, dull echo from a worn-out bucket-brigade line, into a medium plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'analog-delay', preset: 'Noisy clock' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'sequencer-1974-walnut-slap',
    name: 'Walnut slap',
    category: 'echo',
    description:
      'Soft tape-style saturation, then a single saturated tape slap behind each note, into an overdriven spring tank.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -11 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 81 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank' },
    ],
  },
  {
    id: 'sequencer-1974-wash-under-sodium',
    name: 'Wash under sodium',
    category: 'echo',
    description:
      'A fast, steady reel pushed into soft saturation, then dotted tape repeats that pile up in a darkening wash, into one dull, late spring.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 673 } },
      { deviceId: 'spring-reverb', preset: 'Dark late coil' },
    ],
  },
  {
    id: 'sequencer-1974-cloister-hop',
    name: 'Cloister hop',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a medium hall with only a breath of a vowel in its tail.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop' },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.6, preDelay: 17.6 } },
    ],
  },
  {
    id: 'sequencer-1974-back-room-loop',
    name: 'Back-room loop',
    category: 'echo',
    description:
      'A tape loop that wears thinner and duller on every pass, into a far-miked room laid in under the clean sound.',
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
      'An echo with a fast flutter in the pitch of its repeats, into a tight damped little room that is barely there.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fluttering' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'sequencer-1974-gallop-all-night',
    name: 'Gallop all night',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a very long reverb whose tail keeps climbing by octaves.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 641 } },
      { deviceId: 'bloom-reverb', preset: 'Endless rise' },
    ],
  },
  {
    id: 'sequencer-1974-dry-ice-echo',
    name: 'Dry-ice echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'phaser', preset: 'Still formant' },
    ],
  },
  {
    id: 'sequencer-1974-winter-night-hop',
    name: 'Winter-night hop',
    category: 'echo',
    description:
      'A shallow flanger that ramps and snaps back in a steady beat, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      { deviceId: 'flanger', preset: 'Tremolo saw' },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 323, modRate: 0.674 } },
    ],
  },
  {
    id: 'sequencer-1974-gallop-before-dawn',
    name: 'Gallop before dawn',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 302, modRate: 0.861 } },
    ],
  },
  {
    id: 'sequencer-1974-valve-warm-slap',
    name: 'Valve-warm slap',
    category: 'echo',
    description:
      'A short, soft tape echo close behind the playing, then two dark late copies, a shadow either side of the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 168 } },
      { deviceId: 'stereo-detune', preset: 'Shadow' },
    ],
  },
  {
    id: 'sequencer-1974-bounce-all-night',
    name: 'Bounce all night',
    category: 'echo',
    description:
      'A low-pass that opens and closes over about half a minute, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 538 } },
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
    id: 'sequencer-1974-tape-by-the-wall',
    name: 'Tape by the wall',
    category: 'tape',
    description:
      'A clean pass over fast new tape, with nothing added, then a trace of slow four-stage phaser under the dry sound, into a hall on its own.',
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'sequencer-1974-rehearsal-reel',
    name: 'Rehearsal reel',
    category: 'tape',
    description:
      'A slow reel that sways, then a hollow phaser with peaks where its notches would be, into three long springs with all the top taken off.',
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
      'A trembling reel, then a gentle flanger sweep about four seconds round, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'flanger', preset: 'Gentle sweep' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'sequencer-1974-reel-over-the-city',
    name: 'Reel over the city',
    category: 'tape',
    description:
      'A reel of tape, then a trace of short flanger, opposite on the two sides, into one taut dull spring that answers late and rings long.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 2.15 } },
      { deviceId: 'flanger', preset: 'Faint air', params: { rate: 0.146, delayMs: 0.914 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark late coil',
        params: { decay: 5.19, predelay: 74.7 },
      },
    ],
  },
  {
    id: 'sequencer-1974-november-sway',
    name: 'November sway',
    category: 'tape',
    description:
      'A resonant upper-mid peak that rises when played hard, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 0.904, envAttackMs: 19.4, envReleaseMs: 307 },
      },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'sequencer-1974-tape-in-dry-ice',
    name: 'Tape in dry ice',
    category: 'tape',
    description:
      'An overloaded tape preamp, then the surface noise and crackle of an old record, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -16 } },
      { deviceId: 'noise-floor', preset: 'Old record', params: { response: 0.429, hold: 7.49 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'sequencer-1974-tape-on-the-hour',
    name: 'Tape on the hour',
    category: 'tape',
    description:
      'A fast rotating speaker with its amplifier growling, then a clean pass over tape, into a reverb that falls away in a straight line.',
    effects: [
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 'tape', preset: 'Clean transfer', params: { output: -2.37 } },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.75, preDelay: 20.5 } },
    ],
  },
  {
    id: 'sequencer-1974-first-light-reel',
    name: 'First-light reel',
    category: 'tape',
    description:
      'A drifting reel laid half against the dry sound, a chorus, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 689 } },
    ],
  },
  {
    id: 'sequencer-1974-wet-street-stack',
    name: 'Wet-street stack',
    category: 'tape',
    description:
      'A closed amplifier stack, driven and dark, miked off-centre, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: -3.83 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.02 } },
    ],
  },
  {
    id: 'sequencer-1974-four-a-m-wobble',
    name: 'Four-a-m wobble',
    category: 'tape',
    description:
      'A deep pitch wobble in the centre, like a warped tape, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Warped tape' },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 38.3, modRate: 0.105 } },
    ],
  },
  {
    id: 'sequencer-1974-chancel-pillow',
    name: 'Chancel pillow',
    category: 'tape',
    description:
      'A big lift of presence and air, with ringing held in check, then a small speaker, close and muffled, as if under a pillow.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.642 } },
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { output: -2.04 } },
    ],
  },
  {
    id: 'sequencer-1974-snowbound-phaser',
    name: 'Snowbound phaser',
    category: 'motion',
    description:
      'A phaser swirl about a quarter of a minute round, into three springs heard alone with none of the dry sound left.',
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
      'A flanger that takes about twelve seconds over each sweep, into a far-off plate with a long soft tail and little dry sound.',
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
    id: 'sequencer-1974-dive-under-sodium',
    name: 'Dive under sodium',
    category: 'motion',
    description:
      'A long flanger with strong feedback, diving slowly, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'flanger', preset: 'Deep dive', params: { rate: 0.0952, delayMs: 6.68 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
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
    id: 'sequencer-1974-flight-case-fall',
    name: 'Flight-case fall',
    category: 'motion',
    description:
      'A resonant high-pass falling for about two seconds at a time, then a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Falling high-pass' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 81.6, mix: 0.21 } },
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
      'A fast rotating speaker at full depth, microphones close, into a single saturated tape slap behind each note.',
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
    id: 'sequencer-1974-candlelit-notch',
    name: 'Candlelit notch',
    category: 'motion',
    description:
      'A tape preamp pushed just enough to add weight, then a single notch drifting slowly up and down the spectrum, into a big muffled cave.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      {
        deviceId: 'auto-filter',
        preset: 'Slow notch',
        params: { lfoRateHz: 0.137, envAttackMs: 8.97, envReleaseMs: 207 },
      },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 6.44, breathRate: 0.326 } },
    ],
  },
  {
    id: 'sequencer-1974-empty-street-chorus',
    name: 'Empty-street chorus',
    category: 'motion',
    description:
      'A one-voice chorus, the pitch bending against the dry sound, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow chorus', params: { rate: 0.74 } },
      { deviceId: 'phaser', preset: 'Still formant', params: { rate: 0.335 } },
    ],
  },
  {
    id: 'sequencer-1974-wet-street-layers',
    name: 'Wet-street layers',
    category: 'motion',
    description:
      'Piled-up held chords, every overtone drifting, spread wide, into a mellow reverb whose tail drifts down towards the fifth.',
    effects: [
      { deviceId: 'sustainer', preset: 'Shimmer cloud' },
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { decay: 9.25 } },
    ],
  },
  {
    id: 'sequencer-1974-wall-side-warble',
    name: 'Wall-side warble',
    category: 'motion',
    description:
      'A fast warble of two voices pulling against each other, then an echo of single grains with gaps, so the repeats pulse.',
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
    id: 'sequencer-1974-horn-in-the-rack',
    name: 'Horn in the rack',
    category: 'motion',
    description:
      'A fast spinning horn laid over the dry sound, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl' },
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 703 } },
    ],
  },
  {
    id: 'sequencer-1974-empty-street-rotary',
    name: 'Empty-street rotary',
    category: 'motion',
    description:
      'A tape preamp driven for thick lows and a dull top, then a slow rotating speaker set shallow and mixed half dry.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -9.67 } },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
  },
  {
    id: 'sequencer-1974-patch-cord-rotary',
    name: 'Patch-cord rotary',
    category: 'motion',
    description:
      'Two full-range copies tuned further apart, reaching lower, then a clean slow rotating speaker blended under the dry sound.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { delay: 17.8 } },
      { deviceId: 'rotary', preset: 'Soft blend' },
    ],
  },
  {
    id: 'sequencer-1974-hollow-in-the-yard',
    name: 'Hollow in the yard',
    category: 'motion',
    description:
      'A short hollow flanger on negative feedback, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.32, breathRate: 0.284 } },
    ],
  },
  {
    id: 'sequencer-1974-untuned-voices',
    name: 'Untuned voices',
    category: 'motion',
    description:
      'Three detuned voices spread hard apart with no dry sound, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.32, delayMs: 15.8 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.15, breathRate: 0.176 } },
    ],
  },
  {
    id: 'sequencer-1974-planetarium-rotors',
    name: 'Planetarium rotors',
    category: 'motion',
    description:
      'A fast rotating speaker whose drum pulses the lows deeply, into a long blurred cave that slides slowly between intervals.',
    effects: [
      { deviceId: 'rotary', preset: 'Heavy rotors' },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch', params: { length: 0.706, glide: 5.33 } },
    ],
  },
  {
    id: 'sequencer-1974-vibrato-in-the-rack',
    name: 'Vibrato in the rack',
    category: 'motion',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, then a deep pitch wobble with the two sides bending out of step.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.11 } },
      { deviceId: 'tremolo', preset: 'Wide wobble' },
    ],
  },
  {
    id: 'sequencer-1974-rotary-by-patch-cord',
    name: 'Rotary by patch cord',
    category: 'motion',
    description:
      'A fast rotating speaker with the horn to the fore, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'rotary', preset: 'Bright horn' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 616 } },
    ],
  },
  {
    id: 'sequencer-1974-dial-lit-glue',
    name: 'Dial-lit glue',
    category: 'texture',
    description:
      'A firm, slow compressor that keeps long swells held down, then a wobbling tape double a moment behind each note.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 168, release: 5.4 } },
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { time: 38.6 } },
    ],
  },
  {
    id: 'sequencer-1974-black-knob-basses',
    name: 'Black-knob basses',
    category: 'texture',
    description:
      'A bowed swell at half strength under the dry attacks, then a dark string pad doubled an octave below the playing.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 313, release: 140 } },
      { deviceId: 'pad-follower', preset: 'Low section', params: { rise: 0.898, fall: 4.46 } },
    ],
  },
  {
    id: 'sequencer-1974-small-hours-strings',
    name: 'Small-hours strings',
    category: 'texture',
    description:
      'A soft following string pad, then a resonant comb that seems to climb without end, into a vast, slowly opening hall.',
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
    id: 'sequencer-1974-coal-cellar-sustain',
    name: 'Coal-cellar sustain',
    category: 'texture',
    description:
      'A held tone that takes over each note at once and soon fades, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Quick catch',
        params: { attack: 0.0208, glide: 0.0491, mix: 0.24 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 55.4, midDecay: 1.91, mix: 0.24 },
      },
    ],
  },
  {
    id: 'sequencer-1974-snowbound-cellos',
    name: 'Snowbound cellos',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then a dark, low string pad like cellos under the playing.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { attack: 2740 } },
      { deviceId: 'pad-follower', preset: 'Dark cellos' },
    ],
  },
  {
    id: 'sequencer-1974-lamp-lit-sustain',
    name: 'Lamp-lit sustain',
    category: 'texture',
    description:
      'A held pad alone, in place of the sound that was played, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'sustainer', preset: 'Held sound alone' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'sequencer-1974-courtyard-memories',
    name: 'Courtyard memories',
    category: 'texture',
    description:
      'Sparse stray grains of things played seconds earlier, into one taut dull spring that answers late and rings long.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Stray memories', params: { size: 252, density: 1.55 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark late coil',
        params: { decay: 4.95, predelay: 76.3 },
      },
    ],
  },
  {
    id: 'sequencer-1974-rehearsal-bloom',
    name: 'Rehearsal bloom',
    category: 'pitch',
    description:
      'Four octaves that bloom about two seconds behind each note, then a deep flanger that takes most of a minute to cross.',
    effects: [
      { deviceId: 'octaves', preset: 'Late bloom', params: { attack: 1.93 } },
      { deviceId: 'flanger', preset: 'Glacial drift' },
    ],
  },
  {
    id: 'sequencer-1974-pedals-in-november',
    name: 'Pedals in november',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, then a flanger that takes about twelve seconds over each sweep.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.27 } },
      { deviceId: 'flanger', preset: 'Slow sweep' },
    ],
  },
  {
    id: 'sequencer-1974-underfloor-pedals',
    name: 'Underfloor pedals',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, then a slow rotating speaker heard from across the room.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.43 } },
      { deviceId: 'rotary', preset: 'Across the room' },
    ],
  },
  {
    id: 'sequencer-1974-all-night-depths',
    name: 'All-night depths',
    category: 'pitch',
    description:
      'A soft bass two octaves below, and a little one octave below, then a phaser that climbs for about two seconds and snaps back.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'phaser', preset: 'Saw riser', params: { rate: 0.528 } },
    ],
  },
  {
    id: 'sequencer-1974-reel-on-the-clock',
    name: 'Reel on the clock',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 911 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 18.3, preDelay: 41.7 } },
    ],
  },
  {
    id: 'sequencer-1974-sixteen-step-octave',
    name: 'Sixteen-step octave',
    category: 'pitch',
    description:
      'An unbroken half-speed bed an octave down, with no dry sound, then three tape heads in a row, a cluster on every repeat.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 480 } },
    ],
  },
  {
    id: 'sequencer-1974-black-knob-chops',
    name: 'Black-knob chops',
    category: 'pitch',
    description:
      'Half-speed chunks an octave down, cut about twice a second, into a faint ring of six strings in A major.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops' },
      { deviceId: 'sympathetic', preset: 'Faint ring' },
    ],
  },
  {
    id: 'sequencer-1974-third-reel-blur',
    name: 'Third-reel blur',
    category: 'pitch',
    description:
      'Soft clipping, a little bright, laid under the clean sound, then a blurred half-speed wash an octave down, its cycles uneven.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 464 } },
    ],
  },
  {
    id: 'sequencer-1974-underfloor-pipes',
    name: 'Underfloor pipes',
    category: 'pitch',
    description:
      'Four octaves of pipes that swell in behind each note, into a soft slap close behind each note.',
    effects: [
      { deviceId: 'octaves', preset: 'Cathedral' },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 85.6, modRate: 0.541 } },
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
    id: 'sequencer-1974-half-lit-tide',
    name: 'Half-lit tide',
    category: 'master',
    description:
      'A compressor as slow as a hand on a fader, then the sides lifted a little, wider with nothing added, then a ceiling with a wide margin.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { release: 18.1 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'sequencer-1974-canal-side-sheen',
    name: 'Canal-side sheen',
    category: 'master',
    description:
      'A quiet plate tail that comes in late behind each note, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 93.3 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.32 } },
    ],
  },
  {
    id: 'sequencer-1974-sodium-lit-coil',
    name: 'Sodium-lit coil',
    category: 'master',
    description:
      'A low-heavy transformer, then a pluck-taming compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { release: 0.132 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.57 } },
    ],
  },
  {
    id: 'sequencer-1974-tape-near-dawn',
    name: 'Tape near dawn',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a low ceiling that lets go quickly, so loud passages breathe.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { release: 0.297, gain: -0.23 } },
    ],
  },
  {
    id: 'sequencer-1974-sides-by-lamplight',
    name: 'Sides by lamplight',
    category: 'master',
    description:
      'The sides lifted a little, wider with nothing added, then a low ceiling that keeps loud passages down for a while.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Late night' },
    ],
  },
  {
    id: 'sequencer-1974-incense-sides',
    name: 'Incense sides',
    category: 'master',
    description:
      'A warm, full equaliser, then the sides lifted a little, wider with nothing added, then a lightly pushed limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.54 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'sequencer-1974-candlelit-fader',
    name: 'Candlelit fader',
    category: 'master',
    description:
      'A mid-forward tone with the lows and the top trimmed, then a slow compressor that evens out swells over seconds, then a safety limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.47 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 323, release: 1.95 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
]
