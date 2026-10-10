import { type FactoryPreset } from '../types'

export const FEEDBACK_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'string-held-in-air',
    name: 'String held in air',
    category: 'string',
    description: 'Plucked strings an amplifier catches and holds on their octave, in a room.',
    instrument: { deviceId: 'feedback', preset: 'Singing string', params: { volume: -4.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'pluck-and-plate',
    name: 'Pluck and plate',
    category: 'string',
    description: 'A bright pluck the amplifier is too far away to hold, dying on a small plate.',
    instrument: { deviceId: 'feedback', preset: 'Plucked and gone', params: { volume: 3 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'bloom-from-nothing',
    name: 'Bloom from nothing',
    category: 'pad',
    description:
      'Soft plucks that take seconds to be caught, then swell into held notes in a hall.',
    instrument: { deviceId: 'feedback', preset: 'Slow bloom', params: { volume: -3.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
  },
  {
    id: 'hum-under-the-nave',
    name: 'Hum under the nave',
    category: 'drone',
    description: 'Unplucked strings rising out of the amplifier hum, under a low cathedral.',
    instrument: { deviceId: 'feedback', preset: 'Out of the hum' },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4 } }],
  },
  {
    id: 'howling-stack',
    name: 'Howling stack',
    category: 'texture',
    description: 'Torn notes howling a twelfth above themselves through a warm stack and a spring.',
    instrument: { deviceId: 'feedback', preset: 'Howl', params: { volume: -12 } },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
    preview: 'line',
  },
  {
    id: 'torn-repeats',
    name: 'Torn repeats',
    category: 'string',
    description:
      'Hard picked strings held square and buzzing on their own pitch, with tape repeats.',
    instrument: { deviceId: 'feedback', preset: 'Torn edge', params: { volume: -5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'twelfth-in-a-hall',
    name: 'Twelfth in a hall',
    category: 'string',
    description: 'Clean notes that settle on the pure twelfth above themselves, in a hall.',
    instrument: { deviceId: 'feedback', preset: 'Pure twelfth', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'whistle-over-wire',
    name: 'Whistle over wire',
    category: 'texture',
    description:
      'Notes that leave their pitch for a thin high overtone, with a faint glimmer above.',
    instrument: { deviceId: 'feedback', preset: 'High whistle' },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
    preview: 'line',
  },
  {
    id: 'fighting-strings',
    name: 'Fighting strings',
    category: 'pad',
    description: 'A chord whose notes take the amplifier from one another, drifting on a plate.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Fighting chord',
      params: { volume: 0, width: 0.4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { spread: 20, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'air-that-wanders',
    name: 'Air that wanders',
    category: 'texture',
    description: 'Slow notes that slide from overtone to overtone, smeared dark in an open space.',
    instrument: { deviceId: 'feedback', preset: 'Drifting air', params: { volume: -6.5 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'dark-held-wire',
    name: 'Dark held wire',
    category: 'drone',
    description: 'Dull strings held on their own pitch with no overtone added, in a dark hall.',
    instrument: { deviceId: 'feedback', preset: 'Dark sustain', params: { volume: -7.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'glass-bowed-wire',
    name: 'Glass bowed wire',
    category: 'pad',
    description: 'Unplucked notes rising clean two octaves above their keys, into a plain hall.',
    instrument: { deviceId: 'feedback', preset: 'Glass bow', params: { volume: -4 } },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall' }],
  },
  {
    id: 'edge-of-catching',
    name: 'Edge of catching',
    category: 'string',
    description: 'Plucked strings an amplifier only just holds, on tape and with no room at all.',
    instrument: { deviceId: 'feedback', preset: 'Edge of hold', params: { volume: -4.5 } },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
  },
  {
    id: 'open-amp-chorale',
    name: 'Open amp chorale',
    category: 'pad',
    description:
      'A wide chord where every string gets the whole amplifier, turned slowly in a room.',
    instrument: { deviceId: 'feedback', preset: 'Open amp', params: { width: 0.7, volume: -14.5 } },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'long-sinking-wire',
    name: 'Long sinking wire',
    category: 'drone',
    description:
      'Low strings that go on singing long after the keys are let go, into a long dark tail.',
    instrument: { deviceId: 'feedback', preset: 'Long sink', params: { volume: -6 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark' }],
  },
  {
    id: 'breathing-reed-amp',
    name: 'Breathing reed amp',
    category: 'pad',
    description:
      'Buzzing notes that speak at once like reeds and stop with the keys, gently breathing.',
    instrument: { deviceId: 'feedback', preset: 'Reed tone', params: { volume: -7 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'amp-in-the-room',
    name: 'Amp in the room',
    category: 'string',
    description:
      'Held notes with more grit and no drift, heard close through a small amplifier in a room.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Singing string',
      params: { grit: 0.6, wander: 0 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
    preview: 'line',
  },
  {
    id: 'cavern-swells',
    name: 'Cavern swells',
    category: 'texture',
    description: 'Slow blooming notes answered backwards by a reverse delay, far off in a cavern.',
    instrument: { deviceId: 'feedback', preset: 'Slow bloom', params: { bloom: 2, volume: -2 } },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { spread: 0.15 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'wire-wakes-strings',
    name: 'Wire wakes strings',
    category: 'drone',
    description:
      'Low strings rising from the hum and setting a bank of sympathetic strings ringing.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: { grit: 0.45, volume: -10.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'swirling-standoff',
    name: 'Swirling standoff',
    category: 'texture',
    description: 'A fighting chord with its top rolled off, swirled by a phaser into dark echoes.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Fighting chord',
      params: { damp: 0.75, volume: -2.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { stereo: 15 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
]
