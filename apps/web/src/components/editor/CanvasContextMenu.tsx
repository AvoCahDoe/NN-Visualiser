import { useEffect, useRef } from 'react';
import {
  Copy,
  ClipboardPaste,
  LayoutGrid,
  Link2,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { LAYER_TYPE_LABELS, type LayerType } from '@nnviz/shared';
import { LAYER_ICONS } from '@/lib/layerIcons';
import { cn } from '@/lib/utils';

export type ContextMenuTarget = 'pane' | 'node';

export interface ContextMenuState {
  x: number;
  y: number;
  target: ContextMenuTarget;
  layerId?: string;
  flowX: number;
  flowY: number;
}

interface CanvasContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
  onAddLayer: (type: LayerType, position: { x: number; y: number }) => void;
  onCopy: () => void;
  onPaste: (position?: { x: number; y: number }) => void;
  onDelete: () => void;
  onConnect: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  canCopy: boolean;
  canPaste: boolean;
  canDelete: boolean;
}

const ADDABLE_LAYERS: LayerType[] = ['dense', 'conv2d', 'maxpool2d', 'flatten', 'dropout', 'output'];

export function CanvasContextMenu({
  menu,
  onClose,
  onAddLayer,
  onCopy,
  onPaste,
  onDelete,
  onConnect,
  onAutoLayout,
  onFitView,
  canCopy,
  canPaste,
  canDelete,
}: CanvasContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', onClose, true);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const Item = ({
    icon: Icon,
    label,
    onClick,
    disabled,
    destructive,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onClick();
        onClose();
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
        disabled && 'pointer-events-none opacity-40',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-accent',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {label}
    </button>
  );

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[200px] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-xl"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.target === 'node' && (
        <>
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Layer
          </div>
          <Item icon={Copy} label="Copy" onClick={onCopy} disabled={!canCopy} />
          <Item icon={ClipboardPaste} label="Paste" onClick={() => onPaste()} disabled={!canPaste} />
          <Item icon={Link2} label="Connect mode" onClick={onConnect} />
          <div className="my-1 h-px bg-border" />
          <Item icon={Trash2} label="Delete layer" onClick={onDelete} disabled={!canDelete} destructive />
        </>
      )}

      {menu.target === 'pane' && (
        <>
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Canvas
          </div>
          <Item icon={ClipboardPaste} label="Paste layer" onClick={() => onPaste({ x: menu.flowX, y: menu.flowY })} disabled={!canPaste} />
          <Item icon={LayoutGrid} label="Auto layout" onClick={onAutoLayout} />
          <Item icon={Maximize2} label="Fit view" onClick={onFitView} />
          <div className="my-1 h-px bg-border" />
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Add layer
          </div>
          {ADDABLE_LAYERS.map((type) => {
            const Icon = LAYER_ICONS[type];
            return (
              <Item
                key={type}
                icon={Icon}
                label={LAYER_TYPE_LABELS[type]}
                onClick={() => onAddLayer(type, { x: menu.flowX, y: menu.flowY })}
              />
            );
          })}
        </>
      )}
    </div>
  );
}
