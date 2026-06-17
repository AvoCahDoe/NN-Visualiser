/// <reference types="vite/client" />

interface VantaEffect {
  destroy: () => void;
}

type VantaInit = (options: Record<string, unknown>) => VantaEffect;

interface Window {
  VANTA?: Record<string, VantaInit>;
}
