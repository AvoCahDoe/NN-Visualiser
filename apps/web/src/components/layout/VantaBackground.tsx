import { useEffect } from 'react';
import { VANTA_BACKGROUND } from '@/config/vantaBackground';
import { useTheme } from '@/context/ThemeContext';

function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function VantaBackground() {
  const { theme } = useTheme();

  useEffect(() => {
    let effect: { destroy: () => void } | undefined;
    let cancelled = false;
    const { effect: effectName, elementId, options, dark } = VANTA_BACKGROUND;
    const themeOptions =
      theme === 'dark'
        ? { color: dark.color, backgroundColor: dark.backgroundColor }
        : { color: options.color, backgroundColor: options.backgroundColor };

    void (async () => {
      for (const src of VANTA_BACKGROUND.scripts) {
        if (cancelled) return;
        await loadScript(src);
      }

      const init = window.VANTA?.[effectName];
      if (cancelled || !init) return;

      effect = init({
        el: `#${elementId}`,
        ...options,
        ...themeOptions,
      });
    })();

    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, [theme]);

  return (
    <div
      id={VANTA_BACKGROUND.elementId}
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden
    />
  );
}
