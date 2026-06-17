/** Vanta globe — indigo/violet brand (hue 265), distinct from JuridOCR mauve. */
export const VANTA_BACKGROUND = {
  elementId: 'vanta-bg',
  effect: 'GLOBE',
  scripts: [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js',
    'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js',
  ],
  options: {
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x6366a8,
    size: 1.7,
    backgroundColor: 0xffffff,
  },
  dark: {
    color: 0x818cf8,
    backgroundColor: 0x12141c,
  },
} as const;
