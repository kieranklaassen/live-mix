// `audioWorklet.addModule` once per context per processor URL, shared by every
// worklet host in the library (WASM devices, the worklet ducker, the LUFS
// meter). A failed load is forgotten so the next attempt retries.

const loadedProcessors = new WeakMap<BaseAudioContext, Map<string, Promise<void>>>()

export function ensureProcessor(context: BaseAudioContext, url: string): Promise<void> {
  let perContext = loadedProcessors.get(context)
  if (!perContext) {
    perContext = new Map()
    loadedProcessors.set(context, perContext)
  }
  let loading = perContext.get(url)
  if (!loading) {
    loading = context.audioWorklet.addModule(url).catch((error: unknown) => {
      perContext.delete(url)
      throw error
    })
    perContext.set(url, loading)
  }
  return loading
}
