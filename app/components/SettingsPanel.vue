<script setup lang="ts">
import { FORMATS, FORMAT_INFO, ORIGINAL_SIZE, PNG_EFFORTS, PRESET_SIZES, type OutputFormat } from '~/utils/compress-types'

const settings = useSettings()

const customSize = ref<number | ''>('')
const sizeOptions = computed(() => {
  const all = new Set([...PRESET_SIZES, ...settings.sizes])
  return [...all].sort((a, b) => (a === ORIGINAL_SIZE ? -1 : b === ORIGINAL_SIZE ? 1 : b - a))
})

const hasLossy = computed(() => settings.formats.some(f => FORMAT_INFO[f].lossy))
const hasPng = computed(() => settings.formats.includes('png'))

// At least one format and one size must stay selected.
function toggleFormat(format: OutputFormat) {
  const i = settings.formats.indexOf(format)
  if (i === -1) settings.formats.push(format)
  else if (settings.formats.length > 1) settings.formats.splice(i, 1)
}

function toggleSize(size: number) {
  const i = settings.sizes.indexOf(size)
  if (i === -1) settings.sizes.push(size)
  else if (settings.sizes.length > 1) settings.sizes.splice(i, 1)
}

function addCustomSize() {
  const value = Math.round(Number(customSize.value))
  if (!Number.isFinite(value) || value < 16 || value > 10000) return
  if (!settings.sizes.includes(value)) settings.sizes.push(value)
  customSize.value = ''
}
</script>

<template>
  <section class="panel" aria-labelledby="settings-title">
    <h2 id="settings-title">
      Settings
    </h2>

    <fieldset>
      <legend>Format</legend>
      <div class="chips">
        <button
          v-for="f in FORMATS"
          :key="f.id"
          type="button"
          class="chip"
          :aria-pressed="settings.formats.includes(f.id)"
          @click="toggleFormat(f.id)"
        >
          {{ f.label }}
        </button>
      </div>
    </fieldset>

    <fieldset>
      <legend>Sizes <span class="muted">(max width)</span></legend>
      <div class="chips">
        <button
          v-for="size in sizeOptions"
          :key="size"
          type="button"
          class="chip"
          :aria-pressed="settings.sizes.includes(size)"
          @click="toggleSize(size)"
        >
          {{ sizeLabel(size) }}
        </button>
      </div>
      <form class="custom" @submit.prevent="addCustomSize">
        <label class="sr-only" for="custom-size">Custom width in pixels</label>
        <input
          id="custom-size"
          v-model="customSize"
          type="number"
          inputmode="numeric"
          min="16"
          max="10000"
          placeholder="Custom width, e.g. 800"
        >
        <button type="submit" class="btn" :disabled="customSize === ''">
          Add
        </button>
      </form>
      <p class="help">
        Images are never enlarged. Aspect ratio is always kept.
      </p>
    </fieldset>

    <fieldset v-if="hasLossy">
      <legend>
        <label for="quality">Quality</label>
        <output for="quality" class="value">{{ settings.quality }}</output>
      </legend>
      <input
        id="quality"
        v-model.number="settings.quality"
        type="range"
        min="1"
        max="100"
        step="1"
        class="slider"
      >
      <div class="scale">
        <span>Smaller file</span><span>Sharper image</span>
      </div>
      <p class="help">
        Applies to JPEG and WebP. 75–85 is a good balance.
      </p>
    </fieldset>

    <fieldset v-if="hasPng">
      <legend>PNG compression</legend>
      <div class="segmented" role="radiogroup" aria-label="PNG compression effort">
        <button
          v-for="e in PNG_EFFORTS"
          :key="e.level"
          type="button"
          role="radio"
          :aria-checked="settings.pngLevel === e.level"
          @click="settings.pngLevel = e.level"
        >
          {{ e.label }}
        </button>
      </div>
      <p class="help">
        PNG is lossless: quality never drops. More effort gives smaller files but takes longer.
      </p>
    </fieldset>

    <p class="note">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      </svg>
      Metadata such as GPS location and camera info is removed from every output.
    </p>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

h2 {
  margin: 0;
  font-size: 16px;
}

fieldset {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

legend {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
}

.muted {
  color: var(--text-muted);
  font-weight: 400;
}

.value {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--accent);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.chip:hover {
  border-color: var(--accent);
}

.chip[aria-pressed='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.custom {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.custom input {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.slider {
  width: 100%;
  accent-color: var(--accent);
}

.scale {
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 12px;
}

.segmented {
  display: flex;
  padding: 3px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.segmented button {
  flex: 1;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
}

.segmented button[aria-checked='true'] {
  background: var(--surface);
  box-shadow: var(--shadow);
  color: var(--accent);
}

.help {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.note {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 12px;
}

.note svg {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--accent);
}
</style>
