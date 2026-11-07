export type OutputFormat = 'jpeg' | 'webp' | 'png'

export interface FormatInfo {
  id: OutputFormat
  label: string
  ext: string
  mime: string
  /** Lossy formats use the quality slider; lossless ones use compression effort. */
  lossy: boolean
}

export const FORMATS: FormatInfo[] = [
  { id: 'jpeg', label: 'JPEG', ext: 'jpg', mime: 'image/jpeg', lossy: true },
  { id: 'webp', label: 'WebP', ext: 'webp', mime: 'image/webp', lossy: true },
  { id: 'png', label: 'PNG', ext: 'png', mime: 'image/png', lossy: false },
]

export const FORMAT_INFO = Object.fromEntries(FORMATS.map(f => [f.id, f])) as Record<OutputFormat, FormatInfo>

/** Size value meaning "keep the original dimensions". */
export const ORIGINAL_SIZE = 0

export const PRESET_SIZES = [ORIGINAL_SIZE, 1920, 1280, 640]

export const PNG_EFFORTS = [
  { level: 1, label: 'Fast' },
  { level: 2, label: 'Balanced' },
  { level: 4, label: 'Smallest' },
] as const

export interface CompressSettings {
  formats: OutputFormat[]
  /** Maximum output widths in px; ORIGINAL_SIZE keeps the source width. */
  sizes: number[]
  /** 0–100, used by lossy formats. */
  quality: number
  /** OxiPNG optimisation level, used by PNG. */
  pngLevel: number
}

export interface WorkerRequest {
  jobId: number
  file: File
  settings: CompressSettings
}

export type WorkerResponse =
  | { type: 'decoded', jobId: number, width: number, height: number }
  | { type: 'variant', jobId: number, key: string, width: number, height: number, buffer: ArrayBuffer }
  | { type: 'skipped', jobId: number, key: string }
  | { type: 'done', jobId: number }
  | { type: 'error', jobId: number, message: string }

export function variantKey(format: OutputFormat, size: number) {
  return `${size}-${format}`
}
