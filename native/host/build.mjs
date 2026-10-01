#!/usr/bin/env node
// Builds the plug-in host.
//
//   node native/host/build.mjs [--out DIR] [--debug] [--test-plugins] [--juce DIR]
//
// Prints the path of the binary on its last line. The default build directory
// is tmp/plugin-host under the current directory.

import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { buildPluginHost } from '../shell.mjs'

const { values } = parseArgs({
  options: {
    out: { type: 'string', default: 'tmp/plugin-host' },
    debug: { type: 'boolean', default: false },
    'test-plugins': { type: 'boolean', default: false },
    juce: { type: 'string' },
    jobs: { type: 'string' },
  },
})

try {
  const binary = buildPluginHost({
    buildDir: resolve(values.out),
    config: values.debug ? 'Debug' : 'Release',
    juceDir: values.juce ? resolve(values.juce) : undefined,
    testPlugins: values['test-plugins'],
    jobs: values.jobs ? Number(values.jobs) : undefined,
  })
  console.log(binary)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
