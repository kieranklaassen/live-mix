---
'@kieranklaassen/live-mix': patch
---

A plate pressed with a finger or a pen is in hand (`lm-plate--held`) until a
press lands anywhere else, and shows its tools as a plate under a pointer
does. Beside a host's preset picker the tools come up over the end of the
plate's name on a touch screen too, so the picker keeps the room the name
leaves it instead of one cell.

Under those tools the plate's name now shows whole words or nothing: it was
cut wherever the tools began ("VINTAGE DIG"). A tool is a cell of
`--lm-plate-tool` (16 px), which a host sets to make them larger under a finger.
