// Strips for every track, group and return plus the master, in sections. The
// lists default to the provided engine's `tracks` and `groups`; returns and
// other kinds are passed in (the engine keeps no public list of them yet).
// The engine announces no add/remove, so the host re-renders the mixer
// after changing the track list.

import { type CSSProperties, type ReactNode } from 'react'

import { type MasterBus } from '../../core/buses/MasterBus'
import { type StripHost } from '../../core/tracks/ChannelStrip'
import { type GroupTrack } from '../../core/tracks/GroupTrack'
import { useMaybeEngine } from '../hooks/useEngine'
import { ChannelStripView, type ChannelStripViewProps, type StripKind } from './ChannelStripView'
import { MasterStripView } from './MasterStripView'
import { cx } from './tokens'

export interface MixerViewProps {
  /** Defaults to the provided engine's audio and stretch tracks. */
  tracks?: readonly StripHost[]
  /** Defaults to the provided engine's groups. */
  groups?: readonly GroupTrack[]
  returns?: readonly StripHost[]
  /** Live inputs and instruments, shown among the tracks. */
  inputs?: readonly StripHost[]
  /** Defaults to the provided engine's master; `false` hides it. */
  master?: MasterBus | false
  /** Props forwarded to every strip (meter, sends, fader range, …). */
  stripProps?: Partial<Omit<ChannelStripViewProps, 'strip' | 'kind' | 'name'>>
  /** Which strip is selected, by name. */
  selectedName?: string
  onSelectStrip?: (host: StripHost, kind: StripKind) => void
  /** Rendered after the master section (a device chain, a browser). */
  children?: ReactNode
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

interface Section {
  kind: StripKind
  title: string
  hosts: readonly StripHost[]
}

export function MixerView({
  tracks,
  groups,
  returns = [],
  inputs = [],
  master,
  stripProps,
  selectedName,
  onSelectStrip,
  children,
  className,
  style,
  'data-testid': testId,
}: MixerViewProps) {
  const engine = useMaybeEngine()
  const trackHosts = tracks ?? [...(engine?.tracks ?? []), ...(engine?.stretchTracks ?? [])]
  const groupHosts = groups ?? engine?.groups ?? []
  const masterBus = master === undefined ? (engine?.master ?? null) : master || null

  const sections: Section[] = [
    { kind: 'track', title: 'Tracks', hosts: [...trackHosts, ...inputs] },
    { kind: 'group', title: 'Groups', hosts: groupHosts },
    { kind: 'return', title: 'Returns', hosts: returns },
  ]

  return (
    <div className={cx('lm-mixer', className)} style={style} data-testid={testId}>
      {sections.map((section) =>
        section.hosts.length === 0 ? null : (
          <div
            key={section.kind}
            className={cx('lm-mixer__section', `lm-mixer__section--${section.kind}`)}
            role="group"
            aria-label={section.title}
          >
            {section.hosts.map((host) => (
              <ChannelStripView
                key={host.name}
                {...stripProps}
                strip={host}
                kind={section.kind}
                selected={selectedName === host.name}
                onSelect={onSelectStrip ? () => onSelectStrip(host, section.kind) : undefined}
                data-testid={testId ? `${testId}-${host.name}` : undefined}
              />
            ))}
          </div>
        ),
      )}
      {masterBus ? (
        <div
          className="lm-mixer__section lm-mixer__section--master"
          role="group"
          aria-label="Master"
        >
          <MasterStripView
            master={masterBus}
            fps={stripProps?.fps}
            faderMinDb={stripProps?.faderMinDb}
            faderMaxDb={stripProps?.faderMaxDb}
            data-testid={testId ? `${testId}-master` : undefined}
          />
        </div>
      ) : null}
      {children}
    </div>
  )
}
