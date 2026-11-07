// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Everything runs in the browser; no server needed.
  ssr: false,

  app: {
    // GitHub Pages serves the site at https://<user>.github.io/<repo>/
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Image Compress',
      meta: [
        { name: 'description', content: 'Compress, resize and convert images entirely in your browser.' },
      ],
    },
  },

  nitro: {
    preset: 'github-pages',
  },

  vite: {
    // jSquash ships WebAssembly codecs; let Vite load the .wasm files as-is.
    optimizeDeps: {
      exclude: [
        '@jsquash/avif',
        '@jsquash/jpeg',
        '@jsquash/oxipng',
        '@jsquash/png',
        '@jsquash/resize',
        '@jsquash/webp',
      ],
    },
    worker: {
      format: 'es',
    },
  },
})
