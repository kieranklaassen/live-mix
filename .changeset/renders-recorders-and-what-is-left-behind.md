---
'@kieranklaassen/live-mix': patch
---

Renders that fail or cannot be fed, recorders stopped twice or disposed, and what the engine left running behind it.

- `renderOffline`, `renderStems`: a render that failed (in the build, the alignment, the scheduling or the rendering) left the engine it had made, with every device on it, where nobody could reach it; `renderStems` also left the stems already rendered. Both dispose what they made and throw the render's own failure.
- `scheduleAhead`: a sample that could not be loaded, or a stretch node that could not be built, was asked for again by the repeated tick without end, so the render never returned. The tick is repeated only while the wait brought something; otherwise the render goes on without the clip, as live.
- `WorkletRecorder`, `MediaStreamRecorder`: a `stop()` made while another waited took its answer and left the first waiting for ever, and so did `dispose()`. Disposed while recording, the capture processor and the browser's `MediaRecorder` went on. Every `stop()` is answered, and `dispose()` stops what was recording. A `MediaRecorder` that refuses to start leaves the recorder idle.
- `MasterBus.installLimiter`, `installLufsMeter`: a master disposed while the device or the meter was being made refused it without disposing it.
- `StretchTrack`: a stretch source built for a start that never came (a pause, stop or seek before it, a clip moved or removed) was kept, with its worklet and its copy of the sample, until the track was disposed. It is let go when its start is called off.
- `EngineStats.subscribe`: the same listener subscribed twice started a second timer over the first, which nothing stopped.
- `ElementSource.unlock`, `Engine.activateOutput`: unlocking muted and paused an element that was already playing, paused a voice that started while the unlock was under way, and two unlocks at once left the element muted. A playing element is left alone, one unlock runs at a time, and a play that comes meanwhile is heard.
- `LiveInputTrack.detach`: the detached stream's latency stayed in `Engine.ioLatency()`.
- `Engine.dispose`: a dispose listener that threw stopped the call with the engine marked disposed and nothing taken down. The rest is taken down, then the failure is thrown on.
