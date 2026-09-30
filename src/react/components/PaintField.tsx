// The surface strokes are painted on: a grid of `columnPx` × `rowPx` cells
// drawn as hairlines, with a stronger line every `majorColumns` columns and
// `majorRows` rows. Children position themselves absolutely (a `Stroke` at
// `left`/`top` in px); the field only draws the grid and clips to it. The ref
// is the field element, for hosts that measure it or capture the pointer.

import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'

import { cx } from './tokens'

export interface PaintFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Cell size in px; defaults to the theme's `--lm-col` × `--lm-row`. */
  columnPx?: number
  rowPx?: number
  /** A stronger line every this many columns / rows (default 4 / 2; 0 for none). */
  majorColumns?: number
  majorRows?: number
  'data-testid'?: string
}

export const PaintField = forwardRef<HTMLDivElement, PaintFieldProps>(function PaintField(
  { columnPx, rowPx, majorColumns = 4, majorRows = 2, className, style, children, ...rest },
  ref,
) {
  const vars: Record<string, string | number> = {
    '--lm-field-major-cols': Math.max(0, majorColumns),
    '--lm-field-major-rows': Math.max(0, majorRows),
  }
  if (columnPx !== undefined) vars['--lm-field-col'] = `${columnPx}px`
  if (rowPx !== undefined) vars['--lm-field-row'] = `${rowPx}px`
  return (
    <div
      ref={ref}
      className={cx(
        'lm-field',
        majorColumns > 0 && 'lm-field--major-cols',
        majorRows > 0 && 'lm-field--major-rows',
        className,
      )}
      style={{ ...(vars as CSSProperties), ...style }}
      {...rest}
    >
      {children}
    </div>
  )
})
