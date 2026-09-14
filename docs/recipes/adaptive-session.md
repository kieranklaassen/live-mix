# Recipe: a breathwork-style adaptive music session

A coach's voice over adaptive music on a phone with the screen locked — F1
and F5 in the plan. This is the shape Breathwork Live runs today
([consumer guide](../consumers/breathwork-live.md)), reduced to the library
calls: one engine, one output terminus, a duck bus keyed by the voice, a
streaming ambience bed, a breath guide, music clips the coach can steer, and
the agent API over all of it.

## 1. One engine per context, on the start gesture

```ts
import { createEngine, isIOSWebKit } from '@kieranklaassen/live-mix'

const context = new AudioContext()
const engine = createEngine({
  context,
  tickMs: 100, // scheduler period; 5 s lookahead makes 100 ms plenty
  output: {
    mode: isIOSWebKit() ? 'element' : 'direct', // lock-screen playback on iPhone
    mediaTitle: 'Breathwork',
    mediaArtist: 'Adem',
  },
  samples: { budgetBytes: 256 * 1024 * 1024 }, // decoded PCM cap; sounding voices are never cut
})
const music = engine.addBus('music') // everything that ducks under the voice sums here
await engine.activateOutput() // element.play() + MediaSession, on this gesture only
```

Nothing in the app connects to `ctx.destination`; every path ends at
`engine.output`, which is what makes lock-screen playback engine-wide.

## 2. The voice, its hall and the ducker

```ts
const ducker = engine.addDucker(music) // Phase 0 follower: depth 0.68, attack 80 ms, release 800 ms
// or the audio-thread one: await loadDuckerProcessor(context); engine.addDucker(music, { mode: 'worklet' })

const voice = engine.addLiveInputTrack('voice', { destination: engine.output })
voice.onAttach((source) => ducker.key(source)) // re-key on every (re)connect
const hall = engine.addReturnTrack('hall', {
  device: createConvolverReverb(context), // generated hall impulse
  destination: engine.output,
})
voice.sends.add(hall) // a touch of space under the voice; the dry path stays full

realtime.onRemoteStream((stream) => voice.attach(stream)) // WebRTC remote voice (or an AudioNode)
```

The voice is deliberately **not** on the duck bus — the duck would silence it
with the music. The coach's remote `<audio>` element stays muted; this path is
how the voice reaches the speakers.

## 3. Music the coach can steer

```ts
const tracks = engine.addAudioTrack('music', {
  destination: music,
  lookaheadSec: 5, // hand starts to the graph this far ahead
  preloadSec: 12, // start decoding this far ahead
})

// A plan: full library tracks chained with equal-power crossfades, LUFS trims in dB.
function planClips(fromSec: number, plan: LibraryTrack[]): Clip[] {
  let at = fromSec
  return plan.map((track, i) => {
    const clip: Clip = {
      id: `${track.id}-${i}`,
      sourceId: String(track.id),
      startSec: at,
      offsetSec: 0,
      durationSec: track.durationSec,
      fadeInSec: CROSSFADE_SECONDS,
      fadeOutSec: CROSSFADE_SECONDS,
      fadeCurve: 'equalPower',
      gainDb: track.gainDb, // clamped to ±MAX_CLIP_GAIN_DB by the track
    }
    at += track.durationSec - CROSSFADE_SECONDS
    return clip
  })
}

for (const track of plan) void engine.samples.load(String(track.id), track.url) // or let the scheduler preload
tracks.clips.set(planClips(0, plan))
engine.transport.start()

// Steer without truncating: everything from `now` is replaced, the sounding clip fades over
// STEER_CROSSFADE_SECONDS, boundaries move by the difference (R6).
tracks.clips.replaceFrom(engine.transport.position().positionSec, planClips(now, calmerPlan))
```

Breathwork Live drives `AudioTrack.play` itself from its verbatim
`SectionPlaylist` (with `retainSamples: false`); a new consumer uses clips as
above and gets the scheduler's catch-up and late join for free.

## 4. A streaming ambience bed and a breath guide

```ts
// The dawn bed: streamed, on the master (it never ducked), unlocked on the start gesture.
const beds = engine.addElementTrack('ambience')
const dawn = beds.addSource(
  new ElementSource(context, { id: 'dawn', url: '/audio/ambient-dawn.mp3' }),
)
beds.clips.add({
  id: 'dawn',
  sourceId: 'dawn',
  startSec: 0,
  offsetSec: 0,
  durationSec: 3600,
  fadeInSec: 4,
  fadeOutSec: 6,
  fadeCurve: 'linear',
  gainDb: -9.1,
  loop: true,
})
await beds.unlockAll() // before/with activateOutput(), from the gesture

// The breath guide: an app-owned NoteDevice (noise → bandpass → gain) on an instrument track under the duck.
engine.addInstrumentTrack('breath-guide', { device: breathGuide, destination: music })
```

A breath-phase modulator makes the guide's inhale/exhale drive anything —
the filter cutoff of the music, a reverb mix — with the same curve the UI
draws (AE8): `const phase = new ExternalPhase(); engine.modulation.map(phase, deviceParamTarget(filter, 'frequency'), 0.6)`
and `phase.setPhase(progress)` from the conductor ([automation](../concepts/automation.md#modulators)).

## 5. Loudness that no operation can bypass

```ts
import { createTruePeakLimiter } from '@kieranklaassen/live-mix/dsp'

await engine.master.installLimiter((ctx) =>
  createTruePeakLimiter(ctx, { params: { ceilingDb: -1 } }),
)
const lufs = await engine.master.installLufsMeter({ intervalMs: 50 })
lufs.subscribe(({ shortTerm }) => hud.draw(shortTerm, lufs.truePeakDb))
```

The limiter is a fixed master stage with no bypass; the meter also arms the
agent rails' loudness ceilings.

## 6. The coach as an agent

```ts
import { AgentController } from '@kieranklaassen/live-mix'

const agent = new AgentController({
  engine,
  roles: { voice: 'voice', music: 'music', ambience: 'ambience', breathGuide: 'breath-guide' },
  session: {
    describe: () => conductor.describeForAgent(), // sections, now playing, pace
    library: () => conductor.library(),
    replaceUpcoming: (picks, maxDeltaSec) => conductor.replaceUpcoming(picks, maxDeltaSec),
    extendSection: (s) => conductor.extendSection(s),
    advanceSection: () => conductor.advanceSection(),
    setBreathPace: (d) => conductor.setPace(d),
    setMusicVolume: (level) => conductor.setMusicVolume(level), // keeps its own user-speech dip
    isSpeaking: () => conductor.isSpeaking(),
    headroomSec: () => conductor.headroomSec(),
  },
})
realtime.update({ tools: agent.toOpenAiTools() })
realtime.onToolCall(({ name, args, callId }) =>
  realtime.sendToolResult(
    callId,
    agent.call(name, args, { author: { kind: 'agent', id: 'coach' } }),
  ),
)
setInterval(() => realtime.sendContext(agent.snapshot()), 5000)
```

Without a `document`, the hooks-backed intents and `get_state` are the tool
list; with a score document (the planner's output, U38) the whole operation
vocabulary joins ([agent-api](../concepts/agent-api.md)).

## 7. Ending, interruptions, tests

`engine.stop({ fadeSec: 0.75 })` fades everything the engine owns (the coach's
`fade_out` tool is bounded to 2..30 s); `engine.dispose()` at the end of the
session, then `context.close()`. A phone call suspends the context; resume it
on the next gesture and the transport's anchor keeps the position. Test the
whole graph headless on the recording mocks
([getting started §6](../getting-started.md#6-headless-tests)) — Breathwork
Live's 979-line harness asserts every `AudioParam` event of exactly this
shape.
