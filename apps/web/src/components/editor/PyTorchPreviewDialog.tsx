import { useMemo } from 'react';
import { Copy, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { generatePyTorchCode } from '@nnviz/nn-math';
import type { NetworkArchitecture } from '@nnviz/shared';
import { Button } from '@/components/ui/button';

interface PyTorchPreviewDialogProps {
  architecture: NetworkArchitecture | null;
  open: boolean;
  onClose: () => void;
}

export function PyTorchPreviewDialog({ architecture, open, onClose }: PyTorchPreviewDialogProps) {
  const code = useMemo(
    () => (architecture ? generatePyTorchCode(architecture) : ''),
    [architecture],
  );

  if (!open || !architecture) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    toast.success('PyTorch code copied');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${architecture.name.replace(/\s+/g, '_').toLowerCase()}.py`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Python file downloaded');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-sm font-semibold">PyTorch Preview</h2>
            <p className="text-xs text-muted-foreground">{architecture.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <pre className="flex-1 overflow-auto bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground">
          <code>{code}</code>
        </pre>

        <div className="flex gap-2 border-t border-border px-4 py-3">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
            Copy code
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Download .py
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
