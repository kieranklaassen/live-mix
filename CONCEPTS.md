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
