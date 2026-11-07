<script setup lang="ts">
const emit = defineEmits<{ files: [files: File[]] }>()

const input = ref<HTMLInputElement>()
const dragging = ref(false)
let dragDepth = 0

function openPicker() {
  input.value?.click()
}

function onPick(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) emit('files', [...target.files])
  target.value = '' // allow picking the same file again
}

function onDragEnter() {
  dragDepth++
  dragging.value = true
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragging.value = false
}

function onDrop(event: DragEvent) {
  dragDepth = 0
  dragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length) emit('files', [...files])
}

// Paste anywhere on the page (Ctrl/⌘+V), unless the user is typing in a field.
function onPaste(event: ClipboardEvent) {
  if ((event.target as HTMLElement)?.closest('input, textarea')) return
  const files = [...(event.clipboardData?.files ?? [])]
  if (files.length) {
    event.preventDefault()
    emit('files', files)
  }
}

onMounted(() => window.addEventListener('paste', onPaste))
onBeforeUnmount(() => window.removeEventListener('paste', onPaste))
</script>

<template>
  <div
    class="dropzone"
    :class="{ dragging }"
    role="button"
    tabindex="0"
    aria-label="Add images: drop files here or press Enter to browse"
    @click="openPicker"
    @keydown.enter.prevent="openPicker"
    @keydown.space.prevent="openPicker"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4m0 0l-5 5m5-5l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    <p class="title">
      Drop images here, or <span class="link">click to browse</span>
    </p>
    <p class="hint">
      JPEG · PNG · WebP · AVIF · GIF — you can also paste with Ctrl/⌘+V
    </p>
    <input
      ref="input"
      type="file"
      accept="image/*"
      multiple
      hidden
      @change="onPick"
    >
  </div>
</template>

<style scoped>
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 36px 16px;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.dropzone:hover,
.dropzone.dragging {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.icon {
  width: 36px;
  height: 36px;
  margin-bottom: 6px;
  color: var(--accent);
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.link {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
