import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const color = (name: string) => `hsl(var(--${name}))`

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        sello: ['"Barlow Condensed"', 'Figtree', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: color('background'),
        foreground: color('foreground'),
        card: { DEFAULT: color('card'), foreground: color('card-foreground') },
        popover: { DEFAULT: color('popover'), foreground: color('popover-foreground') },
        primary: { DEFAULT: color('primary'), foreground: color('primary-foreground') },
        secondary: { DEFAULT: color('secondary'), foreground: color('secondary-foreground') },
        muted: { DEFAULT: color('muted'), foreground: color('muted-foreground') },
        accent: { DEFAULT: color('accent'), foreground: color('accent-foreground') },
        destructive: { DEFAULT: color('destructive'), foreground: color('destructive-foreground') },
        success: { DEFAULT: color('success'), foreground: color('success-foreground') },
        shell: { DEFAULT: color('shell'), foreground: color('shell-foreground') },
        border: color('border'),
        input: color('input'),
        ring: color('ring'),
      },
      keyframes: {
        'dato-cambia': {
          from: { transform: 'translateY(-6px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'sello-cae': {
          from: { transform: 'scale(1.4) rotate(-6deg)', opacity: '0' },
          to: { transform: 'scale(1) rotate(-6deg)', opacity: '1' },
        },
      },
      animation: {
        'sello-cae': 'sello-cae 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'dato-cambia': 'dato-cambia 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [animate],
} satisfies Config
