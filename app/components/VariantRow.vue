<script setup lang="ts">
import type { Variant } from '~/composables/useCompressor'

const props = defineProps<{ variant: Variant, originalBytes: number }>()

const change = computed(() =>
  props.variant.bytes === undefined ? 0 : percentChange(props.originalBytes, props.variant.bytes),
)
</script>

<template>
  <li class="row" :class="variant.status">
    <span class="format">{{ FORMAT_INFO[variant.format].label }}</span>
    <span class="size">{{ sizeLabel(variant.size) }}</span>

    <template v-if="variant.status === 'done'">
      <span class="dims">{{ variant.width }} × {{ variant.height }}</span>
      <span class="bytes">{{ formatBytes(variant.bytes!) }}</span>
      <span
        class="change"
        :class="change < 0 ? 'smaller' : 'bigger'"
        :title="change >= 0 ? 'This output is not smaller than the original' : undefined"
      >
        {{ change < 0 ? '−' : '+' }}{{ Math.abs(change) }}%
      </span>
      <a
        class="btn download"
        :href="variant.url"
        :download="variant.fileName"
        :aria-label="`Download ${variant.fileName}`"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
    </template>

    <span v-else class="status">
      <span class="spinner" aria-hidden="true" />
      Compressing…
    </span>
  </li>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 52px 72px 1fr auto auto auto;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 4px 0;
  border-top: 1px solid var(--border);
  font-size: 14px;
}

.format {
  font-weight: 600;
}

.size,
.dims {
  color: var(--text-muted);
}

.dims {
  font-size: 13px;
}

.bytes {
  font-family: var(--mono);
  font-size: 13px;
  text-align: right;
}

.change {
  min-width: 48px;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}

.smaller {
  color: var(--good);
}

.bigger {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--warn-soft);
  color: var(--warn);
}

.download {
  padding: 6px 8px;
}

.download svg {
  width: 18px;
  height: 18px;
}

.status {
  grid-column: 3 / -1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 44px 1fr auto auto auto;
    gap: 8px;
  }

  .dims {
    display: none;
  }
}
</style>
