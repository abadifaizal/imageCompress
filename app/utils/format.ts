import { FORMAT_INFO, ORIGINAL_SIZE, type OutputFormat } from './compress-types'

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

/** Signed change from original to output, e.g. -86 means 86% smaller. */
export function percentChange(original: number, output: number): number {
  if (original === 0) return 0
  return Math.round(((output - original) / original) * 100)
}

export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}

export function outputFileName(sourceName: string, format: OutputFormat, size: number): string {
  const suffix = size === ORIGINAL_SIZE ? '' : `-${size}w`
  return `${baseName(sourceName)}${suffix}.${FORMAT_INFO[format].ext}`
}

export function sizeLabel(size: number): string {
  return size === ORIGINAL_SIZE ? 'Original' : `${size}px`
}
