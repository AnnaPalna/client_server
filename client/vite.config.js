import { defineConfig } from 'vite'
import dns from 'dns'
import react from '@vitejs/plugin-react'
import macrosPlugin from 'vite-plugin-babel-macros'

dns.setDefaultResultOrder('verbatim')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [macrosPlugin(), react()],
  server: {
    host: 'localhost',
    port: 3000,
  },
})
