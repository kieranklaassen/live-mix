---
'@kieranklaassen/live-mix': patch
---

The factory bank is four times the size: 680 presets (twenty for each of the thirty-four stock instruments, was five) and 216 effect chains (twenty more in each of the seven groups, was 76).

- Nothing that shipped has changed: every earlier preset and chain keeps its id, its name and every value, and the new ones follow them in the same files. `FACTORY_CHAINS` is now put together from a file per group under `src/dsp/factory/chains/`.
- A preset of the bank is held to the levels of a pack preset (raw preview peak at or below −8 dBFS, loudest 400 ms between −30 and −22 dBFS, side no louder than mid), so the bank and the packs play at one loudness in one list. A chain stays within 4 LU of the dry phrase and peaks at or below −5 dBFS. No two presets of one instrument may sound within 1 dB of each other (`printDistance`), and no two entries may be set exactly alike. Two presets and one chain that shipped outside the new levels stay as they shipped and are named in `src/dsp/factory/__tests__/support.ts`.
- The bench (`FACTORY_REPORT=presets|chains`) flags what leaves the limits and lists each entry's nearest in sound; `FACTORY_WITH_PACKS=1` compares with the packs, `FACTORY_CATEGORY` narrows chains to a group, and `FACTORY_REPORT=stress` leaves each entry to ring for half a minute, plays it at full velocity and at the ends of the keyboard, and feeds a chain full scale and nothing.

Every new entry was rendered and measured on the committed device modules; none has been listened to. What the bench found in the devices on the way (reverbs that put a single note to one side, mixes that are crossfades, noise that outlasts the notes) is in `docs/factory.md`.
