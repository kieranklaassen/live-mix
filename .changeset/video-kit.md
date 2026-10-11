---
'@kieranklaassen/live-mix': patch
---

The video kit (`./react`): what a timeline of picture and sound, a panel, a sheet and a note are drawn with, for an app that edits video on the grid themes. Cutroom's editor is built from it.

- Timeline: `TimeRuler`, `Playhead`, `Lane`, `LaneHead`, `VideoStroke` (a `Stroke` for a picture: a strip of the clip's frames, click ticks, a speed ramp as the automation line, linked and missing states), `TimelineItem` (plate, envelope and span, for what is not media), `LinkMark`, `RangeSelection`, `CutSeam`, `CutNotch`, `TransitionMark` and `Overview`. The arithmetic is exported: `rulerScale`, `rulerLabels`, `zoomAround`, `fitPxPerSecond`, `pageScroll`, `clampPxPerSecond`.
- Panels and controls: `Panel`, `PanelHead`, `Tabs`, `SectionLabel`, `PropRow`, `TextButton`, `Input`, `Select`, `Segmented`, `Check`, `Menu`, `MenuItem`, `Sheet`, `InlineNote`, `Progress`, `StateMark`, `WhoMark`, `JobRow`, `LogRow`, `TranscriptWord`, and `Glyph` with 32 kinds drawn by `SoundIcon`'s rules.
- Notes, a colour role of their own: `NoteTab`, `NotePin`, `NoteSpan`, `PictureMark`, `NoteBubble`, `ContextChip`, `ReferenceChip` and `ChangedMark`.
- New tokens on every theme: `stage`, `scrim`, `removed`, `record`, `note`, `note-soft`, `note-mark`, `mark-edge`, `bar-height`, `panel-width`, `lane-head-width`, `read-size`, `handle-size`. Hosts that set every token themselves need to add these. `.lm-app` is the ground an app built from the kit stands on; `.lm-read` and `.lm-time-large` are two type styles.
- `ToggleButton` passes any `data-*` attribute to its button.
- `followStep` (the core entry), with `FOLLOW_SEEK_TOLERANCE`, `FOLLOW_DRIFT_SEEK` and `FOLLOW_MAX_SEEK_LEAD`: the rule by which a media element follows a clock it is not the master of, such as a video element under a picture that follows the audio clock.
- `playground/video-kit.html` mounts every element in any theme.
