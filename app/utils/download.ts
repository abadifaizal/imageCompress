import { zipSync, type Zippable } from 'fflate'

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the browser time to start the download before releasing the memory.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Bundle files into a ZIP. Images are already compressed, so entries are stored without extra compression. */
export async function buildZip(entries: { name: string, blob: Blob }[]): Promise<Blob> {
  const files: Zippable = {}
  for (const entry of entries) {
    files[uniqueName(entry.name, files)] = [new Uint8Array(await entry.blob.arrayBuffer()), { level: 0 }]
  }
  const data = zipSync(files)
  return new Blob([data as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
}

function uniqueName(name: string, taken: Zippable): string {
  if (!(name in taken)) return name
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let n = 2
  while (`${stem} (${n})${ext}` in taken) n++
  return `${stem} (${n})${ext}`
}
