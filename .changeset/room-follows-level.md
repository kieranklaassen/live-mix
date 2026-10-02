---
'@kieranklaassen/live-mix': patch
---

A sounding clip that is turned down takes its room down with it, and a clip without a place follows its level.

A placed clip's trim sits ahead of its send, and a room rings for seconds: a clip pulled down 30 dB while it sounded was still heard through what it had already sent, 10 dB down after 0.4 s at the back of a room. And a clip that names no place did not follow an edit at all until its next start.

- `AudioTrack.place` (and every `clip.update` of a scheduled clip) turns the track's own room by what the change does to the power its sounding clips send in: one clip of one down 30 dB is 30 dB, one of two equal clips about 3 dB. A room is only ever turned down; a clip turned up gives back what an earlier change took and no more.
- `SpaceRoom.tilt(ratio, at, rampSec)`: a gain after the convolver comes down and one ahead of it (after the saturator of a driven room) goes up by as much, on the same straight line in dB, so what is ringing changes and what is sent from then on does not. Both return to 1 at `SPACE_TILT_RETURN_DB_PER_SECOND` (2 dB a second). The two gains are only made on the first tilt; a room that is never tilted is the convolver alone, as before.
- A placed clip's trim and send now glide to a new level over `PLACEMENT_GLIDE_SECONDS` (40 ms, a straight line in dB) instead of approaching it; a send that opens from, or closes to, silence still approaches, as do pan and low-pass (`PLACEMENT_RAMP_SECONDS`).
- A voice started without a place follows its clip's `gainDb` while it sounds, through its trim; one that was started at unity is given a trim then. `place` still returns false when the clip has come to name a pan, a low-pass or a send the voice has no nodes for. `ClipVoice.trim` is no longer `readonly`.
- `ParamGlide`: a gain moved along exponential ramps that remembers what it wrote, so two gains can be kept reciprocal while both move.

A shared room (`sharedSpace`) is not tilted: other tracks ring in it. A host where a level has to be heard to follow the hand, room and all, gives each track its own room.
