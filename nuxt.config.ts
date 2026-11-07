// https://nuxt.com/docs/api/configuration/nuxt-config
// GitHub Pages serves the site at https://<user>.github.io/<repo>/
const baseURL = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Everything runs in the browser; no server needed.
  ssr: false,

  css: ['~/assets/css/main.css'],

  app: {
    baseURL,
    head: {
      title: 'Image Compress',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Compress, resize and convert images entirely in your browser.' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: `${baseURL}favicon.ico` }],
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
