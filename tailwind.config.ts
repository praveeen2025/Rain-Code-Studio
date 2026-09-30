import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ide: {
          bg: 'var(--ide-bg)',
          sidebar: 'var(--ide-sidebar)',
          activitybar: 'var(--ide-activitybar)',
          surface: 'var(--ide-surface)',
          editor: 'var(--ide-editor)',
          border: 'var(--ide-border)',
          hover: 'var(--ide-hover)',
          active: 'var(--ide-active)',
          text: 'var(--ide-text)',
          'text-bright': 'var(--ide-text-bright)',
          muted: 'var(--ide-muted)',
          panel: 'var(--ide-panel)',
          statusbar: 'var(--ide-statusbar)',
          input: 'var(--ide-input)',
          'input-border': 'var(--ide-input-border)',
          'tab-active': 'var(--ide-tab-active)',
          'tab-inactive': 'var(--ide-tab-inactive)',
          'tab-active-text': 'var(--ide-tab-active-text)',
          'tab-inactive-text': 'var(--ide-tab-inactive-text)',
          highlight: 'var(--ide-highlight)',
          accent: 'var(--ide-accent)'
        },
        snap: {
          red: '#ff1443',
          crimson: '#e0113c',
          glow: 'rgba(255, 20, 67, 0.15)',
          blue: '#007acc'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        mono: ['Cascadia Code', 'Fira Code', 'Consolas', 'Courier New', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config
