// The sounds of the pack "Stairwell Choir of One": its presets played, a hundred sounds to
// paint with. Numbers 25001 to 25100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/stairwell-choir'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn } from './recipe'

// Holds a level that wanders by a dB or two (a reverb that turns, a breath), so what is held is
// heard as a drone and not as a pad.
const level: PatchDevice = {
  deviceId: 'ambient-comp',
  params: { threshold: -60, ratio: 8, attack: 20, release: 0.15, knee: 6, tails: 1, makeup: 24 },
}

// A fast ceiling that takes out the slow swells a level compressor leaves, for a drone that
// would otherwise drift over the line to a pad in another key; the cut after it takes out the
// offset such a ceiling leaves behind.
const pin: PatchDevice = {
  deviceId: 'ambient-limiter',
  params: { ceiling: -12, gain: 24, release: 0.3, ride: 0 },
}
const noDc: PatchDevice = { deviceId: 'ambient-eq', params: { lowCut: 25, clear: 0 } }

// Brings the ringing strings back up behind a pluck that the limiter before it has taken down.
const pluckLevel: PatchDevice = {
  deviceId: 'ambient-comp',
  params: {
    threshold: -45,
    ratio: 8,
    attack: 10,
    release: 0.15,
    knee: 6,
    tails: 1,
    scLowCut: 40,
    makeup: 18,
  },
}

// What keeps a held chord a pad in every key: the compressor takes out the stray swells and
// clicks of whatever turns in the chain, and one slow swell a pass is put in their place.
const swelling: readonly PatchDevice[] = [level, breathe(0.125, 0.5)]
const swellingSlowly: readonly PatchDevice[] = [level, breathe(0.0625, 0.5)]

// A plucked string is a tall peak over very little: this holds the peak so the body of the note
// comes up with the sound at the bank's level.
const pinned = (gain: number): PatchDevice => ({
  deviceId: 'ambient-limiter',
  preset: 'Pinned',
  params: { gain, release: 0.3, ride: 0 },
})

// Brings what a wide room puts to the sides back towards the middle, so the sound holds in mono.
const narrow = (width: number): PatchDevice => ({ deviceId: 'stereo-widener', params: { width } })

// A plain stone room that does not stir, where a preset's own room turns too much for a drone.
const stone = (
  preset: 'Room' | 'Hall' | 'Cathedral',
  params: Readonly<Record<string, number>>,
): PatchDevice => ({ deviceId: 'hall-reverb', preset, params })

export const SOUNDS: readonly FactorySound[] = packSounds('stairwell-choir', 25000, PRESETS, [
  // Drones: the note the first loop is sung against. One note, or a note and its fifth or octave,
  // on instruments that hold still, in rooms that do not stir.
  {
    n: 1,
    id: 'hummed-floor-a',
    name: 'Hummed floor {A}',
    kind: 'drone',
    description:
      'A closed oo hummed on a low {A} with the octave under it, dark and without breath, in a hall.',
    preset: 'stairwell-choir-hummed-bed',
    // The octave under takes the single note's level down, which was over the band a semitone up.
    // One singer and no drift between vowels; the preset's three-second attack is still rising when the loop starts.
    set: { ensemble: 0, motion: 0, attack: 0.8 },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000, clear: 0 } },
      stone('Hall', { lowDecay: 5, midDecay: 5, mix: 0.45 }),
    ],
    ...looped(8, 7, 3, [45, [33, 0.35]]),
    tuning: 'whole-cycles',
    then: [level, quarterTurn(8)],
  },
  {
    n: 2,
    id: 'celeste-ranks-a',
    name: 'Celeste ranks {A}',
    kind: 'drone',
    description:
      'Two low organ ranks on {A} and {E} tuned a little apart, held in a very large space.',
    preset: 'stairwell-choir-celeste-floor',
    set: { celeste: 0.15, bellows: 0 },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, mix: 0.4, modDepth: 0 } },
    ],
    ...looped(8, 7, 3, [45, [52, 0.6]]),
    tuning: 'whole-cycles',
    then: [narrow(0.2), quarterTurn(8)],
  },
  {
    n: 3,
    id: 'underfloor-fifths-g',
    name: 'Underfloor fifths {G}',
    kind: 'drone',
    description:
      'A low {G} with its fifth and a sub octave, dark and slow, in a very large dark space.',
    preset: 'stairwell-choir-underfloor-fifths',
    set: { movement: 0.1, attack: 1.5 },
    // The space is full sooner at half its decay, does not turn, and is kept in from the sides.
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 10, highCut: 3500, modDepth: 0, width: 0.4 },
      },
    ],
    ...looped(8, 12, 3, [43]),
    tuning: 'whole-cycles',
    then: [pin, noDc, quarterTurn(8)],
  },
  {
    n: 4,
    id: 'monochord-round-e',
    name: 'Stairwell monochord {E}',
    kind: 'drone',
    description:
      'Four open strings on {E} and {B} plucked round and round with no buzz, in a hard stairwell.',
    preset: 'stairwell-choir-stairwell-monochord',
    // Twelve plucks to the loop, as the bank's tanpura has them; the plucks are taken down to the ring.
    set: { speed: 2.698, volume: 6 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      pluckLevel,
      stone('Hall', { midDecay: 4, damping: 12000, mix: 0.45 }),
    ],
    ...looped(8, 2.77, 0.45, [52]),
    then: [pin, noDc],
  },
  {
    n: 5,
    id: 'drone-lute-c',
    name: 'Drone lute {C}',
    kind: 'drone',
    description:
      'A buzzing drone lute on {C} with a low {B} string, its reverb coming back as a closed oo.',
    preset: 'stairwell-choir-drone-lute-oo-return',
    set: { speed: 2.698, volume: 6 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      {
        deviceId: 'vowel-reverb',
        preset: 'Oo behind',
        params: { decay: 3, mix: 0.4, motion: 0, modulation: 0 },
      },
    ],
    ...looped(8, 2.77, 0.45, [48]),
    then: [level, pin, noDc],
  },
  {
    n: 6,
    id: 'crypt-cello-d',
    name: 'Crypt cello {D}',
    kind: 'drone',
    description: 'A bowed cello on a low {D} without vibrato, in a stone room with a long tail.',
    preset: 'stairwell-choir-crypt-cello',
    set: { vibrato: 0 },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Plain hall',
        params: { decay: 8, tone: 3500, lowCut: 30, mix: 0.4, modulation: 0, width: 0.4 },
      },
    ],
    ...looped(8, 5, 3, [38]),
    tuning: 'whole-cycles',
    then: [level, quarterTurn(8)],
  },
  {
    n: 7,
    id: 'pipes-through-walls-e',
    name: 'Pipes through walls {E}',
    kind: 'drone',
    description:
      'Organ pipes on {E} and {B} heard from the stairwell, the top taken off, in a cathedral.',
    preset: 'stairwell-choir-pipes-through-walls',
    // Without the twelfth rank, which sounds an F sharp over the B.
    set: { celeste: 0, bellows: 0, twelfth: 0 },
    ...looped(8, 8, 3, [52, [59, 0.5]]),
    tuning: 'whole-cycles',
    // The cathedral puts a steady pipe out of phase on some notes: narrowed, it holds in mono.
    then: [{ deviceId: 'stereo-widener', params: { width: 0.25 } }, quarterTurn(8)],
  },
  {
    n: 8,
    id: 'sub-beneath-a',
    name: 'Sub beneath {A}',
    kind: 'drone',
    description:
      'A near-sine sub on a low {A} given some transformer weight, almost dry in a room.',
    preset: 'stairwell-choir-sub-beneath',
    set: { beat: 0 },
    ...looped(8, 3, 2, [45]),
    tuning: 'whole-cycles',
    then: [quarterTurn(8)],
  },
  {
    n: 9,
    id: 'vestry-harmonium-g',
    name: 'Vestry harmonium {G}',
    kind: 'drone',
    description:
      'A harmonium held on {G} close up in a small room, breath audible, on a quiet reel of tape.',
    preset: 'stairwell-choir-vestry-harmonium',
    set: { celeste: 0, bellows: 0 },
    ...looped(8, 3, 2, [55]),
    tuning: 'whole-cycles',
    then: [quarterTurn(8)],
  },
  {
    n: 10,
    id: 'church-flutes-d',
    name: 'Church flutes {D}',
    kind: 'drone',
    description:
      'Stopped organ flutes on {D} and {A} with no reed, soft and breathy, in an empty church.',
    preset: 'stairwell-choir-empty-church-flutes',
    set: { bellows: 0 },
    ...looped(8, 6, 3, [62, [69, 0.5]]),
    tuning: 'whole-cycles',
    then: [quarterTurn(8)],
  },
  {
    n: 11,
    id: 'rear-pew-horn-f',
    name: 'Rear pew horns {F}',
    kind: 'drone',
    description:
      'Two horns at the back of the church holding {F} and {C}, half of what arrives being the room.',
    preset: 'stairwell-choir-rear-pew-brass',
    // One player a note: a section on every key swells by itself.
    set: { section: 0 },
    ...looped(8, 6, 3, [53, [60, 0.5]]),
    tuning: 'whole-cycles',
    then: [quarterTurn(8)],
  },
  {
    n: 12,
    id: 'low-reed-held-c',
    name: 'Low reed held {C}',
    kind: 'drone',
    description: 'Two bass clarinets on a low {C} and {G}, breathy and soft, held level in a hall.',
    preset: 'stairwell-choir-low-reed-held',
    // The preset's smear hangs each note over its neighbours this low; a plain hall holds it.
    effects: [stone('Hall', { lowDecay: 4, midDecay: 3.5, mix: 0.35 })],
    ...looped(8, 5, 3, [48, [55, 0.9]]),
    tuning: 'whole-cycles',
    then: [quarterTurn(8)],
  },
  {
    n: 13,
    id: 'clerestory-major-c',
    name: 'Clerestory major {C}',
    kind: 'drone',
    description:
      'A just major chord of slow partials on {C} with air in it, in a hall that sings ah.',
    preset: 'stairwell-choir-clerestory-major',
    set: { movement: 0.1, attack: 1.5, width: 0.6 },
    ...looped(8, 10, 3, [60]),
    then: [pin, noDc],
  },
  {
    n: 14,
    id: 'alto-reeds-g',
    name: 'Alto reeds {G}',
    kind: 'drone',
    description:
      'Two clarinets holding {G} and {D} like sung alto lines, reedy and full of breath, in a cathedral.',
    preset: 'stairwell-choir-alto-reed',
    // Without the doubler: two lines a few cents apart beat, and a beat is not a drone. Blown
    // harder and with more breath: the soft tone is near a sine, and far over the band in some keys.
    set: { blow: 0.9, breath: 0.7 },
    effects: [stone('Cathedral', { midDecay: 7, mix: 0.55 })],
    ...looped(8, 7, 3, [55, [62, 0.7]]),
    tuning: 'whole-cycles',
    then: [narrow(0.25), quarterTurn(8)],
  },

  // Pads: the stack, pass by pass. Chords that swell once a loop, and a few that arrive and go.
  {
    n: 15,
    id: 'choir-of-one-csus2',
    name: 'Choir of one {C}sus2',
    kind: 'pad',
    description:
      'A small bright ah on {C}, {G} and {D}, doubled to either side, in a hall that sings back.',
    preset: 'stairwell-choir-choir-of-one',
    set: { ensemble: 0.1 },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { mix: 0.15 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { highCut: 10000, mix: 0.4 } },
    ],
    ...looped(8, 8, 3, [48, 55, 62, 67]),
    then: swelling,
  },
  {
    n: 16,
    id: 'back-pew-fifths-f',
    name: 'Back pew fifths {F}',
    kind: 'pad',
    description:
      'A young section on oh holding {F} and {C} in octaves, heard from the back pew of a cathedral.',
    preset: 'stairwell-choir-back-pew-section',
    set: { ensemble: 0.2 },
    ...looped(8, 8, 3, [53, 60, 65, 72]),
    then: [...swelling, narrow(0.3)],
  },
  {
    n: 17,
    id: 'soprano-caught-f',
    name: 'Soprano caught {F}',
    kind: 'pad',
    description:
      'One straight-toned soprano holding {F} on ah, a looper under her, in a bright stairwell.',
    preset: 'stairwell-choir-one-soprano-caught',
    set: { vibrato: 0 },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Soft bed',
        params: { length: 1.5, spread: 0.1, mix: 0.3, smear: 0.8, drift: 0 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 3, midDecay: 4, damping: 12000, mix: 0.45 },
      },
    ],
    ...looped(8, 5, 3, [65]),
    then: [level, breathe(0.125, 0.65)],
  },
  {
    n: 18,
    id: 'round-with-herself-g',
    name: 'Round with herself {G}',
    kind: 'pad',
    description:
      'One lower voice on oh, heard twice: {G} and {D} held together over their own two-second loop, in a stone nave.',
    preset: 'stairwell-choir-round-with-herself',
    ...looped(8, 10, 3, [55, 62]),
    then: swelling,
  },
  {
    n: 19,
    id: 'high-descant-a',
    name: 'High descant {A}',
    kind: 'pad',
    description:
      'A small ee on {A} and {E} with an octave of itself above, thinned of its low end, in a hall.',
    preset: 'stairwell-choir-high-descant',
    set: { ensemble: 0 },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Glass octaves',
        params: { dry: 0.7, up1: 0.4, up2: 0, resonance: 0, spread: 0.3 },
      },
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 300, presence: 3, air: 2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, mix: 0.4 } },
    ],
    ...looped(8, 6, 3, [69, 76]),
    then: swelling,
  },
  {
    n: 20,
    id: 'rising-vowels-f',
    name: 'Rising vowels {F}',
    kind: 'pad',
    description:
      'Voices on {F}, {C} and {G} drifting from vowel to vowel while the reverb above climbs by octaves.',
    preset: 'stairwell-choir-rising-vowels',
    set: { ensemble: 0.2, vibrato: 3 },
    ...looped(16, 6, 3, [53, 60, 67]),
    then: swellingSlowly,
  },
  {
    n: 21,
    id: 'empty-pool-alto-d',
    name: 'Empty pool alto {D}',
    kind: 'pad',
    description:
      'Lower voices on eh holding {D} and {A} in a hard tiled room, one short echo behind them.',
    preset: 'stairwell-choir-empty-pool-alto',
    set: { ensemble: 0.2 },
    ...looped(8, 5, 3, [50, 57, 62]),
    then: swelling,
  },
  {
    n: 22,
    id: 'frozen-syllable-g',
    name: 'Frozen syllable {G}',
    kind: 'pad',
    description:
      'One instant of a soft tone held still as grains on {G} and {D}, in a hall that sings.',
    preset: 'stairwell-choir-frozen-syllable',
    ...looped(8, 6, 3, [55, 62, 67]),
    then: swelling,
  },
  {
    n: 23,
    id: 'pump-organ-hymn-c',
    name: 'Pump organ hymn {C}',
    kind: 'pad',
    description:
      'A reedy pump organ on {C} major with an uneven bellows, its reverb a soft wordless choir.',
    preset: 'stairwell-choir-pump-organ-hymn',
    ...looped(8, 5, 3, [60, 67, 72, 76]),
    then: swelling,
  },
  {
    n: 24,
    id: 'slow-rotor-chorale-f',
    name: 'Slow rotor chorale {F}',
    kind: 'pad',
    description:
      'A fuller organ on {F} and {C} turning slowly in a rotating speaker across the room, then a little plate.',
    preset: 'stairwell-choir-slow-rotor-chorale',
    ...looped(8, 5, 3, [41, 53, 60, 65]),
    then: swelling,
  },
  {
    n: 25,
    id: 'northern-quartet-a',
    name: 'Northern quartet {A}',
    kind: 'pad',
    description:
      'A few violins from tape holding {A} and {E}, close and plain with little vibrato, in a hall.',
    preset: 'stairwell-choir-northern-quartet',
    set: { length: 9, age: 0.05, players: 0.2, vibrato: 0.1 },
    ...looped(8, 5, 3, [57, 64, 69]),
    then: swelling,
  },
  {
    n: 26,
    id: 'cellos-underneath-c',
    name: 'Cellos underneath {C}',
    kind: 'pad',
    description:
      'Tape cellos at half speed on a low {C} and {G}, their reverb coming back as a low oh.',
    preset: 'stairwell-choir-cellos-underneath',
    set: { age: 0.05 },
    ...looped(8, 6, 3, [60, 67]),
    then: swelling,
  },
  {
    n: 27,
    id: 'reed-chorale-g',
    name: 'Reed chorale {G}',
    kind: 'pad',
    description:
      'Orchestra reeds from tape holding {G} major, a looper keeping the last seconds under them, on a plate.',
    preset: 'stairwell-choir-reed-chorale-bed',
    set: { age: 0.05 },
    ...looped(8, 6, 3, [55, 62, 67, 71]),
    then: swelling,
  },
  {
    n: 28,
    id: 'still-quartet-d',
    name: 'Still quartet {D}',
    kind: 'pad',
    description:
      'Four players on {D} and {A} with no vibrato and a good deal of bow air, in a plain long hall.',
    preset: 'stairwell-choir-still-quartet',
    ...looped(8, 6, 3, [50, 57, 62, 69]),
    then: [...swelling, narrow(0.35)],
  },
  {
    n: 29,
    id: 'slow-ensemble-am',
    name: 'Slow ensemble {A}m',
    kind: 'pad',
    description:
      'A seventies string ensemble on {A} minor through a clean reel of tape, in a very large space.',
    preset: 'stairwell-choir-slow-ensemble-strings',
    set: { high: 0.15, ensemble: 0.6 },
    ...looped(16, 6, 3, [45, 57, 64, 69, 72]),
    then: swellingSlowly,
  },
  {
    n: 30,
    id: 'vespers-pad-f',
    name: 'Vespers pad {F}',
    kind: 'pad',
    description:
      'A synth pad voiced like a choir on {F} major, under a reverb that climbs an octave and a fifth.',
    preset: 'stairwell-choir-vespers-pad',
    ...looped(8, 8, 3, [53, 60, 65, 69]),
    then: swelling,
  },
  {
    n: 31,
    id: 'brass-in-waves-g',
    name: 'Brass in waves {G}',
    kind: 'pad',
    description:
      'Soft synth horns on {G} and {D} warmed by a tape preamp, in a hall that lets them in by waves.',
    preset: 'stairwell-choir-brass-in-waves',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4, breathRate: 0.25 } },
    ],
    ...looped(8, 8, 3, [43, 55, 62, 67]),
    then: swelling,
  },
  {
    n: 32,
    id: 'polysynth-hymn-c',
    name: 'Polysynth hymn {C}',
    kind: 'pad',
    description:
      'A chorus polysynth on {C} major with its filter half shut, in a twelve-second hall.',
    preset: 'stairwell-choir-polysynth-hymn',
    ...looped(8, 8, 3, [48, 60, 67, 72, 76]),
    then: swelling,
  },
  {
    n: 33,
    id: 'glass-voices-d',
    name: 'Glass voices {D}',
    kind: 'pad',
    description:
      'A slow glass pad on {D} and {A} whose reverb moves from vowel to vowel, so the tail seems sung.',
    preset: 'stairwell-choir-glass-voices',
    set: { detune: 3 },
    ...looped(8, 8, 3, [62, 69, 74]),
    then: [...swelling, narrow(0.35)],
  },
  {
    n: 34,
    id: 'wavetable-vowels-g',
    name: 'Wavetable vowels {G}',
    kind: 'pad',
    description:
      'A wavetable on {G} and {D} travelling once through sung vowels each pass, doubled, on a long plate.',
    preset: 'stairwell-choir-wavetable-vowels',
    set: { detune: 4, rate: 0.0625 },
    ...looped(16, 6, 3, [43, 55, 62, 67]),
    then: [level, breathe(0.0625, 0.4), narrow(0.3)],
  },
  {
    n: 35,
    id: 'hum-that-breathes-b',
    name: 'Hum that breathes {B}',
    kind: 'pad',
    description:
      'Nearly plain sine tones on a low {B} over a sub, a dark hum rising and falling twice a pass, in a hall.',
    preset: 'stairwell-choir-hum-that-breathes',
    // The preset's swell comes when it likes; here it comes twice a loop, so the loop comes round.
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 0.25, depth: 0.5, shape: 0, phase: 0, drift: 0, smooth: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4, breathDepth: 0 } },
    ],
    ...looped(8, 6, 3, [47, 59]),
  },
  {
    n: 36,
    id: 'folded-tone-g',
    name: 'Folded tone held {G}',
    kind: 'pad',
    description:
      'A folded tone on a low {G} and its octave, phasing slowly with a half-hertz shift, in a very large space.',
    preset: 'stairwell-choir-folded-tone-held',
    ...looped(8, 8, 3, [43, 55]),
    then: [...swelling, narrow(0.3)],
  },
  {
    n: 37,
    id: 'bass-arrives-d',
    name: 'Bass that arrives {D}',
    kind: 'pad',
    description:
      'Two beating sawtooths over a sub on a low {D}, faded in by a swell so the bass arrives.',
    preset: 'stairwell-choir-bass-that-arrives',
    ...played(8, [[0, 4.5, 38]], 2.5),
  },
  {
    n: 38,
    id: 'swelled-guitar-g',
    name: 'Swelled guitar {G}',
    kind: 'pad',
    description:
      'A guitar chord on {G} and {D} swelled in by its volume pedal, a string pad growing an octave above.',
    preset: 'stairwell-choir-guitar-without-attack',
    ...played(
      12,
      [
        [0, 6, 43],
        [0, 6, 55],
        [0, 6, 62],
        [0, 6, 67],
      ],
      3,
    ),
  },
  {
    n: 39,
    id: 'steel-sung-g',
    name: 'Steel sung high {G}',
    kind: 'pad',
    description:
      'One steel guitar note swelled in on {G} so it reads as a voice, a faint octave rising behind.',
    preset: 'stairwell-choir-steel-sung-high',
    set: { vibrato: 0 },
    ...played(12, [[0, 5.5, 67]], 3),
  },
  {
    n: 40,
    id: 'rolled-vibes-am7',
    name: 'Rolled vibes {A}m7',
    kind: 'pad',
    description:
      'A vibraphone chord of {A} minor seventh rolled with soft mallets into a shimmer, in a nine-second hall.',
    preset: 'stairwell-choir-rolled-vibes-hymn',
    ...looped(8, 6, 3, [57, 60, 64, 67]),
    loopFold: 'linear',
    then: [level, breathe(0.125, 0.45)],
  },
  {
    n: 41,
    id: 'string-in-thirds-g',
    name: 'String in thirds {G}',
    kind: 'pad',
    description:
      'A string held singing on {G} with {B} added above and below it by a harmonizer, in a hall.',
    preset: 'stairwell-choir-string-in-thirds',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Diatonic thirds',
        params: { mix: 45, output: 5, v1Pan: -35, v2Pan: 35 },
      },
      stone('Hall', { midDecay: 4, mix: 0.4 }),
    ],
    ...looped(8, 6, 3, [55]),
    loopFold: 'linear',
    // A second swell under the first: one alone left it over the band a semitone down.
    then: [level, breathe(0.125, 0.65), breathe(0.125, 0.5)],
  },
  {
    n: 42,
    id: 'wood-flute-held-d',
    name: 'Wood flute held {D}',
    kind: 'pad',
    description:
      'A wood flute holding {D} and {A} over its own three-and-a-half-second loop, in an eight-second hall.',
    preset: 'stairwell-choir-wood-flute-round',
    ...looped(8, 8, 3, [62, 69]),
    then: [level, breathe(0.125, 0.65)],
  },
  {
    n: 43,
    id: 'flugelhorn-held-f',
    name: 'Flugelhorn held {F}',
    kind: 'pad',
    description:
      'A breathy flugelhorn holding {F} like a sung line, pieces of it gathering behind in a hall.',
    preset: 'stairwell-choir-flugelhorn-gathering',
    ...looped(8, 10, 3, [65]),
    then: swelling,
  },

  // Textures: weather through the walls, breath with no note in it, noise read by the samplers.
  {
    n: 44,
    id: 'rain-down-the-stairwell',
    name: 'Rain down the stairwell',
    kind: 'texture',
    description:
      'Heavy rain heard from inside the building: dense, far off, its top taken down, in a hard room.',
    preset: 'stairwell-choir-stairwell-rain',
    ...looped(8, 9, 3, [60]),
  },
  {
    n: 45,
    id: 'landing-draught',
    name: 'Landing draught',
    kind: 'texture',
    description:
      'A draught through a gap, more hiss than whistle, its reverb shaped into a slow sung vowel.',
    preset: 'stairwell-choir-draught-that-sings',
    set: { movement: 0.3, resonance: 0.25 },
    ...looped(8, 6, 3, [67]),
  },
  {
    n: 46,
    id: 'indrawn-breath-a',
    name: 'Indrawn breath {A}',
    kind: 'texture',
    description:
      'More air than note: the breath before a low {A} minor chord, thinned, drawn once a pass and lost in a cathedral.',
    preset: 'stairwell-choir-breath-before-singing',
    ...looped(8, 8, 3, [45, 48, 52]),
    then: [breathe(0.125, 0.5)],
  },
  {
    n: 47,
    id: 'mirror-breaths-d',
    name: 'Mirror breaths {D}',
    kind: 'texture',
    description:
      'Wide bands of noise around {D} and {A} and their reflections, more breath than pitch, in a hall of ah.',
    preset: 'stairwell-choir-mirror-breaths',
    set: { resonance: 6, width: 100 },
    ...looped(8, 6, 3, [38, 45]),
    then: [
      narrow(0.3),
      { deviceId: 'ambient-eq', params: { highCut: 4500, clear: 0 } },
      breathe(0.125, 0.4),
    ],
  },
  {
    n: 48,
    id: 'bows-of-air-e',
    name: 'Bows of air {E}',
    kind: 'texture',
    description:
      'Bows that are mostly air on a low {E} minor chord, caught and held as a layer in a very large space.',
    preset: 'stairwell-choir-bows-in-layers',
    ...looped(8, 8, 3, [40, 43, 47]),
  },
  {
    n: 49,
    id: 'flutes-as-breath-d',
    name: 'Flutes as breath {D}',
    kind: 'texture',
    description:
      'Low flutes on a {D} minor chord blown so softly they are mostly breath, in a hall that whispers back.',
    preset: 'stairwell-choir-flutes-as-breath',
    ...looped(8, 8, 3, [38, 41, 45]),
  },
  {
    n: 50,
    id: 'fluttered-wind',
    name: 'Fluttered wind',
    kind: 'texture',
    description:
      'A short stretch of hill wind run forwards and back until it flutters, layered by a slow loop.',
    preset: 'stairwell-choir-fluttered-breath',
    source: 'hill-wind',
    ...looped(8, 8, 3, [60]),
  },
  {
    n: 51,
    id: 'rain-read-backwards',
    name: 'Rain read backwards',
    kind: 'texture',
    description:
      'Long reversed grains creeping backwards through rain on a window, with a reversed loop under them.',
    preset: 'stairwell-choir-backwards-congregation',
    source: 'rain-on-the-window',
    ...looped(8, 8, 3, [60]),
  },
  {
    n: 52,
    id: 'clipped-crackle',
    name: 'Clipped crackle',
    kind: 'texture',
    description:
      'Short grains picked one at a time from the crackle of a record, flickering back out of an echo.',
    preset: 'stairwell-choir-clipped-syllables',
    source: 'record-crackle',
    ...looped(8, 4, 2, [60]),
    then: [pinned(12)],
  },
  {
    n: 53,
    id: 'chimney-wind-reversed',
    name: 'Chimney wind reversed',
    kind: 'texture',
    description:
      'Wind in a chimney played backwards, swelling towards its own start in a reverb that rises behind it.',
    preset: 'stairwell-choir-sung-backwards',
    source: 'wind-in-the-chimney',
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 54,
    id: 'fire-on-worn-cassette',
    name: 'Fire on worn cassette',
    kind: 'texture',
    description:
      'A fire on a wavering loop with a coarse looper behind it, dulled by a worn cassette in a bedroom.',
    preset: 'stairwell-choir-rehearsal-cassette',
    source: 'hearth',
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 55,
    id: 'whistled-chord-c',
    name: 'Whistled chord {C}',
    kind: 'texture',
    description:
      'Bands of noise around {C} major and its mirror, half whistled, breathing once a pass, in a very large space.',
    preset: 'stairwell-choir-whistled-chord',
    set: { breatheRate: 0.125, resonance: 25 },
    ...looped(8, 6, 3, [60, 64, 67]),
  },

  // One-shots: one note or one chord struck or sung and left, the presets' echoes taken away or
  // thinned.
  {
    n: 56,
    id: 'loft-handbell-d',
    name: 'Loft handbell {D}',
    kind: 'oneshot',
    description:
      'One small cast bell on {D} struck bright and close and left to ring in a stone church.',
    preset: 'stairwell-choir-loft-handbells',
    set: { position: 0.667, detune: 0 },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 5500, mix: 0.3 } },
    ],
    ...played(8, [[0, 6, 74]], 2),
  },
  {
    n: 57,
    id: 'steeple-bell-d',
    name: 'Steeple bell {D}',
    kind: 'oneshot',
    description:
      'One church bell on {D} a long way off, its strike softened and its top rolled away, in a large space.',
    preset: 'stairwell-choir-far-steeple',
    set: { decay: 10, position: 0.667, detune: 0 },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 6, mix: 0.35 } },
    ],
    ...played(12, [[0, 9, 50]], 3),
  },
  {
    n: 58,
    id: 'music-box-tooth-e',
    name: 'Music box tooth {E}',
    kind: 'oneshot',
    description: 'One tooth of a small music box comb plucked on a high {E}, in a chapel.',
    preset: 'stairwell-choir-looped-music-box',
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { decay: 2.5, mix: 0.3 } }],
    ...played(4, [[0, 2.5, 76]], 1),
  },
  {
    n: 59,
    id: 'bowl-in-the-hall-g',
    name: 'Bowl in the hall {G}',
    kind: 'oneshot',
    description: 'A singing bowl on {G} struck once and left to ring for eight seconds, in a hall.',
    preset: 'stairwell-choir-bowl-round',
    effects: [stone('Hall', { mix: 0.3 })],
    ...played(10, [[0, 8, 55]], 2.5),
  },
  {
    n: 60,
    id: 'soft-bar-a',
    name: 'Soft bar {A}',
    kind: 'oneshot',
    description: 'One metal bar on {A} under a soft mallet, ringing out in a hall.',
    preset: 'stairwell-choir-bars-answered-backwards',
    set: { detune: 0 },
    // The long plate put it out to the sides in some keys; a plain hall keeps it in the middle.
    effects: [stone('Hall', { midDecay: 4, mix: 0.25 })],
    ...played(7, [[0, 5, 69]], 2),
  },
  {
    n: 61,
    id: 'thumb-piano-c',
    name: 'Landing thumb piano {C}',
    kind: 'oneshot',
    description: 'One tine of a thumb piano on {C}, close and hard, on a concrete landing.',
    preset: 'stairwell-choir-landing-thumb-piano',
    effects: [stone('Room', { midDecay: 2.2, damping: 12000, mix: 0.3 })],
    ...played(3, [[0, 2, 72]], 1),
  },
  {
    n: 62,
    id: 'handpan-ding-d',
    name: 'Atrium handpan ding {D}',
    kind: 'oneshot',
    description:
      'The low {D} of a handpan under soft fingers, its octave and fifth ringing in a large space.',
    preset: 'stairwell-choir-atrium-handpan',
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 4, mix: 0.25 } }],
    ...played(8, [[0, 6, 50]], 2),
  },
  {
    n: 63,
    id: 'tongue-drum-a',
    name: 'Tongue drum {A}',
    kind: 'oneshot',
    description: 'One steel tongue on {A} touched lightly and left to ring down, in a hall.',
    preset: 'stairwell-choir-tongue-drum-slow-bed',
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, breathDepth: 0 } }],
    ...played(7, [[0, 5, 57]], 2),
  },
  {
    n: 64,
    id: 'celesta-note-g',
    name: 'Chapel celesta {G}',
    kind: 'oneshot',
    description: 'One soft celesta note on a high {G}, in a small chapel that sings back a little.',
    preset: 'stairwell-choir-celesta-afterwards',
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } }],
    ...played(4, [[0, 2.5, 79]], 1),
  },
  {
    n: 65,
    id: 'glass-bell-d',
    name: 'Stairwell glass bell {D}',
    kind: 'oneshot',
    description:
      'One glass bell on {D}, its bright partial sounding as a {C} above it, ringing out in a hall.',
    preset: 'stairwell-choir-glass-answered',
    set: { detune: 0 },
    effects: [stone('Hall', { midDecay: 4, mix: 0.3 })],
    ...played(8, [[0, 5, 62]], 2.5),
  },
  {
    n: 66,
    id: 'nylon-thumbed-e',
    name: 'Nylon thumbed {E}',
    kind: 'oneshot',
    description:
      'A low {E} on a nylon guitar played with the thumb and left to ring, in a small chapel.',
    preset: 'stairwell-choir-porch-nylon',
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } }],
    ...played(6, [[0, 4, 52]], 1.5),
    then: [pinned(5)],
  },
  {
    n: 67,
    id: 'twelve-string-chord-g',
    name: 'Twelve-string chord {G}',
    kind: 'oneshot',
    description:
      'A twelve-string struck once across {G} and {D} in three octaves and left to ring in a large space.',
    preset: 'stairwell-choir-twelve-strings-ringing',
    set: { strum: 8 },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } }],
    ...played(
      10,
      [
        [0, 8, 43],
        [0, 8, 50],
        [0, 8, 55],
        [0, 8, 62],
        [0, 8, 67],
      ],
      3,
    ),
    then: [pinned(4)],
  },
  {
    n: 68,
    id: 'cold-room-pluck-a',
    name: 'Cold room pluck {A}',
    kind: 'oneshot',
    description:
      'One clean electric guitar string on {A} picked and left alone in a bright hard hall.',
    preset: 'stairwell-choir-cold-room-guitar',
    effects: [stone('Hall', { midDecay: 3.5, damping: 10000, mix: 0.35 })],
    ...played(8, [[0, 6, 57]], 2),
    then: [pinned(8)],
  },
  {
    n: 69,
    id: 'upright-chord-c',
    name: 'Upright chord {C}',
    kind: 'oneshot',
    description:
      'A felted upright playing {C} and {G} softly once at the front of an empty church, and the room after.',
    preset: 'stairwell-choir-sanctuary-upright',
    ...played(
      10,
      [
        [0, 7, 48],
        [0, 7, 55],
        [0, 7, 60],
        [0, 7, 67],
      ],
      3,
    ),
    then: [pinned(8)],
  },
  {
    n: 70,
    id: 'chapel-tine-e',
    name: 'Chapel tine {E}',
    kind: 'oneshot',
    description:
      'One soft tine piano note on {E} with no tremolo and almost no bark, left to ring in a hall.',
    preset: 'stairwell-choir-side-chapel-tines',
    effects: [stone('Hall', { midDecay: 3, mix: 0.3 })],
    ...played(7, [[0, 5, 64]], 2),
  },
  {
    n: 71,
    id: 'harp-string-f',
    name: 'Cathedral harp string {F}',
    kind: 'oneshot',
    description: 'One concert harp string on {F} plucked and left to ring in a dark cathedral.',
    preset: 'stairwell-choir-harp-through-delay',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 4500, mix: 0.3 } },
    ],
    ...played(8, [[0, 5, 65]], 2.5),
  },
  {
    n: 72,
    id: 'harp-chord-struck-c',
    name: 'Chord harp struck {C}',
    kind: 'oneshot',
    description:
      'A chord harp struck once across {C} and {G}, all its strings nearly together, on a small plate.',
    preset: 'stairwell-choir-strum-and-overdub',
    set: { strum: 6 },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } }],
    ...played(
      7,
      [
        [0, 5, 60],
        [0, 5, 67],
      ],
      2,
    ),
    then: [pinned(5)],
  },
  {
    n: 73,
    id: 'zither-fifths-d',
    name: 'Zither fifths {D}',
    kind: 'oneshot',
    description:
      'A chord zither struck once on {D} with its fifth and octave, a slow pad of strings rising behind it.',
    preset: 'stairwell-choir-chord-zither-hymn',
    set: { strum: 10 },
    ...played(10, [[0, 7, 50]], 3),
    then: [pinned(6)],
  },
  {
    n: 74,
    id: 'one-take-marimba-g',
    name: 'One-take marimba {G}',
    kind: 'oneshot',
    description:
      'A marimba note on {G} played once through the converters of an early looper, in an open space.',
    preset: 'stairwell-choir-one-take-each',
    source: 'marimba-g',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.8, mix: 0.3 } },
    ],
    ...played(6, [[0, 4, 60]], 2),
  },
  {
    n: 75,
    id: 'folded-pluck-c',
    name: 'Folded pluck {C}',
    kind: 'oneshot',
    description:
      'One soft folded pluck on {C}, the kind that sits under held voices, alone in a hall.',
    preset: 'stairwell-choir-pulse-under-voices',
    set: { chance: 0, drift: 0 },
    effects: [stone('Hall', { midDecay: 3, mix: 0.3 })],
    ...played(4, [[0, 2, 60]], 1.5),
    then: [pinned(8)],
  },
  {
    n: 76,
    id: 'loft-hammer-g',
    name: 'Loft hammer {G}',
    kind: 'oneshot',
    description:
      'One small hammer on a pair of strings an octave apart on {G}, in a reverb that swells.',
    preset: 'stairwell-choir-loft-hammers',
    set: { roll: 0, strum: 0 },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.25 } }],
    ...played(8, [[0, 5, 55]], 2.5),
  },
  {
    n: 77,
    id: 'sung-up-the-stairs-e',
    name: 'Sung up the stairs {E}',
    kind: 'oneshot',
    description:
      'One short ah from a straight-toned soprano on {E}, let go at once, the bright stairwell answering.',
    preset: 'stairwell-choir-one-soprano-caught',
    // No looper: one syllable and what the stairwell does with it.
    set: { vibrato: 0, attack: 0.02, release: 0.25 },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 3, midDecay: 4, damping: 12000, mix: 0.35 },
      },
    ],
    ...played(6, [[0, 0.35, 76]], 2),
  },

  // Phrases: figures that come round on themselves (the first note a fiftieth of a second in),
  // then lines that end.
  {
    n: 78,
    id: 'bowls-in-a-round-d',
    name: 'Round of bowls {D}',
    kind: 'melodic',
    description:
      'Four struck bowls, {D}, {A}, {F} and {C}, on a four-second loop that fades each pass; it comes round.',
    preset: 'stairwell-choir-bowl-round',
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, feedback: 0.4, wear: 0.1, wow: 0.1, mix: 0.3 },
      },
      stone('Hall', { mix: 0.3 }),
    ],
    ...cycled(
      8,
      [
        [0.02, 4, 50, 0.7],
        [2.31, 4, 57, 0.6],
        [4.6, 4, 65, 0.55],
        [6.42, 3, 60, 0.5],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 79,
    id: 'tines-overdubbed-c',
    name: 'Tines overdubbed {C}',
    kind: 'melodic',
    description:
      'A broken chord of bell-like tines up from {C} that returns four seconds later under {A}, {G} and {C}; it comes round.',
    preset: 'stairwell-choir-overdubbed-tines',
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 4, feedback: 0.4, wear: 0, wow: 0, spread: 0.1, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 1.5, 48, 0.7],
        [0.74, 1.5, 55, 0.6],
        [1.18, 1.5, 64, 0.6],
        [2.31, 2, 71, 0.5],
        [4.47, 1.5, 57, 0.6],
        [5.02, 2, 67, 0.55],
        [6.39, 2, 72, 0.5],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 80,
    id: 'two-strums-kept-f',
    name: 'Strums kept {F}',
    kind: 'melodic',
    description:
      'A chord harp strummed on {F}, {A}, {G} and {F} again, each strum kept on a four-second loop; it comes round.',
    preset: 'stairwell-choir-strum-and-overdub',
    set: { pad: 0, tone: 0.75 },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 4, feedback: 0.55, wear: 0, wow: 0, spread: 0.1 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 2, 53, 0.7],
        [0.02, 2, 60, 0.7],
        [2.23, 2, 57, 0.6],
        [2.23, 2, 64, 0.6],
        [4.27, 2, 55, 0.65],
        [4.27, 2, 62, 0.65],
        [6.41, 2, 53, 0.6],
        [6.41, 2, 60, 0.6],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 81,
    id: 'harp-returning-c',
    name: 'Harp returning {C}',
    kind: 'melodic',
    description:
      'One harp string on {C} and then one on {G}, each note coming back reversed four seconds on; it comes round.',
    preset: 'stairwell-choir-glissando-kept',
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Backwards layers',
        params: { length: 4, feedback: 0.5, spread: 0.2, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 3, 72, 0.7],
        [4.31, 3, 79, 0.6],
      ],
      { passes: 2 },
    ),
    then: [pinned(12)],
  },
  {
    n: 82,
    id: 'harp-in-the-nave-a',
    name: 'Nave harp {A}m',
    kind: 'melodic',
    description:
      'A concert harp figure in {A} minor with soft chorused echoes behind each note; it comes round.',
    preset: 'stairwell-choir-harp-through-delay',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 520, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 4500, mix: 0.35 } },
    ],
    ...cycled(8, [
      [0.02, 1.5, 57, 0.7],
      [0.83, 1.5, 64, 0.6],
      [1.71, 1.5, 69, 0.65],
      [2.94, 2, 72, 0.6],
      [4.36, 1.5, 71, 0.55],
      [5.19, 2, 64, 0.6],
      [6.47, 1.5, 60, 0.5],
    ]),
  },
  {
    n: 83,
    id: 'handpan-round-d',
    name: 'Handpan round {D}',
    kind: 'melodic',
    description:
      'A handpan figure on {D}, {A}, {C} and {F} under soft fingers, far separate echoes behind; it comes round.',
    preset: 'stairwell-choir-atrium-handpan',
    ...cycled(
      8,
      [
        [0.02, 2, 50, 0.75],
        [0.92, 2, 57, 0.6],
        [1.63, 2, 60, 0.55],
        [2.81, 2, 62, 0.65],
        [3.74, 2, 65, 0.5],
        [5.08, 2, 64, 0.6],
        [6.33, 2, 57, 0.55],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 84,
    id: 'tongue-drum-figure-a',
    name: 'Tongue drum figure {A}',
    kind: 'melodic',
    description:
      'A tongue drum figure in {A} minor whose notes return an octave down at half speed; it comes round.',
    preset: 'stairwell-choir-tongue-drum-slow-bed',
    ...cycled(
      8,
      [
        [0.02, 2, 57, 0.7],
        [1.12, 2, 64, 0.6],
        [1.87, 2, 60, 0.55],
        [3.21, 2, 67, 0.6],
        [4.58, 2, 69, 0.65],
        [5.83, 2, 64, 0.55],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 85,
    id: 'thumb-piano-patter-c',
    name: 'Thumb piano patter {C}',
    kind: 'melodic',
    description:
      'A thumb piano figure up from {C} on a concrete landing, short echoes pattering off the walls; it comes round.',
    preset: 'stairwell-choir-landing-thumb-piano',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.18 } },
      stone('Room', { midDecay: 2.2, damping: 12000, mix: 0.3 }),
    ],
    ...cycled(8, [
      [0.02, 0.6, 72, 0.7],
      [0.37, 0.6, 79, 0.6],
      [1.09, 0.6, 76, 0.6],
      [2.31, 0.8, 81, 0.65],
      [2.84, 0.6, 79, 0.55],
      [4.47, 0.8, 72, 0.6],
      [5.12, 0.6, 67, 0.55],
      [6.68, 0.8, 74, 0.6],
    ]),
  },
  {
    n: 86,
    id: 'music-box-turning-g',
    name: 'Music box turning {G}',
    kind: 'melodic',
    description:
      'A music box tune on {G}, {B} and {D} whose last two seconds keep turning under it in a chapel; it comes round.',
    preset: 'stairwell-choir-looped-music-box',
    ...cycled(8, [
      [0.02, 0.8, 79, 0.7],
      [0.52, 0.8, 83, 0.6],
      [1.03, 0.8, 86, 0.65],
      [1.97, 1, 84, 0.6],
      [2.61, 0.8, 81, 0.55],
      [3.6, 1, 79, 0.6],
      [4.72, 0.8, 74, 0.6],
      [5.31, 0.8, 76, 0.55],
      [6.38, 1.2, 79, 0.6],
    ]),
  },
  {
    n: 87,
    id: 'zither-hymn-c',
    name: 'Zither hymn {C}',
    kind: 'melodic',
    description:
      'A chord zither strummed in fifths on {C}, {F}, {G} and {A}, a pad of strings rising behind; it comes round.',
    preset: 'stairwell-choir-chord-zither-hymn',
    ...cycled(8, [
      [0.02, 2.5, 48, 0.7],
      [1.87, 2.5, 53, 0.65],
      [4.31, 2.5, 55, 0.65],
      [6.12, 2.5, 57, 0.6],
    ]),
  },
  {
    n: 88,
    id: 'cold-room-figure-e',
    name: 'Cold room figure {E}m',
    kind: 'melodic',
    description:
      'A clean electric guitar picking up through {E} minor one string at a time, in a bright hard hall; it comes round.',
    preset: 'stairwell-choir-cold-room-guitar',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 450, feedback: 0.2, mix: 0.15 },
      },
      stone('Hall', { midDecay: 3.5, damping: 10000, mix: 0.35 }),
    ],
    ...cycled(8, [
      [0.02, 2, 52, 0.7],
      [0.71, 2, 59, 0.6],
      [1.36, 2, 64, 0.6],
      [2.45, 2, 67, 0.65],
      [3.62, 2, 71, 0.6],
      [4.9, 2, 69, 0.55],
      [6.14, 2, 64, 0.6],
    ]),
  },
  {
    n: 89,
    id: 'side-chapel-figure-f',
    name: 'Side chapel figure {F}',
    kind: 'melodic',
    description:
      'A soft tine piano figure on {F}, {C}, {A} and {E} with strings swelling in behind it; it comes round.',
    preset: 'stairwell-choir-side-chapel-tines',
    ...cycled(8, [
      [0.02, 1.5, 53, 0.7],
      [0.93, 1.5, 60, 0.6],
      [1.49, 1.5, 65, 0.6],
      [2.87, 2, 69, 0.65],
      [3.71, 1.5, 76, 0.55],
      [5.24, 2, 72, 0.6],
      [6.4, 1.5, 67, 0.55],
    ]),
  },
  {
    n: 90,
    id: 'celesta-and-reverse-c',
    name: 'Celesta and reverse {C}',
    kind: 'melodic',
    description:
      'A soft celesta figure up from {C}, each note followed by its own reverse, in a small chapel; it comes round.',
    preset: 'stairwell-choir-celesta-afterwards',
    ...cycled(8, [
      [0.02, 0.8, 72, 0.7],
      [0.86, 0.8, 76, 0.6],
      [1.59, 0.8, 79, 0.65],
      [2.93, 1, 84, 0.6],
      [4.17, 0.8, 83, 0.55],
      [5.04, 0.8, 79, 0.6],
      [6.21, 1, 77, 0.55],
    ]),
  },
  {
    n: 91,
    id: 'handbell-peal-d',
    name: 'Handbell peal {D}',
    kind: 'melodic',
    description:
      'Small cast bells rung down from {A} through {E} to {D}, then to a low {A}, earlier strikes drifting back in a church.',
    preset: 'stairwell-choir-loft-handbells',
    set: { position: 0.667, detune: 0 },
    ...played(
      12,
      [
        [0, 3, 81, 0.7],
        [0.62, 3, 76, 0.65],
        [1.31, 4, 74, 0.7],
        [2.93, 3, 81, 0.5],
        [3.58, 3, 76, 0.5],
        [4.36, 5, 69, 0.6],
      ],
      3,
    ),
  },
  {
    n: 92,
    id: 'nylon-line-a',
    name: 'Nylon line {A}m',
    kind: 'melodic',
    description:
      'A nylon guitar line in {A} minor played with the thumb, turning at half speed underneath, in a chapel.',
    preset: 'stairwell-choir-porch-nylon',
    ...played(
      10,
      [
        [0, 1.5, 57, 0.7],
        [0.74, 1.5, 60, 0.6],
        [1.52, 1.5, 64, 0.65],
        [2.61, 1.5, 62, 0.6],
        [3.43, 1.5, 60, 0.55],
        [4.38, 1.5, 59, 0.55],
        [5.47, 3, 57, 0.65],
      ],
      2.5,
    ),
  },
  {
    n: 93,
    id: 'twelve-string-rising-d',
    name: 'Twelve-string rising {D}',
    kind: 'melodic',
    description:
      'A twelve-string climbing {D}, {A}, {D}, {E} and {A} and left to ring, tuned strings ringing along.',
    preset: 'stairwell-choir-twelve-strings-ringing',
    ...played(
      12,
      [
        [0.02, 7, 50, 0.7],
        [0.59, 7, 57, 0.6],
        [1.24, 6, 62, 0.65],
        [2.1, 6, 64, 0.6],
        [3.16, 6, 69, 0.65],
      ],
      3,
    ),
  },
  {
    n: 94,
    id: 'upright-hymn-c',
    name: 'Upright hymn {C}',
    kind: 'melodic',
    description:
      'Four soft chords on a felted upright, {C}, {F}, {G} and back to {C}, at the front of an empty church.',
    preset: 'stairwell-choir-sanctuary-upright',
    ...played(
      12,
      [
        [0, 2, 48, 0.7],
        [0, 2, 60, 0.6],
        [0, 2, 64, 0.6],
        [1.93, 2, 53, 0.65],
        [1.93, 2, 60, 0.55],
        [1.93, 2, 69, 0.6],
        [3.88, 2, 55, 0.65],
        [3.88, 2, 62, 0.55],
        [3.88, 2, 71, 0.6],
        [6.02, 4, 48, 0.7],
        [6.02, 4, 55, 0.55],
        [6.02, 4, 64, 0.6],
        [6.02, 4, 72, 0.6],
      ],
      3,
    ),
  },
  {
    n: 95,
    id: 'bars-answered-a',
    name: 'Bars answered {A}m',
    kind: 'melodic',
    description:
      'Five soft notes on metal bars in {A} minor, each answered by itself reversed an octave up, on a plate.',
    preset: 'stairwell-choir-bars-answered-backwards',
    ...played(
      11,
      [
        [0, 1.5, 69, 0.7],
        [1.46, 1.5, 72, 0.6],
        [3.02, 1.5, 76, 0.65],
        [4.71, 2, 74, 0.55],
        [6.3, 3, 69, 0.6],
      ],
      3,
    ),
  },
  {
    n: 96,
    id: 'glass-from-the-loft-g',
    name: 'Answering glass {G}',
    kind: 'melodic',
    description:
      'Glass bells on {G}, {D}, {E} and {B} whose notes come back as short loops an octave up, in a cave of echoes.',
    preset: 'stairwell-choir-glass-answered',
    ...played(
      11,
      [
        [0, 2, 67, 0.7],
        [1.68, 2, 74, 0.6],
        [3.41, 2, 76, 0.6],
        [5.33, 3, 71, 0.55],
      ],
      3,
    ),
  },
  {
    n: 97,
    id: 'one-take-piano-c',
    name: 'One take piano {C}',
    kind: 'melodic',
    description:
      'A felt piano note played on six keys through the converters of an early looper, echoes bringing pieces back.',
    preset: 'stairwell-choir-one-take-each',
    source: 'felt-piano-c',
    ...played(
      11,
      [
        [0, 2, 60, 0.7],
        [0.93, 2, 64, 0.6],
        [1.81, 2, 67, 0.6],
        [3.07, 2, 72, 0.65],
        [4.42, 2, 71, 0.55],
        [5.66, 3, 67, 0.6],
      ],
      3,
    ),
  },
  {
    n: 98,
    id: 'loft-hammers-line-g',
    name: 'Loft hammers line {G}',
    kind: 'melodic',
    description:
      'Small hammers on strings in octaves, {G}, {D}, {E} and {G} again, a looper holding the last few seconds.',
    preset: 'stairwell-choir-loft-hammers',
    set: { roll: 0 },
    ...played(
      11,
      [
        [0, 2, 55, 0.7],
        [0.97, 2, 62, 0.6],
        [2.11, 2, 64, 0.6],
        [3.42, 4, 67, 0.65],
      ],
      3,
    ),
  },
  {
    n: 99,
    id: 'vibes-hymn-c',
    name: 'Vibes hymn {C}',
    kind: 'melodic',
    description:
      'A vibraphone line on {C}, {G}, {E} and {D} under soft mallets, the motor turning slowly, in a long hall.',
    preset: 'stairwell-choir-rolled-vibes-hymn',
    set: { roll: 0, volume: -8 },
    ...played(
      11,
      [
        [0, 2, 60, 0.7],
        [0.93, 2, 67, 0.6],
        [1.71, 2, 72, 0.6],
        [3.04, 2, 76, 0.65],
        [4.21, 2, 74, 0.55],
        [5.83, 4, 72, 0.6],
      ],
      3,
    ),
  },
  {
    n: 100,
    id: 'her-own-round-d',
    name: 'Her own round {D}',
    kind: 'melodic',
    description:
      'One lower voice on oh sings {D}, {F}, {E} and a low {A}, each note coming back two seconds later, in a stone nave.',
    preset: 'stairwell-choir-round-with-herself',
    // Sung notes and not held ones, and a loop that lets each go after a few turns.
    set: { attack: 0.03, release: 0.5 },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2, feedback: 0.4, wear: 0, wow: 0.05, spread: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    ...played(
      12,
      [
        [0, 1, 62, 0.8],
        [1.37, 0.9, 65, 0.7],
        [2.71, 1.2, 64, 0.75],
        [4.83, 1.6, 57, 0.7],
      ],
      3,
    ),
  },
])
