// What more than one of the site's scripts does the same way.
import fs from 'node:fs'
import path from 'node:path'

/** Every .html file under `folder`, however deep, in the order the folders are read. */
export function htmlFiles(folder) {
  return fs
    .readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => path.join(entry.parentPath, entry.name))
}

/** `text` as a pattern that finds exactly it: every sign a pattern reads is made a plain one. */
export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
