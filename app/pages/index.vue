<script setup lang="ts">
const { items, finishedVariants, isBusy, pendingCount, isOutdated, addFiles, compress, removeItem, clearAll } = useCompressor()

const zipping = ref(false)

const compressLabel = computed(() => {
  if (pendingCount.value > 0) {
    const n = pendingCount.value
    return `Compress ${n} ${n === 1 ? 'image' : 'images'}`
  }
  if (isBusy.value) return 'Compressing…'
  return items.value.length ? 'Up to date' : 'Compress'
})

const compressHint = computed(() => {
  if (!items.value.length) return 'Add images, choose settings, then compress.'
  if (pendingCount.value > 0 && isBusy.value) return 'Settings changed: this restarts with the new settings.'
  return ''
})

const originalTotal = computed(() => items.value.reduce((sum, item) => sum + item.bytes, 0))
const outputTotal = computed(() => finishedVariants.value.reduce((sum, v) => sum + (v.bytes ?? 0), 0))

async function downloadAll() {
  const files = finishedVariants.value
  if (!files.length) return
  if (files.length === 1) {
    const [only] = files
    downloadBlob(only!.blob!, only!.fileName)
    return
  }
  zipping.value = true
  try {
    const zip = await buildZip(files.map(v => ({ name: v.fileName, blob: v.blob! })))
    downloadBlob(zip, 'compressed-images.zip')
  }
  finally {
    zipping.value = false
  }
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <main>
      <DropZone @files="addFiles" />

      <div class="layout">
        <aside class="settings">
          <SettingsPanel />
          <div class="compress">
            <button
              type="button"
              class="btn btn-primary btn-large"
              :disabled="pendingCount === 0"
              @click="compress"
            >
              <span v-if="isBusy && pendingCount === 0" class="spinner" aria-hidden="true" />
              {{ compressLabel }}
            </button>
            <p v-if="compressHint" class="compress-hint">
              {{ compressHint }}
            </p>
          </div>
        </aside>

        <section class="results" aria-labelledby="results-title">
          <div class="results-head">
            <h2 id="results-title">
              Results
              <span v-if="items.length" class="count">{{ items.length }} {{ items.length === 1 ? 'image' : 'images' }}</span>
            </h2>
          </div>

          <p v-if="isOutdated && !isBusy" class="outdated" role="status">
            Settings changed. Click <strong>Compress</strong> to update the results.
          </p>

          <p v-if="!items.length" class="empty">
            Add images above to start. Compressed files will appear here, ready to download.
          </p>

          <div v-else class="cards">
            <ResultCard
              v-for="item in items"
              :key="item.id"
              :item="item"
              @remove="removeItem(item.id)"
            />
          </div>

          <div v-if="items.length" class="actions">
            <p class="summary" aria-live="polite">
              <template v-if="isBusy">
                Compressing…
              </template>
              <template v-else-if="finishedVariants.length">
                {{ finishedVariants.length }} {{ finishedVariants.length === 1 ? 'file' : 'files' }} ·
                {{ formatBytes(originalTotal) }} in → {{ formatBytes(outputTotal) }} out
              </template>
            </p>
            <div class="buttons">
              <button type="button" class="btn" @click="clearAll">
                Clear all
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!finishedVariants.length || zipping"
                @click="downloadAll"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ zipping ? 'Preparing…' : finishedVariants.length > 1 ? 'Download all (ZIP)' : 'Download' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer class="footer">
      Your images are processed on your device and never uploaded.
      <a href="https://github.com/abadifaizal/imageCompress" target="_blank" rel="noopener">Source on GitHub</a>
    </footer>
  </div>
</template>

<style scoped>
.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px;
}

main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.layout {
  display: grid;
  gap: 20px;
  align-items: start;
}

@media (min-width: 880px) {
  .layout {
    grid-template-columns: 320px 1fr;
  }

  .settings {
    position: sticky;
    top: 16px;
  }
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-large {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
}

.compress-hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.outdated {
  margin: 0;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--warn-soft);
  color: var(--warn);
  font-size: 14px;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.results-head h2 {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  font-size: 16px;
}

.count {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
}

.empty {
  margin: 0;
  padding: 32px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-muted);
  text-align: center;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 -4px 16px rgb(0 0 0 / 6%);
}

.summary {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.buttons svg {
  width: 18px;
  height: 18px;
}

.footer {
  padding: 32px 0;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.footer a {
  color: var(--accent);
}
</style>
