---
'@kieranklaassen/live-mix': patch
---

Two instrument presets and one mode lose a product's name.

- `string-machine`: the preset "Solina" is now "Ensemble strings".
- `bowed-string`: the preset "Ebow swell" is now "Sustained swell", the mode "Ebow" reads "Sustain", and the descriptions speak of a sustainer. The mode keeps its value, 1.
- Both old preset names are in the devices' `formerPresets`, so a saved piece or patch that names one still loads the same sound. The bank and the two pack presets that loaded them name the new ones.
