// One stage of a technique: a small picture of the signal there, its name, where it comes from,
// and, where the stage is sound, a button to hear it.

import { labStore, useLab } from '../lab/page.ts'
import { ORIGIN_TEXT } from '../lab/describe.ts'
import type { Tap } from '../lab/store.ts'
import { rgbOf, useCanvas } from './canvas.ts'
import { AUDIBLE, minMaxColumns, minMaxPlaced, rangeOf, toUnit } from './draw.ts'
import type { TapRef } from './roles.ts'

/** What a stage that is not sound is, in a word, where the listen button would be. */
const KIND_WORD: Record<TapRef['kind'], string> = {
  audio: 'Sound',
  control: 'A value over time',
  curve: 'A curve',
  spectrum: 'A spectrum',
  frames: 'A spectrum over time',
}

function Small({ tap, data }: { tap: TapRef; data: Tap | undefined }) {
  const canvas = useCanvas(
    (context, width, height, c) => {
      const ys = data?.channels_data[0]
      if (!data || !ys || ys.length === 0) return
      const colour = c.role[tap.role]
      context.strokeStyle = colour
      context.fillStyle = colour
      const pad = 3
      const h = height - 2 * pad
      if (data.kind === 'audio') {
        const ends = minMaxColumns(ys, 0, ys.length, width)
        const [lo, hi] = rangeOf(ys)
        const peak = Math.max(Math.abs(lo), Math.abs(hi), 1e-6)
        for (let col = 0; col < width; col += 1) {
          const top = pad + (1 - (ends[2 * col + 1]! / peak + 1) / 2) * h
          const bottom = pad + (1 - (ends[2 * col]! / peak + 1) / 2) * h
          context.fillRect(col, top, 1, Math.max(1, bottom - top))
        }
        return
      }
      if (data.kind === 'frames' && data.columns > 0) {
        const rows = Math.floor(ys.length / data.columns)
        const quiet = rgbOf(c.panel)
        const loud = rgbOf(colour)
        const image = new ImageData(data.columns, rows)
        for (let col = 0; col < data.columns; col += 1) {
          for (let row = 0; row < rows; row += 1) {
            const unit = Math.min(1, Math.max(0, (ys[col * rows + row]! + 90) / 90))
            const at = ((rows - 1 - row) * data.columns + col) * 4
            for (let k = 0; k < 3; k += 1)
              image.data[at + k] = quiet[k]! + (loud[k]! - quiet[k]!) * unit
            image.data[at + 3] = 255
          }
        }
        const small = document.createElement('canvas')
        small.width = data.columns
        small.height = rows
        small.getContext('2d')?.putImageData(image, 0, 0)
        context.drawImage(small, 0, 0, width, height)
        return
      }
      // A line, fitted to its own range. A spectrum stands on the audible band's logarithmic axis.
      const spectrum = data.kind === 'spectrum'
      const place = spectrum
        ? (i: number) =>
            toUnit(AUDIBLE, data.x0 + ((data.x1 - data.x0) * i) / Math.max(1, ys.length - 1))
        : (i: number) => i / Math.max(1, ys.length - 1)
      const ends = minMaxPlaced(ys, place, width)
      let [lo, hi] = rangeOf(ys)
      if (spectrum) lo = Math.max(lo, hi - 90)
      const span = hi - lo || 1
      context.lineWidth = 1.5
      context.beginPath()
      let pen = false
      for (let col = 0; col < width; col += 1) {
        const top = ends[2 * col + 1]!
        if (Number.isNaN(top)) continue
        const at = pad + (1 - (Math.max(lo, top) - lo) / span) * h
        if (pen) context.lineTo(col, at)
        else context.moveTo(col, at)
        pen = true
        const bottom = ends[2 * col]!
        if (bottom < top) context.lineTo(col, pad + (1 - (Math.max(lo, bottom) - lo) / span) * h)
      }
      context.stroke()
    },
    [data],
  )
  return <canvas ref={canvas} aria-hidden="true" />
}

export default function Stage({ tap, step }: { tap: TapRef; step: number }) {
  const state = useLab()
  const data = state.result?.taps[tap.id]
  const sounding = state.playing && state.sounding === tap.id
  const canListen = tap.kind === 'audio'
  return (
    <li className="stage" data-stage={tap.id} data-sounding={sounding ? '' : undefined}>
      <span className="stage-step">{step}</span>
      <div
        className="stage-picture"
        data-figure
        data-drawn={data && data.length > 0 ? '' : undefined}
      >
        <Small tap={tap} data={data} />
      </div>
      <strong className="stage-name">{tap.name}</strong>
      <span className="stage-origin" data-origin={tap.origin}>
        {ORIGIN_TEXT[tap.origin]}
      </span>
      {canListen ? (
        <button
          type="button"
          className="stage-listen"
          aria-pressed={sounding}
          disabled={!data}
          onClick={() => (sounding ? labStore().stop() : labStore().listen(tap.id))}
        >
          {sounding ? 'Stop' : 'Listen'}
        </button>
      ) : (
        <span className="stage-kind">{KIND_WORD[tap.kind]}</span>
      )}
    </li>
  )
}
