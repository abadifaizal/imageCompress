<script setup lang="ts">
import { LARGE_FILE_BYTES, type ImageItem } from '~/composables/useCompressor'

const props = defineProps<{ item: ImageItem }>()
defineEmits<{ remove: [] }>()

const visibleVariants = computed(() => props.item.variants.filter(v => v.status !== 'skipped'))
const skippedSizes = computed(() => [
  ...new Set(props.item.variants.filter(v => v.status === 'skipped').map(v => sizeLabel(v.size))),
])
</script>

<template>
  <article class="card">
    <header class="head">
      <img
        class="thumb"
        :src="item.previewUrl"
        alt=""
        loading="lazy"
        decoding="async"
      >
      <div class="info">
        <p class="name" :title="item.name">
          {{ item.name }}
        </p>
        <p class="meta">
          {{ formatBytes(item.bytes) }}
          <template v-if="item.width">
            · {{ item.width }} × {{ item.height }}
          </template>
          <span v-if="item.status === 'ready'"> · Ready to compress</span>
          <span v-else-if="item.status === 'queued'"> · Waiting…</span>
        </p>
        <p v-if="item.bytes > LARGE_FILE_BYTES && item.status !== 'error'" class="warning">
          Large file: this may be slow or fail on phones.
        </p>
      </div>
      <button
        type="button"
        class="remove"
        :aria-label="`Remove ${item.name}`"
        @click="$emit('remove')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </header>

    <p v-if="item.status === 'error'" class="error" role="alert">
      {{ item.error }}
    </p>

    <template v-else>
      <ul v-if="visibleVariants.length" class="variants">
        <VariantRow
          v-for="variant in visibleVariants"
          :key="variant.key"
          :variant="variant"
          :original-bytes="item.bytes"
        />
      </ul>
      <p v-if="skippedSizes.length" class="skipped">
        Skipped {{ skippedSizes.join(', ') }}: the image is only {{ item.width }}px wide and is never enlarged.
      </p>
    </template>
  </article>
</template>

<style scoped>
.card {
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 10px;
}

.thumb {
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  margin: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta,
.warning {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.warning {
  color: var(--warn);
}

.remove {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
}

.remove:hover {
  background: var(--surface-2);
  color: var(--text);
}

.remove svg {
  width: 18px;
  height: 18px;
}

.variants {
  margin: 0;
  padding: 0;
  list-style: none;
}

.skipped {
  margin: 0;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 13px;
}

.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 14px;
}
</style>
