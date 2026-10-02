// What the controls of a mixer strip and a transport do, as the info view
// says it. The kit's own strips, rows and transport bar use these; a host
// that builds a strip of its own from `Fader`, `Knob` and `ToggleButton` can
// say the same thing in the same words.

/** A channel strip's controls. */
export const STRIP_INFO = {
  level:
    'How loud this channel is in the mix. The mark on the track is 0 dB: the level the channel came in at.',
  pan: 'Where this channel sits between the left and the right speaker.',
  mute: 'Silences this channel. Its effects keep their settings and its meter goes quiet.',
  solo: 'Plays this channel alone: every channel that is not soloed is silenced until solo is off again.',
  send: 'How much of this channel is also sent to the named return, on top of what goes to the master.',
  master:
    'How loud everything is after the channels are added up: the last level before the speakers.',
} as const

/** A transport's controls. */
export const TRANSPORT_INFO = {
  play: 'Starts playing from where the playhead is. While it plays, this pauses and keeps the place.',
  stop: 'Stops playing and returns the playhead to where it started.',
  loop: 'When this is on, playing starts over at the beginning each time the end of the loop is reached.',
  position: 'Where the playhead is, in minutes and seconds.',
} as const
