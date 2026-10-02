---
'@kieranklaassen/live-mix': minor
---

The room placed clips are sent into has a character, and can change while it sounds.

- `SpaceOptions` gains `levelDb` (how loud the room comes back, −24 to 12 dB), `grain` (0 smooth to 1 rough: the tail thins from dense noise to separate echoes at the same loudness), `driveDb` (0 to 36 dB into a saturator ahead of the room, level held for a steady sound at −18 dBFS) and `driftCents` with `driftHz` (the tail's pitch wanders, from a short delay after the room moved by two slow sines). With all four at their defaults the impulse is bit for bit what it was and the graph has no extra node.
- `engine.setSpace(options)` puts every audio track in another room while it plays, and `engine.space` reads the room as it stands. A change of level, drive or drift alone is ramped in place; another impulse, or a room that gains or loses its saturator or drift, takes over the sends while the old room rings out and is then taken down. `AudioTrack.refreshSpace()` does the same for a track made by hand, which takes its `spaceColour` as an option.
- `SpaceRoom` is the chain one track's sends go into (drive, convolver, drift). Exported with `spaceColour`, `spaceDrift`, `spaceDriveGains`, `grainEchoesPerSec`, `sameSpaceImpulse` and the limits (`MIN_SPACE_LEVEL_DB`, `MAX_SPACE_LEVEL_DB`, `MAX_SPACE_DRIVE_DB`, `SPACE_DRIVE_LEVEL_DB`, `MAX_SPACE_DRIFT_CENTS`, `GRAIN_ECHOES_PER_SEC`).
- `@kieranklaassen/live-mix/testing`: `MockWaveShaperNode`, `createWaveShaper()` and `shapers` on the mock context.
- Checked in a real browser (`browser-tests/specs/room-character.spec.ts`): a clean room adds no harmonics, drive adds them and holds the level, drift moves the tail's pitch by what it says, and a change of room mid-sound does not click.
