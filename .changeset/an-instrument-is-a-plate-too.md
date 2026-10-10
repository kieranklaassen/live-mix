---
'@kieranklaassen/live-mix': patch
---

Every stock instrument has a skin, and a plate can show an instrument
(`./react`):

- `DEVICE_SKINS` has a plate for each of the 37 instruments, the two kits
  among them: a colour of its own, a finish, a knob cap, and a display. `deviceSkin(instrument)` answers
  with it where it gave the quiet skin before.
- An instrument's display shows the instrument as its knobs set it (strings as
  long as they ring, bars, a tube, a wave, an envelope), lights the part a note
  plays for as long as the device lets it sound, and shows the level that comes
  out. The figures a display works that out from are the device's own, and each
  family's test holds them to the DSP header they were read from.
- `DevicePlate` takes `spread`: every knob on the plate at once, with no `+n`
  cell. Upright, the display keeps a pedal's window at the top left, and the
  knobs stand in two rows beside it and two rows under it; up to eight knobs
  the plate is exactly a pedal, and more widen it by whole cells.
- A skin (and a `PlateFace`) takes `sections`, the knobs in groups that belong
  together, each kept as a block with an empty column to the next, and `wide`,
  a display twice as wide on a plate of nine columns or more.
  `plateLayout` takes `spread` as its fifth argument and answers with a
  `spread` field: the display's columns, the rows' heights and each knob's
  cell. `plateSections` reads a skin's sections for the knobs a device has.
- A display can be told the notes its device was sent: `live: { notes: true }`
  fills `frame.notes` (`DisplayNote`: id, frequency, gain, and seconds since it
  began and since it was let go). `WasmDevice` remembers them (`playedNotes()`,
  `NoteWatchDevice`, `isNoteWatchDevice`, `PlayedNote` from the root entry): the
  held notes and, for a minute, the ones let go. Nothing of it reaches
  the sound, and a display that does not ask is given none.
- A display is told how long the sound a sample device was handed is:
  `frame.sampleSeconds`, from `WasmDevice.loadedSampleSeconds()`
  (`SampleWatchDevice`, `isSampleWatchDevice` from the root entry), null while
  the device plays the sound it is built with and once it is handed
  an instrument of zones.
- `instrumentDisplayKit` has what the instruments' displays share (a pitch's
  place and name, the foot that fills with the level), for a host that draws
  a display for an instrument of its own.
- The plate bench shows instruments with `?instruments=1`, each played a phrase.

An effect's plate, a flat plate and an upright plate without `spread` are as
they were.
