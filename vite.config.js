import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages cannot send response headers, so the production build carries
// its policy in meta tags instead. Dev is left alone because Vite's HMR
// preamble relies on inline scripts.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ')

const securityMeta = {
  name: 'security-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head' },
  ],
}

// Relative base so the build works both on a domain root and under a
// sub-path such as GitHub Pages' /Arrow-Escape/.
export default defineConfig({
  base: './',
  plugins: [react(), securityMeta],
})
