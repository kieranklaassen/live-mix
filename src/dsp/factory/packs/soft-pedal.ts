import { type FactoryPreset } from '../types'

// A piano played with the soft pedal down, a copy a few cents sharp on one side and flat on
// the other, and a room that takes most of a minute to empty. Everything else in the pack is
// brought into that same room: few notes, low dynamics, the top rolled off, the tail left on.

export const PRESETS: readonly FactoryPreset[] = [
  // Felt piano: the centre of the pack. Soft pedal down, its own room off, the long room after it.
  {
    id: 'soft-pedal-lid-nearly-closed',
    name: 'Lid nearly closed',
    category: 'keys',
    description:
      'A soft-pedalled piano with a copy a few cents sharp on the left and flat on the right, hung in a very long dark room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.85,
        hardness: 0.2,
        detune: 0.6,
        thump: 0.35,
        pedalNoise: 0.2,
        soft: 1,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -11,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.8, decay: 22, modDepth: 0.5, modRate: 0.25, highCut: 3800, mix: 0.5 },
      },
    ],
  },
  {
    id: 'soft-pedal-left-pedal-hall',
    name: 'Left pedal hall',
    category: 'keys',
    description:
      'A piano with the felt lifted and only the soft pedal down, in a hall of eight seconds that is then tipped a few cents out of tune.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.1,
        hardness: 0.45,
        soft: 1,
        resonance: 0,
        reverbMix: 0,
        width: 0.7,
        polyphony: 12,
        outputDb: -13,
      },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 7.5, damping: 3200, mix: 0.5 },
      },
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { detune: 6, drift: 0.3 } },
    ],
  },
  {
    id: 'soft-pedal-both-pedals-down',
    name: 'Both pedals down',
    category: 'keys',
    description:
      'Both pedals down: muffled notes that never damp, widened a little and left in a twenty second room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.7,
        hardness: 0.25,
        soft: 1,
        sustain: 1,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 8,
        outputDb: -13.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.3 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 20, size: 2, damping: 0.6, breathDepth: 0, mix: 0.5 },
      },
    ],
  },
  {
    id: 'soft-pedal-four-slow-notes',
    name: 'Four slow notes',
    category: 'keys',
    description:
      'Four felted notes high on the keyboard, faintly doubled, their long dark tail drifting down toward the octave below.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.6,
        hardness: 0.4,
        thump: 0.15,
        action: 0.2,
        pedalNoise: 0,
        soft: 1,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: 0,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 28, mix: 0.55 } },
    ],
    preview: 'bells',
  },
  {
    id: 'soft-pedal-piano-without-hammers',
    name: 'Piano without hammers',
    category: 'pad',
    description:
      'The strike is faded out of every note, so only a thick detuned after-ring arrives and swells into the room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.8,
        thump: 0,
        action: 0,
        pedalNoise: 0,
        soft: 1,
        sustain: 1,
        resonance: 0,
        reverbMix: 0,
        polyphony: 8,
        outputDb: -3.5,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 700 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { detune: 14 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 18, highCut: 4500, mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-thump-and-low-strings',
    name: 'Thump and low strings',
    category: 'keys',
    description:
      'A heavily felted upright heard from the next room: thump and low strings, no top, room rumble, a short dull hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 1,
        hardness: 0.15,
        thump: 0.8,
        soft: 1,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -10,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Just the room',
        params: { distance: 0.9, room: 0.8, treble: -0.6 },
      },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -42 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 2500, mix: 0.3 } },
    ],
  },
  {
    id: 'soft-pedal-piano-with-slow-shadow',
    name: 'Piano with slow shadow',
    category: 'keys',
    description:
      'Each phrase comes back an octave lower and twice as slow under the soft piano, both in a cathedral.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        hardness: 0.3,
        soft: 1,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { highCut: 4000, mix: 0.45 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-empty-hall-tape',
    name: 'Empty hall tape',
    category: 'keys',
    description:
      'The piano and a long plate recorded together to slow tape, so the room wavers along with the keys.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.6,
        soft: 1,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -16,
      },
    },
    effects: [
      {
        deviceId: 'plate-reverb',
        preset: 'Long plate',
        params: { decay: 0.93, damping: 0.45, mix: 0.45 },
      },
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.45, flutter: 0.1, age: 0.3, hiss: 0.12 },
      },
    ],
  },
  {
    id: 'soft-pedal-dampers-lifted',
    name: 'Dampers lifted',
    category: 'keys',
    description:
      'Pedal down so the other strings ring along, and a second bank of strings tuned to D minor answers in a long wash.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.55,
        hardness: 0.3,
        soft: 1,
        pedalNoise: 0,
        sustain: 1,
        resonance: 0.8,
        reverbMix: 0,
        polyphony: 8,
        outputDb: -17,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { root: 2, mode: 1, mix: 0.4 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.5, mix: 0.3 } },
    ],
  },

  // Tine piano: the electric piano of the same records, with chorus, phaser and the long room.
  {
    id: 'soft-pedal-electric-piano-haze',
    name: 'Electric piano haze',
    category: 'keys',
    description:
      'A struck chord of round dark tines left to ring through a slow two-voice chorus, half lost in a cathedral.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.25, hardness: 0.35, decay: 2.6, release: 1.5, tone: 0.3, volume: -16 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, depth: 35, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-phased-dusk-tines',
    name: 'Phased dusk tines',
    category: 'keys',
    description:
      'Long tines with the tremolo off, turned over by a six-stage phaser once in sixteen seconds, in a large hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { hardness: 0.45, tremolo: 0, tone: 0.4, volume: -15 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 14, size: 1.8, damping: 0.55, mix: 0.45 },
      },
    ],
  },
  {
    id: 'soft-pedal-few-cents-wide',
    name: 'Few cents wide',
    category: 'keys',
    description:
      'Soft tines doubled eleven cents sharp and flat, with no tremolo, ringing into a twenty-five second space.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.4, decay: 2.2, release: 1.2, tone: 0.35, volume: -14.5 },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        preset: 'Classic',
        params: { detune: 11, drift: 0.3, tone: 5000 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.75, decay: 25, highCut: 4200, mix: 0.5 },
      },
    ],
  },
  {
    id: 'soft-pedal-bell-tine-afterglow',
    name: 'Bell tine afterglow',
    category: 'keys',
    description:
      'Bell-like tines struck softly, with a faint octave rising in a twelve second tail behind each one.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bark: 0.05, decay: 2, hardness: 0.5, tremolo: 0, tone: 0.5, volume: -11 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Plain hall',
        params: { decay: 12, shimmer: 0.15, size: 0.8, tone: 4000, mix: 0.45 },
      },
    ],
    preview: 'bells',
  },
  {
    id: 'soft-pedal-slow-pan-tines',
    name: 'Slow pan tines',
    category: 'keys',
    description:
      'Tines that cross from side to side every two seconds, three dull tape heads behind them and a long plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { hardness: 0.5, tone: 0.4, volume: -15 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 620, feedback: 0.55, highCut: 2600, mix: 0.35 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'soft-pedal-tines-without-strike',
    name: 'Tines without strike',
    category: 'pad',
    description:
      'The attack is taken off an electric piano chord, which fades in through an ensemble chorus and a swelling room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.3, tremolo: 0, tone: 0.4, volume: -11 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-low-murky-tines',
    name: 'Low murky tines',
    category: 'keys',
    description:
      'A low fifth on round tines with little bell, with slow dull repeats that blur into a dark five second hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.2, bark: 0.3, decay: 2.5, release: 1, tone: 0.4, volume: -14 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 5, midDecay: 4, damping: 3000, mix: 0.4 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'soft-pedal-across-the-room',
    name: 'Across the room',
    category: 'keys',
    description:
      'An electric piano through a slowly turning speaker heard from the far wall, with a long wash behind it.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.35,
        bark: 0.4,
        decay: 1.4,
        release: 0.6,
        hardness: 0.55,
        tremolo: 0,
        tone: 0.45,
        volume: -16,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.5, mix: 0.3 } },
    ],
  },

  // Glass: the glassy digital keys and slow pads that sit in the same haze.
  {
    id: 'soft-pedal-treated-glass-keys',
    name: 'Treated glass keys',
    category: 'keys',
    description:
      'Soft FM electric piano doubled a few cents either side, in a twenty second room with the top rolled off.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: {
        brightness: 0.28,
        decay: 3,
        release: 2,
        detune: 7,
        feedback: 0.15,
        velocity: 0.5,
        spread: 0.7,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { tone: 5000 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 20, highCut: 5000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'soft-pedal-beating-glass-pad',
    name: 'Beating glass pad',
    category: 'pad',
    description:
      'A glass pad that fades in over three seconds, its operators beating slowly, held in a cathedral.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { brightness: 0.22, attack: 3, spread: 0.45, volume: -17 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } }],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-low-dark-bowl',
    name: 'Low dark bowl',
    category: 'bell',
    description:
      'A low fifth of slow bowl tones with a soft strike, in an eighteen second room that breathes.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { ratio: 1, brightness: 0.42, decay: 12, attack: 0.05, detune: 7, volume: -12.7 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 18, size: 2, damping: 0.65, breathDepth: 0.3, mix: 0.45 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'soft-pedal-glass-vibes-chorus',
    name: 'Glass vibes chorus',
    category: 'bell',
    description:
      'Dull FM vibraphone notes that ring four seconds, drifting in a very slow chorus and a long dull hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        brightness: 0.24,
        decay: 4,
        release: 3,
        detune: 6,
        velocity: 0.5,
        spread: 0.6,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { depth: 40, mix: 0.3 } },
      {
        deviceId: 'shimmer',
        preset: 'Plain hall',
        params: { decay: 9, size: 0.7, tone: 4000, width: 0.7, mix: 0.4 },
      },
    ],
  },
  {
    id: 'soft-pedal-dulled-high-glass',
    name: 'Dulled high glass',
    category: 'bell',
    description:
      'High glass bells with everything above six kilohertz cut, small and far off in a ten second hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: {
        ratio: 9,
        brightness: 0.3,
        decay: 3.5,
        release: 4,
        detune: 8,
        velocity: 0.4,
        spread: 0.3,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 10, size: 1.5, damping: 0.6, mix: 0.4 },
      },
    ],
  },
  {
    id: 'soft-pedal-pale-blooming-pad',
    name: 'Pale blooming pad',
    category: 'pad',
    description:
      'A slow FM pad twelve cents wide whose reverb tail turns over and climbs an octave as it fades.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { brightness: 0.26, attack: 2.4, release: 7, detune: 12, spread: 0.45, volume: -16 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        preset: 'Octave halo',
        params: { bloom: 0.5, season: 2, decay: 14, mix: 0.45 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-backwards-chimes',
    name: 'Backwards chimes',
    category: 'bell',
    description:
      'Short glass chimes, each followed two seconds later by itself played backwards, in a six second hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { brightness: 0.4, decay: 2, detune: 10, volume: -4 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1800, mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 6, midDecay: 5, mix: 0.4 } },
    ],
  },

  // Bells: vibraphone bars, bowls and bronze, struck softly or not struck at all.
  {
    id: 'soft-pedal-motor-off-vibraphone',
    name: 'Motor off vibraphone',
    category: 'bell',
    description:
      'A slow broken chord on vibraphone bars, soft mallet and no motor, doubled seven cents wide in a twenty-four second room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { decay: 10, hardness: 0.2, detune: 0.6, release: 0.3, spread: 0.5, volume: -9 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { detune: 7, mix: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.7, decay: 24, highCut: 4000, mix: 0.45 },
      },
    ],
    preview: 'keys',
  },
  {
    id: 'soft-pedal-rubbed-bowl-haze',
    name: 'Rubbed bowl haze',
    category: 'bell',
    description:
      'Five bowls rubbed rather than struck, held as a chord and left in a space that takes most of a minute to empty.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { brightness: 0.35, spread: 0.7, volume: -13.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Event horizon', params: { decay: 40, mix: 0.45 } }],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-glass-rims-room',
    name: 'Glass rims room',
    category: 'bell',
    description:
      'Wet fingers on glass rims, each note beating against itself, in the largest twenty second room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { detune: 2, brightness: 0.3, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 20, size: 2, damping: 0.55, mix: 0.5 },
      },
    ],
  },
  {
    id: 'soft-pedal-three-head-chimes',
    name: 'Three head chimes',
    category: 'bell',
    description:
      'Chime bars struck with a softer hammer, repeated by three wavering tape heads into a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 5, hardness: 0.45, detune: 0.8, brightness: 0.4, volume: 2 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 480, feedback: 0.45, wow: 0.35, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'soft-pedal-next-town-bell',
    name: 'Next town bell',
    category: 'bell',
    description:
      'A church bell with its top cut at four and a half kilohertz, coming back as sparse far echoes.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 30, hardness: 0.4, brightness: 0.3, volume: -5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { lowCut: 80, highCut: 4500 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'soft-pedal-bronze-without-strike',
    name: 'Bronze without strike',
    category: 'bell',
    description:
      'A gong with its strike faded out, so only the slow beating metal swells up and drifts downward.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { hardness: 0.2, brightness: 0.55, volume: 6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1200 } },
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.45 } },
    ],
    preview: 'hold',
  },
  {
    id: 'soft-pedal-slowed-thumb-keys',
    name: 'Slowed thumb keys',
    category: 'bell',
    description:
      'A thumb piano mostly replaced by itself at half speed, an octave down and twice as long, in a cathedral.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 4, damping: 0.5, hardness: 0.4, release: 0.5, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 1600, smooth: 0.8, highCut: 5000, mix: 0.7 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // Harp: plucked with the flat of the finger, a few notes at a time.
  {
    id: 'soft-pedal-detuned-room-harp',
    name: 'Detuned room harp',
    category: 'plucked',
    description:
      'A softly plucked harp in an eighteen second room, the whole room then spread eight cents wide.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.42, touch: 0.2, decay: 1.6, halo: 0.7, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 18, highCut: 4500, mix: 0.45 },
      },
      {
        deviceId: 'stereo-detune',
        preset: 'Classic',
        params: { detune: 8, drift: 0.35, tone: 5000, mix: 0.3 },
      },
    ],
  },
  {
    id: 'soft-pedal-long-ring-harp',
    name: 'Long ring harp',
    category: 'plucked',
    description:
      'Harp strings plucked at the middle with almost no finger noise, ringing three times as long, in a cathedral.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.1, volume: -7 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } }],
  },
  {
    id: 'soft-pedal-rolled-harp-chord',
    name: 'Rolled harp chord',
    category: 'plucked',
    description:
      'A chord rolled slowly from the lowest string to the highest over more than a second, with dark repeats and a long plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { pluck: 0.4, touch: 0.35, halo: 0.9, sweep: 1.3, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 560, feedback: 0.4, mix: 0.25 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-damped-harp-tail',
    name: 'Damped harp tail',
    category: 'plucked',
    description:
      'Harp strings stopped with the hand, short and dry, against a twenty second room just behind them.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { touch: 0.25, damp: 0.9, volume: -3 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 20, size: 2, damping: 0.5, predelayMs: 60, mix: 0.55 },
      },
    ],
  },
  {
    id: 'soft-pedal-bent-silk-strings',
    name: 'Bent silk strings',
    category: 'plucked',
    description:
      'Silk strings touched lightly, each note leaning a little sharp after the pluck, in a very slow chorus and a long plain hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { decay: 2, bend: 30, volume: 3.3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { depth: 40, spread: 60, mix: 0.4 } },
      {
        deviceId: 'shimmer',
        preset: 'Plain hall',
        params: { decay: 14, size: 0.8, tone: 4500, width: 0.7, mix: 0.35 },
      },
    ],
  },
  {
    id: 'soft-pedal-harp-and-strings',
    name: 'Harp and strings',
    category: 'plucked',
    description:
      'A soft string section grows out of each harp note, stays on after it for many seconds and shares its hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { touch: 0.3, decay: 1.3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering', params: { mix: 0.4 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 5, midDecay: 4.5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'soft-pedal-octave-under-harp',
    name: 'Octave under harp',
    category: 'plucked',
    description:
      'A low fifth on long harp strings with the octave below added, in a dark room whose tail sinks further.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.48, touch: 0.15, decay: 2.5, halo: 0.6, body: 0.9, volume: -4.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5, filter: 800 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.5 } },
    ],
    preview: 'low',
  },

  // Mallets: vibraphone first, then celesta, marimba and glockenspiel, all with soft mallets.
  {
    id: 'soft-pedal-far-hall-vibes',
    name: 'Far hall vibes',
    category: 'bell',
    description:
      'A vibraphone with the softest mallet, motor off and pedal down, a faint detuned double and a cathedral.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.15, decay: 2.5, damper: 0, width: 0.7, volume: -10 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { detune: 6 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'soft-pedal-throbbing-long-bars',
    name: 'Throbbing long bars',
    category: 'bell',
    description:
      'Vibraphone with its motor turning twice a second, long bars throbbing gently in a twelve second hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.25, decay: 2, motor: 0.5, motorRate: 2, volume: -8 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 12, size: 1.6, mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-blurred-vibes-roll',
    name: 'Blurred vibes roll',
    category: 'bell',
    description:
      'A vibraphone chord rolled seven times a second with very soft mallets until it blurs into a long room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { mallet: 0.1, roll: 7, volume: -16.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 20, mix: 0.45 } }],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-lid-down-celesta',
    name: 'Lid down celesta',
    category: 'bell',
    description:
      'A celesta played quietly and lightly damped, widened a touch, in a long plate with the highs taken down.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.15, decay: 1.5, damper: 0.3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.55, mix: 0.4 } },
    ],
  },
  {
    id: 'soft-pedal-low-marimba-roll',
    name: 'Low marimba roll',
    category: 'bell',
    description:
      'A marimba chord rolled softly over its resonators, printed to tape and set in a dark six second hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.1, roll: 8, volume: -16 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 6, midDecay: 4, damping: 3000, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-glockenspiel-echoes',
    name: 'Glockenspiel echoes',
    category: 'bell',
    description:
      'A glockenspiel with a softer mallet and its top cut, heard mostly as sparse echoes from a long way off.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.4, decay: 1.5, width: 0.6, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 7000 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { highCut: 4000, mix: 0.45 } },
    ],
  },

  // Acoustic guitar: thumb and fingertip only, nothing picked hard.
  {
    id: 'soft-pedal-long-room-nylon',
    name: 'Long room nylon',
    category: 'plucked',
    description:
      'A nylon guitar played with the flesh of the thumb, faintly doubled, each note left in a sixteen second room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.1, sustain: 8, release: 4, tone: 0.4, strum: 35, volume: 0 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { detune: 7 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 16, highCut: 4500, mix: 0.45 },
      },
    ],
  },
  {
    id: 'soft-pedal-steel-held-over',
    name: 'Steel held over',
    category: 'plucked',
    description:
      'Steel strings with the pick softened; what is played is caught and held as a dark bed underneath, in a plain hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { nail: 0.2, tone: 0.45, strum: 50, volume: -2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      {
        deviceId: 'sustainer',
        preset: 'Dark bed',
        params: { sensitivity: 0.7, decay: 20, mix: 0.4 },
      },
      {
        deviceId: 'shimmer',
        preset: 'Plain hall',
        params: { decay: 8, size: 0.7, tone: 4500, width: 0.6, mix: 0.4 },
      },
    ],
  },

  // Atmosphere: what the room sounds like when nobody is playing.
  {
    id: 'soft-pedal-draught-under-door',
    name: 'Draught under door',
    category: 'texture',
    description:
      'Low wind with a faint whistle on the held key, under a filter that opens and shuts over fourteen seconds, in a hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.3,
        movement: 0.4,
        tone: 0.3,
        resonance: 0.3,
        attack: 3,
        release: 8,
        width: 0.5,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { slope: 1, cutoffHz: 1200, lfoAmount: 25, lfoRateHz: 0.07 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 5, midDecay: 4, mix: 0.4 } },
    ],
  },
  {
    id: 'soft-pedal-amplifier-left-on',
    name: 'Amplifier left on',
    category: 'texture',
    description:
      'Mains hum tuned to a low fifth, like an amplifier left on next door, rising and sinking at random in a large hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { movement: 0.5, tone: 0.3, attack: 2, release: 6, volume: -10.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 12, size: 1.6, mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Aurora: the dark two-layer synth pads that lie under the keys.
  {
    id: 'soft-pedal-dark-brass-half-lost',
    name: 'Dark brass, half lost',
    category: 'pad',
    description:
      'A dark brass-like synth pad that speaks in two seconds and fades over six, half lost in a cathedral.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 600, attack: 2.2, release: 6, detune: 10, volume: -13 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } }],
  },
  {
    id: 'soft-pedal-smeared-brass-swell',
    name: 'Smeared brass swell',
    category: 'pad',
    description:
      'A chord that opens over three seconds and keeps swelling while held, its spectrum smeared, in a breathing room.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 500, release: 10, detune: 12, volume: -9 },
    },
    effects: [
      { deviceId: 'spectral-blur', params: { mix: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 16, size: 1.8, mix: 0.45 },
      },
    ],
  },

  // Bow: one viola line, and strings held with no bow at all.
  {
    id: 'soft-pedal-far-end-viola',
    name: 'Far end viola',
    category: 'string',
    description:
      'One bowed string with light pressure and little vibrato, faintly doubled either side, at the far end of a cathedral.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 1,
        release: 2.5,
        pressure: 0.35,
        body: 0.7,
        vibrato: 0.15,
        detune: 3,
        volume: -7.6,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { detune: 6, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    preview: 'line',
  },
  {
    id: 'soft-pedal-held-string-halo',
    name: 'Held string halo',
    category: 'string',
    description:
      'Strings kept singing by a magnetic sustainer, swelling in over two seconds through an ensemble chorus into a long room.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 1,
        attack: 2,
        release: 5,
        brightness: 0.35,
        decay: 12,
        detune: 9,
        volume: -12.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 18, width: 0.65, mix: 0.45 } },
    ],
  },

  // Chamber strings: a small section with mutes on, or hardly bowing.
  {
    id: 'soft-pedal-mutes-on-section',
    name: 'Mutes on section',
    category: 'string',
    description:
      'Four players a part with mutes on and no vibrato, swelling in over two seconds into a long damped plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 4, attack: 2, release: 4, scatter: 0.5, width: 0.55, volume: -7 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'soft-pedal-bows-barely-touching',
    name: 'Bows barely touching',
    category: 'string',
    description:
      'Three players with no bow weight and no vibrato, airy and still, doubled a little wide in the largest room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 2.5, release: 5, air: 0.5, volume: -8 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { detune: 6, mix: 0.3 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 18, size: 2, damping: 0.5, mix: 0.5 },
      },
    ],
  },

  // Choir: wordless voices, a long way back.
  {
    id: 'soft-pedal-wordless-high-voices',
    name: 'Wordless high voices',
    category: 'voice',
    description:
      'High wordless voices on an open ah with almost no vibrato, arriving slowly from the back of a cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: {
        vowel: 0.1,
        voice: 1.3,
        breath: 0.3,
        vibrato: 3,
        attack: 1.5,
        release: 4,
        tone: 5000,
        volume: -11,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } }],
  },
  {
    id: 'soft-pedal-slow-vowels-hall',
    name: 'Slow vowels hall',
    category: 'voice',
    description:
      'Voices drifting from vowel to vowel, in a hall whose twenty second tail is itself shaped like a sung ah.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 3.5, tone: 4000, volume: -10 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
  },

  // Chord harp: brushed, never strummed hard.
  {
    id: 'soft-pedal-brushed-chord-room',
    name: 'Brushed chord room',
    category: 'plucked',
    description:
      'The held chord brushed across one octave of dull strings over a soft pad, detuned and left in a cathedral.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { sustain: 6, tone: 0.2, pad: 0.4, volume: -11 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-slow-swept-chord',
    name: 'Slow swept chord',
    category: 'plucked',
    description:
      'Each key sweeps the chord slowly up and down four octaves; a reverb that swells in after it, then a long plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 150, sustain: 7, tone: 0.25, volume: -3.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 3.5, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // Clarinet: the soft reed and the breathy saxophone of the early pieces.
  {
    id: 'soft-pedal-back-row-subtone',
    name: 'Back row subtone',
    category: 'wind',
    description:
      'A saxophone played at a breathy subtone with a little vibrato, a single line from the far side of a cathedral.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { blow: 0.15, breath: 0.9, attack: 0.3, release: 1.2, vibrato: 0.25, volume: -7.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } }],
  },
  {
    id: 'soft-pedal-two-second-clarinets',
    name: 'Two-second clarinets',
    category: 'wind',
    description:
      'Clarinets that take two seconds to speak, doubled eight cents wide, held as a chord in a room that swells.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.4, breath: 0.55, volume: -11 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { detune: 8 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 16, mix: 0.45 } },
    ],
    preview: 'chord',
  },

  // Drone: the low dark side of the same rooms.
  {
    id: 'soft-pedal-unlit-cellar',
    name: 'Unlit cellar',
    category: 'drone',
    description:
      'A just minor drone with a heavy sub, dull and slowly shifting, on wavering tape in a room that hardly decays.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { air: 0.25, cutoff: 700, attack: 3, volume: -9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, hiss: 0.15 } },
      { deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'soft-pedal-hall-floor-drone',
    name: 'Hall floor drone',
    category: 'drone',
    description:
      'Octaves and sub with the filter low, thickened by a tape preamp, at the bottom of a dark well of short echoes.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { sub: 0.4, cutoff: 600, attack: 3, volume: -16 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.4 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } },
    ],
  },

  // Dusk: the chorus polysynth with its filter nearly shut. Its own chorus is the only one.
  {
    id: 'soft-pedal-lamp-turned-low',
    name: 'Lamp turned low',
    category: 'pad',
    description:
      'The chorus polysynth with its filter closed to nine hundred hertz, slow to speak, in a damped cathedral.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { sub: 0.45, cutoff: 900, envelope: 0.15, attack: 1.8, release: 5, volume: -12.5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 3000, mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-dusk-filter-opening',
    name: 'Dusk filter opening',
    category: 'pad',
    description:
      'A chord that starts almost shut and opens over three seconds under both choruses, in a twenty second space.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 250, release: 10, chorus: 3, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 20, highCut: 5000, mix: 0.4 },
      },
    ],
  },

  // Ember: two soft subtractive pads, one mid, one low.
  {
    id: 'soft-pedal-closed-lid-pad',
    name: 'Closed lid pad',
    category: 'pad',
    description:
      'A two-oscillator pad with the filter at seven hundred hertz, turned over by a slow phaser, in a sixteen second hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { cutoff: 700, ampAttack: 2, ampRelease: 6, volume: -4.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 16, size: 1.9, mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-dark-fifth-below',
    name: 'Dark fifth below',
    category: 'drone',
    description:
      'A low fifth of saw and pulse under a filter that barely opens, in a dark room whose tail sinks an octave.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { subLevel: 0.2, cutoff: 420, ampAttack: 2.5, volume: -6.6 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.5 } }],
    preview: 'low',
  },

  // Flute: low, breathy, never bright.
  {
    id: 'soft-pedal-mostly-breath-flute',
    name: 'Mostly breath flute',
    category: 'wind',
    description:
      'A low flute blown softly, more breath than tone, a slow line doubled a few cents either side at the far end of a cathedral.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { breath: 0.6, attack: 0.9, vibrato: 0.2, volume: -11 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { detune: 5, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-breath-chord-haze',
    name: 'Breath chord haze',
    category: 'wind',
    description:
      'Low flutes that are nearly all breath, held as a chord, drifting in a slow chorus and an eighteen second room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 2, release: 4, volume: -14.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 18, mix: 0.45 } },
    ],
    preview: 'chord',
  },

  // Grain: written for whatever is loaded; the previews play its built-in soft tone.
  {
    id: 'soft-pedal-one-frozen-instant',
    name: 'One frozen instant',
    category: 'pad',
    description:
      'One instant of whatever sound is loaded, held still and dull, doubled wide and left in a twenty second room.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { detune: 8, attack: 2, release: 5, spread: 0.35, tone: 2500, volume: -19.8 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { mix: 0.28 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 20, width: 0.6, mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-backwards-dissolve',
    name: 'Backwards dissolve',
    category: 'pad',
    description:
      'Long grains of the loaded sound played backwards, their spectrum left hanging and dissolving, in a cathedral.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { attack: 3, spread: 0.2, tone: 3500, volume: -22 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.15, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
      { deviceId: 'stereo-widener', params: { width: 0.4 } },
    ],
  },

  // Guitar: clean, chorused and washed out, or faded in with the pedal.
  {
    id: 'soft-pedal-chorus-guitar-wash',
    name: 'Chorus guitar wash',
    category: 'plucked',
    description:
      'A softly strummed clean guitar in an ensemble chorus, three tape heads and a long plate: more wash than notes.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { hardness: 0.25, tone: 2600, volume: 1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { spread: 60, mix: 0.4 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 450, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'soft-pedal-volume-pedal-guitar',
    name: 'Volume pedal guitar',
    category: 'plucked',
    description:
      'Guitar notes faded in so no pick is heard, lifted by a slow compressor, thickly doubled in a twenty second room.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { tone: 2400, swell: 1.5, volume: 6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { makeup: 12, mix: 1 } },
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 20, mix: 0.45 } },
    ],
    preview: 'chord',
  },

  // Handpan: fingertips only, and a tongue drum treated like the piano.
  {
    id: 'soft-pedal-fingertip-pan-loop',
    name: 'Fingertip pan loop',
    category: 'bell',
    description:
      'A steel pan touched with the pads of the fingers; the last notes loop underneath at half speed, in a cathedral.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 5, touch: 0.1, shimmer: 0.2, damp: 0.3, volume: -2 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Half speed',
        params: { fade: 0.45, tone: 4000, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-tongue-drum-hush',
    name: 'Tongue drum hush',
    category: 'bell',
    description:
      'Soft tongue drum notes with a pitch-shifted copy nine cents either side, ringing into a dark sixteen second room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 8, touch: 0.1, volume: -2 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Doubler', params: { tone: 5000, mix: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 16, size: 2, damping: 0.6, mix: 0.45 },
      },
    ],
  },

  // Horns: a soft section far away, and one flugelhorn.
  {
    id: 'soft-pedal-late-soft-horns',
    name: 'Late soft horns',
    category: 'wind',
    description:
      'A section of horns blown gently, taking three seconds to arrive on each chord, in a fourteen second hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.4, attack: 3, release: 5, volume: -10 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 14, size: 2, damping: 0.5, breathDepth: 0, mix: 0.45 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'soft-pedal-lone-flugelhorn',
    name: 'Lone flugelhorn',
    category: 'wind',
    description:
      'One breathy flugelhorn with a dull single-head tape echo behind it, alone in a long damped plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.4, release: 2, vibrato: 0.2, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { heads: 0, time: 700, feedback: 0.4, highCut: 2500, mix: 0.25 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5, mix: 0.4 } },
    ],
  },

  // Ladder bass: only ever a soft floor under the keys.
  {
    id: 'soft-pedal-sub-under-piano',
    name: 'Sub under piano',
    category: 'keys',
    description:
      'A plain soft sub tone with a little tape saturation, to sit an octave under a piano in a small hall.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 160, volume: -21 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -2, driveDb: 6 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 4, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'soft-pedal-gliding-synth-line',
    name: 'Gliding synth line',
    category: 'keys',
    description:
      'One synth voice whose filter opens slowly on each note and glides to the next, faintly doubled, in a cathedral.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: { cutoff: 300, contour: 0.6, decay: 8, glide: 0.4, volume: -4 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },

  // Organ: pipes heard through a door, and a harmonium with a rotor.
  {
    id: 'soft-pedal-closed-door-pipes',
    name: 'Closed door pipes',
    category: 'organ',
    description:
      'Flue pipes three seconds slow with a beating celeste rank and all the top removed, doubled wide in a cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { tone: 1000, volume: -13.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { detune: 6 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'soft-pedal-bellows-and-rotor',
    name: 'Bellows and rotor',
    category: 'organ',
    description:
      'Celeste reeds over a breathing bellows, through a slowly rotating speaker heard from across a large hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { bellows: 0.6, tone: 1500, volume: -14 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 12, size: 1.8, mix: 0.4 } },
    ],
  },

  // Outdoors: what comes in through the open window.
  {
    id: 'soft-pedal-open-window-crickets',
    name: 'Open window crickets',
    category: 'texture',
    description:
      'A field of crickets a long way off, the edge taken off, set back in a wide space, to lie under slow piano notes.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Evening field',
      params: { tone: 0.25, volume: 3.8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 7000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-smeared-wind-chimes',
    name: 'Smeared wind chimes',
    category: 'texture',
    description:
      'A few wind chimes tuned to the held key, struck now and then at a distance and smeared into a soft cloud of grains.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { density: 0.3, distance: 0.6, tone: 0.4, volume: -2.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { size: 400, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },

  // Pedal steel: the volume pedal does the playing.
  {
    id: 'soft-pedal-steel-without-pick',
    name: 'Steel without pick',
    category: 'plucked',
    description:
      'Steel guitar with the pick removed by the volume pedal and no vibrato, doubled wide in a twenty second room.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, sustain: 30, tone: 1900, volume: -8 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { detune: 7 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 20, highCut: 4500, mix: 0.45 },
      },
    ],
  },
  {
    id: 'soft-pedal-slow-slides-recalled',
    name: 'Slow slides recalled',
    category: 'plucked',
    description:
      'Steel notes that slide a long way into one another, with moments from earlier drifting back, in a cathedral.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.8, vibrato: 4, tone: 2400, volume: -6 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Far back', params: { tone: 3500, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },

  // Sampler: written for whatever is loaded; the previews play its built-in soft tone.
  {
    id: 'soft-pedal-loaded-sound-treated',
    name: 'Loaded sound treated',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down on a slow unsteady loop, doubled a few cents wide in a very long room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.2, release: 4, tone: 3200, volume: -17 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 20, mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-backwards-hall-swell',
    name: 'Backwards hall swell',
    category: 'keys',
    description:
      'Whatever is loaded played backwards once per key through early converters, swelling into a cathedral.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { release: 2, tone: 5000, volume: -15 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },

  // String machine: the ensemble with its tone turned right down.
  {
    id: 'soft-pedal-string-ensemble-hush',
    name: 'String ensemble hush',
    category: 'string',
    description:
      'A slow string ensemble with its tone turned down, three seconds to speak, in the largest twenty second room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 3, release: 7, tone: 1400, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 20, size: 2, damping: 0.6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'soft-pedal-low-octave-strings',
    name: 'Low octave strings',
    category: 'string',
    description:
      'Only the low octave of the string ensemble, dull and slow on a low fifth, worn by reel tape in a five second hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.5, release: 4, tone: 900, volume: -4.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 5, midDecay: 4, mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Tanpura: slowed and plain, a string drone rather than a raga.
  {
    id: 'soft-pedal-plain-four-strings',
    name: 'Plain four strings',
    category: 'drone',
    description:
      'Four strings plucked round slowly with no buzz at the bridge, plain and soft, in a twenty second room.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 9, volume: -4 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 20, highCut: 4000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'soft-pedal-closed-bridge-drone',
    name: 'Closed bridge drone',
    category: 'drone',
    description:
      'A drone lute with only a little buzz at the bridge, each slow pluck doubled wide and left in a cathedral.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { speed: 6, decay: 12, detune: 4, volume: -4 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { detune: 6 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },

  // Tape orchestra: a tape-replay keyboard heard from the back of the hall.
  {
    id: 'soft-pedal-dim-tape-choir',
    name: 'Dim tape choir',
    category: 'voice',
    description:
      'A choir on a tape-replay keyboard with the tone turned down, slow to speak, at the back of a cathedral.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { age: 0.4, tone: -0.4, attack: 0.8, release: 3, volume: -10.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } }],
  },
  {
    id: 'soft-pedal-half-speed-flutes',
    name: 'Half speed flutes',
    category: 'wind',
    description:
      'Tape flutes at half speed on a worn reel, an octave down and hissing, haloed in a twelve second hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { age: 0.6, hiss: 0.3, attack: 0.5, release: 2.5, volume: -11.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 12, size: 1.8, damping: 0.6, mix: 0.45 },
      },
    ],
    preview: 'chord',
  },

  // Thesis: tuned noise has no volume of its own, so a limiter or a compressor sets its level.
  {
    id: 'soft-pedal-hung-noise-bands',
    name: 'Hung noise bands',
    category: 'pad',
    description:
      'Narrow bands of noise tuned to each note and its reflection in D minor, slow to arrive, in a twenty second room.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 62, attack: 2.5, release: 6, scale: 1, root: 2 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 20, mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-low-unsteady-bands',
    name: 'Low unsteady bands',
    category: 'pad',
    description:
      'Wide, low bands of filtered noise that drift in pitch around each note, evened by a slow compressor, in a cathedral.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { attack: 2, scale: 4, root: 2 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: -3.5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },

  // Wavetable: near sines, slow and unmoving.
  {
    id: 'soft-pedal-still-sines-phasing',
    name: 'Still sines phasing',
    category: 'pad',
    description:
      'Near sine tones over a sub, unmoving, shifted a fraction of a hertz so they phase slowly in a very long room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { cutoff: 900, attack: 2.5, release: 6, volume: -17 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { width: 0.3, mix: 0.4 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 22, width: 0.7, mix: 0.45 },
      },
    ],
  },
  {
    id: 'soft-pedal-hollow-dark-room',
    name: 'Hollow dark room',
    category: 'pad',
    description:
      'A hollow wavetable that morphs slowly under a low filter, in a dark room whose tail sinks as it fades.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { cutoff: 1400, volume: -9 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { bloom: 0.3, mix: 0.45 } }],
  },

  // West coast: a soft struck tone and a slow fold, both kept dull.
  {
    id: 'soft-pedal-soft-mallet-tone',
    name: 'Soft mallet tone',
    category: 'bell',
    description:
      'A nearly pure tone struck through a gate that darkens as it fades, with slow octave-lower replays, in a cathedral.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 2.5, colour: 0.3, volume: -2.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Undertow', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'soft-pedal-folded-tone-pad',
    name: 'Folded tone pad',
    category: 'pad',
    description:
      'Tones that fade in over two seconds and fold into richer ones while held, doubled thick in a long room.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { fold: 0.2, attack: 2.5, colour: 0.5, volume: -11.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { detune: 12 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 18, mix: 0.45 } },
    ],
  },

  // Zither: a felt hammer on single strings, and a soft roll.
  {
    id: 'soft-pedal-small-hammered-piano',
    name: 'Small hammered piano',
    category: 'plucked',
    description:
      'Single strings struck with a felt hammer, a detuned copy either side, like a small piano in a cathedral.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 7, release: 4, brightness: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'soft-pedal-soft-hammered-roll',
    name: 'Soft hammered roll',
    category: 'plucked',
    description:
      'Octave courses rolled softly with hammers six times a second, dulled, blurring into a long plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 6, brightness: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },
]
