// The crowd of Walking Voices as its display walks it: the device's own
// arithmetic (`cpp/devices/walking-voices`: `crowd.h`, `singer.h` and the tick
// of `walking_voices.h`, whose names the functions carry), without the sound.
// Who wanders and when somebody breathes is chance in the device; here it is
// the same chance by the same rules, on the display's clock.

import { clamp, lerp } from '../display-kit'
import {
  BODY_MANNERS,
  COVER,
  CROWD_SINGERS,
  LATE,
  LEAP,
  MANNERS,
  PURE,
  STEPS,
  TURN,
  crowdDeal,
  crowdSeats,
  crowdStand,
  eased,
  makeWalker,
  random,
  smooth,
  turnWave,
  type CrowdSeat,
  type CrowdSettings,
  type Note,
  type Walker,
} from './walking-voices-people'

const NOTES = 12
const NEVER = 1e6

export class Crowd {
  readonly walkers: readonly Walker[] = Array.from({ length: CROWD_SINGERS }, (_, i) =>
    makeWalker(i),
  )
  notes: Note[] = []
  private serial = 0
  private stroll = 0.5
  private chance = random(99)
  private beats = 0

  constructor(public set: CrowdSettings) {}

  /** What is held from now on: a note under an id that is held already is struck again. */
  play(on: readonly { id: number; pitch: number }[], off: readonly number[] = []): void {
    const gone = new Set([...off, ...on.map((note) => note.id)])
    this.notes = this.notes.filter((note) => !gone.has(note.id))
    for (const note of on) this.notes.push({ ...note, serial: ++this.serial, fresh: true })
    this.notes = this.notes.slice(-NOTES).sort((a, b) => a.pitch - b.pitch)
    this.gather()
  }

  /** Anybody who can be heard. */
  get sounding(): boolean {
    return this.walkers.some((each) => each.gate || each.level > 0)
  }

  /** `gather`, `assign`: deals the held notes out again, with the least steps there can be. */
  gather(): void {
    const { notes, set } = this
    if (notes.length === 0) for (const each of this.walkers) each.gate = false
    if (notes.length === 0) return
    const pitches = notes.map((note) => note.pitch)
    const middle = pitches.reduce((sum, pitch) => sum + pitch, 0) / pitches.length
    const seats = crowdSeats(pitches, set.lowShare)
    const crowd = Math.max(COVER * notes.length, Math.round(set.people))
    crowdDeal(seats, crowd)
    const room = seats.map((seat) => seat.quota)
    const kept = seats.map(() => 0)
    const seated = new Map<Walker, number>()
    const loose: Walker[] = []
    for (const each of this.walkers) {
      if (each.priority >= crowd) {
        each.gate = false
        continue
      }
      if (!each.born) each.place = each.goal = middle
      each.born = true
      // Two who are already on a note that stays are left there.
      const free = each.gate && each.own && !each.away && each.gap <= 0 && each.hush <= 0
      const stays = seats.findIndex((seat, t) => {
        const note = notes[seat.note]
        const here = seat.own && !note.fresh && each.serial === note.serial
        return here && free && each.state === 'home' && kept[t] < COVER
      })
      if (stays < 0) {
        loose.push(each)
        continue
      }
      kept[stays]++
      room[stays]--
      seated.set(each, stays)
    }
    // Everybody in order of where they are, the seats from the bottom: no other dealing walks less.
    const pinned = new Set(seated.keys())
    loose.sort((a, b) => a.place - b.place)
    let at = 0
    for (const each of loose) {
      while (at < seats.length - 1 && room[at] <= 0) at++
      seated.set(each, at)
      room[at]--
    }
    seats.forEach((seat, t) => {
      const here = this.walkers.filter((each) => seated.get(each) === t)
      // The two quickest on a note go first, and one of them leads.
      const rank = (each: Walker): number => each.pace - (pinned.has(each) ? 100 : 0)
      const quick = [...here].sort((a, b) => rank(a) - rank(b))
      for (const each of here)
        this.send(each, seat, pitches[0], quick.indexOf(each) < 2, each === quick[0])
    })
    for (const note of notes) note.fresh = false
  }

  /** `send`: they stay, walk over or come in. */
  private send(s: Walker, seat: CrowdSeat, bottom: number, prompt: boolean, lead: boolean): void {
    const note = this.notes[seat.note]
    const { set } = this
    const stays = s.gate && s.serial === note.serial && s.own === seat.own && !s.away
    const same = stays && Math.abs(s.home - seat.pitch) < 0.01 && !note.fresh
    const singing = s.level > 0.03 && s.gap <= 0
    Object.assign(s, { gate: true, serial: note.serial, own: seat.own, prompt })
    s.lead = lead && seat.own
    if (prompt) s.hush = 0
    s.home = seat.pitch
    const interval = seat.pitch - bottom
    const nearest = Math.floor(interval + 0.5)
    const off = interval - nearest
    s.pure = Math.abs(off) > 0.35 ? 0 : PURE[((nearest % 12) + 12) % 12] - off
    if (same) return
    s.away = false
    let wait = set.lag * (s.lead ? 0.1 : prompt ? 0.3 : 1) * s.pace
    if (!prompt) wait += this.stubborn(s)
    else if (set.path !== LEAP) wait += 0.3 * Math.min(this.stubborn(s), 4)
    if (prompt) wait = Math.min(wait, s.lead ? 0.15 : 0.5)
    const share = prompt ? 0.3 : 1
    if (!singing || (note.fresh && Math.abs(s.place - seat.pitch) < 0.05)) {
      if (singing) s.level = 0
      this.comeIn(s, seat.pitch, (prompt || singing) && set.path === LEAP, wait, share)
      const leap = set.path === LEAP ? 0.6 : 1
      const slow = set.lag * s.pace * (0.04 + 0.76 * s.will * s.will)
      s.hush = prompt ? 0 : leap * (slow + 0.5 * Math.min(this.stubborn(s), 2.4))
      return
    }
    if (note.fresh && set.fade > 0) renew(s)
    this.walk(s, seat.pitch, wait)
  }

  /** `stubborn_wait`: some give in late. At the top of the knob the most wilful never do. */
  stubborn(s: Pick<Walker, 'will'>): number {
    const held = this.set.stubborn * s.will
    return held > 0.72 ? NEVER : 9 * held * held * this.set.stubborn
  }

  /** `come_in`: begins as far off as Reach allows, on the side they were last heard on. */
  private comeIn(s: Walker, goal: number, straight: boolean, wait: number, share: number): void {
    const { set } = this
    const reach = set.reach * share
    let from = clamp(s.place, goal - reach, goal + reach)
    if (Math.abs(from - goal) < 0.3 * reach) from = goal + s.side * reach * (0.45 + 0.4 * s.mouth)
    if (straight) from = goal
    Object.assign(s, { goal, from, place: from, cut: true, gap: 0, hush: 0, turning: 0 })
    s.level = Math.min(s.level, 0.03)
    renew(s)
    s.phrase = set.breath * (0.65 + 0.7 * s.chance())
    if (straight || Math.abs(from - goal) < 0.01) {
      Object.assign(s, { state: 'home', place: goal })
      if (set.path === TURN) this.turn(s)
    } else Object.assign(s, { state: 'wait', wait: wait * (set.path === LATE ? 2.2 : 1) })
  }

  private walk(s: Walker, goal: number, wait: number): void {
    const late = this.set.path === LATE
    Object.assign(s, { goal, from: s.place, state: 'wait', turning: 0 })
    s.wait = late ? wait * 2.2 + 0.25 : wait
  }

  private turn(s: Walker): void {
    s.turning = 1e-4
    s.turnSeconds = clamp(this.set.lag * 1.4 * s.pace, 0.22, 3)
  }

  /** `set_out`: the wait is over, and how the walk goes is Path's. */
  private setOut(s: Walker): void {
    const { lag, path } = this.set
    const far = Math.abs(s.goal - s.from)
    let seconds = 0.12 + lag * s.pace * Math.min(1.6, 0.45 + 0.09 * far)
    Object.assign(s, { state: 'move', manner: path, u: 0, steps: 1 })
    if (path === LEAP) {
      s.cut = true
      s.level = 0
      this.arrive(s)
      return
    }
    if (path === STEPS) {
      s.steps = clamp(Math.ceil(far * 0.5 - 0.01), 1, 7)
      seconds = s.steps * clamp(lag * 0.5 * s.pace, 0.09, 1.4)
    } else if (path === TURN) seconds = 0.2 + seconds * 1.5
    else if (path === LATE) seconds = 0.12 + 0.35 * lag * s.pace
    // The first two on a note show the others where it is.
    if (s.prompt && !s.away && path !== LATE)
      seconds = path === 0 ? Math.min(0.05 + 0.2 * (seconds - 0.12), 0.6) : 0.5 * seconds
    s.seconds = Math.max(seconds, 0.02)
  }

  private arrive(s: Walker): void {
    Object.assign(s, { state: 'home', place: s.goal, from: s.goal, u: 1 })
  }

  /** `pitch_now`. */
  private pitch(s: Walker): number {
    if (s.state === 'wait') return s.from
    const width = Math.min(0.6 + 0.35 * this.set.reach, 3.2)
    if (s.state === 'home') return s.goal + (s.turning > 0 ? width * turnWave(s.turning) : 0)
    const gap = s.goal - s.from
    if (s.manner === STEPS) {
      const at = s.u * s.steps
      const step = clamp(Math.floor(at), 0, s.steps - 1)
      const stair = (n: number): number => s.goal - Math.floor(gap * (1 - n / s.steps) + 0.5)
      const below = step === 0 ? s.from : stair(step)
      return below + (stair(step + 1) - below) * smooth((at - step) * 2.6)
    }
    if (s.manner !== TURN) return s.from + gap * smooth(s.u)
    return s.from + gap * smooth(s.u * 2.2) + width * turnWave(clamp((s.u - 0.3) / 0.7, 0, 1))
  }

  /** Everybody, `dt` seconds on (`tick`, `live`). */
  step(dt: number): void {
    const { set } = this
    if (this.notes.length > 0) this.wanderOff(dt)
    const pulse = 4 * clamp(set.lag, 0.14, 2.5)
    const beat = Math.floor((this.beats + dt / pulse) % 1e6)
    const struck = beat !== Math.floor(this.beats)
    this.beats = (this.beats + dt / pulse) % 1e6
    const [attack, release] = MANNERS[set.path].map((of, k) => of * BODY_MANNERS[set.body][k])
    const rise = clamp(set.attack * eased(attack, set.attack * 0.9), 0.0015, 8)
    const fall = clamp(set.release * eased(release, set.release * 0.1), 0.03, 24)
    for (const s of this.walkers) {
      if (!s.gate && s.level <= 0) continue
      if (s.hush > 0) s.hush -= dt
      else if (s.state === 'wait') {
        s.wait -= dt
        if (s.wait <= 0) this.setOut(s)
      } else if (s.state === 'move') {
        s.u += dt / s.seconds
        if (s.u >= 1) this.arrive(s)
      }
      if (s.state === 'home' && s.turning > 0) {
        s.turning += dt / s.turnSeconds
        if (s.turning >= 1) s.turning = 0
      }
      s.place = this.pitch(s)
      if (!s.gate) {
        s.level *= Math.exp((-3.454 * dt * (s.away ? 2 : 1)) / fall)
        if (s.level < 0.001) s.level = 0
        continue
      }
      if (s.hush > 0) continue
      if (s.away && s.state === 'home' && (s.stay -= dt) <= 0) {
        s.away = false
        this.walk(s, s.home, 0.02)
      }
      this.phrase(s, dt, struck)
      const target = s.gap > 0 ? 0 : Math.sqrt(this.sunk(s, dt))
      const up = dt / rise
      if (s.level < target)
        s.level = Math.min(target, s.level + Math.max(up, (set.fade * dt) / (0.35 * s.phrase)))
      else s.level += (target - s.level) * Math.min(1, dt / (s.gap > 0 ? 0.05 : 0.02))
    }
  }

  private sunk(s: Walker, dt: number): number {
    const { fade, path } = this.set
    const now = (): number => lerp(Math.exp((-3.6 * s.sinking) / s.phrase), 1, (1 - fade) ** 2)
    if (s.level > 0.9 * Math.sqrt(now())) s.risen = true
    const there = path !== LATE || s.state === 'home' || s.sung > 2 * s.phrase
    if (s.risen && there) s.sinking += dt
    return now() < 4e-6 ? 0 : now()
  }

  /** Those who hold the note somebody is on, and are there. */
  private present(s: Walker): number {
    const here = (each: Walker): boolean =>
      each.gate && each.own && !each.away && each.serial === s.serial && each.state === 'home'
    return this.walkers.filter((each) => here(each) && each.gap <= 0 && each.hush <= 0).length
  }

  /** `phrase`: from breath to breath, and what people do meanwhile. */
  private phrase(s: Walker, dt: number, struck: boolean): void {
    const { breath, fade, lag, path } = this.set
    if (s.gap > 0) {
      s.gap -= dt
      if (s.gap <= 0) this.comeIn(s, s.away ? s.goal : s.home, false, 0.3 * lag * s.pace, 0.55)
      return
    }
    s.sung += dt
    s.phrase = Math.min(s.phrase, breath * 1.4)
    const dying = clamp((fade - 0.5) * 2, 0, 1)
    if (s.sung > s.phrase * (1 + 4 * dying * dying) && fade < 0.97) {
      // Needed here: they catch a breath while singing on.
      if (!s.away && s.own && (s.state !== 'home' || this.present(s) <= COVER)) {
        renew(s)
        s.phrase = breath * (0.65 + 0.7 * s.chance())
      } else s.gap = Math.min(0.14 + 0.07 * breath, 0.55) * (0.8 + 0.4 * s.chance())
      return
    }
    if (path !== TURN || s.state !== 'home' || s.away) return
    // A turn goes through the people of a note like a wave, and two hold the note meanwhile.
    if (struck) s.beat = 0.35 * Math.min(lag, 2.5) * s.pace + 0.002
    if (s.beat > 0) {
      s.beat -= dt
      if (s.beat <= 0 && s.turning <= 0 && !s.prompt) this.turn(s)
    }
  }

  /** `stroll`: now and then someone goes to another note, if two others stay behind. */
  private wanderOff(dt: number): void {
    const { wander, people, lag } = this.set
    if (wander <= 0) return
    const crowd = Math.max(COVER * this.notes.length, people)
    this.stroll -= dt * Math.pow(wander, 1.5) * crowd * 0.22
    if (this.stroll > 0) return
    this.stroll = 0.4 + 1.2 * this.chance()
    const who = Array.from({ length: 6 }, () => Math.floor(this.chance() * CROWD_SINGERS))
      .map((i) => this.walkers[i])
      .find((s) => {
        const free = s.gate && !s.away && s.state === 'home' && s.gap <= 0 && !s.lead
        return free && (!s.own || this.present(s) > COVER)
      })
    if (!who) return
    const others = this.notes.filter((note) => Math.abs(note.pitch - who.home) > 0.5)
    let goal = who.home + (this.chance() < 0.5 ? -12 : 12)
    if (others.length > 0 && this.chance() < 0.6)
      goal = others[Math.floor(this.chance() * others.length)].pitch
    while (goal - who.home > 12.5) goal -= 12
    while (goal - who.home < -12.5) goal += 12
    if (goal < 31 || goal > 100) return
    who.away = true
    who.stay = 1.5 + 3.5 * this.chance() + 3 * wander + lag
    this.walk(who, goal, 0.05)
  }

  /** Where they are heard: Agreement puts the crowd's ears apart, and at its top onto pure intervals. */
  heard(s: Walker): number {
    const loose = 1 - this.set.agreement
    const cents = 0.5 + 75 * loose * loose * Math.sqrt(loose + 0.0001)
    const low = 1 + 0.8 * smooth((66 - s.place) / 36)
    const pull = smooth((this.set.agreement - 0.6) * 2.5)
    return s.place + 0.0075 * cents * low * (s.lead ? 0.4 : 1) * s.ear + s.pure * pull
  }

  /** How loud a leader and how loud the rest are for Leader, each against an even crowd. */
  weights(): { lead: number; rest: number } {
    const notes = Math.max(1, this.notes.length)
    const fair = Math.min(notes / Math.max(COVER * notes, this.set.people), 0.5)
    const share = fair + (0.985 - fair) * this.set.leader
    const near = 1 - 0.2 * this.set.leader
    return {
      lead: near * Math.sqrt(share / fair),
      rest: near * Math.sqrt((1 - share) / (1 - fair)),
    }
  }

  /** Where somebody stands, -1 left .. 1 right, and how far back, 0..1 (`voice`). */
  spot(s: Walker): { x: number; back: number } {
    const stand = crowdStand(this.set)
    const forward = 1 - 0.85 * (s.lead ? this.set.leader : 0)
    const round = s.turning > 0 ? 0.6 * turnWave(s.turning) * s.side : 0
    return { x: clamp(stand * (s.spot * forward + round), -1, 1), back: s.depth * stand * forward }
  }
}

/** A phrase begins. */
function renew(s: Walker): void {
  Object.assign(s, { sung: 0, sinking: 0, risen: false })
}
