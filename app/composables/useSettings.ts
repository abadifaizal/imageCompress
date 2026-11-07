import type { CompressSettings } from '~/utils/compress-types'

// One shared settings object for the whole app (the site is client-only, so module state is safe).
const settings = reactive<CompressSettings>({
  formats: ['webp'],
  sizes: [ORIGINAL_SIZE],
  quality: 80,
  pngLevel: 2,
})

export function useSettings() {
  return settings
}

/**
 * A plain, normalised copy that can be sent to a Web Worker (reactive proxies can't be cloned).
 * Sorted so that the same choices made in a different order count as the same settings.
 */
export function snapshotSettingsOf(source: CompressSettings): CompressSettings {
  const formatOrder = FORMATS.map(f => f.id)
  return {
    formats: [...source.formats].sort((a, b) => formatOrder.indexOf(a) - formatOrder.indexOf(b)),
    sizes: [...source.sizes].sort((a, b) => (a === ORIGINAL_SIZE ? -1 : b === ORIGINAL_SIZE ? 1 : b - a)),
    quality: source.quality,
    pngLevel: source.pngLevel,
  }
}

export function snapshotSettings(): CompressSettings {
  return snapshotSettingsOf(settings)
}
