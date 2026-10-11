// The video kit on one page: every element a timeline, a panel, a sheet and a
// note are drawn with, mounted with made-up content, so each can be looked at
// in a theme. A page for building and checking the elements, and for taking
// their pictures. Nothing here sounds or edits anything.
//
//   video-kit.html                   graphite
//   ?theme=paper                     any of the kit's themes
//   ?sheet=1                         with the sheet open

import '@kieranklaassen/live-mix/react/styles.css'

import { StrictMode, useState, type CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'

import { computePeaks } from '@kieranklaassen/live-mix'
import {
  ChangedMark,
  Check,
  ContextChip,
  CutNotch,
  CutSeam,
  Glyph,
  GLYPHS,
  InlineNote,
  Input,
  JobRow,
  Lane,
  LaneHead,
  LinkMark,
  LogRow,
  Menu,
  MenuItem,
  MenuSeparator,
  NoteBubble,
  NotePin,
  NoteSpan,
  NoteTab,
  Overview,
  PaintField,
  Panel,
  PanelHead,
  PictureMark,
  Playhead,
  Progress,
  PropRow,
  RangeSelection,
  ReferenceChip,
  rulerScale,
  SectionLabel,
  Segmented,
  Select,
  Sheet,
  StateMark,
  Stroke,
  Tabs,
  TextButton,
  TimelineItem,
  TimeRuler,
  TranscriptWord,
  TransitionMark,
  VideoStroke,
  WhoMark,
  type GlyphKind,
} from '@kieranklaassen/live-mix/react'

const query = new URLSearchParams(location.search)
const theme = query.get('theme') ?? 'graphite'

const PX = 20
const HEAD = 160
const FIELD = 1000

/** A made-up waveform: a phrase, a breath, a phrase. */
function voicePeaks() {
  const samples = new Float32Array(4000)
  for (let n = 0; n < samples.length; n += 1) {
    const t = n / samples.length
    const phrase = Math.max(0, Math.sin(t * Math.PI * 5)) ** 2
    samples[n] = phrase * Math.sin(n * 0.9) * (0.5 + 0.5 * Math.sin(n * 0.013))
  }
  return computePeaks([samples], samples.length, 256)
}

const peaks = voicePeaks()

const label: CSSProperties = { margin: '20px 0 8px', color: 'var(--lm-muted)' }
const at = (left: number, top = 0): CSSProperties => ({ position: 'absolute', left, top })

function Timeline() {
  const { minorSec, majorColumns } = rulerScale(PX)
  return (
    <div style={{ width: HEAD + FIELD, border: '1px solid var(--lm-rule)' }}>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            width: HEAD,
            height: 20,
            padding: '0 8px',
            background: 'var(--lm-panel)',
            borderBottom: '1px solid var(--lm-rule)',
          }}
        >
          <span className="lm-lbl">5 tracks</span>
        </div>
        <TimeRuler pxPerSecond={PX} width={FIELD}>
          <RangeSelection x={440} width={120} />
          <CutNotch x={700} label="2.4 s removed" />
          <Playhead x={300} flag />
        </TimeRuler>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ position: 'relative', width: HEAD }}>
          <LaneHead name="Notes" height={20} glyph={<Glyph kind="note" />} note="3" />
          <LaneHead name="Titles" height={20} glyph={<Glyph kind="title" />} />
          <LaneHead name="Look" height={20} glyph={<Glyph kind="zoom" />} />
          <LaneHead
            name="Display"
            brush={2}
            height={40}
            glyph={<Glyph kind="display" />}
            note="Take 1, Take 2"
            selected
          />
          <LaneHead name="Webcam" brush={4} height={20} glyph={<Glyph kind="webcam" />} />
          <LaneHead
            name="Voice"
            brush={1}
            height={40}
            glyph={<Glyph kind="microphone" />}
            mute={false}
            solo={false}
            note="-12.4 dB"
          />
          <LaneHead
            name="Music"
            brush={5}
            height={20}
            glyph={<Glyph kind="music" />}
            mute
            solo={false}
          />
          <LinkMark top={60} height={100} />
        </div>
        <PaintField
          columnPx={minorSec * PX}
          rowPx={20}
          majorColumns={majorColumns}
          majorRows={0}
          style={{ width: FIELD, height: 180 }}
        >
          <Lane top={0} height={20}>
            <NoteSpan x={440} width={120} />
            <NotePin x={440} number={1} text="Cut this pause" line={{ height: 160 }} />
            <NotePin x={620} number={2} text="Zoom in on the button" state="sent" />
            <NotePin x={800} number={3} text="Is this the right take?" from="agent" />
            <NotePin x={160} number={4} text="Trim the start" state="resolved" />
          </Lane>
          <Lane top={20} height={20}>
            <TimelineItem
              style={at(40)}
              width={180}
              glyph={<Glyph kind="title" />}
              name="Welcome to Fieldnote"
              fadeIn={0.3}
              fadeOut={0.3}
            />
            <TimelineItem
              style={at(520)}
              width={140}
              glyph={<Glyph kind="callout" />}
              name="New here"
              tags={['attached']}
              selected
            />
            <ChangedMark style={at(516, -2)} />
          </Lane>
          <Lane top={40} height={20}>
            <TimelineItem
              style={at(120)}
              width={160}
              shape="envelope"
              glyph={<Glyph kind="follows" />}
              name="2.2×"
              rampIn={24}
              rampOut={24}
            />
            <TimelineItem
              style={at(400)}
              width={120}
              shape="envelope"
              glyph={<Glyph kind="point" />}
              name="1.8×"
              rampIn={16}
              rampOut={40}
              selected
            />
            <TimelineItem
              style={at(640)}
              width={240}
              shape="span"
              glyph={<Glyph kind="layout" />}
              name="Side by side"
              rampIn={20}
            />
          </Lane>
          <Lane top={60} height={40}>
            <VideoStroke
              style={at(0)}
              width={700}
              height={40}
              brush={2}
              name="Display"
              hits={[0.12, 0.3, 0.31, 0.55, 0.8]}
              selected
            />
            <VideoStroke
              style={at(700)}
              width={300}
              height={40}
              brush={2}
              name="Display"
              tags={['1.5×']}
              automation={{
                label: 'Speed',
                points: [
                  [0, 0.3],
                  [0.6, 0.3],
                  [1, 0.8],
                ],
              }}
            />
            <TransitionMark style={at(690, 10)} width={20} height={20} label="Cross dissolve" />
          </Lane>
          <Lane top={100} height={20}>
            <VideoStroke style={at(0)} width={700} height={20} brush={4} name="Webcam" linked />
            <VideoStroke style={at(700)} width={300} height={20} brush={4} name="Webcam" missing />
          </Lane>
          <Lane top={120} height={40}>
            <Stroke
              style={at(0)}
              width={700}
              height={40}
              brush={1}
              name="Voice"
              peaks={peaks}
              fadeIn={0.02}
            />
            <Stroke
              style={at(700)}
              width={300}
              height={40}
              brush={1}
              name="Voice"
              peaks={peaks}
              muted
            />
          </Lane>
          <Lane top={160} height={20}>
            <Stroke
              style={at(0)}
              width={1000}
              height={20}
              brush={5}
              name="Music"
              peaks={peaks}
              repeats={3}
            />
          </Lane>
          <RangeSelection x={440} width={120} strength="lane" />
          <CutSeam x={700} top={60} height={100} />
          <Playhead x={300} />
        </PaintField>
      </div>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            width: HEAD,
            height: 20,
            background: 'var(--lm-panel)',
            borderTop: '1px solid var(--lm-rule)',
          }}
        >
          <TextButton cell icon aria-label="Zoom out">
            −
          </TextButton>
          <TextButton cell icon aria-label="Zoom in">
            +
          </TextButton>
          <span className="lm-num" style={{ padding: '0 8px', lineHeight: '19px' }}>
            20 px/s
          </span>
          <TextButton cell>Fit</TextButton>
        </div>
        <Overview
          style={{ flex: 1 }}
          duration={200}
          windowStart={0}
          windowEnd={50}
          playhead={15}
          cuts={[35, 90, 140]}
          notes={[22, 31, 40]}
        />
      </div>
    </div>
  )
}

function Controls() {
  const [tab, setTab] = useState<string | null>('inspector')
  const [text, setText] = useState('00:44.0')
  const [target, setTarget] = useState('follow')
  const [format, setFormat] = useState('h264')
  const [snap, setSnap] = useState(true)
  return (
    <Panel style={{ width: 320, border: '1px solid var(--lm-rule)' }}>
      <Tabs
        tabs={[
          { id: 'inspector', label: 'Inspector' },
          { id: 'agent', label: 'Agent', count: 2 },
        ]}
        selected={tab}
        onSelect={setTab}
      />
      <PanelHead
        title="Zoom"
        glyph={<Glyph kind="zoom" />}
        actions={
          <TextButton cell icon aria-label="Close">
            <Glyph kind="close" />
          </TextButton>
        }
      />
      <SectionLabel aside={<span className="lm-num">6.0 s</span>}>Timing</SectionLabel>
      <PropRow label="Start" htmlFor="start">
        <Input id="start" value={text} onChange={setText} numeric />
      </PropRow>
      <PropRow label="Target">
        <Segmented
          fill
          options={[
            { value: 'follow', label: 'Follow the cursor' },
            { value: 'point', label: 'Hold a point' },
          ]}
          value={target}
          onChange={setTarget}
        />
      </PropRow>
      <PropRow label="Format" htmlFor="format">
        <Select
          id="format"
          value={format}
          onChange={setFormat}
          options={[
            { value: 'h264', label: 'H.264' },
            { value: 'hevc', label: 'HEVC' },
          ]}
        />
      </PropRow>
      <PropRow label="Snap">
        <Check checked={snap} onChange={setSnap} label="On" />
      </PropRow>
      <PropRow label="Length">
        <span className="lm-prop__text">6.0 s</span>
      </PropRow>
      <div style={{ display: 'flex', gap: 8, padding: 10, flexWrap: 'wrap' }}>
        <TextButton>Split</TextButton>
        <TextButton shortcut="⇧⌫">Ripple delete</TextButton>
        <TextButton pressed>Linked</TextButton>
        <TextButton variant="quiet">Transcript</TextButton>
        <TextButton variant="quiet" pressed>
          Agent
        </TextButton>
        <TextButton variant="danger">Remove</TextButton>
        <TextButton disabled>Redo</TextButton>
        <TextButton variant="primary">Export</TextButton>
        <TextButton variant="primary" size="large">
          Start recording
        </TextButton>
      </div>
    </Panel>
  )
}

function Rows() {
  return (
    <Panel style={{ width: 320, border: '1px solid var(--lm-rule)' }}>
      <PanelHead title="Agent" glyph={<Glyph kind="agent" />} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 20, padding: '0 8px' }}>
        <StateMark state="on" />
        <span>Claude Code is connected, over the bridge</span>
      </div>
      <SectionLabel>Jobs</SectionLabel>
      <JobRow
        title="Export"
        state="running"
        progress={0.42}
        note="2 min left"
        onCancel={() => undefined}
      />
      <JobRow title="Transcribe" state="done" note="12:04, 1,204 words" />
      <JobRow title="Cloud copy" state="failed" note="The server could not be reached" />
      <SectionLabel>Call log</SectionLabel>
      <LogRow
        who="outside"
        name="Claude Code"
        title="Ripple-delete a range"
        time="12:04:09"
        outcome={{ ok: true, text: '2.4 s removed' }}
        args='{"start":35,"end":37.4}'
        undo={{ label: 'Undo', onUndo: () => undefined }}
      />
      <LogRow
        who="agent"
        name="Agent"
        title="Split the clip"
        time="12:03:51"
        outcome={{ ok: false, error: 'No clip is under 92 s.' }}
        hovered
      />
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InlineNote title="The agent has no model key." action={<TextButton>Account</TextButton>}>
          Add your own key under Account. Outside agents still work over the bridge.
        </InlineNote>
        <InlineNote tone="danger" role="alert" title="Nothing was imported.">
          This project was saved by a version Cutroom does not know yet.
        </InlineNote>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress value={0.6} label="Zooms" />
          <span className="lm-num">60%</span>
          <WhoMark who="person" />
          <WhoMark who="agent" />
          <WhoMark who="outside" />
          <StateMark state="off" />
          <StateMark state="busy" />
          <StateMark state="failed" />
        </div>
      </div>
    </Panel>
  )
}

function Words() {
  const words: [string, 'rest' | 'selected' | 'removed' | 'filler' | 'now', boolean?][] = [
    ['So', 'rest'],
    ['um', 'filler'],
    ['this', 'rest'],
    ['is', 'rest'],
    ['the', 'now'],
    ['new', 'selected'],
    ['editor', 'selected'],
    ['1.4 s', 'removed', true],
    ['and', 'removed'],
    ['you', 'removed'],
    ['can', 'rest'],
    ['cut', 'rest'],
    ['by', 'rest'],
    ['reading.', 'rest'],
  ]
  return (
    <Panel style={{ width: 320, border: '1px solid var(--lm-rule)' }}>
      <PanelHead title="Transcript" glyph={<Glyph kind="transcript" />} />
      <div style={{ padding: '4px 8px 10px' }}>
        {words.map(([text, state, pause], index) => (
          <TranscriptWord key={index} text={text} state={state} pause={pause} />
        ))}
      </div>
      <SectionLabel>What goes to the agent</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8 }}>
        <ContextChip
          kind="selection"
          glyph={<Glyph kind="zoom" />}
          text="Zoom 2.2×"
          time="00:44.0 to 00:50.0"
          onRemove={() => undefined}
        />
        <ContextChip kind="note" number={1} text="Cut this pause" onRemove={() => undefined} />
        <ReferenceChip kind="moment" label="00:44.0" onGo={() => undefined} />
        <ReferenceChip
          kind="item"
          label="Zoom 2.2×"
          glyph={<Glyph kind="zoom" />}
          onGo={() => undefined}
        />
        <NoteTab number={1} />
        <NoteTab number={2} state="sent" />
        <NoteTab number={3} from="agent" />
        <NoteTab number={4} state="resolved" />
      </div>
      <div
        style={{
          position: 'relative',
          height: 140,
          margin: 8,
          background: 'linear-gradient(135deg, #2f3b55, #8a6f4d)',
        }}
      >
        <PictureMark
          kind="box"
          points={[
            [30, 30],
            [130, 80],
          ]}
          number={2}
        />
        <PictureMark
          kind="arrow"
          points={[
            [260, 110],
            [180, 60],
          ]}
        />
        <NoteBubble number={2} text="Blur this" editing style={{ left: 140, top: 86 }} />
      </div>
    </Panel>
  )
}

function Glyphs() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: 640 }}>
      {(Object.keys(GLYPHS) as GlyphKind[]).map((kind) => (
        <span key={kind} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Glyph kind={kind} />
          <span className="lm-lbl">{kind}</span>
        </span>
      ))}
    </div>
  )
}

function App() {
  const [sheet, setSheet] = useState(query.get('sheet') === '1')
  const [menu, setMenu] = useState(true)
  return (
    <div
      data-lm-theme={theme}
      className="lm-app"
      style={{ position: 'relative', minHeight: '100vh', padding: 20 }}
    >
      <p style={{ ...label, marginTop: 0 }}>Timeline</p>
      <Timeline />
      <p style={label}>Panels, controls, rows, words and notes</p>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <Controls />
        <Rows />
        <Words />
        <div style={{ position: 'relative', width: 200, height: 120 }}>
          <TextButton onClick={() => setMenu((open) => !open)}>Project</TextButton>
          {menu ? (
            <Menu style={{ left: 0, top: 20 }} onClose={() => setMenu(false)}>
              <MenuItem shortcut="⌘N" onSelect={() => undefined}>
                New
              </MenuItem>
              <MenuItem shortcut="⌘S" onSelect={() => undefined}>
                Save
              </MenuItem>
              <MenuSeparator />
              <MenuItem checked={theme === 'graphite'} onSelect={() => undefined}>
                Graphite
              </MenuItem>
              <MenuItem checked={theme === 'paper'} onSelect={() => undefined}>
                Paper
              </MenuItem>
              <MenuSeparator />
              <MenuItem onSelect={() => setSheet(true)}>Open the sheet…</MenuItem>
            </Menu>
          ) : null}
        </div>
      </div>
      <p style={label}>Glyphs</p>
      <Glyphs />
      {sheet ? (
        <Sheet
          title="Import"
          onClose={() => setSheet(false)}
          footer={
            <>
              <TextButton onClick={() => setSheet(false)}>Cancel</TextButton>
              <TextButton variant="primary" onClick={() => setSheet(false)}>
                Open in the editor
              </TextButton>
            </>
          }
        >
          <PropRow label="Project">
            <span className="lm-prop__text">Fieldnote walkthrough</span>
          </PropRow>
          <PropRow label="Length">
            <span className="lm-prop__text lm-num">03:20.0</span>
          </PropRow>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 20, padding: '0 8px' }}
          >
            <StateMark state="on" />
            <span>Project read</span>
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 20, padding: '0 8px' }}
          >
            <StateMark state="busy" />
            <span>Zooms proposed</span>
            <Progress value={0.6} label="Zooms proposed" />
          </div>
        </Sheet>
      ) : null}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
