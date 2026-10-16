import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { docId, EXCLUDED_DIRS } from './lib/doc-routes.ts'

// The docs are rendered where they are: ../docs, read on GitHub and here alike.
const docs = defineCollection({
  loader: glob({
    base: '../docs',
    pattern: ['**/*.md', ...EXCLUDED_DIRS.map((dir) => `!${dir}/**`)],
    generateId: ({ entry }) => docId(entry),
  }),
  schema: z.object({ title: z.string().optional() }),
})

const lessons = defineCollection({
  loader: glob({ base: './src/content/lessons', pattern: '*.mdx' }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().positive(),
    /** One or two sentences for the index and the page's description. */
    summary: z.string(),
    /** The lab module's name: site/labs/<lab>.cpp. */
    lab: z.string(),
    /** Ids of the devices the lesson is about, for the device pages' "Lessons" block. */
    devices: z.array(z.string()).default([]),
    /** The device on the bench at the lesson's end, with the controls it starts at. */
    bench: z
      .object({
        device: z.string(),
        params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).default({}),
        /** 'insert' for an effect on the loop, 'send' for a wet-only device, 'instrument' for one that plays. */
        as: z.enum(['insert', 'send', 'instrument']).default('insert'),
        note: z.string().optional(),
        /** For a device that takes an impulse: the engine's room, by its decay and its seed. */
        impulse: z.object({ seconds: z.number().positive(), seed: z.number().int() }).optional(),
      })
      .optional(),
    /** Sources the reader may pick, by id (site/src/lab/sources.ts); the first is the default. */
    sources: z.array(z.string()).min(1),
    seconds: z.number().positive().max(8).default(4),
    /** The engine's files the lesson talks about, as paths from the repository's root. */
    files: z.array(z.string()).default([]),
  }),
})

export const collections = { docs, lessons }
