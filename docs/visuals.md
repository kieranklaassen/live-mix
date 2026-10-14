# Visuals

`@kieranklaassen/live-mix/visuals` draws pictures that follow the music: forty shader styles, four bends that work on what was drawn, sixteen palettes and film grain over all of it. A picture is drawn from what a piece is doing at that moment: where the playhead is, which sounds play and how loud, the level and the spectrum of what is heard, a performer's dials, the keys and the live input.

The entry stands beside the audio engine, not on it. It imports nothing from the rest of the library but the JSON types, so a page that only draws loads none of the engine, and a host that only keeps a piece's visuals takes the model without a browser. The model, the signals and the frame are plain functions of their arguments. The ear, the rig, the stage and `showVisuals` need a browser, and a style's shader is a script of its own that is loaded the first time that style is drawn.

It was written for Ambient Town, an instrument built on this library, and moved here whole so that other software can show the same pictures.

## Using it

```ts
import {
  VisualDesk,
  addVisual,
  createEar,
  emptyVisualSet,
  showVisuals,
} from '@kieranklaassen/live-mix/visuals'

const set = addVisual(emptyVisualSet(), 'dot-globe').set // a piece's visuals: plain data
const ear = createEar(engine.context, engine.master) // or tapOf(anyAudioNode)

const desk = new VisualDesk(() => ({
  set,
  playheadSec: engine.transport.position,
  pieceSec: 120,
  beatSec: 0.5,
  playing: engine.transport.state === 'playing',
  strokes, // the sounds of the piece, as FollowedStroke[]
  heard: ear.read(),
  energy: 0.6,
  space: 0.5,
  tone: 0.5,
  input: 0,
}))

const stop = showVisuals(canvas, (now) => desk.frame(now)) // null where there is no WebGL 2
```

There are three parts, and a host can take any of them alone.

| Part                                                          | What it is                                                                                                                                                                                | Needs                  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| The **model** (`model.ts`, `styles.ts`, `palettes.ts`)        | A piece's visuals as plain data, with every edit as a function from one set to the next, and the reading and writing of the saved shape                                                   | Nothing                |
| The **desk** (`desk.ts`, `follow.ts`, `feed.ts`, `frame.ts`)  | Once a frame, the piece and the music as they are now become a `VisualFrame`: the signals every style is handed and the layers to paint, each with its knobs where they stand this moment | Nothing                |
| The **screen** (`ear.ts`, `rig.ts`, `stage.ts`, `picture.ts`) | Listens to a node, makes the shaders, and paints a frame on a 2D canvas                                                                                                                   | A browser with WebGL 2 |

A frame is plain data. It can be made in one window and painted in another, and asked for twice in the same frame a desk answers the same, so any number of canvases show one picture.

## What a host hands the desk

`new VisualDesk(read)` calls `read` once a frame. What it answers is a `DeskReading`:

| Field                                | Holds                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `set`                                | The piece's visuals, a `VisualSet`                                                           |
| `playheadSec`, `pieceSec`, `beatSec` | Where the playhead is, how long the piece is and how long a beat is, in seconds              |
| `playing`                            | Whether the piece plays                                                                      |
| `strokes`                            | The sounds of the piece as the visuals follow them: `FollowedStroke[]`                       |
| `heard`                              | The level and sixteen bands of what is heard, from an ear; `null` where nothing can be heard |
| `energy`, `space`, `tone`            | A performer's three dials, 0 to 1                                                            |
| `input`                              | How loud the live input is, 0 to 1                                                           |

Two things feed a picture.

- **The piece itself.** The strokes that stand at the playhead say how loud each is painted, of which kind (drone, pad, texture, melodic, or a hit) and in which colour. That is known whether or not anything plays, and it is what tells one sound from another, since an engine has no meter for a single clip. A stopped piece still shows its picture at the playhead. `followedStrokes(strokes, piece)` makes the list from a host's own strokes: the host says how to read a stroke's kind, colour, level, hits and whether it is silent (`PieceRead`).
- **What is heard.** `createEar(context, master)` is a tap of its own on the master (an analyser, sixteen bands from 40 Hz to 14 kHz), so nothing a meter reads is changed by it. `tapOf(node)` makes any `AudioNode` tappable for a host that has no engine. A host passes `ear.read()` while the piece plays and `null` otherwise.

`desk.cue()` shows a performer's cue in every style, and `desk.note(gain)` a note played on the keys. `desk.sample(kind, variation, now)` is the frame of one style alone, for a list of styles to show what each does: with the piece while it plays, and with a small piece of its own while the real one stands still or has no strokes, so a style is seen moving.

## A piece's visuals

A `VisualSet` is a palette, an amount of grain and a list of visuals. A `Visual` has a kind and is either placed on a row for a stretch of beats (or for the whole piece), or linked to a stroke, where it shows while that stroke sounds.

```json
{
  "palette": "soft",
  "grain": 0.5,
  "list": [
    {
      "id": "visual-…",
      "kind": "dusk",
      "variation": 1,
      "lane": 0,
      "beat": 32,
      "beats": 16,
      "knobs": { "level": { "value": 0.9 }, "glow": { "value": 0.7, "follows": "energy" } }
    },
    { "id": "visual-…", "kind": "ripples", "stroke": "<stroke id>", "knobs": {} }
  ]
}
```

- Places are in **beats** from the start of the piece, so a change of tempo leaves a visual where it is in the music. `lane` is the row, from 0 at the top. A visual with no `beats` is drawn for the whole piece.
- A linked visual has `stroke`, the stroke's id, and no place of its own.
- `variation` is written only for b; a knob's `follows` only when it follows something.
- `visualsToJson` and `visualsFromJson` write and read this shape. `VISUALS_META` (`visuals`) is the key a host keeps it under in a score's `meta`. A kind from a later build is kept as it was written, with its knobs, and is drawn by a build that knows it. Fields a later build keeps beside the list are written back as they were read.
- A set is never changed in place. `addVisual`, `placeVisual`, `linkVisual`, `removeVisual`, `setVisualKnob`, `setVisualVariation`, `setVisualKind`, `setVisualPalette` and `setVisualGrain` each hand back the next set, or the same set when nothing changed, so a host can make every edit one undo step and skip a write that changes nothing.
- `carryVisualLinks(set, before, after)` is what a host calls when its strokes change. A stroke that is removed takes its visual with it. A stroke that is cut, or laid again by an edit that gives its parts new ids, passes its visual on to the first new stroke of the same sound that lies where it lay. A visual whose stroke was gone before the change is left alone.

At most `VISUAL_MAX` (24) visuals are kept, on `VISUAL_LANES` (4) rows.

## Styles

A **style** paints, and adds its light to what is there. Each has two variations, a and b, which are two pictures of the same idea. `VISUAL_STYLES` lists them with their names, what each draws and what in the music it follows; the shader of each is `src/visuals/shaders/<id>.glsl`. A style's id is saved in pieces, so it is never renamed and never given another picture.

**Dots**

| Id             | Name         | a             | b                  | What it draws                                                                                                                                                                                        |
| -------------- | ------------ | ------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dot-screen`   | Dot screen   | Flat          | Staggered, glowing | The piece as a wall of dots, flat on. Across is the loop, down is the room; a dot is as big as the sound there.                                                                                      |
| `dot-wall`     | Dot wall     | Facing        | Along the wall     | The piece as a wall of glass bulbs over a wet dark floor: across is the loop, up is the room, and the view glides along with the place now playing.                                                  |
| `dot-land`     | Dot land     | Plain         | Twin plains        | The piece laid out as a plain of lamps on stems over black glass, flown over toward a glow at the horizon; the crest of tall lamps just ahead is what sounds now.                                    |
| `dot-globe`    | Dot globe    | Globe         | Dome               | The piece wrapped round a dark globe in lamps: round it is the loop, pole to pole is the room, and it turns so that what sounds now faces you.                                                       |
| `dot-tunnel`   | Dot tunnel   | Round         | Square duct        | A flight down a tunnel whose wall is the piece in lamps: round it is the room, along it is the loop over and over, and the place now playing is a hoop of light the flight overtakes.                |
| `dot-lattice`  | Dot lattice  | Points        | Rods               | A flight through lamps hung in a lattice that fills space, with the piece laid through it across and along and echoed on the levels above and below, the far lamps sinking into fog.                 |
| `pin-relief`   | Pin relief   | Ivory pins    | Glass beads        | The piece pressed into a bed of pins seen from above at a slant, across the loop and away into the room, where a hard low light picks out each pin that stands up and throws its shadow on the next. |
| `press`        | Press        | One screen    | Three plates       | A slow liquid body wearing the piece as its skin, lit from the side and printed in dots: the brighter the body, the fatter the dot.                                                                  |
| `melt`         | Melt         | Mercury table | Wax wall           | The piece as beads of liquid metal on a dark table, the loop across and the room going away from you; where it is loud the beads swell and run together into pools.                                  |
| `moire`        | Moire        | Dot sheets    | Ring sheets        | Three round sheets of fine dots hang in the dark, leaning and crossing; where two overlap their dots fall in and out of step, and great slow figures of light open there.                            |
| `sunflower`    | Sunflower    | Seed dome     | Funnel             | The piece set out as the seeds of a sunflower head: once round is the loop, from the middle to the rim is the room from back to front, and a seed is as big and bright as the sound there.           |
| `ripples`      | Ripples      | Sea of dots   | Rain pond          | A sea of dots at night under one low light on the horizon; the piece lies on the water, the loop across and the room going away, and rings spread through it.                                        |
| `bead-curtain` | Bead curtain | Hanging       | Falling            | Strings of glass beads hang in rows one behind another, each string a band of the sound; light runs down a string as far as its band is loud.                                                        |

**Worlds**

| Id               | Name           | a             | b            | What it draws                                                                                                                                                                                                                                        |
| ---------------- | -------------- | ------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `black-hole`     | Black hole     | Disc          | Bent ring    | A black hole with the piece wound round it as a disc of glowing matter, its far side bent up over the top by gravity; or the hole alone, bending five coloured lights behind it into a ring.                                                         |
| `curtains`       | Curtains       | Night sky     | Under water  | Curtains of light hanging over a dark shore and mirrored in still water, one curtain for each part of the spectrum; or the same light seen from under the sea, falling in rays through the surface.                                                  |
| `night-sea`      | Night sea      | Moonlit       | Heavy sea    | A dark sea under the moon with the piece glowing beneath the waves, far sounds far out and near sounds close; or the same sea as heavy liquid metal under a sky lit in the colours of the sounds.                                                    |
| `grid-land`      | Grid land      | Low flight    | Contour map  | A low flight down a valley toward a setting sun, the hills on either side drawn in glowing lines and standing as tall as the spectrum is loud; or the piece itself as a land of contour lines seen from above, rolling toward you as the loop plays. |
| `silk`           | Silk           | Dark satin    | Falling ink  | A sheet of black satin moving in slow wind, dyed with the piece so each sound is a band of its own colour that swells as it plays; or the sounds as coloured ink falling and curling through dark water.                                             |
| `lit-cloud`      | Lit cloud      | Deep space    | Window light | A slow flight through glowing cloud among stars, each cloud lit in the colour of one kind of sound; or a dark smoky room where the piece is a window of coloured glass, throwing its shafts of light down through the smoke to the floor.            |
| `liquid-metal`   | Liquid metal   | Mirror drops  | Soap film    | Five drops of liquid metal drift, touch and run together over a floor that is the piece, each mirroring tall bars of light in the piece's colours.                                                                                                   |
| `light-tunnel`   | Light tunnel   | Lamp rings    | Veined       | A flight down a twisting tunnel of black glass whose lamps are the piece itself, wrapped round, with a light at the far end.                                                                                                                         |
| `curved-lattice` | Curved lattice | Light ribbons | Gold bands   | A flight through an endless lattice of curved ribbons made of light, the near ones showing the far ones through them, the colour sliding as it goes deeper.                                                                                          |
| `folded-stone`   | Folded stone   | Lantern       | Crystal city | A block of stone folded and pierced over and over until it is lace, turning slowly in the dark with a light burning inside it.                                                                                                                       |
| `night-city`     | Night city     | Towers        | Basalt       | The spectrum as a city at night, low notes on the left and high on the right, flown over low, its lit windows and roof lines mirrored in a wet avenue.                                                                                               |
| `star`           | Star           | Burning       | Eclipse      | One star turning in the dark: a ball of fire pushed out of shape by the sound, with a corona streaming off it.                                                                                                                                       |

**Gradients**

| Id             | Name         | a             | b              | What it draws                                                                                                                                                                                                                                                                                                      |
| -------------- | ------------ | ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `colour-field` | Colour field | Fog           | Coarse print   | The piece laid on wet ground as light under a low fog, looked across from the front of the room to the back: each sound a bank of glowing colour, the far ones small on the horizon, all of them drawn out long in the wet floor; or the same field flat on, made only of grain, like a photograph printed coarse. |
| `dusk`         | Dusk         | Over water    | Ribbed glass   | The sky after sunset over still water: long soft bands of colour from a glow at the horizon up into blue-black, thin streaks of cloud lit from below, the last of the sun behind a far shore; or the sun still up, seen through ribbed glass that cuts the sky into slipped slices.                                |
| `soft-lights`  | Soft lights  | Frosted glass | Cut gels       | A few great soft lights drifting behind a pane of frosted glass, some close against it and some far back, melting into one another where they cross; or the same lights as sharp cut discs and half discs of coloured gel, each filled with a gradient and laid one over another with soft shadows between.        |
| `still-life`   | Still life   | Low sun       | Stipple        | Five matte balls stand on a plain before a half-sunk glowing disc, in low soft light with long shadows, like a still life on film.                                                                                                                                                                                 |
| `ribbons`      | Ribbons      | Hanging cloth | Standing glass | Five wide ribbons of thin coloured cloth hang and turn slowly in the dark, one behind another, their colours mixing where they cross and each throwing a soft shadow on those behind.                                                                                                                              |
| `prism`        | Prism        | Beam          | Thin films     | A beam of white light crosses a dark room into a block of glass and comes out as a wide fan of colour that hangs in the air and climbs the far wall in long soft bands.                                                                                                                                            |

**Earth and sky**

| Id        | Name    | a             | b            | What it draws                                                                                                                                                                                                                                                                      |
| --------- | ------- | ------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `meadow`  | Meadow  | Long grass    | Still water  | A field of long grass in the last light, seen from low among the blades, the piece lying in it as drifts of glowing seed heads: far sounds far off, near sounds close; or reeds standing in still water at dusk, mirrored, with mist.                                              |
| `flowers` | Flowers | Flower field  | One bloom    | A meadow of flowers seen at a slant in evening light, the piece lying on the ground as drifts of flowers in its colours, each one open as far as its sound is loud; or one great flower seen close, a ring of petals for each kind of sound.                                       |
| `canopy`  | Canopy  | Looking up    | Forest floor | Looking up through the leaves of a tree toward the evening sky, layer over layer of leaves moving in the wind, the sun coming through them in soft shafts and drifting discs; or the forest floor, ferns and moss in mist, with shafts of light slanting down between dark trunks. |
| `hills`   | Hills   | Dawn mist     | Dunes        | Ranges of hills one behind another at dawn with mist lying in the valleys, the far ones pale and the near ones dark; or dunes of sand in low side light with wind lifting a veil of sand from the crests.                                                                          |
| `clouds`  | Clouds  | Heaps         | Rain         | A wide calm sky of great soft heaps of cloud drifting over a low strip of land, lit from one side by a low sun; or rain coming over open land from a dark bank, grey veils slanting down with light under the cloud's edge.                                                        |
| `pond`    | Pond    | Lilies        | Stream       | Still water seen from above at a slant, with lily leaves and flowers floating where the piece sounds, trees and sky mirrored between them and light moving on the shallow bottom; or a clear stream over round stones with leaves carried past on top.                             |
| `leaf`    | Leaf    | Backlit       | Wing         | One leaf seen very close with the sun behind it: the mid-rib, the side veins, the fine net and the glowing cells between, and drops of dew that each hold a tiny upside-down picture of the sky; or the wing of a dragonfly, dark glass cells in a gold net.                       |
| `growth`  | Growth  | Rings         | Delta        | The cut face of a trunk under a low light: each turn of the loop lays one more ring round the rim, thick and warm where the piece is loud, so the wood is the piece's own record; or a river delta seen from the air at dusk, its channels branching away toward the sea.          |
| `flock`   | Flock   | Evening birds | Fireflies    | A great flock of small birds at dusk, thousands of dark points turning together as one folding cloud over low land and a few trees; or fireflies drifting over a dark meadow at night, a few near and soft, many far and small.                                                    |

## Bends, palette and grain

A **bend** draws nothing and works on what the visuals before it drew (`VISUAL_BENDS`):

| Id       | Bend       | What it does                                                      | Knobs        |
| -------- | ---------- | ----------------------------------------------------------------- | ------------ |
| `trails` | Trails     | What was on the screen stays a while and fades                    | Length, Push |
| `mirror` | Mirror     | Folds the picture left onto right, and further up top onto bottom | Fold         |
| `spin`   | Spin       | Turns the whole picture round its middle                          | Turn         |
| `grain`  | More grain | Lays more film grain over the picture for its stretch             | Amount       |

Two things lie over every visual of a piece alike. The **palette** (`VISUAL_PALETTES`, sixteen of them, Soft until one is picked) takes the vividness down and can fold the whole colour wheel onto one arc of it, so that every colour lands in one family and still differs from its neighbours: Vivid, Soft, Faded, Black and white, Green and blue, Moss, Forest, Sea, Ice, Night, Lilac, Dusk, Rose, Ember, Sand and Earth. The **grain** is how much film grain lies over the picture, from 0 to 1. It is laid over the finished picture on the canvas, never into what Trails keeps, so old grain is not dragged along.

## Knobs, and what they follow

Every style has the same four knobs (`STYLE_KNOBS`):

| Knob   | What it does                                                                                | On a new visual                |
| ------ | ------------------------------------------------------------------------------------------- | ------------------------------ |
| Level  | How much of the visual shows; at nothing it is not drawn                                    | 0.9                            |
| Size   | How close the picture is: low is far off and small, high is near and large                  | 0.5                            |
| Glow   | How much light and movement the picture has                                                 | 0.7, following the Energy dial |
| Colour | Turns every colour round the colour wheel; in the middle they are the colours of the sounds | 0.5                            |

A knob stands where it is put, from 0 to 1, or it **follows** a source. A knob that follows is moved by its source, and where it stands says how far (`knobNow`):

    knob now = value × (0.15 + 1.35 × source)

So with its source at rest the knob shows a little, and with the source full it can go past where it was put (the result is held between 0 and 1). The one exception is the place in the piece, which runs the knob from nothing at the start of the piece to where it was put at the end: `value × place`.

| Source                           | Id                                   | What it is                                                                                              |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Whole mix                        | `mix`                                | How loud everything is together                                                                         |
| Its stroke                       | `stroke`                             | How loud the stroke the visual is linked to is now; nothing for a visual that is not linked             |
| Low, Mid, High                   | `low`, `mid`, `high`                 | The low, the middle and the high part of what is heard                                                  |
| Drones, Pads, Textures, Melodies | `drone`, `pad`, `texture`, `melodic` | The loudest sound of that kind now                                                                      |
| Hits                             | `hits`                               | One shots, beats and cues: full on a hit, gone in half a second. A beat that repeats hits on every pass |
| Cues                             | `cue`                                | A performer's cue, falling over a second                                                                |
| Keys                             | `keys`                               | Notes played on the keys                                                                                |
| Live input                       | `input`                              | The microphone or whatever else comes in                                                                |
| Energy, Space, Tone              | `energy`, `space`, `tone`            | A performer's three dials                                                                               |
| Place in the piece               | `place`                              | Where the playhead is, from the start of the piece to its end                                           |

Every source is 0 to 1 and already smooth (`VisualFollower`).

## Painting

`showVisuals(canvas, frameAt, options)` paints `frameAt(now)` on a canvas for as long as it is shown and hands back the way to stop. It sizes the canvas to what the page gives it (a screen sharper than two device pixels a point is drawn as one that sharp), paints thirty times a second unless `fps` says otherwise, four times a second for someone who asked their system for less motion unless `always` is set, and nothing while `still()` answers true or the canvas has no size. A frame that cannot be painted is handed to `onError` and the frame before it stays.

A host with a frame loop of its own paints by hand: `createStage()` makes a stage for one canvas (it remembers what that canvas showed, for Trails), and `stage.paint(context, frame, scale)` paints a frame over the whole of it. It answers true while a style was not ready yet, when the frame should be painted again though nothing changed.

All of it is drawn with WebGL 2 in **one context for the whole page** (`visualRig`), however many canvases show pictures: a style is drawn there at the size asked, never wider than 960 pixels, and copied to the 2D canvas that wants it. A shader is fetched and made the first time its style is asked for, one new shader a frame, so a list of forty does not freeze a page as it opens. A style that cannot be made is given up on alone and the others still draw; one whose script could not be fetched is asked for again a few seconds later. A context that is lost (a phone takes it away when the page is put aside) is made again when it comes back.

`visualsMayDraw()` says whether pictures can be drawn here as far as is known, without making the context; `visualsReady()` makes it and says for certain; `watchVisuals(watcher)` tells when that changes. Where there is no WebGL 2 the model and the desk still work, so a host can add, change and keep visuals there, and a browser that has it draws them. `VISUALS_NOT_DRAWN_NOTE` is a sentence for the place where the picture would be.

## A style's shader

A shader is one fragment shader. It is put between `common.glsl`, which declares what every style is handed and a few helpers, and `footer.glsl`, which holds `main`: it calls the style's `vec3 render(vec2 p)` with the middle of the picture at 0 and the height running from -0.5 to 0.5, then applies Size, Colour, the palette and a little noise against banding.

| Handed to every style                                      | What it is                                                                                                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTime`, `uLoop`, `uTravel`                                | Seconds that run on evenly; where the playhead is, 0 to 1; a distance that grows all the time, faster when the music is fuller                                                           |
| `uLevel`, `uLow`, `uMid`, `uHigh`, `uBands[16]`, `band(x)` | The whole mix, three bands of it, and the spectrum low to high                                                                                                                           |
| `uDrone`, `uPad`, `uTexture`, `uPhrase`, `uHits`           | Each kind of sound; a hit is 1 and falls in about 0.6 s                                                                                                                                  |
| `uCue`, `uKeys`, `uMic`, `uEnergy`, `uSpace`, `uTone`      | A cue, the keys, the live input and the three dials                                                                                                                                      |
| `uKind[5]`, `kindColour(k)`                                | The colours of drone, pad, texture, melodic and hit                                                                                                                                      |
| `uMap`, `piece(uv)`                                        | The piece as it sounds now, as a picture 64 by 32: across is the piece from start to end, down is the room from back to front, and each stroke is a soft band that swells while it plays |
| `uVar`                                                     | 0 for variation a, 1 for b                                                                                                                                                               |

The file opens with five comment lines (`name`, `a`, `b`, `what`, `follows`) that say the same as its entry in `styles.ts`, and `src/visuals/__tests__/styles.test.ts` holds the two together. To add a style: the shader file, its entry in `styles.ts`, its line in `shader-sources.ts`, and `pnpm test:browser`, where `browser-tests/specs/visuals.spec.ts` makes and draws every style in both variations and fails for one that does not compile or draws nothing.

## What is checked, and what is not

- The model, the signals and the frame are covered by unit tests in Node (`src/visuals/__tests__`).
- Every style in both variations, every bend over a style, and a canvas left to `showVisuals` are drawn from the built entry in headless Chromium (`browser-tests/specs/visuals.spec.ts`). That machine has no graphics card, so they are drawn in software.
- **Not checked:** the pictures on a real graphics card, how fast each style draws there, and a phone.
