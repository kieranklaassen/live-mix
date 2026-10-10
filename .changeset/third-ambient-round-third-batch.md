---
'@kieranklaassen/live-mix': minor
---

The third batch of the third ambient round: twelve more effects, the spectral ones, which take a sound apart into its frequencies and put it back another way. A stretch of up to a hundred times, a delay that fans a chord out by colour, a flicker inside the partials, a filter that lets through only the notes of a key, a shadow of pure sines, partials pulled apart into bells, organ stops for any sound, a sieve for tones, attacks and air, what a sound shares with its own past, what is quiet turned up, a tone colour learned from one sound and pressed on another, and the body of a sound made larger or smaller. Each is a spec device on `cpp/kit`, working a frame at a time on the kit's `Stft`, with a native test that measures what it claims, sixteen presets of its own, a description of every control, and a plate of its own colour with a display that shows what the device is doing and can be taken hold of. Each was built by one worker and checked by a second, who measured it again and put right what that found. None is an emulation of a product, and none has been listened to: every trait is held by a measurement, and `docs/devices.md` says for each one where a first listen should go. Ten of the twelve work a frame behind the sound and report it as latency, 48 to 192 ms at 48 kHz, which a host that does not compensate will hear. A spectral device's work also comes a frame at a time, so its dearest block costs several times its mean: `docs/devices.md` gives both, and names the four (Stretch, Scale Filter, Sift, Warp) whose dearest block passes 5 % of a block.

Time and movement:

- `stretch` (Stretch): plays what is played two to a hundred times slower at the same pitch, a slow cloud that trails behind the playing and runs up to the present again when it has fallen too far back. It reports no latency.
- `prism` (Prism): splits the sound into colours and delays each by a different time, so a chord unfolds from low to high and every repeat fans out further. It reports 48 ms of latency.
- `glimmer` (Glimmer): gives every narrow band of the spectrum a small tremolo of its own, so the partials catch the light and let it go while the level holds. It reports 48 ms of latency.

Notes and partials:

- `scale-filter` (Scale Filter): lets through only the notes of a key and scale, in every octave, so noise, a field recording or a drum loop comes out as a chord. It reports 192 ms of latency.
- `sine-shadow` (Sine Shadow): finds the strongest partials of the sound and plays each as a pure sine that swells in behind it and lingers after it. It reports no latency.
- `warp` (Warp): stretches or squeezes the spacing of the partials around a note that stays put, so strings turn into bells and bells into beating clusters. It reports 96 ms of latency.
- `stops` (Stops): organ stops for any sound: copies of what is playing an octave below, a fifth, an octave, a twelfth and two octaves above, each on its own drawbar, speaking a little after the note as pipes do. It reports 96 ms of latency.

What stays and what comes forward:

- `sift` (Sift): sifts a sound into its tones, its attacks and its air as it plays, with a level and a blur for each. It reports 91 ms of latency.
- `common-tones` (Common Tones): compares the sound with what was playing a moment ago and lets through only what the two share, so held tones hang on and changes vanish, or the other way round. It reports 96 ms of latency.
- `reveal` (Reveal): turns up what is quiet inside a sound, frequency by frequency, so overtones, breath and room come forward while what is already loud stays where it is. It reports 48 ms of latency.

Colour and body:

- `imprint` (Imprint): learns the tone colour of what it hears, holds it, and presses that colour on everything played after; six colours are built in. It reports 48 ms of latency.
- `size` (Size): makes the body of a sound smaller or larger and leaves its notes where they are, or moves the notes and keeps the body. It reports 48 ms of latency.
