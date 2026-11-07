import type { CompressSettings, OutputFormat, WorkerRequest, WorkerResponse } from '~/utils/compress-types'

export const LARGE_FILE_BYTES = 50 * 1024 * 1024

export interface Variant {
  key: string
  format: OutputFormat
  size: number
  fileName: string
  status: 'pending' | 'done' | 'skipped'
  width?: number
  height?: number
  bytes?: number
  blob?: Blob
  url?: string
}

export interface ImageItem {
  id: number
  file: File
  name: string
  bytes: number
  previewUrl: string
  width?: number
  height?: number
  /** 'ready' = added but not compressed yet; compression only starts when the user clicks Compress. */
  status: 'ready' | 'queued' | 'processing' | 'done' | 'error'
  error?: string
  /** Rejected before processing (e.g. HEIC); never queued. */
  unsupported?: boolean
  /** Settings this item was last queued with, to detect results that no longer match the current settings. */
  settingsKey?: string
  variants: Variant[]
}

// Shared state for the page. One worker processes one image at a time (a worker pool comes in milestone 2).
const items = ref<ImageItem[]>([])
let nextId = 1
let nextJobId = 1
let worker: Worker | null = null
let queue: number[] = []
let current: { jobId: number, itemId: number } | null = null
/** Settings captured when Compress was clicked, so edits made while running don't affect that run. */
let runSettings: CompressSettings | null = null

function settingsKeyOf(settings: CompressSettings) {
  return JSON.stringify(settings)
}

function findItem(id: number) {
  return items.value.find(item => item.id === id)
}

function releaseVariants(item: ImageItem) {
  for (const variant of item.variants) {
    if (variant.url) URL.revokeObjectURL(variant.url)
  }
  item.variants = []
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/compress.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => handleMessage(event.data)
    worker.onerror = (event) => {
      event.preventDefault()
      failCurrent('The compressor crashed on this image. It may be too large for your device.')
    }
  }
  return worker
}

/** Stop whatever the worker is doing right now. Terminating is the only reliable way to cancel WASM work. */
function stopWorker() {
  worker?.terminate()
  worker = null
  current = null
}

function failCurrent(message: string) {
  const item = current && findItem(current.itemId)
  if (item) {
    item.status = 'error'
    item.error = message
    releaseVariants(item)
  }
  stopWorker()
  pump()
}

function pump() {
  if (current || !runSettings) return
  const itemId = queue.shift()
  if (itemId === undefined) return
  const item = findItem(itemId)
  if (!item) return pump()

  const settings = runSettings
  releaseVariants(item)
  item.status = 'processing'
  item.error = undefined
  item.variants = settings.sizes.flatMap(size => settings.formats.map(format => ({
    key: variantKey(format, size),
    format,
    size,
    fileName: outputFileName(item.name, format, size),
    status: 'pending' as const,
  })))

  const jobId = nextJobId++
  current = { jobId, itemId }
  const request: WorkerRequest = { jobId, file: item.file, settings }
  getWorker().postMessage(request)
}

function handleMessage(message: WorkerResponse) {
  // Ignore late messages from a job that was cancelled.
  if (!current || message.jobId !== current.jobId) return
  const item = findItem(current.itemId)
  if (!item) return

  switch (message.type) {
    case 'decoded':
      item.width = message.width
      item.height = message.height
      break
    case 'variant': {
      const variant = item.variants.find(v => v.key === message.key)
      if (!variant) break
      const blob = new Blob([message.buffer], { type: FORMAT_INFO[variant.format].mime })
      Object.assign(variant, {
        status: 'done',
        width: message.width,
        height: message.height,
        bytes: blob.size,
        blob,
        url: URL.createObjectURL(blob),
      })
      break
    }
    case 'skipped': {
      const variant = item.variants.find(v => v.key === message.key)
      if (variant) variant.status = 'skipped'
      break
    }
    case 'done':
      item.status = 'done'
      current = null
      pump()
      break
    case 'error':
      failCurrent(message.message)
      break
  }
}

/** Whether an item has to be (re)compressed to match the given settings. */
function needsWork(item: ImageItem, key: string) {
  if (item.unsupported) return false
  return item.status === 'ready' || item.settingsKey !== key
}

/** Start compressing every image that is new or whose results don't match the current settings. */
function compress() {
  const settings = snapshotSettings()
  const key = settingsKeyOf(settings)
  runSettings = settings

  // The image in progress was started with older settings: cancel it so it is redone.
  if (current && findItem(current.itemId)?.settingsKey !== key) stopWorker()

  queue = []
  for (const item of items.value) {
    if (item.id === current?.itemId) continue
    if (needsWork(item, key) || item.status === 'queued') {
      item.status = 'queued'
      item.settingsKey = key
      queue.push(item.id)
    }
  }
  pump()
}

function addFiles(files: Iterable<File>) {
  for (const file of files) {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|avif|gif|bmp|hei[cf])$/i.test(file.name)) continue
    const item: ImageItem = {
      id: nextId++,
      file,
      name: file.name || 'pasted-image.png',
      bytes: file.size,
      previewUrl: URL.createObjectURL(file),
      status: 'ready',
      variants: [],
    }
    if (/\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/.test(file.type)) {
      item.status = 'error'
      item.unsupported = true
      item.error = 'HEIC photos (iPhone) aren\'t supported yet. Export as JPEG first.'
    }
    items.value.push(item)
  }
}

function removeItem(id: number) {
  const item = findItem(id)
  if (!item) return
  releaseVariants(item)
  URL.revokeObjectURL(item.previewUrl)
  items.value = items.value.filter(i => i.id !== id)
  queue = queue.filter(q => q !== id)
  if (current?.itemId === id) {
    stopWorker()
    pump()
  }
}

function clearAll() {
  stopWorker()
  queue = []
  for (const item of items.value) {
    releaseVariants(item)
    URL.revokeObjectURL(item.previewUrl)
  }
  items.value = []
}

export function useCompressor() {
  const settings = useSettings()
  const currentKey = computed(() => settingsKeyOf(snapshotSettingsOf(settings)))

  const finishedVariants = computed(() =>
    items.value.flatMap(item => item.variants.filter(v => v.status === 'done' && v.blob)),
  )
  const isBusy = computed(() => items.value.some(i => i.status === 'queued' || i.status === 'processing'))
  /** Images that clicking Compress would (re)process. */
  const pendingCount = computed(() => items.value.filter(i => needsWork(i, currentKey.value)).length)
  /** Some finished results were made with different settings than the ones now selected. */
  const isOutdated = computed(() =>
    items.value.some(i => (i.status === 'done' || i.status === 'error') && !i.unsupported && i.settingsKey !== undefined && i.settingsKey !== currentKey.value),
  )

  return { items, finishedVariants, isBusy, pendingCount, isOutdated, addFiles, compress, removeItem, clearAll }
}
