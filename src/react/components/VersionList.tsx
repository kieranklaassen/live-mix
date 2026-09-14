// Saved versions of the score over `useVersions` (U30): a save row and one
// line per version — label, milestone or author, time, size — with Restore
// and Remove. Newest first; the entry the document currently equals is not
// tracked (a restore is an operation like any other, undo brings it back).

import { useState, type CSSProperties, type FormEvent } from 'react'

import { type VersionHistory, type VersionSummary } from '../../score/versions'
import { useVersions } from '../hooks/useVersions'
import { cx } from './tokens'

export interface VersionListProps {
  /** Defaults to the provided history. */
  versions?: VersionHistory
  /** Show the label field and Save button (default true). */
  showSave?: boolean
  /** Allow removing versions (default true). */
  showRemove?: boolean
  /** Hide automatic checkpoints (default false). */
  manualOnly?: boolean
  /** Called after a restore lands or is deferred. */
  onRestore?: (version: VersionSummary) => void
  /** Format a version's time (default `HH:MM:SS` local). */
  formatTime?: (atMs: number) => string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

function defaultTime(atMs: number): string {
  const date = new Date(atMs)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function VersionList({
  versions,
  showSave = true,
  showRemove = true,
  manualOnly = false,
  onRestore,
  formatTime = defaultTime,
  className,
  style,
  'data-testid': testId,
}: VersionListProps) {
  const v = useVersions(versions)
  const [label, setLabel] = useState('')
  const shown = [...v.versions]
    .reverse()
    .filter((version) => !manualOnly || version.kind === 'manual')

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const text = label.trim()
    v.save(text || `Version ${v.versions.length + 1}`)
    setLabel('')
  }

  return (
    <div
      className={cx('lm-versions', className)}
      style={style}
      role="region"
      aria-label="Versions"
      data-testid={testId}
    >
      {showSave ? (
        <form className="lm-versions__save" onSubmit={submit}>
          <input
            type="text"
            className="lm-input lm-versions__label"
            placeholder="Version name"
            aria-label="Version name"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            data-testid={testId ? `${testId}-label` : undefined}
          />
          <button
            type="submit"
            className="lm-button lm-button--accent lm-versions__button"
            data-testid={testId ? `${testId}-save` : undefined}
          >
            Save
          </button>
        </form>
      ) : null}
      <ol className="lm-versions__list" aria-label="Saved versions">
        {shown.map((version) => (
          <li
            key={version.id}
            className={cx('lm-versions__item', `lm-versions__item--${version.kind}`)}
            data-testid={testId ? `${testId}-item-${version.id}` : undefined}
          >
            <span className="lm-versions__name" title={version.id}>
              {version.label}
            </span>
            <span className="lm-versions__meta">
              {version.milestone ?? version.author.id} · {formatTime(version.atMs)} ·{' '}
              {formatBytes(version.bytes)}
            </span>
            <button
              type="button"
              className="lm-button lm-button--neutral lm-versions__button"
              onClick={() => {
                v.restore(version.id)
                onRestore?.(version)
              }}
              data-testid={testId ? `${testId}-restore-${version.id}` : undefined}
            >
              Restore
            </button>
            {showRemove ? (
              <button
                type="button"
                className="lm-button lm-button--neutral lm-versions__button"
                aria-label={`Remove ${version.label}`}
                onClick={() => v.remove(version.id)}
                data-testid={testId ? `${testId}-remove-${version.id}` : undefined}
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ol>
      {shown.length === 0 ? <p className="lm-versions__empty">No versions yet.</p> : null}
    </div>
  )
}
