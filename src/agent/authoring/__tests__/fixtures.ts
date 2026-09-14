// Fixtures for the authoring tests: a canon-clean three-part script kept
// short (parts of 90 / 90 / 80 s) so the live-vs-offline simulation stays
// quick, and a library of short tracks across the ladder and the wheel.

import { type AgentTrack } from '../../types'
import { type SessionScript } from '../script'

/** Short tracks (18–40 s) so a compiled session is a few minutes at most. */
export function shortLibrary(): AgentTrack[] {
  return [
    {
      id: 'g1',
      title: 'Still Water',
      intensity: 1,
      camelot: '8A',
      durationSec: 30,
      url: '/g1.mp3',
    },
    { id: 'g2', title: 'Low Tide', intensity: 1, camelot: '9A', durationSec: 24, url: '/g2.mp3' },
    { id: 'g3', title: 'Far Shore', intensity: 1, camelot: '7B', durationSec: 36, url: '/g3.mp3' },
    { id: 'g4', title: 'Moss', intensity: 1, camelot: '3B', durationSec: 40, url: '/g4.mp3' },
    { id: 's1', title: 'Slow Pulse', intensity: 2, camelot: '8A', durationSec: 28, url: '/s1.mp3' },
    {
      id: 's2',
      title: 'Warm Current',
      intensity: 2,
      camelot: '8B',
      durationSec: 32,
      url: '/s2.mp3',
    },
    { id: 's3', title: 'Cedar', intensity: 2, camelot: '9B', durationSec: 22, url: '/s3.mp3' },
    {
      id: 'a1',
      title: 'Rising',
      intensity: 3,
      camelot: '9A',
      durationSec: 26,
      url: '/a1.mp3',
      gainDb: -1.5,
    },
    { id: 'a2', title: 'Open Sky', intensity: 3, camelot: '7B', durationSec: 34, url: '/a2.mp3' },
    { id: 'a3', title: 'Ember', intensity: 3, camelot: '8B', durationSec: 18, url: '/a3.mp3' },
    { id: 'a4', title: 'Signal', intensity: 3, camelot: '10A', durationSec: 30, url: '/a4.mp3' },
  ]
}

/** A short, canon-clean script: 90 + 90 + 80 s targets, cues 20–40 s apart. */
export function shortScript(): SessionScript {
  return {
    format: 1,
    id: 'evening-grounding',
    title: 'Evening grounding',
    theme: 'grounding',
    timeOfDay: 'evening',
    intention: 'Put the day down.',
    listener: 'Kieran',
    sections: [
      {
        role: 'grounding',
        name: 'Grounding',
        durationSec: 90,
        intensity: 1,
        breathing: { inhaleSec: 5, exhaleSec: 5, route: 'nose', style: 'belly' },
        cues: [
          {
            atSec: 0,
            text: 'Kieran. <2s> You have been carrying a lot this week. <1.5s> Right now, you come first.',
            phase: 'settle',
          },
          {
            atSec: 30,
            text: 'Breathe out softly. Gently. <1s> Letting your nervous system know you are safe.',
            phase: 'settle',
          },
          {
            atSec: 60,
            text: 'Now taking that breath into the belly. <1.5s> Inhale, inhale, exhale.',
            phase: 'rhythm',
            breathing: { inhaleSec: 3, exhaleSec: 3, route: 'mouth', style: 'three-part' },
          },
        ],
      },
      {
        role: 'active',
        name: 'Active Breath',
        durationSec: 90,
        intensity: 3,
        breathing: { inhaleSec: 2, exhaleSec: 2, route: 'mouth', style: 'connected' },
        cues: [
          {
            atSec: 5,
            text: 'Deep belly inhale, pulling up to the chest, letting it fall.',
            phase: 'rhythm',
            intensity: 3,
          },
          {
            atSec: 35,
            text: 'Breathing in grounding, exhaling anything that blocks it.',
            phase: 'theme',
            intensity: 3,
          },
          {
            atSec: 60,
            text: 'Make a sound. On three. <0.5s> One, two, three. <1s> Ahhh.',
            kind: 'sound-release',
            phase: 'peak',
            intensity: 3,
          },
          {
            atSec: 80,
            text: 'Put in the reps. Stay soft. Stay in the heart.',
            phase: 'build',
            intensity: 3,
          },
        ],
      },
      {
        role: 'integration',
        name: 'Integration',
        durationSec: 80,
        intensity: 1,
        breathing: { inhaleSec: 5, exhaleSec: 7, route: 'mouth', style: 'slow' },
        holds: [
          { atSec: 20, durationSec: 15, kind: 'inhale' },
          { atSec: 45, durationSec: 15, kind: 'exhale' },
        ],
        cues: [
          {
            atSec: 0,
            text: 'And there it is. The music has changed. <1s> Feel the difference?',
            kind: 'transition-ack',
            phase: 'acknowledge',
          },
          {
            atSec: 20,
            text: 'Fill up, sips of air, hold. <1s> Surrender to stillness.',
            kind: 'hold-entry',
            phase: 'hold',
          },
          {
            atSec: 45,
            text: 'Let it out, hold on empty with pride and strength.',
            kind: 'hold-entry',
            phase: 'hold',
          },
          {
            atSec: 70,
            text: 'Hands at heart. <1s> Three deep breaths together to close. <3s> Welcome back.',
            kind: 'closing',
            phase: 'close',
          },
        ],
      },
    ],
  }
}
