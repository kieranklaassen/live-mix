// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Glyph } from '../components/Glyph'
import { Lane, LaneHead } from '../components/Lane'
import { Overview } from '../components/Overview'
import { envelopePath, TimelineItem } from '../components/TimelineItem'
import {
  CutNotch,
  CutSeam,
  LinkMark,
  RangeSelection,
  TransitionMark,
} from '../components/timeline-marks'
import { Playhead, TimeRuler } from '../components/TimeRuler'
import { VideoStroke } from '../components/VideoStroke'

afterEach(cleanup)

describe('TimeRuler and Playhead', () => {
  it('labels every labelled tick with the given format, at its px', () => {
    render(
      <TimeRuler
        pxPerSecond={20}
        width={500}
        format={(seconds) => `${seconds}s`}
        data-testid="ruler"
      />,
    )
    const ticks = screen.getByTestId('ruler').querySelectorAll<HTMLElement>('.lm-ruler__tick')
    expect([...ticks].map((tick) => tick.textContent)).toEqual(['0s', '10s', '20s'])
    expect(ticks[1]).toHaveStyle({ left: '200px' })
    expect(screen.getByTestId('ruler')).toHaveStyle({ width: '500px' })
  })

  it('draws its minor ticks from the scale, starting on a whole tick wherever the window starts', () => {
    render(<TimeRuler start={3} pxPerSecond={20} width={500} data-testid="ruler" />)
    const ruler = screen.getByTestId('ruler')
    // Two seconds to a minor tick at this scale: 40 px, and the window starts 20 px into one.
    expect(ruler.style.getPropertyValue('--lm-ruler-minor')).toBe('40px')
    expect(ruler.style.getPropertyValue('--lm-ruler-offset')).toBe('-20px')
  })

  it('holds its children and hands its handlers and attributes to the root', () => {
    const onPointerDown = vi.fn()
    render(
      <TimeRuler
        pxPerSecond={20}
        width={400}
        role="slider"
        aria-label="Playhead"
        data-action="seek"
        onPointerDown={onPointerDown}
      >
        <Playhead x={120} flag data-testid="head" />
      </TimeRuler>,
    )
    const ruler = screen.getByRole('slider', { name: 'Playhead' })
    expect(ruler).toHaveAttribute('data-action', 'seek')
    fireEvent.pointerDown(ruler)
    expect(onPointerDown).toHaveBeenCalledOnce()
    expect(screen.getByTestId('head')).toHaveStyle({ left: '120px' })
    expect(screen.getByTestId('head').querySelector('.lm-playhead__flag')).not.toBeNull()
  })

  it('draws the flag only when asked, and leaves its place to a host that moves it by transform', () => {
    render(<Playhead data-testid="head" style={{ transform: 'translateX(40px)' }} />)
    const head = screen.getByTestId('head')
    expect(head.querySelector('.lm-playhead__flag')).toBeNull()
    expect(head.style.left).toBe('')
    expect(head).toHaveStyle({ transform: 'translateX(40px)' })
  })
})

describe('Lane and LaneHead', () => {
  it('places a lane at its top with its height, and marks a tall one', () => {
    render(
      <Lane top={60} height={40} role="group" aria-label="Display track" data-testid="lane">
        <span>clip</span>
      </Lane>,
    )
    const lane = screen.getByRole('group', { name: 'Display track' })
    expect(lane).toHaveClass('lm-lane', 'lm-lane--tall')
    expect(lane).toHaveStyle({ top: '60px', height: '40px' })
    expect(lane).toHaveTextContent('clip')
  })

  it('names the head, with its swatch in the brush and its glyph', () => {
    render(
      <LaneHead
        name="Display"
        brush={8}
        height={20}
        glyph={<Glyph kind="display" />}
        note="3"
        data-testid="head"
      />,
    )
    const head = screen.getByTestId('head')
    expect(head).toHaveTextContent('Display3')
    expect(head.querySelector('.lm-swatch')).toHaveClass('lm-swatch--b2')
    expect(head.querySelector('.lm-glyph--display')).not.toBeNull()
    expect(head.querySelectorAll('.lm-lane-head__row')).toHaveLength(1)
    expect(head.querySelector('button')).toBeNull()
  })

  it('gives a head two rows high a second row for its line of text', () => {
    render(<LaneHead name="Voice" brush={1} height={40} note="Take 1, Take 2" data-testid="head" />)
    const rows = screen.getByTestId('head').querySelectorAll('.lm-lane-head__row')
    expect(rows).toHaveLength(2)
    expect(rows[1]).toHaveTextContent('Take 1, Take 2')
    expect(screen.getByTestId('head')).toHaveStyle({ height: '40px' })
  })

  it('shows mute and solo when their state is given, and reports the new state', () => {
    const onMuteChange = vi.fn()
    const onSoloChange = vi.fn()
    render(
      <LaneHead
        name="Music"
        height={20}
        mute={false}
        solo
        onMuteChange={onMuteChange}
        onSoloChange={onSoloChange}
        muteData={{ 'data-action': 'mute_track' }}
        data-action="set_lane_height"
        data-testid="head"
      />,
    )
    const mute = screen.getByRole('button', { name: 'Mute Music' })
    const solo = screen.getByRole('button', { name: 'Solo Music' })
    expect(mute).toHaveAttribute('aria-pressed', 'false')
    expect(solo).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(mute)
    fireEvent.click(solo)
    expect(onMuteChange).toHaveBeenCalledWith(true)
    expect(onSoloChange).toHaveBeenCalledWith(false)
    // What a control does is marked on the control: the head's own on the head, the button's on the button.
    expect(mute).toHaveAttribute('data-action', 'mute_track')
    expect(screen.getByTestId('head')).toHaveAttribute('data-action', 'set_lane_height')
  })
})

describe('the timeline marks', () => {
  it('places each from the px it is given', () => {
    render(
      <>
        <LinkMark top={20} height={80} data-testid="link" />
        <RangeSelection x={100} width={60} data-testid="range" />
        <RangeSelection x={100} width={-5} strength="lane" data-testid="range-lane" />
        <CutSeam x={240} top={40} height={100} data-testid="seam" />
        <CutNotch x={240} label="2.4 s removed" data-testid="notch" />
      </>,
    )
    expect(screen.getByTestId('link')).toHaveStyle({ top: '20px', height: '80px' })
    expect(screen.getByTestId('range')).toHaveStyle({ left: '100px', width: '60px' })
    expect(screen.getByTestId('range-lane')).toHaveClass('lm-range--lane')
    expect(screen.getByTestId('range-lane')).toHaveStyle({ width: '0px' })
    expect(screen.getByTestId('seam')).toHaveStyle({ left: '240px', top: '40px', height: '100px' })
    expect(screen.getByRole('img', { name: '2.4 s removed' })).toBe(screen.getByTestId('notch'))
  })

  it('never draws a transition narrower than 12 px', () => {
    render(
      <>
        <TransitionMark width={4} height={20} data-testid="short" />
        <TransitionMark width={30} height={20} label="Cross dissolve, 1.5 s" data-testid="long" />
      </>,
    )
    expect(screen.getByTestId('short')).toHaveStyle({ width: '12px', height: '20px' })
    expect(screen.getByTestId('long')).toHaveStyle({ width: '30px' })
    expect(screen.getByRole('img', { name: 'Cross dissolve, 1.5 s' })).toBe(
      screen.getByTestId('long'),
    )
  })
})

describe('VideoStroke', () => {
  it('is a pill of the given size in its brush colour, with flat frames until it has thumbnails', () => {
    render(<VideoStroke width={300} height={40} brush={2} name="Display" data-testid="v" />)
    const stroke = screen.getByTestId('v')
    expect(stroke).toHaveClass('lm-vstroke', 'lm-vstroke--b2')
    expect(stroke).toHaveStyle({ width: '300px', height: '40px', borderRadius: '20px' })
    const frames = stroke.querySelector<HTMLElement>('.lm-vstroke__frames')
    expect(frames).toHaveClass('lm-vstroke__frames--flat')
    // One frame every 44 px, 6 px inside the ring, on a lane two rows high.
    expect(frames?.style.getPropertyValue('--lm-vstroke-frame')).toBe('44px')
    expect(frames).toHaveStyle({ top: '6px', bottom: '6px' })
    expect(stroke.querySelector('.lm-vstroke__tag')).toHaveTextContent('Display')
  })

  it('draws a frame per thumbnail, closer together on a lane one row high', () => {
    render(
      <VideoStroke
        width={300}
        height={20}
        brush={8}
        frames={['a.jpg', 'b.jpg', 'c.jpg']}
        data-testid="v"
      />,
    )
    const stroke = screen.getByTestId('v')
    expect(stroke).toHaveClass('lm-vstroke--b2', 'lm-vstroke--small')
    const frames = stroke.querySelectorAll<HTMLImageElement>('.lm-vstroke__frame')
    expect([...frames].map((frame) => frame.getAttribute('src'))).toEqual([
      'a.jpg',
      'b.jpg',
      'c.jpg',
    ])
    expect(frames[0]).toHaveStyle({ width: '13px' })
    expect(stroke.querySelector('.lm-vstroke__frames')).not.toHaveClass('lm-vstroke__frames--flat')
    expect(stroke.querySelector('.lm-vstroke__frames')).toHaveStyle({ top: '4px' })
  })

  it('draws a tick per recorded click, where along the clip it was', () => {
    render(<VideoStroke width={200} height={40} hits={[0.25, 0.5, 1.4]} data-testid="v" />)
    const hits = screen.getByTestId('v').querySelectorAll<HTMLElement>('.lm-vstroke__hit')
    expect([...hits].map((hit) => hit.style.left)).toEqual(['50px', '100px', '200px'])
  })

  it('tags a clip with its readouts, and says when its media is missing or it is muted', () => {
    render(
      <VideoStroke
        width={300}
        height={40}
        name="Webcam"
        tags={['1.5×', 'unlinked']}
        missing
        muted
        data-testid="v"
      />,
    )
    const stroke = screen.getByTestId('v')
    expect(stroke).toHaveClass('lm-vstroke--missing', 'lm-vstroke--muted')
    expect(stroke.querySelector('.lm-vstroke__tag')).toHaveTextContent(
      'Webcam1.5×unlinkedmissingmuted',
    )
  })

  it('draws a speed ramp as the automation line with its square nodes and its word', () => {
    const points = [
      [0, 0.2],
      [1, 0.8],
    ] as const
    render(
      <VideoStroke
        width={200}
        height={40}
        name="Display"
        automation={{ label: 'Speed', points }}
        data-testid="v"
      />,
    )
    const stroke = screen.getByTestId('v')
    expect(stroke.querySelectorAll('.lm-stroke__automation-node')).toHaveLength(2)
    expect(stroke.querySelector('.lm-vstroke__auto')).toHaveTextContent('Speed')
  })

  it('shows the selected clip with grips, and the others of its link group with a quiet outline', () => {
    const { rerender } = render(
      <VideoStroke width={200} height={40} selected linked data-testid="v" />,
    )
    const stroke = screen.getByTestId('v')
    expect(stroke).toHaveClass('lm-vstroke--selected')
    expect(stroke).not.toHaveClass('lm-vstroke--linked')
    expect(stroke.querySelector('.lm-stroke__grips')).not.toBeNull()
    rerender(<VideoStroke width={200} height={40} linked data-testid="v" />)
    expect(stroke).toHaveClass('lm-vstroke--linked')
    expect(stroke.querySelector('.lm-stroke__grips')).toBeNull()
  })

  it('hands pointer handlers and attributes to the root, and moves its tag in for a clip off screen', () => {
    const onPointerDown = vi.fn()
    render(
      <VideoStroke
        width={900}
        height={40}
        name="Display"
        tagInset={320}
        data-item="clip-1"
        onPointerDown={onPointerDown}
        data-testid="v"
      />,
    )
    const stroke = screen.getByTestId('v')
    fireEvent.pointerDown(stroke)
    expect(onPointerDown).toHaveBeenCalledOnce()
    expect(stroke).toHaveAttribute('data-item', 'clip-1')
    expect(stroke.querySelector('.lm-vstroke__tag')).toHaveStyle({ left: '320px' })
  })
})

describe('TimelineItem', () => {
  it('is a plate by default: a glyph, a name and readouts, its corners cut where it fades', () => {
    render(
      <TimelineItem
        width={160}
        glyph={<Glyph kind="title" />}
        name="Welcome"
        tags={['attached']}
        fadeIn={0.4}
        data-testid="item"
      />,
    )
    const item = screen.getByTestId('item')
    expect(item).toHaveClass('lm-item', 'lm-item--plate', 'lm-item--fade-in')
    expect(item).not.toHaveClass('lm-item--fade-out')
    expect(item).toHaveStyle({ width: '160px' })
    expect(item).toHaveTextContent('Welcomeattached')
    expect(item.querySelector('.lm-glyph--title')).not.toBeNull()
  })

  it('draws an envelope whose slopes are the eases, with the amount inside', () => {
    render(
      <TimelineItem
        width={120}
        shape="envelope"
        name="2.2×"
        rampIn={20}
        rampOut={30}
        selected
        data-testid="item"
      />,
    )
    const item = screen.getByTestId('item')
    expect(item).toHaveClass('lm-item--envelope', 'lm-item--selected')
    expect(item.querySelector('.lm-item__envelope path')).toHaveAttribute(
      'd',
      'M0 19.5L20 3.5H90L120 19.5Z',
    )
    expect(item.querySelector('.lm-item__tag')).toHaveTextContent('2.2×')
    expect(item.querySelectorAll('.lm-item__grip')).toHaveLength(2)
  })

  it('shares the length between two slopes that would cross', () => {
    expect(envelopePath(40, 30, 30)).toBe('M0 19.5L20 3.5H20L40 19.5Z')
    expect(envelopePath(100)).toBe('M0 19.5L0 3.5H100L100 19.5Z')
  })

  it('draws a span as a line at its start with a hatch as wide as its transition', () => {
    render(
      <TimelineItem
        width={200}
        shape="span"
        name="Side by side"
        rampIn={24}
        muted
        data-testid="item"
      />,
    )
    const item = screen.getByTestId('item')
    expect(item).toHaveClass('lm-item--span', 'lm-item--muted')
    expect(item.querySelector('.lm-item__ramp')).toHaveStyle({ width: '24px' })
    expect(item).toHaveTextContent('Side by side')
  })
})

describe('Overview', () => {
  const box = {
    left: 0,
    top: 0,
    width: 1000,
    height: 20,
    right: 1000,
    bottom: 20,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }

  it('places the window, the cuts, the notes and the playhead by their share of the whole', () => {
    render(
      <Overview
        duration={200}
        windowStart={50}
        windowEnd={100}
        playhead={150}
        cuts={[20, 180]}
        notes={[40]}
        data-testid="overview"
      />,
    )
    const overview = screen.getByTestId('overview')
    expect(overview.querySelector('.lm-overview__window')).toHaveStyle({
      left: '25%',
      width: '25%',
    })
    const cuts = overview.querySelectorAll<HTMLElement>('.lm-overview__cut')
    expect([...cuts].map((cut) => cut.style.left)).toEqual(['10%', '90%'])
    expect(overview.querySelector('.lm-overview__note')).toHaveStyle({ left: '20%' })
    expect(overview.querySelector('.lm-overview__playhead')).toHaveStyle({ left: '75%' })
  })

  it('a press on the box keeps hold of it there, and a drag reports where the lanes should start', () => {
    const onScroll = vi.fn()
    render(
      <Overview
        duration={200}
        windowStart={50}
        windowEnd={100}
        playhead={0}
        onScroll={onScroll}
        data-testid="overview"
      />,
    )
    const overview = screen.getByTestId('overview')
    vi.spyOn(overview, 'getBoundingClientRect').mockReturnValue(box)
    // Second 60 is 10 s into the box.
    fireEvent.pointerDown(overview, { clientX: 300 })
    expect(onScroll).toHaveBeenLastCalledWith(50)
    fireEvent.pointerMove(overview, { clientX: 500 })
    expect(onScroll).toHaveBeenLastCalledWith(90)
    fireEvent.pointerUp(overview)
    fireEvent.pointerMove(overview, { clientX: 700 })
    expect(onScroll).toHaveBeenCalledTimes(2)
  })

  it('a press beside the box centres it there, and the box never leaves the row', () => {
    const onScroll = vi.fn()
    render(
      <Overview
        duration={200}
        windowStart={50}
        windowEnd={100}
        playhead={0}
        onScroll={onScroll}
        data-testid="overview"
      />,
    )
    const overview = screen.getByTestId('overview')
    vi.spyOn(overview, 'getBoundingClientRect').mockReturnValue(box)
    fireEvent.pointerDown(overview, { clientX: 750 })
    expect(onScroll).toHaveBeenLastCalledWith(125)
    fireEvent.pointerMove(overview, { clientX: 1000 })
    expect(onScroll).toHaveBeenLastCalledWith(150)
    fireEvent.pointerMove(overview, { clientX: -200 })
    expect(onScroll).toHaveBeenLastCalledWith(0)
  })
})
