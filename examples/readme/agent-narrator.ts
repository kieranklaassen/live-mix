import { AgentController, ScoreDocument, createEngine, loadScore } from '@kieranklaassen/live-mix'

const engine = createEngine({ context: new AudioContext() })
const json = await (await fetch('/scores/night-drive.json')).text()
const doc = ScoreDocument.parse(json, { devices: engine.devices })
loadScore(engine, doc)
await engine.master.installLufsMeter() // arms the loudness rails

// Tracks the intensity ladder may pick from (1 grounding … 3 active, keys on
// the Camelot wheel); ids double as score source ids.
const library = [
  { id: 'dusk', title: 'Dusk', intensity: 1, camelot: '8A', durationSec: 214, url: 'dusk.mp3' },
  { id: 'ember', title: 'Ember', intensity: 2, camelot: '9A', durationSec: 198, url: 'ember.mp3' },
  { id: 'surge', title: 'Surge', intensity: 3, camelot: '8B', durationSec: 240, url: 'surge.mp3' },
]

const agent = new AgentController({
  engine,
  document: doc,
  // Score ids the intents act on and the rails protect: the music track the
  // narrator steers, the live-input track that carries its voice.
  roles: { music: 'music', voice: 'narrator' },
  library,
  author: { kind: 'agent', id: 'narrator' }, // every call is logged and undoable under this author
  // Rails the model cannot override. Defaults already keep faders in 0..1,
  // refuse muting the music or the voice while it speaks, and slew gain.
  rails: { maxShortTermLufs: -16, maxFadeSec: 20 },
})

// One JSON Schema per tool, listed only when a backend for it is present.
const tools = agent.toOpenAiTools() // or agent.toAnthropicTools()
console.log(tools.map((tool) => tool.name))

// Route the model's calls through the controller; the result is JSON for the model.
const steer = agent.call('steer_music', { direction: 'calmer' })
if (steer.ok) console.log(steer.result.nowPlaying, steer.operations.length, 'operations')

// Requested 3.0, applied 1.0: the clamp is reported to the model and logged.
const loud = agent.call('set_music_volume', { level: 3 })
console.log(loud.rails) // [{ rail: 'range', action: 'clamped', requested: 3, applied: 1, … }]
agent.undo(loud.callId)

// Instead of polling, the model reads a ≤ 2 KB snapshot, or only what changed since it last looked.
const snapshot = agent.snapshot()
console.log(snapshot.transport, agent.diffSince(snapshot.cursor))
