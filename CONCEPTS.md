# Concepts

> Shared domain vocabulary for this project: entities, named processes, and status concepts with
> project-specific meaning. Seeded with core domain vocabulary, then added to as learnings are
> written under `docs/solutions/`; direct edits are fine. Glossary only, not a spec or catch-all.

## Voices and notes

### Note id

The number a host gives a key when it sends a note on, and the only handle the note off carries.

An id is not a pitch. A host may send the same id again at another pitch with no note off between, and one note off must then end everything that id plays.

### Voice pool

The bookkeeping an instrument with many voices shares: which voice plays which Note id, and which voice a new note takes.

A new note takes an idle voice first, then the quietest voice that has been let go, then the quietest Held voice, the oldest on a tie. The pool only picks. The instrument starts and stops the voice.

### Held voice

A voice that is sounding and has not been let go.

A note off finds one voice: the newest Held voice of its Note id. An instrument therefore keeps at most one Held voice for an id. A second one has no note off that can end it. A voice that carries a Waiting note counts as held.

### Waiting note

A note parked in a voice that was taken from another note, until the old note has faded out.
_Avoid:_ pending note, parked note

The voice counts as a Held voice while the note waits, so that a note off can find it and end the note before it sounds. A Restrike of the same Note id during the wait replaces the Waiting note. It does not take a second voice.

### Restrike

A note on for a Note id that still has a sounding voice. The devices write it as a key "struck again".

The instrument decides what it does: play on in the voice that stands at that pitch, or let the old voice go and start another. Either way the id is left with one Held voice.

## The lessons site

### Lab

One lesson's C++ file under `site/labs/`: the engine's own code with a Tap on every stage, built to WebAssembly and run in the lesson's page and in its tests.

A lab renders again on every move of a control. It says of each stage where it comes from: read from the running device, computed by a kit class, computed by a function of the engine called on its own, made by the engine's TypeScript, or written for the lesson. Its build path puts the technique together a piece at a time, beside the main path.

### Tap

A named signal a Lab writes at one stage on every render: sound, a value over time, a curve, a spectrum or a picture made of columns.

A figure draws taps, and a tap that is sound can be heard. A tap whose id begins `built` belongs to the build path and changes with the step. The others never do.

### Claim

A quantity a lesson states as measured, written `<Claim id="…">` in its text and held by a test whose title names that id.

The test measures the quantity on a render of the Lab, or in a browser where only a browser can measure it, and holds it to the rounding of the number as the lesson writes it. A number read off the code beside a link to its line, and a number printed from a Set, are not claims.

### Still

A picture of one or more Taps, rendered from the Lab when the site is built and set in the page as it stands.

A still is there with scripts off and costs the browser nothing. It shows the Lab at its starting values or at a Set, and does not follow the controls as a live figure does. A lesson's tile on the map carries one.

### Set

A named, complete group of settings in a lesson's settings file: values for the Lab's controls and, where it names them, the source to play and the Tap to hear.
_Avoid:_ preset

A card plays a set. A control the set does not name goes to the Lab's starting value, so a card sounds the same whatever the reader did before it. A preset is a device's own, in its descriptor.

### Family

One of the eight groups of four lessons on the map, `site/src/content/families.json`.

A lesson's number is its place in the map, and its family gives its page and its tile their colour. The device pages group devices in families too: those are the library's categories of device, and have nothing to do with these.
