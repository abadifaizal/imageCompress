/// <reference lib="webworker" />
// Runs off the main thread: decode → resize → encode for every requested variant.
import resize from '@jsquash/resize'
import encodeJpeg from '@jsquash/jpeg/encode.js'
import encodeWebp from '@jsquash/webp/encode.js'
import optimisePng from '@jsquash/oxipng/optimise.js'
import {
  ORIGINAL_SIZE,
  variantKey,
  type CompressSettings,
  type OutputFormat,
  type WorkerRequest,
  type WorkerResponse,
} from '../utils/compress-types'

const ctx = self as unknown as DedicatedWorkerGlobalScope

function post(message: WorkerResponse, transfer: Transferable[] = []) {
  ctx.postMessage(message, transfer)
}

async function decode(file: File): Promise<ImageData> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  }
  catch {
    throw new Error('Your browser can\'t read this image format.')
  }
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create a drawing canvas.')
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  return context.getImageData(0, 0, canvas.width, canvas.height)
}

/** JPEG has no transparency, so blend transparent pixels onto white instead of letting them turn black. */
function flattenOnWhite(image: ImageData): ImageData {
  const src = image.data
  const out = new Uint8ClampedArray(src.length)
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3]! / 255
    out[i] = src[i]! * a + 255 * (1 - a)
    out[i + 1] = src[i + 1]! * a + 255 * (1 - a)
    out[i + 2] = src[i + 2]! * a + 255 * (1 - a)
    out[i + 3] = 255
  }
  return new ImageData(out, image.width, image.height)
}

async function encode(image: ImageData, format: OutputFormat, settings: CompressSettings): Promise<ArrayBuffer> {
  switch (format) {
    case 'jpeg':
      return encodeJpeg(flattenOnWhite(image), { quality: settings.quality, progressive: true })
    case 'webp':
      return encodeWebp(image, { quality: settings.quality })
    case 'png':
      return optimisePng(image, { level: settings.pngLevel })
  }
}

async function process({ jobId, file, settings }: WorkerRequest) {
  const source = await decode(file)
  post({ type: 'decoded', jobId, width: source.width, height: source.height })

  for (const size of settings.sizes) {
    // Never upscale: a max width at or above the source width adds nothing over "Original".
    if (size !== ORIGINAL_SIZE && size >= source.width) {
      for (const format of settings.formats) post({ type: 'skipped', jobId, key: variantKey(format, size) })
      continue
    }

    const image = size === ORIGINAL_SIZE
      ? source
      : await resize(source, {
          width: size,
          height: Math.max(1, Math.round((source.height * size) / source.width)),
          method: 'lanczos3',
          fitMethod: 'stretch',
          premultiply: true,
          linearRGB: true,
        })

    for (const format of settings.formats) {
      const buffer = await encode(image, format, settings)
      post({ type: 'variant', jobId, key: variantKey(format, size), width: image.width, height: image.height, buffer }, [buffer])
    }
  }

  post({ type: 'done', jobId })
}

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    await process(event.data)
  }
  catch (error) {
    post({
      type: 'error',
      jobId: event.data.jobId,
      message: error instanceof Error ? error.message : 'Something went wrong while compressing.',
    })
  }
}
