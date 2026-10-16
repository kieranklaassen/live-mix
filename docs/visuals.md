# Visuals

`@kieranklaassen/live-mix/visuals` draws pictures that follow the music: forty-one shader styles, four bends that work on what was drawn, sixteen palettes and film grain over all of it. A picture is drawn from what a piece is doing at that moment: where the playhead is, which sounds play and how loud, the level and the spectrum of what is heard, a performer's dials, the keys and the live input.

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

A frame is plain data. It can be made in one window and painted in another ([A second screen](#a-second-screen)), and asked for twice in the same frame a desk answers the same, so any number of canvases show one picture.

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
| `perform`                            | Where a performance stands, for a picture that follows it; left out or `null`, none does     |

Two things feed a picture.

- **The piece itself.** The strokes that stand at the playhead say how loud each is painted, of which kind (drone, pad, texture, melodic, or a hit) and in which colour. That is known whether or not anything plays, and it is what tells one sound from another, since an engine has no meter for a single clip. A stopped piece still shows its picture at the playhead. `followedStrokes(strokes, piece)` makes the list from a host's own strokes: the host says how to read a stroke's kind, colour, level, hits and whether it is silent (`PieceRead`).
- **What is heard.** `createEar(context, master)` is a tap of its own on the master (an analyser, sixteen bands from 40 Hz to 14 kHz), so nothing a meter reads is changed by it. `tapOf(node)` makes any `AudioNode` tappable for a host that has no engine. A host passes `ear.read()` while the piece plays and `null` otherwise.

`desk.cue()` shows a performer's cue in every style, and `desk.note(gain)` a note played on the keys. `desk.sample(kind, variation, now)` is the frame of one style alone, for a list of styles to show what each does: with the piece while it plays, and with a small piece of its own while the real one stands still or has no strokes, so a style is seen moving.

## A piece's visuals

A `VisualSet` is a palette, an amount of grain, a list of visuals and the pedals laid on the picture ([below](#pedals-on-the-picture)). A `Visual` has a kind and is either placed on a row for a stretch of beats (or for the whole piece), or linked to a stroke, where it shows while that stroke sounds.

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

**Backplates**

| Id      | Name  | a    | b     | What it draws                                                                                                                                                                                      |
| ------- | ----- | ---- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `table` | Table | Wood | Cloth | A table seen from straight above, to lay gear on: dark boards under one warm lamp, or the same table under a woven cloth. It stays quiet on purpose, so that what lies on it is what is looked at. |

A backplate is a ground for what a host lays over the picture (a device's plate, a title): it is dark, flat on and slow, and what it follows in the music it follows with light alone.

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

## Following a performance

A host that performs a piece (takes sounds out and brings them in, turns Energy, Space and Tone) can have the whole picture go with it, with nothing set up visual by visual. It hands the desk a `PerformReading` as `perform`:

| Field     | Holds                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------- |
| `rides`   | How much of what the Energy dial lets through is left in by hand and by the scene in play, 0 to 1 |
| `ladder`  | How much of the sounds that can leave the Energy dial lets through, 0 to 1                        |
| `overSec` | How long the move that was made last takes, in seconds: a scene's morph, or a dial's short glide  |

Both shares are 1 with the piece as composed and 0 with one sound left: the one sound Energy never takes out is not counted. Their product is how full the piece stands (`fullnessOf`). With `perform` handed, the desk does four things.

| From                  | The picture                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fullness under 1      | The visuals that paint for the whole piece leave one after another, the last drawn first and the first never (`stayShare`). Every visual that paints shows less and stands further off, and the palette is calmer. |
| Fullness under Energy | The `energy` every style and knob is handed is the lower of the dial and the fullness, so a scene that takes sounds out moves a Glow that follows Energy as the dial would.                                        |
| Tone off its rest     | A filter over the finished picture. Under the rest its fine detail goes and it dims, and the grain is finer. Over the rest its broad light goes and the fine detail stays, and the grain is coarser.               |
| Space off its rest    | Over the rest, what was on the screen stays a while, drifts outward and spreads. Under it, the trails the piece has are shortened.                                                                                 |

Tone and Space do nothing within `DIAL_REST_SPAN` (0.02) of the middle, the span a low-pass and high-pass on the mix would leave alone. A visual linked to a stroke or drawn for a stretch is never thinned out: it already comes and goes by itself (`paintsWholePiece` tells the two apart).

**A piece as composed is the frame it was.** Both shares at 1 and Tone and Space at rest ask nothing, whatever Energy is: the layers, the palette, the grain and the signals are value for value what the desk makes with no `perform`, and the frame has no `filter`.

**The picture takes as long as the move.** A reading says where a performance is heading, not how far it has come. The desk takes each value there by the time that really went by, with a quarter of `overSec` as its time constant, and each value keeps the pace of the move that last changed it: a dial turned while sounds are still fading leaves their fade alone. The first frame stands where the performance does. With `perform` handed, the three dials in a frame's signals are the eased ones.

What is asked is written into the frame. Thinning, the step back, the calmer palette and the trails are in its layers, palette and grain. The pass over the finished picture is `frame.filter`, a `VisualFilter` of four parts from 0 to 1: `soft`, `dim`, `thin` and `spread`. A frame goes down a line whole, so a second screen paints the same.

`performMoves(now)` says the same in plain values, for a host to put into words: one entry for each thing that is moved (`thins` from the sounds, `softens` or `sharpens` from Tone, `rings` or `dries` from Space) with how far, and none for a piece as composed. `staying(full, count)` says how many of so many whole-piece visuals show.

The amounts are a first setting and have not been judged by eye on a real screen.

## Painting

`showVisuals(canvas, frameAt, options)` paints `frameAt(now)` on a canvas for as long as it is shown and hands back the way to stop. It sizes the canvas to what the page gives it (a screen sharper than two device pixels a point is drawn as one that sharp), paints thirty times a second unless `fps` says otherwise, four times a second for someone who asked their system for less motion unless `always` is set, and nothing while `still()` answers true or the canvas has no size. A frame that cannot be painted is handed to `onError` and the frame before it stays.

A host with a frame loop of its own paints by hand: `createStage()` makes a stage for one canvas (it remembers what that canvas showed, for Trails), and `stage.paint(context, frame, scale)` paints a frame over the whole of it. It answers true while a style was not ready yet, when the frame should be painted again though nothing changed.

A frame's `filter` is drawn on the canvas that is shown, after the finished picture is copied there and before the grain. What Trails keeps of a frame is the picture without it, so a filter is never laid over what was filtered the frame before. The picture is blurred once for it, by drawing it at half the size again and again and back up, and that copy serves every part: mixed in it softens, added it spreads, and inverted and multiplied in it takes from each point the broad light around it. No pixel is read back.

All of it is drawn with WebGL 2 in **one context for the whole page** (`visualRig`), however many canvases show pictures: a style is drawn there at the size asked, never wider than 960 pixels, and copied to the 2D canvas that wants it. A shader is fetched and made the first time its style is asked for, one new shader a frame, so a long list of styles does not freeze a page as it opens. A style that cannot be made is given up on alone and the others still draw; one whose script could not be fetched is asked for again a few seconds later. A context that is lost (a phone takes it away when the page is put aside) is made again when it comes back.

`visualsMayDraw()` says whether pictures can be drawn here as far as is known, without making the context; `visualsReady()` makes it and says for certain; `watchVisuals(watcher)` tells when that changes. Where there is no WebGL 2 the model and the desk still work, so a host can add, change and keep visuals there, and a browser that has it draws them. `VISUALS_NOT_DRAWN_NOTE` is a sentence for the place where the picture would be.

## Pedals on the picture

A few of the piece's devices can lie on the picture as pedals, the way gear lies on a table that is filmed from above: each is the device's own plate, with its knobs where they stand. The model keeps which device lies where; drawing the plate is the host's, with `DevicePlate` from `./react` over the canvas the picture is painted on. The **Table** style is a ground made for it, and pedals lie over any picture.

```json
{ "pedals": [{ "device": "tape-echo-1", "x": 0.2, "y": 0.7, "size": 0.42, "turn": -2 }] }
```

- `device` is the device's id in the piece (a `ScoreDevice`'s `id`). A device lies on the picture once.
- `x` and `y` are where its middle lies, 0 to 1 across the picture from the left and down it from the top. `size` is how tall it is as a share of the picture's height (`PEDAL_FIRST_SIZE` 0.42 at first, between `PEDAL_LEAST_SIZE` and `PEDAL_MOST_SIZE`), so a pedal takes the same share of the picture at any size it is shown: a host zooms the plate by `size × the picture's height ÷ the plate's own height`. `turn` is in degrees clockwise, at most `PEDAL_MOST_TURN` (45) either way, and is written only when it is not 0.
- They are drawn in their order, a later one over an earlier one. At most `VISUAL_PEDALS_MAX` (8) lie on a picture. `pedals` is left out of what is written where none lies.
- `layPedal(set, device, place?)` lays one: at the place given, or on the next free spot of a row across the lower half and then a row above it, each spot turned a little and no two alike. A device that already lies there is moved instead. `movePedal` moves, sizes and turns one, and lays it over the others; `liftPedal` and `liftPedals` take one or all off; `pedalOf` finds a device's pedal. Each hands back the next set, or the same set when nothing changed.
- `withoutLostPedals(set, deviceIds)` drops the pedals of devices that are no longer in the piece. `carryPedals(set, renamed)` goes on with devices a host gave other ids.

A plate can be drawn into **another window's document**: a host that opened a window for a second screen renders the plates there from its own page (a React portal into that window), so they are the real devices with their knobs and displays live, and nothing about them is sent. A plate asks the window it is drawn in for its screen's pixel ratio, its computed colours and its observers, so it is sharp on a second screen of another density. Hand the plates a frame source of that window (`LiveMixProvider`'s `frame`, on its `requestAnimationFrame`), so they keep moving while the page that renders them is covered.

## A second screen

The picture can be shown in another window of the same site: one that is put on a second screen, or shared in a call while the instrument stays private. The window with the piece sends its frames, and the other only paints them.

```ts
// In the window with the piece:
const sender = sendVisuals('picture', (now) => desk.frame(now))

// In the window that only shows it:
const screen = receiveVisuals('picture')
const stop = showVisuals(canvas, screen.frameAt, { always: true })
```

`sendVisuals(name, frameAt, options)` sends `frameAt(now)` down the line of that name thirty times a second (`fps`), and works out and sends nothing while no screen listens. It keeps its own pace, so the picture is sent on whether or not its own window paints it too; `every` hands it a pace that a covered window keeps ([In step with the sound](#in-step-with-the-sound)). `sender.watched()` says whether a screen is listening; `sender.close()` ends it.

`receiveVisuals(name)` listens there. `screen.frameAt` is what `showVisuals` is handed: the frame that came last, with its time and its travel moved on by this window's own clock, so the picture still drifts evenly where the sender is slowed down (a browser gives a window that is covered few turns). What is heard stays as it came, since only the sender hears. Before a frame has come it answers a dark frame. `screen.live()` is false until the first frame and again when none came for three seconds, for a host that wants to say so; `screen.close()` tells the sender it left.

The line is a `BroadcastChannel`, which reaches every window and frame of the same origin in the same browser, and no other machine. A host with another way between its windows hands it over as `open: (name) => line`, anything with `postMessage`, `onmessage` and `close`. A frame is about eight kilobytes, most of it the small picture of the piece.

## In step with the sound

A sound that comes in should show as it is heard. Five things decide whether it does.

- **How fast a level follows.** A level (each kind of sound, the mix, the bands, the live input) comes up to what it reads in about 30 ms and falls back in about 120 ms, so a sound shows as it comes in and leaves a little after it has gone. It follows by the time that really went by: a page that paints seldom is not further behind for it. Only what runs on by itself (`time`, `travel`) takes no frame to be longer than a tenth of a second.
- **How a style on a stretch comes in.** A style placed for a stretch of beats is all there an eighth of a beat after the stretch starts, and goes out over its last beat: a stretch that starts where a sound does shows with it, where it used to take a beat to come in. A bend is still eased over a beat at either end, since a picture that folds or turns all at once jumps. A linked visual shows as far as its stroke sounds, and one for the whole piece is always there.
- **Which moment the desk is handed.** `playheadSec` is read each frame. Hand it the engine's clock itself, not a playhead that is moved along by the page's own frames: a window that is covered gets none, and its picture on a second screen then stands still or steps once a second.
- **How long the sound takes to the speakers.** The engine's clock and the ear run ahead of what is heard by the output's latency, a few tens of milliseconds on speakers and a fifth of a second or more on a wireless headset. `outputLatencySec(context)` says how long as far as the browser knows; a host takes it off the playhead, and asks the ear for what it read that long ago with `ear.read(agoSec)` (it keeps half a second).
- **How often the frames go to a second screen.** A browser slows the timers of a covered page to one a second. `sendVisuals` takes `every: (turn, ms) => stop`, a pace kept where it is not slowed, a worker's timer for one.

How far apart the two are can be measured as they run:

```ts
const clock = () => performance.now() / 1000
const scope = new SyncScope() // the last 8 s, to 10 ms, up to 1.5 s apart
const trace = hearTrace(engine.context, engine.master, clock)

// A few times a second or more: every 5 ms of sound, at the time it leaves the speakers.
trace.read((atSec, level) => scope.put('sound', atSec, level))
// After each paint: how lit the picture is, or anything else that should move with the sound.
scope.put('picture', clock(), lightOf(canvas) ?? 0)

scope.behind('picture', 'sound', clock()) // { behindSec: 0.04, alike: 0.9 }, or null
```

`behind` lays the rises of one trace over the rises of the other and slides them until they fit best: `behindSec` is how long after the other the trace moves (under nothing where it moves first), and `alike` how well they fit there, 0 to 1. Under `SYNC_SURE` the two did not clearly move together and the distance says little; it is null where either hardly rose in the span, as in a passage that only holds. Only rises count, since a picture lets a sound go slower than it lets it in. A trace is read between the least and the most it stood at in the span, so a picture that only brightens a hundredth is held against the sound as well as one that goes from black to white. `scope.line(trace, from, to, count)` gives a trace as levels for drawing, `scope.rate(trace, now)` how often it was put down a second, which for the picture is how often it is painted, and `scope.longest(trace, now)` the longest it went without.

What the scope cannot see is the screen itself, which shows a frame one or two of its own frames after it was painted.

How fast the styles themselves show a sound was measured once, on 15 October 2026 in headless Chromium with software rendering: each of the forty-one painted frame by frame at an even thirty frames a second of the piece's own time, with and without a stroke that starts at second 2, and the two pictures held against each other. From silence, every style had changed by half of the most it would within two frames, and by two thirds or more a tenth of a second in. With a drone already sounding and a second one coming in, thirty-nine were half way within a tenth of a second; the dot lattice took 0.3 s and the lit cloud a second, but in those the two pictures go on drifting apart for seconds (a fuller mix moves a picture faster), so the most they differ comes late. None is slow of itself. How much a picture changes is another matter: a sound that comes in moves the average pixel by between 0.6 and 20 hundredths of full, least in the quiet styles (growth, clouds, the lit cloud, the dot screen).

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

- The model, the signals, the frame, the line to a second screen and the scope that measures how far a picture is behind the sound are covered by unit tests in Node (`src/visuals/__tests__`).
- Every style in both variations, every bend over a style, a canvas left to `showVisuals`, and one painted from frames that went down a `BroadcastChannel` are drawn from the built entry in headless Chromium (`browser-tests/specs/visuals.spec.ts`). That machine has no graphics card, so they are drawn in software.
- The filter a performance asks for is painted in the same browser on 15 October 2026: one frame of a style is painted as it is and with each part of the filter, and the two pictures are held against each other. Soft leaves under 0.7 of the difference between neighbouring pixels, dim leaves the light asked, spread adds light. Thin, looked at on a style with broad light on 16 October 2026, takes 0.36 of its light and 0.30 of the difference between neighbouring pixels: more of the broad light than of the fine detail. Under Trails, measured the same day, one painting without the filter after thirty with it is the picture of a screen that never had a filter, so none of it is in what the stage keeps. Both checks were seen to fail on a stage changed for the purpose: one that keeps the filter, and one that multiplies by the blur without turning it over. Three styles were measured with a performance over them there: with one sound left the picture has 0.48 to 0.67 of the light it has as composed, with Tone all the way down 0.61 to 0.63 of the light and about a quarter of the fine detail, with Tone all the way up 0.73 to 0.94 of the light, with Space all the way up 1.6 to 1.9 times the light, and with one sound left and Tone down 0.27 to 0.39, still lit over a quarter to a half of the picture.
- **Not checked:** how a performance looks in the picture to an eye, on any screen, and whether its amounts are right; the pictures on a real graphics card, how fast each style draws there, a phone, the line between two windows of which one is covered or on another screen, and how far a picture is behind the sound on a machine that paints at a screen's pace (the machine these were run on paints four to twelve frames a second while a piece plays).
