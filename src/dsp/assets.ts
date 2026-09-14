// Asset resolution for the dsp entry (KTD3). The worklet bundle and the .wasm
// artefacts ship inside the package under dist/worklets and dist/wasm; this
// module resolves them relative to the built dsp entry with
// `new URL(..., import.meta.url)` — lazily, inside the factories, never at
// import time — so Vite rewrites them to hashed asset URLs in production and
// serves them from node_modules in dev (with `optimizeDeps.exclude` set).
// Every factory also accepts explicit overrides for hosts that prefer their
// own `?url` imports or a pre-compiled `WebAssembly.Module`.

/** Anything a factory accepts as the compiled device module. */
export type WasmSource = URL | string | WebAssembly.Module | BufferSource | Response

export interface AssetOverrides {
  /** Where `addModule` loads the worklet processor from. */
  processorUrl?: URL | string
  /** The device module: a URL, raw bytes, a Response, or an already-compiled Module. */
  wasm?: WasmSource
}

/** Default location of the bundled worklet processor. Call lazily. */
export function defaultProcessorUrl(): string {
  return new URL('../worklets/wasm-device.js', import.meta.url).href
}

export function resolveProcessorUrl(override?: URL | string): string {
  if (override === undefined) return defaultProcessorUrl()
  return typeof override === 'string' ? override : override.href
}

const moduleCache = new Map<string, Promise<WebAssembly.Module>>()

/**
 * Compile a device module once per page. URL-shaped sources are cached by
 * href; bytes, Responses and Modules are compiled (or returned) per call.
 */
export function compileWasm(source: WasmSource): Promise<WebAssembly.Module> {
  if (source instanceof WebAssembly.Module) return Promise.resolve(source)
  if (typeof source === 'string' || source instanceof URL) {
    const href = typeof source === 'string' ? source : source.href
    let cached = moduleCache.get(href)
    if (!cached) {
      cached = compileFromUrl(href).catch((error: unknown) => {
        moduleCache.delete(href)
        throw error
      })
      moduleCache.set(href, cached)
    }
    return cached
  }
  if (source instanceof Response) {
    return compileFromResponse(source)
  }
  return WebAssembly.compile(source)
}

/** Drop cached modules (tests). */
export function clearWasmModuleCache(): void {
  moduleCache.clear()
}

async function compileFromUrl(href: string): Promise<WebAssembly.Module> {
  const response = await fetch(href)
  if (!response.ok) {
    throw new Error(`live-mix: failed to fetch device module ${href}: ${response.status}`)
  }
  return compileFromResponse(response)
}

async function compileFromResponse(response: Response): Promise<WebAssembly.Module> {
  // compileStreaming needs an `application/wasm` content type; fall back to
  // buffering when the server serves it as something else.
  if (typeof WebAssembly.compileStreaming === 'function') {
    const type = response.headers.get('content-type') ?? ''
    if (type.includes('application/wasm')) {
      return WebAssembly.compileStreaming(response)
    }
  }
  return WebAssembly.compile(await response.arrayBuffer())
}
