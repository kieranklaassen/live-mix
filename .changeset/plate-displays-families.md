---
'@kieranklaassen/live-mix': patch
---

Plate displays, family by family.

- Stereo: the Stereo Widener, the Utility and the Stereo Detune show the stereo field: the fan the width makes, the lean of the pan, the two detuned copies where the device has them, over a cloud of the sound itself with its correlation and the two levels. Width and pan can be dragged. Stereo Detune reports where its two copies are for its display; its sound is unchanged.
- EQ and filters: the Filter, the three-band EQ, the Ambient EQ and the Auto Filter draw their response from 20 Hz to 20 kHz over the spectrum of what comes out, with a point to drag for each band or cutoff. The Ambient EQ shows the cut its resonance control is making now, band by band, and the Auto Filter where its cutoff is at this moment. Both report those readings for the display; their sound is unchanged.
- Drive: the Saturator, the Analog Drive and the Re-amp draw the curve the sound is bent by, in against out, with the part in use lit and the level on the input axis, over a strip of the tone that follows. Drive, bias and the cuts can be dragged. Analog Drive and Re-amp report their level and sag for the display; their sound is unchanged.
- A plate may label any knob it has (`labels` on a face), not only the ones on its face. `trackPhase` settles on the reading it is given. `crisp` keeps within half a pixel of its value.
