# Image Compress

A free website for compressing, resizing and converting images, entirely in your browser.

**Your images never leave your device.** There is no server and no upload: all processing runs locally in the browser, and the results are downloaded straight to your computer.

> 🚧 This project is in early development. The features below are planned and being built.

## What it does

- **Compress** images to make files smaller, with a quality setting to balance size against sharpness.
- **Resize** one image to several sizes at once (for example 1920px, 1280px and 640px wide).
- **Convert** between formats: JPEG, PNG, WebP and AVIF.
- **Download** each result on its own, or all of them together as one ZIP file.

## Why it's private

Most online compressors upload your photos to their servers. This one doesn't. The site is just static files hosted on GitHub Pages. When you pick an image, your browser reads it, compresses it with WebAssembly codecs (the same ones Google's [Squoosh](https://squoosh.app) uses), and hands the file back to you. Nothing is sent anywhere or stored.

## Built with

- [Nuxt 4](https://nuxt.com) (Vue 3), running as a client-only static site
- [jSquash](https://github.com/jamsinclair/jSquash): MozJPEG, OxiPNG, WebP and AVIF encoders compiled to WebAssembly
- [fflate](https://github.com/101arrowz/fflate) for building ZIP files in the browser
- Hosted on [GitHub Pages](https://pages.github.com) and deployed with GitHub Actions

The site is served at `https://abadifaizal.github.io/imageCompress/`.
