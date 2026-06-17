import { useEffect } from 'react';
import { useNetworkStore } from '@/store/networkStore';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useEditorKeyboard() {
  const selectedLayerId = useNetworkStore((s) => s.selectedLayerId);
  const removeLayer = useNetworkStore((s) => s.removeLayer);
  const copySelectedLayer = useNetworkStore((s) => s.copySelectedLayer);
  const pasteLayer = useNetworkStore((s) => s.pasteLayer);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        e.preventDefault();
        removeLayer(selectedLayerId);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          if (!selectedLayerId) return;
          e.preventDefault();
          copySelectedLayer();
          return;
        }
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          pasteLayer();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedLayerId, removeLayer, copySelectedLayer, pasteLayer]);
}
