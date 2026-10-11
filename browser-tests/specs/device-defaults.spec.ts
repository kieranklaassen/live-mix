// Devices held to what their settings say, on the browser's own nodes: a cut
// with no bump over its corner, a compressor that adds no gain of its own, and
// a bypass that takes the time the device reports. Measured on a real
// OfflineAudioContext (`harness/device-defaults.ts`), because the mock context
// answers none of the three: it does not filter, compress or delay.

import { expect, test } from '@playwright/test'

import type { DeviceDefaultsMeasure } from '../harness/device-defaults'
import { collectPageErrors } from './page-errors'

test.describe('a device does what its settings say, in real audio', () => {
  let measured: DeviceDefaultsMeasure

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate(() => window.liveMixHarness.measureDeviceDefaults())
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test.describe('a cut', () => {
    // A second-order Butterworth cut at 80 Hz: 3.01 dB down at the corner,
    // 1.07 dB down at 110 Hz, within 0.3 dB of flat from 160 Hz up, and never
    // over flat. With the Q written as a number (0.707, read as dB) it stood
    // 1.73 dB proud at 110 Hz.
    for (const name of ['lowCut', 'rumble'] as const) {
      test(`at 80 Hz has no bump over its corner (${name})`, () => {
        const { at, highestDb } = measured.cuts[name]
        expect(highestDb).toBeLessThan(0.05)
        expect(at[80]).toBeGreaterThan(-3.2)
        expect(at[80]).toBeLessThan(-2.8)
        expect(at[110]).toBeGreaterThan(-1.3)
        expect(at[110]).toBeLessThan(-0.8)
        for (const hz of [160, 440, 1000]) {
          expect(at[hz], `${hz} Hz`).toBeGreaterThan(-0.3)
          expect(at[hz], `${hz} Hz`).toBeLessThanOrEqual(0.05)
        }
      })

      test(`at 80 Hz takes 50 Hz down by 6 dB or more (${name})`, () => {
        expect(measured.cuts[name].at[50]).toBeLessThan(-6)
      })
    }

    test('at the top is flat under its corner too', () => {
      const { at, highestDb } = measured.cuts.highCut
      expect(highestDb).toBeLessThan(0.05)
      expect(at[8000]).toBeGreaterThan(-3.2)
      expect(at[8000]).toBeLessThan(-2.8)
      expect(Math.abs(at[1000])).toBeLessThan(0.05)
      expect(at[4000]).toBeGreaterThan(-0.4)
      expect(at[4000]).toBeLessThanOrEqual(0.05)
      expect(at[12000]).toBeLessThan(-6)
    })

    test('of the filter device stands as high at its corner as its Q says', () => {
      // A Q of 2 is a peak of 20·log10(2): 6.02 dB. Read as decibels it was 2.
      const { at } = measured.cuts.resonant
      expect(at[1000]).toBeGreaterThan(5.8)
      expect(at[1000]).toBeLessThan(6.2)
      expect(Math.abs(at[100])).toBeLessThan(0.2)
    })

    test('in the delay’s feedback loop gives nothing back louder than it took', () => {
      const { at, highestDb } = measured.cuts.damping
      expect(highestDb).toBeLessThan(0.05)
      expect(at[2000]).toBeGreaterThan(-3.2)
      expect(at[2000]).toBeLessThan(-2.8)
    })
  })

  test.describe('a compressor with no make-up', () => {
    test('plays a sound under its threshold as loud as it came in', () => {
      const { mono, stereo, hard, untouched } = measured.compressor
      for (const inDb of [-40, -27, -20]) {
        expect(Math.abs(mono[inDb]), `mono at ${inDb} dB`).toBeLessThan(0.2)
        expect(Math.abs(stereo[inDb]), `stereo at ${inDb} dB`).toBeLessThan(0.2)
      }
      for (const inDb of [-40, -26]) {
        expect(Math.abs(hard[inDb]), `no knee, at ${inDb} dB`).toBeLessThan(0.2)
      }
      // The default device (threshold −24 dB, knee 30, ratio 12) added 3.66 dB.
      expect(Math.abs(untouched)).toBeLessThan(0.2)
    })

    test('brings what is over the threshold down by the ratio', () => {
      const { mono, hard } = measured.compressor
      // Threshold −18 dB, knee 12: from −6 dB up a 2:1 line. 4 dB more in is 2 dB more out.
      expect(4 + mono[0] - mono[-4]).toBeGreaterThan(1.8)
      expect(4 + mono[0] - mono[-4]).toBeLessThan(2.2)
      expect(mono[0]).toBeLessThan(-4)
      // Threshold −24 dB, no knee, 4:1: 12 dB over comes out 3 dB over, and 24 dB over, 6 dB over.
      // A tone reads a little under its peak to the node, so the gain stands a little over the line.
      expect(hard[-12]).toBeGreaterThan(-9.2)
      expect(hard[-12]).toBeLessThan(-8.2)
      expect(hard[0]).toBeGreaterThan(-18.2)
      expect(hard[0]).toBeLessThan(-17)
    })

    test('keeps every factory preset as loud as it was', () => {
      for (const [name, drift] of Object.entries(measured.compressor.presetDrift)) {
        expect(drift, name).toBeLessThan(0.05)
      }
    })

    test('leaves a quiet stereo voice on a track as loud as the track played it', () => {
      // A low cut at 80 Hz and a 2:1 compressor at −18 dB on a −27 dBFS voice: 3.67 dB louder before.
      expect(Math.abs(measured.voice.stereo)).toBeLessThan(0.2)
    })

    test('leaves a mono voice on a track louder by the strip’s pan law and no more', () => {
      // Not the device's gain: the browser's compressor gives two channels for
      // one, and the strip's panner plays one channel 3.01 dB under two at
      // centre. The same holds for any insert that makes a mono sound stereo.
      // Before, the node's own make-up stood on top of it: 6.68 dB.
      expect(measured.voice.mono).toBeGreaterThan(2.8)
      expect(measured.voice.mono).toBeLessThan(3.2)
    })
  })

  test.describe('a bypassed device', () => {
    test('takes the time it reports: a compressor', () => {
      expect(measured.bypass.compressor).toEqual({
        latencySamples: 288,
        activeDelay: 288,
        bypassedDelay: 288,
      })
    })

    test('reports the samples the browser’s compressor takes at 44.1 kHz', () => {
      // 6 ms is 264.6 samples, and the node looks 264 ahead.
      expect(measured.bypass.compressorAt44100).toEqual({
        latencySamples: 264,
        activeDelay: 264,
        bypassedDelay: 264,
      })
    })

    test('takes the time it reports: a limiter that runs in a worklet', () => {
      expect(measured.bypass.limiter).toEqual({
        latencySamples: 77,
        activeDelay: 77,
        bypassedDelay: 77,
      })
    })

    test('takes the time it reports: a rack', () => {
      expect(measured.bypass.rack).toEqual({
        latencySamples: 288,
        activeDelay: 288,
        bypassedDelay: 288,
      })
    })

    test('turned off and on again under a tone moves nothing in time', () => {
      // Undelayed, the dry tone is 288 samples early: 5 dB over the tone itself.
      expect(measured.bypass.toggleDb).toBeLessThan(-40)
    })
  })
})
