---
'@kieranklaassen/live-mix': patch
---

A hundred new visual styles, a hundred and forty-one in all, each with two variations.

`VISUAL_STYLES` has a hundred more entries and `VISUAL_GROUPS` five more groups: `paint` (Paint and ink), `made` (Cloth, paper, glass), `light` (Light and shadow), `form` (Shapes and rooms) and `rule` (Lines and patterns). `VisualGroupId` names them. The styles there were keep their ids, their pictures and their order. A style's shader is still a script of its own that is loaded the first time the style is drawn, so a page that draws one loads one.

A host that lists every style with all its words should expect a longer list: the words of all of them are about 100,000 characters.
