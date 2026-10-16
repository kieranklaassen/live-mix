/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** What the lab of the lesson being built says of itself: read by the figures' wrappers. */
    lab?: import('./lab/describe.ts').LabDescription
    /** The lesson being built, for an error's first words. */
    lesson?: string
  }
}
