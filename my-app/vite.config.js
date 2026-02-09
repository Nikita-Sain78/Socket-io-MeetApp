import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  // Source - https://stackoverflow.com/a/76819565
// Posted by 20BCS055_Ankur Mishra
// Retrieved 2026-02-03, License - CC BY-SA 4.0

define: {
global: {}},

})
