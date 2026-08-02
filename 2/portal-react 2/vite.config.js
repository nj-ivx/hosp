import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set to your GitHub Pages repo path. This deploys to
// nj-ivx.github.io/hosp-react/, so base must match that repo name.
// If you ever rename the repo or move to a root user/org site
// (nj-ivx.github.io itself), update this to match.
export default defineConfig({
  plugins: [react()],
  base: '/hosp-react/',
})
