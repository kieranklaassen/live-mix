---
'@kieranklaassen/live-mix': patch
---

`PlateDisplayLayer` (and so `DevicePlate`): a pen's double press on a point of a display put it back only from within a mouse's reach of it (9 px), though the pen takes the point from as far off as a finger does (18 px). Between the two the double press took the point twice and put nothing back. It now puts the point back from wherever the pen took it, for a pen that stays as still within each press as a mouse must (2 px); a pen that drifts further in a press makes two nudges, as before. A mouse's and a finger's double press are as they were.
