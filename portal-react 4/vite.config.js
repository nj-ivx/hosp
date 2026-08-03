import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set to your GitHub Pages repo path. Your repo is named "hosp",
// so this deploys to nj-ivx.github.io/hosp/. If you rename the repo,
// update this to match.
export default defineConfig({
  plugins: [react()],
  base: '/hosp/',
})
